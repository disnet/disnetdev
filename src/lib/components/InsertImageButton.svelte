<script lang="ts">
  import type { BlobRef } from '$lib/types/blog';
  import { uploadBlob } from '$lib/admin/upload';

  let {
    onInsert
  }: {
    onInsert: (args: { blob: BlobRef; alt: string }) => void;
  } = $props();

  let status = $state<'idle' | 'uploading' | 'error'>('idle');
  let errorMessage = $state<string | null>(null);

  async function onPick(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    status = 'uploading';
    errorMessage = null;

    try {
      const blob = await uploadBlob(file);
      const alt = file.name.replace(/\.[^.]+$/, '');
      onInsert({ blob, alt });
      status = 'idle';
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : 'Upload failed';
      status = 'error';
    } finally {
      target.value = '';
    }
  }
</script>

<label class="image-insert" class:image-insert--busy={status === 'uploading'}>
  <input
    type="file"
    accept="image/jpeg,image/png,image/webp,image/gif"
    onchange={onPick}
    disabled={status === 'uploading'}
  />
  <span class="image-insert-label">
    {#if status === 'uploading'}
      uploading…
    {:else}
      ◂ insert image
    {/if}
  </span>
</label>
{#if errorMessage}
  <span class="image-insert-error">{errorMessage}</span>
{/if}
