// <lastmod> for the sitemap: when a page's content last changed, taken from the
// git history of the content files it is built from (design and code changes
// don't count). Bing and Google ignore lastmod they can't trust, so it is left
// out rather than guessed when the history is incomplete — as in Vercel's
// default 10-commit clone. Set VERCEL_DEEP_CLONE=true on Vercel to get it.
import { execFileSync } from 'node:child_process';

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

/**
 * Returns a lookup from absolute page URL to its last content change (ISO 8601),
 * or undefined when unknown. History is checked on first use, i.e. during the build.
 * @param {{ base: string }} options
 * @returns {(url: string) => string | undefined}
 */
export function gitLastmod({ base }) {
  const prefix = base.replace(/\/$/, '');
  /** @type {boolean | undefined} */
  let complete;
  return (url) => {
    if (complete === undefined) {
      complete = git(['rev-parse', '--is-shallow-repository']) === 'false';
      if (!complete) console.warn('[lastmod] Git history is shallow or missing; sitemap <lastmod> left out. On Vercel, set VERCEL_DEEP_CLONE=true.');
    }
    if (!complete) return undefined;

    let path = new URL(url).pathname;
    if (prefix && path.startsWith(prefix)) path = path.slice(prefix.length) || '/';
    for (const [pattern, files] of SOURCES) {
      const match = path.match(pattern);
      if (match) return git(['log', '-1', '--format=%cI', '--', ...files(...match.slice(1))]) || undefined;
    }
    return undefined;
  };
}
