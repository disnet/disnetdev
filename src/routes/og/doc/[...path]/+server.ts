import { getPublishedDocumentByPath } from '$lib/atproto/documents';
import { renderOgImage } from '$lib/og/render';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

function formatDate(iso: string) {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}·${m}·${day}`;
}

function displayPath(path: string) {
  return path.length > 44 ? path.slice(0, 43) + '…' : path;
}

export const GET: RequestHandler = async ({ params, url, fetch }) => {
  const path = `/${params.path}`;
  const post = await getPublishedDocumentByPath(path);
  if (!post) throw error(404, 'Not found');

  return renderOgImage(
    {
      eyebrow: post.path.startsWith('/reading/') ? 'linked' : 'dispatch',
      title: post.title,
      description: post.description,
      footerLeft: `~${displayPath(post.path)}`,
      footerRight: formatDate(post.publishedAt)
    },
    { origin: url.origin, fetch }
  );
};
