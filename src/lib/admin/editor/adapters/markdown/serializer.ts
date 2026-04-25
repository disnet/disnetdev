import {
  MarkdownSerializer,
  defaultMarkdownSerializer,
  type MarkdownSerializerState
} from 'prosemirror-markdown';
import type { Node as PMNode } from 'prosemirror-model';

const baseNodes = defaultMarkdownSerializer.nodes;

const nodes: Record<
  string,
  (state: MarkdownSerializerState, node: PMNode, parent: PMNode, index: number) => void
> = {
  blockquote: baseNodes.blockquote,
  code_block: baseNodes.code_block,
  heading: baseNodes.heading,
  horizontal_rule: baseNodes.horizontal_rule,
  bullet_list: baseNodes.bullet_list,
  ordered_list: baseNodes.ordered_list,
  list_item: baseNodes.list_item,
  paragraph: baseNodes.paragraph,
  image: baseNodes.image,
  hard_break: baseNodes.hard_break,
  text: baseNodes.text,

  footnote_ref(state, node) {
    state.write(`[^${node.attrs.label}]`);
  },

  footnote_definition(state, node) {
    const label = node.attrs.label as string;
    state.write(`[^${label}]: `);
    // Render the first paragraph inline so it sits on the same line as the
    // marker, then render any further block content indented two spaces (the
    // markdown-it footnote continuation rule).
    const first = node.firstChild;
    if (first && first.type.name === 'paragraph') {
      state.renderInline(first);
      state.closeBlock(node);
      if (node.childCount > 1) {
        const rest = node.copy(node.content.cut(first.nodeSize));
        state.wrapBlock('  ', null, rest, () => state.renderContent(rest));
      }
    } else {
      state.wrapBlock('  ', null, node, () => state.renderContent(node));
    }
  }
};

export const markdownSerializer = new MarkdownSerializer(nodes, defaultMarkdownSerializer.marks);

export function serializeMarkdown(doc: PMNode): string {
  return markdownSerializer.serialize(doc);
}
