import { xrpc } from '$lib/atproto/client';
import { getCache, setCache } from '$lib/server/cache';

const APPVIEW_URL = 'https://public.api.bsky.app';
const PHOTO_ACTOR = 'photos.disnetdev.com';
const PHOTOS_CACHE_KEY = `photos:${PHOTO_ACTOR}`;
const PHOTOS_TTL_MS = 5 * 60 * 1000;

type BskyImage = {
  thumb?: string;
  fullsize?: string;
  alt?: string;
  aspectRatio?: {
    width?: number;
    height?: number;
  };
};

type BskyPostRecord = {
  text?: string;
  createdAt?: string;
};

type BskyPostView = {
  uri: string;
  cid: string;
  author?: {
    handle?: string;
    displayName?: string;
  };
  record?: BskyPostRecord;
  embed?: {
    $type?: string;
    images?: BskyImage[];
  };
  indexedAt?: string;
};

type BskyFeedItem = {
  post?: BskyPostView;
  reason?: unknown;
};

type AuthorFeedResponse = {
  feed?: BskyFeedItem[];
  cursor?: string;
};

export type PhotoImage = {
  thumb: string;
  fullsize: string;
  alt: string;
  aspectRatio?: string;
};

export type PhotoPost = {
  uri: string;
  cid: string;
  rkey: string;
  text: string;
  createdAt: string;
  url: string;
  images: PhotoImage[];
};

function rkeyFromUri(uri: string) {
  return uri.split('/').at(-1) ?? '';
}

function postUrl(uri: string) {
  return `https://bsky.app/profile/${PHOTO_ACTOR}/post/${rkeyFromUri(uri)}`;
}

function isImageEmbed(
  embed: BskyPostView['embed']
): embed is { $type?: string; images: BskyImage[] } {
  return embed?.$type === 'app.bsky.embed.images#view' && Array.isArray(embed.images);
}

function imageAspectRatio(image: BskyImage) {
  const width = image.aspectRatio?.width;
  const height = image.aspectRatio?.height;

  if (!width || !height) return undefined;
  return `${width} / ${height}`;
}

function toPhotoPost(post: BskyPostView): PhotoPost | null {
  const embed = post.embed;
  if (!isImageEmbed(embed)) return null;

  const images = embed.images
    .map((image): PhotoImage | null => {
      if (!image.thumb || !image.fullsize) return null;

      return {
        thumb: image.thumb,
        fullsize: image.fullsize,
        alt: image.alt ?? '',
        aspectRatio: imageAspectRatio(image)
      };
    })
    .filter((image): image is PhotoImage => image !== null);

  if (images.length === 0) return null;

  return {
    uri: post.uri,
    cid: post.cid,
    rkey: rkeyFromUri(post.uri),
    text: post.record?.text ?? '',
    createdAt: post.record?.createdAt ?? post.indexedAt ?? '',
    url: postUrl(post.uri),
    images
  };
}

export async function listPhotoPosts(limit = 60): Promise<PhotoPost[]> {
  const cached = getCache<PhotoPost[]>(PHOTOS_CACHE_KEY);
  if (cached) return cached.slice(0, limit);

  const photos: PhotoPost[] = [];
  let cursor: string | undefined;

  do {
    const response = await xrpc<AuthorFeedResponse>(
      APPVIEW_URL,
      'xrpc/app.bsky.feed.getAuthorFeed',
      {
        actor: PHOTO_ACTOR,
        filter: 'posts_with_media',
        limit: 100,
        cursor
      }
    );

    for (const item of response.feed ?? []) {
      if (item.reason || !item.post) continue;
      if (item.post.author?.handle !== PHOTO_ACTOR) continue;

      const photo = toPhotoPost(item.post);
      if (photo) photos.push(photo);
      if (photos.length >= limit) break;
    }

    cursor = response.cursor;
  } while (cursor && photos.length < limit);

  setCache(PHOTOS_CACHE_KEY, photos, PHOTOS_TTL_MS);
  return photos.slice(0, limit);
}
