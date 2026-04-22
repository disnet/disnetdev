import { escapeXml } from '$lib/atproto/utils';
import type { DocumentSummary } from '$lib/types/blog';

export function renderRssFeed({
  siteUrl,
  title,
  description,
  posts
}: {
  siteUrl: string;
  title: string;
  description: string;
  posts: DocumentSummary[];
}) {
  const items = posts
    .map((post) => {
      const url = new URL(post.path, siteUrl).toString();
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid>${escapeXml(url)}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      ${post.description ? `<description>${escapeXml(post.description)}</description>` : ''}
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(description)}</description>${items}
  </channel>
</rss>`;
}
