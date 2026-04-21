import { escapeXml } from '$lib/atproto/utils';

export function renderSitemap(siteUrl: string, paths: string[]) {
  const urls = paths
    .map((path) => `  <url><loc>${escapeXml(new URL(path, siteUrl).toString())}</loc></url>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}
