import { listPublishedDocuments } from '$lib/atproto/documents';
import { getPublication } from '$lib/atproto/publication';

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  const [publication, posts] = await Promise.all([getPublication(), listPublishedDocuments()]);

  return {
    publication,
    posts: posts.slice(0, 5)
  };
}
