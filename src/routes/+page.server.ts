import { AUTHOR_DID } from '$lib/config';
import { getPublication } from '$lib/atproto/publication';
import { HIDDEN_COLLECTIONS } from '$lib/lens/apps';
import { resolveIdentity } from '$lib/lens/repo';
import { callsign } from '$lib/lens/scope';
import { loadInFlight } from '$lib/server/inflight';

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
  });

  const [publication, inFlight, identity] = await Promise.all([
    getPublication(),
    loadInFlight(),
    AUTHOR_DID ? resolveIdentity(AUTHOR_DID).catch(() => null) : null
  ]);

  // The scope reads the repo from the browser; the page only hands it where
  // to look and which blips are work in flight.
  const scope = identity && {
    did: identity.did,
    pds: identity.pds,
    repo: identity.handle,
    collections: identity.collections.filter((c) => !HIDDEN_COLLECTIONS.has(c))
  };

  return {
    publication,
    inFlight: {
      ...inFlight,
      underway: inFlight.underway.map((f) => ({ ...f, callsign: callsign(f.where, f.uri) }))
    },
    scope
  };
}
