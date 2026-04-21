import { Agent } from '@atproto/api';
import {
  NodeOAuthClient,
  type NodeSavedSession,
  type NodeSavedState
} from '@atproto/oauth-client-node';
import { DRAFT_COLLECTION_NSID, getSiteUrl } from '$lib/config';

const stateStoreMap = new Map<string, NodeSavedState>();
const sessionStoreMap = new Map<string, NodeSavedSession>();

type OAuthState = {
  redirectTo?: string;
};

const stateStore = {
  async set(key: string, value: NodeSavedState) {
    stateStoreMap.set(key, value);
  },
  async get(key: string) {
    return stateStoreMap.get(key);
  },
  async del(key: string) {
    stateStoreMap.delete(key);
  }
};

const sessionStore = {
  async set(key: string, value: NodeSavedSession) {
    sessionStoreMap.set(key, value);
  },
  async get(key: string) {
    return sessionStoreMap.get(key);
  },
  async del(key: string) {
    sessionStoreMap.delete(key);
  }
};

let client: NodeOAuthClient | undefined;

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
    'repo:site.standard.publication'
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
    stateStore,
    sessionStore
  });
}

export function getOAuthClient() {
  client ??= createClient();
  return client;
}

export async function beginOAuthLogin(handle: string, redirectTo?: string) {
  return getOAuthClient().authorize(handle, {
    state: JSON.stringify({ redirectTo } satisfies OAuthState)
  });
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
