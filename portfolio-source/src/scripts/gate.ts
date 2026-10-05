/*
 * The light gate (LightGate.astro): every internal page change leaves through
 * white light and the next page arrives out of it.
 *   - Doors, project cards and primary calls to action ([data-open]) play the
 *     full "hands together" open (or the robot's open clip when it exists).
 *   - Other internal links play the quick white rise.
 *   - A door to a section of the same page (e.g. /index.html#skills on the
 *     homepage) opens, jumps there behind the white, then reveals.
 * Only once the overlay is opaque does the browser navigate. The arriving
 * page paints the identical white at first paint (Base.astro head script
 * reads sessionStorage omar-gate {t, path, label}) and dissolves it.
 * The open starts where the visitor chose: the click point (or the centre of
 * the link, from the keyboard) becomes --gx/--gy for the hands, flare and
 * burst, and the robot in the hero (when on screen) snaps its rings shut and
 * flares (RobotStage [data-opening]).
 * Timing (full motion): leave ≈ 650 ms (hands 0–300, flare 260–460, burst
 * 300–600, then navigate); arrive: white dissolves 60–480 ms after first paint.
 * Reduced motion / Pause motion: a 160 ms fade out, a 200 ms fade in.
 * Links still work normally without JavaScript.
 */
type Mode = 'open' | 'quick';
const root = document.documentElement;
const gate = document.querySelector<HTMLElement>('[data-gate]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const still = () => reduce.matches || root.dataset.motion === 'off';
const sleep = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));
const frames = () => Promise.race([sleep(120), new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))]);

const names: Record<string, string> = {
  '/': 'Home', '/index.html': 'Home', '/work.html': 'Work', '/automations.html': 'Automations', '/research.html': 'Research',
  '/cv.html': 'About & CV', '/tutoring.html': 'Lessons', '/contact.html': 'Contact',
};
const labelFor = (url: URL, link?: Element | null) => {
  const own = link?.getAttribute('data-open');
  if (own) return own;
  if (url.hash === '#skills') return 'Skills';
  if (url.hash === '#lesson-enquiry') return 'Lessons';
  const tour = url.pathname.match(/^\/inside\/([\w-]+)/);
  if (tour) return tour[1].toUpperCase();
  return names[url.pathname] ?? 'Next page';
};
const samePath = (a: string, b: string) => (a === '/' ? '/index.html' : a) === (b === '/' ? '/index.html' : b);

let busy = false;

/** Resolve once the white layer's animation has finished (it is then fully
 *  opaque), never before `min` ms and never after `cap` ms. Waiting on the
 *  animation itself, not a timer, keeps slow first frames from navigating
 *  while the page is still showing through. */
async function whiteDone(min: number, cap: number) {
  const white = gate?.querySelector<HTMLElement>('.gate__white');
  await frames();
  const animations = white?.getAnimations?.() ?? [];
  await Promise.all([sleep(min), Promise.race([Promise.all(animations.map(animation => animation.finished.catch(() => undefined))), sleep(cap)])]);
}

/** Wait for the open animation, or the robot's clip, to reach full white. */
async function playOpen(): Promise<void> {
  const clip = gate?.querySelector<HTMLVideoElement>('[data-gate-clip]');
  if (clip && gate) {
    clip.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach(source => { if (!source.src) source.src = source.dataset.src!; });
    if (clip.readyState === 0) clip.load();
    try {
      await Promise.race([clip.play(), sleep(500).then(() => { throw new Error('slow'); })]);
      const length = Number.isFinite(clip.duration) && clip.duration > 0 ? Math.min(clip.duration * 1000, 1600) : 1300;
      gate.style.setProperty('--clip-white', `${Math.max(0, length - 260)}ms`);
      gate.dataset.clipOn = '';
      await sleep(length);
      return;
    } catch { clip.pause(); gate.removeAttribute('data-clip-on'); }
  }
  await whiteDone(600, 900);
}

