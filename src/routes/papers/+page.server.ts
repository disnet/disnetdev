import { listPapers } from '$lib/papers';

export function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=600'
  });

  return { papers: listPapers() };
}
