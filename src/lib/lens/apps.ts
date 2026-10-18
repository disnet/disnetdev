// Which app a collection belongs to. NSIDs are reverse-DNS, so the authority
// is a decent guess; this table puts friendlier names on the ones we know.
// Anything not listed still renders, grouped under its reversed authority.

type KnownApp = { prefix: string; name: string; home?: string };

const KNOWN_APPS: KnownApp[] = [
  { prefix: 'app.bsky', name: 'Bluesky', home: 'https://bsky.app' },
  { prefix: 'chat.bsky', name: 'Bluesky chat', home: 'https://bsky.app' },
  { prefix: 'app.skyreader', name: 'Skyreader', home: 'https://skyreader.app' },
  { prefix: 'com.at-rss', name: 'Skyreader (before the rename)', home: 'https://skyreader.app' },
  { prefix: 'site.standard', name: 'standard.site', home: 'https://standard.site' },
  { prefix: 'network.cosmik', name: 'Semble', home: 'https://semble.so' },
  { prefix: 'sh.tangled', name: 'Tangled', home: 'https://tangled.org' },
  { prefix: 'pub.leaflet', name: 'Leaflet', home: 'https://leaflet.pub' },
  { prefix: 'at.margin', name: 'Margin', home: 'https://margin.at' },
  { prefix: 'dev.skyboard', name: 'Skyboard', home: 'https://skyboard.dev' },
  { prefix: 'com.disnetdev.radial', name: 'Radial', home: 'https://radl.app' },
  { prefix: 'dev.radl', name: 'Radial', home: 'https://radl.app' },
  { prefix: 'com.disnetdev.atplan', name: 'atplan' },
  { prefix: 'com.disnetdev.blog', name: 'disnetdev studio', home: 'https://disnetdev.com' },
  { prefix: 'com.disnetdev.flint', name: 'Flint', home: 'https://www.flintnote.com' },
  { prefix: 'dev.disnet.atrfc', name: 'RFCs on the Atmosphere' },
  { prefix: 'fyi.requested', name: 'Requested', home: 'https://requested.fyi' },
  { prefix: 'blog.pckt', name: 'pckt', home: 'https://pckt.blog' },
  { prefix: 'social.popfeed', name: 'Popfeed', home: 'https://popfeed.social' },
  { prefix: 'app.offprint', name: 'Offprint', home: 'https://offprint.app' },
  { prefix: 'community.lexicon', name: 'Lexicon Community', home: 'https://lexicon.community' },
  { prefix: 'place.stream', name: 'Streamplace', home: 'https://stream.place' },
  { prefix: 'space.roomy', name: 'Roomy', home: 'https://roomy.space' },
  { prefix: 'net.anisota', name: 'Anisota', home: 'https://anisota.net' }
];

// Collections the lens won't show even though they're public on the PDS.
// Unpublished drafts aren't meant to be read yet, and a block list on display
// helps nobody.
export const HIDDEN_COLLECTIONS = new Set(['com.disnetdev.blog.draft', 'app.bsky.graph.block']);

export type AppGroup = {
  key: string;
  name: string;
  domain: string;
  home?: string;
  collections: string[];
};

function authorityDomain(nsid: string) {
  return nsid.split('.').slice(0, 2).reverse().join('.');
}

export function appFor(nsid: string): Omit<AppGroup, 'collections'> {
  const known = KNOWN_APPS.filter(
    (app) => nsid === app.prefix || nsid.startsWith(`${app.prefix}.`)
  ).sort((a, b) => b.prefix.length - a.prefix.length)[0];

  if (known) {
    return {
      key: known.name,
      name: known.name,
      domain: authorityDomain(nsid),
      home: known.home
    };
  }

  const domain = authorityDomain(nsid);
  return { key: domain, name: domain, domain };
}

export function groupCollections(collections: string[]): AppGroup[] {
  const groups = new Map<string, AppGroup>();
  for (const nsid of collections) {
    if (HIDDEN_COLLECTIONS.has(nsid)) continue;
    const app = appFor(nsid);
    const group = groups.get(app.key) ?? { ...app, collections: [] };
    group.collections.push(nsid);
    groups.set(app.key, group);
  }
  return [...groups.values()].sort((a, b) => b.collections.length - a.collections.length);
}

// The part of an NSID that names the record, relative to its app: for
// `sh.tangled.repo.pull` under Tangled that's `repo.pull`.
export function shortName(nsid: string) {
  const known = KNOWN_APPS.filter((app) => nsid.startsWith(`${app.prefix}.`)).sort(
    (a, b) => b.prefix.length - a.prefix.length
  )[0];
  const prefix = known?.prefix ?? nsid.split('.').slice(0, 2).join('.');
  return nsid.slice(prefix.length + 1);
}

// The app whose home page is at this URL's host, if we know it.
export function appForHome(url: string | undefined) {
  if (!url) return undefined;
  try {
    const host = new URL(url).host.replace(/^www\./, '');
    return KNOWN_APPS.find((app) => app.home && new URL(app.home).host.replace(/^www\./, '') === host)?.name;
  } catch {
    return undefined;
  }
}
