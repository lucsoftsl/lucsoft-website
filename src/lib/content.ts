// Typed access to the CMS-editable JSON files. A malformed edit fails the
// build with a clear message instead of shipping a broken page.
import { z } from 'astro/zod';
import siteJson from '../data/site.json';
import homeEn from '../data/en/home.json';
import homeEs from '../data/es/home.json';
import reviewsJson from '../data/reviews.json';
import type { Locale } from '../i18n/config';
import { useTranslations } from '../i18n/ui';

const siteSchema = z.object({
  company: z.string(),
  brand: z.string(),
  phone: z.string(),
  email: z.email(),
  whatsapp: z.boolean(),
  address: z.object({
    street: z.string(),
    locality: z.string(),
    region: z.string(),
    postalCode: z.string(),
  }),
  taxId: z.string(),
  registryDetails: z.string(),
  contactFormKey: z.string(),
});

const titled = { title: z.string(), titleAccent: z.string() };

const homeSchema = z.object({
  meta: z.object({
    description: z.string(),
    availability: z.string(),
    availabilityDetail: z.string(),
  }),
  hero: z.object({
    eyebrow: z.string(),
    titleBefore: z.string(),
    titleAccent: z.string(),
    lead: z.string(),
    primaryCta: z.string(),
    secondaryCta: z.string(),
  }),
  marquee: z.array(z.string()),
  company: z.object({
    ...titled,
    lead: z.string(),
    points: z.array(z.object({ title: z.string(), text: z.string() })),
  }),
  services: z.object({
    ...titled,
    items: z.array(z.object({ letter: z.string().max(2), title: z.string(), text: z.string() })),
  }),
  process: z.object({
    title: z.string(),
    steps: z.array(z.object({ title: z.string(), text: z.string() })),
  }),
  pricing: z.object({
    ...titled,
    lead: z.string(),
    points: z.array(z.string()),
    cta: z.string(),
  }),
  faq: z.array(z.object({ question: z.string(), answer: z.string() })),
});

const reviewsSchema = z.array(
  z.object({
    name: z.string(),
    role: z.string().default(''),
    rating: z.number().int().min(1).max(5),
    /** Language the client wrote the review in. */
    language: z.enum(['en', 'es']),
    text: z.string(),
    /** Optional translation into the other site language. */
    translation: z.string().default(''),
    featured: z.boolean().default(false),
  }),
);

function parse<T>(schema: z.ZodType<T>, data: unknown, file: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid content in src/data/${file}:\n${result.error.message}`);
  }
  return result.data;
}

export const site = parse(siteSchema, siteJson, 'site.json');
const homes: Record<Locale, z.infer<typeof homeSchema>> = {
  en: parse(homeSchema, homeEn, 'en/home.json'),
  es: parse(homeSchema, homeEs, 'es/home.json'),
};
export type Home = z.infer<typeof homeSchema>;

export function getHome(locale: Locale): Home {
  return homes[locale];
}
export const reviews = parse(reviewsSchema, reviewsJson, 'reviews.json');

const digits = site.phone.replace(/[^\d+]/g, '');
export const contact = {
  tel: `tel:${digits}`,
  whatsapp: site.whatsapp ? `https://wa.me/${digits.replace(/^\+/, '')}` : null,
  mailto: `mailto:${site.email}`,
};

export function addressLines(locale: Locale): string[] {
  const t = useTranslations(locale);
  return [
    site.address.street,
    `${site.address.postalCode} ${site.address.locality}`,
    `${site.address.region}, ${t('address.country')}`,
  ];
}

export type Review = (typeof reviews)[number];

/** The review text for a page language: the original, or its translation if one exists. */
export function reviewText(review: Review, locale: Locale): { text: string; lang: Locale } {
  if (review.language === locale || !review.translation) return { text: review.text, lang: review.language };
  return { text: review.translation, lang: locale };
}
