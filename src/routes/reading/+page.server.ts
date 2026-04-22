import { error } from '@sveltejs/kit';
import { listShares } from '$lib/atproto/shares';

const PAGE_SIZE = 20;

export async function load({ url, setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  const shares = await listShares();
  const total = shares.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rawPage = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isFinite(rawPage) ? Math.trunc(rawPage) : 1;

  if (page < 1 || page > totalPages) {
    if (total === 0 && page === 1) {
      return { shares: [], page: 1, totalPages: 1, total: 0, pageSize: PAGE_SIZE };
    }
    throw error(404, 'Page not found');
  }

  const start = (page - 1) * PAGE_SIZE;
  const pageShares = shares.slice(start, start + PAGE_SIZE);

  return {
    shares: pageShares,
    page,
    totalPages,
    total,
    pageSize: PAGE_SIZE
  };
}
