import { getAuthSession } from '$lib/server/session';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.auth = await getAuthSession(event.cookies);
  return resolve(event);
};
