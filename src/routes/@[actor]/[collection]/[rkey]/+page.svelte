<script lang="ts">
  import FieldTree from '$lib/components/lens/FieldTree.svelte';
  import { lensHref } from '$lib/lens/paths';

  let { data } = $props();

  const repo = $derived(data.identity.handle || data.identity.did);
  const s = $derived(data.specimen);
</script>

<svelte:head>
  <title>{s.title ?? data.rkey} · {data.collection} · lens</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<nav class="lens-crumbs" aria-label="Breadcrumb">
  <a href={lensHref(repo)}>@{repo}</a>
  <span aria-hidden="true">→</span>
  <a href={lensHref(repo, data.collection)}>{data.collection}</a>
</nav>

<article class="lens-specimen">
  <header class="lens-specimen-head">
    {#if s.title}<h1 class="lens-specimen-title">{s.title}</h1>{/if}
    {#if s.text}<p class="page-lede">{s.text}</p>{/if}
    <p class="lens-status">
      <span class="lens-uri">{data.record.uri}</span>
    </p>
    {#if data.record.cid}
      <p class="lens-status lens-status--quiet">cid {data.record.cid}</p>
    {/if}
  </header>

  <div class="lens-fields">
    <FieldTree value={data.record.value} blobBase={data.blobBase} own={data.identity} />
  </div>
</article>
