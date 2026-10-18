import { getPublication } from '$lib/atproto/publication';
import { loadInFlight } from '$lib/server/inflight';

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
  });

  const [publication, inFlight] = await Promise.all([getPublication(), loadInFlight()]);

  return { publication, inFlight };
}
