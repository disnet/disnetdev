import { getAuthSession, syncSubscribedFlag } from '$lib/server/session';
import { runWithPlatform } from '$lib/server/kv';
import { building } from '$app/environment';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
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
