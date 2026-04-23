<script lang="ts">
  import PostArticle from '$lib/components/PostArticle.svelte';

  let { data } = $props();
</script>

<svelte:head>
  <title>Preview: {data.post.title} · disnetdev</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<p class="page-eyebrow">draft preview</p>
<PostArticle
  post={data.post}
  returnHref={data.editorHref}
  returnLabel="◂ back to editor"
  statusPath={`~/draft-preview/${data.post.slug}`} />
