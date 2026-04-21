import { deleteDraft, getDraft, updateDraft } from '$lib/atproto/drafts';
import { DRAFT_COLLECTION_NSID } from '$lib/config';
import { stringifyTags, validateDraftFormData } from '$lib/server/draft-form';
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

  return {
    draft: {
      rkey: draft.rkey,
      uri: draft.uri,
      record: draft.record,
      formValues: {
        title: draft.record.title,
        slug: draft.record.slug,
        description: draft.record.description ?? '',
        tags: stringifyTags(draft.record.tags),
        markdown: draft.record.markdown
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
