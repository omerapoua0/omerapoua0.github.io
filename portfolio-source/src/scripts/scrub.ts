/*
 * Scroll scrub (see src/styles/neon.css): [data-scrub] elements expose --p
 * (0 → 1) as they cross the screen. Browsers with scroll-driven animations
 * do this in CSS; here is the IntersectionObserver + rAF fallback for the
 * rest. Reads happen in one pass, writes in the next, only for elements on
 * screen, and nothing runs with reduced motion or Pause motion.
 *
 * The range comes from CSS where a layout changes it: an element's
 * --scrub-mode custom property (e.g. the hero is 'exit' on phones, where it
 * is not pinned) wins over its data-scrub attribute, so this fallback always
 * matches the native scroll timeline.
 *
 * Also: the pinned horizontal gallery ([data-hgallery]) keeps keyboard
 * parity. When a card inside it takes focus while the gallery is pinned
 * (its track moves with the page scroll), the page scrolls to the point
 * where that card is in view. Only for keyboard focus: a mouse press on a
 * card also focuses it, and scrolling then would slide the card out from
 * under the pointer and swallow the click.
 */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const still = () => reduce.matches || root.dataset.motion === 'off';
const nativeScrub = typeof CSS !== 'undefined' && CSS.supports?.('animation-timeline: view()');
const clamp = (value: number) => Math.min(1, Math.max(0, value));

function progress(el: HTMLElement, mode: string, vh: number) {
  const box = el.getBoundingClientRect();
  if (mode === 'contain') return clamp(-box.top / Math.max(1, box.height - vh));
  if (mode === 'exit') return clamp(-box.top / Math.max(1, box.height));
  if (mode === 'entry') return clamp((vh - box.top) / Math.max(1, vh / 2 + box.height / 2));
  return clamp((vh - box.top) / Math.max(1, vh + box.height));
}

if (!nativeScrub && 'IntersectionObserver' in window) {
  const items = [...document.querySelectorAll<HTMLElement>('[data-scrub]')];
  const live = new Set<HTMLElement>();
  const modes = new Map<HTMLElement, string>();
  const readModes = () => items.forEach(el => modes.set(el, getComputedStyle(el).getPropertyValue('--scrub-mode').trim() || el.dataset.scrub || 'cover'));
  readModes();
  let frame = 0;
  const update = () => {
    frame = 0;
    if (still()) { items.forEach(el => el.style.removeProperty('--p')); return; }
    const vh = innerHeight;
    const values = [...live].map(el => [el, progress(el, modes.get(el) || 'cover', vh)] as const);
    values.forEach(([el, p]) => el.style.setProperty('--p', p.toFixed(4)));
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(update); };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? live.add(entry.target as HTMLElement) : live.delete(entry.target as HTMLElement));
    queue();
  });
  items.forEach(el => observer.observe(el));
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { readModes(); queue(); });
  addEventListener('omar:motion', queue);
}

/* Horizontal gallery: keyboard parity while pinned. */
document.querySelectorAll<HTMLElement>('[data-hgallery]').forEach(gallery => {
  const track = gallery.querySelector<HTMLElement>('[data-hgallery-track]');
  if (!track) return;
  let pointer = false;
  gallery.addEventListener('pointerdown', () => { pointer = true; }, { passive: true });
  addEventListener('pointerup', () => window.setTimeout(() => { pointer = false; }, 0), { passive: true });
  // overflow: clip on the sticky frame means it can never be scrolled, but a
  // scrollIntoView() in an older engine could still offset it: reset that.
  const sticky = track.parentElement;
  sticky?.addEventListener('scroll', () => { if (sticky.scrollLeft) sticky.scrollLeft = 0; }, { passive: true });
  gallery.addEventListener('focusin', event => {
    const target = event.target as Element;
    const card = target.closest<HTMLElement>('[data-hgallery-item]');
    if (!card || pointer || !target.matches(':focus-visible')) return;
    const pinned = getComputedStyle(gallery).getPropertyValue('--pinned').trim() === '1';
    if (!pinned) { card.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' as ScrollBehavior }); return; }
    // The track moves by p × (track width − viewport width) over the
    // gallery's pinned distance (its height − one screen).
    const travel = track.scrollWidth - innerWidth;
    const distance = gallery.offsetHeight - innerHeight;
    if (travel <= 0 || distance <= 0) return;
    const want = clamp((card.offsetLeft + card.offsetWidth / 2 - innerWidth / 2) / travel);
    const top = gallery.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + want * distance, behavior: 'instant' as ScrollBehavior });
  });
});

export {};
