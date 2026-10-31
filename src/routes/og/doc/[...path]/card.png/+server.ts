import { isBlogSlugPath, listLinkblogDocuments, listPublishedDocuments } from '$lib/atproto/documents';

// Built at deploy time for every document that exists then; anything newer is
// rendered on demand. `/og/doc/[...path]` stays as a rendered fallback for cards
// that were shared before the image moved here.
export { GET } from '../+server';

export const prerender = 'auto';

export async function entries() {
  const [posts, linkblog] = await Promise.all([listPublishedDocuments(), listLinkblogDocuments()]);
  return [...posts, ...linkblog]
    .filter((post) => !isBlogSlugPath(post.path))
    .map((post) => ({ path: post.path.replace(/^\//, '') }));
}
