// Checks that the live site is still findable: every page in the sitemap loads,
// is indexable and points its canonical at itself; the redirects that keep one
// URL per page work; robots.txt, llms.txt, the IndexNow key and the analytics
// tags are in place. Exits with an error (GitHub then emails the owner) when
// anything regressed.
//
// Run by .github/workflows/site-health.yml after each production deploy and daily.
// Usage: node scripts/site-health.mjs [site]      (default https://lucsoft.es)
import { appendFile, readFile, readdir } from 'node:fs/promises';

const SITE = new URL(process.argv[2] ?? 'https://lucsoft.es');
const ORIGIN = SITE.origin;
/** Vercel's production alias; vercel.json redirects it to the domain. */
const VERCEL_HOST = 'lucsoft-website.vercel.app';
const CONCURRENCY = 4;

const failures = [];
const fail = (message) => {
  failures.push(message);
};

/** Fetches without following redirects, so each hop can be checked. */
function get(url) {
  return fetch(url, { redirect: 'manual', headers: { 'User-Agent': 'lucsoft-site-health' } });
}

/** A permanent redirect from `from` straight to `to`. */
async function expectRedirect(from, to) {
  const response = await get(from);
  const location = response.headers.get('location');
  if (![301, 308].includes(response.status) || new URL(location ?? '', from).href !== to) {
    fail(`${from} should redirect permanently to ${to}, got ${response.status} ${location ?? ''}`);
  }
}

const locs = (xml) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

async function sitemapUrls() {
  const response = await get(`${ORIGIN}/sitemap-index.xml`);
  if (response.status !== 200) {
    fail(`sitemap-index.xml returned ${response.status}`);
    return [];
  }
  const sitemaps = await Promise.all(locs(await response.text()).map(async (url) => (await get(url)).text()));
  const urls = sitemaps.flatMap(locs);
  if (urls.length === 0) fail('The sitemap lists no pages');
  return urls;
}

const attr = (html, pattern) => html.match(pattern)?.[1];

async function checkPage(url) {
  const response = await get(url);
  if (response.status !== 200) return fail(`${url} returned ${response.status} (sitemap pages must load directly)`);
  if (/noindex/i.test(response.headers.get('x-robots-tag') ?? '')) return fail(`${url} has an X-Robots-Tag noindex header`);

  const html = await response.text();
  const canonical = attr(html, /<link rel="canonical" href="([^"]+)"/);
  if (canonical !== url) fail(`${url} has canonical ${canonical ?? '(none)'}`);
  if (/<meta name="robots" content="[^"]*noindex/i.test(html)) fail(`${url} is marked noindex`);
  if (!attr(html, /<title>([^<]+)<\/title>/)?.trim()) fail(`${url} has no <title>`);
  if (!attr(html, /<meta name="description" content="([^"]+)"/)) fail(`${url} has no meta description`);
  if (!/<html lang="[a-z]{2}/.test(html)) fail(`${url} has no <html lang>`);
  if (!/<link rel="alternate" hreflang="x-default"/.test(html)) fail(`${url} has no hreflang x-default`);

  const jsonLd = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (jsonLd.length === 0) fail(`${url} has no structured data`);
  for (const [, json] of jsonLd) {
    try {
      JSON.parse(json);
    } catch (error) {
      fail(`${url} has invalid JSON-LD: ${error.message}`);
    }
  }
  return html;
}

/** Runs `task` over `items`, at most CONCURRENCY at a time. */
async function inBatches(items, task) {
  const results = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    results.push(...(await Promise.all(items.slice(i, i + CONCURRENCY).map(task))));
  }
  return results;
}

async function checkRobots() {
  const response = await get(`${ORIGIN}/robots.txt`);
  const text = await response.text();
  if (response.status !== 200) return fail(`robots.txt returned ${response.status}`);
  if (/^Disallow:\s*\/\s*$/m.test(text)) fail('robots.txt blocks the whole site');
  if (!text.includes(`Sitemap: ${ORIGIN}/sitemap-index.xml`)) fail('robots.txt does not point to the sitemap');
}

async function checkText(path) {
  const response = await get(`${ORIGIN}${path}`);
  if (response.status !== 200 || !(response.headers.get('content-type') ?? '').startsWith('text/')) {
    fail(`${path} returned ${response.status} ${response.headers.get('content-type')}`);
  }
}

async function checkIndexNowKey() {
  const file = (await readdir('public')).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!file) return fail('No IndexNow key file in public/');
  const response = await get(`${ORIGIN}/${file}`);
  if (response.status !== 200 || (await response.text()).trim() !== file.replace(/\.txt$/, '')) {
    fail(`IndexNow key /${file} is not served (${response.status})`);
  }
}

/** The analytics configured in the CMS are on the page. */
async function checkAnalytics(homeHtml) {
  const { analytics = {} } = JSON.parse(await readFile('src/data/site.json', 'utf8'));
  if (analytics.umamiWebsiteId && !homeHtml.includes(`data-website-id="${analytics.umamiWebsiteId}"`)) {
    fail('The Umami script is missing from the home page');
  }
  if (analytics.ahrefsKey && !homeHtml.includes(`data-key="${analytics.ahrefsKey}"`)) {
    fail('The Ahrefs Web Analytics script is missing from the home page');
  }
}

const urls = await sitemapUrls();
const pages = await inBatches(urls, checkPage);
const homeHtml = pages[urls.indexOf(`${ORIGIN}/`)];

await Promise.all([
  checkRobots(),
  checkText('/llms.txt'),
  checkText('/llms-full.txt'),
  checkIndexNowKey(),
  homeHtml ? checkAnalytics(homeHtml) : fail('The home page is not in the sitemap'),
  expectRedirect(`http://${SITE.host}/`, `${ORIGIN}/`),
  expectRedirect(`https://www.${SITE.host}/privacy`, `${ORIGIN}/privacy`),
  expectRedirect(`https://${VERCEL_HOST}/`, `${ORIGIN}/`),
  expectRedirect(`https://${VERCEL_HOST}/privacy`, `${ORIGIN}/privacy`),
  expectRedirect(`${ORIGIN}/privacy/`, `${ORIGIN}/privacy`),
  get(`${ORIGIN}/this-page-does-not-exist`).then((r) => r.status !== 404 && fail(`Missing pages return ${r.status}, not 404`)),
]);

const report = failures.length
  ? [`## Site health: ${failures.length} problem(s)`, '', ...failures.map((f) => `- ${f}`)]
  : [`## Site health: OK`, '', `${urls.length} pages checked on ${ORIGIN}.`];
console.log(report.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${report.join('\n')}\n`);
if (failures.length) process.exit(1);
