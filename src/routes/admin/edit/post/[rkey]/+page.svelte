<script lang="ts">
  import { untrack } from 'svelte';
  import { autogrow } from '$lib/actions/autogrow';
  import CoverImageField from '$lib/components/CoverImageField.svelte';
  import InsertImageButton from '$lib/components/InsertImageButton.svelte';
  import type { BlobRef } from '$lib/types/blog';

  let { data, form } = $props();

  const errors = $derived(form?.errors ?? {});

  const initial = untrack(() => form?.values ?? data.post.formValues);
  let title = $state<string>(initial.title ?? '');
  let path = $state<string>(initial.path ?? '');
  let publishedAt = $state<string>(initial.publishedAt ?? '');
  let description = $state<string>(initial.description ?? '');
  let tags = $state<string>(initial.tags ?? '');
  let markdown = $state<string>(initial.markdown ?? '');
  let embeddedBlobs = $state<BlobRef[]>(untrack(() => data.post.record.embeddedBlobs ?? []));
  let markdownEl = $state<HTMLTextAreaElement | undefined>(undefined);

  function onImageInserted(blob: BlobRef) {
    if (!embeddedBlobs.some((b) => b.ref.$link === blob.ref.$link)) {
      embeddedBlobs = [...embeddedBlobs, blob];
    }
  }

  const embeddedBlobsSerialized = $derived(
    embeddedBlobs.length ? JSON.stringify(embeddedBlobs) : ''
  );

  $effect(() => {
    if (form?.values) {
      title = form.values.title;
      path = form.values.path;
      publishedAt = form.values.publishedAt;
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

  function formatPublishedAt(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

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
    <span class="eyebrow eyebrow--accent">
      <span class="editor-status-dot editor-status-dot--pub"></span>
      Published — {formatPublishedAt(publishedAt)}
    </span>
  </p>

  <p class="editor-crosslink">
    Lives at
    <a href={path || data.post.record.path} class="editor-crosslink-target">
      {path || data.post.record.path}
    </a>
    {#if data.post.linkedDraft}
      · Linked draft:
      <a href={`/admin/edit/draft/${data.post.linkedDraft.rkey}`} class="editor-crosslink-target">
        {data.post.linkedDraft.title}
      </a>
    {/if}
  </p>

  {#if form?.success}
    <p class="flash" role="status">
      <span class="flash-mark">saved</span>
      <span>{form.message}</span>
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
      required
    />
    {#if errors.title}
      <p class="field-error">{errors.title}</p>
    {/if}
  </div>

  <div class="editor-meta-grid">
    <div class="editor-meta-field">
      <label for="path" class="editor-meta-label">path</label>
      <input
        id="path"
        name="path"
        type="text"
        class="editor-meta-input"
        bind:value={path}
        required
      />
      <p class="editor-meta-help">where this post lives on the site</p>
      {#if errors.path}
        <p class="field-error">{errors.path}</p>
      {/if}
    </div>

    <div class="editor-meta-field">
      <label for="publishedAt" class="editor-meta-label">published at</label>
      <input
        id="publishedAt"
        name="publishedAt"
        type="text"
        class="editor-meta-input"
        bind:value={publishedAt}
        required
      />
      <p class="editor-meta-help">ISO timestamp, e.g. 2026-04-21T12:34:56.000Z</p>
      {#if errors.publishedAt}
        <p class="field-error">{errors.publishedAt}</p>
      {/if}
    </div>

    <div class="editor-meta-field" style="grid-column: 1 / -1;">
      <label for="tags" class="editor-meta-label">tags</label>
      <input
        id="tags"
        name="tags"
        type="text"
        class="editor-meta-input"
        bind:value={tags}
        placeholder="essays, notes"
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
      placeholder="A line to set the scene."
      use:autogrow
    ></textarea>
    {#if errors.description}
      <p class="field-error">{errors.description}</p>
    {/if}
  </div>

  <CoverImageField initial={data.post.record.coverImage} initialPreviewUrl={data.post.coverImageUrl} />

  <div class="editor-body-wrap">
    <div class="editor-body-label">
      <label for="markdown">
        <span>the writing</span>
      </label>
      <span class="editor-body-tools">
        <InsertImageButton textarea={markdownEl} onInsert={onImageInserted} />
        <span class="editor-body-stats">
          {wordCount === 1 ? '1 word' : `${wordCount} words`}
        </span>
      </span>
    </div>
    <textarea
      id="markdown"
      name="markdown"
      class="editor-body-textarea"
      bind:this={markdownEl}
      bind:value={markdown}
      use:autogrow
      spellcheck="true"
    ></textarea>
    <p class="editor-meta-help">Footnotes: <code>[^note]</code> in the text, then <code>[^note]: note text</code> below.</p>
    <input type="hidden" name="embeddedBlobs" value={embeddedBlobsSerialized} />
    {#if errors.markdown}
      <p class="field-error">{errors.markdown}</p>
    {/if}
  </div>

  <footer class="editor-foot">
    <div class="editor-foot-primary">
      <button type="submit" class="action action--primary">Save post</button>
    </div>

    <div class="editor-foot-end">
      <button
        type="submit"
        formaction="?/delete"
        class="action--discard"
        class:action--discard--armed={armedDiscard}
        onclick={onDiscard}
      >
        {armedDiscard ? 'really remove from the site?' : 'remove post'}
      </button>
    </div>
  </footer>
</form>
