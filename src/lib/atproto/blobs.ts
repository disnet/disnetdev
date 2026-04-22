import type { BlobRef } from '$lib/types/blog';
import { AUTHOR_DID } from '$lib/config';
import { getPdsUrlForDid } from './service';

export async function getAuthorBlobUrl(ref: BlobRef | undefined): Promise<string | null> {
  if (!ref || !AUTHOR_DID) return null;
  try {
    const pdsUrl = await getPdsUrlForDid(AUTHOR_DID);
    return getBlobUrl(pdsUrl, AUTHOR_DID, ref.ref.$link);
  } catch {
    return null;
  }
}

export function getBlobUrl(_pdsUrl: string, did: string, cid: string) {
  return `/blob/${did}/${cid}`;
}

export function getBlobUrlFromRef(pdsUrl: string, did: string, ref: BlobRef) {
  return getBlobUrl(pdsUrl, did, ref.ref.$link);
}

const BLOB_SRC_PATTERN = /(src|href)="blob:([a-zA-Z0-9]+)"/g;

export function resolveInlineBlobUrls(html: string, pdsUrl: string, did: string) {
  return html.replace(BLOB_SRC_PATTERN, (_match, attr: string, cid: string) => {
    return `${attr}="${getBlobUrl(pdsUrl, did, cid)}"`;
  });
}

const MARKDOWN_BLOB_PATTERN = /blob:([a-zA-Z0-9]+)/g;

export function collectEmbeddedBlobCids(markdown: string): Set<string> {
  const cids = new Set<string>();
  for (const match of markdown.matchAll(MARKDOWN_BLOB_PATTERN)) {
    cids.add(match[1]);
  }
  return cids;
}

export function filterEmbeddedBlobs(blobs: BlobRef[] | undefined, markdown: string): BlobRef[] {
  if (!blobs?.length) return [];
  const referenced = collectEmbeddedBlobCids(markdown);
  return blobs.filter((blob) => referenced.has(blob.ref.$link));
}
