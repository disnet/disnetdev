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
  import { EditorState } from '@codemirror/state';
  import { EditorView, keymap, placeholder as placeholderExt } from '@codemirror/view';
  import { history, historyKeymap, defaultKeymap } from '@codemirror/commands';
  import { markdown } from '@codemirror/lang-markdown';
  import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
  import { tags as t } from '@lezer/highlight';

  type Props = {
    content: ContentValue;
    onChange: (content: ContentValue) => void;
    placeholder?: string;
    spellcheck?: boolean;
    ref?: EditorRef | null;
  };

  let {
    content,
    onChange,
    placeholder,
    spellcheck = true,
    ref = $bindable<EditorRef | null>(null)
  }: Props = $props();

  let container = $state<HTMLDivElement | undefined>(undefined);

  function markdownText(value: ContentValue): string {
    return value.$type === 'dev.disnet.blog.content.markdown' ? value.markdown : '';
  }

  function nextFootnoteLabel(text: string): string {
    const used = new Set<number>();
    for (const m of text.matchAll(/\[\^(\d+)\]/g)) {
      used.add(Number(m[1]));
    }
    let n = 1;
    while (used.has(n)) n += 1;
    return String(n);
  }

  function insertFootnote(view: EditorView): boolean {
    const doc = view.state.doc.toString();
    const label = nextFootnoteLabel(doc);
    const ref = `[^${label}]`;
    const { from, to } = view.state.selection.main;

    const trailingNewlines = /\n*$/.exec(doc)?.[0].length ?? 0;
    const padding = trailingNewlines >= 2 ? '' : trailingNewlines === 1 ? '\n' : '\n\n';
    const defText = `${padding}[^${label}]: `;
    const docEnd = doc.length;
    const defStart = docEnd + ref.length;
    const cursor = defStart + defText.length;

    view.dispatch({
      changes: [
        { from, to, insert: ref },
        { from: docEnd, to: docEnd, insert: defText }
      ],
      selection: { anchor: cursor },
      scrollIntoView: true
    });
    view.focus();
    return true;
  }

  const highlightStyle = HighlightStyle.define([
    { tag: t.heading1, fontFamily: 'var(--ff-display)', fontWeight: '500', fontSize: 'var(--fz-2xl)', color: 'var(--ink)' },
    { tag: t.heading2, fontFamily: 'var(--ff-display)', fontWeight: '500', fontSize: 'var(--fz-xl)', color: 'var(--ink)' },
    { tag: t.heading3, fontFamily: 'var(--ff-display)', fontWeight: '500', fontSize: 'var(--fz-lg)', color: 'var(--ink)' },
    { tag: t.heading4, fontFamily: 'var(--ff-display)', fontWeight: '500', fontStyle: 'italic', color: 'var(--ink)' },
    { tag: t.strong, fontWeight: '600', color: 'var(--ink)' },
    { tag: t.emphasis, fontStyle: 'italic', color: 'var(--ink)' },
    { tag: t.link, color: 'var(--accent)', textDecoration: 'underline' },
    { tag: t.url, color: 'var(--accent)' },
    { tag: t.monospace, fontFamily: 'var(--ff-mono)', color: 'var(--ink-2)' },
    { tag: t.quote, fontStyle: 'italic', color: 'var(--ink-2)' },
    { tag: t.list, color: 'var(--ink-2)' },
    { tag: t.meta, color: 'var(--ink-faint)' },
    { tag: t.processingInstruction, color: 'var(--ink-faint)' },
    { tag: t.contentSeparator, color: 'var(--ink-faint)' }
  ]);

  $effect(() => {
    if (!container) return;

    const initial = untrack(() => content);
    const initialPlaceholder = untrack(() => placeholder);
    const initialSpellcheck = untrack(() => spellcheck);

    const view = new EditorView({
      parent: container,
      state: EditorState.create({
        doc: markdownText(initial),
        extensions: [
          history(),
          keymap.of([
            { key: 'Mod-.', run: insertFootnote },
            ...defaultKeymap,
            ...historyKeymap
          ]),
          markdown(),
          syntaxHighlighting(highlightStyle),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({
            spellcheck: String(initialSpellcheck)
          }),
          ...(initialPlaceholder ? [placeholderExt(initialPlaceholder)] : []),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) {
              onChange({
                $type: 'dev.disnet.blog.content.markdown',
                markdown: u.state.doc.toString()
              });
            }
          })
        ]
      })
    });

    ref = {
      insertImage({ blob, alt }) {
        const altText = alt ?? '';
        const md = `![${altText}](blob:${blob.ref.$link})`;
        const { from, to } = view.state.selection.main;
        view.dispatch({
          changes: { from, to, insert: md },
          selection: { anchor: from + md.length },
          scrollIntoView: true
        });
        view.focus();
      },
      setContent(next) {
        const text = markdownText(next);
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: text }
        });
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

<div bind:this={container} class="cm-editor-host"></div>
