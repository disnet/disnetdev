import { requireAuthor } from '$lib/server/session';

export function load(event) {
  requireAuthor(event);
  return {};
}
