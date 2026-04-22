import { listPublishedDocuments } from '$lib/atproto/documents';
import { listDrafts } from '$lib/atproto/drafts';
import { requireAuthor } from '$lib/server/session';

export async function load(event) {
  requireAuthor(event);

  event.setHeaders({
    'cache-control': 'private, no-store'
  });

  return {
    auth: event.locals.auth,
    drafts: await listDrafts(),
    posts: await listPublishedDocuments()
  };
}
