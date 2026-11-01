// Publish markdown drafts from drafts/ to the site.standard publication on the
// author's PDS. This is the git-side twin of the studio's Publish button
// (src/routes/admin/edit/draft/[rkey]/+page.server.ts): same record shape,
// same /blog/<slug> path, same markpub embed.
//
//   node --env-file=.env scripts/publish-drafts.mjs            # publish
//   node --env-file=.env scripts/publish-drafts.mjs --dry-run  # validate only, no network
//
// Env: AUTHOR_DID, PUBLICATION_AT_URI (from .env), plus ATP_IDENTIFIER and
// ATP_APP_PASSWORD for a real run. ATP_SERVICE optionally pins the PDS URL;
// otherwise it is resolved from the DID document.
//
// Each published draft is moved to content/published/<slug>.md with the new
// record's uri stamped into its frontmatter, so drafts/ only ever holds
// unpublished work. Running twice is safe: a draft whose path is already
// published under the same title is treated as done and just moved.

import { AtpAgent } from '@atproto/api';
import matter from 'gray-matter';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';

const REPO_ROOT = resolve(new URL('..', import.meta.url).pathname);
const DRAFTS_DIR = join(REPO_ROOT, 'drafts');
const PUBLISHED_DIR = join(REPO_ROOT, 'content/published');
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

