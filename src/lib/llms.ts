// /llms.txt and /llms-full.txt (https://llmstxt.org): the site as plain
// Markdown, so AI assistants can read and cite it accurately. Generated from the
// same CMS content as the pages, so it never drifts out of date.
import { getEntry } from 'astro:content';
import { site, getHome, reviews, reviewText, addressLines } from './content';
import { getWork, workSlug } from './work';
import { absoluteUrl } from './url';
import { routes, type Locale } from '../i18n/config';

const LOCALE: Locale = 'en';

function contactLines(): string[] {
  return [
    `- Phone${site.whatsapp ? ' / WhatsApp' : ''}: ${site.phone}`,
    `- Email: ${site.email}`,
    `- Address: ${site.company}, ${addressLines(LOCALE).join(', ')}`,
    `- Contact form: ${absoluteUrl(routes.home(LOCALE))}#contact`,
    ...site.profiles.map((url) => `- Profile: ${url}`),
  ];
}

function header(): string[] {
  const home = getHome(LOCALE);
  return [
    `# ${site.company}`,
    '',
    `> ${home.meta.description}`,
    '',
    home.hero.lead,
    '',
    `${home.company.title} ${home.company.titleAccent} ${home.company.lead}`,
    '',
    `The site is available in English (${absoluteUrl(routes.home('en'))}) and Spanish (${absoluteUrl(routes.home('es'))}). ${home.meta.availabilityDetail}`,
    '',
  ];
}

async function pageLinks(): Promise<string[]> {
  const [privacy, terms] = await Promise.all([getEntry('legal', `${LOCALE}/privacy`), getEntry('legal', `${LOCALE}/terms`)]);
  return [
    `- [Home](${absoluteUrl(routes.home('en'))}): services, process, pricing, reviews, FAQ and contact`,
    `- [Inicio (Español)](${absoluteUrl(routes.home('es'))}): the same site in Spanish`,
    privacy && `- [${privacy.data.title}](${absoluteUrl(routes.privacy(LOCALE))}): ${privacy.data.description}`,
    terms && `- [${terms.data.title}](${absoluteUrl(routes.terms(LOCALE))}): ${terms.data.description}`,
  ].filter((line): line is string => Boolean(line));
}

export async function llmsIndex(): Promise<string> {
  const home = getHome(LOCALE);
  const projects = await getWork(LOCALE);
  return [
    ...header(),
    '## Services',
    '',
    ...home.services.items.map((s) => `- **${s.title}**: ${s.text}`),
    '',
    '## Work',
    '',
    ...projects.map((p) => `- [${p.data.client}](${absoluteUrl(routes.work(LOCALE, workSlug(p)))}): ${p.data.summary}`),
    '',
    '## Contact',
    '',
    ...contactLines(),
    '',
    '## Pages',
    '',
    ...(await pageLinks()),
    '',
    '## Optional',
    '',
    `- [Full text](${absoluteUrl('/llms-full.txt')}): services, process, pricing, FAQ, reviews and every case study in one file`,
    '',
  ].join('\n');
}

export async function llmsFull(): Promise<string> {
  const home = getHome(LOCALE);
  const projects = await getWork(LOCALE);
  return [
    ...header(),
    '## Services',
    '',
    ...home.services.items.flatMap((s) => [`### ${s.title}`, '', s.text, '']),
    `Also: ${home.marquee.join(', ')}.`,
    '',
    `## ${home.process.title}`,
    '',
    ...home.process.steps.map((step, i) => `${i + 1}. **${step.title}**: ${step.text}`),
    '',
    `## Pricing: ${home.pricing.title} ${home.pricing.titleAccent}`,
    '',
    home.pricing.lead,
    '',
    ...home.pricing.points.map((point) => `- ${point}`),
    '',
    '## Frequently asked questions',
    '',
    ...home.faq.flatMap((item) => [`### ${item.question}`, '', item.answer, '']),
    '## Client reviews',
    '',
    ...reviews.flatMap((r) => [`> ${reviewText(r, LOCALE).text}`, `> — ${r.name}${r.role ? `, ${r.role}` : ''} (${r.rating}/5)`, '']),
    '## Case studies',
    '',
    ...projects.flatMap((p) => [
      `### ${p.data.client}: ${p.data.title}`,
      '',
      `- Case study: ${absoluteUrl(routes.work(LOCALE, workSlug(p)))}`,
      `- Live site: ${p.data.url}`,
      `- Category: ${p.data.category}`,
      ...(p.data.location ? [`- Location: ${p.data.location}`] : []),
      ...(p.data.year ? [`- Year: ${p.data.year}`] : []),
      ...(p.data.services.length > 0 ? [`- Features: ${p.data.services.join(', ')}`] : []),
      '',
      p.data.summary,
      '',
      (p.body ?? '').trim(),
      '',
    ]),
    '## Contact',
    '',
    ...contactLines(),
    '',
    '## Pages',
    '',
    ...(await pageLinks()),
    '',
  ].join('\n');
}
