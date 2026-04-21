import { z } from 'zod';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
    markdown: String(formData.get('markdown') ?? '')
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

  const description = parsed.data.description || undefined;
  const tags = parseTags(parsed.data.tags);

  return {
    success: true,
    values: {
      ...parsed.data,
      description: parsed.data.description ?? '',
      tags: parsed.data.tags ?? ''
    },
    recordInput: {
      title: parsed.data.title,
      slug: parsed.data.slug,
      ...(description ? { description } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      markdown: parsed.data.markdown
    }
  };
}

export function stringifyTags(tags?: string[]) {
  return tags?.join(', ') ?? '';
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
