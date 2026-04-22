import { z } from 'zod';
import { stringifyTags } from './draft-form';

const pathPattern = /^\/[^\s]*$/;

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
    publishedAt: String(formData.get('publishedAt') ?? '')
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
      tags: parsed.data.tags ?? ''
    },
    recordInput: {
      title: parsed.data.title,
      path: parsed.data.path,
      ...(description ? { description } : {}),
      ...(tags.length > 0 ? { tags } : {}),
      markdown: parsed.data.markdown,
      publishedAt: parsed.data.publishedAt
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
}): PostFormValues {
  return {
    title: record.title,
    path: record.path ?? '/',
    description: record.description ?? '',
    tags: stringifyTags(record.tags),
    markdown: record.content?.markdown ?? '',
    publishedAt: record.publishedAt
  };
}
