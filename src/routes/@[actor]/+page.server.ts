import { groupCollections } from '$lib/lens/apps';

export async function load({ parent }) {
  const { identity } = await parent();
  return { groups: groupCollections(identity.collections) };
}
