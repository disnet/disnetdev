import { error } from '@sveltejs/kit';
import { AUTHOR_DID } from '$lib/config';
import { groupCollections } from '$lib/lens/apps';
import { resolveIdentity } from '$lib/lens/repo';
import { layoutStations } from '$lib/dial/stations';

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600'
  });
  if (!AUTHOR_DID) throw error(404, 'Not found');

  const identity = await resolveIdentity(AUTHOR_DID);

  // The browser reads the records itself; the page only needs to know where
  // each station sits on the band.
  return {
    did: identity.did,
    pds: identity.pds,
    handle: identity.handle,
    stations: layoutStations(groupCollections(identity.collections))
  };
}
