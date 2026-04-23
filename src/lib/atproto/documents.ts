import { restoreOAuthAgent } from '$lib/atproto/auth';
import { getBlobUrl, resolveInlineBlobUrls } from '$lib/atproto/blobs';
import { parseAtUri, xrpc } from '$lib/atproto/client';
import { publishedDocumentSchema } from '$lib/atproto/schema';
import { getPdsUrlForDid } from '$lib/atproto/service';
import { getSlugFromPath, normalizePath } from '$lib/atproto/utils';
import { renderMarkdown } from '$lib/markdown/render';
import { deleteCache, getCache, invalidateCache, setCache } from '$lib/server/cache';
import { getPublication } from './publication';
import type { DocumentSummary, PostPageData, PublishedDocument } from '$lib/types/blog';

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
  record: PublishedDocument;
};

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

      all.push({
        uri: item.uri,
        rkey: item.uri.split('/').at(-1) ?? '',
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

export async function listPublishedDocuments(): Promise<DocumentSummary[]> {
  const documents = await listDocumentRecords();

  return documents.map(({ rkey, record }) => ({
    rkey,
    path: record.path ?? '/blog/untitled',
    slug: getSlugFromPath(record.path ?? '/blog/untitled'),
    title: record.title,
    description: record.description,
    tags: record.tags,
    publishedAt: record.publishedAt
  }));
}

export async function getPublishedDocumentBySlug(slug: string): Promise<PostPageData | null> {
  const expectedPath = `/blog/${slug}`;
  const cacheKey = `${DOCUMENT_BY_PATH_PREFIX}${expectedPath}`;
  const cached = getCache<PostPageData | null>(cacheKey);
  if (cached) return cached;

  const documents = await listDocumentRecords();
  const match = documents.find(({ record }) => record.path === expectedPath);

  if (!match || match.record.content?.$type !== 'dev.disnet.blog.content.markdown') {
    setCache(cacheKey, null, DOCUMENTS_TTL_MS);
    return null;
  }

  const publication = await getPublication();
  const repoDid = publication.uri ? parseAtUri(publication.uri).repo : '';
  const pdsUrl = repoDid ? await getPdsUrlForDid(repoDid) : '';

  const rendered = await renderMarkdown(match.record.content.markdown);
  const html =
    repoDid && pdsUrl ? resolveInlineBlobUrls(rendered.html, pdsUrl, repoDid) : rendered.html;
  const footnotes =
    repoDid && pdsUrl
      ? rendered.footnotes.map((footnote) => ({
          ...footnote,
          html: resolveInlineBlobUrls(footnote.html, pdsUrl, repoDid)
        }))
      : rendered.footnotes;

  const coverImageUrl =
    match.record.coverImage && repoDid && pdsUrl
      ? getBlobUrl(pdsUrl, repoDid, match.record.coverImage.ref.$link)
      : undefined;

  const post: PostPageData = {
    uri: match.uri,
    rkey: match.rkey,
    path: match.record.path ?? expectedPath,
    slug,
    title: match.record.title,
    description: match.record.description,
    tags: match.record.tags,
    updatedAt: match.record.updatedAt,
    publishedAt: match.record.publishedAt,
    html,
    footnotes,
    coverImageUrl,
    coverImageAlt: match.record.title
  };

  setCache(cacheKey, post, DOCUMENTS_TTL_MS);
  return post;
}

export async function getPublishedDocument(rkey: string): Promise<StoredDocument | null> {
  const documents = await listDocumentRecords();
  return documents.find((document) => document.rkey === rkey) ?? null;
}

export async function publishedPathExists(path: string, options?: { excludeRkey?: string }) {
  const documents = await listDocumentRecords();
  const normalizedPath = normalizePath(path);
  return documents.some(
    (document) => document.record.path === normalizedPath && document.rkey !== options?.excludeRkey
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
  return response.data;
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
}
