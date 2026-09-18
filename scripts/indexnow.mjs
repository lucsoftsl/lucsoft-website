// Tells Bing (and the other IndexNow search engines) which pages a deploy added,
// changed or removed, so Bing and Copilot pick up edits within minutes instead
// of waiting for the next crawl.
//
// Run by .github/workflows/indexnow.yml after each production deploy, on a build
// of the deployed commit. Each page's content is fingerprinted and compared
// with the previous run's fingerprints (the state file), so unchanged pages are
// never resubmitted.
//
// Usage: node scripts/indexnow.mjs <state.json>      DRY_RUN=1 lists without submitting.
import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const ENDPOINT = 'https://api.indexnow.org/indexnow';
const DIST = 'dist';
const KEY_FILE = /^[0-9a-f]{32}\.txt$/;

/** The IndexNow key is the name (and content) of the one key file in public/. */
async function readKey() {
  const files = (await readdir('public')).filter((f) => KEY_FILE.test(f));
  if (files.length !== 1) throw new Error(`Expected one IndexNow key file in public/, found ${files.length}.`);
  const key = files[0].replace(/\.txt$/, '');
  if ((await readFile(join('public', files[0]), 'utf8')).trim() !== key) throw new Error(`public/${files[0]} must contain its own name.`);
  return key;
}

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

/** Every page URL in the built sitemap. */
async function sitemapUrls() {
  const index = await readFile(join(DIST, 'sitemap-index.xml'), 'utf8');
  const sitemaps = await Promise.all(locs(index).map((url) => readFile(join(DIST, new URL(url).pathname), 'utf8')));
  return sitemaps.flatMap(locs);
}

/**
 * Fingerprint of what a reader and a search engine see on the page: title,
 * description, and the main content's text, links and images. Styling and
 * script changes don't alter it.
 */
function fingerprint(html) {
  const title = html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? '';
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const main = (html.match(/<main[^>]*>([\s\S]*)<\/main>/)?.[1] ?? html).replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/g, '');
  const attributes = [...main.matchAll(/\s(href|src|alt)="([^"]*)"/g)].map((m) => m[2]);
  const text = main.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return createHash('sha256').update(JSON.stringify([title, description, text, attributes])).digest('hex');
}

async function pageFingerprint(url) {
  const path = new URL(url).pathname;
  const file = path === '/' ? join(DIST, 'index.html') : join(DIST, path, 'index.html');
  return fingerprint(await readFile(file, 'utf8'));
}

async function readState(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

async function submit(key, urls) {
  const { host, origin } = new URL(urls[0]);
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key, keyLocation: `${origin}/${key}.txt`, urlList: urls }),
  });
  // 200 = accepted, 202 = accepted while the key is being verified.
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(`IndexNow rejected the submission: HTTP ${response.status} ${await response.text()}`);
  }
}

const stateFile = process.argv[2];
if (!stateFile) throw new Error('Usage: node scripts/indexnow.mjs <state.json>');

const key = await readKey();
const previous = await readState(stateFile);
const urls = await sitemapUrls();
const current = Object.fromEntries(await Promise.all(urls.map(async (url) => [url, await pageFingerprint(url)])));

const changed = urls.filter((url) => previous[url] !== current[url]);
const removed = Object.keys(previous).filter((url) => !(url in current));
const toSubmit = [...changed, ...removed];

console.log(`${urls.length} pages: ${changed.length} new or changed, ${removed.length} removed.`);
toSubmit.forEach((url) => console.log(`  ${url}`));

if (toSubmit.length > 0 && !process.env.DRY_RUN) {
  await submit(key, toSubmit);
  console.log('Submitted to IndexNow.');
}
await writeFile(stateFile, `${JSON.stringify(current, null, 2)}\n`);
