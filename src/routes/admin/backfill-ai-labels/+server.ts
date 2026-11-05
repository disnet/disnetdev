import { backfillAiSelfLabels } from '$lib/atproto/documents';
import { requireAuthor } from '$lib/server/session';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// One-time backfill endpoint. Signed in as the author, POST here once to add
// the `ai-generated` self-label to vibeslop posts published before labels
// were written. New saves and publishes set it themselves. Safe to delete
// this route after running.
export const POST: RequestHandler = async (event) => {
  const session = requireAuthor(event);
  const { updated } = await backfillAiSelfLabels(session.did);

  return json({ updatedCount: updated.length, updated });
};
