<script lang="ts">
  let { data } = $props();
</script>

<h1>Admin</h1>
<p>Signed in as <code>{data.auth?.did}</code>.</p>

<form method="POST" action="/auth/logout">
  <button type="submit">Sign out</button>
</form>

<section>
  <h2>Drafts</h2>
  <p>{data.drafts.length} drafts</p>
  <p><a href="/admin/new">Create draft</a></p>

  {#if data.drafts.length > 0}
    <ul>
      {#each data.drafts as draft}
        <li>
          <a href={`/admin/edit/draft/${draft.rkey}`}>{draft.record.title}</a>
          <small> — {draft.record.slug} — updated {draft.record.updatedAt}</small>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<section>
  <h2>Published</h2>
  <p>{data.posts.length} published posts</p>

  {#if data.posts.length > 0}
    <ul>
      {#each data.posts as post}
        <li>
          <a href={`/admin/edit/post/${post.rkey}`}>{post.title}</a>
          <small> — {post.path}</small>
        </li>
      {/each}
    </ul>
  {/if}
</section>
