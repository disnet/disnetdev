import matter from 'gray-matter';
import { renderMarkdown } from '$lib/markdown/render';

export interface PaperAuthor {
  name: string;
  link?: string;
}

export interface PaperFile {
  name: string;
  link: string;
}

export interface PaperVenue {
  name: string;
  files: PaperFile[];
}

export interface PaperSummary {
  slug: string;
  title: string;
  publishedYear: number;
  authors: PaperAuthor[];
  venues: PaperVenue[];
  abstract: string;
}

export interface Paper extends PaperSummary {
  html: string;
}

interface ParsedPaper {
  slug: string;
  summary: PaperSummary;
  body: string;
}

interface RawFrontmatter {
  title: string;
  published_year: number;
  published_how?: Array<{ name: string; files?: Array<{ name: string; link: string }> }>;
  authors?: Array<{ name: string; link?: string }>;
}

const rawFiles = import.meta.glob('./*.md', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;

function firstSentence(body: string): string {
  const trimmed = body.trim();
  const stop = trimmed.search(/[.!?](\s|$)/);
  if (stop === -1) return trimmed;
  return trimmed.slice(0, stop + 1).replace(/\s+/g, ' ');
}

function parseFile(path: string, raw: string): ParsedPaper {
  const slug = path.replace(/^\.\//, '').replace(/\.md$/, '');
  const parsed = matter(raw);
  const data = parsed.data as RawFrontmatter;
  return {
    slug,
    body: parsed.content,
    summary: {
      slug,
      title: data.title,
      publishedYear: data.published_year,
      authors: data.authors ?? [],
      venues: (data.published_how ?? []).map((v) => ({
        name: v.name,
        files: v.files ?? []
      })),
      abstract: firstSentence(parsed.content)
    }
  };
}

const papers: Record<string, ParsedPaper> = {};
for (const [path, raw] of Object.entries(rawFiles)) {
  const parsed = parseFile(path, raw);
  papers[parsed.slug] = parsed;
}

const sortedSummaries: PaperSummary[] = Object.values(papers)
  .map((p) => p.summary)
  .sort((a, b) => {
    if (b.publishedYear !== a.publishedYear) return b.publishedYear - a.publishedYear;
    return a.title.localeCompare(b.title);
  });

export function listPapers(): PaperSummary[] {
  return sortedSummaries;
}

export async function getPaperBySlug(slug: string): Promise<Paper | null> {
  const entry = papers[slug];
  if (!entry) return null;
  const rendered = await renderMarkdown(entry.body);
  const html = rendered.html;
  return { ...entry.summary, html };
}
