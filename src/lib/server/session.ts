import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import { AUTHOR_DID } from '$lib/config';
import { error, redirect, type Cookies, type RequestEvent } from '@sveltejs/kit';

const SESSION_COOKIE = 'disnetdev_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

type WebSessionPayload = {
  did: string;
  exp: number;
};

export type AuthSession = {
  did: string;
  isAuthor: boolean;
};

export function isAuthorDid(did: string) {
  return Boolean(AUTHOR_DID) && did === AUTHOR_DID;
}

function getSessionSecret() {
  const configured = env.SESSION_COOKIE_SECRET ?? env.SESSION_SECRET;
  if (configured) return configured;

  if (dev) {
    return 'dev-only-session-cookie-secret';
  }

  throw new Error('SESSION_COOKIE_SECRET is not configured');
}

function encodeBase64Url(value: Uint8Array) {
  return Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function decodeBase64Url(value: string) {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${padding}`, 'base64');
}

async function importSessionKey() {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

async function signValue(value: string) {
  const key = await importSessionKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return encodeBase64Url(new Uint8Array(signature));
}

async function verifyValue(value: string, signature: string) {
  const key = await importSessionKey();
  return crypto.subtle.verify('HMAC', key, decodeBase64Url(signature), new TextEncoder().encode(value));
}

async function encodeSession(payload: WebSessionPayload) {
  const body = encodeBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signValue(body);
  return `${body}.${signature}`;
}

async function decodeSession(cookieValue: string): Promise<WebSessionPayload | null> {
  const [body, signature] = cookieValue.split('.');
  if (!body || !signature) return null;

  if (!(await verifyValue(body, signature))) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(body).toString('utf8')) as WebSessionPayload;
    if (!payload.did || !payload.exp) return null;
    if (payload.exp <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createWebSession(cookies: Cookies, did: string) {
  const payload: WebSessionPayload = {
    did,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000
  };
  const sessionToken = await encodeSession(payload);

  cookies.set(SESSION_COOKIE, sessionToken, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: !dev,
    maxAge: SESSION_TTL_SECONDS
  });
}

export function destroyWebSession(cookies: Cookies) {
  cookies.delete(SESSION_COOKIE, {
    path: '/'
  });
}

export async function getAuthSession(cookies: Cookies): Promise<AuthSession | null> {
  const sessionToken = cookies.get(SESSION_COOKIE);
  if (!sessionToken) return null;

  const session = await decodeSession(sessionToken);
  if (!session) return null;

  return {
    did: session.did,
    isAuthor: isAuthorDid(session.did)
  };
}

export function getRedirectTarget(event: RequestEvent) {
  return `${event.url.pathname}${event.url.search}`;
}

export function requireAuthor(event: RequestEvent) {
  const session = event.locals.auth;

  if (!session) {
    throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(getRedirectTarget(event))}`);
  }

  if (!session.isAuthor) {
    throw error(403, 'Signed in account is not authorized for admin access');
  }

  return session;
}
