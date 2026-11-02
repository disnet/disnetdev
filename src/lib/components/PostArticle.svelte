<script lang="ts">
  import type { PostPageData } from '$lib/types/blog';
  import { AI_POLICY_PATH, isAiGenerated } from '$lib/ai-disclosure';

  let {
    post,
    returnHref = '/blog',
    returnLabel = '← back to index',
    statusPath = '',
    dateLabel = 'published',
    dateIso = ''
  }: {
    post: PostPageData;
    returnHref?: string;
    returnLabel?: string;
    statusPath?: string;
    // A link post's `publishedAt` belongs to the piece it points at, so the
    // page that owns it can supply the date it actually wants to show.
    dateLabel?: string;
    dateIso?: string;
  } = $props();

  const shownDate = $derived(dateIso || post.publishedAt);
  const aiGenerated = $derived(isAiGenerated(post.tags));

  function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
</script>

<article class="post">
  <header class="post-header">
    {#if post.coverImageUrl}
      <figure class="post-cover">
        <img src={post.coverImageUrl} alt={post.coverImageAlt ?? ''} loading="eager" />
      </figure>
    {/if}
    <h1 class="post-title">{post.title}</h1>
    {#if aiGenerated}
      <p class="post-ai-label">
        <a href={AI_POLICY_PATH}>vibeslop</a>
        <span class="post-ai-label-note">mostly AI-generated, an experiment</span>
      </p>
    {/if}
    {#if post.description}
      <p class="post-description">{post.description}</p>
    {/if}
  </header>

  <aside class="post-margin" aria-label="Post metadata">
    <dl class="post-margin-list">
      <div class="post-margin-item">
        <dt>{dateLabel}</dt>
        <dd>
          <time datetime={shownDate}>
            {formatDate(shownDate)}
          </time>
        </dd>
      </div>
      {#if post.updatedAt && post.updatedAt !== post.publishedAt}
        <div class="post-margin-item">
          <dt>updated</dt>
          <dd>
            <time datetime={post.updatedAt}>
              {formatDate(post.updatedAt)}
            </time>
          </dd>
        </div>
      {/if}
      {#if post.tags?.length}
        <div class="post-margin-item">
          <dt>tags</dt>
          <dd>
            <ul class="post-margin-tags">
              {#each post.tags as tag}
                <li>{tag}</li>
              {/each}
            </ul>
          </dd>
        </div>
      {/if}
    </dl>
  </aside>

  <div class="prose">
    {@html post.html}
  </div>

  {#if post.footnotes.length}
    <section class="post-footnotes" aria-label="Footnotes">
      <h2 class="post-footnotes-title">notes</h2>
      <ol class="post-footnotes-list">
        {#each post.footnotes as footnote}
          <li id={footnote.id} class="post-footnote">
            <a class="post-footnote-number" href={`#${footnote.refId}`} aria-label={`Back to reference ${footnote.number}`}>
              {footnote.number}
            </a>
            <div class="post-footnote-body">
              {@html footnote.html}
            </div>
          </li>
        {/each}
      </ol>
    </section>
  {/if}

  <footer class="post-statusline">
    <span class="post-statusline-path">
      <span class="post-statusline-prompt" aria-hidden="true"></span>
      {statusPath || `~/blog/${post.slug}`}
    </span>
    <a class="post-statusline-return" href={returnHref}>{returnLabel}</a>
  </footer>
</article>
