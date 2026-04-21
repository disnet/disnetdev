import { REPO_DID } from '$lib/config';
import { xrpc } from '$lib/atproto/client';
import { publishedDocumentSchema } from '$lib/atproto/schema';
import { getSlugFromPath, normalizePath } from '$lib/atproto/utils';
import { renderMarkdown } from '$lib/markdown/render';
import { getCache, setCache } from '$lib/server/cache';
import { getPublication } from './publication';
import type { DocumentSummary, PostPageData, PublishedDocument } from '$lib/types/blog';

const DOCUMENTS_CACHE_KEY = 'documents:index';
const DOCUMENT_BY_PATH_PREFIX = 'documents:path:';
const DOCUMENTS_TTL_MS = 5 * 60 * 1000;

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

  if (!REPO_DID) {
    setCache(DOCUMENTS_CACHE_KEY, [], DOCUMENTS_TTL_MS);
    return [];
  }

  const publication = await getPublication();
  const all: StoredDocument[] = [];
  let cursor: string | undefined;

  do {
    const response = await xrpc<ListRecordsResponse>('xrpc/com.atproto.repo.listRecords', {
      repo: REPO_DID,
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

  const html = await renderMarkdown(match.record.content.markdown);
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
    html
  };

  setCache(cacheKey, post, DOCUMENTS_TTL_MS);
  return post;
}
