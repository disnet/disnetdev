import type { ContentType, EditorAdapter } from './types';
import { markdownAdapter } from './adapters/markdown';

const adapters = new Map<ContentType, EditorAdapter>();

function register<T extends ContentType>(adapter: EditorAdapter<T>) {
  adapters.set(adapter.type, adapter as unknown as EditorAdapter);
}

register(markdownAdapter);

export function getAdapter<T extends ContentType>(type: T): EditorAdapter<T> {
  const adapter = adapters.get(type);
  if (!adapter) {
    throw new Error(`No editor adapter registered for content type "${type}"`);
  }
  return adapter as unknown as EditorAdapter<T>;
}
