import { AUTHOR_DID } from '$lib/config';
import { xrpc } from '$lib/atproto/client';
import {
  cardRecordSchema,
  collectionRecordSchema,
  collectionLinkRecordSchema
} from '$lib/atproto/schema';
import { getPdsUrlForDid } from '$lib/atproto/service';
import { getCache, setCache } from '$lib/server/cache';
import type { CardSummary, CollectionSummary } from '$lib/types/blog';

const CARD_COLLECTION = 'network.cosmik.card';
const COLLECTION_COLLECTION = 'network.cosmik.collection';
const COLLECTION_LINK_COLLECTION = 'network.cosmik.collectionLink';

const LIBRARY_CACHE_KEY = 'library:index';
const LIBRARY_TTL_MS = 5 * 60 * 1000;

type ListRecordsResponse = {
  records: Array<{
    uri: string;
    cid: string;
    value: unknown;
  }>;
  cursor?: string;
};

type LibraryIndex = {
  cards: CardSummary[];
  collections: CollectionSummary[];
  cardsByCollection: Record<string, string[]>;
};

function rkeyFromUri(uri: string) {
  return uri.split('/').at(-1) ?? '';
}

async function listAllRecords(pdsUrl: string, repo: string, collection: string) {
  const out: Array<{ uri: string; cid: string; value: unknown }> = [];
  let cursor: string | undefined;

  do {
    const response = await xrpc<ListRecordsResponse>(pdsUrl, 'xrpc/com.atproto.repo.listRecords', {
      repo,
      collection,
      limit: 100,
      cursor
    });

    out.push(...response.records);
    cursor = response.cursor;
  } while (cursor);

  return out;
}

async function buildLibraryIndex(): Promise<LibraryIndex> {
  const cached = getCache<LibraryIndex>(LIBRARY_CACHE_KEY);
  if (cached) return cached;

  if (!AUTHOR_DID) {
    const empty: LibraryIndex = { cards: [], collections: [], cardsByCollection: {} };
    setCache(LIBRARY_CACHE_KEY, empty, LIBRARY_TTL_MS);
    return empty;
  }

  const pdsUrl = await getPdsUrlForDid(AUTHOR_DID);

  const [rawCards, rawCollections, rawLinks] = await Promise.all([
    listAllRecords(pdsUrl, AUTHOR_DID, CARD_COLLECTION),
    listAllRecords(pdsUrl, AUTHOR_DID, COLLECTION_COLLECTION),
    listAllRecords(pdsUrl, AUTHOR_DID, COLLECTION_LINK_COLLECTION)
  ]);

  const cardByUri = new Map<string, CardSummary>();
  for (const item of rawCards) {
    const parsed = cardRecordSchema.safeParse(item.value);
    if (!parsed.success) continue;
    if (parsed.data.type !== 'URL') continue;

    const content = parsed.data.content as { url: string; metadata?: Record<string, string> };
    const url = content.url ?? parsed.data.url;
    if (!url) continue;

    const metadata = content.metadata ?? {};
    const createdAt =
      parsed.data.createdAt ?? (typeof metadata.retrievedAt === 'string' ? metadata.retrievedAt : '');
    if (!createdAt) continue;

    cardByUri.set(item.uri, {
      rkey: rkeyFromUri(item.uri),
      uri: item.uri,
      url,
      title: metadata.title,
      description: metadata.description,
      author: metadata.author,
      siteName: metadata.siteName,
      publishedDate: metadata.publishedDate,
      createdAt,
      collectionRkeys: []
    });
  }

  const collectionByUri = new Map<string, CollectionSummary>();
  for (const item of rawCollections) {
    const parsed = collectionRecordSchema.safeParse(item.value);
    if (!parsed.success) continue;

    collectionByUri.set(item.uri, {
      rkey: rkeyFromUri(item.uri),
      uri: item.uri,
      name: parsed.data.name,
      description: parsed.data.description,
      accessType: parsed.data.accessType,
      cardCount: 0,
      updatedAt: parsed.data.updatedAt,
      createdAt: parsed.data.createdAt
    });
  }

  const cardsByCollection: Record<string, string[]> = {};

  for (const item of rawLinks) {
    const parsed = collectionLinkRecordSchema.safeParse(item.value);
    if (!parsed.success) continue;

    const collection = collectionByUri.get(parsed.data.collection.uri);
    const card = cardByUri.get(parsed.data.card.uri);
    if (!collection || !card) continue;

    collection.cardCount += 1;
    card.collectionRkeys.push(collection.rkey);

    if (!cardsByCollection[collection.rkey]) {
      cardsByCollection[collection.rkey] = [];
    }
    cardsByCollection[collection.rkey].push(card.uri);
  }

  const cards = [...cardByUri.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const collections = [...collectionByUri.values()].sort((a, b) => {
    const aTime = a.updatedAt ?? a.createdAt ?? '';
    const bTime = b.updatedAt ?? b.createdAt ?? '';
    return bTime.localeCompare(aTime);
  });

  const index: LibraryIndex = { cards, collections, cardsByCollection };
  setCache(LIBRARY_CACHE_KEY, index, LIBRARY_TTL_MS);
  return index;
}

export async function listCards(): Promise<CardSummary[]> {
  const index = await buildLibraryIndex();
  return index.cards;
}

export async function listCollections(): Promise<CollectionSummary[]> {
  const index = await buildLibraryIndex();
  return index.collections;
}

export async function getCollectionByRkey(
  rkey: string
): Promise<{ collection: CollectionSummary; cards: CardSummary[] } | null> {
  const index = await buildLibraryIndex();
  const collection = index.collections.find((c) => c.rkey === rkey);
  if (!collection) return null;

  const cardUris = new Set(index.cardsByCollection[rkey] ?? []);
  const cards = index.cards.filter((c) => cardUris.has(c.uri));

  return { collection, cards };
}
