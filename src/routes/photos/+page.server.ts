import { error } from '@sveltejs/kit';
import { listPhotoPosts } from '$lib/atproto/photos';

const PAGE_SIZE = 10;

export async function load({ url, setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  const photos = await listPhotoPosts();
  const total = photos.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rawPage = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isFinite(rawPage) ? Math.trunc(rawPage) : 1;

  if (page < 1 || page > totalPages) {
    if (total === 0 && page === 1) {
      return { photos: [], page: 1, totalPages: 1, total: 0, pageSize: PAGE_SIZE };
    }
    throw error(404, 'Page not found');
  }

  const start = (page - 1) * PAGE_SIZE;

  return {
    photos: photos.slice(start, start + PAGE_SIZE),
    page,
    totalPages,
    total,
    pageSize: PAGE_SIZE
  };
}
