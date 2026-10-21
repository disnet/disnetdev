import { error } from '@sveltejs/kit';
import { loadFieldGuide } from '$lib/server/fieldguide';

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=21600'
  });
  const guide = await loadFieldGuide();
  if (!guide) throw error(404, 'Not found');
  return { guide };
}
