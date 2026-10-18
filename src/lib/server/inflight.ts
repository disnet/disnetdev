import { AUTHOR_DID } from '$lib/config';
import { getPdsUrlForDid } from '$lib/atproto/service';
import { listPublishedDocuments } from '$lib/atproto/documents';
import { listReadingEntries } from '$lib/atproto/reading';
import { listCards } from '$lib/atproto/library';
import { listPhotoPosts } from '$lib/atproto/photos';
import { lensHrefForUri, parseAtUri } from '$lib/lens/paths';
import { getRecordByUri, listAllRecords, resolveIdentity, type LensRecord } from '$lib/lens/repo';

// The front page reads the author's repo for work that is still moving: atplan
// goals, Radial goals and the agent PRs that close them. Everything that has
// finished (posts, shares, merged work) lands in one log underneath.

export type Flight = {
  uri: string;
  title: string;
  detail?: string;
  where: string;
  status: string;
  at: string;
  href: string;
  via?: string;
  image?: string;
};

export type Horizon = {
  name: string;
  href: string;
  summary?: string;
  counts: { label: string; n: number }[];
  done: number;
  total: number;
};

export type InFlight = {
  underway: Flight[];
  horizon: Horizon[];
  landed: Flight[];
  asOf: string;
  pdsHost: string;
};

const UNDERWAY_RADIAL_LIMIT = 6;
// Per kind of landing, so a busy week of filing cards doesn't bury the posts.
const LANDED_PER_STATUS = 3;
const MERGED_PR_LIMIT = 4;

type AtplanGoal = {
  title?: string;
  summary?: string;
  status?: string;
  plan?: string;
  createdAt?: string;
  updatedAt?: string;
  via?: { tool?: string };
};
type AtplanPlan = { title?: string; summary?: string };
type RadialGoal = { title?: string; body?: string; project?: { uri?: string }; createdAt?: string };
type RadialClose = { goal?: { uri?: string }; disposition?: string; closed?: boolean; createdAt?: string };
type RadialLabel = { goal?: { uri?: string }; labels?: string[]; createdAt?: string };
type PullStatus = { pull?: string; status?: string; createdAt?: string };

const values = <T>(records: LensRecord[]) =>
  records.map((r) => ({ uri: r.uri, value: r.value as T }));

const newestFirst = (a: { at: string }, b: { at: string }) => b.at.localeCompare(a.at);

function lensOf(uri: string) {
  return lensHrefForUri(uri) ?? '/';
}

async function safeList(pds: string, did: string, collection: string) {
  try {
    return await listAllRecords(pds, did, collection);
  } catch {
    return [];
  }
}

async function loadAtplan(pds: string, did: string) {
  const [goals, plans] = await Promise.all([
    safeList(pds, did, 'com.disnetdev.atplan.goal'),
    safeList(pds, did, 'com.disnetdev.atplan.plan')
  ]);

  const planByUri = new Map(values<AtplanPlan>(plans).map((p) => [p.uri, p]));
  const goalList = values<AtplanGoal>(goals);

  const toFlight = ({ uri, value }: { uri: string; value: AtplanGoal }): Flight => ({
    uri,
    title: value.title ?? 'untitled goal',
    detail: value.summary,
    where: planByUri.get(value.plan ?? '')?.value.title ?? 'atplan',
    status: value.status ?? 'proposed',
    at: value.updatedAt ?? value.createdAt ?? '',
    href: lensOf(uri),
    via: value.via?.tool
  });

  const horizon: Horizon[] = [...planByUri.values()].map((plan) => {
    const mine = goalList.filter((g) => g.value.plan === plan.uri);
    const count = (status: string) => mine.filter((g) => g.value.status === status).length;
    return {
      name: plan.value.title ?? 'plan',
      href: lensOf(plan.uri),
      summary: plan.value.summary,
      counts: [
        { label: 'active', n: count('active') },
        { label: 'proposed', n: count('proposed') }
      ],
      done: count('done'),
      total: mine.filter((g) => g.value.status !== 'dropped').length
    };
  });

  return {
    underway: goalList.filter((g) => g.value.status === 'active').map(toFlight),
    landed: goalList.filter((g) => g.value.status === 'done').map(toFlight),
    horizon
  };
}

