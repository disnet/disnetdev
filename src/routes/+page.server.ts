import { listPublishedDocuments } from '$lib/atproto/documents';
import { getPublication } from '$lib/atproto/publication';
import { listReadingEntries } from '$lib/atproto/reading';
import { listCards, listCollections } from '$lib/atproto/library';
import { listPhotoPosts } from '$lib/atproto/photos';

export const prerender = true;

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  const [publication, posts, reading, cards, collections, photos] = await Promise.all([
    getPublication(),
    listPublishedDocuments(),
    listReadingEntries(),
    listCards(),
    listCollections(),
    listPhotoPosts(3)
  ]);

  return {
    publication,
    posts: posts.slice(0, 5),
    reading: reading.slice(0, 5),
    readingTotal: reading.length,
    cards: cards.slice(0, 5),
    cardsTotal: cards.length,
    photos,
    collectionsTotal: collections.length
  };
}
