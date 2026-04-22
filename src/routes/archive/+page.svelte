<script lang="ts">
  import type { DocumentSummary } from '$lib/types/blog';

  let { data } = $props();

  function formatShort(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Group posts by year (newest first).
  const byYear = $derived(
    data.posts.reduce<Array<{ year: number; posts: DocumentSummary[] }>>(
      (acc, post) => {
        const year = new Date(post.publishedAt).getUTCFullYear();
        const bucket = acc.at(-1);
        if (bucket && bucket.year === year) {
          bucket.posts.push(post);
        } else {
          acc.push({ year, posts: [post] });
        }
        return acc;
      },
      []
    )
  );

  const total = $derived(data.posts.length);
</script>

<svelte:head>
  <title>Archive · disnetdev</title>
</svelte:head>

<section class="heading-block">
  <p class="page-eyebrow">index</p>
  <h1 class="page-heading">Archive</h1>
  <p class="page-lede">
    Every post, by year. {total} in total, going back to 2011.
  </p>
</section>

{#if data.posts.length === 0}
  <p class="empty">No published posts yet.</p>
{:else}
  <div class="archive">
    {#each byYear as group}
      <h2 class="index-year-heading">
        <span>{group.year}</span>
        <span class="index-year-heading-rule" aria-hidden="true"></span>
        <span class="index-year-count">
          {group.posts.length} post{group.posts.length === 1 ? '' : 's'}
        </span>
      </h2>
      <ol class="index index--dense">
        {#each group.posts as post}
          <li class="index-entry">
            <span class="index-num">{formatShort(post.publishedAt)}</span>
            <div class="index-body">
              <h3 class="index-title">
                <a href={post.path}>{post.title}</a>
              </h3>
              {#if post.tags?.length}
                <div class="index-meta">
                  <span>{post.tags.slice(0, 3).join(' · ')}</span>
                </div>
              {/if}
            </div>
          </li>
        {/each}
      </ol>
    {/each}
  </div>
{/if}

<style>
  .heading-block {
    margin-bottom: var(--space-2xl);
  }

  .archive {
    max-width: var(--measure-wide);
  }

  .index-year-count {
    font-size: var(--type-xs);
    color: var(--ink-muted);
    letter-spacing: 0.04em;
    text-transform: lowercase;
    font-weight: 400;
    white-space: nowrap;
  }

  .empty {
    color: var(--ink-text-soft);
    font-style: italic;
  }
</style>
