import { listPublishedDocuments } from '$lib/atproto/documents';
import { getPublication } from '$lib/atproto/publication';

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  const [posts, publication] = await Promise.all([listPublishedDocuments(), getPublication()]);

  return {
    posts,
    publicationUri: publication.uri
  };
}
