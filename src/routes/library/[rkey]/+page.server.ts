import { error } from '@sveltejs/kit';
import { getCollectionByRkey } from '$lib/atproto/library';

export async function load({ params, setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  const result = await getCollectionByRkey(params.rkey);
  if (!result) {
    throw error(404, 'Collection not found');
  }

  return {
    collection: result.collection,
    cards: result.cards
  };
}
