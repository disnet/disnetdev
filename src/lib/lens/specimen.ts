import { lensHrefForUri, type OwnRepo } from './paths';

// A one-glance reading of an arbitrary record: something to call it, a line of
// text, when it happened, and where it points. The lens never knows the
// lexicon in advance, so this guesses from the field names nearly every
// lexicon shares, with a few special cases for the shapes that don't fit.

export type Specimen = {
  title?: string;
  text?: string;
  when?: string;
  status?: string;
  url?: string;
  ref?: string;
  image?: string;
};

const TITLE_PATHS = [
  'title',
  'name',
  'displayName',
  'itemTitle',
  'content.metadata.title',
  'target.title'
];
const TEXT_PATHS = [
  'summary',
  'text',
  'plaintext',
  'note',
  'description',
  'body',
  'content.metadata.description',
  'target.selector.exact'
];
const WHEN_PATHS = ['createdAt', 'publishedAt', 'indexedAt', 'updatedAt', 'date'];
const STATUS_PATHS = ['status', 'disposition', 'verdict', 'kind'];
const URL_PATHS = ['url', 'itemUrl', 'website', 'target.source', 'content.url'];
const REF_PATHS = ['subject.uri', 'subject', 'goal.uri', 'pull', 'document', 'plan', 'boardUri'];
const IMAGE_PATHS = ['posterUrl', 'itemImage', 'thumb'];

const TEXT_LIMIT = 280;

function at(value: unknown, path: string): unknown {
  let current = value;
  for (const key of path.split('.')) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function firstString(value: unknown, paths: string[], accept = (s: string) => s.trim() !== '') {
  for (const path of paths) {
    const candidate = at(value, path);
    if (typeof candidate === 'string' && accept(candidate)) return candidate;
  }
  return undefined;
}

function clip(text: string | undefined) {
  if (!text) return undefined;
  // Some records carry HTML (Skyreader shares keep the article body).
  const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plain.length <= TEXT_LIMIT) return plain || undefined;
  return `${plain.slice(0, TEXT_LIMIT).replace(/\s+\S*$/, '')}…`;
}

// `sh.tangled.repo.pull.status.merged` reads better as `merged`.
function lastSegment(value: string | undefined) {
  if (!value) return undefined;
  return value.includes('.') && !value.includes(' ') ? value.split('.').at(-1) : value;
}

const isHttp = (s: string) => /^https?:\/\//.test(s);
const isRef = (s: string) => s.startsWith('at://') || s.startsWith('did:');

export function describeRecord(
  collection: string,
  value: Record<string, unknown>,
  own: OwnRepo
): Specimen {
  const specimen: Specimen = {
    title: firstString(value, TITLE_PATHS),
    text: clip(firstString(value, TEXT_PATHS)),
    when: firstString(value, WHEN_PATHS),
    status: lastSegment(firstString(value, STATUS_PATHS)),
    url: firstString(value, URL_PATHS, isHttp),
    image: firstString(value, IMAGE_PATHS, isHttp)
  };

  const ref = firstString(value, REF_PATHS, isRef);
  if (ref) specimen.ref = lensHrefForUri(ref, own) ?? undefined;

  // Pointer records (likes, follows, reposts) are all reference and no text.
  const verb = POINTER_VERBS[collection.split('.').at(-1) ?? ''];
  if (!specimen.title && !specimen.text && verb && ref) {
    const noun = ref.startsWith('did:') ? 'an account' : `a ${ref.split('/')[3]?.split('.').at(-1) ?? 'record'}`;
    specimen.title = `${verb} ${noun}`;
  }

  if (specimen.title && specimen.text === specimen.title) specimen.text = undefined;
  return specimen;
}

const POINTER_VERBS: Record<string, string> = {
  like: 'liked',
  repost: 'reposted',
  follow: 'followed',
  star: 'starred',
  upvote: 'upvoted',
  vouch: 'vouched for',
  subscription: 'subscribed to',
  recommend: 'recommended'
};
