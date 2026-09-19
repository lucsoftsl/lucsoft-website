# Lucsoft SL — website

Presentation site for Lucsoft SL: "Websites, from A to Z". Static site built with [Astro](https://astro.build) and Tailwind CSS, hosted on [Vercel](https://lucsoft-website.vercel.app). It has no database and no API.

## Editing content (admin panel)

Content lives in plain files, and you edit it with **[Pages CMS](https://app.pagescms.org)**:

1. Go to <https://app.pagescms.org> and sign in with GitHub.
2. Open `lucsoftsl/lucsoft-website`. The panel is configured by [`.pages.yml`](.pages.yml).
3. Edit and save. Each save is a commit to `master`, and the site redeploys automatically in about 1–2 minutes.

The site is in **English** (`/`) and **Spanish** (`/es/`). Every text has an English and a Spanish version in the panel.

| What | File |
| --- | --- |
| Company, phone, email, address, CIF, form key (same in both languages) | `src/data/site.json` |
| Home page texts (hero, services, process, pricing, FAQ) | `src/data/en/home.json`, `src/data/es/home.json` |
| Reviews (original words + optional translation) | `src/data/reviews.json` |
| Portfolio projects (one file per project, same file name in both folders) | `src/content/work/en/*.md`, `src/content/work/es/*.md` |
| Privacy policy / Legal notice & terms | `src/content/legal/en/*.md`, `src/content/legal/es/*.md` |
| Images (shared) | `public/media/` |

Small interface texts (menu, buttons, form labels) are in `src/i18n/ui.ts`. Spanish URLs are defined in `src/i18n/config.ts`: `/es/proyectos/…`, `/es/privacidad` and `/es/aviso-legal`.

If an edit breaks the expected format, the build fails with a message naming the file, and the live site stays as it was.

### Contact form

The form sends through [Web3Forms](https://web3forms.com), a free service with no backend to run. The access key is set in **Company & contact details → Web3Forms access key**. If that field is emptied, the form falls back to opening the visitor's email app with the message pre-filled. Enquiries include the language the visitor used.

## SEO and AI indexing

Handled automatically on every build, from the same content as the pages:

- **Search basics:** one URL per page without a trailing slash (`/privacy`; `/privacy/` redirects), canonical and `hreflang` links, the sitemap at <https://lucsoft.es/sitemap-index.xml> (built on every deploy, not a file in the repo), `robots.txt`, and Open Graph tags for link previews. `www.lucsoft.es` and `lucsoft-website.vercel.app` redirect to `lucsoft.es`.
- **Freshness for Bing:** each sitemap entry has a `<lastmod>` date: the last git commit that changed that page's content. Vercel builds from the last 10 commits, so a page not edited within them gets no date rather than a wrong one. Don't set `VERCEL_DEEP_CLONE`: it makes Vercel's clone step fail for this project. After every production deploy, the GitHub Action `.github/workflows/indexnow.yml` tells Bing via [IndexNow](https://www.indexnow.org) which pages were added, changed or removed. Its key is the file `public/100bbf7ebe233138546e7f64157ed661.txt`; keep it.
- **Structured data:** JSON-LD for the company and its services, each page, breadcrumbs, the FAQ and every case study. Check it at <https://search.google.com/test/rich-results>.
- **AI assistants:** `robots.txt` explicitly allows ChatGPT, Claude, Perplexity, Gemini and others. `/llms.txt` and `/llms-full.txt` give them the site as plain text.
- **Images:** portfolio images get smaller WebP copies (`/_img/…`) so phones download less. Upload full-size images to the CMS; there's no need to resize them first.

In the CMS, the **SEO title** and **SEO description** of each home page are the text Google shows. Under **Company & contact details**, add official profiles (Google Business Profile, LinkedIn, Instagram…) and search-engine verification codes.

After going live on the final domain:

1. Add the domain to [Google Search Console](https://search.google.com/search-console) (DNS verification, or paste the HTML-tag code into the CMS) and submit `https://<domain>/sitemap-index.xml`.
2. Import the site into [Bing Webmaster Tools](https://www.bing.com/webmasters) from Search Console, and submit the same sitemap. Bing's index also feeds Copilot and ChatGPT search. IndexNow submissions show up under **IndexNow** there.
3. Create or claim the Google Business Profile with the same name, address and phone number as the site, then add its URL to the CMS profiles.

**Site health check:** after every production deploy and once a day, the GitHub Action `.github/workflows/site-health.yml` checks the live site: every sitemap page loads, is indexable and has a self-referencing canonical, valid structured data, `hreflang` and a description; the `www`, `http`, `vercel.app` and trailing-slash redirects work; `robots.txt`, `llms.txt`, the IndexNow key and the analytics tags are in place. If something breaks, the run fails and GitHub emails you. Run it by hand with `node scripts/site-health.mjs`.

## Analytics

Both services are cookieless: no cookie banner is needed, and the privacy policy describes them. Their IDs are under **Company & contact details → Analytics** in the CMS; empty a field to turn that service off. They only load on the live site, not in `npm run dev`.

- **[Umami](https://cloud.umami.is)** (main dashboard): visitors, pages, where visitors come from (Google, Bing, ChatGPT…, including `utm_source`), countries, devices, page speed (the **Performance** tab), and what visitors click. The click events are:

  | Event | Properties | When |
  | --- | --- | --- |
  | `contact-click` | `channel` (phone, whatsapp, email), `area` | Tapping a phone, WhatsApp or email link |
  | `contact-form-start` | | First click into the contact form |
  | `contact-form-invalid` | `field` | Sending with a missing or invalid field |
  | `contact-form-sent` | `project`, `via` (form, email-app) | Enquiry sent |
  | `contact-form-failed` | | Sending failed (visitor is asked to call or email) |
  | `case-study-click` | `project`, `area` | Opening a case study |
  | `outbound-click` | `domain`, `area` | Links to other sites (client sites, App Store…) |
  | `nav-click` | `target`, `area` | Menu, buttons and other links within the site |
  | `language-switch` | `to` | Switching between English and Spanish |

  `area` is the part of the page that was clicked: `header`, `hero`, `work`, `contact`, `footer`, `article` (a case study)… Clicks are tracked in `src/scripts/analytics.ts`, so new links are covered automatically. In Umami, a **Funnel** report (visit → `contact-form-start` → `contact-form-sent`) shows where enquiries drop off, and **Goals** can count `contact-click` and `contact-form-sent` as leads.
- **[Ahrefs Web Analytics](https://app.ahrefs.com/web-analytics)**: page views and sources next to Ahrefs' SEO data (keywords, backlinks, site audit).

## Hosted legal pages for other projects

`root/` holds the privacy and terms pages for the apps and projects hosted here (FoodSync, AlexaFit, etc.). They are copied into the build **unchanged**, so URLs like `/root/foodsync-privacy.html` keep working. They are served with a `noindex` header (see `vercel.json`), so they stay reachable for app stores but stay out of search results for this site. `app-ads.txt` and `output1.pdf` are copied the same way. Keep editing them in place.

## Development

```bash
npm install
npm run dev      # http://localhost:4321/
npm run build    # type-check + build to dist/
npm run preview
```

## Deployment

Vercel builds and deploys every push to `master` automatically (framework preset: Astro, output `dist/`). Edits saved in the admin panel are commits too, so they go live the same way.

**Custom domain:** add it in Vercel → Project → Settings → Domains. The build picks it up automatically for canonical URLs, hreflang and the sitemap.
