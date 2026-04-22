<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.paper.title} · disnetdev</title>
  <meta name="description" content={data.paper.abstract} />
</svelte:head>

<article class="post">
  <header class="post-header">
    <h1 class="post-title">{data.paper.title}</h1>
    <ul class="paper-meta">
      <li class="paper-meta-year">
        <time datetime={String(data.paper.publishedYear)}>
          {data.paper.publishedYear}
        </time>
      </li>
      {#if data.paper.authors.length}
        <li class="paper-meta-sep" aria-hidden="true">·</li>
        <li class="paper-meta-authors">
          {#each data.paper.authors as author, i}
            {#if author.link && author.link !== '#'}
              <a
                class="paper-meta-author"
                class:paper-meta-author--self={author.name === 'Tim Disney'}
                href={author.link}>{author.name}</a>
            {:else}
              <span
                class="paper-meta-author"
                class:paper-meta-author--self={author.name === 'Tim Disney'}>
                {author.name}
              </span>
            {/if}{#if i < data.paper.authors.length - 1}<span
                class="paper-meta-author-sep"
                aria-hidden="true">,</span
              >
            {/if}
          {/each}
        </li>
      {/if}
    </ul>
  </header>

  <aside class="post-margin" aria-label="Paper downloads">
    <dl class="post-margin-list">
      {#each data.paper.venues as venue}
        <div class="post-margin-item">
          <dt>{venue.name}</dt>
          <dd>
            {#if venue.files.length}
              <ul class="venue-files">
                {#each venue.files as file}
                  <li>
                    <a class="venue-file" href={file.link}>
                      <span class="venue-file-glyph" aria-hidden="true">▸</span>
                      {file.name}
                    </a>
                  </li>
                {/each}
              </ul>
            {/if}
          </dd>
        </div>
      {/each}
    </dl>
  </aside>

  <div class="prose">
    {@html data.paper.html}
  </div>

  <footer class="post-statusline">
    <span class="post-statusline-path">
      <span class="post-statusline-prompt">$</span>
      ~/papers/{data.paper.slug}
    </span>
    <a class="post-statusline-return" href="/papers">◂ back to papers</a>
  </footer>
</article>

<style>
  .paper-meta {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0 0.8ch;
    align-items: baseline;
    line-height: 1.5;
  }

  .paper-meta-year {
    font-family: var(--font-mono);
    font-size: var(--type-sm);
    color: var(--ink-accent);
    letter-spacing: 0.04em;
    font-variant-numeric: tabular-nums;
  }

  .paper-meta-sep {
    color: var(--ink-rule);
    font-family: var(--font-mono);
    font-size: var(--type-sm);
  }

  .paper-meta-authors {
    font-family: var(--font-body);
    font-size: 1rem;
    font-style: italic;
    color: var(--ink-text-soft);
  }

  .paper-meta-author {
    color: var(--ink-text-soft);
    text-decoration: none;
  }

  a.paper-meta-author:hover,
  a.paper-meta-author:focus-visible {
    color: var(--ink-accent-hover);
    text-decoration: underline;
    text-decoration-color: currentColor;
    text-underline-offset: 0.22em;
  }

  .paper-meta-author--self {
    color: var(--ink-text);
    font-style: normal;
    font-weight: 500;
  }

  .paper-meta-author-sep {
    color: var(--ink-rule);
    margin-left: -0.2ch;
    font-style: normal;
  }

  .venue-files {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: var(--space-3xs);
  }

  .venue-file {
    display: inline-flex;
    align-items: baseline;
    gap: 0.6ch;
    font-family: var(--font-mono);
    font-size: var(--type-sm);
    color: var(--ink-text);
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: color 120ms ease-out;
  }

  .venue-file-glyph {
    color: var(--ink-accent);
    transition: transform 200ms ease-out;
  }

  .venue-file:hover,
  .venue-file:focus-visible {
    color: var(--ink-accent-hover);
  }

  .venue-file:hover .venue-file-glyph,
  .venue-file:focus-visible .venue-file-glyph {
    transform: translateX(0.2ch);
  }
</style>
