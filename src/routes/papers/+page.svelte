<script lang="ts">
  import type { PaperSummary } from '$lib/papers';

  let { data } = $props();

  const byYear = $derived(
    data.papers.reduce<Array<{ year: number; papers: PaperSummary[] }>>(
      (acc, paper) => {
        const bucket = acc.at(-1);
        if (bucket && bucket.year === paper.publishedYear) {
          bucket.papers.push(paper);
        } else {
          acc.push({ year: paper.publishedYear, papers: [paper] });
        }
        return acc;
      },
      []
    )
  );

  const total = $derived(data.papers.length);
</script>

<svelte:head>
  <title>Papers · disnetdev</title>
  <meta
    name="description"
    content="Academic papers on hygienic macros, contracts, type soundness, and information flow." />
</svelte:head>

<section class="heading-block">
  <p class="page-eyebrow">bibliography</p>
  <h1 class="page-heading">Papers</h1>
  <p class="page-lede">
    Work from a decade of programming-language research, mostly at UC Santa Cruz.
    Hygienic macros for JavaScript, higher-order contracts, information flow,
    and type soundness via trace semantics.
  </p>
</section>

<div class="papers">
  {#each byYear as group}
    <h2 class="index-year-heading">
      <span>{group.year}</span>
      <span class="index-year-heading-rule" aria-hidden="true"></span>
      <span class="index-year-count">
        {group.papers.length} paper{group.papers.length === 1 ? '' : 's'}
      </span>
    </h2>
    <ol class="paper-list">
      {#each group.papers as paper}
        <li class="paper">
          <h3 class="paper-title">
            <a href={`/papers/${paper.slug}`}>{paper.title}</a>
          </h3>
          {#if paper.authors.length}
            <p class="paper-authors">
              {#each paper.authors as author, i}
                {#if author.link && author.link !== '#'}
                  <a
                    class="paper-author"
                    class:paper-author--self={author.name === 'Tim Disney'}
                    href={author.link}>{author.name}</a>
                {:else}
                  <span
                    class="paper-author"
                    class:paper-author--self={author.name === 'Tim Disney'}>
                    {author.name}
                  </span>
                {/if}{#if i < paper.authors.length - 1}<span
                    class="paper-author-sep"
                    aria-hidden="true">·</span
                  >{/if}
              {/each}
            </p>
          {/if}
          {#if paper.venues.length}
            <ul class="paper-venues">
              {#each paper.venues as venue}
                <li class="paper-venue">
                  <span class="paper-venue-name">{venue.name}</span>
                  {#each venue.files as file}
                    <a class="paper-venue-file" href={file.link}>
                      {file.name}
                    </a>
                  {/each}
                </li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ol>
  {/each}
</div>

<p class="papers-footer">
  <span class="papers-footer-prompt">▸</span>
  {total} paper{total === 1 ? '' : 's'} in total.
</p>

<style>
  .heading-block {
    margin-bottom: var(--space-2xl);
  }

  .papers {
    max-width: var(--measure-wide);
  }

  .paper-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .paper {
    padding: var(--space-md) 0;
    border-top: var(--rule) solid var(--ink-rule-soft);
    display: grid;
    gap: var(--space-2xs);
  }

  .paper:last-child {
    border-bottom: var(--rule) solid var(--ink-rule-soft);
  }

  .paper-title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: var(--type-lg);
    line-height: 1.25;
    letter-spacing: -0.005em;
    margin: 0;
  }

  .paper-title a {
    color: var(--ink-text);
    text-decoration: none;
  }

  .paper-title a:hover,
  .paper-title a:focus-visible {
    color: var(--ink-accent-hover);
  }

  .paper-authors {
    margin: 0;
    font-family: var(--font-body);
    font-size: 1rem;
    font-style: italic;
    color: var(--ink-text-soft);
    line-height: 1.5;
    max-width: var(--measure);
  }

  .paper-author {
    color: var(--ink-text-soft);
    text-decoration: none;
  }

  a.paper-author:hover,
  a.paper-author:focus-visible {
    color: var(--ink-accent-hover);
    text-decoration: underline;
    text-decoration-color: currentColor;
    text-underline-offset: 0.22em;
  }

  .paper-author--self {
    color: var(--ink-text);
    font-style: normal;
    font-weight: 500;
  }

  .paper-author-sep {
    color: var(--ink-rule);
    margin: 0 0.35ch;
    font-style: normal;
  }

  .paper-venues {
    list-style: none;
    padding: 0;
    margin: var(--space-3xs) 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2xs) var(--space-md);
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
  }

  .paper-venue {
    display: inline-flex;
    align-items: baseline;
    gap: 0.8ch;
    color: var(--ink-muted);
  }

  .paper-venue-name {
    color: var(--ink-accent);
    text-transform: lowercase;
  }

  .paper-venue-file {
    color: var(--ink-text-soft);
    text-decoration: none;
    padding: 0 0.3ch;
    transition: color 120ms ease-out;
  }

  .paper-venue-file::before {
    content: '[';
    color: var(--ink-rule);
    margin-right: 0.1ch;
  }

  .paper-venue-file::after {
    content: ']';
    color: var(--ink-rule);
    margin-left: 0.1ch;
  }

  .paper-venue-file:hover,
  .paper-venue-file:focus-visible {
    color: var(--ink-accent-hover);
  }

  .papers-footer {
    margin-top: var(--space-xl);
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
    letter-spacing: 0.06em;
  }

  .papers-footer-prompt {
    color: var(--ink-accent);
    margin-right: 0.5ch;
  }
</style>
