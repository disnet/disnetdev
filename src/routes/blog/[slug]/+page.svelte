<script lang="ts">
  let { data } = $props();

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function formatDateShort(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
</script>

<svelte:head>
  <title>{data.post.title} · disnetdev</title>
  {#if data.post.description}
    <meta name="description" content={data.post.description} />
  {/if}
  <link rel="site.standard.document" href={data.post.uri} />
</svelte:head>

<article>
  <header class="post-header">
    <div class="post-meta">
      <span class="post-meta-item">
        <span class="post-meta-marker">▸</span>
        <time datetime={data.post.publishedAt}>{formatDate(data.post.publishedAt)}</time>
      </span>
      {#if data.post.tags?.length}
        <span class="post-meta-item">
          {data.post.tags.slice(0, 4).join(' · ')}
        </span>
      {/if}
    </div>
    <h1 class="post-title">{data.post.title}</h1>
    {#if data.post.description}
      <p class="post-description">{data.post.description}</p>
    {/if}
  </header>

  <div class="prose">
    {@html data.post.html}
  </div>

  <footer class="post-statusline">
    <span>
      <span class="post-statusline-key">published</span>
      <span class="post-statusline-val">{formatDateShort(data.post.publishedAt)}</span>
    </span>
    {#if data.post.updatedAt && data.post.updatedAt !== data.post.publishedAt}
      <span>
        <span class="post-statusline-key">updated</span>
        <span class="post-statusline-val">{formatDateShort(data.post.updatedAt)}</span>
      </span>
    {/if}
    {#if data.post.tags?.length}
      <span>
        <span class="post-statusline-key">tags</span>
        {#each data.post.tags as tag, i}
          <span class="post-statusline-tag">{tag}</span>{#if i < data.post.tags.length - 1}<span class="post-statusline-key">,</span> {/if}
        {/each}
      </span>
    {/if}
    <span class="post-statusline-return">
      <a href="/blog">◂ back to index</a>
    </span>
  </footer>
</article>

<style>
  article {
    max-width: var(--measure-wide);
  }

  .post-statusline-return {
    margin-inline-start: auto;
  }

  .post-statusline-return a {
    color: var(--ink-text-soft);
    text-decoration: none;
    transition: color 120ms ease-out;
  }

  .post-statusline-return a:hover,
  .post-statusline-return a:focus-visible {
    color: var(--ink-accent-hover);
  }
</style>
