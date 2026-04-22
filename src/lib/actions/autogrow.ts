/** Auto-resize a <textarea> so it always fits its content. */
export function autogrow(node: HTMLTextAreaElement) {
  const resize = () => {
    node.style.height = 'auto';
    node.style.height = `${node.scrollHeight}px`;
  };

  // use rAF so initial resize lands after fonts/layout settle
  requestAnimationFrame(resize);
  node.addEventListener('input', resize);

  return {
    update: resize,
    destroy() {
      node.removeEventListener('input', resize);
    }
  };
}
