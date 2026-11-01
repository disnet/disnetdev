// Push a local markdown file into the studio as a draft, or pull a studio
// draft down to a file. Drafts are DRAFT_COLLECTION_NSID records on the
// author's PDS, the same ones /admin reads and writes, so a pushed draft shows
// up in the studio's drafts list and is published from there with the usual
// Publish button. This script never publishes.
//
//   node --env-file=.env scripts/studio-draft.mjs push <file.md> [--dry-run]
//   node --env-file=.env scripts/studio-draft.mjs pull <rkey> <file.md>
//   node --env-file=.env scripts/studio-draft.mjs list
//
// File format: markdown with frontmatter `title`, `slug` (optional, defaults
// to the file name), `description`, `tags`, `coverImage`. Local images
// (![alt](img/x.png), relative to the file) are uploaded as blobs and
// rewritten to blob:<cid>, the form the studio editor inserts.
//
// After the first push the draft's `rkey` is written into the file's
// frontmatter, so pushing again updates the same draft instead of making a
// new one. A draft that has already been published is never overwritten.
//
// Env: AUTHOR_DID, DRAFT_COLLECTION_NSID (from .env), ATP_IDENTIFIER and
// ATP_APP_PASSWORD (an app password). ATP_SERVICE optionally pins the PDS URL;
// otherwise it is resolved from the DID document. STUDIO_URL defaults to
// https://www.disnetdev.com.

import { AtpAgent } from '@atproto/api';
import matter from 'gray-matter';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function studioUrl(rkey) {
  const base = (process.env.STUDIO_URL?.trim() || 'https://www.disnetdev.com').replace(/\/+$/, '');
  return `${base}/admin/edit/draft/${rkey}`;
}

function parseTags(value) {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  return list.map((t) => String(t).trim()).filter(Boolean);
}

// Local images referenced from the markdown. Remote URLs and blob: refs are
// left alone.
function findLocalImages(markdown) {
  const refs = new Set();
  for (const m of markdown.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    const target = m[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) continue;
    refs.add(target);
  }
  return [...refs];
}

async function loadFile(file) {
  const raw = await readFile(file, 'utf8');
  const { data, content } = matter(raw);
  const errors = [];

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (!title) errors.push('frontmatter `title` is required');

  const slug = String(data.slug ?? basename(file, '.md')).trim();
  if (!SLUG_RE.test(slug)) errors.push(`slug "${slug}" must be lowercase words joined by hyphens`);

  const markdown = content.replace(/^\s*\n/, '').trimEnd() + '\n';
  if (!markdown.trim()) errors.push('body is empty');

  const dir = dirname(file);
  const images = findLocalImages(markdown).map((ref) => ({ ref, path: resolve(dir, ref) }));
  const cover = data.coverImage ? { ref: String(data.coverImage), path: resolve(dir, String(data.coverImage)) } : null;
  for (const img of [...images, ...(cover ? [cover] : [])]) {
    if (!MIME_BY_EXT[extname(img.path).toLowerCase()]) errors.push(`unsupported image type: ${img.ref}`);
    else if (!existsSync(img.path)) errors.push(`image not found: ${img.ref}`);
  }

  return {
    raw,
    data,
    content,
    rkey: typeof data.rkey === 'string' ? data.rkey.trim() : '',
    title,
    slug,
    description: typeof data.description === 'string' ? data.description.trim() : '',
    tags: parseTags(data.tags),
    markdown,
    images,
    cover,
    errors
  };
}

async function resolvePds(did) {
  if (process.env.ATP_SERVICE?.trim()) return process.env.ATP_SERVICE.trim();
  const url = did.startsWith('did:web:')
    ? `https://${did.slice('did:web:'.length)}/.well-known/did.json`
    : `https://plc.directory/${did}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not resolve ${did}: ${res.status}`);
  const doc = await res.json();
  const svc = doc.service?.find((s) => s.id === '#atproto_pds' || s.id === `${did}#atproto_pds`);
  if (!svc?.serviceEndpoint) throw new Error(`No PDS endpoint in DID document for ${did}`);
  return svc.serviceEndpoint;
}

async function login() {
  const did = requiredEnv('AUTHOR_DID');
  const agent = new AtpAgent({ service: await resolvePds(did) });
  await agent.login({
    identifier: requiredEnv('ATP_IDENTIFIER'),
    password: requiredEnv('ATP_APP_PASSWORD')
  });
  if (agent.session?.did !== did) {
    throw new Error(`Logged in as ${agent.session?.did}, expected AUTHOR_DID ${did}`);
  }
  return { agent, did };
}

async function getDraft(agent, did, collection, rkey) {
  try {
    const res = await agent.com.atproto.repo.getRecord({ repo: did, collection, rkey });
    return res.data.value;
  } catch (err) {
    if (err?.error === 'RecordNotFound' || err?.status === 400) return null;
    throw err;
  }
}

