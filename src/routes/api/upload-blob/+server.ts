import { restoreOAuthAgent } from '$lib/atproto/auth';
import { requireAuthor } from '$lib/server/session';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const ACCEPTED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 4 * 1024 * 1024;

export const POST: RequestHandler = async (event) => {
  const session = requireAuthor(event);

  const formData = await event.request.formData();
  const file = formData.get('file');

  if (!(file instanceof Blob)) {
    throw error(400, 'Missing file');
  }

  const mimeType = file.type || 'application/octet-stream';
  if (!ACCEPTED_MIME.has(mimeType)) {
    throw error(415, `Unsupported image type: ${mimeType}`);
  }

  if (file.size === 0) {
    throw error(400, 'Empty file');
  }

  if (file.size > MAX_BYTES) {
    throw error(413, `File too large (max ${Math.floor(MAX_BYTES / 1024 / 1024)}MB)`);
  }

  const agent = await restoreOAuthAgent(session.did);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const response = await agent.com.atproto.repo.uploadBlob(bytes, {
    encoding: mimeType
  });

  const blob = response.data.blob;
  const blobRef = {
    ref: { $link: typeof blob.ref === 'string' ? blob.ref : blob.ref.toString() },
    mimeType: blob.mimeType,
    size: blob.size
  };

  return json({ blob: blobRef });
};
