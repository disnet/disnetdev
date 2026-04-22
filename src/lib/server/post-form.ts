import { z } from 'zod';
import type { BlobRef } from '$lib/types/blog';
import { filterEmbeddedBlobs } from '$lib/atproto/blobs';
import { stringifyTags } from './draft-form';

const pathPattern = /^\/[^\s]*$/;

const blobRefSchema = z.object({
  ref: z.object({ $link: z.string().min(1) }),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative()
});

const postFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  path: z
    .string()
    .trim()
    .min(1, 'Path is required')
    .regex(pathPattern, 'Path must start with / and cannot contain spaces'),
  description: z.string().trim().optional(),
  tags: z.string().optional(),
  markdown: z.string(),
  publishedAt: z.string().datetime('Published date must be a valid ISO timestamp')
});

export type PostFormValues = {
  title: string;
  path: string;
  description: string;
  tags: string;
  markdown: string;
  publishedAt: string;
  coverImage: string;
  embeddedBlobs: string;
};

export type PostFormResult =
  | {
      success: true;
      values: PostFormValues;
      recordInput: {
        title: string;
        path: string;
        description?: string;
        tags?: string[];
        markdown: string;
        publishedAt: string;
        coverImage: BlobRef | undefined;
        embeddedBlobs: BlobRef[] | undefined;
      };
    }
  | {
      success: false;
      values: PostFormValues;
      errors: Partial<Record<keyof PostFormValues, string>>;
    };

export function getPostFormValues(formData: FormData): PostFormValues {
  return {
    title: String(formData.get('title') ?? ''),
    path: String(formData.get('path') ?? ''),
    description: String(formData.get('description') ?? ''),
    tags: String(formData.get('tags') ?? ''),
    markdown: String(formData.get('markdown') ?? ''),
    publishedAt: String(formData.get('publishedAt') ?? ''),
    coverImage: String(formData.get('coverImage') ?? ''),
    embeddedBlobs: String(formData.get('embeddedBlobs') ?? '')
  };
}

export function validatePostFormData(formData: FormData): PostFormResult {
  const values = getPostFormValues(formData);
  const parsed = postFormSchema.safeParse(values);

  if (!parsed.success) {
    const errors: Partial<Record<keyof PostFormValues, string>> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && !(field in errors)) {
        errors[field as keyof PostFormValues] = issue.message;
      }
    }

    return {
      success: false,
      values,
      errors
    };
  }

  const coverImage = parseBlobRef(values.coverImage);
  const embeddedBlobsAll = parseBlobRefList(values.embeddedBlobs);
  const embeddedBlobs = filterEmbeddedBlobs(embeddedBlobsAll, parsed.data.markdown);

  const description = parsed.data.description || undefined;
  const tags = parsed.data.tags
    ? Array.from(
        new Set(
          parsed.data.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        )
      )
    : [];

  return {
    success: true,
    values: {
      ...parsed.data,
      description: parsed.data.description ?? '',
      tags: parsed.data.tags ?? '',
      coverImage: coverImage ? JSON.stringify(coverImage) : '',
      embeddedBlobs: embeddedBlobs.length ? JSON.stringify(embeddedBlobs) : ''
    },
    recordInput: {
      title: parsed.data.title,
      path: parsed.data.path,
      ...(description ? { description } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      markdown: parsed.data.markdown,
      publishedAt: parsed.data.publishedAt,
      coverImage,
      embeddedBlobs: embeddedBlobs.length ? embeddedBlobs : undefined
    }
  };
}

export function getPostFormDefaults(record: {
  title: string;
  path?: string;
  description?: string;
  tags?: string[];
  content?: { markdown: string };
  publishedAt: string;
  coverImage?: BlobRef;
  embeddedBlobs?: BlobRef[];
}): PostFormValues {
  return {
    title: record.title,
    path: record.path ?? '/',
    description: record.description ?? '',
    tags: stringifyTags(record.tags),
    markdown: record.content?.markdown ?? '',
    publishedAt: record.publishedAt,
    coverImage: record.coverImage ? JSON.stringify(record.coverImage) : '',
    embeddedBlobs: record.embeddedBlobs?.length ? JSON.stringify(record.embeddedBlobs) : ''
  };
}

function parseBlobRef(value: string): BlobRef | undefined {
  if (!value.trim()) return undefined;
  try {
    const parsed = blobRefSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

function parseBlobRefList(value: string): BlobRef[] {
  if (!value.trim()) return [];
  try {
    const data = JSON.parse(value);
    if (!Array.isArray(data)) return [];
    const parsed = z.array(blobRefSchema).safeParse(data);
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
}
