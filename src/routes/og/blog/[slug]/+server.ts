import { getPublishedDocumentBySlug } from '$lib/atproto/documents';
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

const DATE_PREFIX = /^\d{4}-\d{2}-\d{2}-/;

function displaySlug(slug: string) {
  // Posts are slugged "YYYY-MM-DD-title" — drop the date prefix in the
  // status line since the date renders separately.
  const shortened = slug.replace(DATE_PREFIX, '');
  return shortened.length > 44 ? shortened.slice(0, 43) + '…' : shortened;
}

export const GET: RequestHandler = async ({ params, url, fetch }) => {
  const post = await getPublishedDocumentBySlug(params.slug);
  if (!post) throw error(404, 'Post not found');

  return renderOgImage(
    {
      eyebrow: 'dispatch',
      title: post.title,
      description: post.description,
      footerLeft: `~/blog/${displaySlug(post.slug)}`,
      footerRight: formatDate(post.publishedAt)
    },
    { origin: url.origin, fetch }
  );
};
