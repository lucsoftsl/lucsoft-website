// Locales and localized routes. English lives at the site root, Spanish under /es.
import { withBase } from '../lib/url';

export const LOCALES = ['en', 'es'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_META: Record<Locale, { label: string; name: string; htmlLang: string; ogLocale: string }> = {
  en: { label: 'EN', name: 'English', htmlLang: 'en', ogLocale: 'en_GB' },
  es: { label: 'ES', name: 'Español', htmlLang: 'es', ogLocale: 'es_ES' },
};

/** Site-relative paths (without base) for every page, per locale. */
export const routes = {
  home: (locale: Locale) => (locale === 'en' ? '/' : '/es/'),
  work: (locale: Locale, slug: string) => (locale === 'en' ? `/work/${slug}` : `/es/proyectos/${slug}`),
  privacy: (locale: Locale) => (locale === 'en' ? '/privacy' : '/es/privacidad'),
  terms: (locale: Locale) => (locale === 'en' ? '/terms' : '/es/aviso-legal'),
};

/** Base-prefixed link to a section anchor on the home page. */
export function homeAnchor(locale: Locale, anchor: string): string {
  return withBase(`${routes.home(locale)}#${anchor}`);
}

/** The same page in every locale, used for hreflang and the language switcher. */
export type Alternates = Record<Locale, string>;

export function alternatesFor(build: (locale: Locale) => string): Alternates {
  return Object.fromEntries(LOCALES.map((l) => [l, build(l)])) as Alternates;
}
