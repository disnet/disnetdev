import { listPapers } from '$lib/papers';

export const prerender = true;

export function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=600'
  });

  return { papers: listPapers() };
}
