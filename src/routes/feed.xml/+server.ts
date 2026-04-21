import { listPublishedDocuments } from '$lib/atproto/documents';
import { getPublication } from '$lib/atproto/publication';
import { renderRssFeed } from '$lib/feeds/rss';

export async function GET() {
  const [publication, posts] = await Promise.all([getPublication(), listPublishedDocuments()]);

  const body = renderRssFeed({
    siteUrl: publication.record.url,
    title: publication.record.name,
    description: publication.record.description ?? '',
    posts
  });

  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
    }
  });
}
