<script lang="ts">
  import { page } from '$app/state';
  import { lensHref } from '$lib/lens/paths';

  let { data } = $props();

  const repo = $derived(data.identity.handle || data.identity.did);

  function day(iso?: string) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: sameYear ? undefined : 'numeric'
    });
  }

  function hostOf(url: string) {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }
</script>

<svelte:head>
  <title>{data.collection} · @{repo} · lens</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<nav class="lens-crumbs" aria-label="Breadcrumb">
  <a href={lensHref(repo)}>@{repo}</a>
  <span aria-hidden="true">→</span>
  <span>{data.app.name}</span>
</nav>

<header class="lens-head">
  <h1 class="lens-nsid">{data.collection}</h1>
</header>

{#if data.records.length === 0}
  <p class="empty">nothing left in this collection.</p>
{:else}
  <ol class="lens-records">
    {#each data.records as record}
      {@const s = record.specimen}
      <li class="lens-record">
        <span class="lens-record-when">{day(s.when)}</span>
        <div class="lens-record-body">
          <a class="lens-record-title" href={lensHref(repo, data.collection, record.rkey)}>
            {s.title ?? s.text ?? record.rkey}
          </a>
          {#if s.title && s.text}
            <p class="lens-record-text">{s.text}</p>
          {/if}
          <p class="lens-record-meta">
            {#if s.status}<span class="flight-status">{s.status}</span>{/if}
            {#if s.url}<a href={s.url} rel="noopener nofollow">{hostOf(s.url)}</a>{/if}
            {#if s.ref}<a href={s.ref}>follows a reference →</a>{/if}
            <span class="lens-rkey">{record.rkey}</span>
          </p>
        </div>
      </li>
    {/each}
  </ol>
{/if}

<p class="lens-paging">
  {#if !data.isFirstPage}
    <a href={page.url.pathname}>newest</a>
  {/if}
  {#if data.cursor}
    <a href={`?cursor=${encodeURIComponent(data.cursor)}`}>older →</a>
  {/if}
</p>
