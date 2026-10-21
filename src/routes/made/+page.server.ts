import { error } from '@sveltejs/kit';
import { loadLedger } from '$lib/server/ledger';

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=900'
  });
  const ledger = await loadLedger();
  if (!ledger) throw error(404, 'Not found');
  return { ledger };
}
