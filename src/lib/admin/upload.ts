import type { BlobRef } from '$lib/types/blog';

export async function uploadBlob(file: File): Promise<BlobRef> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload-blob', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Upload failed (${response.status})`);
  }

  const data = (await response.json()) as { blob: BlobRef };
  return data.blob;
}

export function insertAtCursor(textarea: HTMLTextAreaElement, insertion: string) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? textarea.value.length;
  const before = textarea.value.slice(0, start);
  const after = textarea.value.slice(end);
  const next = `${before}${insertion}${after}`;
  textarea.value = next;

  const caret = start + insertion.length;
  textarea.setSelectionRange(caret, caret);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  return next;
}
