<script lang="ts">
  let { form } = $props();
</script>

<h1>New draft</h1>

<form method="POST">
  <label>
    Title
    <input name="title" type="text" value={form?.values?.title ?? ''} required />
  </label>
  {#if form?.errors?.title}
    <p>{form.errors.title}</p>
  {/if}

  <label>
    Slug
    <input name="slug" type="text" value={form?.values?.slug ?? ''} required />
  </label>
  {#if form?.errors?.slug}
    <p>{form.errors.slug}</p>
  {/if}

  <label>
    Description
    <textarea name="description" rows="3">{form?.values?.description ?? ''}</textarea>
  </label>
  {#if form?.errors?.description}
    <p>{form.errors.description}</p>
  {/if}

  <label>
    Tags
    <input name="tags" type="text" value={form?.values?.tags ?? ''} />
  </label>
  <p>Comma-separated.</p>
  {#if form?.errors?.tags}
    <p>{form.errors.tags}</p>
  {/if}

  <label>
    Markdown
    <textarea name="markdown" rows="20">{form?.values?.markdown ?? ''}</textarea>
  </label>
  {#if form?.errors?.markdown}
    <p>{form.errors.markdown}</p>
  {/if}

  <button type="submit">Create draft</button>
</form>

<p><a href="/admin">Back to admin</a></p>
