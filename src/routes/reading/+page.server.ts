import { error } from '@sveltejs/kit';
import { listLinkblogDocuments } from '$lib/atproto/documents';
import { listShares } from '$lib/atproto/shares';
import type { DocumentSummary, ShareSummary } from '$lib/types/blog';

const PAGE_SIZE = 20;

// The reading stream mixes two record types: Skyreader shares (a pointer, maybe
// a note) and Skyreader linkblog documents (a pointer with enough writing that
// it gets its own page here). Both are sorted by when they were shared.
export type ReadingEntry =
  | { kind: 'share'; sortedAt: string; share: ShareSummary }
  | { kind: 'post'; sortedAt: string; post: DocumentSummary };

export async function load({ url, setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  const [shares, posts] = await Promise.all([listShares(), listLinkblogDocuments()]);

  const entries: ReadingEntry[] = [
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

  const total = entries.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const rawPage = Number(url.searchParams.get('page') ?? '1');
  const page = Number.isFinite(rawPage) ? Math.trunc(rawPage) : 1;

  if (page < 1 || page > totalPages) {
    if (total === 0 && page === 1) {
      return { entries: [], page: 1, totalPages: 1, total: 0, pageSize: PAGE_SIZE };
    }
    throw error(404, 'Page not found');
  }

  const start = (page - 1) * PAGE_SIZE;

  return {
    entries: entries.slice(start, start + PAGE_SIZE),
    page,
    totalPages,
    total,
    pageSize: PAGE_SIZE
  };
}
