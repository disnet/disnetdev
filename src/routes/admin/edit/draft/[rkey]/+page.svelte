<script lang="ts">
  let { data, form } = $props();

  function getValues() {
    return form?.values ?? data.draft.formValues;
  }
</script>

<h1>Edit draft</h1>
<p><code>{data.draft.uri}</code></p>

{#if data.draft.record.sourceDocumentRkey}
  <p>
    Published as
    <a href={`/blog/${data.draft.record.slug}`}>/blog/{data.draft.record.slug}</a>
    (<code>{data.draft.record.sourceDocumentRkey}</code>)
  </p>
{/if}

{#if form?.success}
  <p>{form.message}</p>
  {#if form.publishedUrl}
    <p><a href={form.publishedUrl}>View published post</a></p>
  {/if}
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
    Slug
    <input name="slug" type="text" value={getValues().slug} required />
  </label>
  {#if form?.errors?.slug}
    <p>{form.errors.slug}</p>
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

  <button type="submit">Save draft</button>
</form>

<form method="POST" action="?/publish">
  <button type="submit" disabled={Boolean(data.draft.record.sourceDocumentRkey)}>Publish draft</button>
</form>

<form method="POST" action="?/delete">
  <button type="submit">Delete draft</button>
</form>

<p><a href="/admin">Back to admin</a></p>
