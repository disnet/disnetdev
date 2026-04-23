import { Marked } from 'marked';

type FootnoteRefToken = {
  type: 'footnoteRef';
  raw: string;
  label: string;
  number: number;
  id: string;
  refId: string;
  html: string;
  isFirstReference: boolean;
};

export type RenderedFootnote = {
  id: string;
  refId: string;
  label: string;
  number: number;
  html: string;
};

export type RenderedMarkdown = {
  html: string;
  footnotes: RenderedFootnote[];
};

const FOOTNOTE_DEFINITION = /^\[\^([^\]]+)\]:\s?(.*)$/;
const FOOTNOTE_REFERENCE = /^\[\^([^\]]+)\]/;
const FOOTNOTE_CONTINUATION = /^(?: {2,}|\t)(.*)$/;

const marked = new Marked();

marked.setOptions({
  gfm: true,
  breaks: false
});

function slugifyFootnoteLabel(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getFootnoteId(label: string, number: number) {
  return `footnote-${slugifyFootnoteLabel(label) || number}`;
}

function stripParagraphWrapper(html: string) {
  const trimmed = html.trim();
  const match = /^<p>([\s\S]*)<\/p>$/.exec(trimmed);
  return match ? match[1] : trimmed;
}

function extractFootnoteDefinitions(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const body: string[] = [];
  const definitions = new Map<string, string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const match = FOOTNOTE_DEFINITION.exec(line);

    if (!match) {
      body.push(line);
      continue;
    }

    const label = match[1].trim();
    const note: string[] = [match[2]];
    index += 1;

    while (index < lines.length) {
      const continuation = FOOTNOTE_CONTINUATION.exec(lines[index]);

      if (continuation) {
        note.push(continuation[1]);
        index += 1;
        continue;
      }

      if (lines[index] === '' && FOOTNOTE_CONTINUATION.test(lines[index + 1] ?? '')) {
        note.push('');
        index += 1;
        continue;
      }

      break;
    }

    definitions.set(label, note.join('\n').trim());
    index -= 1;
  }

  return {
    markdown: body.join('\n'),
    definitions
  };
}

export async function renderMarkdown(markdown: string): Promise<RenderedMarkdown> {
  const extracted = extractFootnoteDefinitions(markdown);
  const footnoteLabels: string[] = [];
  const footnoteNumbers = new Map<string, number>();
  const renderedDefinitions = new Map<string, string>();
  const emittedSidenotes = new Set<string>();

  for (const [label, definition] of extracted.definitions) {
    renderedDefinitions.set(label, stripParagraphWrapper(String(marked.parse(definition))));
  }

  const parser = new Marked({
    gfm: true,
    breaks: false,
    extensions: [
      {
        name: 'footnoteRef',
        level: 'inline',
        start(source) {
          return source.indexOf('[^');
        },
        tokenizer(source) {
          const match = FOOTNOTE_REFERENCE.exec(source);
          if (!match) return undefined;

          const label = match[1].trim();
          if (!extracted.definitions.has(label)) return undefined;

          const isFirstReference = !footnoteNumbers.has(label);
          let number = footnoteNumbers.get(label);
          if (!number) {
            number = footnoteLabels.length + 1;
            footnoteLabels.push(label);
            footnoteNumbers.set(label, number);
          }

          const id = getFootnoteId(label, number);

          return {
            type: 'footnoteRef',
            raw: match[0],
            label,
            number,
            id,
            refId: `${id}-ref`,
            html: renderedDefinitions.get(label) ?? '',
            isFirstReference
          } satisfies FootnoteRefToken;
        },
        renderer(token) {
          const footnote = token as FootnoteRefToken;
          const reference = `<sup class="footnote-ref"><a class="footnote-ref-link" href="#${footnote.id}" id="${footnote.refId}" aria-label="Footnote ${footnote.number}">${footnote.number}</a></sup>`;

          if (!footnote.isFirstReference || emittedSidenotes.has(footnote.label)) {
            return reference;
          }

          emittedSidenotes.add(footnote.label);
          return `${reference}<span class="sidenote" id="${footnote.id}"><input class="sidenote-control" id="${footnote.id}-toggle" type="checkbox" /><label class="sidenote-toggle" for="${footnote.id}-toggle" aria-label="Show footnote ${footnote.number}"><span class="sidenote-number">${footnote.number}</span></label><span class="sidenote-body">${footnote.html}</span></span>`;
        }
      }
    ]
  });

  const html = String(await parser.parse(extracted.markdown));
  const footnotes: RenderedFootnote[] = [];

  return { html, footnotes };
}
