/*
 * The neon light gate (LightGate.astro): every internal page change leaves
 * through light and the next page arrives out of it.
 *   - Doors, project cards and primary calls to action ([data-open]) play the
 *     full "hands together" open: red and blue neon seams meet, a cool-white
 *     burst fills the screen (or the robot's open clip plays, when it exists).
 *   - Other internal links play the quick variant: a dark veil and a scan line.
 *   - A door to a section of the same page (e.g. /index.html#skills on the
 *     homepage) opens, jumps there behind the white, then reveals.
 * Only once the overlay is opaque does the browser navigate. The arriving
 * page paints the identical layer at first paint (Base.astro head script
 * reads sessionStorage omar-gate {t, path, label, m}) and dissolves it.
 * The open starts where the visitor chose: the click point (or the centre of
 * the link, from the keyboard) becomes --gx/--gy for the hands, flare and
 * burst, and the robot in the hero (when on screen) flares (RobotStage
 * [data-opening]; the fallback orb snaps its rings shut).
 * Timing (full motion): leave ≈ 600 ms (hands 0–270, flare 220–440, burst
 * 260–550, then navigate); arrive: white dissolves 60–480 ms after first paint.
 * Reduced motion: a 160 ms fade out, a 200 ms fade in.
 * The robot's clip is fetched early, when a [data-open] link is hovered or
 * focused, so it can seek to the hands-together moment without a stall.
 * Links still work normally without JavaScript.
 */
type Mode = 'open' | 'quick';
const root = document.documentElement;
const gate = document.querySelector<HTMLElement>('[data-gate]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const still = () => reduce.matches;
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
async function layerDone(min: number, cap: number, layer = '.gate__white') {
  const white = gate?.querySelector<HTMLElement>(layer);
  await frames();
  const animations = white?.getAnimations?.() ?? [];
  await Promise.all([sleep(min), Promise.race([Promise.all(animations.map(animation => animation.finished.catch(() => undefined))), sleep(cap)])]);
}

const clip = () => gate?.querySelector<HTMLVideoElement>('[data-gate-clip]') ?? null;
/* The clip is only worth fetching on a fine pointer without Save-Data: on
   touch (iOS ignores preload) it would only ever be warmed by the tap itself
   and could never be ready in time. */
const saveData = () => !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
const coarse = window.matchMedia('(pointer: coarse)');
const clipAllowed = () => !saveData() && !coarse.matches;
const playOf = (video: HTMLVideoElement) => Number(video.dataset.play) || 1400;
const seekOf = (video: HTMLVideoElement) => Math.min(Number(video.dataset.seek) || 0, Math.max(0, (video.duration || 0) - playOf(video) / 1000 - .1));
/** Attach the clip's sources, load it and park it on the hands-together
 *  frame (once), so a door can play it the moment it is chosen. A source
 *  error (no codec) or a host that cannot seek marks it unusable. */
function warm() {
  const video = clip();
  if (!video || video.dataset.warm || !clipAllowed()) return;
  video.dataset.warm = '1';
  const sources = [...video.querySelectorAll<HTMLSourceElement>('source[data-src]')];
  // A <source> error can be a stale one from before the sources had a src
  // (resource selection reports a missing src as an error): only a video
  // left with no usable source at all has failed.
  const fail = () => window.setTimeout(() => { if (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) video.dataset.failed = ''; }, 0);
  sources.at(-1)?.addEventListener('error', fail);
  video.addEventListener('error', fail);
  video.addEventListener('loadedmetadata', () => {
    const seek = seekOf(video);
    if (seek <= 0) return;
    video.addEventListener('seeked', () => { if (Math.abs(video.currentTime - seek) > .15) video.dataset.failed = ''; }, { once: true });
    video.currentTime = seek;
  }, { once: true });
  sources.forEach(source => { if (!source.src) source.src = source.dataset.src!; });
  video.preload = 'auto';
  video.load();
}
/** The clip plays only when it is already buffered and parked on the right
 *  frame at click time; otherwise the CSS seams play straight away, so a
 *  slow network, a missing codec or a host without range requests never
 *  delays the door. */
function clipReady(video: HTMLVideoElement | null): video is HTMLVideoElement {
  if (!video || !clipAllowed() || video.dataset.failed !== undefined || video.readyState < 3 || video.seeking) return false;
  return Math.abs(video.currentTime - seekOf(video)) < .15;
}

/** Wait for the open animation, or the robot's clip, to reach full white.
 *  The clip plays from the palms-pressed moment for data-play ms, then the white
 *  takes over (and must be opaque before this returns); a failed play()
 *  falls back to the CSS seams. `start` is when data-state='open' was set. */
async function playOpen(start: number): Promise<void> {
  const video = clip();
  if (gate && clipReady(video)) {
    const length = playOf(video);
    gate.style.setProperty('--clip-white', `${length - 260}ms`);
    gate.dataset.clipOn = '';
    try {
      await Promise.race([video.play(), sleep(300).then(() => { throw new Error('slow'); })]);
      await layerDone(length, length + 600);
      return;
    } catch { video.pause(); gate.removeAttribute('data-clip-on'); }
  }
  await layerDone(Math.max(0, 550 - (performance.now() - start)), 850);
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
  root.removeAttribute('data-gate-mode');
  if (mode === 'open' && !still()) robot()?.setAttribute('data-opening', '');
  gate.dataset.state = mode;
  const layer = mode === 'quick' ? '.gate__dark' : '.gate__white';
  if (still()) await layerDone(160, 600, layer);
  else if (mode === 'open') await playOpen(performance.now());
  else await layerDone(300, 800, layer);

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

  try { sessionStorage.setItem('omar-gate', JSON.stringify({ t: Date.now(), path: url.pathname === '/' ? '/index.html' : url.pathname, label, m: mode })); } catch { /* storage unavailable */ }
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
  if (root.dataset.gate === 'in') window.setTimeout(() => { root.removeAttribute('data-gate'); root.removeAttribute('data-gate-mode'); }, 700);

  // Fetch the robot's clip early, when a full open is likely. The first
  // pointer movement opens a connection to the clip's host (a preconnect),
  // so the hover that follows can start fetching at once.
  const video = clip();
  if (video && clipAllowed() && !still()) {
    const host = new URL(video.querySelector<HTMLSourceElement>('source:last-of-type')?.dataset.src ?? '/', location.href).origin;
    if (host !== location.origin && !document.querySelector(`link[rel="preconnect"][href^="${host}"]`)) {
      addEventListener('pointermove', () => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = host;
        document.head.append(link);
      }, { once: true, passive: true });
    }
  }
  if (video) {
    const early = (event: Event) => { if ((event.target as Element | null)?.closest?.('a[data-open]') && !still()) warm(); };
    document.addEventListener('pointerover', early, { passive: true });
    document.addEventListener('focusin', early);
  }

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
