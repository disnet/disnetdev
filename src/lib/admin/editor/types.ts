import type { Schema, Node as PMNode } from 'prosemirror-model';
import type { Plugin } from 'prosemirror-state';
import type { BlobRef } from '$lib/types/blog';

/**
 * Discriminated union of every content shape the editor knows how to load.
 * New content types (e.g. a future block-based schema) extend this union and
 * register a matching adapter in `registry.ts`.
 */
export type ContentValue = MarkdownContentValue;

export type MarkdownContentValue = {
  $type: 'dev.disnet.blog.content.markdown';
  markdown: string;
};

export type ContentType = ContentValue['$type'];

export type SerializedFor<T extends ContentType> = Extract<ContentValue, { $type: T }>;

/**
 * Adapter contract for a single content type. Each adapter owns its
 * ProseMirror schema, parse/serialize round-trip, and the plugin set that
 * defines the editing experience for that schema.
 */
export interface EditorAdapter<T extends ContentType = ContentType> {
  type: T;
  schema: Schema;
  parse(content: SerializedFor<T>): PMNode;
  serialize(doc: PMNode): SerializedFor<T>;
  plugins(): Plugin[];
  /**
   * Insert an uploaded image at the current selection. Each adapter knows
   * how to express an image in its own document model.
   */
  insertImage(args: { blob: BlobRef; alt: string }): InsertImageCommand;
}

/**
 * A command-like callback returned by `insertImage`. The Editor component
 * receives the active state/dispatch and applies the transaction.
 */
export type InsertImageCommand = (
  state: import('prosemirror-state').EditorState,
  dispatch: (tr: import('prosemirror-state').Transaction) => void
) => void;