async function loadRadial(pds: string, did: string) {
  const [goals, closes, labels, projects, statuses] = await Promise.all([
    safeList(pds, did, 'com.disnetdev.radial.goal'),
    safeList(pds, did, 'com.disnetdev.radial.closeGoal'),
    safeList(pds, did, 'com.disnetdev.radial.labelGoal'),
    safeList(pds, did, 'com.disnetdev.radial.project'),
    safeList(pds, did, 'sh.tangled.repo.pull.status')
  ]);

  const projectName = new Map(
    projects.map((p) => [p.uri, (p.value as { name?: string }).name ?? 'project'])
  );

  // Closes and labels are ops on the goal; the newest one wins.
  const closed = new Map<string, RadialClose>();
  for (const { value } of values<RadialClose>(closes).sort((a, b) =>
    (a.value.createdAt ?? '').localeCompare(b.value.createdAt ?? '')
  )) {
    if (value.goal?.uri) closed.set(value.goal.uri, value);
  }
  const labelOf = new Map<string, string[]>();
  for (const { value } of values<RadialLabel>(labels).sort((a, b) =>
    (a.value.createdAt ?? '').localeCompare(b.value.createdAt ?? '')
  )) {
    if (value.goal?.uri) labelOf.set(value.goal.uri, value.labels ?? []);
  }

  const goalList = values<RadialGoal>(goals);
  const isOpen = (uri: string) => closed.get(uri)?.closed !== true;
  const where = (g: RadialGoal) => `Radial · ${projectName.get(g.project?.uri ?? '') ?? 'project'}`;

  const underway: Flight[] = goalList
    .filter((g) => isOpen(g.uri) && labelOf.get(g.uri)?.includes('next'))
    .map(({ uri, value }) => ({
      uri,
      title: value.title ?? 'untitled goal',
      detail: value.body || undefined,
      where: where(value),
      status: 'next',
      at: value.createdAt ?? '',
      href: lensOf(uri)
    }))
    .sort(newestFirst)
    .slice(0, UNDERWAY_RADIAL_LIMIT);

  const landed: Flight[] = goalList
    .filter((g) => closed.get(g.uri)?.disposition === 'completed')
    .map(({ uri, value }) => ({
      uri,
      title: value.title ?? 'untitled goal',
      where: where(value),
      status: 'completed',
      at: closed.get(uri)?.createdAt ?? value.createdAt ?? '',
      href: lensOf(uri)
    }));

  const horizon: Horizon[] = [...projectName.entries()].map(([projectUri, name]) => {
    const mine = goalList.filter((g) => g.value.project?.uri === projectUri);
    const open = mine.filter((g) => isOpen(g.uri));
    const labelled = (label: string) =>
      open.filter((g) => labelOf.get(g.uri)?.includes(label)).length;
    return {
      name: `Radial · ${name}`,
      href: lensOf(projectUri),
      counts: [
        { label: 'next', n: labelled('next') },
        { label: 'soon', n: labelled('soon') },
        { label: 'later', n: labelled('later') }
      ],
      done: mine.length - open.length,
      total: mine.length
    };
  });

  // Merged PRs live in whoever opened them — often an agent's own repo — so
  // fetch the handful we show.
  const merged = values<PullStatus>(statuses)
    .filter((s) => s.value.status?.endsWith('.merged') && s.value.pull)
    .sort((a, b) => (b.value.createdAt ?? '').localeCompare(a.value.createdAt ?? ''))
    .slice(0, MERGED_PR_LIMIT);

  const mergedFlights = await Promise.all(
    merged.map(async ({ value }): Promise<Flight | null> => {
      const pullUri = value.pull!;
      const record = await getRecordByUri(pullUri);
      const author = parseAtUri(pullUri)?.repo;
      const authorHandle = author
        ? await resolveIdentity(author).then((i) => i.handle).catch(() => undefined)
        : undefined;
      const title = (record?.value as { title?: string } | undefined)?.title;
      if (!title) return null;
      return {
        uri: pullUri,
        title,
        where: 'Tangled',
        status: 'merged',
        at: value.createdAt ?? '',
        href: lensOf(pullUri),
        via: authorHandle && authorHandle !== 'handle.invalid' ? `@${authorHandle}` : undefined
      };
    })
  );

  return {
    underway,
    landed: [...landed, ...mergedFlights.filter((f): f is Flight => f !== null)],
    horizon: horizon.filter((h) => h.total > 0)
  };
}

