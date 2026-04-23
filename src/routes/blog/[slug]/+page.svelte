<script lang="ts">
  import PostArticle from '$lib/components/PostArticle.svelte';
  import { page } from '$app/state';

  let { data } = $props();

  const ogImage = $derived(new URL(`/og/blog/${data.post.slug}`, page.url.origin).toString());
  const pageUrl = $derived(new URL(`/blog/${data.post.slug}`, page.url.origin).toString());
</script>

<svelte:head>
  <title>{data.post.title} · disnetdev</title>
  {#if data.post.description}
    <meta name="description" content={data.post.description} />
  {/if}
  <link rel="site.standard.document" href={data.post.uri} />

  <meta property="og:type" content="article" />
  <meta property="og:title" content={data.post.title} />
  {#if data.post.description}
    <meta property="og:description" content={data.post.description} />
  {/if}
  <meta property="og:url" content={pageUrl} />
  <meta property="og:site_name" content="disnetdev" />
  <meta property="og:image" content={ogImage} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content={data.post.title} />
  <meta property="article:published_time" content={data.post.publishedAt} />
  {#if data.post.updatedAt}
    <meta property="article:modified_time" content={data.post.updatedAt} />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={data.post.title} />
  {#if data.post.description}
    <meta name="twitter:description" content={data.post.description} />
  {/if}
  <meta name="twitter:image" content={ogImage} />
</svelte:head>

<PostArticle post={data.post} />
