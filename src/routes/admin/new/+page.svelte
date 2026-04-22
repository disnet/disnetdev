<script lang="ts">
  import { untrack } from 'svelte';
  import { autogrow } from '$lib/actions/autogrow';

  let { form } = $props();

  const errors = $derived(form?.errors ?? {});

  const initial = untrack(() => form?.values);
  let title = $state<string>(initial?.title ?? '');
  let slug = $state<string>(initial?.slug ?? '');
  let description = $state<string>(initial?.description ?? '');
  let tags = $state<string>(initial?.tags ?? '');
  let markdown = $state<string>(initial?.markdown ?? '');

  const tagList = $derived(
    tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  );

  const wordCount = $derived(
    markdown.trim() ? markdown.trim().split(/\s+/).length : 0
  );

  function autoSlug() {
    if (slug || !title) return;
    slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 60);
  }
</script>

<a href="/admin" class="editor-crumb">
  <span class="editor-crumb-arrow">←</span>
  <span>back to the desk</span>
</a>

<header>
  <p class="eyebrow">A new page</p>
</header>

<form method="POST" class="editor-form" autocomplete="off">
  <div class="editor-title-field">
    <label for="title" class="editor-title-label">Title</label>
    <input
      id="title"
      name="title"
      type="text"
      class="editor-title-input"
      bind:value={title}
      onblur={autoSlug}
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
        placeholder="title-of-the-piece"
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
      placeholder="Begin…"
      use:autogrow
      spellcheck="true"
    ></textarea>
    {#if errors.markdown}
      <p class="field-error">{errors.markdown}</p>
    {/if}
  </div>

  <footer class="editor-foot">
    <div class="editor-foot-primary">
      <button type="submit" class="action action--primary">
        <span>Place on the desk</span>
        <span aria-hidden="true">↗</span>
      </button>
      <span class="meta meta-faint">— a draft, not yet public</span>
    </div>
  </footer>
</form>
