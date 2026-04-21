import { getCache, setCache } from '$lib/server/cache';
import { resolvePdsUrlFromDid } from './did';

const PDS_CACHE_PREFIX = 'pds:';
const PDS_TTL_MS = 60 * 60 * 1000;

export async function getPdsUrlForDid(did: string) {
  const cacheKey = `${PDS_CACHE_PREFIX}${did}`;
  const cached = getCache<string>(cacheKey);
  if (cached) return cached;

  const pdsUrl = await resolvePdsUrlFromDid(did);
  setCache(cacheKey, pdsUrl, PDS_TTL_MS);
  return pdsUrl;
}
