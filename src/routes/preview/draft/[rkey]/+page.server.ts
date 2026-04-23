import { getAuthorBlobUrl, resolveInlineBlobUrls } from '$lib/atproto/blobs';
import { getDraft } from '$lib/atproto/drafts';
import { getPdsUrlForDid } from '$lib/atproto/service';
import { requireAuthorDid } from '$lib/config';
import { renderMarkdown } from '$lib/markdown/render';
import { requireAuthor } from '$lib/server/session';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  requireAuthor(event);

  event.setHeaders({
    'cache-control': 'private, no-store'
  });

  const draft = await getDraft(event.params.rkey);
  if (!draft) {
    throw error(404, 'Draft not found');
  }

  const authorDid = requireAuthorDid();
  const pdsUrl = await getPdsUrlForDid(authorDid);
  const rendered = await renderMarkdown(draft.record.markdown);

  return {
    post: {
      uri: draft.uri,
      rkey: draft.rkey,
      path: `/blog/${draft.record.slug}`,
      slug: draft.record.slug,
      title: draft.record.title,
      description: draft.record.description,
      tags: draft.record.tags,
      updatedAt: draft.record.updatedAt,
      publishedAt: draft.record.updatedAt,
      html: resolveInlineBlobUrls(rendered.html, pdsUrl, authorDid),
      footnotes: rendered.footnotes.map((footnote) => ({
        ...footnote,
        html: resolveInlineBlobUrls(footnote.html, pdsUrl, authorDid)
      })),
      coverImageUrl: (await getAuthorBlobUrl(draft.record.coverImage)) ?? undefined,
      coverImageAlt: draft.record.title
    },
    editorHref: `/admin/edit/draft/${draft.rkey}`
  };
};
