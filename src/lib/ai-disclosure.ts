// A post tagged with this is mostly AI-generated. The tag is the whole
// mechanism: set it from the studio's tags field (or via the drafting MCP
// tools) and the post shows a label under its title linking to the policy.
// Published records also carry an `ai-generated` self-label in the
// standard.site `labels` field so other atproto readers can see it.
export const AI_GENERATED_TAG = 'vibeslop';
export const AI_POLICY_PATH = '/ai';

export function isAiGenerated(tags?: string[]) {
  return tags?.some((tag) => tag.trim().toLowerCase() === AI_GENERATED_TAG) ?? false;
}

export const AI_GENERATED_LABEL = 'ai-generated';

export type SelfLabels = {
  $type: 'com.atproto.label.defs#selfLabels';
  values: { val: string }[];
};

// Returns the `labels` a site.standard.document should carry given its tags,
// keeping any self-labels that were already on the record. Adds
// `ai-generated` for vibeslop posts and drops it when the tag is removed.
export function documentSelfLabels(
  tags: string[] | undefined,
  existing?: { values?: { val: string }[] }
): SelfLabels | undefined {
  const others = (existing?.values ?? []).filter((label) => label.val !== AI_GENERATED_LABEL);
  const values = isAiGenerated(tags) ? [...others, { val: AI_GENERATED_LABEL }] : others;
  return values.length ? { $type: 'com.atproto.label.defs#selfLabels', values } : undefined;
}
