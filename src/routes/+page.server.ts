import { listPublishedDocuments } from '$lib/atproto/documents';
import { getPublication } from '$lib/atproto/publication';
import { listShares } from '$lib/atproto/shares';

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  const [publication, posts, shares] = await Promise.all([
    getPublication(),
    listPublishedDocuments(),
    listShares()
  ]);

  return {
    publication,
    posts: posts.slice(0, 5),
    shares: shares.slice(0, 5),
    sharesTotal: shares.length
  };
}
