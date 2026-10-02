const root = document.documentElement;
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

/* Theme: follows the system until the visitor chooses, then remembers it. */
const themeButton = document.querySelector<HTMLButtonElement>('[data-theme-toggle]');
const currentTheme = () => root.dataset.theme === 'light' || root.dataset.theme === 'dark' ? root.dataset.theme : systemDark.matches ? 'dark' : 'light';
function labelTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  themeButton?.setAttribute('aria-label', `Switch to ${next} theme`);
  themeButton?.setAttribute('title', `Switch to ${next} theme`);
}
themeButton?.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('omar-theme', next); } catch { /* storage unavailable */ }
  labelTheme();
});
systemDark.addEventListener('change', labelTheme);
labelTheme();

/* Mobile navigation sheet: inert background, scroll lock, focus return. */
const header = document.querySelector<HTMLElement>('[data-header]');
const menu = document.querySelector<HTMLButtonElement>('[data-menu]');
const nav = document.querySelector<HTMLElement>('[data-nav]');
const menuLabel = menu?.querySelector<HTMLElement>('[data-menu-label]');
const background = [document.querySelector('main'), document.querySelector('footer'), document.querySelector('.skip-link')].filter((el): el is HTMLElement => el instanceof HTMLElement);
const desktop = window.matchMedia('(min-width: 1100px)');

function setMenu(open: boolean, returnFocus = false) {
  if (!menu || !nav) return;
  menu.setAttribute('aria-expanded', String(open));
  if (menuLabel) menuLabel.textContent = open ? 'Close' : 'Menu';
  nav.classList.toggle('is-open', open);
  if (header) header.toggleAttribute('data-open', open);
  background.forEach(el => { el.inert = open; });
  root.style.overflow = open ? 'hidden' : '';
  if (open) nav.querySelector<HTMLAnchorElement>('a')?.focus();
  else if (returnFocus) menu.focus();
}
menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true', true));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
});
nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { if (!desktop.matches) setMenu(false); }));
desktop.addEventListener('change', () => setMenu(false));

/* Header over the hero: transparent until the hero scrolls away. */
const heroSection = document.querySelector<HTMLElement>('[data-hero]');
if (header?.hasAttribute('data-over') && heroSection) {
  let headerFrame = 0;
  const update = () => { headerFrame = 0; header.toggleAttribute('data-solid', heroSection.getBoundingClientRect().bottom <= header.offsetHeight + 1); };
  addEventListener('scroll', () => { if (!headerFrame) headerFrame = requestAnimationFrame(update); }, { passive: true });
  addEventListener('resize', update, { passive: true });
  update();
}

/* Scroll reveals. Children of [data-reveal-stagger] reveal in sequence. */
document.querySelectorAll<HTMLElement>('[data-reveal-stagger]').forEach(group => {
  [...group.children].forEach((child, index) => {
    if (!(child instanceof HTMLElement)) return;
    child.setAttribute('data-reveal', '');
    child.style.setProperty('--reveal-delay', `${Math.min(index, 8) * 80}ms`);
  });
});
const revealables = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
if ('IntersectionObserver' in window) {
  const revealer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    revealer.unobserve(entry.target);
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  revealables.forEach(element => revealer.observe(element));
} else revealables.forEach(element => element.classList.add('is-in'));

/* Count-up numbers: final values are in the HTML; animate once when seen. */
const counters = [...document.querySelectorAll<HTMLElement>('[data-count-to]')];
if (counters.length && 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const counter = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    counter.unobserve(entry.target);
    const element = entry.target as HTMLElement;
    const target = Number(element.dataset.countTo) || 0;
    const started = performance.now();
    const tick = (time: number) => {
      const progress = Math.min(1, (time - started) / 1400);
      element.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    element.textContent = '0';
    requestAnimationFrame(tick);
  }), { threshold: .5 });
  counters.forEach(element => counter.observe(element));
}

/* Live London time in the homepage status line (not shown without JavaScript). */
const londonTime = document.querySelector<HTMLTimeElement>('[data-london-time]');
if (londonTime) {
  const format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit' });
  const tick = () => { londonTime.textContent = format.format(new Date()); };
  tick();
  londonTime.setAttribute('aria-label', 'Current time in London');
  setInterval(tick, 30_000);
}

/* Sticky call to action: hidden while its target (or the page intro) is on screen. */
document.querySelectorAll<HTMLElement>('[data-sticky-cta]').forEach(cta => {
  const targets = (cta.dataset.stickyCta || '').split(',').map(selector => document.querySelector(selector.trim())).filter((el): el is Element => !!el);
  if (!targets.length || !('IntersectionObserver' in window)) return;
  const visible = new Set<Element>();
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target));
    cta.toggleAttribute('data-hidden', visible.size > 0);
  });
  targets.forEach(target => observer.observe(target));
  cta.hidden = false;
});

export {};
