import { AUTHOR_DID } from '$lib/config';
import { xrpc } from '$lib/atproto/client';
import { getCache, setCache } from '$lib/server/cache';
import { listRecords, resolveIdentity } from '$lib/lens/repo';
import { tidToMs } from '$lib/lens/scope';
import { FAMILIES, type FieldGuide, type FieldShape, type Specimen } from '$lib/fieldguide';

// Each plate is drawn from real records: the field shapes from a sample of my
// own, and the spread from the relay's index of which repos hold a
// collection. The relay only gives a count here, never a list of who.

const TTL_MS = 6 * 60 * 60 * 1000;
const SAMPLE = 50;
const RELAY = 'https://relay1.us-east.bsky.network';
const RELAY_PAGE = 2000;
const RELAY_PAGES = 5;
const MINE_PAGES = 5;

const ISO = /^\d{4}-\d\d-\d\dT\d\d:\d\d/;

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    const inner = value.length ? typeOf(value[0]) : 'unknown';
    return `${inner}[]`;
  }
  if (typeof value === 'string') {
    if (ISO.test(value)) return 'datetime';
    if (value.startsWith('at://')) return 'at-uri';
    if (value.startsWith('did:')) return 'did';
    if (/^https?:\/\//.test(value)) return 'uri';
    if (/^[234567a-z]{13}$/.test(value)) return 'tid';
    return 'string';
  }
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'object') {
    const o = value as Record<string, unknown>;
    if (o.$type === 'blob') return 'blob';
    if (typeof o.uri === 'string' && typeof o.cid === 'string' && Object.keys(o).length === 2) return 'strongRef';
    if (typeof o.$link === 'string') return 'cid-link';
    return 'object';
  }
  return typeof value;
}

// Someone else's identifier in an example becomes a placeholder. The plate is
// about the shape of my records, not about who they mention.
function sanitise(value: string) {
  return value.replace(/did:(plc|web):[a-z0-9.:%-]+/gi, (did) => (did === AUTHOR_DID ? 'did:…me' : 'did:…'));
}

