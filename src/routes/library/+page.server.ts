import { listCards, listCollections } from '$lib/atproto/library';

const RECENT_CARDS_PAGE_SIZE = 24;

export async function load({ url, setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  const [cards, collections] = await Promise.all([listCards(), listCollections()]);

  const rawPage = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.trunc(rawPage) : 1;

  const totalCards = cards.length;
  const totalPages = Math.max(1, Math.ceil(totalCards / RECENT_CARDS_PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);

  const start = (clampedPage - 1) * RECENT_CARDS_PAGE_SIZE;
  const pageCards = cards.slice(start, start + RECENT_CARDS_PAGE_SIZE);

  return {
    collections,
    cards: pageCards,
    totalCards,
    totalCollections: collections.length,
    page: clampedPage,
    totalPages,
    pageSize: RECENT_CARDS_PAGE_SIZE
  };
}
