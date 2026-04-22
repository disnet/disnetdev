import { getPaperBySlug } from '$lib/papers';
import { error } from '@sveltejs/kit';

export async function load({ params, setHeaders }) {
  const paper = await getPaperBySlug(params.slug);

  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=600'
  });

  if (!paper) {
    throw error(404, 'Paper not found');
  }

  return { paper };
}
