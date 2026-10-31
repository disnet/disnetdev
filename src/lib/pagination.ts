import { goto } from '$app/navigation';

// Paginated lists live at /<base> (page 1) and /<base>/page/<n>, so each page
// is its own path and can be prerendered.
export function pageHref(base: string, page: number) {
  return page <= 1 ? base : `${base}/page/${page}`;
}

// Old pager links used `?page=N`. A prerendered file is served the same
// whatever the query string says, so those URLs land on page 1; forward them
// to the path-based page in the browser.
export function forwardLegacyPageQuery(base: string) {
  const raw = new URL(window.location.href).searchParams.get('page');
  const page = Number(raw);
  if (raw === null || !Number.isInteger(page) || page < 2) return;

  goto(pageHref(base, page), { replaceState: true });
}
