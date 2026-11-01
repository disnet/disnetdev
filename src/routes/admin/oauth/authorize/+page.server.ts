// Consent page for MCP clients (see $lib/server/mcp-oauth). Sits behind the
// studio sign-in, so only the author can hand out a token.

import { getClient, getIssuer, getResourceUrl, isAllowedRedirectUri, issueCode, MCP_SCOPE } from '$lib/server/mcp-oauth';
import { requireAuthor } from '$lib/server/session';
import { error, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

async function readRequest(url: URL) {
  const p = url.searchParams;
  const client = await getClient(p.get('client_id') ?? '');
  const redirectUri = p.get('redirect_uri') ?? '';

  // Without a known client and redirect URI there is nowhere safe to send an
  // error, so show it here instead.
  if (!client) throw error(400, 'Unknown client. Remove the connector and add it again.');
  if (!client.redirect_uris.includes(redirectUri) || !isAllowedRedirectUri(redirectUri)) {
    throw error(400, 'Redirect URI is not registered for this client.');
  }

  const state = p.get('state');
  const back = (params: Record<string, string>) => {
    const target = new URL(redirectUri);
    for (const [k, v] of Object.entries(params)) target.searchParams.set(k, v);
    if (state) target.searchParams.set('state', state);
    return target.toString();
  };

  let problem: string | null = null;
  if (p.get('response_type') !== 'code') problem = 'response_type must be code';
  else if (!p.get('code_challenge') || p.get('code_challenge_method') !== 'S256') problem = 'PKCE with S256 is required';
  else if (p.get('resource') && p.get('resource') !== getResourceUrl()) problem = 'Unknown resource';

  return { client, redirectUri, codeChallenge: p.get('code_challenge') ?? '', back, problem };
}

export const load: PageServerLoad = async (event) => {
  requireAuthor(event);
  event.setHeaders({ 'cache-control': 'private, no-store' });

  const req = await readRequest(event.url);
  if (req.problem) throw redirect(303, req.back({ error: 'invalid_request', error_description: req.problem }));

  return {
    clientName: req.client.client_name ?? 'An MCP client',
    redirectHost: new URL(req.redirectUri).host,
    scope: MCP_SCOPE
  };
};

export const actions: Actions = {
  default: async (event) => {
    const session = requireAuthor(event);
    const req = await readRequest(event.url);
    if (req.problem) throw redirect(303, req.back({ error: 'invalid_request', error_description: req.problem }));

    const form = await event.request.formData();
    if (form.get('decision') !== 'allow') {
      throw redirect(303, req.back({ error: 'access_denied' }));
    }

    const code = await issueCode({
      client_id: req.client.client_id,
      redirect_uri: req.redirectUri,
      code_challenge: req.codeChallenge,
      did: session.did
    });
    throw redirect(303, req.back({ code, iss: getIssuer() }));
  }
};
