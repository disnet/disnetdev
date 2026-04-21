<script lang="ts">
  let { data } = $props();
</script>

<svelte:head>
  <title>{data.publication.record.name}</title>
  <meta name="description" content={data.publication.record.description} />
</svelte:head>

<section>
  <p class="eyebrow">ATProto migration</p>
  <h1>{data.publication.record.name}</h1>
  <p class="lede">{data.publication.record.description}</p>
</section>

<section>
  <h2>Recent posts</h2>

  {#if data.posts.length === 0}
    <p>No published ATProto posts yet. Next step: wire up the real document reader.</p>
  {:else}
    <ul>
      {#each data.posts as post}
        <li><a href={post.path}>{post.title}</a></li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: #8aa3ff;
    font-size: 0.75rem;
  }

  .lede {
    max-width: 42rem;
    color: #c6d1f6;
  }
</style>
