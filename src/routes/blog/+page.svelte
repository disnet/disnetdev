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

  const total = $derived(data.posts.length);
  const numbered = $derived(
    data.posts.map((post, i) => ({
      post,
      num: String(total - i).padStart(3, '0')
    }))
  );
</script>

<svelte:head>
  <title>Blog · disnetdev</title>
</svelte:head>

<section class="heading-block">
  <p class="page-eyebrow">log</p>
  <h1 class="page-heading">Blog</h1>
  <p class="page-lede">
    {total} post{total === 1 ? '' : 's'} on programming languages, macros, type
    systems, local-first software, and whatever else has held attention.
  </p>
</section>

{#if data.posts.length === 0}
  <p class="empty">No published posts yet.</p>
{:else}
  <ol class="index">
    {#each numbered as { post, num }}
      <li class="index-entry">
        <span class="index-num">#{num}</span>
        <div class="index-body">
          <h2 class="index-title">
            <a href={post.path}>{post.title}</a>
          </h2>
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

<style>
  .heading-block {
    margin-bottom: var(--space-2xl);
  }

  .empty {
    color: var(--ink-text-soft);
    font-style: italic;
  }
</style>
