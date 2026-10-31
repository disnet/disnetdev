import { restoreOAuthAgent } from '$lib/atproto/auth';
import { getBlobUrl, resolveInlineBlobUrls } from '$lib/atproto/blobs';
import { parseAtUri, xrpc } from '$lib/atproto/client';
import { buildMarkpubContent, getDocumentMarkdown } from '$lib/atproto/content';
import { publishedDocumentSchema } from '$lib/atproto/schema';
import { getPdsUrlForDid } from '$lib/atproto/service';
import { getSlugFromPath, normalizePath } from '$lib/atproto/utils';
import { renderMarkdown } from '$lib/markdown/render';
import { deleteCache, getCache, invalidateCache, setCache } from '$lib/server/cache';
import { requestSiteRebuild } from '$lib/server/rebuild';
import { getPublication } from './publication';
import type { DocumentSummary, FeedDocument, PostPageData, PublishedDocument } from '$lib/types/blog';

const DOCUMENTS_CACHE_KEY = 'documents:index';
const DOCUMENT_BY_PATH_PREFIX = 'documents:path:';
const DOCUMENTS_TTL_MS = 5 * 60 * 1000;

function invalidateDocumentCaches(path?: string) {
  deleteCache(DOCUMENTS_CACHE_KEY);
  invalidateCache(DOCUMENT_BY_PATH_PREFIX);

  if (path) {
    deleteCache(`${DOCUMENT_BY_PATH_PREFIX}${normalizePath(path)}`);
  }
}

type ListRecordsResponse = {
  records: Array<{
    uri: string;
    cid: string;
    value: unknown;
  }>;
  cursor?: string;
};

type StoredDocument = {
  uri: string;
  rkey: string;
  // Where this document actually resolves on the site. Usually the record's
  // own `path`, but see `documentPath` for the linkblog exception.
  path: string;
  linkblog: boolean;
  record: PublishedDocument;
};

// Skyreader writes its linkblog entries into `site.standard.document` with a
// root-level `/<rkey>` path, because nothing in `site.standard.publication`
// tells it where this site keeps documents. They are link posts rather than
// essays, so we serve them alongside the rest of the shares under /reading.
export const LINKBLOG_PATH_PREFIX = '/reading';

function isLinkblogRecord(record: PublishedDocument) {
  return Boolean(record.skyreaderLinkblog);
}

function documentPath(rkey: string, record: PublishedDocument) {
  if (isLinkblogRecord(record)) return `${LINKBLOG_PATH_PREFIX}/${rkey}`;
  return normalizePath(record.path ?? '/');
}

function sourceUrlOf(record: PublishedDocument) {
  const related = record.links?.find((link) => link.rel === 'related') ?? record.links?.[0];
  return related?.uri;
}

async function listDocumentRecords(): Promise<StoredDocument[]> {
  const cached = getCache<StoredDocument[]>(DOCUMENTS_CACHE_KEY);
  if (cached) return cached;

  const publication = await getPublication();
  const repoDid = publication.uri ? parseAtUri(publication.uri).repo : '';

  if (!repoDid) {
    setCache(DOCUMENTS_CACHE_KEY, [], DOCUMENTS_TTL_MS);
    return [];
  }

  const pdsUrl = await getPdsUrlForDid(repoDid);
  const all: StoredDocument[] = [];
  let cursor: string | undefined;

  do {
    const response = await xrpc<ListRecordsResponse>(pdsUrl, 'xrpc/com.atproto.repo.listRecords', {
      repo: repoDid,
      collection: 'site.standard.document',
      limit: 100,
      cursor
    });

    for (const item of response.records) {
      const record = publishedDocumentSchema.safeParse(item.value);
      if (!record.success) continue;
      if (publication.uri && record.data.site !== publication.uri) continue;
      if (!record.data.path) continue;

      const rkey = item.uri.split('/').at(-1) ?? '';

      all.push({
        uri: item.uri,
        rkey,
        path: documentPath(rkey, record.data),
        linkblog: isLinkblogRecord(record.data),
        record: {
          ...record.data,
          path: normalizePath(record.data.path)
        }
      });
    }

    cursor = response.cursor;
  } while (cursor);

  all.sort((a, b) => b.record.publishedAt.localeCompare(a.record.publishedAt));
  setCache(DOCUMENTS_CACHE_KEY, all, DOCUMENTS_TTL_MS);
  return all;
}

