<script lang="ts">
  let { data } = $props();
</script>

<h1>Archive</h1>
<ul>
  {#each data.posts as post}
    <li><a href={post.path}>{post.title}</a> — {post.publishedAt}</li>
  {/each}
</ul>
