import { createDraft } from '$lib/atproto/drafts';
import { DRAFT_COLLECTION_NSID } from '$lib/config';
import { requireAuthor } from '$lib/server/session';
import { validateDraftFormData } from '$lib/server/draft-form';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = (event) => {
  requireAuthor(event);

  event.setHeaders({
    'cache-control': 'private, no-store'
  });

  return {};
};

export const actions: Actions = {
  default: async (event) => {
    const session = requireAuthor(event);
    const formData = await event.request.formData();
    const result = validateDraftFormData(formData);

    if (!result.success) {
      return fail(400, result);
    }

    const now = new Date().toISOString();
    const created = await createDraft(session.did, {
      $type: DRAFT_COLLECTION_NSID,
      ...result.recordInput,
      createdAt: now,
      updatedAt: now
    });

    throw redirect(303, `/admin/edit/draft/${created.uri.split('/').at(-1)}`);
  }
};
