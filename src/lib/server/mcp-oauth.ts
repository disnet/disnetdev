// A minimal OAuth 2.1 authorization server for the /mcp endpoint, so the site
// can be added as a connector in Claude. Only the author can grant access:
// the consent page (/admin/oauth/authorize) sits behind the studio's atproto
// sign-in.
//
// Workers KV is eventually consistent across locations (up to a minute), and
// the steps of an OAuth flow arrive from different places: Claude's servers
// register and redeem, Tim's browser authorizes. So client ids, codes and
// access tokens are stateless HMAC-signed blobs that verify anywhere at once.
// Only refresh tokens are stored, since they are redeemed long after they are
// written and need to rotate.
//
// Supports what MCP clients need: dynamic client registration (RFC 7591),
// authorization code + PKCE S256, refresh tokens with rotation, and protected
// resource metadata (RFC 9728).

import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { getSiteUrl } from '$lib/config';
import { getKeyValueStore } from '$lib/server/kv';

const CODE_TTL_SECONDS = 5 * 60;
const ACCESS_TTL_SECONDS = 60 * 60;
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 60;

export const MCP_SCOPE = 'drafts';

export type McpClient = {
  client_id: string;
  client_name?: string;
  redirect_uris: string[];
};

type ClientPayload = { t: 'client'; name?: string; uris: string[] };
type CodePayload = {
  t: 'code';
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  did: string;
  exp: number;
};
type AccessPayload = { t: 'access'; client_id: string; did: string; exp: number };

type TokenGrant = {
  client_id: string;
  did: string;
};

export function getIssuer() {
  const siteUrl = getSiteUrl().replace(/\/+$/, '');
  // getSiteUrl falls back to localhost; in production that would hand
  // clients metadata pointing nowhere.
  if (!dev && siteUrl.startsWith('http://localhost')) {
    throw new Error('PUBLIC_SITE_URL must be set for the MCP OAuth endpoints');
  }
  return siteUrl;
}

export function getResourceUrl() {
  return `${getIssuer()}/mcp`;
}

export function getResourceMetadataUrl() {
  return `${getIssuer()}/.well-known/oauth-protected-resource/mcp`;
}

export function authorizationServerMetadata() {
  const issuer = getIssuer();
  return {
    issuer,
    authorization_endpoint: `${issuer}/admin/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    registration_endpoint: `${issuer}/oauth/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['none'],
    scopes_supported: [MCP_SCOPE]
  };
}

export function protectedResourceMetadata() {
  return {
    resource: getResourceUrl(),
    authorization_servers: [getIssuer()],
    scopes_supported: [MCP_SCOPE],
    bearer_methods_supported: ['header'],
    resource_name: 'disnetdev drafts'
  };
}

function randomToken(bytes = 32) {
  const buf = crypto.getRandomValues(new Uint8Array(bytes));
  return Buffer.from(buf).toString('base64url');
}

function getSecret() {
  const secret = env.MCP_TOKEN_SECRET ?? env.SESSION_COOKIE_SECRET ?? env.SESSION_SECRET;
  if (secret) return secret;
  if (dev) return 'dev-only-mcp-token-secret';
  throw new Error('MCP_TOKEN_SECRET or SESSION_COOKIE_SECRET must be configured');
}

