<script lang="ts">
  import { untrack } from 'svelte';
  import { autogrow } from '$lib/actions/autogrow';

  let { data, form } = $props();

  const errors = $derived(form?.errors ?? {});
  const isPublished = $derived(Boolean(data.draft.record.sourceDocumentRkey));

  const initial = untrack(() => form?.values ?? data.draft.formValues);
  let title = $state<string>(initial.title ?? '');
  let slug = $state<string>(initial.slug ?? '');
  let description = $state<string>(initial.description ?? '');
  let tags = $state<string>(initial.tags ?? '');
  let markdown = $state<string>(initial.markdown ?? '');

  $effect(() => {
    if (form?.values) {
      title = form.values.title;
      slug = form.values.slug;
      description = form.values.description ?? '';
      tags = form.values.tags ?? '';
      markdown = form.values.markdown ?? '';
    }
  });

  const tagList = $derived(
    tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  );

  const wordCount = $derived(
    markdown.trim() ? markdown.trim().split(/\s+/).length : 0
  );

  let armedDiscard = $state(false);
  let armedTimer: ReturnType<typeof setTimeout> | undefined;

  function onDiscard(event: Event) {
    if (!armedDiscard) {
      event.preventDefault();
      armedDiscard = true;
      clearTimeout(armedTimer);
      armedTimer = setTimeout(() => (armedDiscard = false), 4000);
    }
  }
</script>

<a href="/admin" class="editor-crumb">
  <span class="editor-crumb-arrow">←</span>
  <span>back to the desk</span>
</a>

<header>
  <p class="editor-status">
    {#if isPublished}
      <span class="eyebrow eyebrow--accent">
        <span class="editor-status-dot editor-status-dot--pub"></span>
        Published draft
      </span>
    {:else}
      <span class="eyebrow">
        <span class="editor-status-dot editor-status-dot--motion"></span>
        In motion
      </span>
    {/if}
  </p>

  {#if isPublished}
    <p class="editor-crosslink">
      Lives at
      <a href={`/blog/${data.draft.record.slug}`} class="editor-crosslink-target">
        /blog/{data.draft.record.slug}
      </a>.
      Further edits here don't change the published copy.
    </p>
  {/if}

  {#if form?.success}
    <p class="flash" role="status">
      <span class="flash-mark">saved</span>
      <span>{form.message}</span>
      {#if form.publishedUrl}
        <a href={form.publishedUrl} class="editor-crosslink-target">view</a>
      {/if}
    </p>
  {/if}
</header>

<form method="POST" action="?/save" class="editor-form" autocomplete="off">
  <div class="editor-title-field">
    <label for="title" class="editor-title-label">Title</label>
    <input
      id="title"
      name="title"
      type="text"
      class="editor-title-input"
      bind:value={title}
      placeholder="Give it a name…"
      required
    />
    {#if errors.title}
      <p class="field-error">{errors.title}</p>
    {/if}
  </div>

  <div class="editor-meta-grid">
    <div class="editor-meta-field">
      <label for="slug" class="editor-meta-label">slug</label>
      <input
        id="slug"
        name="slug"
        type="text"
        class="editor-meta-input"
        bind:value={slug}
        required
      />
      <p class="editor-meta-help">/blog/{slug || '…'}</p>
      {#if errors.slug}
        <p class="field-error">{errors.slug}</p>
      {/if}
    </div>

    <div class="editor-meta-field">
      <label for="tags" class="editor-meta-label">tags</label>
      <input
        id="tags"
        name="tags"
        type="text"
        class="editor-meta-input"
        bind:value={tags}
        placeholder="essays, notes, quiet tools"
      />
      <div class="editor-tags-preview" aria-live="polite">
        {#each tagList as tag (tag)}
          <span class="tag">{tag}</span>
        {/each}
      </div>
      {#if errors.tags}
        <p class="field-error">{errors.tags}</p>
      {/if}
    </div>
  </div>

  <div>
    <label for="description" class="editor-meta-label" style="margin-bottom: var(--s-2); display: block;">
      subtitle
    </label>
    <textarea
      id="description"
      name="description"
      class="editor-description-input"
      rows="2"
      bind:value={description}
      placeholder="A line to set the scene. Optional."
      use:autogrow
    ></textarea>
    {#if errors.description}
      <p class="field-error">{errors.description}</p>
    {/if}
  </div>

  <div class="editor-body-wrap">
    <div class="editor-body-label">
      <label for="markdown">
        <span>the writing</span>
      </label>
      <span class="editor-body-stats">
        {wordCount === 1 ? '1 word' : `${wordCount} words`}
      </span>
    </div>
    <textarea
      id="markdown"
      name="markdown"
      class="editor-body-textarea"
      bind:value={markdown}
      use:autogrow
      spellcheck="true"
    ></textarea>
    {#if errors.markdown}
      <p class="field-error">{errors.markdown}</p>
    {/if}
  </div>

  <footer class="editor-foot">
    <div class="editor-foot-primary">
      <button type="submit" class="action action--primary">Save draft</button>
      <button
        type="submit"
        formaction="?/publish"
        class="action action--publish"
        disabled={isPublished}
        title={isPublished ? 'This draft has already been published' : 'Publish this draft to your PDS'}
      >
        {isPublished ? 'already published' : 'Publish →'}
      </button>
    </div>

    <div class="editor-foot-end">
      <button
        type="submit"
        formaction="?/delete"
        class="action--discard"
        class:action--discard--armed={armedDiscard}
        onclick={onDiscard}
      >
        {armedDiscard ? 'really discard?' : 'discard draft'}
      </button>
    </div>
  </footer>
</form>
