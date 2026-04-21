import { finishOAuthLogin, revokeOAuthSession } from '$lib/atproto/auth';
import { AUTHOR_DID } from '$lib/config';
import { createWebSession } from '$lib/server/session';
import { redirect } from '@sveltejs/kit';

export async function GET({ url, cookies }) {
  const result = await finishOAuthLogin(url.searchParams);

  if (AUTHOR_DID && result.did !== AUTHOR_DID) {
    await revokeOAuthSession(result.did);
    throw redirect(303, '/auth/login?error=unauthorized');
  }

  createWebSession(cookies, result.did);
  throw redirect(303, result.state.redirectTo || '/admin');
}