// Kept in step with src/lib/markdown/plaintext.ts.
function markdownToPlaintext(markdown) {
  return markdown
    .replace(/^\[\^[^\]]+\]:.*(?:\n(?: {2,}|\t).*)*/gm, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[\^[^\]]+\]/g, ' ')
    .replace(/^>\s?/gm, '')
    .replace(/[*_#~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Kept in step with buildMarkpubContent in src/lib/atproto/content.ts.
function buildMarkpubContent(markdown) {
  return {
    $type: 'at.markpub.markdown',
    text: { $type: 'at.markpub.text', markdown },
    flavor: 'gfm',
    renderingRules: 'marked'
  };
}

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function parseTags(value) {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  return list.map((t) => String(t).trim()).filter(Boolean);
}

// Local images referenced from the markdown: ![alt](relative/path.png).
// Remote URLs and already-uploaded blob: refs are left alone.
function findLocalImages(markdown) {
  const refs = new Set();
  for (const m of markdown.matchAll(/!\[[^\]]*\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)) {
    const target = m[1];
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(target)) continue;
    refs.add(target);
  }
  return [...refs];
}

async function loadDraft(file) {
  const raw = await readFile(file, 'utf8');
  const { data, content } = matter(raw);
  const name = relative(REPO_ROOT, file);
  const errors = [];

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (!title) errors.push('frontmatter `title` is required');

  const slug = String(data.slug ?? basename(file, '.md')).trim();
  if (!SLUG_RE.test(slug)) errors.push(`slug "${slug}" must be lowercase words joined by hyphens`);

  const markdown = content.replace(/^\s*\n/, '').trimEnd() + '\n';
  if (!markdown.trim()) errors.push('post body is empty');
  const todos = markdown.match(/<!--\s*TODO\b/gi)?.length ?? 0;
  if (todos) errors.push(`${todos} unresolved <!-- TODO --> marker(s)`);

  const dir = dirname(file);
  const images = findLocalImages(markdown).map((ref) => ({ ref, path: resolve(dir, ref) }));
  const cover = data.coverImage ? { ref: String(data.coverImage), path: resolve(dir, String(data.coverImage)) } : null;
  for (const img of [...images, ...(cover ? [cover] : [])]) {
    if (!MIME_BY_EXT[extname(img.path).toLowerCase()]) errors.push(`unsupported image type: ${img.ref}`);
    else if (!existsSync(img.path)) errors.push(`image not found: ${img.ref}`);
  }

  return {
    file,
    name,
    raw,
    data,
    hold: data.draft === true,
    title,
    slug,
    path: `/blog/${slug}`,
    description: typeof data.description === 'string' ? data.description.trim() : '',
    tags: parseTags(data.tags),
    markdown,
    images,
    cover,
    errors
  };
}

async function listDraftFiles() {
  if (!existsSync(DRAFTS_DIR)) return [];
  const entries = await readdir(DRAFTS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.md') && e.name.toLowerCase() !== 'readme.md')
    .map((e) => join(DRAFTS_DIR, e.name))
    .sort();
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

async function listPublishedByPath(agent, did) {
  const byPath = new Map();
  let cursor;
  do {
    const res = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: 'site.standard.document',
      limit: 100,
      cursor
    });
    for (const r of res.data.records) {
      const path = r.value?.path;
      if (typeof path === 'string') byPath.set(path.replace(/\/+$/, '') || '/', r);
    }
    cursor = res.data.cursor;
  } while (cursor);
  return byPath;
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

async function archiveDraft(draft, uri, publishedAt) {
  await mkdir(PUBLISHED_DIR, { recursive: true });
  const target = join(PUBLISHED_DIR, `${draft.slug}.md`);
  const { content } = matter(draft.raw);
  const data = { ...draft.data, slug: draft.slug, uri, publishedAt };
  delete data.draft;
  await writeFile(target, matter.stringify(content, data));
  // Images stay where they are; the published record carries them as blobs.
  await unlink(draft.file);
  return relative(REPO_ROOT, target);
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const files = await listDraftFiles();
  if (files.length === 0) {
    console.log('No drafts to publish.');
    return;
  }

  const drafts = await Promise.all(files.map(loadDraft));
  const slugs = new Map();
  for (const d of drafts) {
    if (slugs.has(d.slug)) d.errors.push(`slug "${d.slug}" is also used by ${slugs.get(d.slug)}`);
    slugs.set(d.slug, d.name);
  }

  let failed = false;
  for (const d of drafts) {
    const state = d.errors.length ? 'INVALID' : d.hold ? 'held (draft: true)' : 'ready';
    console.log(`${d.name} -> ${d.path}  [${state}]`);
    for (const e of d.errors) console.log(`  - ${e}`);
    if (d.errors.length) failed = true;
  }
  if (failed) throw new Error('Some drafts are invalid; nothing was published.');

  const ready = drafts.filter((d) => !d.hold);
  if (dryRun || ready.length === 0) {
    console.log(dryRun ? 'Dry run: nothing published.' : 'Nothing ready to publish.');
    return;
  }

  const did = requiredEnv('AUTHOR_DID');
  const site = requiredEnv('PUBLICATION_AT_URI');
  const agent = new AtpAgent({ service: await resolvePds(did) });
  await agent.login({
    identifier: requiredEnv('ATP_IDENTIFIER'),
    password: requiredEnv('ATP_APP_PASSWORD')
  });
  if (agent.session?.did !== did) {
    throw new Error(`Logged in as ${agent.session?.did}, expected AUTHOR_DID ${did}`);
  }

  const published = await listPublishedByPath(agent, did);
  const archived = [];

  for (const d of ready) {
    const existing = published.get(d.path);
    if (existing) {
      if (existing.value?.title === d.title) {
        console.log(`${d.name}: already published as ${existing.uri}; archiving.`);
        archived.push(await archiveDraft(d, existing.uri, existing.value.publishedAt));
        continue;
      }
      throw new Error(`${d.name}: ${d.path} is already taken by "${existing.value?.title}" (${existing.uri})`);
    }

    let markdown = d.markdown;
    const embeddedBlobs = [];
    for (const img of d.images) {
      const blob = await uploadImage(agent, img.path);
      embeddedBlobs.push(blob);
      const escaped = img.ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      markdown = markdown.replace(new RegExp(`\\]\\(\\s*<?${escaped}>?`, 'g'), `](blob:${blob.ref.$link}`);
    }
    const coverImage = d.cover ? await uploadImage(agent, d.cover.path) : undefined;

    const now = new Date().toISOString();
    const record = {
      $type: 'site.standard.document',
      site,
      title: d.title,
      publishedAt: now,
      path: d.path,
      ...(d.description ? { description: d.description } : {}),
      ...(d.tags.length ? { tags: d.tags } : {}),
      ...(coverImage ? { coverImage } : {}),
      ...(embeddedBlobs.length ? { embeddedBlobs } : {}),
      content: buildMarkpubContent(markdown),
      textContent: markdownToPlaintext(markdown),
      updatedAt: now
    };

    const res = await agent.com.atproto.repo.createRecord({
      repo: did,
      collection: 'site.standard.document',
      validate: false,
      record
    });
    console.log(`${d.name}: published ${res.data.uri}`);
    archived.push(await archiveDraft(d, res.data.uri, now));
  }

  console.log(`Archived: ${archived.join(', ')}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
