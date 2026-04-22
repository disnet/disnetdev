<script lang="ts">
  let { data } = $props();

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Posts arrive newest-first. Number them within the shown slice so the
  // most recent carries the highest label.
  const total = $derived(data.posts.length);
  const numbered = $derived(
    data.posts.map((post, i) => ({
      post,
      num: String(total - i).padStart(3, '0')
    }))
  );
</script>

<svelte:head>
  <title>{data.publication.record.name}</title>
  <meta name="description" content={data.publication.record.description ?? ''} />
</svelte:head>

<section class="intro">
  <p class="page-eyebrow">dispatch</p>
  <h1 class="page-heading">{data.publication.record.name}</h1>
  {#if data.publication.record.description}
    <p class="page-lede">{data.publication.record.description}</p>
  {/if}
</section>

<section aria-labelledby="recent-heading" class="recent">
  <header class="recent-header">
    <h2 id="recent-heading" class="recent-title">Recent transmissions</h2>
    <a href="/blog" class="read-more">all posts</a>
  </header>

  {#if data.posts.length === 0}
    <p class="empty">
      <span class="empty-prompt">▸</span> the transmitter is warm but quiet. the
      first post from the new stack is on its way.
    </p>
  {:else}
    <ol class="index">
      {#each numbered as { post, num }}
        <li class="index-entry">
          <span class="index-num">#{num}</span>
          <div class="index-body">
            <h3 class="index-title">
              <a href={post.path}>{post.title}</a>
            </h3>
            {#if post.description}
              <p class="index-desc">{post.description}</p>
            {/if}
            <div class="index-meta">
              <span>{formatDate(post.publishedAt)}</span>
              {#if post.tags?.length}
                <span class="index-meta-sep">·</span>
                <span>{post.tags.slice(0, 3).join(' · ')}</span>
              {/if}
            </div>
          </div>
        </li>
      {/each}
    </ol>
  {/if}
</section>

<style>
  .intro {
    margin-bottom: var(--space-2xl);
  }

  .recent-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-md);
    margin-bottom: var(--space-md);
    max-width: var(--measure-wide);
  }

  .recent-title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: var(--type-h2);
    letter-spacing: -0.01em;
    margin: 0;
    color: var(--ink-text);
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
</style>
