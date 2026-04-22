<script lang="ts">
  let { data } = $props();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const draftCount = $derived(data.drafts.length);
  const postCount = $derived(data.posts.length);

  function relative(iso: string | undefined | null): string {
    if (!iso) return 'never';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return 'unknown';
    const diff = Date.now() - then;
    const min = 60_000;
    const hr = 60 * min;
    const day = 24 * hr;
    if (diff < min) return 'just now';
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    if (diff < hr) return rtf.format(-Math.floor(diff / min), 'minute');
    if (diff < day) return rtf.format(-Math.floor(diff / hr), 'hour');
    if (diff < 14 * day) return rtf.format(-Math.floor(diff / day), 'day');
    if (diff < 60 * day) return rtf.format(-Math.floor(diff / (7 * day)), 'week');
    if (diff < 365 * day) return rtf.format(-Math.floor(diff / (30 * day)), 'month');
    return rtf.format(-Math.floor(diff / (365 * day)), 'year');
  }

  function shortDid(did: string | undefined): string {
    if (!did) return '';
    const short = did.replace(/^did:plc:/, '');
    return short.length > 12 ? `${short.slice(0, 6)}…${short.slice(-4)}` : short;
  }
</script>

<header class="desk-head">
  <p class="eyebrow">{today}</p>
  <h1 class="page-title">The desk<em>.</em></h1>
  <p class="page-lede">
    Drafts in motion, posts already out the door. Start a new piece when a thought is ready,
    or return to one still finding its shape.
  </p>
</header>

<div class="desk-call">
  <a href="/admin/new" class="action action--primary">
    <span aria-hidden="true">✎</span>
    <span>Begin a new draft</span>
  </a>
  <p class="desk-call-meta">
    <span class="meta meta-faint">{draftCount} in motion</span>
    <span class="desk-call-sep" aria-hidden="true">·</span>
    <span class="meta meta-faint">{postCount} published</span>
  </p>
</div>

