import { laterPages, parsePageParam } from '$lib/server/pagination';
import { _loadLibraryPage } from '../../+page.server';

export const prerender = true;

export async function entries() {
  const { totalPages } = await _loadLibraryPage(1);
  return laterPages(totalPages);
}

export function load({ params }) {
  return _loadLibraryPage(parsePageParam(params.n, '/library'));
}