async function uploadImage(agent, path) {
  const bytes = await readFile(path);
  const res = await agent.com.atproto.repo.uploadBlob(bytes, {
    encoding: MIME_BY_EXT[extname(path).toLowerCase()]
  });
  const blob = res.data.blob;
  return {
    $type: 'blob',
    ref: { $link: typeof blob.ref === 'string' ? blob.ref : blob.ref.toString() },
    mimeType: blob.mimeType,
    size: blob.size
  };
}

async function push(file, { dryRun }) {
  if (!file) throw new Error('Usage: studio-draft.mjs push <file.md> [--dry-run]');
  const draft = await loadFile(resolve(file));
  console.log(`${file}: "${draft.title}" -> slug ${draft.slug}${draft.rkey ? `, updates draft ${draft.rkey}` : ', new draft'}`);
  for (const e of draft.errors) console.log(`  - ${e}`);
  if (draft.errors.length) throw new Error('Draft is invalid; nothing was pushed.');
  if (dryRun) {
    console.log('Dry run: nothing pushed.');
    return;
  }

  const collection = requiredEnv('DRAFT_COLLECTION_NSID');
  const { agent, did } = await login();

  const existing = draft.rkey ? await getDraft(agent, did, collection, draft.rkey) : null;
  if (draft.rkey && !existing) throw new Error(`Draft ${draft.rkey} no longer exists in the studio. Remove \`rkey\` from the file to push it as a new draft.`);
  if (existing?.sourceDocumentRkey) {
    throw new Error(`Draft ${draft.rkey} has already been published. Edit the post in the studio instead.`);
  }

  let markdown = draft.markdown;
  const embeddedBlobs = [];
  for (const img of draft.images) {
    const blob = await uploadImage(agent, img.path);
    embeddedBlobs.push(blob);
    const escaped = img.ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    markdown = markdown.replace(new RegExp(`\\]\\(\\s*<?${escaped}>?`, 'g'), `](blob:${blob.ref.$link}`);
  }
  // Keep blobs the studio already references (images inserted there) so the
  // PDS doesn't garbage-collect them.
  for (const blob of existing?.embeddedBlobs ?? []) {
    if (markdown.includes(`blob:${blob.ref?.$link}`) && !embeddedBlobs.some((b) => b.ref.$link === blob.ref.$link)) {
      embeddedBlobs.push(blob);
    }
  }
  const coverImage = draft.cover ? await uploadImage(agent, draft.cover.path) : existing?.coverImage;

  const now = new Date().toISOString();
  const record = {
    $type: collection,
    title: draft.title,
    slug: draft.slug,
    ...(draft.description ? { description: draft.description } : {}),
    ...(draft.tags.length ? { tags: draft.tags } : {}),
    markdown,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...(coverImage ? { coverImage } : {}),
    ...(embeddedBlobs.length ? { embeddedBlobs } : {})
  };

  let rkey = draft.rkey;
  if (rkey) {
    await agent.com.atproto.repo.putRecord({ repo: did, collection, rkey, validate: false, record });
  } else {
    const res = await agent.com.atproto.repo.createRecord({ repo: did, collection, validate: false, record });
    rkey = res.data.uri.split('/').at(-1);
    await writeFile(resolve(file), matter.stringify(draft.content, { ...draft.data, rkey }));
  }

  console.log(`Pushed draft ${rkey}`);
  console.log(studioUrl(rkey));
}

async function pull(rkey, file) {
  if (!rkey || !file) throw new Error('Usage: studio-draft.mjs pull <rkey> <file.md>');
  const collection = requiredEnv('DRAFT_COLLECTION_NSID');
  const { agent, did } = await login();
  const value = await getDraft(agent, did, collection, rkey);
  if (!value) throw new Error(`No draft ${rkey}`);
  const data = {
    title: value.title,
    slug: value.slug,
    ...(value.description ? { description: value.description } : {}),
    ...(value.tags?.length ? { tags: value.tags } : {}),
    rkey
  };
  await writeFile(resolve(file), matter.stringify(`\n${value.markdown}`, data));
  console.log(`Wrote ${file}${value.sourceDocumentRkey ? ' (note: this draft is already published)' : ''}`);
}

async function list() {
  const collection = requiredEnv('DRAFT_COLLECTION_NSID');
  const { agent, did } = await login();
  const rows = [];
  let cursor;
  do {
    const res = await agent.com.atproto.repo.listRecords({ repo: did, collection, limit: 100, cursor });
    for (const r of res.data.records) rows.push({ rkey: r.uri.split('/').at(-1), ...r.value });
    cursor = res.data.cursor;
  } while (cursor);
  rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  for (const r of rows) {
    console.log(`${r.rkey}  ${String(r.updatedAt).slice(0, 10)}  ${r.sourceDocumentRkey ? 'published' : 'draft    '}  ${r.title}`);
  }
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const dryRun = rest.includes('--dry-run');
  const args = rest.filter((a) => !a.startsWith('--'));
  if (cmd === 'push') return push(args[0], { dryRun });
  if (cmd === 'pull') return pull(args[0], args[1]);
  if (cmd === 'list') return list();
  throw new Error('Usage: studio-draft.mjs push <file.md> [--dry-run] | pull <rkey> <file.md> | list');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
