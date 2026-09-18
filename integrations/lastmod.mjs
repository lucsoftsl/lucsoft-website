// <lastmod> for the sitemap: when a page's content last changed, taken from the
// git history of the content files it is built from (design and code changes
// don't count). Bing and Google ignore lastmod they can't trust, so a date is
// only given when git knows it exactly.
//
// Vercel builds from a shallow clone (the last 10 commits). Git sees the oldest
// commit of that clone as adding every file, so a page whose last change is at
// or before that boundary has an unknown date and gets no <lastmod>. Pages
// edited within the last commits get their exact date.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/** Page path → content files. Mirrors the routes in src/i18n/config.ts. */
const SOURCES = [
  [/^\/$/, () => ['src/data/en/home.json', 'src/data/reviews.json', 'src/data/site.json', 'src/content/work/en']],
  [/^\/es$/, () => ['src/data/es/home.json', 'src/data/reviews.json', 'src/data/site.json', 'src/content/work/es']],
  [/^\/work\/([^/]+)$/, (slug) => [`src/content/work/en/${slug}.md`]],
  [/^\/es\/proyectos\/([^/]+)$/, (slug) => [`src/content/work/es/${slug}.md`]],
  [/^\/privacy$/, () => ['src/content/legal/en/privacy.md', 'src/data/site.json']],
  [/^\/terms$/, () => ['src/content/legal/en/terms.md', 'src/data/site.json']],
  [/^\/es\/privacidad$/, () => ['src/content/legal/es/privacy.md', 'src/data/site.json']],
  [/^\/es\/aviso-legal$/, () => ['src/content/legal/es/terms.md', 'src/data/site.json']],
];

/** @param {string[]} args */
function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return undefined;
  }
}

/** Commits at the edge of a shallow clone; empty for a full clone. */
function shallowBoundary() {
  const file = git(['rev-parse', '--git-path', 'shallow']);
  try {
    return new Set(readFileSync(file ?? '', 'utf8').split('\n').filter(Boolean));
  } catch {
    return new Set();
  }
}

/**
 * Returns a lookup from absolute page URL to its last content change (ISO 8601),
 * or undefined when unknown. Git is first consulted on use, i.e. during the build.
 * @param {{ base: string }} options
 * @returns {(url: string) => string | undefined}
 */
export function gitLastmod({ base }) {
  const prefix = base.replace(/\/$/, '');
  /** @type {Set<string> | null | undefined} null = no git history */
  let boundary;
  return (url) => {
    if (boundary === undefined) {
      boundary = git(['rev-parse', '--git-dir']) ? shallowBoundary() : null;
      if (!boundary) console.warn('[lastmod] No git history available; sitemap <lastmod> left out.');
    }
    if (!boundary) return undefined;

    let path = new URL(url).pathname;
    if (prefix && path.startsWith(prefix)) path = path.slice(prefix.length) || '/';
    for (const [pattern, files] of SOURCES) {
      const match = path.match(pattern);
      if (!match) continue;
      const [hash, date] = (git(['log', '-1', '--format=%H %cI', '--', ...files(...match.slice(1))]) ?? '').split(' ');
      return hash && date && !boundary.has(hash) ? date : undefined;
    }
    return undefined;
  };
}
