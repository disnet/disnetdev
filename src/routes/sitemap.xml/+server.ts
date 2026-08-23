import { listLinkblogDocuments, listPublishedDocuments } from '$lib/atproto/documents';
import { getPublication } from '$lib/atproto/publication';
import { renderSitemap } from '$lib/feeds/sitemap';

export async function GET() {
  const [publication, posts, linkblog] = await Promise.all([
    getPublication(),
    listPublishedDocuments(),
    listLinkblogDocuments()
  ]);
  const body = renderSitemap(publication.record.url, [
    '/',
    '/blog',
    '/reading',
    ...posts.map((post) => post.path),
    ...linkblog.map((post) => post.path)
  ]);

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=3600'
    }
  });
}
