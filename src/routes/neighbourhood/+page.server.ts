import { error } from '@sveltejs/kit';
import { loadStreet } from '$lib/server/neighbourhood';

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=1800'
  });
  const street = await loadStreet();
  if (!street) throw error(404, 'Not found');
  return { street };
}
