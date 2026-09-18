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

## Hosted legal pages for other projects

`root/` holds the privacy and terms pages for the apps and projects hosted here (FoodSync, AlexaFit, etc.). They are copied into the build **unchanged**, so URLs like `/root/foodsync-privacy.html` keep working. `app-ads.txt` and `output1.pdf` are copied the same way. Keep editing them in place.

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
