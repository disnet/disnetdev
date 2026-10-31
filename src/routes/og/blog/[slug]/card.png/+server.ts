import { isBlogSlugPath, listPublishedDocuments } from '$lib/atproto/documents';
import { getSlugFromPath } from '$lib/atproto/utils';

// Built at deploy time for every post that exists then; a post published since
// the last build is rendered on demand. `/og/blog/[slug]` stays as a rendered
// fallback for cards that were shared before the image moved here.
export { GET } from '../+server';

export const prerender = 'auto';

export async function entries() {
  const posts = await listPublishedDocuments();
  return posts
    .filter((post) => isBlogSlugPath(post.path))
    .map((post) => ({ slug: getSlugFromPath(post.path) }));
}
