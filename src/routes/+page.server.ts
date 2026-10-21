import { listPublishedDocuments } from '$lib/atproto/documents';
import { getPublication } from '$lib/atproto/publication';
import { listReadingEntries } from '$lib/atproto/reading';
import { listCards, listCollections } from '$lib/atproto/library';
import { listPhotoPosts } from '$lib/atproto/photos';
import { loadLedger } from '$lib/server/ledger';
import type { LedgerEntry } from '$lib/ledger';
import { loadFieldGuide } from '$lib/server/fieldguide';

// Finished, started and merged work reads better on the front page than the
// agents' running notes, so notes only fill in when there's little else.
function pickWorkbench(entries: LedgerEntry[]) {
  const work = entries.filter((e) => e.kind !== 'published');
  const solid = work.filter((e) => e.kind !== 'noted');
  const picked = solid.length >= 4 ? solid.slice(0, 6) : work.slice(0, 6);
  return picked.sort((a, b) => b.at.localeCompare(a.at));
}

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  const [publication, posts, reading, cards, collections, photos, ledger, guide] = await Promise.all([
    getPublication(),
    listPublishedDocuments(),
    listReadingEntries(),
    listCards(),
    listCollections(),
    listPhotoPosts(3),
    loadLedger().catch(() => null),
    loadFieldGuide().catch(() => null)
  ]);

  return {
    publication,
    posts: posts.slice(0, 5),
    reading: reading.slice(0, 5),
    readingTotal: reading.length,
    cards: cards.slice(0, 5),
    cardsTotal: cards.length,
    photos,
    collectionsTotal: collections.length,
    // The Atmosphere modules: a few lines of the ledger, and the field
    // guide's contents with how far each family has spread.
    workbench: pickWorkbench(ledger?.weeks.flatMap((w) => w.entries) ?? []),
    lexicons:
      guide?.families.map((f) => ({
        key: f.key,
        name: f.name,
        repos: Math.max(0, ...f.specimens.map((s) => s.network ?? 0)),
        capped: f.specimens.some((s) => s.networkCapped),
        plates: f.specimens.length
      })) ?? []
  };
}
