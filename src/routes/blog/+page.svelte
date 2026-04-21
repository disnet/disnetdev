<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>Blog</title>
</svelte:head>

<h1>Blog</h1>

{#if data.posts.length === 0}
  <p>No published posts yet.</p>
{:else}
  <ul>
    {#each data.posts as post}
      <li>
        <a href={post.path}>{post.title}</a>
        <div>{post.publishedAt}</div>
      </li>
    {/each}
  </ul>
{/if}
