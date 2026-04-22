import { AtpAgent } from '@atproto/api';
import slugify from '@sindresorhus/slugify';
import matter from 'gray-matter';
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname);
const CONTENT_DIR = join(REPO_ROOT, 'content/blog');
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
  const args = { dryRun: false, limit: Infinity };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--limit') args.limit = parseInt(argv[++i], 10);
    else if (a.startsWith('--limit=')) args.limit = parseInt(a.slice('--limit='.length), 10);
    else throw new Error(`Unknown arg: ${a}`);
  }
  if (!Number.isFinite(args.limit) || args.limit <= 0) {
    if (!Number.isFinite(args.limit)) args.limit = Infinity;
    else throw new Error('--limit must be a positive integer');
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

function toDateString(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') return value.slice(0, 10);
  return '';
}

function toIsoDateTime(value) {
  const dateStr = toDateString(value);
  if (!dateStr) return '';
  return `${dateStr}T00:00:00.000Z`;
}

function buildSlug(date, title) {
  return `${date}-${slugify(title, { decamelize: false })}`;
}

function markdownToPlaintext(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/[*_#~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const IMAGE_REF_PATTERN = /!\[([^\]]*)\]\((\/[^)\s]+)(?:\s+"[^"]*")?\)/g;

function collectImageRefs(markdown) {
  const refs = new Set();
  for (const match of markdown.matchAll(IMAGE_REF_PATTERN)) {
    refs.add(match[2]);
  }
  return [...refs];
}

function filterTags(tags) {
  if (!Array.isArray(tags)) return undefined;
  const cleaned = tags.filter((t) => typeof t === 'string' && t !== 'posts' && t !== 'post' && t !== 'nav' && t !== 'all');
  return cleaned.length ? cleaned : undefined;
}

async function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) return { posts: {}, blobs: {} };
  const raw = await readFile(MANIFEST_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  return { posts: parsed.posts ?? {}, blobs: parsed.blobs ?? {} };
}

async function saveManifest(manifest) {
  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
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

function blobRefFromResponse(blob) {
  return {
    ref: { $link: typeof blob.ref === 'string' ? blob.ref : blob.ref.toString() },
    mimeType: blob.mimeType,
    size: blob.size
  };
}

async function uploadImage(agent, imgPath, { dryRun }) {
  const fsPath = join(PUBLIC_DIR, imgPath.replace(/^\//, ''));
  if (!existsSync(fsPath)) {
    throw new Error(`Image file not found on disk: ${imgPath} (looked in ${fsPath})`);
  }
  const ext = extname(fsPath).toLowerCase();
  const mimeType = MIME_BY_EXT[ext];
  if (!mimeType) throw new Error(`Unsupported image extension: ${ext} (${imgPath})`);
  const bytes = await readFile(fsPath);

  if (dryRun) {
    const sha = createHash('sha256').update(bytes).digest('hex').slice(0, 12);
    return { ref: { $link: `dryrun-${sha}` }, mimeType, size: bytes.length };
  }

  const res = await agent.com.atproto.repo.uploadBlob(bytes, { encoding: mimeType });
  return blobRefFromResponse(res.data.blob);
}

async function processPost(file, raw, { agent, did, publicationUri, manifest, dryRun }) {
  const { data, content } = matter(raw);
  const title = data.title;
  if (!title) throw new Error('Missing title');
  const date = toDateString(data.date);
  if (!date) throw new Error('Missing or unparseable date');
  const publishedAt = toIsoDateTime(data.date);
  const slug = buildSlug(date, title);
  const path = `/blog/${slug}`;

  const imageRefs = collectImageRefs(content);
  let markdown = content;
  const embeddedBlobs = [];
  const uploadedImages = {};

  for (const imgPath of imageRefs) {
    let blobRef = manifest.blobs[imgPath];
    if (!blobRef) {
      console.log(`    upload ${imgPath}`);
      blobRef = await uploadImage(agent, imgPath, { dryRun });
      manifest.blobs[imgPath] = blobRef;
    } else {
      console.log(`    reuse  ${imgPath} (cached CID ${blobRef.ref.$link})`);
    }
    uploadedImages[imgPath] = blobRef;
    embeddedBlobs.push(blobRef);
    const cid = blobRef.ref.$link;
    const escaped = imgPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    markdown = markdown.replace(new RegExp(`\\]\\(${escaped}`, 'g'), `](blob:${cid}`);
  }

  const record = {
    $type: 'site.standard.document',
    site: publicationUri,
    title: title.trim(),
    publishedAt,
    path,
    ...(typeof data.description === 'string' && data.description.trim()
      ? { description: data.description.trim() }
      : {}),
    ...(filterTags(data.tags) ? { tags: filterTags(data.tags) } : {}),
    content: {
      $type: 'dev.disnet.blog.content.markdown',
      markdown,
      sourceFormat: 'markdown'
    },
    textContent: markdownToPlaintext(markdown),
    ...(embeddedBlobs.length ? { embeddedBlobs } : {})
  };

  if (dryRun) {
    return {
      sourcePath: `content/blog/${file}`,
      slug,
      path,
      docUri: `at://${did}/site.standard.document/dryrun-${slug}`,
      docCid: 'dryrun',
      importedAt: new Date().toISOString(),
      uploadedImages
    };
  }

  const created = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: 'site.standard.document',
    validate: false,
    record
  });

  return {
    sourcePath: `content/blog/${file}`,
    slug,
    path,
    docUri: created.data.uri,
    docCid: created.data.cid,
    importedAt: new Date().toISOString(),
    uploadedImages
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const publicationUri = requiredEnv('PUBLICATION_AT_URI');
  const authorDid = requiredEnv('AUTHOR_DID');

  let agent;
  let did = authorDid;

  if (!args.dryRun) {
    const envId = optionalEnv('ATPROTO_BOOTSTRAP_IDENTIFIER') || optionalEnv('BSKY_IDENTIFIER');
    const identifier = envId || (await prompt('Bluesky handle: '));
    const envPw = optionalEnv('ATPROTO_BOOTSTRAP_APP_PASSWORD') || optionalEnv('BSKY_APP_PASSWORD');
    const password = envPw || (await prompt('ATProto app password: '));

    const service = await resolvePdsUrlFromDid(authorDid);
    console.log(`PDS: ${service}`);
    agent = new AtpAgent({ service });
    const login = await agent.login({ identifier, password });
    did = login.data.did;
    if (did !== authorDid) throw new Error(`Logged in DID ${did} does not match AUTHOR_DID ${authorDid}`);
    console.log(`Authenticated as ${did}`);
  } else {
    console.log('--dry-run: skipping PDS login and writes');
  }

  const manifest = await loadManifest();
  const allFiles = (await readdir(CONTENT_DIR))
    .filter((f) => f.endsWith('.md'))
    .sort();

  const candidates = [];
  for (const file of allFiles) {
    const fullPath = join(CONTENT_DIR, file);
    const s = await stat(fullPath);
    if (!s.isFile()) continue;
    const sourceKey = `content/blog/${file}`;
    if (manifest.posts[sourceKey]) continue;
    const raw = await readFile(fullPath, 'utf8');
    const { data } = matter(raw);
    if (!data.date) {
      console.warn(`skip ${file}: missing date`);
      continue;
    }
    candidates.push({ file, raw, date: toDateString(data.date) });
  }

  candidates.sort((a, b) => a.date.localeCompare(b.date));
  const toProcess = candidates.slice(0, args.limit);

  console.log(`\nFound ${candidates.length} unimported post(s); processing ${toProcess.length}.\n`);

  let imported = 0;
  for (const { file, raw } of toProcess) {
    console.log(`-> ${file}`);
    try {
      const entry = await processPost(file, raw, { agent, did, publicationUri, manifest, dryRun: args.dryRun });
      console.log(`   path: ${entry.path}`);
      console.log(`   uri:  ${entry.docUri}`);
      manifest.posts[entry.sourcePath] = entry;
      if (!args.dryRun) await saveManifest(manifest);
      imported++;
    } catch (err) {
      console.error(`   FAIL: ${err instanceof Error ? err.message : err}`);
      if (!args.dryRun) await saveManifest(manifest);
      throw err;
    }
  }

  if (args.dryRun) {
    console.log('\n(dry run — manifest not written)');
  } else {
    await saveManifest(manifest);
  }

  console.log(`\nDone. Imported ${imported} post(s). Remaining: ${candidates.length - imported}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
