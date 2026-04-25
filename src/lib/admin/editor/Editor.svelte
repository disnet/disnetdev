<script lang="ts" module>
  import type { BlobRef } from '$lib/types/blog';
  import type { ContentValue } from './types';

  export type EditorRef = {
    insertImage: (args: { blob: BlobRef; alt?: string }) => void;
    setContent: (content: ContentValue) => void;
    focus: () => void;
  };
</script>

<script lang="ts">
  import { untrack } from 'svelte';
  import { EditorState, type Transaction } from 'prosemirror-state';
  import { EditorView, type NodeView } from 'prosemirror-view';
  import type { Node as PMNode } from 'prosemirror-model';
  import { getAdapter } from './registry';
  import { BLOB_PROTOCOL } from './adapters/markdown/schema';

  type Props = {
    content: ContentValue;
    onChange: (content: ContentValue) => void;
    placeholder?: string;
    spellcheck?: boolean;
    /** Resolves the storage src on a node (e.g. `blob:cid`) to a URL the
        browser can fetch. Defaults to identity. */
    resolveImageSrc?: (src: string) => string;
    ref?: EditorRef | null;
  };

  let {
    content,
    onChange,
    placeholder,
    spellcheck = true,
    resolveImageSrc,
    ref = $bindable<EditorRef | null>(null)
  }: Props = $props();

  let container = $state<HTMLDivElement | undefined>(undefined);

  $effect(() => {
    if (!container) return;

    // Read props once at mount; subsequent updates flow through `onChange`
    // and the imperative `setContent` exposed on the ref.
    const initial = untrack(() => content);
    const initialPlaceholder = untrack(() => placeholder);
    const initialSpellcheck = untrack(() => spellcheck);
    const resolveSrc = untrack(() => resolveImageSrc) ?? ((s: string) => s);

    const adapter = getAdapter(initial.$type);
    const initialDoc = adapter.parse(initial);
    const state = EditorState.create({
      doc: initialDoc,
      schema: adapter.schema,
      plugins: adapter.plugins()
    });

    const view = new EditorView(container, {
      state,
      attributes: {
        class: 'pm-editor',
        spellcheck: String(initialSpellcheck),
        ...(initialPlaceholder ? { 'data-placeholder': initialPlaceholder } : {})
      },
      nodeViews: {
        image: (node: PMNode): NodeView => {
          const dom = document.createElement('img');
          const src = node.attrs.src as string;
          dom.src = resolveSrc(src);
          dom.alt = (node.attrs.alt as string | null) ?? '';
          if (node.attrs.title) dom.title = node.attrs.title as string;
          dom.dataset.src = src;
          dom.className = src.startsWith(BLOB_PROTOCOL) ? 'pm-image pm-image--blob' : 'pm-image';
          return { dom };
        }
      },
      dispatchTransaction(tr: Transaction) {
        const next = view.state.apply(tr);
        view.updateState(next);
        if (tr.docChanged) {
          onChange(adapter.serialize(next.doc));
        }
      }
    });

    ref = {
      insertImage({ blob, alt }) {
        const cmd = adapter.insertImage({ blob, alt: alt ?? '' });
        cmd(view.state, view.dispatch);
        view.focus();
      },
      setContent(next) {
        const nextAdapter = getAdapter(next.$type);
        const nextDoc = nextAdapter.parse(next);
        const newState = EditorState.create({
          doc: nextDoc,
          schema: nextAdapter.schema,
          plugins: nextAdapter.plugins()
        });
        view.updateState(newState);
      },
      focus() {
        view.focus();
      }
    };

    return () => {
      ref = null;
      view.destroy();
    };
  });
</script>

<div bind:this={container} class="pm-editor-host"></div>
