// What visitors click, sent to Umami (see ./track.ts). One listener classifies
// every link click, so links added later (in the CMS or in code) are tracked
// without extra markup. Each event records the page area the click came from
// (hero, header, footer, contact…).

import { trackEvent, type EventData } from './track';

const CASE_STUDY_PATH = /\/(?:work|proyectos)\/([^/]+)$/;

/** Page area of an element: a section id ("contact"), its heading id without "-title" ("hero"), or a landmark. */
function areaOf(el: Element): string {
  const area = el.closest('[data-header], #mobile-nav, section, article, footer');
  if (!area) return 'page';
  if (area.matches('[data-header]')) return 'header';
  if (area.id) return area.id;
  const labelledBy = area.getAttribute('aria-labelledby');
  if (labelledBy) return labelledBy.replace(/-title$/, '');
  return area.tagName.toLowerCase();
}

function linkEvent(link: HTMLAnchorElement): [string, EventData] {
  const area = areaOf(link);
  const url = new URL(link.href, location.href);

  if (url.protocol === 'tel:') return ['contact-click', { channel: 'phone', area }];
  if (url.protocol === 'mailto:') return ['contact-click', { channel: 'email', area }];
  if (url.hostname === 'wa.me') return ['contact-click', { channel: 'whatsapp', area }];
  if (url.origin !== location.origin) return ['outbound-click', { domain: url.hostname.replace(/^www\./, ''), area }];
  if (link.hreflang) return ['language-switch', { to: link.hreflang }];

  const project = url.pathname.match(CASE_STUDY_PATH)?.[1];
  if (project) return ['case-study-click', { project, area }];
  return ['nav-click', { target: url.hash ? url.hash.slice(1) : url.pathname, area }];
}

function initClickTracking(): void {
  // Capture phase, so the click is recorded even if another handler stops it.
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest?.('a[href]');
      if (link instanceof HTMLAnchorElement) trackEvent(...linkEvent(link));
    },
    { capture: true },
  );
}

initClickTracking();