async function loadWriting(): Promise<Flight[]> {
  const [posts, reading, cards, photos] = await Promise.all([
    listPublishedDocuments().catch(() => []),
    listReadingEntries().catch(() => []),
    listCards().catch(() => []),
    listPhotoPosts(3).catch(() => [])
  ]);

  return [
    ...posts.slice(0, 5).map((post) => ({
      uri: post.uri,
      title: post.title,
      detail: post.description,
      where: 'disnetdev',
      status: 'published',
      at: post.publishedAt,
      href: post.path
    })),
    ...reading.slice(0, 6).map((entry) =>
      entry.kind === 'share'
        ? {
            uri: entry.share.uri,
            title: entry.share.itemTitle || entry.share.itemUrl,
            detail: entry.share.note,
            where: 'Skyreader',
            status: 'shared',
            at: entry.sortedAt,
            href: entry.share.itemUrl
          }
        : {
            uri: entry.post.uri,
            title: entry.post.title,
            where: 'Skyreader',
            status: 'shared',
            at: entry.sortedAt,
            href: entry.post.path
          }
    ),
    ...cards.slice(0, 5).map((card) => ({
      uri: card.uri,
      title: card.title || card.url,
      where: 'Semble',
      status: 'filed',
      at: card.createdAt,
      href: card.url
    })),
    ...photos.map((photo) => ({
      uri: photo.uri,
      title: photo.text || 'a photo',
      where: 'photos',
      status: 'photographed',
      at: photo.createdAt,
      href: photo.url,
      image: photo.images[0]?.thumb
    }))
  ];
}

function capPerStatus(flights: Flight[]) {
  const counts = new Map<string, number>();
  return flights.filter((f) => {
    const n = (counts.get(f.status) ?? 0) + 1;
    counts.set(f.status, n);
    return n <= LANDED_PER_STATUS;
  });
}

export async function loadInFlight(): Promise<InFlight> {
  const asOf = new Date().toISOString();
  if (!AUTHOR_DID) return { underway: [], horizon: [], landed: [], asOf, pdsHost: '' };

  const pds = await getPdsUrlForDid(AUTHOR_DID);
  const [atplan, radial, writing, handle] = await Promise.all([
    loadAtplan(pds, AUTHOR_DID),
    loadRadial(pds, AUTHOR_DID),
    loadWriting(),
    resolveIdentity(AUTHOR_DID).then((i) => i.handle).catch(() => AUTHOR_DID)
  ]);

  // Lens links come out keyed by DID; the handle reads better in the address bar.
  const didPrefix = `/@${AUTHOR_DID}`;
  const byHandle = <T extends { href: string }>(item: T): T =>
    item.href.startsWith(didPrefix)
      ? { ...item, href: `/@${handle}${item.href.slice(didPrefix.length)}` }
      : item;

  return {
    underway: [...atplan.underway.sort(newestFirst), ...radial.underway].map(byHandle),
    horizon: [...atplan.horizon, ...radial.horizon].map(byHandle),
    landed: capPerStatus(
      [...atplan.landed, ...radial.landed, ...writing].filter((f) => f.at).sort(newestFirst)
    ).map(byHandle),
    asOf,
    pdsHost: new URL(pds).host
  };
}
