import { ATPROTO_XRPC_URL } from '$lib/config';

function buildUrl(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(path, ATPROTO_XRPC_URL.endsWith('/') ? ATPROTO_XRPC_URL : `${ATPROTO_XRPC_URL}/`);

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

export async function xrpc<T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const response = await fetch(buildUrl(path, params), {
    headers: {
      accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`XRPC request failed: ${response.status} ${response.statusText} (${path})`);
  }

  return (await response.json()) as T;
}

export function parseAtUri(uri: string) {
  const match = uri.match(/^at:\/\/([^/]+)\/([^/]+)\/([^/]+)$/);

  if (!match) {
    throw new Error(`Invalid AT URI: ${uri}`);
  }

  return {
    repo: match[1],
    collection: match[2],
    rkey: match[3]
  };
}
