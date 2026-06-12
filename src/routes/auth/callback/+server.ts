import { finishOAuthLogin, revokeOAuthSession } from '$lib/atproto/auth';
import { createSubscription } from '$lib/atproto/subscription';
import { AUTHOR_DID } from '$lib/config';
import { createWebSession, markSubscriber, safeInternalPath } from '$lib/server/session';
import { redirect } from '@sveltejs/kit';

export async function GET({ url, cookies }) {
  const result = await finishOAuthLogin(url.searchParams);

  // Subscribers authenticate only to write a subscription record to their own
  // PDS. Return them to the page they came from with the subscribe control
  // showing its confirmed state — no separate landing page, no sign-out bounce.
  if (result.state.intent === 'subscribe') {
    const returnTo = safeInternalPath(result.state.redirectTo);
    try {
      await createSubscription(result.did);
    } catch (err) {
      console.error('[oauth-subscribe] failed to write subscription record', err);
      throw redirect(303, '/subscribe?error=write');
    }
    // Retain the OAuth session (in KV) and remember the DID so the visitor can
    // later unsubscribe — this is why we no longer sign them out here.
    await markSubscriber(cookies, result.did);
    throw redirect(303, returnTo);
  }

  if (AUTHOR_DID && result.did !== AUTHOR_DID) {
    await revokeOAuthSession(result.did);
    throw redirect(303, '/auth/login?error=unauthorized');
  }

  await createWebSession(cookies, result.did);
  throw redirect(303, result.state.redirectTo || '/admin');
}
