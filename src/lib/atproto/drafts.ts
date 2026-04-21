import type { DraftRecord } from '$lib/types/blog';

export async function listDrafts(): Promise<Array<{ rkey: string; record: DraftRecord }>> {
  return [];
}
