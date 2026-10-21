import { listPublishedDocuments } from '$lib/atproto/documents';
import { listPhotoPosts } from '$lib/atproto/photos';
import { loadLedger } from '$lib/server/ledger';
import { loadFieldGuide } from '$lib/server/fieldguide';

const RANGE_WEEKS = 16;

export async function load({ setHeaders }) {
  setHeaders({
    'cache-control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300'
  });

  const [posts, photos, ledger, guide] = await Promise.all([
    listPublishedDocuments().catch(() => []),
    listPhotoPosts(3).catch(() => []),
    loadLedger().catch(() => null),
    loadFieldGuide().catch(() => null)
  ]);

  // The mountain range in the hero: one peak per week, as tall as that
  // week's work. Weeks with nothing in the ledger stay as low hills.
  const byWeek = new Map(ledger?.weeks.map((w) => [w.start, w.entries.length]) ?? []);
  const monday = new Date();
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  const range = Array.from({ length: RANGE_WEEKS }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() - 7 * (RANGE_WEEKS - 1 - i));
    const start = d.toISOString().slice(0, 10);
    return { start, n: byWeek.get(start) ?? 0 };
  });

  const work = (ledger?.weeks.flatMap((w) => w.entries) ?? []).filter(
    (e) => e.kind === 'finished' || e.kind === 'merged' || e.kind === 'started'
  );

  return {
    posts: posts.slice(0, 4),
    photos,
    range,
    work: work.slice(0, 5),
    families:
      guide?.families.map((f) => ({
        key: f.key,
        name: f.name,
        blurb: f.blurb,
        repos: Math.max(0, ...f.specimens.map((s) => s.network ?? 0))
      })) ?? []
  };
}
