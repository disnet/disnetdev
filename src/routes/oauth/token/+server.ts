import { CORS_HEADERS, exchangeCode, refreshTokens } from '$lib/server/mcp-oauth';
import type { RequestHandler } from './$types';

function reply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...CORS_HEADERS }
  });
}

export const POST: RequestHandler = async ({ request }) => {
  const type = request.headers.get('content-type') ?? '';
  const params = type.includes('application/json')
    ? new URLSearchParams((await request.json().catch(() => ({}))) as Record<string, string>)
    : new URLSearchParams(await request.text());
  const get = (key: string) => params.get(key) ?? '';

  const result =
    get('grant_type') === 'authorization_code'
      ? await exchangeCode({
          code: get('code'),
          client_id: get('client_id'),
          redirect_uri: get('redirect_uri'),
          code_verifier: get('code_verifier')
        })
      : get('grant_type') === 'refresh_token'
        ? await refreshTokens({ refresh_token: get('refresh_token'), client_id: get('client_id') })
        : { error: 'unsupported_grant_type' };

  return 'error' in result ? reply(result, 400) : reply(result);
};
export const OPTIONS: RequestHandler = () => new Response(null, { status: 204, headers: CORS_HEADERS });
