import {
  getPublishedDocumentBySlug,
  isBlogSlugPath,
  listPublishedDocuments
} from '$lib/atproto/documents';
import { getSlugFromPath } from '$lib/atproto/utils';
import { error } from '@sveltejs/kit';

// Every post that exists at build time is a static file. 'auto' keeps the route
// in the server too, so a post published since the last build still renders.
export const prerender = 'auto';

export async function entries() {
  const posts = await listPublishedDocuments();
  return posts
    .filter((post) => isBlogSlugPath(post.path))
    .map((post) => ({ slug: getSlugFromPath(post.path) }));
}

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
