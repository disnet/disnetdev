// Tools exposed on /mcp. They read and write the same draft records as the
// studio, through the author's stored atproto OAuth session. There is
// deliberately no publish tool: drafts are published from the studio.

import slugify from '@sindresorhus/slugify';
import { restoreOAuthAgent } from '$lib/atproto/auth';
import { collectEmbeddedBlobCids } from '$lib/atproto/blobs';
import { createDraft, getDraft, listDrafts, updateDraft } from '$lib/atproto/drafts';
import { DRAFT_COLLECTION_NSID, getSiteUrl } from '$lib/config';
import { getKeyValueStore } from '$lib/server/kv';
import type { BlobRef, DraftRecord } from '$lib/types/blog';

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
// Uploaded blobs are remembered so a later save can list them in
// embeddedBlobs, which keeps the PDS from garbage-collecting them and carries
// them through to the published record.
const BLOB_TTL_SECONDS = 60 * 60 * 24 * 7;

export class ToolError extends Error {}

type Args = Record<string, unknown>;

type Tool = {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: Record<string, boolean>;
  run: (args: Args, did: string) => Promise<unknown>;
};

function studioUrl(rkey: string) {
  return `${getSiteUrl().replace(/\/+$/, '')}/admin/edit/draft/${rkey}`;
}

function str(args: Args, key: string, { required = false } = {}) {
  const value = args[key];
  if (value === undefined || value === null) {
    if (required) throw new ToolError(`\`${key}\` is required`);
    return undefined;
  }
  if (typeof value !== 'string') throw new ToolError(`\`${key}\` must be a string`);
  return value;
}

function tagList(args: Args) {
  const value = args.tags;
  if (value === undefined || value === null) return undefined;
  const list = Array.isArray(value) ? value : String(value).split(',');
  return list.map((t) => String(t).trim()).filter(Boolean);
}

function checkSlug(slug: string) {
  if (!SLUG_RE.test(slug)) {
    throw new ToolError(`slug "${slug}" must be lowercase letters, numbers and hyphens`);
  }
  return slug;
}

async function resolveEmbeddedBlobs(markdown: string, existing: BlobRef[] = []) {
  const known = new Map(existing.map((b) => [b.ref.$link, b]));
  const kv = getKeyValueStore();
  const blobs: BlobRef[] = [];
  const missing: string[] = [];
  for (const cid of collectEmbeddedBlobCids(markdown)) {
    const blob = known.get(cid) ?? (await kv.get<BlobRef>(`mcp:blob:${cid}`));
    if (blob) blobs.push(blob);
    else missing.push(cid);
  }
  return { blobs, missing };
}

function summarize(rkey: string, record: DraftRecord) {
  return {
    rkey,
    title: record.title,
    slug: record.slug,
    description: record.description,
    tags: record.tags,
    updatedAt: record.updatedAt,
    published: Boolean(record.sourceDocumentRkey),
    studioUrl: studioUrl(rkey)
  };
}

const draftFields = {
  title: { type: 'string', description: 'Post title.' },
  markdown: {
    type: 'string',
    description:
      'Post body in GitHub-flavored markdown, without the title. Footnotes ([^1]) are supported. Images go in as ![alt](blob:<cid>) using a cid from upload_image.'
  },
  slug: {
    type: 'string',
    description: 'URL slug: the post publishes at /blog/<slug>. Lowercase words joined by hyphens.'
  },
  description: { type: 'string', description: 'One sentence for feeds, cards and the post header.' },
  tags: { type: 'array', items: { type: 'string' }, description: 'Tags, e.g. ["atproto", "macros"].' }
};

