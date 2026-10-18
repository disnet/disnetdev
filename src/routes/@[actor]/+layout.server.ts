import { error } from '@sveltejs/kit';
import { getProfile, resolveIdentity } from '$lib/lens/repo';

export async function load({ params, setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=120, stale-while-revalidate=600'
  });

  let identity;
  try {
    identity = await resolveIdentity(params.actor);
  } catch {
    throw error(404, `Nothing on the network answers to ${params.actor}`);
  }

  const profile = await getProfile(identity.pds, identity.did).catch(() => ({
    displayName: undefined,
    description: undefined,
    avatarUrl: undefined
  }));

  return { identity, profile };
}
