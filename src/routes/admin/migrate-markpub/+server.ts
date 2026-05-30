import { migrateLegacyContentToMarkpub } from '$lib/atproto/documents';
import { requireAuthor } from '$lib/server/session';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// One-time migration endpoint. Signed in as the author, POST here once to
// rewrite every legacy `dev.disnet.blog.content.markdown` embed into the
// markpub.at format. Safe to delete this route after running.
export const POST: RequestHandler = async (event) => {
  const session = requireAuthor(event);
  const { migrated, skipped } = await migrateLegacyContentToMarkpub(session.did);

  return json({
    migratedCount: migrated.length,
    skippedCount: skipped.length,
    migrated,
    skipped
  });
};
