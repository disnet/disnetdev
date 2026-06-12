import { beginSubscribeLogin, revokeOAuthSession } from '$lib/atproto/auth';
import { removeSubscription } from '$lib/atproto/subscription';
import {
  clearSubscriber,
  getSubscriber,
  safeInternalPath
} from '$lib/server/session';
import { fail, redirect } from '@sveltejs/kit';

export async function load({ url, cookies }) {
  return {
    subscribed: Boolean(await getSubscriber(cookies)),
    error: url.searchParams.get('error')
  };
}

export const actions = {
  subscribe: async ({ request, cookies }) => {
    const form = await request.formData();
    const handle = String(form.get('handle') ?? '').trim();
    const redirectTo = safeInternalPath(String(form.get('redirectTo') ?? ''), '/subscribe');

    if (!handle) {
      return fail(400, { error: 'Enter your Bluesky handle.', handle });
    }

    if (await getSubscriber(cookies)) {
      throw redirect(303, redirectTo);
    }

    let authorizeUrl: URL;
    try {
      authorizeUrl = await beginSubscribeLogin(handle, redirectTo);
    } catch {
      return fail(502, {
        error: 'Could not reach that account. Check the handle and try again.',
        handle
      });
    }

    throw redirect(303, authorizeUrl.toString());
  },

  unsubscribe: async ({ request, cookies }) => {
    const form = await request.formData();
    const redirectTo = safeInternalPath(String(form.get('redirectTo') ?? ''), '/subscribe');

    const subscriber = await getSubscriber(cookies);
    if (subscriber) {
      try {
        await removeSubscription(subscriber.did);
      } catch (err) {
        console.error('[oauth-subscribe] failed to remove subscription record', err);
      }
      // The OAuth session was only retained to allow this removal; release it.
      await revokeOAuthSession(subscriber.did).catch(() => {});
    }

    clearSubscriber(cookies);
    throw redirect(303, redirectTo);
  }
};
