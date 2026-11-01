import { CORS_HEADERS, registerClient } from '$lib/server/mcp-oauth';
import type { RequestHandler } from './$types';

// Dynamic client registration (RFC 7591). Registering grants nothing by
// itself: every authorization still goes through the author's consent page.
export const POST: RequestHandler = async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const result = await registerClient(body);
  const headers = { 'content-type': 'application/json', ...CORS_HEADERS };

  if ('error' in result) {
    return new Response(
      JSON.stringify({ error: result.error, error_description: 'redirect_uris must be the Claude connector callback or a loopback URL' }),
      { status: 400, headers }
    );
  }

  return new Response(
    JSON.stringify({
      ...result.client,
      token_endpoint_auth_method: 'none',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      client_id_issued_at: Math.floor(Date.now() / 1000)
    }),
    { status: 201, headers }
  );
};
export const OPTIONS: RequestHandler = () => new Response(null, { status: 204, headers: CORS_HEADERS });
