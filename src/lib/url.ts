const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix a site-absolute path ("/media/x.webp", "/privacy") with the deploy base path. */
export function withBase(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  if (path === '/') return base || '/';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Absolute production URL for a site-relative path — for canonicals, hreflang, feeds and structured data. */
export function absoluteUrl(path: string): string {
  return new URL(withBase(path), import.meta.env.SITE).href;
}
