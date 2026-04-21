import { AtpAgent } from '@atproto/api';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

async function resolvePdsUrlFromDid(did) {
  let url;

  if (did.startsWith('did:plc:')) {
    url = `https://plc.directory/${did}`;
  } else if (did.startsWith('did:web:')) {
    const parts = did.replace('did:web:', '').split(':').map(decodeURIComponent);
    const host = parts[0];
    const path = parts.slice(1);
    url =
      path.length === 0
        ? `https://${host}/.well-known/did.json`
        : `https://${host}/${path.join('/')}/did.json`;
  } else {
    throw new Error(`Unsupported DID method for resolution: ${did}`);
  }

  const response = await fetch(url, {
    headers: { accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve DID document for ${did}: ${response.status} ${response.statusText}`);
  }

  const document = await response.json();
  const service = document.service?.find(
    (entry) =>
      entry.type === 'AtprotoPersonalDataServer' ||
      entry.id?.endsWith('#atproto_pds') ||
      entry.id === '#atproto_pds'
  );

  const endpoint =
    typeof service?.serviceEndpoint === 'string'
      ? service.serviceEndpoint
      : service?.serviceEndpoint?.uri;

  if (!endpoint) {
    throw new Error(`No AtprotoPersonalDataServer service found for DID ${did}`);
  }

  return endpoint.replace(/\/$/, '');
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optionalEnv(name, fallback = '') {
  return process.env[name]?.trim() || fallback;
}

async function promptForValue(prompt) {
  const rl = createInterface({ input, output });

  try {
    return (await rl.question(prompt)).trim();
  } finally {
    rl.close();
  }
}

async function main() {
  const envIdentifier = optionalEnv('ATPROTO_BOOTSTRAP_IDENTIFIER') || optionalEnv('BSKY_IDENTIFIER');
  const identifier = envIdentifier || (await promptForValue('Bluesky handle: '));
  const envPassword = optionalEnv('ATPROTO_BOOTSTRAP_APP_PASSWORD') || optionalEnv('BSKY_APP_PASSWORD');
  const password = envPassword || (await promptForValue('ATProto app password: '));
  const siteUrl = requiredEnv('PUBLIC_SITE_URL');
  const siteName = requiredEnv('SITE_NAME');
  const siteDescription = optionalEnv('SITE_DESCRIPTION');
  const authorDid = requiredEnv('AUTHOR_DID');

  if (!identifier) {
    throw new Error('Provide a Bluesky handle via prompt or ATPROTO_BOOTSTRAP_IDENTIFIER');
  }

  if (!password) {
    throw new Error('Provide an app password via prompt or ATPROTO_BOOTSTRAP_APP_PASSWORD');
  }

  const service = await resolvePdsUrlFromDid(authorDid);
  console.log(`Resolved PDS for ${authorDid}: ${service}`);

  const agent = new AtpAgent({ service });
  const login = await agent.login({
    identifier,
    password
  });

  const did = login.data.did;
  console.log(`Authenticated as ${did}`);

  if (authorDid && did !== authorDid) {
    throw new Error(`Authenticated DID ${did} does not match AUTHOR_DID ${authorDid}`);
  }

  const existing = await agent.com.atproto.repo.listRecords({
    repo: did,
    collection: 'site.standard.publication',
    limit: 100
  });

  const matchingUrlRecords = existing.data.records.filter((record) => record.value?.url === siteUrl);

  if (existing.data.records.length > 0) {
    console.log('\nFound existing publication record(s):');
    for (const record of existing.data.records) {
      const recordUrl = typeof record.value?.url === 'string' ? ` (${record.value.url})` : '';
      console.log(`- ${record.uri}${recordUrl}`);
    }
  }

  if (matchingUrlRecords.length > 0) {
    console.log(`\nFound existing publication record(s) for url ${siteUrl}:`);
    for (const record of matchingUrlRecords) {
      console.log(`- ${record.uri}`);
    }

    console.log('\nUse one of the above as PUBLICATION_AT_URI.');
    return;
  }

  if (existing.data.records.length > 0) {
    console.log(`\nNo existing publication record matched ${siteUrl}; creating a new one.`);
  }

  const record = {
    $type: 'site.standard.publication',
    url: siteUrl,
    name: siteName,
    ...(siteDescription ? { description: siteDescription } : {})
  };

  const created = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: 'site.standard.publication',
    validate: false,
    record
  });

  console.log('\nCreated publication record successfully.');
  console.log(`URI: ${created.data.uri}`);
  console.log(`CID: ${created.data.cid}`);
  console.log('\nAdd this to your .env:');
  console.log(`PUBLICATION_AT_URI=${created.data.uri}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
