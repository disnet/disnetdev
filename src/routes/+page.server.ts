import { listPublishedDocuments } from '$lib/atproto/documents';
import { getPublication } from '$lib/atproto/publication';
import { listShares } from '$lib/atproto/shares';
import { listCards, listCollections } from '$lib/atproto/library';

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  const [publication, posts, shares, cards, collections] = await Promise.all([
    getPublication(),
    listPublishedDocuments(),
    listShares(),
    listCards(),
    listCollections()
  ]);

  return {
    publication,
    posts: posts.slice(0, 5),
    shares: shares.slice(0, 5),
    sharesTotal: shares.length,
    cards: cards.slice(0, 5),
    cardsTotal: cards.length,
    collectionsTotal: collections.length
  };
}
