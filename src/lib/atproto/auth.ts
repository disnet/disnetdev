import { Agent } from '@atproto/api';
import {
  NodeOAuthClient,
  type NodeSavedSession,
  type NodeSavedState
} from '@atproto/oauth-client-node';
import { AtprotoDohHandleResolver } from '@atproto-labs/handle-resolver';
import { DRAFT_COLLECTION_NSID, getSiteUrl } from '$lib/config';
import { getKeyValueStore } from '$lib/server/kv';

const OAUTH_STATE_TTL_SECONDS = 10 * 60;
const OAUTH_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

type OAuthState = {
  redirectTo?: string;
};

const stateStore = {
  async set(key: string, value: NodeSavedState) {
    await getKeyValueStore().set(`oauth:state:${key}`, value, {
      ttlSeconds: OAUTH_STATE_TTL_SECONDS
    });
  },
  async get(key: string) {
    return getKeyValueStore().get<NodeSavedState>(`oauth:state:${key}`);
  },
  async del(key: string) {
    await getKeyValueStore().del(`oauth:state:${key}`);
  }
};

const sessionStore = {
  async set(key: string, value: NodeSavedSession) {
    await getKeyValueStore().set(`oauth:session:${key}`, value, {
      ttlSeconds: OAUTH_SESSION_TTL_SECONDS
    });
  },
  async get(key: string) {
    return getKeyValueStore().get<NodeSavedSession>(`oauth:session:${key}`);
  },
  async del(key: string) {
    await getKeyValueStore().del(`oauth:session:${key}`);
  }
};

let client: NodeOAuthClient | undefined;

// Cloudflare Workers rejects `redirect: 'error'` in both the Request
// constructor and fetch init. Upstream @atproto-labs resolvers pass it
// to fail-closed on redirects (via bindFetch, which wraps arguments in
// `new Request(...)` before our fetch ever runs). Patch globalThis.Request
// to substitute 'manual' so construction succeeds. plc.directory and the
// well-known endpoints don't redirect in normal operation.
type ShimMarker = { __disnetdevRedirectShim?: boolean };
if (!(globalThis.Request as unknown as ShimMarker).__disnetdevRedirectShim) {
  const Original = globalThis.Request;
  class PatchedRequest extends Original {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      if (init?.redirect === 'error') {
        super(input, { ...init, redirect: 'manual' });
      } else {
        super(input, init);
      }
    }
  }
  (PatchedRequest as unknown as ShimMarker).__disnetdevRedirectShim = true;
  globalThis.Request = PatchedRequest;
}

const workerFetch: typeof globalThis.fetch = async (input, init) => {
  if (init?.redirect === 'error') {
    const res = await globalThis.fetch(input, { ...init, redirect: 'manual' });
    if (res.status >= 300 && res.status < 400) {
      throw new Error(`Unexpected redirect (${res.status}) from ${String(input)}`);
    }
    return res;
  }
  return globalThis.fetch(input, init);
};

function buildClientId(siteUrl: string, scope: string) {
  const url = new URL(siteUrl);
  const isLocalDev =
    url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');

  if (!isLocalDev) {
    return `${siteUrl}/client-metadata.json`;
  }

  const params = new URLSearchParams();
  params.append('redirect_uri', `${siteUrl}/auth/callback`);
  params.append('scope', scope);
  return `http://localhost?${params.toString()}`;
}

function createClient() {
  const siteUrl = getSiteUrl();
  const scope = [
    'atproto',
    `repo:${DRAFT_COLLECTION_NSID}`,
    'repo:site.standard.document',
    'repo:site.standard.publication',
    'rpc:com.atproto.repo.uploadBlob',
    'blob:*/*'
  ].join(' ');

  return new NodeOAuthClient({
    clientMetadata: {
      client_id: buildClientId(siteUrl, scope),
      client_name: 'disnetdev',
      client_uri: siteUrl,
      redirect_uris: [`${siteUrl}/auth/callback`],
      grant_types: ['authorization_code', 'refresh_token'],
      scope,
      response_types: ['code'],
      application_type: 'web',
      token_endpoint_auth_method: 'none',
      dpop_bound_access_tokens: true
    },
    fetch: workerFetch,
    handleResolver: new AtprotoDohHandleResolver({
      dohEndpoint: 'https://cloudflare-dns.com/dns-query',
      fetch: workerFetch
    }),
    stateStore,
    sessionStore
  });
}

export function getOAuthClient() {
  client ??= createClient();
  return client;
}

export async function beginOAuthLogin(handle: string, redirectTo?: string) {
  try {
    return await getOAuthClient().authorize(handle, {
      state: JSON.stringify({ redirectTo } satisfies OAuthState)
    });
  } catch (err) {
    const cause = (err as { cause?: unknown })?.cause;
    console.error('[oauth-login] authorize failed', {
      handle,
      error: err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
      cause: cause instanceof Error ? { name: cause.name, message: cause.message, stack: cause.stack } : cause
    });
    throw err;
  }
}

export async function finishOAuthLogin(params: URLSearchParams) {
  const { session, state } = await getOAuthClient().callback(params);
  const parsedState = state ? (JSON.parse(state) as OAuthState) : {};

  return {
    did: session.did,
    session,
    state: parsedState
  };
}

export async function restoreOAuthAgent(did: string) {
  const session = await getOAuthClient().restore(did);
  return new Agent(session);
}

export async function revokeOAuthSession(did: string) {
  const session = await getOAuthClient().restore(did);
  await session.signOut();
}
