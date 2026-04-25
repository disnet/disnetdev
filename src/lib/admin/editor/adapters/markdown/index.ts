import type { EditorAdapter, MarkdownContentValue } from '../../types';
import { markdownSchema } from './schema';
import { parseMarkdown } from './parser';
import { serializeMarkdown } from './serializer';
import { markdownPlugins } from './plugins';

export const markdownAdapter: EditorAdapter<'dev.disnet.blog.content.markdown'> = {
  type: 'dev.disnet.blog.content.markdown',
  schema: markdownSchema,
  parse(content: MarkdownContentValue) {
    return parseMarkdown(content.markdown ?? '');
  },
  serialize(doc) {
    return {
      $type: 'dev.disnet.blog.content.markdown',
      markdown: serializeMarkdown(doc)
    };
  },
  plugins() {
    return markdownPlugins();
  },
  insertImage({ blob, alt }) {
    const cid = blob.ref.$link;
    const src = `blob:${cid}`;
    return (state, dispatch) => {
      const imageType = markdownSchema.nodes.image;
      const node = imageType.create({ src, alt: alt || null, title: null });
      const tr = state.tr.replaceSelectionWith(node);
      dispatch(tr);
    };
  }
};
