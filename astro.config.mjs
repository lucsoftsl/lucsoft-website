// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import legacyFiles from './integrations/legacy-files.mjs';
import responsiveImages from './integrations/responsive-images.mjs';
import rehypeBaseLinks from './integrations/rehype-base-links.mjs';

// Deployed on Vercel at the domain root. During Vercel builds the production
// domain (including a custom domain, once added) is picked up automatically.
// SITE_URL / BASE_PATH override both, e.g. for hosting under a sub-path.
const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const site = process.env.SITE_URL ?? (vercelDomain ? `https://${vercelDomain}` : 'https://lucsoft-website.vercel.app');
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  // One URL per page: "/privacy", never "/privacy/". Canonicals, hreflang,
  // internal links and the sitemap all use this form, and vercel.json
  // redirects the slashed variant to it.
  trailingSlash: 'never',
  integrations: [sitemap(), responsiveImages(), legacyFiles(['root', 'app-ads.txt', 'output1.pdf'])],
  markdown: { rehypePlugins: [[rehypeBaseLinks, { base }]] },
  vite: { plugins: [tailwindcss()] },
});
