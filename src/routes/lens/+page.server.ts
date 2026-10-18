import { redirect } from '@sveltejs/kit';
import { lensHref } from '$lib/lens/paths';

// The "point the lens at…" forms submit here with ?actor=; a handle typed with
// a leading @ or a pasted at:// uri both land in the right place.
export function load({ url }) {
  const raw = (url.searchParams.get('actor') ?? '').trim();
  if (!raw) throw redirect(303, '/');

  if (raw.startsWith('at://')) throw redirect(303, `/@${raw.slice('at://'.length)}`);
  throw redirect(303, lensHref(raw.replace(/^@/, '')));
}
