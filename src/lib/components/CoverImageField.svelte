<script lang="ts">
  import { untrack } from 'svelte';
  import type { BlobRef } from '$lib/types/blog';
  import { uploadBlob } from '$lib/admin/upload';

  let {
    initial = undefined,
    initialPreviewUrl = null
  }: {
    initial?: BlobRef | undefined;
    initialPreviewUrl?: string | null;
  } = $props();

  let value = $state<BlobRef | undefined>(untrack(() => initial));
  let preview = $state<string | null>(untrack(() => initialPreviewUrl));
  let objectUrl = $state<string | null>(null);
  let status = $state<'idle' | 'uploading' | 'error'>('idle');
  let errorMessage = $state<string | null>(null);

  const serialized = $derived(value ? JSON.stringify(value) : '');

  async function onPick(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    const nextPreview = URL.createObjectURL(file);
    preview = nextPreview;
    objectUrl = nextPreview;

    status = 'uploading';
    errorMessage = null;

    try {
      const blob = await uploadBlob(file);
      value = blob;
      status = 'idle';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Upload failed';
      status = 'error';
      value = undefined;
    } finally {
      target.value = '';
    }
  }

  function clear() {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    preview = null;
    value = undefined;
    status = 'idle';
    errorMessage = null;
  }
</script>

<div class="cover-field">
  <span class="editor-meta-label">cover image</span>

  {#if preview}
    <figure class="cover-preview">
      <img src={preview} alt="Cover preview" />
      <figcaption>
        {#if status === 'uploading'}
          <span class="cover-status">uploading…</span>
        {:else if status === 'error'}
          <span class="cover-status cover-status--error">failed — try again</span>
        {:else}
          <button type="button" class="cover-replace">
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange={onPick} />
            <span>replace</span>
          </button>
          <button type="button" class="cover-remove" onclick={clear}>remove</button>
        {/if}
      </figcaption>
    </figure>
  {:else}
    <label class="cover-empty">
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onchange={onPick} />
      <span class="cover-empty-prompt">attach a cover image</span>
      <span class="cover-empty-hint">jpg, png, webp, gif · up to 4mb</span>
    </label>
  {/if}

  {#if errorMessage}
    <p class="field-error">{errorMessage}</p>
  {/if}

  <input type="hidden" name="coverImage" value={serialized} />
</div>