function toSummary({ uri, rkey, path, record }: StoredDocument): DocumentSummary {
  return {
    rkey,
    uri,
    path,
    slug: getSlugFromPath(path),
    title: record.title,
    description: record.description,
    tags: record.tags,
    publishedAt: record.publishedAt,
    createdAt: record.createdAt,
    sourceUrl: sourceUrlOf(record)
  };
}

// Essays only. Linkblog entries are listed by `listLinkblogDocuments` and
// deliberately kept out of the post index, the homepage, and the feed.
export async function listPublishedDocuments(): Promise<DocumentSummary[]> {
  const documents = await listDocumentRecords();
  return documents.filter((document) => !document.linkblog).map(toSummary);
}

export async function listLinkblogDocuments(): Promise<DocumentSummary[]> {
  const documents = await listDocumentRecords();
  return documents.filter((document) => document.linkblog).map(toSummary);
}

async function renderDocument(record: PublishedDocument, repoDid: string, pdsUrl: string) {
  const markdown = getDocumentMarkdown(record.content);
  if (markdown === null) {
    return {
      html: '',
      footnotes: []
    };
  }

  const rendered = await renderMarkdown(markdown);
  return {
    html: repoDid && pdsUrl ? resolveInlineBlobUrls(rendered.html, pdsUrl, repoDid) : rendered.html,
    footnotes:
      repoDid && pdsUrl
        ? rendered.footnotes.map((footnote) => ({
            ...footnote,
            html: resolveInlineBlobUrls(footnote.html, pdsUrl, repoDid)
          }))
        : rendered.footnotes
  };
}

export async function listPublishedDocumentsForFeed(): Promise<FeedDocument[]> {
  const [documents, publication] = await Promise.all([listDocumentRecords(), getPublication()]);
  const repoDid = publication.uri ? parseAtUri(publication.uri).repo : '';
  const pdsUrl = repoDid ? await getPdsUrlForDid(repoDid) : '';

  return Promise.all(
    documents
      .filter((document) => !document.linkblog)
      .map(async ({ uri, rkey, path, record }) => {
        const rendered = await renderDocument(record, repoDid, pdsUrl);
        const coverImageUrl =
          record.coverImage && repoDid && pdsUrl
            ? getBlobUrl(pdsUrl, repoDid, record.coverImage.ref.$link)
            : undefined;

        return {
          rkey,
          uri,
          path,
          slug: getSlugFromPath(path),
          title: record.title,
          description: record.description,
          tags: record.tags,
          updatedAt: record.updatedAt,
          publishedAt: record.publishedAt,
          html: rendered.html,
          coverImageUrl,
          coverImageAlt: record.title
        };
      })
  );
}

// Resolve any document by the path it actually serves at. `path` is the
// document's own declaration of where it lives, so this is the only lookup
// the public routes need.
export async function getPublishedDocumentByPath(path: string): Promise<PostPageData | null> {
  const expectedPath = normalizePath(path);
  const cacheKey = `${DOCUMENT_BY_PATH_PREFIX}${expectedPath}`;
  const cached = getCache<PostPageData | null>(cacheKey);
  if (cached) return cached;

  const documents = await listDocumentRecords();
  const match = documents.find((document) => document.path === expectedPath);

  if (!match || getDocumentMarkdown(match.record.content) === null) {
    setCache(cacheKey, null, DOCUMENTS_TTL_MS);
    return null;
  }

  const publication = await getPublication();
  const repoDid = publication.uri ? parseAtUri(publication.uri).repo : '';
  const pdsUrl = repoDid ? await getPdsUrlForDid(repoDid) : '';

  const rendered = await renderDocument(match.record, repoDid, pdsUrl);

  const coverImageUrl =
    match.record.coverImage && repoDid && pdsUrl
      ? getBlobUrl(pdsUrl, repoDid, match.record.coverImage.ref.$link)
      : undefined;

  const post: PostPageData = {
    uri: match.uri,
    rkey: match.rkey,
    path: match.path,
    slug: getSlugFromPath(match.path),
    sourceUrl: sourceUrlOf(match.record),
    createdAt: match.record.createdAt,
    title: match.record.title,
    description: match.record.description,
    tags: match.record.tags,
    updatedAt: match.record.updatedAt,
    publishedAt: match.record.publishedAt,
    html: rendered.html,
    footnotes: rendered.footnotes,
    coverImageUrl,
    coverImageAlt: match.record.title
  };

  setCache(cacheKey, post, DOCUMENTS_TTL_MS);
  return post;
}

