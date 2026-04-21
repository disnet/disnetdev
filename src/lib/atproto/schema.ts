import { z } from 'zod';

const blobRefSchema = z.object({
  ref: z.object({ $link: z.string() }),
  mimeType: z.string(),
  size: z.number().int().nonnegative()
});

export const markdownContentSchema = z.object({
  $type: z.literal('dev.disnet.blog.content.markdown'),
  markdown: z.string(),
  sourceFormat: z.literal('markdown').optional(),
  wordCount: z.number().int().nonnegative().optional()
});

export const publicationRecordSchema = z.object({
  $type: z.literal('site.standard.publication'),
  url: z.string().url(),
  name: z.string().min(1),
  description: z.string().optional(),
  icon: blobRefSchema.optional(),
  preferences: z
    .object({
      showInDiscover: z.boolean().optional()
    })
    .optional()
});

export const publishedDocumentSchema = z.object({
  $type: z.literal('site.standard.document'),
  site: z.string().min(1),
  title: z.string().min(1),
  publishedAt: z.string().datetime(),
  path: z.string().startsWith('/').optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  content: markdownContentSchema.optional(),
  textContent: z.string().optional(),
  updatedAt: z.string().datetime().optional(),
  coverImage: blobRefSchema.optional()
});

export const draftRecordSchema = z.object({
  $type: z.literal('dev.disnet.blog.draft'),
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  markdown: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  coverImage: blobRefSchema.optional(),
  sourceDocumentRkey: z.string().optional(),
  legacy: z
    .object({
      sourcePath: z.string().optional(),
      originalFilename: z.string().optional(),
      importedAt: z.string().datetime().optional(),
      previousPaths: z.array(z.string()).optional()
    })
    .optional()
});

export type PublicationRecord = z.infer<typeof publicationRecordSchema>;
export type PublishedDocument = z.infer<typeof publishedDocumentSchema>;
export type DraftRecord = z.infer<typeof draftRecordSchema>;
export type MarkdownContent = z.infer<typeof markdownContentSchema>;
