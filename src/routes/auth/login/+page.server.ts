import { beginOAuthLogin } from '$lib/atproto/auth';
import { fail, redirect } from '@sveltejs/kit';

export function load({ locals, url }) {
  if (locals.auth?.isAuthor) {
    throw redirect(303, '/admin');
  }

  return {
    redirectTo: url.searchParams.get('redirectTo') ?? '/admin',
    error: url.searchParams.get('error')
  };
}

export const actions = {
  default: async ({ request, url }) => {
    const form = await request.formData();
    const handle = String(form.get('handle') ?? '').trim();
    const redirectTo = String(form.get('redirectTo') ?? url.searchParams.get('redirectTo') ?? '/admin');

    if (!handle) {
      return fail(400, {
        error: 'Enter your Bluesky handle.',
        handle,
        redirectTo
      });
    }

    const authorizeUrl = await beginOAuthLogin(handle, redirectTo || '/admin');
    throw redirect(303, authorizeUrl.toString());
  }
};
