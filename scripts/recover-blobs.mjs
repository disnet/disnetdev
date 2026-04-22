import { AtpAgent } from '@atproto/api';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname);
const PUBLIC_DIR = join(REPO_ROOT, 'public');
const MANIFEST_PATH = join(REPO_ROOT, 'scripts/import-manifest.json');

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml'
};

function parseArgs(argv) {
  const args = { dryRun: false };
  for (const a of argv) {
    if (a === '--dry-run') args.dryRun = true;
    else throw new Error(`Unknown arg: ${a}`);
  }
  return args;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optionalEnv(name) {
  return process.env[name]?.trim() || '';
}

async function prompt(question) {
  const rl = createInterface({ input, output });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function resolvePdsUrlFromDid(did) {
  let url;
  if (did.startsWith('did:plc:')) {
    url = `https://plc.directory/${did}`;
  } else if (did.startsWith('did:web:')) {
    const parts = did.replace('did:web:', '').split(':').map(decodeURIComponent);
    const host = parts[0];
    const path = parts.slice(1);
    url = path.length === 0
      ? `https://${host}/.well-known/did.json`
      : `https://${host}/${path.join('/')}/did.json`;
  } else {
    throw new Error(`Unsupported DID method: ${did}`);
  }
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`DID resolution failed for ${did}: ${res.status}`);
  const doc = await res.json();
  const svc = doc.service?.find((s) =>
    s.type === 'AtprotoPersonalDataServer' || s.id?.endsWith('#atproto_pds')
  );
  const endpoint = typeof svc?.serviceEndpoint === 'string' ? svc.serviceEndpoint : svc?.serviceEndpoint?.uri;
  if (!endpoint) throw new Error(`No PDS endpoint for ${did}`);
  return endpoint.replace(/\/$/, '');
}

function blobRefWithType(blobRef) {
  return {
    $type: 'blob',
    ref: { $link: blobRef.ref.$link },
    mimeType: blobRef.mimeType,
    size: blobRef.size
  };
}

function rkeyFromUri(uri) {
  const parts = uri.split('/');
  return parts[parts.length - 1];
}

async function reuploadBlob(agent, imgPath, expectedCid, dryRun) {
  const fsPath = join(PUBLIC_DIR, imgPath.replace(/^\//, ''));
  if (!existsSync(fsPath)) {
    throw new Error(`Image file not found on disk: ${imgPath} (looked in ${fsPath})`);
  }
  const ext = extname(fsPath).toLowerCase();
  const mimeType = MIME_BY_EXT[ext];
  if (!mimeType) throw new Error(`Unsupported image extension: ${ext} (${imgPath})`);
  const bytes = await readFile(fsPath);

  if (dryRun) {
    return { mimeType, size: bytes.length, cid: expectedCid, skipped: true };
  }

  const res = await agent.com.atproto.repo.uploadBlob(bytes, { encoding: mimeType });
  const cid = typeof res.data.blob.ref === 'string' ? res.data.blob.ref : res.data.blob.ref.toString();
  if (cid !== expectedCid) {
    throw new Error(`CID mismatch for ${imgPath}: manifest=${expectedCid} pds=${cid}`);
  }
  return { mimeType: res.data.blob.mimeType, size: res.data.blob.size, cid };
}

async function rewriteRecord(agent, did, rkey, uploadedImages, dryRun) {
  const got = await agent.com.atproto.repo.getRecord({
    repo: did,
    collection: 'site.standard.document',
    rkey
  });
  const value = got.data.value;
  const embeddedBlobs = Object.values(uploadedImages).map(blobRefWithType);

  const newRecord = {
    ...value,
    $type: 'site.standard.document',
    embeddedBlobs
  };

  if (dryRun) {
    return { skipped: true, embeddedCount: embeddedBlobs.length };
  }

  const put = await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: 'site.standard.document',
    rkey,
    validate: false,
    record: newRecord
  });
  return { cid: put.data.cid, embeddedCount: embeddedBlobs.length };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const authorDid = requiredEnv('AUTHOR_DID');

  const envId = optionalEnv('ATPROTO_BOOTSTRAP_IDENTIFIER') || optionalEnv('BSKY_IDENTIFIER');
  const identifier = envId || (await prompt('Bluesky handle: '));
  const envPw = optionalEnv('ATPROTO_BOOTSTRAP_APP_PASSWORD') || optionalEnv('BSKY_APP_PASSWORD');
  const password = envPw || (await prompt('ATProto app password: '));

  const service = await resolvePdsUrlFromDid(authorDid);
  console.log(`PDS: ${service}`);
  const agent = new AtpAgent({ service });
  const login = await agent.login({ identifier, password });
  const did = login.data.did;
  if (did !== authorDid) throw new Error(`Logged in DID ${did} does not match AUTHOR_DID ${authorDid}`);
  console.log(`Authenticated as ${did}${args.dryRun ? ' (dry run)' : ''}`);

  const raw = await readFile(MANIFEST_PATH, 'utf8');
  const manifest = JSON.parse(raw);
  const blobs = manifest.blobs ?? {};
  const posts = manifest.posts ?? {};

  console.log(`\n[1/2] Re-uploading ${Object.keys(blobs).length} blob(s)...`);
  for (const [imgPath, blobRef] of Object.entries(blobs)) {
    const expected = blobRef.ref.$link;
    const result = await reuploadBlob(agent, imgPath, expected, args.dryRun);
    console.log(`  ok  ${imgPath} (${result.size} bytes) -> ${result.cid}`);
  }

  const postsWithImages = Object.entries(posts).filter(
    ([, entry]) => entry.uploadedImages && Object.keys(entry.uploadedImages).length > 0
  );
  console.log(`\n[2/2] Rewriting ${postsWithImages.length} post record(s) with $type:'blob' embeddedBlobs...`);
  for (const [sourcePath, entry] of postsWithImages) {
    const rkey = rkeyFromUri(entry.docUri);
    const result = await rewriteRecord(agent, did, rkey, entry.uploadedImages, args.dryRun);
    console.log(`  ok  ${sourcePath} rkey=${rkey} embeds=${result.embeddedCount}${result.cid ? ` newCid=${result.cid}` : ''}`);
  }

  if (args.dryRun) {
    console.log('\n(dry run — no PDS writes performed)');
  } else {
    console.log('\nDone.');
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
