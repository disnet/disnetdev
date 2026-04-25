import { Schema, type NodeSpec, type Node as PMNode } from 'prosemirror-model';
import { schema as baseSchema } from 'prosemirror-markdown';

export const BLOB_PROTOCOL = 'blob:';

const baseImage = baseSchema.spec.nodes.get('image');
if (!baseImage) {
  throw new Error('prosemirror-markdown base schema missing image node');
}

const imageNode: NodeSpec = {
  ...baseImage,
  attrs: {
    src: {},
    alt: { default: null },
    title: { default: null }
  },
  toDOM(node: PMNode) {
    const src = node.attrs.src as string;
    const alt = node.attrs.alt as string | null;
    const title = node.attrs.title as string | null;
    // Note: blob: URLs are resolved by a NodeView on the EditorView, not here.
    // toDOM is the fallback used outside an active editor (e.g. clipboard).
    return [
      'img',
      {
        src,
        alt: alt ?? '',
        title: title ?? '',
        'data-src': src,
        class: src.startsWith(BLOB_PROTOCOL) ? 'pm-image pm-image--blob' : 'pm-image'
      }
    ];
  },
  parseDOM: [
    {
      tag: 'img[src]',
      getAttrs(dom: HTMLElement | string) {
        if (typeof dom === 'string') return null;
        return {
          src: dom.getAttribute('data-src') ?? dom.getAttribute('src'),
          alt: dom.getAttribute('alt'),
          title: dom.getAttribute('title')
        };
      }
    }
  ]
};

const footnoteRef: NodeSpec = {
  inline: true,
  group: 'inline',
  atom: true,
  attrs: {
    label: {}
  },
  toDOM(node: PMNode) {
    const label = node.attrs.label as string;
    return [
      'sup',
      { class: 'pm-footnote-ref', 'data-label': label },
      `[^${label}]`
    ];
  },
  parseDOM: [
    {
      tag: 'sup.pm-footnote-ref',
      getAttrs(dom: HTMLElement | string) {
        if (typeof dom === 'string') return null;
        return { label: dom.getAttribute('data-label') ?? '' };
      }
    }
  ]
};

const footnoteDefinition: NodeSpec = {
  content: 'block+',
  group: 'block',
  defining: true,
  attrs: {
    label: {}
  },
  toDOM(node: PMNode) {
    const label = node.attrs.label as string;
    return [
      'aside',
      { class: 'pm-footnote-def', 'data-label': label },
      ['span', { class: 'pm-footnote-def-marker' }, `[^${label}]:`],
      ['div', { class: 'pm-footnote-def-body' }, 0]
    ];
  },
  parseDOM: [
    {
      tag: 'aside.pm-footnote-def',
      getAttrs(dom: HTMLElement | string) {
        if (typeof dom === 'string') return null;
        return { label: dom.getAttribute('data-label') ?? '' };
      },
      contentElement: '.pm-footnote-def-body'
    }
  ]
};

export const markdownSchema = new Schema({
  nodes: baseSchema.spec.nodes
    .update('image', imageNode)
    .addToEnd('footnote_ref', footnoteRef)
    .addToEnd('footnote_definition', footnoteDefinition),
  marks: baseSchema.spec.marks
});
