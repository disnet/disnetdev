import { error, redirect } from '@sveltejs/kit';

// Server side of the /<base>/page/<n> scheme in $lib/pagination.
export function parsePageParam(raw: string | undefined, base: string) {
  if (raw === undefined) return 1;

  const page = Number(raw);
  if (!Number.isInteger(page) || page < 1 || String(page) !== raw) {
    throw error(404, 'Page not found');
  }
  if (page === 1) throw redirect(308, base);

  return page;
}

// Page numbers after the first, for a route's `entries()`.
export function laterPages(totalPages: number) {
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
    n: String(index + 2)
  }));
}
