import { AtprotoDohHandleResolver } from '@atproto-labs/handle-resolver';
import { xrpc } from '$lib/atproto/client';
import { getPdsUrlForDid } from '$lib/atproto/service';
import { getCache, setCache } from '$lib/server/cache';
import { isDid } from './paths';

// The lens reads any repo on the network, not just the author's. Everything
// here is public, unauthenticated XRPC against the repo's own PDS.

const IDENTITY_TTL_MS = 60 * 60 * 1000;
const RECORDS_TTL_MS = 60 * 1000;

export type LensRecord = {
  uri: string;
  cid: string;
  value: Record<string, unknown>;
};

export type LensIdentity = {
  did: string;
  handle: string;
  handleIsCorrect: boolean;
  pds: string;
  collections: string[];
};

type DescribeRepoResponse = {
  handle: string;
  did: string;
  handleIsCorrect: boolean;
  collections: string[];
};

type ListRecordsResponse = {
  records: LensRecord[];
  cursor?: string;
};

const handleResolver = new AtprotoDohHandleResolver({
  dohEndpoint: 'https://cloudflare-dns.com/dns-query',
  fetch: (input, init) => globalThis.fetch(input, init)
});

async function resolveDid(actor: string) {
  if (isDid(actor)) return actor;
  const did = await handleResolver.resolve(actor.toLowerCase());
  if (!did) throw new Error(`Could not resolve handle ${actor}`);
  return did;
}

export async function resolveIdentity(actor: string): Promise<LensIdentity> {
  const cacheKey = `lens:identity:${actor.toLowerCase()}`;
  const cached = getCache<LensIdentity>(cacheKey);
  if (cached) return cached;

  const did = await resolveDid(actor);
  const pds = await getPdsUrlForDid(did);
  const described = await xrpc<DescribeRepoResponse>(pds, 'xrpc/com.atproto.repo.describeRepo', {
    repo: did
  });

  const identity: LensIdentity = {
    did,
    handle: described.handle,
    handleIsCorrect: described.handleIsCorrect,
    pds,
    collections: [...described.collections].sort()
  };
  setCache(cacheKey, identity, IDENTITY_TTL_MS);
  return identity;
}

export async function listRecords(
  pds: string,
  did: string,
  collection: string,
  options: { limit?: number; cursor?: string } = {}
): Promise<ListRecordsResponse> {
  const limit = options.limit ?? 50;
  const cacheKey = `lens:list:${did}:${collection}:${limit}:${options.cursor ?? ''}`;
  const cached = getCache<ListRecordsResponse>(cacheKey);
  if (cached) return cached;

  const response = await xrpc<ListRecordsResponse>(pds, 'xrpc/com.atproto.repo.listRecords', {
    repo: did,
    collection,
    limit,
    cursor: options.cursor
  });
  setCache(cacheKey, response, RECORDS_TTL_MS);
  return response;
}

// Every record in a collection, newest first. Bounded so a huge collection
// (a decade of likes) can't run away with the request.
export async function listAllRecords(
  pds: string,
  did: string,
  collection: string,
  maxPages = 5
): Promise<LensRecord[]> {
  const all: LensRecord[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const response = await listRecords(pds, did, collection, { limit: 100, cursor });
    all.push(...response.records);
    cursor = response.cursor;
    if (!cursor || response.records.length === 0) break;
  }
  return all;
}

export async function getRecord(
  pds: string,
  did: string,
  collection: string,
  rkey: string
): Promise<LensRecord | null> {
  const cacheKey = `lens:record:${did}:${collection}:${rkey}`;
  const cached = getCache<LensRecord>(cacheKey);
  if (cached) return cached;

  try {
    const record = await xrpc<LensRecord>(pds, 'xrpc/com.atproto.repo.getRecord', {
      repo: did,
      collection,
      rkey
    });
    setCache(cacheKey, record, RECORDS_TTL_MS);
    return record;
  } catch {
    return null;
  }
}

export async function getRecordByUri(uri: string): Promise<LensRecord | null> {
  const match = uri.match(/^at:\/\/([^/]+)\/([^/]+)\/([^/]+)$/);
  if (!match) return null;
  try {
    const did = await resolveDid(match[1]);
    const pds = await getPdsUrlForDid(did);
    return await getRecord(pds, did, match[2], match[3]);
  } catch {
    return null;
  }
}

export async function getProfile(pds: string, did: string) {
  const record = await getRecord(pds, did, 'app.bsky.actor.profile', 'self');
  const value = record?.value as
    | { displayName?: string; description?: string; avatar?: { ref?: { $link?: string } } }
    | undefined;
  const avatarCid = value?.avatar?.ref?.$link;
  return {
    displayName: value?.displayName,
    description: value?.description,
    avatarUrl: avatarCid ? blobUrl(pds, did, avatarCid) : undefined
  };
}

export function blobUrl(pds: string, did: string, cid: string) {
  return `${pds}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;
}
