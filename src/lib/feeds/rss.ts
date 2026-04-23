import { escapeXml } from '$lib/atproto/utils';
import type { FeedDocument } from '$lib/types/blog';

function cdata(value: string) {
  return `<![CDATA[${value.replaceAll(']]>', ']]]]><![CDATA[>')}]]>`;
}

function absolutizeRootRelativeUrls(html: string, siteUrl: string) {
  return html.replace(/\s(href|src)="\/([^"]*)"/g, (_match, attribute: string, path: string) => {
    return ` ${attribute}="${new URL(`/${path}`, siteUrl).toString()}"`;
  });
}

function renderFullContent(post: FeedDocument, siteUrl: string) {
  const coverImage = post.coverImageUrl
    ? `<figure><img src="${escapeXml(new URL(post.coverImageUrl, siteUrl).toString())}" alt="${escapeXml(post.coverImageAlt ?? '')}" /></figure>`
    : '';

  return absolutizeRootRelativeUrls(`${coverImage}${post.html}`, siteUrl);
}

export function renderRssFeed({
  siteUrl,
  title,
  description,
  posts
}: {
  siteUrl: string;
  title: string;
  description: string;
  posts: FeedDocument[];
}) {
  const lastBuildDate = posts
    .map((post) => post.updatedAt ?? post.publishedAt)
    .sort()
    .at(-1);

  const items = posts
    .map((post) => {
      const url = new URL(post.path, siteUrl).toString();
      const content = renderFullContent(post, siteUrl);
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid>${escapeXml(url)}</guid>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      ${post.description ? `<description>${escapeXml(post.description)}</description>` : ''}
      <content:encoded>${cdata(content)}</content:encoded>
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(description)}</description>
    ${lastBuildDate ? `<lastBuildDate>${new Date(lastBuildDate).toUTCString()}</lastBuildDate>` : ''}${items}
  </channel>
</rss>`;
}
