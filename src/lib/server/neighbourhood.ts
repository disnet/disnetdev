import { AUTHOR_DID } from '$lib/config';
import { getPdsUrlForDid } from '$lib/atproto/service';
import { getCache, setCache } from '$lib/server/cache';
import { listAllRecords, type LensRecord } from '$lib/lens/repo';
import { parseAtUri } from '$lib/lens/paths';
import type { Neighbour } from '$lib/neighbourhood/house';

// Who lives on my street: people I follow and keep coming back to, read from
// my own likes, reposts and replies. Nothing here reads their repos; their
// names and the time they last posted come from the public Bluesky AppView,
// the same thing anyone sees on their profile.

const APPVIEW = 'https://public.api.bsky.app';
const NEIGHBOUR_COUNT = 12;
const TTL_MS = 10 * 60 * 1000;
const HALF_LIFE_DAYS = 120;

export type Street = {
  me: Neighbour;
  neighbours: Neighbour[];
  asOf: string;
};

type Profile = {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  description?: string;
};

type FeedItem = { post: { indexedAt?: string }; reason?: { indexedAt?: string } };

async function appview<T>(method: string, params: [string, string][]): Promise<T> {
  const url = new URL(`/xrpc/${method}`, APPVIEW);
  for (const [k, v] of params) url.searchParams.append(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${method} ${res.status}`);
  return (await res.json()) as T;
}

const didOf = (uri: unknown) => (typeof uri === 'string' ? parseAtUri(uri)?.repo : undefined);
const get = (value: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((v, k) => (v && typeof v === 'object' ? (v as Record<string, unknown>)[k] : undefined), value);

async function safeList(pds: string, collection: string, pages: number) {
  try {
    return await listAllRecords(pds, AUTHOR_DID, collection, pages);
  } catch {
    return [] as LensRecord[];
  }
}

async function lastActive(did: string, attempts = 2): Promise<string | undefined> {
  try {
    const { feed } = await appview<{ feed: FeedItem[] }>('app.bsky.feed.getAuthorFeed', [
      ['actor', did],
      ['limit', '1']
    ]);
    const item = feed[0];
    return item?.reason?.indexedAt ?? item?.post.indexedAt;
  } catch {
    return attempts > 1 ? lastActive(did, attempts - 1) : undefined;
  }
}

const toNeighbour = (p: Profile): Neighbour => ({
  did: p.did,
  handle: p.handle,
  name: p.displayName?.trim() || p.handle,
  avatar: p.avatar,
  bio: p.description?.split('\n').find((line) => line.trim())?.trim()
});

export async function loadStreet(): Promise<Street | null> {
  if (!AUTHOR_DID) return null;
  const cached = getCache<Street>('neighbourhood:street');
  if (cached) return cached;

  const pds = await getPdsUrlForDid(AUTHOR_DID);
  const [follows, likes, reposts, posts] = await Promise.all([
    safeList(pds, 'app.bsky.graph.follow', 10),
    safeList(pds, 'app.bsky.feed.like', 4),
    safeList(pds, 'app.bsky.feed.repost', 2),
    safeList(pds, 'app.bsky.feed.post', 3)
  ]);

  const followed = new Set(follows.map((f) => f.value.subject).filter((s) => typeof s === 'string'));

  // Closeness: a reply or quote counts for more than a repost, a repost for
  // more than a like, and everything fades with a half-life of a few months.
  const score = new Map<string, number>();
  const now = Date.now();
  const add = (did: string | undefined, weight: number, createdAt: unknown) => {
    if (!did || did === AUTHOR_DID || !followed.has(did)) return;
    const at = Date.parse(String(createdAt ?? ''));
    const days = Number.isFinite(at) ? (now - at) / 86_400_000 : 365;
    score.set(did, (score.get(did) ?? 0) + weight * 0.5 ** (days / HALF_LIFE_DAYS));
  };
  for (const r of likes) add(didOf(get(r.value, 'subject.uri')), 1, r.value.createdAt);
  for (const r of reposts) add(didOf(get(r.value, 'subject.uri')), 2, r.value.createdAt);
  for (const r of posts) {
    add(didOf(get(r.value, 'reply.parent.uri')), 3, r.value.createdAt);
    add(didOf(get(r.value, 'embed.record.uri') ?? get(r.value, 'embed.record.record.uri')), 3, r.value.createdAt);
  }

  const closest = [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, NEIGHBOUR_COUNT)
    .map(([did]) => did);

  const { profiles } = await appview<{ profiles: Profile[] }>('app.bsky.actor.getProfiles', [
    ...[AUTHOR_DID, ...closest].map((did): [string, string] => ['actors', did])
  ]);
  const byDid = new Map(profiles.map((p) => [p.did, p]));
  const meProfile = byDid.get(AUTHOR_DID);
  if (!meProfile) return null;

  const neighbours = closest
    .map((did) => byDid.get(did))
    .filter((p): p is Profile => Boolean(p))
    .map(toNeighbour);

  const times = await Promise.all([AUTHOR_DID, ...neighbours.map((n) => n.did)].map(lastActive));
  // My lights count likes too; I like far more often than I post.
  const myLatest = [times[0], likes[0]?.value.createdAt]
    .filter((t): t is string => typeof t === 'string')
    .sort()
    .at(-1);
  const me = { ...toNeighbour(meProfile), lastActive: myLatest };
  neighbours.forEach((n, i) => (n.lastActive = times[i + 1]));

  const street: Street = { me, neighbours, asOf: new Date().toISOString() };
  setCache('neighbourhood:street', street, TTL_MS);
  return street;
}
