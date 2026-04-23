export function markdownToPlaintext(markdown: string) {
  return markdown
    .replace(/^\[\^[^\]]+\]:.*(?:\n(?: {2,}|\t).*)*/gm, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[\^[^\]]+\]/g, ' ')
    .replace(/^>\s?/gm, '')
    .replace(/[*_#~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