const robot = () => document.querySelector<HTMLElement>('[data-robot-stage]');

/** Where the light starts: the pointer, else the link's centre, else the screen's. */
function origin(link?: Element | null, point?: { x: number; y: number }) {
  if (point && (point.x || point.y)) return point;
  const box = link?.getBoundingClientRect();
  if (box && box.width && box.bottom > 0 && box.top < innerHeight) return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  return { x: innerWidth / 2, y: innerHeight / 2 };
}

async function go(href: string, mode: Mode = 'quick', link?: Element | null, point?: { x: number; y: number }) {
  const url = new URL(href, location.href);
  if (!gate) { location.assign(url.href); return; }
  if (busy) return; // a double click or tap: the first navigation is already under way
  busy = true;
  const label = labelFor(url, link);
  const at = origin(link, point);
  gate.style.setProperty('--gate-label', JSON.stringify(label));
  gate.style.setProperty('--gx', `${Math.round(at.x)}px`);
  gate.style.setProperty('--gy', `${Math.round(at.y)}px`);
  gate.removeAttribute('data-clip-on');
  root.removeAttribute('data-gate');
  if (mode === 'open' && !still()) robot()?.setAttribute('data-opening', '');
  gate.dataset.state = mode;
  if (still()) await whiteDone(160, 600);
  else if (mode === 'open') await playOpen();
  else await whiteDone(300, 800);

  // Same page, different section: jump behind the white, then reveal.
  if (samePath(url.pathname, location.pathname) && url.search === location.search && url.hash) {
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    history.pushState(null, '', url.hash);
    target?.scrollIntoView({ behavior: 'instant' as ScrollBehavior, block: 'start' });
    if (target) { target.setAttribute('tabindex', target.getAttribute('tabindex') ?? '-1'); target.focus({ preventScroll: true }); }
    await frames();
    robot()?.removeAttribute('data-opening');
    gate.dataset.state = 'reveal';
    await sleep(still() ? 280 : 520);
    gate.removeAttribute('data-state');
    busy = false;
    return;
  }

  try { sessionStorage.setItem('omar-gate', JSON.stringify({ t: Date.now(), path: url.pathname === '/' ? '/index.html' : url.pathname, label })); } catch { /* storage unavailable */ }
  await frames(); // the opaque white is on screen before the page changes
  location.assign(url.href);
  // A download or a cancelled navigation must not leave the page white.
  window.setTimeout(() => { if (document.visibilityState === 'visible') { gate.removeAttribute('data-state'); robot()?.removeAttribute('data-opening'); busy = false; } }, 4000);
}

if (gate) {
  (window as Window & { __gate?: (href: string, mode?: Mode) => void }).__gate = (href: string, mode?: Mode) => void go(href, mode);

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
    if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download') || link.hasAttribute('data-no-gate')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
    if (!/(\.html|\/)$/.test(url.pathname)) return; // PDFs, text files and the like open normally
    const same = samePath(url.pathname, location.pathname) && url.search === location.search;
    const open = link.hasAttribute('data-open');
    if (same && (!url.hash || !open)) return; // in-page anchors scroll as usual
    event.preventDefault();
    void go(url.href, open ? 'open' : 'quick', link, event.detail ? { x: event.clientX, y: event.clientY } : undefined);
  });

  // Arrived through the gate: tidy up once the light has gone.
  if (root.dataset.gate === 'in') window.setTimeout(() => root.removeAttribute('data-gate'), 700);

  // Back/forward from the bfcache: never come back to a white page.
  addEventListener('pageshow', event => {
    if (!event.persisted) return;
    busy = false;
    robot()?.removeAttribute('data-opening');
    if (gate.dataset.state) {
      gate.dataset.state = 'reveal';
      window.setTimeout(() => gate.removeAttribute('data-state'), 520);
    }
  });
}

export {};
