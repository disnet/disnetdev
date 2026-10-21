// URL helpers for the lens. Shared by server loads and components, so nothing
// here may import server-only modules.

const AT_URI_PATTERN = /^at:\/\/([^/?#]+)(?:\/([^/?#]+)(?:\/([^/?#]+))?)?$/;
const DID_PATTERN = /^did:(plc|web):[a-zA-Z0-9._:%-]+$/;
const NSID_PATTERN = /^[a-zA-Z]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
const RKEY_PATTERN = /^[a-zA-Z0-9._:~-]{1,512}$/;

export function isDid(value: string) {
  return DID_PATTERN.test(value);
}

export function isNsid(value: string) {
  return NSID_PATTERN.test(value) && value.split('.').length >= 3;
}

export function isRkey(value: string) {
  return RKEY_PATTERN.test(value) && value !== '.' && value !== '..';
}

export function parseAtUri(value: string) {
  const match = value.match(AT_URI_PATTERN);
  if (!match) return null;
  return { repo: match[1], collection: match[2], rkey: match[3] };
}

export function lensHref(repo: string, collection?: string, rkey?: string) {
  let href = `/@${repo}`;
  if (collection) href += `/${collection}`;
  if (collection && rkey) href += `/${encodeURIComponent(rkey)}`;
  return href;
}

export type OwnRepo = { did: string; handle: string };

// Turn an at:// uri (or a bare DID) into a path inside the lens. The lens only
// shows the site owner's repo, so references into anyone else's repo stay
// plain text.
export function lensHrefForUri(value: string, own: OwnRepo) {
  const repo = own.handle || own.did;
  if (value === own.did) return lensHref(repo);
  const parsed = parseAtUri(value);
  if (!parsed || (parsed.repo !== own.did && parsed.repo !== own.handle)) return null;
  return lensHref(repo, parsed.collection, parsed.rkey);
}

export function rkeyOf(uri: string) {
  return uri.split('/').at(-1) ?? '';
}
