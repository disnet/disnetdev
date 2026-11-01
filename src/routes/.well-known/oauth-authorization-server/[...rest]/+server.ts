import { CORS_HEADERS, authorizationServerMetadata } from '$lib/server/mcp-oauth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () =>
  new Response(JSON.stringify(authorizationServerMetadata()), {
    headers: { 'content-type': 'application/json', ...CORS_HEADERS }
  });
export const OPTIONS: RequestHandler = () => new Response(null, { status: 204, headers: CORS_HEADERS });
