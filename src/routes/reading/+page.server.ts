import { error } from '@sveltejs/kit';
import { listReadingEntries } from '$lib/atproto/reading';

export const prerender = true;

const PAGE_SIZE = 20;

export async function _loadReadingPage(page: number) {
  const entries = await listReadingEntries();
  const total = entries.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages) throw error(404, 'Page not found');

  const start = (page - 1) * PAGE_SIZE;

  return {
    entries: entries.slice(start, start + PAGE_SIZE),
    page,
    totalPages,
    total,
    pageSize: PAGE_SIZE
  };
}

export function load() {
  return _loadReadingPage(1);
}
