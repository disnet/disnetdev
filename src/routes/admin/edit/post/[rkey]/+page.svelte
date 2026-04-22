<script lang="ts">
  let { data, form } = $props();

  function getValues() {
    return form?.values ?? data.post.formValues;
  }
</script>

<h1>Edit post</h1>
<p><code>{data.post.uri}</code></p>
<p><a href={form?.values?.path ?? data.post.record.path}>View published post</a></p>

{#if data.post.linkedDraft}
  <p>
    Linked draft:
    <a href={`/admin/edit/draft/${data.post.linkedDraft.rkey}`}>{data.post.linkedDraft.title}</a>
    (<code>{data.post.linkedDraft.rkey}</code>)
  </p>
{/if}

{#if form?.success}
  <p>{form.message}</p>
{/if}

<form method="POST" action="?/save">
  <label>
    Title
    <input name="title" type="text" value={getValues().title} required />
  </label>
  {#if form?.errors?.title}
    <p>{form.errors.title}</p>
  {/if}

  <label>
    Path
    <input name="path" type="text" value={getValues().path} required />
  </label>
  {#if form?.errors?.path}
    <p>{form.errors.path}</p>
  {/if}

  <label>
    Published at
    <input name="publishedAt" type="text" value={getValues().publishedAt} required />
  </label>
  <p>Use an ISO timestamp, for example <code>2026-04-21T12:34:56.000Z</code>.</p>
  {#if form?.errors?.publishedAt}
    <p>{form.errors.publishedAt}</p>
  {/if}

  <label>
    Description
    <textarea name="description" rows="3">{getValues().description}</textarea>
  </label>
  {#if form?.errors?.description}
    <p>{form.errors.description}</p>
  {/if}

  <label>
    Tags
    <input name="tags" type="text" value={getValues().tags} />
  </label>
  <p>Comma-separated.</p>
  {#if form?.errors?.tags}
    <p>{form.errors.tags}</p>
  {/if}

  <label>
    Markdown
    <textarea name="markdown" rows="24">{getValues().markdown}</textarea>
  </label>
  {#if form?.errors?.markdown}
    <p>{form.errors.markdown}</p>
  {/if}

  <button type="submit">Save post</button>
</form>

<form method="POST" action="?/delete">
  <button type="submit">Delete post</button>
</form>

<p><a href="/admin">Back to admin</a></p>
