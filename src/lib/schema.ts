// schema.org structured data (JSON-LD). Every page emits one linked @graph so
// Google and AI assistants read the company, the site and the page as
// connected entities instead of loose facts.
import type { CollectionEntry } from 'astro:content';
import { site, getHome } from './content';
import { absoluteUrl } from './url';
import { LOCALE_META, routes, type Locale } from '../i18n/config';

type Node = Record<string, unknown>;

const AREA_SERVED = ['Costa del Sol', 'Málaga', 'Spain'];
const LANGUAGES = ['English', 'Spanish'];

const orgId = () => `${absoluteUrl('/')}#organization`;
const websiteId = () => `${absoluteUrl('/')}#website`;
export const pageId = (path: string) => `${absoluteUrl(path)}#webpage`;

export function organization(locale: Locale): Node {
  const { meta, services, marquee } = getHome(locale);
  return {
    '@type': 'ProfessionalService',
    '@id': orgId(),
    name: site.company,
    alternateName: site.brand,
    legalName: site.company,
    description: meta.description,
    url: absoluteUrl(routes.home(locale)),
    logo: { '@type': 'ImageObject', url: absoluteUrl('/icon-512.png'), width: 512, height: 512 },
    image: absoluteUrl('/media/og.jpg'),
    telephone: site.phone,
    email: site.email,
    ...(site.taxId && { taxID: site.taxId }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.locality,
      addressRegion: site.address.region,
      postalCode: site.address.postalCode,
      addressCountry: 'ES',
    },
    areaServed: AREA_SERVED,
    // availableLanguage is only valid on the contact point; the company itself knowsLanguage.
    knowsLanguage: Object.values(LOCALE_META).map((m) => m.htmlLang),
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: site.phone,
      email: site.email,
      availableLanguage: LANGUAGES,
    },
    knowsAbout: marquee,
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: services.title,
      itemListElement: services.items.map((service) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: service.title, description: service.text, provider: { '@id': orgId() } },
      })),
    },
    ...(site.profiles.length > 0 && { sameAs: site.profiles }),
  };
}

export function website(): Node {
  return {
    '@type': 'WebSite',
    '@id': websiteId(),
    url: absoluteUrl('/'),
    name: site.company,
    alternateName: site.brand,
    publisher: { '@id': orgId() },
    inLanguage: Object.values(LOCALE_META).map((m) => m.htmlLang),
  };
}

interface PageInput {
  locale: Locale;
  path: string;
  title: string;
  description: string;
  image: string;
  hasBreadcrumb: boolean;
}

export function webPage({ locale, path, title, description, image, hasBreadcrumb }: PageInput): Node {
  return {
    '@type': 'WebPage',
    '@id': pageId(path),
    url: absoluteUrl(path),
    name: title,
    description,
    inLanguage: LOCALE_META[locale].htmlLang,
    isPartOf: { '@id': websiteId() },
    about: { '@id': orgId() },
    primaryImageOfPage: { '@type': 'ImageObject', url: image },
    ...(hasBreadcrumb && { breadcrumb: { '@id': `${absoluteUrl(path)}#breadcrumb` } }),
  };
}

/** Trail from the home page to `path`; `name` is the current page's label. */
export function breadcrumbs(locale: Locale, path: string, name: string): Node {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${absoluteUrl(path)}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: site.brand, item: absoluteUrl(routes.home(locale)) },
      { '@type': 'ListItem', position: 2, name, item: absoluteUrl(path) },
    ],
  };
}

export function faqPage(locale: Locale): Node {
  return {
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(routes.home(locale))}#faq`,
    inLanguage: LOCALE_META[locale].htmlLang,
    isPartOf: { '@id': pageId(routes.home(locale)) },
    mainEntity: getHome(locale).faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function caseStudy(locale: Locale, path: string, project: CollectionEntry<'work'>): Node {
  const { data } = project;
  return {
    '@type': 'CreativeWork',
    '@id': `${absoluteUrl(path)}#case-study`,
    name: `${data.client} — ${data.title}`,
    headline: data.title,
    description: data.summary,
    genre: data.category,
    inLanguage: LOCALE_META[locale].htmlLang,
    url: absoluteUrl(path),
    mainEntityOfPage: { '@id': pageId(path) },
    image: [data.screenshot, data.cover, ...data.gallery.map((g) => g.src)]
      .filter((src): src is string => Boolean(src))
      .map(absoluteUrl),
    creator: { '@id': orgId() },
    ...(data.year && { dateCreated: data.year }),
    ...(data.services.length > 0 && { keywords: data.services.join(', ') }),
    about: {
      '@type': 'Organization',
      name: data.client,
      url: data.url,
      ...(data.location && { location: data.location }),
    },
  };
}

/** The project's native app, when it has App Store or Google Play listings. */
export function mobileApp(path: string, project: CollectionEntry<'work'>): Node | undefined {
  const { data } = project;
  const stores = [data.appStore, data.googlePlay].filter((url): url is string => Boolean(url));
  if (stores.length === 0) return undefined;
  const systems = [...(data.appStore ? ['iOS'] : []), ...(data.googlePlay ? ['Android'] : [])];
  return {
    '@type': 'MobileApplication',
    '@id': `${absoluteUrl(path)}#app`,
    name: data.client,
    description: data.summary,
    url: data.url,
    operatingSystem: systems.join(', '),
    installUrl: stores,
    sameAs: stores,
    ...(data.appScreens.length > 0 && { screenshot: data.appScreens.map((screen) => absoluteUrl(screen.src)) }),
    creator: { '@id': orgId() },
    subjectOf: { '@id': `${absoluteUrl(path)}#case-study` },
  };
}

/** Serializes nodes as a JSON-LD @graph, safe to embed in a <script> tag. */
export function toJsonLd(nodes: Node[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': nodes }).replace(/</g, '\\u003c');
}
