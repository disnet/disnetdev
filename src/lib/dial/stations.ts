import type { AppGroup } from '$lib/lens/apps';

// The dial is a shortwave band laid over the repo. Every app that has written
// to it is a station, placed in NSID order so neighbouring namespaces sit next
// to each other (app.bsky, app.skyreader, … site.standard). Client-safe.

export const BAND_START = 88;
export const BAND_END = 108;

// How a station's records are set when it comes in. Each app gets the
// register that suits what it writes rather than one generic list.
export type Register = 'essay' | 'transcript' | 'reading' | 'log' | 'specimen';

export type Station = {
  key: string;
  name: string;
  home?: string;
  authority: string;
  collections: string[];
  freq: number;
  register: Register;
};

const REGISTERS: [RegExp, Register][] = [
  [/^(site\.standard|com\.disnetdev\.blog|pub\.leaflet|blog\.pckt|app\.offprint)/, 'essay'],
  [/^(app\.bsky|chat\.bsky|space\.roomy|net\.anisota)/, 'transcript'],
  [/^(app\.skyreader|com\.at-rss|network\.cosmik|at\.margin|social\.popfeed|fyi\.requested)/, 'reading'],
  [/^(com\.disnetdev\.radial|dev\.radl|com\.disnetdev\.atplan|sh\.tangled|dev\.skyboard|dev\.disnet)/, 'log']
];

function registerFor(collections: string[]): Register {
  const votes = new Map<Register, number>();
  for (const nsid of collections) {
    const hit = REGISTERS.find(([pattern]) => pattern.test(nsid));
    const register = hit ? hit[1] : 'specimen';
    votes.set(register, (votes.get(register) ?? 0) + 1);
  }
  return [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'specimen';
}

const authorityOf = (nsid: string) => nsid.split('.').slice(0, 2).join('.');

export function layoutStations(groups: AppGroup[]): Station[] {
  const sorted = groups
    .map((g) => ({ ...g, authority: authorityOf([...g.collections].sort()[0] ?? g.key) }))
    .sort((a, b) => a.authority.localeCompare(b.authority) || a.name.localeCompare(b.name));
  const step = (BAND_END - BAND_START) / Math.max(sorted.length, 1);
  return sorted.map((g, i) => ({
    key: g.key,
    name: g.name,
    home: g.home,
    authority: g.authority,
    collections: g.collections,
    // Stations sit on odd tenths, the way FM channels do.
    freq: Math.round((BAND_START + step * (i + 0.5)) * 10) / 10,
    register: registerFor(g.collections)
  }));
}

export function formatFreq(freq: number) {
  return freq.toFixed(1);
}
