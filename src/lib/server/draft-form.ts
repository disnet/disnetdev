import { z } from 'zod';
import type { BlobRef } from '$lib/types/blog';
import { filterEmbeddedBlobs } from '$lib/atproto/blobs';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const blobRefSchema = z.object({
  ref: z.object({ $link: z.string().min(1) }),
  mimeType: z.string().min(1),
  size: z.number().int().nonnegative()
});

const draftFormSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .regex(slugPattern, 'Slug must use lowercase letters, numbers, and hyphens only'),
  description: z.string().trim().optional(),
  tags: z.string().optional(),
  markdown: z.string()
});

export type DraftFormValues = {
  title: string;
  slug: string;
  description: string;
  tags: string;
  markdown: string;
  coverImage: string;
  embeddedBlobs: string;
};

export type DraftFormResult =
  | {
      success: true;
      values: DraftFormValues;
      recordInput: {
        title: string;
        slug: string;
        description?: string;
        tags?: string[];
        markdown: string;
        coverImage: BlobRef | undefined;
        embeddedBlobs: BlobRef[] | undefined;
      };
    }
  | {
      success: false;
      values: DraftFormValues;
      errors: Partial<Record<keyof DraftFormValues, string>>;
    };

export function getDraftFormValues(formData: FormData): DraftFormValues {
  return {
    title: String(formData.get('title') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    description: String(formData.get('description') ?? ''),
    tags: String(formData.get('tags') ?? ''),
    markdown: String(formData.get('markdown') ?? ''),
    coverImage: String(formData.get('coverImage') ?? ''),
    embeddedBlobs: String(formData.get('embeddedBlobs') ?? '')
  };
}

export function validateDraftFormData(formData: FormData): DraftFormResult {
  const values = getDraftFormValues(formData);
  const parsed = draftFormSchema.safeParse(values);

  if (!parsed.success) {
    const errors: Partial<Record<keyof DraftFormValues, string>> = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];
      if (typeof field === 'string' && !(field in errors)) {
        errors[field as keyof DraftFormValues] = issue.message;
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
  const tags = parseTags(parsed.data.tags);

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
      slug: parsed.data.slug,
      ...(description ? { description } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      markdown: parsed.data.markdown,
      coverImage,
      embeddedBlobs: embeddedBlobs.length ? embeddedBlobs : undefined
    }
  };
}

export function stringifyTags(tags?: string[]) {
  return tags?.join(', ') ?? '';
}

export function serializeBlobRef(blob?: BlobRef | null) {
  return blob ? JSON.stringify(blob) : '';
}

export function serializeBlobRefList(blobs?: BlobRef[] | null) {
  return blobs?.length ? JSON.stringify(blobs) : '';
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

function parseTags(value?: string) {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}
