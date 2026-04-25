import MarkdownIt from 'markdown-it';
import footnotePlugin from 'markdown-it-footnote';
import { MarkdownParser, type ParseSpec } from 'prosemirror-markdown';
import type { Node as PMNode } from 'prosemirror-model';
import { markdownSchema } from './schema';

const tokenizer = MarkdownIt('commonmark', { html: false }).use(footnotePlugin);

const tokens: { [name: string]: ParseSpec } = {
  blockquote: { block: 'blockquote' },
  paragraph: { block: 'paragraph' },
  list_item: { block: 'list_item' },
  bullet_list: { block: 'bullet_list' },
  ordered_list: {
    block: 'ordered_list',
    getAttrs: (tok) => ({ order: Number(tok.attrGet('start')) || 1 })
  },
  heading: { block: 'heading', getAttrs: (tok) => ({ level: Number(tok.tag.slice(1)) }) },
  code_block: { block: 'code_block', noCloseToken: true },
  fence: {
    block: 'code_block',
    getAttrs: (tok) => ({ params: tok.info || '' }),
    noCloseToken: true
  },
  hr: { node: 'horizontal_rule' },
  image: {
    node: 'image',
    getAttrs: (tok) => ({
      src: tok.attrGet('src') ?? '',
      title: tok.attrGet('title') || null,
      alt: (tok.children?.[0]?.content) || null
    })
  },
  hardbreak: { node: 'hard_break' },
  em: { mark: 'em' },
  strong: { mark: 'strong' },
  link: {
    mark: 'link',
    getAttrs: (tok) => ({
      href: tok.attrGet('href') ?? '',
      title: tok.attrGet('title') || null
    })
  },
  code_inline: { mark: 'code', noCloseToken: true },

  // footnote tokens (markdown-it-footnote)
  footnote_ref: {
    node: 'footnote_ref',
    getAttrs: (tok) => ({ label: tok.meta?.label ?? String(tok.meta?.id ?? '') })
  },
  footnote: {
    block: 'footnote_definition',
    getAttrs: (tok) => ({ label: tok.meta?.label ?? String(tok.meta?.id ?? '') })
  },
  footnote_block: { ignore: true },
  footnote_anchor: { ignore: true, noCloseToken: true },
  footnote_reference: { ignore: true }
};

export const markdownParser = new MarkdownParser(markdownSchema, tokenizer, tokens);

export function parseMarkdown(markdown: string): PMNode {
  return markdownParser.parse(markdown);
}
