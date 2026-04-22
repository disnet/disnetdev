import { PUBLICATION_AT_URI, SITE_DESCRIPTION, SITE_NAME, getSiteUrl } from '$lib/config';
import { parseAtUri, xrpc } from '$lib/atproto/client';
import { publicationRecordSchema } from '$lib/atproto/schema';
import { getPdsUrlForDid } from '$lib/atproto/service';
import { getCache, setCache } from '$lib/server/cache';
import type { PublicationRecord } from '$lib/types/blog';

const PUBLICATION_CACHE_KEY = 'publication:main';
const PUBLICATION_TTL_MS = 5 * 60 * 1000;

type GetRecordResponse = {
  uri: string;
  cid: string;
  value: unknown;
};

export async function getPublication(): Promise<{ uri: string; record: PublicationRecord }> {
  const cached = getCache<{ uri: string; record: PublicationRecord }>(PUBLICATION_CACHE_KEY);
  if (cached) return cached;

  if (!PUBLICATION_AT_URI) {
    const fallback = {
      uri: '',
      record: {
        $type: 'site.standard.publication',
        url: getSiteUrl(),
        name: SITE_NAME,
        description: SITE_DESCRIPTION
      } satisfies PublicationRecord
    };

    setCache(PUBLICATION_CACHE_KEY, fallback, PUBLICATION_TTL_MS);
    return fallback;
  }

  const { repo, collection, rkey } = parseAtUri(PUBLICATION_AT_URI);
  const pdsUrl = await getPdsUrlForDid(repo);
  const response = await xrpc<GetRecordResponse>(pdsUrl, 'xrpc/com.atproto.repo.getRecord', {
    repo,
    collection,
    rkey
  });

  const publication = {
    uri: response.uri,
    record: publicationRecordSchema.parse(response.value)
  };

  setCache(PUBLICATION_CACHE_KEY, publication, PUBLICATION_TTL_MS);
  return publication;
}
