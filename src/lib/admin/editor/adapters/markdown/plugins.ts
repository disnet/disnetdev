import { keymap } from 'prosemirror-keymap';
import { history, undo, redo } from 'prosemirror-history';
import { baseKeymap, toggleMark, setBlockType, wrapIn } from 'prosemirror-commands';
import {
  inputRules,
  wrappingInputRule,
  textblockTypeInputRule,
  smartQuotes,
  emDash,
  ellipsis,
  InputRule
} from 'prosemirror-inputrules';
import { splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list';
import { TextSelection, type Plugin, type Command } from 'prosemirror-state';
import { markdownSchema as schema } from './schema';

function collectFootnoteLabels(doc: import('prosemirror-model').Node): Set<string> {
  const labels = new Set<string>();
  const defType = schema.nodes.footnote_definition;
  doc.descendants((node) => {
    if (node.type === defType) {
      labels.add(node.attrs.label as string);
    }
    return true;
  });
  return labels;
}

const insertFootnote: Command = (state, dispatch) => {
  const refType = schema.nodes.footnote_ref;
  const defType = schema.nodes.footnote_definition;
  const paraType = schema.nodes.paragraph;

  // Pick the next free numeric label so back-references are easy.
  const used = collectFootnoteLabels(state.doc);
  let n = 1;
  while (used.has(String(n))) n += 1;
  const label = String(n);

  if (!dispatch) return true;

  const ref = refType.create({ label });
  const def = defType.create({ label }, paraType.create());

  let tr = state.tr.replaceSelectionWith(ref, false);
  const defStart = tr.doc.content.size;
  tr = tr.insert(defStart, def);
  // Inside def, inside paragraph: defStart + 1 (enter def) + 1 (enter para)
  tr = tr.setSelection(TextSelection.create(tr.doc, defStart + 2));
  tr = tr.scrollIntoView();
  dispatch(tr);
  return true;
};

const footnoteBackrefRule = new InputRule(
  /\[\^([\w-]+)\]\s$/,
  (state, match, start, end) => {
    const label = match[1];
    const used = collectFootnoteLabels(state.doc);
    if (!used.has(label)) return null;
    const ref = schema.nodes.footnote_ref.create({ label });
    return state.tr.replaceWith(start, end, ref).insertText(' ');
  }
);

export function markdownPlugins(): Plugin[] {
  const headingRule = textblockTypeInputRule(/^(#{1,6})\s$/, schema.nodes.heading, (match) => ({
    level: match[1].length
  }));
  const blockquoteRule = wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote);
  const bulletListRule = wrappingInputRule(/^\s*([-*])\s$/, schema.nodes.bullet_list);
  const orderedListRule = wrappingInputRule(
    /^(\d+)\.\s$/,
    schema.nodes.ordered_list,
    (match) => ({ order: Number(match[1]) }),
    (match, node) => node.childCount + (node.attrs.order ?? 1) === Number(match[1])
  );

  return [
    history(),
    keymap({
      'Mod-z': undo,
      'Mod-y': redo,
      'Shift-Mod-z': redo,
      'Mod-b': toggleMark(schema.marks.strong),
      'Mod-i': toggleMark(schema.marks.em),
      'Mod-`': toggleMark(schema.marks.code),
      'Mod-.': insertFootnote,
      'Shift-Ctrl-0': setBlockType(schema.nodes.paragraph),
      'Shift-Ctrl-\\': setBlockType(schema.nodes.code_block),
      'Shift-Ctrl-1': setBlockType(schema.nodes.heading, { level: 1 }),
      'Shift-Ctrl-2': setBlockType(schema.nodes.heading, { level: 2 }),
      'Shift-Ctrl-3': setBlockType(schema.nodes.heading, { level: 3 }),
      'Ctrl->': wrapIn(schema.nodes.blockquote),
      Enter: splitListItem(schema.nodes.list_item),
      'Mod-[': liftListItem(schema.nodes.list_item),
      'Mod-]': sinkListItem(schema.nodes.list_item)
    }),
    keymap(baseKeymap),
    inputRules({
      rules: [
        ...smartQuotes,
        ellipsis,
        emDash,
        headingRule,
        blockquoteRule,
        bulletListRule,
        orderedListRule,
        footnoteBackrefRule
      ]
    })
  ];
}
