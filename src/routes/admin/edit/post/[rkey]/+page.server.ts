import { getAuthorBlobUrl } from '$lib/atproto/blobs';
import {
  deletePublishedDocument,
  getPublishedDocument,
  publishedPathExists,
  updatePublishedDocument
} from '$lib/atproto/documents';
import { listDrafts, updateDraft } from '$lib/atproto/drafts';
import { DRAFT_COLLECTION_NSID } from '$lib/config';
import { markdownToPlaintext } from '$lib/markdown/plaintext';
import { getPostFormDefaults, validatePostFormData } from '$lib/server/post-form';
import { requireAuthor } from '$lib/server/session';
import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  requireAuthor(event);

  event.setHeaders({
    'cache-control': 'private, no-store'
  });

  const post = await getPublishedDocument(event.params.rkey);
  if (!post) {
    throw error(404, 'Published post not found');
  }

  const linkedDraft = (await listDrafts()).find((draft) => draft.record.sourceDocumentRkey === post.rkey);
  const coverImageUrl = await getAuthorBlobUrl(post.record.coverImage);

  return {
    post: {
      rkey: post.rkey,
      uri: post.uri,
      record: post.record,
      coverImageUrl,
      formValues: getPostFormDefaults(post.record),
      linkedDraft: linkedDraft
        ? {
            rkey: linkedDraft.rkey,
            slug: linkedDraft.record.slug,
            title: linkedDraft.record.title
          }
        : null
    }
  };
};

export const actions: Actions = {
  save: async (event) => {
    const session = requireAuthor(event);
    const existing = await getPublishedDocument(event.params.rkey);
    if (!existing) {
      throw error(404, 'Published post not found');
    }

    const formData = await event.request.formData();
    const result = validatePostFormData(formData);

    if (!result.success) {
      return fail(400, {
        ...result,
        action: 'save'
      });
    }

    if (await publishedPathExists(result.recordInput.path, { excludeRkey: existing.rkey })) {
      return fail(400, {
        action: 'save',
        values: result.values,
        errors: {
          title: undefined,
          path: `A published post already exists at ${result.recordInput.path}.`,
          description: undefined,
          tags: undefined,
          markdown: undefined,
          publishedAt: undefined
        }
      });
    }

    const updatedAt = new Date().toISOString();
    await updatePublishedDocument(session.did, existing.rkey, {
      ...existing.record,
      title: result.recordInput.title,
      publishedAt: result.recordInput.publishedAt,
      path: result.recordInput.path,
      description: result.recordInput.description,
      tags: result.recordInput.tags,
      coverImage: result.recordInput.coverImage,
      embeddedBlobs: result.recordInput.embeddedBlobs,
      content: {
        $type: 'dev.disnet.blog.content.markdown',
        markdown: result.recordInput.markdown,
        sourceFormat: 'markdown'
      },
      textContent: markdownToPlaintext(result.recordInput.markdown),
      updatedAt
    });

    return {
      success: true,
      action: 'save',
      message: 'Published post saved.',
      values: result.values
    };
  },

  delete: async (event) => {
    const session = requireAuthor(event);
    const existing = await getPublishedDocument(event.params.rkey);
    if (!existing) {
      throw error(404, 'Published post not found');
    }

    await deletePublishedDocument(session.did, existing.rkey);

    const drafts = await listDrafts();
    const linkedDrafts = drafts.filter((draft) => draft.record.sourceDocumentRkey === existing.rkey);
    const unlinkedAt = new Date().toISOString();

    await Promise.all(
      linkedDrafts.map((draft) =>
        updateDraft(session.did, draft.rkey, {
          ...draft.record,
          $type: DRAFT_COLLECTION_NSID,
          sourceDocumentRkey: undefined,
          updatedAt: unlinkedAt
        })
      )
    );

    throw redirect(303, '/admin');
  }
};
