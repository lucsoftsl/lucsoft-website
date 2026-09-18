// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import legacyFiles from './integrations/legacy-files.mjs';
import rehypeBaseLinks from './integrations/rehype-base-links.mjs';

// GitHub Pages project URL by default. If you connect a custom domain,
// set SITE_URL=https://yourdomain.com and BASE_PATH=/ in the deploy workflow.
const site = process.env.SITE_URL ?? 'https://lucsoftsl.github.io';
const base = process.env.BASE_PATH ?? '/lucsoft-website';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  integrations: [sitemap(), legacyFiles(['root', 'app-ads.txt', 'output1.pdf'])],
  markdown: { rehypePlugins: [[rehypeBaseLinks, { base }]] },
  vite: { plugins: [tailwindcss()] },
});
