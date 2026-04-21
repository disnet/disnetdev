import { dev } from '$app/environment';
import { AUTHOR_DID } from '$lib/config';
import { error, redirect, type Cookies, type RequestEvent } from '@sveltejs/kit';

const SESSION_COOKIE = 'disnetdev_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

const webSessions = new Map<string, { did: string; createdAt: number }>();

export type AuthSession = {
  sessionId: string;
  did: string;
  isAuthor: boolean;
};

export function isAuthorDid(did: string) {
  return Boolean(AUTHOR_DID) && did === AUTHOR_DID;
}

export function createWebSession(cookies: Cookies, did: string) {
  const sessionId = crypto.randomUUID();
  webSessions.set(sessionId, {
    did,
    createdAt: Date.now()
  });

  cookies.set(SESSION_COOKIE, sessionId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: !dev,
    maxAge: SESSION_TTL_SECONDS
  });

  return sessionId;
}

export function destroyWebSession(cookies: Cookies) {
  const sessionId = cookies.get(SESSION_COOKIE);
  if (sessionId) {
    webSessions.delete(sessionId);
  }

  cookies.delete(SESSION_COOKIE, {
    path: '/'
  });
}

export function getAuthSession(cookies: Cookies): AuthSession | null {
  const sessionId = cookies.get(SESSION_COOKIE);
  if (!sessionId) return null;

  const session = webSessions.get(sessionId);
  if (!session) return null;

  return {
    sessionId,
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
