import { listLinkblogDocuments } from '$lib/atproto/documents';
import { listShares } from '$lib/atproto/shares';
import type { DocumentSummary, ShareSummary } from '$lib/types/blog';

// The reading stream mixes two record types: Skyreader shares (a pointer, maybe
// a note) and Skyreader linkblog documents (a pointer with enough writing that
// it gets its own page here). Both /reading and the homepage band render this,
// so the merge lives in one place.
export type ReadingEntry =
  | { kind: 'share'; sortedAt: string; share: ShareSummary }
  | { kind: 'post'; sortedAt: string; post: DocumentSummary };

export async function listReadingEntries(): Promise<ReadingEntry[]> {
  const [shares, posts] = await Promise.all([listShares(), listLinkblogDocuments()]);

  return [
    ...shares.map((share) => ({
      kind: 'share' as const,
      sortedAt: share.createdAt,
      share
    })),
    // A linkblog entry's `publishedAt` mirrors the source article, so it is
    // useless for ordering. `createdAt` is when it was actually shared.
    ...posts.map((post) => ({
      kind: 'post' as const,
      sortedAt: post.createdAt ?? post.publishedAt,
      post
    }))
  ].sort((a, b) => b.sortedAt.localeCompare(a.sortedAt));
}
