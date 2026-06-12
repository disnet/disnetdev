import { restoreOAuthAgent, SUBSCRIPTION_COLLECTION_NSID } from '$lib/atproto/auth';
import { xrpc } from '$lib/atproto/client';
import { getPublication } from '$lib/atproto/publication';
import { getPdsUrlForDid } from '$lib/atproto/service';

type ListRecordsResponse = {
  records: Array<{ uri: string; value: { publication?: string } }>;
};

async function listSubscriptions(did: string): Promise<ListRecordsResponse['records']> {
  const pdsUrl = await getPdsUrlForDid(did);
  const response = await xrpc<ListRecordsResponse>(pdsUrl, 'xrpc/com.atproto.repo.listRecords', {
    repo: did,
    collection: SUBSCRIPTION_COLLECTION_NSID,
    limit: 100
  });
  return response.records;
}

async function hasExistingSubscription(did: string, publication: string): Promise<boolean> {
  try {
    const records = await listSubscriptions(did);
    return records.some((record) => record.value.publication === publication);
  } catch {
    // listRecords is a best-effort dedup; if it fails we simply write a record.
    return false;
  }
}

/**
 * Write a `site.standard.graph.subscription` record into the visitor's own
 * repo, pointing at this site's publication. Idempotent on a best-effort
 * basis: if the visitor already has a subscription to this publication we
 * leave it untouched.
 */
export async function createSubscription(did: string) {
  const { uri: publication } = await getPublication();
  if (!publication) {
    throw new Error('Publication AT-URI is not configured; cannot record a subscription.');
  }

  if (await hasExistingSubscription(did, publication)) return;

  const agent = await restoreOAuthAgent(did);
  await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: SUBSCRIPTION_COLLECTION_NSID,
    record: {
      $type: SUBSCRIPTION_COLLECTION_NSID,
      publication,
      createdAt: new Date().toISOString()
    }
  });
}

/**
 * Delete the visitor's subscription record(s) for this publication from their
 * own repo, using the OAuth session retained from the subscribe step.
 */
export async function removeSubscription(did: string) {
  const { uri: publication } = await getPublication();
  if (!publication) return;

  const records = await listSubscriptions(did);
  const targets = records.filter((record) => record.value.publication === publication);
  if (!targets.length) return;

  const agent = await restoreOAuthAgent(did);
  for (const record of targets) {
    const rkey = record.uri.split('/').pop();
    if (!rkey) continue;
    await agent.com.atproto.repo.deleteRecord({
      repo: did,
      collection: SUBSCRIPTION_COLLECTION_NSID,
      rkey
    });
  }
}