async function hmac(value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(`mcp-oauth:${getSecret()}`),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Buffer.from(new Uint8Array(sig)).toString('base64url');
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function sign(payload: object) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${await hmac(body)}`;
}

async function unsign<T extends { t: string; exp?: number }>(token: string, type: T['t']): Promise<T | null> {
  const [body, sig, extra] = token.split('.');
  if (!body || !sig || extra !== undefined) return null;
  if (!timingSafeEqual(sig, await hmac(body))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as T;
    if (payload.t !== type) return null;
    if (payload.exp !== undefined && payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Buffer.from(new Uint8Array(digest)).toString('base64url');
}

// Only Tim connects, and only from Claude, so redirect URIs are allowlisted
// rather than accepting any https URL: otherwise anyone could register a
// client named "Claude" that sends the code to their own server. Loopback is
// allowed for local clients (Claude Code). MCP_EXTRA_REDIRECT_URIS (comma
// separated) adds more.
const ALLOWED_REDIRECT_URIS = [
  'https://claude.ai/api/mcp/auth_callback',
  'https://claude.com/api/mcp/auth_callback'
];

export function isAllowedRedirectUri(uri: string) {
  const extra = (env.MCP_EXTRA_REDIRECT_URIS ?? '').split(',').map((u) => u.trim()).filter(Boolean);
  if ([...ALLOWED_REDIRECT_URIS, ...extra].includes(uri)) return true;
  try {
    const url = new URL(uri);
    return !url.hash && url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  } catch {
    return false;
  }
}

export async function registerClient(input: { client_name?: unknown; redirect_uris?: unknown }) {
  const redirectUris = Array.isArray(input.redirect_uris) ? input.redirect_uris.map(String) : [];
  if (redirectUris.length === 0 || redirectUris.length > 10 || !redirectUris.every(isAllowedRedirectUri)) {
    return { error: 'invalid_redirect_uri' as const };
  }
  const name = typeof input.client_name === 'string' ? input.client_name.slice(0, 100) : undefined;
  const payload: ClientPayload = { t: 'client', ...(name ? { name } : {}), uris: redirectUris };
  const client: McpClient = {
    client_id: await sign(payload),
    ...(name ? { client_name: name } : {}),
    redirect_uris: redirectUris
  };
  return { client };
}

export async function getClient(clientId: string): Promise<McpClient | undefined> {
  if (!clientId) return undefined;
  const payload = await unsign<ClientPayload>(clientId, 'client');
  if (!payload) return undefined;
  return { client_id: clientId, ...(payload.name ? { client_name: payload.name } : {}), redirect_uris: payload.uris };
}

export async function issueCode(grant: Omit<CodePayload, 't' | 'exp'>) {
  return sign({ t: 'code', ...grant, exp: Date.now() + CODE_TTL_SECONDS * 1000 } satisfies CodePayload);
}

async function issueTokens(grant: TokenGrant) {
  const accessToken = await sign({
    t: 'access',
    client_id: grant.client_id,
    did: grant.did,
    exp: Date.now() + ACCESS_TTL_SECONDS * 1000
  } satisfies AccessPayload);
  const refreshToken = randomToken();
  await getKeyValueStore().set(`mcp:refresh:${await sha256(refreshToken)}`, grant, {
    ttlSeconds: REFRESH_TTL_SECONDS
  });
  return {
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TTL_SECONDS,
    refresh_token: refreshToken,
    scope: MCP_SCOPE
  };
}

type TokenError = { error: string; error_description?: string };

// Codes are signed rather than stored. Redeemed codes are recorded in KV so a
// replay is refused; that is best-effort (KV is eventually consistent across
// locations), and PKCE still binds a code to the client that started the flow
// within its five-minute life.
export async function exchangeCode(params: {
  code: string;
  client_id: string;
  redirect_uri: string;
  code_verifier: string;
}): Promise<TokenError | Awaited<ReturnType<typeof issueTokens>>> {
  const grant = await unsign<CodePayload>(params.code, 'code');
  if (!grant) return { error: 'invalid_grant', error_description: 'Unknown or expired code' };

  const kv = getKeyValueStore();
  const usedKey = `mcp:used-code:${await sha256(params.code)}`;
  if (await kv.get(usedKey)) return { error: 'invalid_grant', error_description: 'Code already used' };

  if (grant.client_id !== params.client_id || grant.redirect_uri !== params.redirect_uri) {
    return { error: 'invalid_grant', error_description: 'Code was issued to a different client' };
  }
  if (!params.code_verifier || !timingSafeEqual(await sha256(params.code_verifier), grant.code_challenge)) {
    return { error: 'invalid_grant', error_description: 'PKCE verification failed' };
  }

  await kv.set(usedKey, true, { ttlSeconds: CODE_TTL_SECONDS });
  return issueTokens({ client_id: grant.client_id, did: grant.did });
}

export async function refreshTokens(params: { refresh_token: string; client_id: string }) {
  const kv = getKeyValueStore();
  const key = `mcp:refresh:${await sha256(params.refresh_token)}`;
  const grant = await kv.get<TokenGrant>(key);
  if (!grant || grant.client_id !== params.client_id) {
    return { error: 'invalid_grant', error_description: 'Unknown or expired refresh token' } as TokenError;
  }
  await kv.del(key);
  return issueTokens(grant);
}

export async function verifyAccessToken(header: string | null): Promise<TokenGrant | null> {
  const match = header?.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const payload = await unsign<AccessPayload>(match[1].trim(), 'access');
  return payload ? { client_id: payload.client_id, did: payload.did } : null;
}

export const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'authorization, content-type, mcp-protocol-version, mcp-session-id',
  'access-control-expose-headers': 'www-authenticate, mcp-session-id'
};
