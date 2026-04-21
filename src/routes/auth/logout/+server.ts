import { revokeOAuthSession } from '$lib/atproto/auth';
import { destroyWebSession, getAuthSession } from '$lib/server/session';
import { redirect } from '@sveltejs/kit';

export async function POST({ cookies }) {
  const auth = getAuthSession(cookies);

  if (auth) {
    try {
      await revokeOAuthSession(auth.did);
    } catch {
      // ignore revoke errors for now; local logout should still succeed
    }
  }

  destroyWebSession(cookies);
  throw redirect(303, '/');
}
