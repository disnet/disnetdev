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
</section>

<section>
  <h2>Published</h2>
  <p>{data.posts.length} published posts</p>
</section>
