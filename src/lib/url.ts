const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefix a site-absolute path ("/media/x.webp", "/privacy") with the deploy base path. */
export function withBase(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
