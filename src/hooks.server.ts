import { getAuthSession, syncSubscribedFlag } from '$lib/server/session';
import { runWithPlatform } from '$lib/server/kv';
import { building, dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';

// SvelteKit's CSRF origin check, minus the paths that legitimately receive
// cross-site form posts (see csrf in svelte.config.js).
const CSRF_EXEMPT_PATHS = new Set(['/oauth/token']);
const FORM_CONTENT_TYPES = [
  'application/x-www-form-urlencoded',
  'multipart/form-data',
  'text/plain',
  'application/x-sveltekit-formdata'
];

function isCrossSiteFormSubmission(request: Request, url: URL) {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) return false;
  const type = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase() ?? '';
  if (!FORM_CONTENT_TYPES.includes(type)) return false;
  return request.headers.get('origin') !== url.origin;
}

export const handle: Handle = async ({ event, resolve }) => {
  if (!dev && !CSRF_EXEMPT_PATHS.has(event.url.pathname) && isCrossSiteFormSubmission(event.request, event.url)) {
    return new Response(`Cross-site ${event.request.method} form submissions are forbidden`, { status: 403 });
  }

  return runWithPlatform(event.platform, async () => {
    // Prerendering has no visitor, so there are no cookies to read or set.
    event.locals.auth = null;
    if (!building) {
      event.locals.auth = await getAuthSession(event.cookies);
      syncSubscribedFlag(event.cookies);
    }
    return resolve(event);
  });
};
