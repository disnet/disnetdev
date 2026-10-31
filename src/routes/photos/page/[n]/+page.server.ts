import { laterPages, parsePageParam } from '$lib/server/pagination';
import { _loadPhotosPage } from '../../+page.server';

export const prerender = true;

export async function entries() {
  const { totalPages } = await _loadPhotosPage(1);
  return laterPages(totalPages);
}

export function load({ params }) {
  return _loadPhotosPage(parsePageParam(params.n, '/photos'));
}
