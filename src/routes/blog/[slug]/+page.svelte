<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.post.title}</title>
  {#if data.post.description}
    <meta name="description" content={data.post.description} />
  {/if}
  <link rel="site.standard.document" href={data.post.uri} />
</svelte:head>

<article>
  <p>{data.post.publishedAt}</p>
  <h1>{data.post.title}</h1>
  {@html data.post.html}
</article>