<section class="ledger" aria-labelledby="drafts-heading">
  <header class="ledger-head">
    <h2 class="ledger-title" id="drafts-heading">
      <span class="ledger-title-number">i</span>
      <span class="ledger-title-text">in motion</span>
    </h2>
    <span class="meta meta-faint">{draftCount === 1 ? '1 draft' : `${draftCount} drafts`}</span>
  </header>

  {#if data.drafts.length > 0}
    <ol class="entries">
      {#each data.drafts as draft (draft.rkey)}
        <li>
          <a class="entry" href={`/admin/edit/draft/${draft.rkey}`}>
            <h3 class="entry-title">
              {draft.record.title || 'Untitled draft'}
              {#if draft.record.sourceDocumentRkey}
                <span class="entry-pub-mark" title="Already published">◉</span>
              {/if}
            </h3>
            {#if draft.record.description}
              <p class="entry-excerpt">{draft.record.description}</p>
            {/if}
            <p class="entry-meta">
              <span class="entry-slug">{draft.record.slug}</span>
              <span class="entry-sep" aria-hidden="true">·</span>
              <span>updated {relative(draft.record.updatedAt)}</span>
            </p>
          </a>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="ledger-empty">
      No drafts yet. <a href="/admin/new" class="prose-link">Begin one</a>
      when the thought is ready.
    </p>
  {/if}
</section>

<section class="ledger" aria-labelledby="posts-heading">
  <header class="ledger-head">
    <h2 class="ledger-title" id="posts-heading">
      <span class="ledger-title-number">ii</span>
      <span class="ledger-title-text">published</span>
    </h2>
    <span class="meta meta-faint">{postCount === 1 ? '1 post' : `${postCount} posts`}</span>
  </header>

  {#if data.posts.length > 0}
    <ol class="entries">
      {#each data.posts as post (post.rkey)}
        <li>
          <a class="entry" href={`/admin/edit/post/${post.rkey}`}>
            <h3 class="entry-title">{post.title || 'Untitled post'}</h3>
            <p class="entry-meta">
              <span class="entry-slug">{post.path}</span>
            </p>
          </a>
        </li>
      {/each}
    </ol>
  {:else}
    <p class="ledger-empty">Nothing published yet. Take your time.</p>
  {/if}
</section>

<footer class="desk-foot">
  <p class="meta meta-faint">
    signed in as <span class="meta-code">{shortDid(data.auth?.did)}</span>
  </p>
</footer>

<style>
  .desk-head {
    padding-bottom: var(--s-6);
  }

  .desk-head .page-title em {
    color: var(--accent);
    font-style: italic;
  }

  .desk-call {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: var(--s-6);
    flex-wrap: wrap;
    padding: var(--s-4) 0 var(--s-6);
    margin-bottom: var(--s-7);
    border-bottom: 1px solid var(--rule);
  }

  .desk-call-meta {
    display: flex;
    align-items: center;
    gap: var(--s-3);
    margin: 0;
  }

  .desk-call-sep {
    color: var(--ink-faint);
    font-family: var(--ff-mono);
  }

  .ledger {
    margin-top: var(--s-7);
  }

  .ledger-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--s-4);
    padding-bottom: var(--s-3);
    border-bottom: 1px solid var(--rule);
    margin-bottom: var(--s-4);
  }

  .ledger-title {
    display: inline-flex;
    align-items: baseline;
    gap: var(--s-3);
    margin: 0;
    font-family: var(--ff-display);
    font-weight: 500;
    font-size: var(--fz-lg);
    line-height: 1;
    letter-spacing: -0.01em;
  }

  .ledger-title-number {
    font-family: var(--ff-display);
    font-style: italic;
    font-weight: 400;
    font-size: 0.95em;
    color: var(--accent);
    font-variant-numeric: oldstyle-nums;
    font-feature-settings: 'onum';
  }

  .ledger-title-text {
    font-style: italic;
    color: var(--ink);
  }

  .ledger-empty {
    padding: var(--s-5) 0;
    color: var(--ink-muted);
    font-style: italic;
    font-size: var(--fz-base);
    font-variation-settings: 'opsz' 16;
  }

  .entries {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .entries li + li {
    border-top: 1px solid var(--rule);
  }

  .entry {
    display: block;
    padding: var(--s-4) 0;
    text-decoration: none;
    color: inherit;
    transition: transform var(--transition), padding var(--transition);
    position: relative;
  }

  .entry::before {
    content: '';
    position: absolute;
    left: calc(-1 * var(--s-5));
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--accent);
    opacity: 0;
    transform: scaleY(0.3);
    transform-origin: center;
    transition: opacity var(--transition), transform var(--transition);
  }

  .entry:hover::before,
  .entry:focus-visible::before {
    opacity: 1;
    transform: scaleY(1);
  }

  .entry:hover {
    padding-left: var(--s-3);
  }

  .entry-title {
    font-family: var(--ff-display);
    font-size: var(--fz-xl);
    font-weight: 500;
    line-height: var(--lh-snug);
    letter-spacing: -0.008em;
    margin: 0;
    color: var(--ink);
    transition: color var(--transition);
    display: inline;
  }

  .entry:hover .entry-title,
  .entry:focus-visible .entry-title {
    color: var(--accent);
  }

  .entry-pub-mark {
    font-family: var(--ff-mono);
    font-size: 0.65em;
    color: var(--accent);
    margin-left: 0.3em;
    vertical-align: 0.15em;
  }

  .entry-excerpt {
    font-family: var(--ff-body);
    font-size: var(--fz-sm);
    line-height: var(--lh-body);
    color: var(--ink-2);
    margin: var(--s-2) 0 0;
    max-width: var(--measure);
    font-variation-settings: 'opsz' 14;
  }

  .entry-meta {
    display: flex;
    align-items: baseline;
    gap: var(--s-2);
    flex-wrap: wrap;
    margin: var(--s-2) 0 0;
    font-family: var(--ff-mono);
    font-size: var(--fz-mono);
    letter-spacing: 0.05em;
    color: var(--ink-faint);
  }

  .entry-slug {
    color: var(--ink-muted);
  }

  .entry-sep {
    color: var(--ink-faint);
  }

  .desk-foot {
    margin-top: var(--s-9);
    padding-top: var(--s-5);
    border-top: 1px solid var(--rule);
    text-align: center;
  }

  .meta-code {
    color: var(--ink-muted);
    background: var(--paper-sunk);
    padding: 0.1em 0.45em;
    border-radius: var(--radius-sm);
  }
</style>
