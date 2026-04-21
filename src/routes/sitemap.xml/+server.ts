import { listPublishedDocuments } from '$lib/atproto/documents';
import { getPublication } from '$lib/atproto/publication';
import { renderSitemap } from '$lib/feeds/sitemap';

export async function GET() {
  const [publication, posts] = await Promise.all([getPublication(), listPublishedDocuments()]);
  const body = renderSitemap(publication.record.url, ['/', '/blog', '/archive', ...posts.map((post) => post.path)]);

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=3600'
    }
  });
}
