import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

function requirePrivateEnv(name: keyof typeof env) {
  const value = env[name];

  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

export const AUTHOR_DID = env.AUTHOR_DID ?? '';
export const PUBLICATION_AT_URI = env.PUBLICATION_AT_URI ?? '';
export const DRAFT_COLLECTION_NSID = requirePrivateEnv('DRAFT_COLLECTION_NSID');
export const SITE_NAME = env.SITE_NAME ?? 'disnetdev';
export const SITE_DESCRIPTION =
  env.SITE_DESCRIPTION ?? 'Personal site migrating from Eleventy to ATProto-backed SvelteKit.';

export function requirePublicationAtUri() {
  if (!PUBLICATION_AT_URI) {
    throw new Error('PUBLICATION_AT_URI is not configured');
  }

  return PUBLICATION_AT_URI;
}

export function getSiteUrl() {
  return publicEnv.PUBLIC_SITE_URL || 'http://localhost:5173';
}
