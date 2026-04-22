import { AUTHOR_DID } from '$lib/config';
import { getPdsUrlForDid } from '$lib/atproto/service';
import type { RequestHandler } from './$types';

const CID_PATTERN = /^[a-zA-Z0-9]+$/;

export const GET: RequestHandler = async ({ params, fetch }) => {
  const { did, cid } = params;

  if (!CID_PATTERN.test(cid)) {
    return new Response('Invalid cid', { status: 400 });
  }
  if (!AUTHOR_DID || did !== AUTHOR_DID) {
    return new Response('Not found', { status: 404 });
  }

  const pdsUrl = (await getPdsUrlForDid(did)).replace(/\/$/, '');
  const upstreamUrl = `${pdsUrl}/xrpc/com.atproto.sync.getBlob?did=${encodeURIComponent(did)}&cid=${encodeURIComponent(cid)}`;
  const upstream = await fetch(upstreamUrl);

  if (!upstream.ok) {
    return new Response(`Upstream ${upstream.status}`, { status: upstream.status });
  }

  const headers = new Headers();
  const ct = upstream.headers.get('content-type');
  if (ct) headers.set('content-type', ct);
  const cl = upstream.headers.get('content-length');
  if (cl) headers.set('content-length', cl);
  headers.set('cache-control', 'public, max-age=31536000, immutable');

  return new Response(upstream.body, { status: 200, headers });
};
