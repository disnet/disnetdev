import { getPublishedDocumentBySlug } from '$lib/atproto/documents';
import { error } from '@sveltejs/kit';

export async function load({ params, setHeaders }) {
  const post = await getPublishedDocumentBySlug(params.slug);

  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=600'
  });

  if (!post) {
    throw error(404, 'Post not found');
  }

  return { post };
}
