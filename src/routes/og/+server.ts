import { renderOgImage } from '$lib/og/render';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url, fetch }) => {
  return renderOgImage(
    {
      eyebrow: 'transmission',
      title: 'Tim Disney',
      description:
        'programming languages, the web, and the Atmosphere. a language workshop, since 2011.',
      footerLeft: '~/',
      footerRight: 'disnetdev.com'
    },
    { origin: url.origin, fetch }
  );
};
