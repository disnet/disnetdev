import { AUTHOR_DID } from '$lib/config';
import { getPdsUrlForDid } from '$lib/atproto/service';
import { listPublishedDocuments } from '$lib/atproto/documents';
import { getCache, setCache } from '$lib/server/cache';
import { appForHome } from '$lib/lens/apps';
import { lensHref } from '$lib/lens/paths';
import type { Ledger, LedgerEntry, LedgerKind } from '$lib/ledger';
import { getRecordByUri, listAllRecords, resolveIdentity, type LensRecord } from '$lib/lens/repo';

// Made in public: a dated ledger of the work, read from the records the work
// leaves in my repo. atplan goals and their notes, Radial goals, merged agent
// PRs on Tangled, new repos and boards, and published posts.

const TTL_MS = 5 * 60 * 1000;
const WINDOW_DAYS = 120;
const MERGED_PR_LIMIT = 24;

type AtplanGoal = { title?: string; status?: string; plan?: string; createdAt?: string; updatedAt?: string };
type AtplanNote = { body?: string; subject?: string; links?: { uri: string; title?: string; kind?: string }[]; createdAt?: string };
type RadialGoal = { title?: string; project?: { uri?: string } };
type RadialClose = { goal?: { uri?: string }; disposition?: string; createdAt?: string };
type PullStatus = { pull?: string; status?: string; createdAt?: string };
type TangledRepo = { name?: string; description?: string; website?: string; repoDid?: string; createdAt?: string };

const v = <T>(r: LensRecord) => r.value as T;

async function safeList(pds: string, collection: string, pages = 3) {
  try {
    return await listAllRecords(pds, AUTHOR_DID, collection, pages);
  } catch {
    return [] as LensRecord[];
  }
}

// "Skyreader: power readers and a durable paid tier" files under Skyreader.
const projectOf = (title: string | undefined) => capitalise((title ?? 'atplan').split(':')[0].trim());

// Project names come from several apps with their own casing ("radial",
// "Radial"); file them together. atplan keeps its lowercase name.
function capitalise(name: string) {
  return name === 'atplan' ? name : name.charAt(0).toUpperCase() + name.slice(1);
}

