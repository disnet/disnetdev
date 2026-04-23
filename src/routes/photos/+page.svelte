<script lang="ts">
  let { data } = $props();

  function formatDate(iso: string) {
    if (!iso) return '';

    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  const hasPrev = $derived(data.page > 1);
  const hasNext = $derived(data.page < data.totalPages);
  const prevHref = $derived(data.page - 1 <= 1 ? '/photos' : `/photos?page=${data.page - 1}`);
  const nextHref = $derived(`/photos?page=${data.page + 1}`);
</script>

<svelte:head>
  <title>Photos · disnetdev</title>
  <meta
    name="description"
    content="Photos from @photos.disnetdev.com on Bluesky."
  />
</svelte:head>

<section class="heading-block">
  <p class="page-eyebrow">photolog</p>
  <h1 class="page-heading">Photos</h1>
  <p class="page-lede">
    Images posted from
    <a href="https://bsky.app/profile/photos.disnetdev.com" rel="me">@photos.disnetdev.com</a>
    on Bluesky. {data.total} post{data.total === 1 ? '' : 's'} so far.
  </p>
</section>

{#if data.photos.length === 0}
  <p class="empty">
    <span class="empty-prompt">▸</span> no photos have come through yet.
  </p>
{:else}
  <ol class="photo-feed">
    {#each data.photos as photo}
      <li class="photo-post">
        <article>
          <header class="photo-meta">
            <a href={photo.url} rel="noopener">
              {formatDate(photo.createdAt)}
            </a>
          </header>

          <div class:photo-grid={photo.images.length > 1} class:photo-single={photo.images.length === 1}>
            {#each photo.images as image}
              <a
                class="photo-frame"
                href={image.fullsize}
                rel="noopener"
                style={`--photo-aspect: ${image.aspectRatio ?? '4 / 3'};`}
              >
                <img
                  src={image.thumb}
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                />
              </a>
            {/each}
          </div>

          {#if photo.text}
            <p class="photo-caption">{photo.text}</p>
          {/if}
        </article>
      </li>
    {/each}
  </ol>

  {#if data.totalPages > 1}
    <nav class="pager" aria-label="Pagination">
      {#if hasPrev}
        <a class="pager-link pager-link--prev" href={prevHref} rel="prev">
          ◂ newer
        </a>
      {:else}
        <span class="pager-gap"></span>
      {/if}

      <span class="pager-pos">
        page {data.page} of {data.totalPages}
      </span>

      {#if hasNext}
        <a class="pager-link pager-link--next" href={nextHref} rel="next">
          older ▸
        </a>
      {:else}
        <span class="pager-gap"></span>
      {/if}
    </nav>
  {/if}
{/if}

<style>
  .heading-block {
    margin-bottom: var(--space-2xl);
  }

  .empty {
    font-style: italic;
    color: var(--ink-text-soft);
    max-width: var(--measure);
    line-height: 1.6;
  }

  .empty-prompt {
    color: var(--ink-accent);
    font-style: normal;
    margin-right: 0.3ch;
  }

  .photo-feed {
    list-style: none;
    padding: 0;
    margin: 0;
    max-width: var(--measure-wide);
    display: grid;
    gap: var(--space-2xl);
  }

  .photo-post {
    border-top: var(--rule) solid var(--ink-rule-soft);
    padding-top: var(--space-md);
  }

  .photo-post:last-child {
    border-bottom: var(--rule) solid var(--ink-rule-soft);
    padding-bottom: var(--space-2xl);
  }

  .photo-meta {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
    letter-spacing: 0.06em;
    margin-bottom: var(--space-sm);
    font-variant-numeric: tabular-nums;
  }

  .photo-meta a {
    color: inherit;
    text-decoration: none;
  }

  .photo-meta a:hover,
  .photo-meta a:focus-visible {
    color: var(--ink-accent-hover);
  }

  .photo-single,
  .photo-grid {
    display: grid;
    gap: var(--space-xs);
  }

  .photo-single {
    max-width: min(100%, 46rem);
  }

  .photo-grid {
    grid-template-columns: repeat(auto-fit, minmax(min(16rem, 100%), 1fr));
  }

  .photo-frame {
    display: block;
    background: var(--ink-surface);
    aspect-ratio: var(--photo-aspect);
    overflow: hidden;
    border: var(--rule) solid var(--ink-rule-soft);
    text-decoration: none;
  }

  .photo-frame img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .photo-caption {
    max-width: var(--measure);
    margin: var(--space-sm) 0 0;
    white-space: pre-wrap;
    color: var(--ink-text);
    font-size: var(--type-lg);
    line-height: 1.55;
  }

  .pager {
    margin-top: var(--space-2xl);
    padding-top: var(--space-md);
    border-top: var(--rule) solid var(--ink-rule);
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: baseline;
    gap: var(--space-md);
    font-family: var(--font-meta);
    font-size: var(--type-sm);
    letter-spacing: 0.08em;
    text-transform: lowercase;
  }

  .pager-link {
    color: var(--ink-text-soft);
    text-decoration: none;
    transition: color 120ms ease-out;
  }

  .pager-link:hover,
  .pager-link:focus-visible {
    color: var(--ink-accent-hover);
  }

  .pager-link--prev {
    justify-self: start;
  }

  .pager-link--next {
    justify-self: end;
  }

  .pager-pos {
    font-family: var(--font-mono);
    font-size: var(--type-xs);
    color: var(--ink-muted);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.04em;
    text-align: center;
  }

  .pager-gap {
    display: block;
  }

  @media (max-width: 42rem) {
    .photo-feed {
      gap: var(--space-xl);
    }

    .photo-caption {
      font-size: var(--type-base);
    }
  }
</style>