export const tools: Tool[] = [
  {
    name: 'list_drafts',
    title: 'List drafts',
    description:
      "List the drafts in Tim's studio, newest first. Published drafts are left out unless include_published is true.",
    inputSchema: {
      type: 'object',
      properties: { include_published: { type: 'boolean' } }
    },
    annotations: { readOnlyHint: true },
    async run(args) {
      const drafts = await listDrafts({ fresh: true });
      return drafts
        .filter((d) => args.include_published === true || !d.record.sourceDocumentRkey)
        .map((d) => summarize(d.rkey, d.record));
    }
  },
  {
    name: 'get_draft',
    title: 'Get draft',
    description:
      'Fetch one draft, including its full markdown. Always fetch before revising: Tim may have edited it in the studio.',
    inputSchema: {
      type: 'object',
      properties: { rkey: { type: 'string' } },
      required: ['rkey']
    },
    annotations: { readOnlyHint: true },
    async run(args) {
      const draft = await getDraft(str(args, 'rkey', { required: true })!, { fresh: true });
      if (!draft) throw new ToolError('No draft with that rkey');
      return { ...summarize(draft.rkey, draft.record), markdown: draft.record.markdown };
    }
  },
  {
    name: 'create_draft',
    title: 'Create draft',
    description:
      "Create a new draft in Tim's studio. It is not published; Tim reviews and publishes it from the studio. Returns the studio link to give him.",
    inputSchema: {
      type: 'object',
      properties: draftFields,
      required: ['title', 'markdown']
    },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
    async run(args, did) {
      const title = str(args, 'title', { required: true })!.trim();
      if (!title) throw new ToolError('`title` is empty');
      const markdown = str(args, 'markdown', { required: true })!;
      const slug = checkSlug(str(args, 'slug')?.trim() || slugify(title));
      const description = str(args, 'description')?.trim();
      const tags = tagList(args);
      const { blobs, missing } = await resolveEmbeddedBlobs(markdown);

      const now = new Date().toISOString();
      const created = await createDraft(did, {
        $type: DRAFT_COLLECTION_NSID,
        title,
        slug,
        ...(description ? { description } : {}),
        ...(tags?.length ? { tags } : {}),
        markdown,
        createdAt: now,
        updatedAt: now,
        ...(blobs.length ? { embeddedBlobs: blobs } : {})
      });
      const rkey = created.uri.split('/').at(-1)!;
      return {
        rkey,
        slug,
        studioUrl: studioUrl(rkey),
        ...(missing.length ? { warning: `Unknown image cids (not uploaded through upload_image): ${missing.join(', ')}` } : {})
      };
    }
  },
  {
    name: 'update_draft',
    title: 'Update draft',
    description:
      'Update an unpublished draft. Only the fields you pass change; markdown replaces the whole body. Fetch with get_draft first so you do not overwrite edits Tim made in the studio. Published drafts cannot be changed here.',
    inputSchema: {
      type: 'object',
      properties: { rkey: { type: 'string' }, ...draftFields },
      required: ['rkey']
    },
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true },
    async run(args, did) {
      const rkey = str(args, 'rkey', { required: true })!;
      const existing = await getDraft(rkey, { fresh: true });
      if (!existing) throw new ToolError('No draft with that rkey');
      if (existing.record.sourceDocumentRkey) {
        throw new ToolError('This draft has already been published. Tim edits published posts in the studio.');
      }

      const title = str(args, 'title')?.trim() || existing.record.title;
      const markdown = str(args, 'markdown') ?? existing.record.markdown;
      const slug = checkSlug(str(args, 'slug')?.trim() || existing.record.slug);
      const description = args.description !== undefined ? str(args, 'description')?.trim() : existing.record.description;
      const tags = args.tags !== undefined ? tagList(args) : existing.record.tags;
      const { blobs, missing } = await resolveEmbeddedBlobs(markdown, existing.record.embeddedBlobs);

      const { description: _d, tags: _t, embeddedBlobs: _e, ...rest } = existing.record;
      await updateDraft(did, rkey, {
        ...rest,
        $type: DRAFT_COLLECTION_NSID,
        title,
        slug,
        ...(description ? { description } : {}),
        ...(tags?.length ? { tags } : {}),
        markdown,
        updatedAt: new Date().toISOString(),
        ...(blobs.length ? { embeddedBlobs: blobs } : {})
      });
      return {
        rkey,
        slug,
        studioUrl: studioUrl(rkey),
        ...(missing.length ? { warning: `Unknown image cids (not uploaded through upload_image): ${missing.join(', ')}` } : {})
      };
    }
  },
  {
    name: 'upload_image',
    title: 'Upload image',
    description:
      "Upload an image to Tim's PDS for use in a draft, either from a public URL or as base64 data. Returns markdown to paste into the draft body. JPEG, PNG, WebP or GIF, up to 4MB.",
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Public http(s) URL of the image.' },
        data_base64: { type: 'string', description: 'Image bytes, base64-encoded. Use instead of url.' },
        mime_type: { type: 'string', description: 'Required with data_base64, e.g. image/png.' },
        alt: { type: 'string', description: 'Alt text for the returned markdown.' }
      }
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
    async run(args, did) {
      const url = str(args, 'url');
      const data = str(args, 'data_base64');
      let bytes: Uint8Array;
      let mimeType: string;

      if (url) {
        if (!/^https?:\/\//i.test(url)) throw new ToolError('`url` must be http(s)');
        const res = await fetch(url);
        if (!res.ok) throw new ToolError(`Fetching the image failed: ${res.status}`);
        mimeType = (res.headers.get('content-type') ?? '').split(';')[0].trim();
        bytes = new Uint8Array(await res.arrayBuffer());
      } else if (data) {
        mimeType = str(args, 'mime_type', { required: true })!;
        bytes = new Uint8Array(Buffer.from(data, 'base64'));
      } else {
        throw new ToolError('Pass either `url` or `data_base64`');
      }

      if (!IMAGE_MIME.has(mimeType)) throw new ToolError(`Unsupported image type: ${mimeType || 'unknown'}`);
      if (bytes.length === 0) throw new ToolError('Image is empty');
      if (bytes.length > MAX_IMAGE_BYTES) throw new ToolError('Image is larger than 4MB');

      const agent = await restoreOAuthAgent(did);
      const response = await agent.com.atproto.repo.uploadBlob(bytes, { encoding: mimeType });
      const blob = response.data.blob;
      const blobRef: BlobRef = {
        $type: 'blob',
        ref: { $link: typeof blob.ref === 'string' ? blob.ref : blob.ref.toString() },
        mimeType: blob.mimeType,
        size: blob.size
      };
      await getKeyValueStore().set(`mcp:blob:${blobRef.ref.$link}`, blobRef, { ttlSeconds: BLOB_TTL_SECONDS });

      const alt = (str(args, 'alt') ?? '').replace(/[[\]]/g, '');
      return {
        cid: blobRef.ref.$link,
        markdown: `![${alt}](blob:${blobRef.ref.$link})`,
        note: 'Save a draft that uses this image soon; unreferenced blobs are cleaned up by the PDS.'
      };
    }
  }
];

export function getTool(name: string) {
  return tools.find((t) => t.name === name);
}
