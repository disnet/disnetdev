import { getAuthSession } from '$lib/server/session';
import { runWithPlatform } from '$lib/server/kv';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  return runWithPlatform(event.platform, async () => {
    event.locals.auth = await getAuthSession(event.cookies);
    return resolve(event);
  });
};
