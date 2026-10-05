const root = document.documentElement;

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
  if (open) document.querySelector('[data-float-contact]')?.removeAttribute('data-show');
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

/* Header: a soft shadow once the page has scrolled. */
if (header) {
  let headerFrame = 0;
  const floating = document.querySelector<HTMLElement>('[data-float-contact]');
  const update = () => {
    headerFrame = 0;
    header.toggleAttribute('data-scrolled', window.scrollY > 8);
    floating?.toggleAttribute('data-show', window.scrollY > window.innerHeight * .6 && !header.hasAttribute('data-open'));
  };
  addEventListener('scroll', () => { if (!headerFrame) headerFrame = requestAnimationFrame(update); }, { passive: true });
  update();
}

/* Scroll reveals. Children of [data-reveal-stagger] reveal in sequence. */
document.querySelectorAll<HTMLElement>('[data-reveal-stagger]').forEach(group => {
  [...group.children].forEach((child, index) => {
    if (!(child instanceof HTMLElement)) return;
    child.setAttribute('data-reveal', group.dataset.revealStagger || '');
    child.style.setProperty('--reveal-delay', `${Math.min(index, 8) * 80}ms`);
  });
});
const revealables = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
if ('IntersectionObserver' in window) {
  // Only now may CSS hide unrevealed blocks (html.reveal-ready): if this
  // script never runs, everything simply stays visible.
  root.classList.add('reveal-ready');
  const revealer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    revealer.unobserve(entry.target);
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  revealables.forEach(element => revealer.observe(element));
} else revealables.forEach(element => element.classList.add('is-in'));

/* Count-up numbers: final values are in the HTML; animate once when seen. */
/* While a number counts, it is aria-hidden and a visually hidden copy holds
   the final value, so assistive technology never reads the in-between. Not
   with reduced motion or Pause motion. */
const counters = [...document.querySelectorAll<HTMLElement>('[data-count-to]')];
const countStill = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.motion === 'off';
if (counters.length && 'IntersectionObserver' in window && !countStill()) {
  const counter = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    counter.unobserve(entry.target);
    const element = entry.target as HTMLElement;
    if (countStill()) return;
    const target = Number(element.dataset.countTo) || 0;
    const spoken = document.createElement('span');
    spoken.className = 'sr-only';
    spoken.textContent = String(target);
    element.after(spoken);
    element.setAttribute('aria-hidden', 'true');
    const started = performance.now();
    const tick = (time: number) => {
      const progress = Math.min(1, (time - started) / 1400);
      element.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1 && !countStill()) requestAnimationFrame(tick);
      else { element.textContent = String(target); element.removeAttribute('aria-hidden'); spoken.remove(); }
    };
    element.textContent = '0';
    requestAnimationFrame(tick);
  }), { threshold: .5 });
  counters.forEach(element => counter.observe(element));
}

/* Copy the email address (the address itself is always a mailto link). */
document.querySelectorAll<HTMLButtonElement>('[data-copy-email]').forEach(button => {
  if (!navigator.clipboard) return;
  button.hidden = false;
  const label = button.querySelector('[data-copy-label]');
  const status = button.parentElement?.querySelector('[data-copy-status]');
  button.addEventListener('click', async () => {
    const email = button.dataset.copyEmail ?? '';
    let ok = false;
    try { await Promise.race([navigator.clipboard.writeText(email), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))]); ok = true; } catch { ok = false; }
    if (label) label.textContent = ok ? 'Copied' : 'Copy failed';
    if (status) status.textContent = ok ? 'Email address copied.' : `Could not copy. The address is ${email}.`;
    window.setTimeout(() => { if (label) label.textContent = 'Copy'; }, 1800);
  });
});

/* Scroll-spy: in a [data-spy] navigation, the link whose section is in the
   middle of the screen gets data-active; the nav gets --spy-progress (0..1). */
document.querySelectorAll<HTMLElement>('[data-spy]').forEach(spy => {
  const links = [...spy.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  const targets = links.map(link => document.getElementById(decodeURIComponent(link.hash.slice(1)))).filter((el): el is HTMLElement => !!el);
  if (!targets.length || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const at = targets.indexOf(entry.target as HTMLElement);
    links.forEach((link, index) => link.toggleAttribute('data-active', index === at));
    spy.style.setProperty('--spy-progress', String(targets.length > 1 ? at / (targets.length - 1) : 1));
  }), { rootMargin: '-45% 0px -50% 0px' });
  targets.forEach(target => observer.observe(target));
});

/* Scrollytelling: a [data-scrolly] block gets data-at = the index of the
   [data-scrolly-step] crossing the middle of the screen, so a sticky visual
   can follow the story. Without JavaScript every step simply reads in order. */
document.querySelectorAll<HTMLElement>('[data-scrolly]').forEach(block => {
  const steps = [...block.querySelectorAll<HTMLElement>('[data-scrolly-step]')];
  if (!steps.length || !('IntersectionObserver' in window)) return;
  block.dataset.at = '0';
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const at = steps.indexOf(entry.target as HTMLElement);
    block.dataset.at = String(at);
    steps.forEach((step, index) => step.toggleAttribute('data-current', index === at));
  }), { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach(step => observer.observe(step));
});

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
