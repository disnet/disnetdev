export function getSlugFromPath(path: string) {
  return path.split('/').filter(Boolean).at(-1) ?? '';
}

export function normalizePath(path: string) {
  if (!path.startsWith('/')) {
    return `/${path}`;
  }

  return path;
}

export function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
