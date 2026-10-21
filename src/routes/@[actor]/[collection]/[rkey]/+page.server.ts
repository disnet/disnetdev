import { error } from '@sveltejs/kit';
import { HIDDEN_COLLECTIONS, appFor } from '$lib/lens/apps';
import { isNsid, isRkey } from '$lib/lens/paths';
import { blobUrl, getRecord } from '$lib/lens/repo';
import { describeRecord } from '$lib/lens/specimen';

export async function load({ params, parent }) {
  const { identity } = await parent();
  const { collection, rkey } = params;

  if (!isNsid(collection) || !isRkey(rkey) || HIDDEN_COLLECTIONS.has(collection)) {
    throw error(404, 'Not a record');
  }

  const record = await getRecord(identity.pds, identity.did, collection, rkey);
  if (!record) throw error(404, `No record at ${collection}/${rkey}`);

  return {
    collection,
    rkey,
    app: appFor(collection),
    record,
    specimen: describeRecord(collection, record.value, identity),
    // Blob links in the field tree point straight at the owner's PDS.
    blobBase: blobUrl(identity.pds, identity.did, '')
  };
}
