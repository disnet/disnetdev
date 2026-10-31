import { laterPages, parsePageParam } from '$lib/server/pagination';
import { _loadReadingPage } from '../../+page.server';

export const prerender = true;

export async function entries() {
  const { totalPages } = await _loadReadingPage(1);
  return laterPages(totalPages);
}

export function load({ params }) {
  return _loadReadingPage(parsePageParam(params.n, '/reading'));
}
