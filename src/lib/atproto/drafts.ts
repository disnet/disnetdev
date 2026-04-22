import { restoreOAuthAgent } from '$lib/atproto/auth';
import { AUTHOR_DID, DRAFT_COLLECTION_NSID } from '$lib/config';
import { draftRecordSchema } from '$lib/atproto/schema';
import { deleteCache, getCache, invalidateCache, setCache } from '$lib/server/cache';
import type { DraftRecord } from '$lib/types/blog';
import { getPdsUrlForDid } from './service';
import { xrpc } from './client';

const DRAFT_COLLECTION = DRAFT_COLLECTION_NSID;
const DRAFTS_CACHE_KEY = 'drafts:index';
const DRAFT_BY_RKEY_PREFIX = 'drafts:rkey:';
const DRAFTS_TTL_MS = 60 * 1000;

type ListRecordsResponse = {
  records: Array<{
    uri: string;
    cid: string;
    value: unknown;
  }>;
  cursor?: string;
};

type GetRecordResponse = {
  uri: string;
  cid: string;
  value: unknown;
};

type StoredDraft = {
  uri: string;
  rkey: string;
  record: DraftRecord;
};

function getDraftRepoDid() {
  if (!AUTHOR_DID) {
    throw new Error('AUTHOR_DID is not configured');
  }

  return AUTHOR_DID;
}

function getDraftCacheKey(rkey: string) {
  return `${DRAFT_BY_RKEY_PREFIX}${rkey}`;
}

function invalidateDraftCaches(rkey?: string) {
  deleteCache(DRAFTS_CACHE_KEY);
  invalidateCache(DRAFT_BY_RKEY_PREFIX);

  if (rkey) {
    deleteCache(getDraftCacheKey(rkey));
  }
}

async function listDraftRecords(): Promise<StoredDraft[]> {
  const cached = getCache<StoredDraft[]>(DRAFTS_CACHE_KEY);
  if (cached) return cached;

  const repoDid = getDraftRepoDid();
  const pdsUrl = await getPdsUrlForDid(repoDid);
  const all: StoredDraft[] = [];
  let cursor: string | undefined;

  do {
    const response = await xrpc<ListRecordsResponse>(pdsUrl, 'xrpc/com.atproto.repo.listRecords', {
      repo: repoDid,
      collection: DRAFT_COLLECTION,
      limit: 100,
      cursor
    });

    for (const item of response.records) {
      const record = draftRecordSchema.safeParse(item.value);
      if (!record.success) continue;

      all.push({
        uri: item.uri,
        rkey: item.uri.split('/').at(-1) ?? '',
        record: record.data
      });
    }

    cursor = response.cursor;
  } while (cursor);

  all.sort((a, b) => b.record.updatedAt.localeCompare(a.record.updatedAt));
  setCache(DRAFTS_CACHE_KEY, all, DRAFTS_TTL_MS);
  return all;
}

export async function listDrafts(): Promise<Array<{ rkey: string; record: DraftRecord }>> {
  const drafts = await listDraftRecords();
  return drafts.map(({ rkey, record }) => ({ rkey, record }));
}

export async function getDraft(rkey: string): Promise<{ uri: string; rkey: string; record: DraftRecord } | null> {
  const cacheKey = getDraftCacheKey(rkey);
  const cached = getCache<StoredDraft | null>(cacheKey);
  if (cached) return cached;

  const repoDid = getDraftRepoDid();
  const pdsUrl = await getPdsUrlForDid(repoDid);

  try {
    const response = await xrpc<GetRecordResponse>(pdsUrl, 'xrpc/com.atproto.repo.getRecord', {
      repo: repoDid,
      collection: DRAFT_COLLECTION,
      rkey
    });

    const record = draftRecordSchema.safeParse(response.value);
    if (!record.success) {
      setCache(cacheKey, null, DRAFTS_TTL_MS);
      return null;
    }

    const draft = {
      uri: response.uri,
      rkey,
      record: record.data
    };

    setCache(cacheKey, draft, DRAFTS_TTL_MS);
    return draft;
  } catch {
    setCache(cacheKey, null, DRAFTS_TTL_MS);
    return null;
  }
}

export async function createDraft(did: string, record: DraftRecord) {
  const agent = await restoreOAuthAgent(did);
  const created = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: DRAFT_COLLECTION,
    validate: false,
    record
  });

  invalidateDraftCaches();
  return created.data;
}

export async function updateDraft(did: string, rkey: string, record: DraftRecord) {
  const agent = await restoreOAuthAgent(did);
  const response = await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: DRAFT_COLLECTION,
    rkey,
    validate: false,
    record
  });

  invalidateDraftCaches(rkey);
  return response.data;
}

export async function deleteDraft(did: string, rkey: string) {
  const agent = await restoreOAuthAgent(did);
  await agent.com.atproto.repo.deleteRecord({
    repo: did,
    collection: DRAFT_COLLECTION,
    rkey
  });

  invalidateDraftCaches(rkey);
}
