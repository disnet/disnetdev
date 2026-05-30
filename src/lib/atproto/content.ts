import type { DocumentContent, MarkpubMarkdownContent } from '$lib/types/blog';

// We render with `marked` configured for GitHub Flavored Markdown (see
// $lib/markdown/render). These hints travel with the record per the markpub spec.
const MARKPUB_FLAVOR = 'gfm' as const;
const MARKPUB_RENDERING_RULES = 'marked';

// Build the markpub.at markdown embed (https://markpub.at) we publish into
// `site.standard.document.content`.
export function buildMarkpubContent(markdown: string): MarkpubMarkdownContent {
  return {
    $type: 'at.markpub.markdown',
    text: {
      $type: 'at.markpub.text',
      markdown
    },
    flavor: MARKPUB_FLAVOR,
    renderingRules: MARKPUB_RENDERING_RULES
  };
}

// Extract the raw markdown string from either the markpub embed or the legacy
// custom embed still present on older records.
export function getDocumentMarkdown(content: DocumentContent | undefined): string | null {
  if (!content) return null;
  if (content.$type === 'at.markpub.markdown') return content.text?.markdown ?? null;
  if (content.$type === 'dev.disnet.blog.content.markdown') return content.markdown ?? null;
  return null;
}
