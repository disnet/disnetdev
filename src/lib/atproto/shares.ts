import { AUTHOR_DID } from '$lib/config';
import { xrpc } from '$lib/atproto/client';
import { shareRecordSchema } from '$lib/atproto/schema';
import { getPdsUrlForDid } from '$lib/atproto/service';
import { getCache, setCache } from '$lib/server/cache';
import type { ShareSummary } from '$lib/types/blog';

const SHARES_COLLECTION = 'app.skyreader.social.share';
const SHARES_CACHE_KEY = 'shares:index';
const SHARES_TTL_MS = 5 * 60 * 1000;

type ListRecordsResponse = {
  records: Array<{
    uri: string;
    cid: string;
    value: unknown;
  }>;
  cursor?: string;
};

async function listShareRecords(): Promise<ShareSummary[]> {
  const cached = getCache<ShareSummary[]>(SHARES_CACHE_KEY);
  if (cached) return cached;

  if (!AUTHOR_DID) {
    setCache(SHARES_CACHE_KEY, [], SHARES_TTL_MS);
    return [];
  }

  const pdsUrl = await getPdsUrlForDid(AUTHOR_DID);
  const all: ShareSummary[] = [];
  let cursor: string | undefined;

  do {
    const response = await xrpc<ListRecordsResponse>(pdsUrl, 'xrpc/com.atproto.repo.listRecords', {
      repo: AUTHOR_DID,
      collection: SHARES_COLLECTION,
      limit: 100,
      cursor
    });

    for (const item of response.records) {
      const parsed = shareRecordSchema.safeParse(item.value);
      if (!parsed.success) continue;
      if (parsed.data.reshareOf) continue;

      const rkey = item.uri.split('/').at(-1) ?? '';
      all.push({
        rkey,
        uri: item.uri,
        itemUrl: parsed.data.itemUrl,
        itemTitle: parsed.data.itemTitle,
        itemAuthor: parsed.data.itemAuthor,
        itemDescription: parsed.data.itemDescription,
        itemImage: parsed.data.itemImage,
        itemPublishedAt: parsed.data.itemPublishedAt,
        feedUrl: parsed.data.feedUrl,
        note: parsed.data.note,
        tags: parsed.data.tags,
        createdAt: parsed.data.createdAt
      });
    }

    cursor = response.cursor;
  } while (cursor);

  all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  setCache(SHARES_CACHE_KEY, all, SHARES_TTL_MS);
  return all;
}

export async function listShares(): Promise<ShareSummary[]> {
  return listShareRecords();
}