// The first sentence of a note, without its markdown.
function firstSentence(body: string | undefined) {
  if (!body) return '';
  const plain = body
    .replace(/[#*_`>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Raw record URIs mean nothing to a reader.
    .replace(/\s*\(?at:\/\/\S+\)?/g, '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('-'));
  if (!plain) return '';
  const end = plain.search(/[.!?](\s|$)/);
  const sentence = end > 0 ? plain.slice(0, end + 1) : plain;
  return sentence.length > 180 ? `${sentence.slice(0, 179)}…` : sentence;
}

function weekStart(iso: string) {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export async function loadLedger(): Promise<Ledger | null> {
  if (!AUTHOR_DID) return null;
  const cached = getCache<Ledger>('ledger');
  if (cached) return cached;

  const pds = await getPdsUrlForDid(AUTHOR_DID);
  const identity = await resolveIdentity(AUTHOR_DID);
  const repo = identity.handle || AUTHOR_DID;
  const lens = (uri: string) => {
    const [, , , collection, rkey] = uri.split('/');
    return lensHref(repo, collection, rkey);
  };

  const [goals, plans, notes, radialGoals, closes, projects, statuses, repos, posts] = await Promise.all([
    safeList(pds, 'com.disnetdev.atplan.goal'),
    safeList(pds, 'com.disnetdev.atplan.plan'),
    safeList(pds, 'com.disnetdev.atplan.note'),
    safeList(pds, 'com.disnetdev.radial.goal', 5),
    safeList(pds, 'com.disnetdev.radial.closeGoal'),
    safeList(pds, 'com.disnetdev.radial.project'),
    safeList(pds, 'sh.tangled.repo.pull.status'),
    safeList(pds, 'sh.tangled.repo'),
    listPublishedDocuments().catch(() => [])
  ]);

  const entries: LedgerEntry[] = [];

  // atplan
  const planTitle = new Map(plans.map((p) => [p.uri, (p.value as { title?: string }).title]));
  const goalByUri = new Map(goals.map((g) => [g.uri, v<AtplanGoal>(g)]));
  for (const g of goals) {
    const goal = v<AtplanGoal>(g);
    const project = projectOf(planTitle.get(goal.plan ?? ''));
    if (goal.status === 'done' || goal.status === 'active') {
      entries.push({
        id: g.uri,
        at: goal.updatedAt ?? goal.createdAt ?? '',
        kind: goal.status === 'done' ? 'finished' : 'started',
        project,
        title: goal.title ?? 'a goal',
        href: lens(g.uri)
      });
    }
  }
  for (const n of notes) {
    const note = v<AtplanNote>(n);
    const goal = goalByUri.get(note.subject ?? '');
    entries.push({
      id: n.uri,
      at: note.createdAt ?? '',
      kind: 'noted',
      project: projectOf(planTitle.get(goal?.plan ?? '')),
      title: goal?.title ?? 'a goal',
      detail: firstSentence(note.body),
      href: lens(n.uri),
      links: (note.links ?? [])
        .filter((l) => l.kind === 'pr' && /^https:\/\//.test(l.uri))
        .map((l) => ({ title: l.title ?? 'PR', uri: l.uri }))
    });
  }

  // Radial
  const projectName = new Map(projects.map((p) => [p.uri, (p.value as { name?: string }).name ?? 'Radial']));
  const radialGoal = new Map(radialGoals.map((g) => [g.uri, v<RadialGoal>(g)]));
  for (const c of closes) {
    const close = v<RadialClose>(c);
    const goal = radialGoal.get(close.goal?.uri ?? '');
    if (close.disposition !== 'completed' || !goal?.title) continue;
    entries.push({
      id: c.uri,
      at: close.createdAt ?? '',
      kind: 'finished',
      project: capitalise(projectName.get(goal.project?.uri ?? '') ?? 'Radial'),
      title: goal.title,
      href: lens(close.goal!.uri!)
    });
  }

  // Tangled: new repos, and agent PRs merged into them. The PR lives in the
  // agent's repo; the merge record is mine, so that's where the link goes.
  const repoName = new Map<string, string>();
  for (const r of repos) {
    const repoValue = v<TangledRepo>(r);
    const name = repoValue.name ?? appForHome(repoValue.website) ?? repoValue.description?.split(/[.,]/)[0];
    if (repoValue.repoDid && name) repoName.set(repoValue.repoDid, name);
    if (repoValue.name || repoValue.description) {
      entries.push({
        id: r.uri,
        at: repoValue.createdAt ?? '',
        kind: 'opened',
        project: 'Tangled',
        title: repoValue.name ?? name ?? 'a repo',
        detail: repoValue.description,
        href: lens(r.uri)
      });
    }
  }
  const merged = statuses
    .map((s) => ({ uri: s.uri, value: v<PullStatus>(s) }))
    .filter((s) => s.value.status?.endsWith('.merged') && s.value.pull)
    .sort((a, b) => (b.value.createdAt ?? '').localeCompare(a.value.createdAt ?? ''))
    .slice(0, MERGED_PR_LIMIT);
  const pulls = await Promise.all(merged.map((m) => getRecordByUri(m.value.pull!).catch(() => null)));
  merged.forEach((m, i) => {
    const pull = pulls[i]?.value as { title?: string; target?: { repo?: string; repoDid?: string } } | undefined;
    if (!pull?.title) return;
    entries.push({
      id: m.uri,
      at: m.value.createdAt ?? '',
      kind: 'merged',
      project: capitalise(repoName.get(pull.target?.repoDid ?? pull.target?.repo ?? '') ?? 'Tangled'),
      title: pull.title,
      href: lens(m.uri)
    });
  });

  // Writing
  for (const post of posts) {
    entries.push({
      id: post.uri,
      at: post.publishedAt,
      kind: 'published',
      project: 'disnetdev',
      title: post.title,
      detail: post.description,
      href: post.path
    });
  }

  const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
  const recent = entries.filter((e) => e.at && e.at >= since).sort((a, b) => b.at.localeCompare(a.at));

  const weeks = new Map<string, LedgerEntry[]>();
  const folded = new Map<string, LedgerEntry>();
  for (const e of recent) {
    const key = weekStart(e.at);
    // Agents leave several notes a week on the same goal; keep the newest
    // and count the rest, with every PR they mention.
    if (e.kind === 'noted') {
      const fold = folded.get(`${key}|${e.title}`);
      if (fold) {
        fold.count = (fold.count ?? 1) + 1;
        const seen = new Set(fold.links?.map((l) => l.uri));
        fold.links = [...(fold.links ?? []), ...(e.links ?? []).filter((l) => !seen.has(l.uri))];
        continue;
      }
      folded.set(`${key}|${e.title}`, e);
    }
    weeks.set(key, [...(weeks.get(key) ?? []), e]);
  }
  const projectCounts = new Map<string, number>();
  for (const list of weeks.values())
    for (const e of list) projectCounts.set(e.project, (projectCounts.get(e.project) ?? 0) + 1);

  const ledger: Ledger = {
    weeks: [...weeks.entries()].map(([start, list]) => {
      const tally = new Map<LedgerKind, number>();
      for (const e of list) tally.set(e.kind, (tally.get(e.kind) ?? 0) + (e.count ?? 1));
      return { start, entries: list, tally: [...tally.entries()].map(([kind, n]) => ({ kind, n })) };
    }),
    projects: [...projectCounts.entries()].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n),
    total: [...weeks.values()].reduce((n, list) => n + list.length, 0),
    since
  };
  setCache('ledger', ledger, TTL_MS);
  return ledger;
}
