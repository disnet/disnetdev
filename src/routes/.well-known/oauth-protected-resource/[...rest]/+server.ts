import { CORS_HEADERS, protectedResourceMetadata } from '$lib/server/mcp-oauth';
import type { RequestHandler } from './$types';

// Served at both /.well-known/oauth-protected-resource and .../mcp (RFC 9728
// lets clients try the path-suffixed form first).
export const GET: RequestHandler = () =>
  new Response(JSON.stringify(protectedResourceMetadata()), {
    headers: { 'content-type': 'application/json', ...CORS_HEADERS }
  });
export const OPTIONS: RequestHandler = () => new Response(null, { status: 204, headers: CORS_HEADERS });
