// Prefixes site-absolute links in Markdown ("/privacy") with the deploy base
// path, so content editors can write simple links that work on any host.

/** @param {{ base: string }} options */
export default function rehypeBaseLinks({ base }) {
  const prefix = base.replace(/\/$/, '');
  const visit = (node) => {
    if (node.type === 'element' && node.tagName === 'a') {
      const href = node.properties?.href;
      if (typeof href === 'string' && href.startsWith('/') && !href.startsWith('//') && !href.startsWith(`${prefix}/`)) {
        node.properties.href = `${prefix}${href}`;
      }
    }
    node.children?.forEach(visit);
  };
  return (tree) => visit(tree);
}
