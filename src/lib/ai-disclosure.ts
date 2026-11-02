// A post tagged with this is mostly AI-generated. The tag is the whole
// mechanism: set it from the studio's tags field (or via the drafting MCP
// tools) and the post shows a label under its title linking to the policy.
export const AI_GENERATED_TAG = 'vibeslop';
export const AI_POLICY_PATH = '/ai';

export function isAiGenerated(tags?: string[]) {
  return tags?.some((tag) => tag.trim().toLowerCase() === AI_GENERATED_TAG) ?? false;
}
