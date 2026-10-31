import {
  getDocumentPathRedirect,
  getPublishedDocumentByPath,
  isBlogSlugPath,
  listLinkblogDocuments,
  listPublishedDocuments
} from '$lib/atproto/documents';
import { error, redirect } from '@sveltejs/kit';

// Documents declare where they live via `site.standard.document.path`, and
// nothing in the publication record tells a publishing app what prefix this
// site uses. So we resolve whatever path a document asks for rather than
// assuming /blog/.
// Documents that exist at build time are static files. 'auto' keeps the route
// in the server for anything newer, unknown paths, and the linkblog redirects.
export const prerender = 'auto';

export async function entries() {
  const [posts, linkblog] = await Promise.all([listPublishedDocuments(), listLinkblogDocuments()]);
  return [...posts, ...linkblog]
    .filter((post) => !isBlogSlugPath(post.path))
    .map((post) => ({ path: post.path.replace(/^\//, '') }));
}

export async function load({ url, setHeaders }) {
  const post = await getPublishedDocumentByPath(url.pathname);

  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=600'
  });

  if (!post) {
    const movedTo = await getDocumentPathRedirect(url.pathname);
    if (movedTo) throw redirect(308, movedTo);

    throw error(404, 'Not found');
  }

  return { post };
}