// `/blog/<slug>` is served by the blog/[slug] route; every other document
// path falls through to the [...path] catch-all.
export function isBlogSlugPath(path: string) {
  return /^\/blog\/[^/]+$/.test(path);
}

export async function getPublishedDocumentBySlug(slug: string): Promise<PostPageData | null> {
  return getPublishedDocumentByPath(`/blog/${slug}`);
}

// A document whose declared `path` is not where we serve it, i.e. a linkblog
// entry. Those `/<rkey>` URLs already went out in the feed and sitemap, so keep
// them resolving instead of 404ing.
export async function getDocumentPathRedirect(path: string): Promise<string | null> {
  const normalizedPath = normalizePath(path);
  const documents = await listDocumentRecords();
  const match = documents.find(
    (document) => document.record.path === normalizedPath && document.path !== normalizedPath
  );

  return match?.path ?? null;
}

export async function getPublishedDocument(rkey: string): Promise<StoredDocument | null> {
  const documents = await listDocumentRecords();
  return documents.find((document) => document.rkey === rkey) ?? null;
}

export async function publishedPathExists(path: string, options?: { excludeRkey?: string }) {
  const documents = await listDocumentRecords();
  const normalizedPath = normalizePath(path);
  return documents.some(
    (document) => document.path === normalizedPath && document.rkey !== options?.excludeRkey
  );
}

export async function createPublishedDocument(did: string, record: PublishedDocument) {
  const publication = await getPublication();

  if (!publication.uri) {
    throw new Error('PUBLICATION_AT_URI is not configured');
  }

  const normalizedPath = normalizePath(record.path ?? '/');
  const agent = await restoreOAuthAgent(did);
  const response = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: 'site.standard.document',
    validate: false,
    record: {
      ...record,
      $type: 'site.standard.document',
      site: publication.uri,
      path: normalizedPath
    }
  });

  invalidateDocumentCaches(normalizedPath);
  await requestSiteRebuild(`published ${normalizedPath}`);
  return response.data;
}

export async function updatePublishedDocument(did: string, rkey: string, record: PublishedDocument) {
  const publication = await getPublication();

  if (!publication.uri) {
    throw new Error('PUBLICATION_AT_URI is not configured');
  }

  const normalizedPath = normalizePath(record.path ?? '/');
  const agent = await restoreOAuthAgent(did);
  const response = await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: 'site.standard.document',
    rkey,
    validate: false,
    record: {
      ...record,
      $type: 'site.standard.document',
      site: publication.uri,
      path: normalizedPath
    }
  });

  invalidateDocumentCaches(normalizedPath);
  await requestSiteRebuild(`updated ${normalizedPath}`);
  return response.data;
}

// One-time migration: rewrite legacy `dev.disnet.blog.content.markdown` embeds
// on published documents into the markpub.at format. Operates on the raw record
// value so every other field (bskyPostRef, coverImage, etc.) is preserved.
export async function migrateLegacyContentToMarkpub(did: string) {
  const agent = await restoreOAuthAgent(did);
  const collection = 'site.standard.document';
  const migrated: string[] = [];
  const skipped: string[] = [];
  let cursor: string | undefined;

  do {
    const response = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection,
      limit: 100,
      cursor
    });

    for (const item of response.data.records) {
      const value = item.value as Record<string, unknown> & {
        content?: { $type?: string; markdown?: string };
      };
      const rkey = item.uri.split('/').at(-1) ?? '';

      if (value.content?.$type !== 'dev.disnet.blog.content.markdown') {
        skipped.push(rkey);
        continue;
      }

      await agent.com.atproto.repo.putRecord({
        repo: did,
        collection,
        rkey,
        validate: false,
        record: {
          ...value,
          content: buildMarkpubContent(value.content.markdown ?? '')
        }
      });
      migrated.push(rkey);
    }

    cursor = response.data.cursor;
  } while (cursor);

  invalidateDocumentCaches();
  if (migrated.length > 0) await requestSiteRebuild('migrated legacy content');
  return { migrated, skipped };
}

export async function deletePublishedDocument(did: string, rkey: string) {
  const existing = await getPublishedDocument(rkey);
  const agent = await restoreOAuthAgent(did);

  await agent.com.atproto.repo.deleteRecord({
    repo: did,
    collection: 'site.standard.document',
    rkey
  });

  invalidateDocumentCaches(existing?.record.path);
  await requestSiteRebuild(`deleted ${existing?.record.path ?? rkey}`);
}
