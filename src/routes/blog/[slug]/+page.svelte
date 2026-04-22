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
</script>

<svelte:head>
  <title>{data.post.title} · disnetdev</title>
  {#if data.post.description}
    <meta name="description" content={data.post.description} />
  {/if}
  <link rel="site.standard.document" href={data.post.uri} />
</svelte:head>

<article class="post">
  <header class="post-header">
    {#if data.post.coverImageUrl}
      <figure class="post-cover">
        <img src={data.post.coverImageUrl} alt={data.post.coverImageAlt ?? ''} loading="eager" />
      </figure>
    {/if}
    <h1 class="post-title">{data.post.title}</h1>
    {#if data.post.description}
      <p class="post-description">{data.post.description}</p>
    {/if}
  </header>

  <aside class="post-margin" aria-label="Post metadata">
    <dl class="post-margin-list">
      <div class="post-margin-item">
        <dt>published</dt>
        <dd>
          <time datetime={data.post.publishedAt}>
            {formatDate(data.post.publishedAt)}
          </time>
        </dd>
      </div>
      {#if data.post.updatedAt && data.post.updatedAt !== data.post.publishedAt}
        <div class="post-margin-item">
          <dt>updated</dt>
          <dd>
            <time datetime={data.post.updatedAt}>
              {formatDate(data.post.updatedAt)}
            </time>
          </dd>
        </div>
      {/if}
      {#if data.post.tags?.length}
        <div class="post-margin-item">
          <dt>tags</dt>
          <dd>
            <ul class="post-margin-tags">
              {#each data.post.tags as tag}
                <li>{tag}</li>
              {/each}
            </ul>
          </dd>
        </div>
      {/if}
    </dl>
  </aside>

  <div class="prose">
    {@html data.post.html}
  </div>

  <footer class="post-statusline">
    <span class="post-statusline-path">
      <span class="post-statusline-prompt">$</span>
      ~/blog/{data.post.slug}
    </span>
    <a class="post-statusline-return" href="/blog">◂ back to index</a>
  </footer>
</article>
