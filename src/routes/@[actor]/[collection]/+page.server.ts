import { error } from '@sveltejs/kit';
import { HIDDEN_COLLECTIONS, appFor } from '$lib/lens/apps';
import { isNsid, rkeyOf } from '$lib/lens/paths';
import { listRecords } from '$lib/lens/repo';
import { describeRecord } from '$lib/lens/specimen';

const PAGE_SIZE = 30;

export async function load({ params, parent, url }) {
  const { identity } = await parent();
  const { collection } = params;

  if (
    !isNsid(collection) ||
    HIDDEN_COLLECTIONS.has(collection) ||
    !identity.collections.includes(collection)
  ) {
    throw error(404, `No ${collection} records here`);
  }

  const cursor = url.searchParams.get('cursor') ?? undefined;
  const response = await listRecords(identity.pds, identity.did, collection, {
    limit: PAGE_SIZE,
    cursor
  });

  return {
    collection,
    app: appFor(collection),
    records: response.records.map((record) => ({
      rkey: rkeyOf(record.uri),
      uri: record.uri,
      specimen: describeRecord(collection, record.value, identity)
    })),
    cursor: response.records.length === PAGE_SIZE ? response.cursor : undefined,
    isFirstPage: !cursor
  };
}