function exampleOf(value: unknown, type: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (type === 'object' || type.endsWith('[]') || type === 'strongRef') {
    if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`;
    if (type === 'strongRef') return sanitise(String((value as { uri: string }).uri));
    return undefined;
  }
  if (type === 'blob') {
    const blob = value as { mimeType?: string; size?: number };
    return `${blob.mimeType ?? 'blob'}${blob.size ? `, ${Math.round(blob.size / 1024)} KB` : ''}`;
  }
  const text = sanitise(String(value)).replace(/\s+/g, ' ').trim();
  return text.length > 64 ? `${text.slice(0, 63)}…` : text;
}

function inferFields(values: Record<string, unknown>[]): FieldShape[] {
  type Acc = { types: Map<string, number>; seen: number; example?: unknown; children?: Record<string, unknown>[] };
  const top = new Map<string, Acc>();
  for (const value of values) {
    for (const [key, field] of Object.entries(value)) {
      if (key === '$type') continue;
      const acc: Acc = top.get(key) ?? { types: new Map(), seen: 0 };
      const type = typeOf(field);
      acc.types.set(type, (acc.types.get(type) ?? 0) + 1);
      acc.seen++;
      if (acc.example === undefined && field !== '' && field !== null) acc.example = field;
      if (type === 'object') (acc.children ??= []).push(field as Record<string, unknown>);
      if (type === 'object[]') (acc.children ??= []).push(...(field as Record<string, unknown>[]));
      top.set(key, acc);
    }
  }

  const fields: FieldShape[] = [];
  const order = [...top.entries()].sort(
    (a, b) => b[1].seen - a[1].seen || a[0].localeCompare(b[0])
  );
  for (const [name, acc] of order) {
    const type = [...acc.types.entries()].sort((a, b) => b[1] - a[1])[0][0];
    fields.push({ name, type, presence: acc.seen / values.length, example: exampleOf(acc.example, type), depth: 0 });
    // One level of nesting is enough to see the shape.
    if (acc.children?.length) {
      for (const child of inferFields(acc.children).slice(0, 8)) {
        fields.push({ ...child, depth: 1 });
      }
    }
  }
  return fields;
}

async function countMine(pds: string, nsid: string) {
  let n = 0;
  let cursor: string | undefined;
  let newest: Record<string, unknown>[] = [];
  let lastKey: string | undefined;
  for (let page = 0; page < MINE_PAGES; page++) {
    const res = await listRecords(pds, AUTHOR_DID, nsid, { limit: 100, cursor });
    if (page === 0) newest = res.records.slice(0, SAMPLE).map((r) => r.value);
    if (page === 0) lastKey = res.records[0]?.uri.split('/').at(-1);
    n += res.records.length;
    cursor = res.cursor;
    if (!cursor || res.records.length < 100) return { n, capped: false, newest, lastKey };
  }
  return { n, capped: true, newest, lastKey };
}

async function oldestKey(pds: string, nsid: string) {
  const res = await xrpc<{ records: { uri: string; value: Record<string, unknown> }[] }>(
    pds,
    'xrpc/com.atproto.repo.listRecords',
    { repo: AUTHOR_DID, collection: nsid, limit: 1, reverse: 'true' }
  );
  return res.records[0];
}

async function countNetwork(nsid: string) {
  let n = 0;
  let cursor: string | undefined;
  for (let page = 0; page < RELAY_PAGES; page++) {
    const res = await xrpc<{ repos: unknown[]; cursor?: string }>(
      RELAY,
      'xrpc/com.atproto.sync.listReposByCollection',
      { collection: nsid, limit: RELAY_PAGE, cursor }
    );
    n += res.repos.length;
    cursor = res.cursor;
    if (!cursor || res.repos.length < RELAY_PAGE) return { n, capped: false };
  }
  return { n, capped: true };
}

const whenOf = (key: string | undefined, value?: Record<string, unknown>) => {
  const ms = key ? tidToMs(key) : null;
  if (ms) return new Date(ms).toISOString();
  // Otherwise the record's own timestamp: createdAt, or the first field
  // that looks like a date (readAt, publishedAt…).
  const at =
    value?.createdAt ?? Object.values(value ?? {}).find((v) => typeof v === 'string' && ISO.test(v));
  return typeof at === 'string' ? at : undefined;
};

async function loadSpecimen(pds: string, nsid: string, note: string, plate: number, have: Set<string>): Promise<Specimen | null> {
  if (!have.has(nsid)) return null;
  const [mine, oldest, network] = await Promise.all([
    countMine(pds, nsid),
    oldestKey(pds, nsid).catch(() => undefined),
    countNetwork(nsid).catch(() => undefined)
  ]);
  if (!mine.newest.length) return null;
  return {
    nsid,
    note,
    plate,
    fields: inferFields(mine.newest),
    mine: mine.n,
    mineCapped: mine.capped,
    firstSeen: whenOf(oldest?.uri.split('/').at(-1), oldest?.value),
    lastSeen: whenOf(mine.lastKey, mine.newest[0]),
    network: network?.n,
    networkCapped: network?.capped
  };
}

export async function loadFieldGuide(): Promise<FieldGuide | null> {
  if (!AUTHOR_DID) return null;
  const cached = getCache<FieldGuide>('fieldguide');
  if (cached) return cached;

  const identity = await resolveIdentity(AUTHOR_DID);
  const have = new Set(identity.collections);
  let plate = 0;
  const plan = FAMILIES.map((family) => ({
    family,
    specimens: family.specimens.map((s) => ({ ...s, plate: ++plate }))
  }));

  const families = await Promise.all(
    plan.map(async ({ family, specimens }) => {
      const loaded = await Promise.all(
        specimens.map((s) => loadSpecimen(identity.pds, s.nsid, s.note, s.plate, have).catch(() => null))
      );
      return {
        ...family,
        collections: identity.collections.filter((c) => family.namespaces.some((ns) => c.startsWith(`${ns}.`))).length,
        specimens: loaded.filter((s): s is Specimen => s !== null)
      };
    })
  );

  // Number the plates that made it, in order.
  const kept = families.filter((f) => f.specimens.length);
  let n = 0;
  for (const f of kept) for (const s of f.specimens) s.plate = ++n;

  const guide: FieldGuide = {
    families: kept,
    plates: n,
    asOf: new Date().toISOString()
  };
  setCache('fieldguide', guide, TTL_MS);
  return guide;
}
