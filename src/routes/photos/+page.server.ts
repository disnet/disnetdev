import { error } from '@sveltejs/kit';
import { listPhotoPosts } from '$lib/atproto/photos';

export const prerender = true;

const PAGE_SIZE = 10;

export async function _loadPhotosPage(page: number) {
  const photos = await listPhotoPosts();
  const total = photos.length;
  const photoAuthorDid = photos[0]?.uri.split('/')[2] ?? '';
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (page > totalPages) throw error(404, 'Page not found');

  const start = (page - 1) * PAGE_SIZE;

  return {
    photos: photos.slice(start, start + PAGE_SIZE),
    photoAuthorDid,
    page,
    totalPages,
    total,
    pageSize: PAGE_SIZE
  };
}

export function load() {
  return _loadPhotosPage(1);
}
