import { error } from '@sveltejs/kit';
import { listCards, listCollections } from '$lib/atproto/library';

export const prerender = true;

const RECENT_CARDS_PAGE_SIZE = 24;

export async function _loadLibraryPage(page: number) {
  const [cards, collections] = await Promise.all([listCards(), listCollections()]);

  const totalCards = cards.length;
  const totalPages = Math.max(1, Math.ceil(totalCards / RECENT_CARDS_PAGE_SIZE));

  if (page > totalPages) throw error(404, 'Page not found');

  const start = (page - 1) * RECENT_CARDS_PAGE_SIZE;
  const pageCards = cards.slice(start, start + RECENT_CARDS_PAGE_SIZE);

  return {
    collections,
    cards: pageCards,
    totalCards,
    totalCollections: collections.length,
    page,
    totalPages,
    pageSize: RECENT_CARDS_PAGE_SIZE
  };
}

export function load() {
  return _loadLibraryPage(1);
}
