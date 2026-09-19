// Custom events for Umami, the site's cookieless analytics. The Umami script is
// only on the page when a website ID is set in the CMS; until then this does
// nothing. Kept free of side effects so any script can import it.

export type EventData = Record<string, string>;

declare global {
  interface Window {
    umami?: { track: (event: string, data?: EventData) => unknown };
  }
}

export function trackEvent(name: string, data?: EventData): void {
  window.umami?.track(name, data);
}
