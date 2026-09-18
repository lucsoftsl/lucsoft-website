// Site-wide progressive enhancements. Everything works without JS; this adds polish.

const SCROLLED_THRESHOLD_PX = 24;

function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;

  // A sentinel at the top of the page avoids a scroll listener.
  const sentinel = document.createElement('div');
  sentinel.style.cssText = `position:absolute;top:0;left:0;height:${SCROLLED_THRESHOLD_PX}px;width:1px;pointer-events:none;`;
  document.body.prepend(sentinel);

  new IntersectionObserver(([entry]) => {
    header.toggleAttribute('data-scrolled', !entry.isIntersecting);
  }).observe(sentinel);
}

function initReveal(): void {
  const items = document.querySelectorAll<HTMLElement>('[data-reveal]');
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-in'));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  items.forEach((el) => observer.observe(el));
}

function initMobileMenu(): void {
  const menu = document.getElementById('mobile-nav');
  if (!menu) return;
  const toggle = document.querySelector<HTMLElement>('[data-menu-toggle]');
  menu.addEventListener('toggle', (event) => {
    toggle?.setAttribute('aria-expanded', String((event as ToggleEvent).newState === 'open'));
  });
  menu.querySelectorAll('[data-close-menu]').forEach((link) => {
    link.addEventListener('click', () => menu.hidePopover());
  });
}

initHeader();
initReveal();
initMobileMenu();
