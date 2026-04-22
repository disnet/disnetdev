import { getAuthorBlobUrl } from '$lib/atproto/blobs';
import { createPublishedDocument, publishedPathExists } from '$lib/atproto/documents';
import { deleteDraft, getDraft, updateDraft } from '$lib/atproto/drafts';
import { DRAFT_COLLECTION_NSID } from '$lib/config';
import { markdownToPlaintext } from '$lib/markdown/plaintext';
import { serializeBlobRef, serializeBlobRefList, stringifyTags, validateDraftFormData } from '$lib/server/draft-form';
import { requireAuthor } from '$lib/server/session';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  requireAuthor(event);

  event.setHeaders({
    'cache-control': 'private, no-store'
  });

  const draft = await getDraft(event.params.rkey);
  if (!draft) {
    throw error(404, 'Draft not found');
  }

  const coverImageUrl = await getAuthorBlobUrl(draft.record.coverImage);

  return {
    draft: {
      rkey: draft.rkey,
      uri: draft.uri,
      record: draft.record,
      coverImageUrl,
      formValues: {
        title: draft.record.title,
        slug: draft.record.slug,
        description: draft.record.description ?? '',
        tags: stringifyTags(draft.record.tags),
        markdown: draft.record.markdown,
        coverImage: serializeBlobRef(draft.record.coverImage),
        embeddedBlobs: serializeBlobRefList(draft.record.embeddedBlobs)
      }
    }
  };
};

export const actions: Actions = {
  save: async (event) => {
    const session = requireAuthor(event);
    const existing = await getDraft(event.params.rkey);
    if (!existing) {
      throw error(404, 'Draft not found');
    }

    const formData = await event.request.formData();
    const result = validateDraftFormData(formData);

    if (!result.success) {
      return fail(400, {
        ...result,
        action: 'save'
      });
    }

    const updatedAt = new Date().toISOString();
    await updateDraft(session.did, event.params.rkey, {
      ...existing.record,
      ...result.recordInput,
      $type: DRAFT_COLLECTION_NSID,
      createdAt: existing.record.createdAt,
      updatedAt
    });

    return {
      success: true,
      message: 'Draft saved.',
      values: result.values
    };
  },

  publish: async (event) => {
    const session = requireAuthor(event);
    const existing = await getDraft(event.params.rkey);
    if (!existing) {
      throw error(404, 'Draft not found');
    }

    const draftFormValues = {
      title: existing.record.title,
      slug: existing.record.slug,
      description: existing.record.description ?? '',
      tags: stringifyTags(existing.record.tags),
      markdown: existing.record.markdown,
      coverImage: serializeBlobRef(existing.record.coverImage),
      embeddedBlobs: serializeBlobRefList(existing.record.embeddedBlobs)
    };

    if (existing.record.sourceDocumentRkey) {
      return fail(400, {
        action: 'publish',
        values: draftFormValues,
        errors: {
          title: undefined,
          slug: 'This draft has already been published.',
          description: undefined,
          tags: undefined,
          markdown: undefined
        }
      });
    }

    const path = `/blog/${existing.record.slug}`;
    if (await publishedPathExists(path)) {
      return fail(400, {
        action: 'publish',
        values: draftFormValues,
        errors: {
          title: undefined,
          slug: `A published post already exists at ${path}.`,
          description: undefined,
          tags: undefined,
          markdown: undefined
        }
      });
    }

    const now = new Date().toISOString();
    const published = await createPublishedDocument(session.did, {
      $type: 'site.standard.document',
      site: '',
      title: existing.record.title,
      publishedAt: now,
      path,
      ...(existing.record.description ? { description: existing.record.description } : {}),
      ...(existing.record.tags?.length ? { tags: existing.record.tags } : {}),
      ...(existing.record.coverImage ? { coverImage: existing.record.coverImage } : {}),
      ...(existing.record.embeddedBlobs?.length ? { embeddedBlobs: existing.record.embeddedBlobs } : {}),
      content: {
        $type: 'dev.disnet.blog.content.markdown',
        markdown: existing.record.markdown,
        sourceFormat: 'markdown'
      },
      textContent: markdownToPlaintext(existing.record.markdown),
      updatedAt: now
    });

    await updateDraft(session.did, event.params.rkey, {
      ...existing.record,
      $type: DRAFT_COLLECTION_NSID,
      sourceDocumentRkey: published.uri.split('/').at(-1),
      updatedAt: now
    });

    return {
      success: true,
      action: 'publish',
      message: 'Draft published.',
      publishedUrl: path,
      publishedRkey: published.uri.split('/').at(-1),
      values: draftFormValues
    };
  },

  delete: async (event) => {
    const session = requireAuthor(event);
    const existing = await getDraft(event.params.rkey);
    if (!existing) {
      throw error(404, 'Draft not found');
    }

    await deleteDraft(session.did, event.params.rkey);
    throw redirect(303, '/admin');
  }
};
