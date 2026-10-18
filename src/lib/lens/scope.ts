import { groupCollections } from './apps';

// Geometry for the repo scope: a radar where angle is the app (and, inside
// its sector, the collection) and distance from centre is age. Now sits at
// the centre; two years out is the rim. Client-safe.

const TID_ALPHABET = '234567abcdefghijklmnopqrstuvwxyz';
const HOUR_MS = 60 * 60 * 1000;
export const SCOPE_HORIZON_HOURS = 2 * 365 * 24;
const CENTRE_CLEARANCE = 0.05;
const SECTOR_GAP = 0.035;

// Record keys are usually TIDs: 53 bits of microseconds since the epoch,
// base32-sortable. That gives every record a timestamp without reading it.
export function tidToMs(rkey: string): number | null {
  if (!/^[234567a-z]{13}$/.test(rkey)) return null;
  let value = 0n;
  for (const char of rkey) {
    const digit = TID_ALPHABET.indexOf(char);
    if (digit < 0) return null;
    value = (value << 5n) | BigInt(digit);
  }
  const ms = Number(value >> 10n) / 1000;
  // Reject keys that merely look like TIDs.
  return ms > Date.UTC(2000, 0, 1) && ms < Date.now() + 24 * HOUR_MS ? ms : null;
}

export function radiusForAge(ageMs: number) {
  const hours = Math.max(0, ageMs / HOUR_MS);
  const t = Math.log1p(hours) / Math.log1p(SCOPE_HORIZON_HOURS);
  return CENTRE_CLEARANCE + (1 - CENTRE_CLEARANCE) * Math.min(1, t);
}

export const SCOPE_RINGS = [
  { label: '1d', hours: 24 },
  { label: '1w', hours: 24 * 7 },
  { label: '1mo', hours: 24 * 30 },
  { label: '1y', hours: 24 * 365 }
].map((ring) => ({ ...ring, r: radiusForAge(ring.hours * HOUR_MS) }));

export type Sector = {
  name: string;
  start: number;
  end: number;
  lanes: Map<string, { centre: number; width: number }>;
};

// Angles run clockwise from twelve o'clock. Bigger apps get wider sectors,
// but only by the square root, so Radial's fifty lexicons don't swallow
// everything else.
export function layoutSectors(collections: string[]): Sector[] {
  const groups = groupCollections(collections);
  const weights = groups.map((g) => Math.sqrt(g.collections.length) + 0.6);
  const total = weights.reduce((a, b) => a + b, 0);
  const usable = Math.PI * 2 - SECTOR_GAP * groups.length;

  let angle = -Math.PI / 2;
  return groups.map((group, i) => {
    const width = (weights[i] / total) * usable;
    const start = angle + SECTOR_GAP / 2;
    const laneWidth = width / group.collections.length;
    const lanes = new Map(
      group.collections.map((nsid, j) => [
        nsid,
        { centre: start + laneWidth * (j + 0.5), width: laneWidth }
      ])
    );
    angle += width + SECTOR_GAP;
    return { name: group.name, start, end: start + width, lanes };
  });
}

// A stable pseudo-random number in [-0.5, 0.5) so a record keeps its place
// in its lane across reloads.
export function jitter(key: string, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000 - 0.5;
}

export function callsign(where: string, uri: string) {
  const app = where.split('·')[0].trim().replace(/[^a-z]/gi, '');
  const prefix = (app.slice(0, 1) + app.slice(1).replace(/[aeiou]/gi, '')).slice(0, 3).toUpperCase();
  const rkey = uri.split('/').at(-1) ?? '';
  return `${prefix || 'REC'}-${rkey.slice(-4).toUpperCase()}`;
}
