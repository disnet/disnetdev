import { error } from '@sveltejs/kit';
import { AUTHOR_DID } from '$lib/config';
import { getProfile, resolveIdentity } from '$lib/lens/repo';

export async function load({ params, setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=120, stale-while-revalidate=600'
  });

  // The lens is a window on this site's own repo, not anyone else's.
  let identity;
  try {
    identity = await resolveIdentity(params.actor);
  } catch {
    throw error(404, 'Not found');
  }
  if (!AUTHOR_DID || identity.did !== AUTHOR_DID) throw error(404, 'Not found');

  const profile = await getProfile(identity.pds, identity.did).catch(() => ({
    displayName: undefined,
    description: undefined,
    avatarUrl: undefined
  }));

  return { identity, profile };
}
