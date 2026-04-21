import { listPublishedDocuments } from '$lib/atproto/documents';

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  return {
    posts: await listPublishedDocuments()
  };
}
