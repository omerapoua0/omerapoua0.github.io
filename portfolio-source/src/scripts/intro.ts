/*
 * The homepage intro (Intro.astro). The inline head script in index.astro
 * sets html[data-intro-on] before first paint when sessionStorage has no
 * `omar-intro` flag (first homepage view of the session); this script sets
 * the flag at once, runs the intro and removes it. Without the attribute
 * (later views, storage blocked, no JavaScript) the layer is removed or
 * never shown.
 *
 * Paths:
 * - full motion: ORB still → TRANSFORM clip (the orb becomes the robot) →
 *   LOOK clip from 0, cross-faded over the shared robot frame, paused at
 *   LOOK.hold (he looks at you) → he asks → "Yes": LOOK from LOOK.resume to
 *   LOOK.white (hands together, light, white) → the white hands over to the
 *   light gate (gate.ts reveal), which dissolves into the homepage while the
 *   hero staggers in.
 * - still: prefers-reduced-motion (Yes = a 200 ms fade), Save-Data or a
 *   2g/3g connection, a transform that has not started within 2.5 s, or a
 *   video error: no clips; the ROBOT still (or, if the CDN is unreachable,
 *   the dark HUD stage with the ring glow) and the question. Yes plays the
 *   gate's CSS open (hands, burst) and the same reveal. LOOK (5.7 MB) is
 *   fetched only once the transform plays on a fast connection, and if it
 *   is not playable when needed the still holds and Yes uses the CSS open.
 * - Skip intro / Esc: a 300 ms fade straight to the homepage.
 * The page underneath is inert while the intro shows and does not scroll;
 * at the end focus moves to <main>. Every picture is drawn into one canvas
 * (never an LCP candidate), each source with its measured framing
 * (src/data/robot.ts).
 * State for CSS/QA on [data-intro]: data-stage boot | transform | look |
 * ask | go | white, data-path video | still, data-asking, data-asked.
 */
import { cover, reveal } from './gate';

type Fit = { s: number; dx: number; dy: number };
type Src = { el: HTMLImageElement | HTMLVideoElement; fit: Fit };

const root = document.documentElement;
const intro = document.querySelector<HTMLElement>('[data-intro]');

if (intro && root.dataset.introOn === undefined) intro.remove();
else if (intro) run(intro);

function run(intro: HTMLElement) {
  try { sessionStorage.setItem('omar-intro', '1'); } catch { /* the head script already checked */ }
  const $ = <T extends Element>(selector: string) => intro.querySelector<T>(selector)!;
  const canvas = $<HTMLCanvasElement>('[data-intro-screen]');
  const ctx = canvas.getContext('2d');
  const orb = $<HTMLImageElement>('[data-intro-orb]');
  const still = $<HTMLImageElement>('[data-intro-still]');
  const transform = $<HTMLVideoElement>('[data-intro-transform]');
  const look = $<HTMLVideoElement>('[data-intro-look]');
  const yes = $<HTMLButtonElement>('[data-intro-yes]');
  const tiltEl = $<HTMLElement>('[data-intro-tilt]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const slow = !!connection?.saveData || /^(slow-2g|2g|3g)$/.test(connection?.effectiveType ?? '');
  const num = (el: HTMLElement, key: string, fallback: number) => Number(el.dataset[key]) || fallback;
  const fitOf = (el: HTMLElement): Fit => { try { return JSON.parse(el.dataset.fit || ''); } catch { return { s: 1, dx: 0, dy: 0 }; } };
  const HOLD = num(look, 'hold', 1.6), RESUME = num(look, 'resume', 2.3), WHITE = num(look, 'white', 4.6);
  const set = (key: string, value: string | null) => { if (value === null) delete intro.dataset[key]; else intro.dataset[key] = value; };
  const stage = (value: string) => set('stage', value);
  const status = (text: string) => { $<HTMLElement>('[data-intro-status]').textContent = text; };
  const timers: number[] = [];
  const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
  let done = false, lookReady = false;

  // The page underneath: inert, and it does not scroll while the intro shows.
  const inerted = [...document.body.children].filter((el): el is HTMLElement => el instanceof HTMLElement && el !== intro && !el.matches('[data-gate], script') && !el.inert);
  inerted.forEach(el => { el.inert = true; });
  const stop = (event: Event) => event.preventDefault();
  intro.addEventListener('wheel', stop, { passive: false });
  intro.addEventListener('touchmove', stop, { passive: false });
  const keys = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); skip(); return; }
    const control = (event.target as Element | null)?.closest?.('button, a');
    if (!control && [' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) event.preventDefault();
  };
  document.addEventListener('keydown', keys);

  /* ---------- the canvas: every picture is drawn here ---------- */
  const W = canvas.width, H = canvas.height;
  let cur: Src | null = null, prev: Src | null = null, fadeFrom = 0, fadeMs = 0, raf = 0;
  const ready = (el: Src['el']) => el instanceof HTMLVideoElement ? el.readyState >= 2 : el.complete && el.naturalWidth > 0;
  const draw = (src: Src, alpha: number) => {
    if (!ctx || !ready(src.el)) return false;
    const w = src.el instanceof HTMLVideoElement ? src.el.videoWidth : src.el.naturalWidth;
    const h = src.el instanceof HTMLVideoElement ? src.el.videoHeight : src.el.naturalHeight;
    const k = Math.max(W / w, H / h) * src.fit.s, dw = w * k, dh = h * k;
    ctx.globalAlpha = alpha;
    ctx.drawImage(src.el, (W - dw) / 2 + src.fit.dx, (H - dh) / 2 + src.fit.dy, dw, dh);
    return true;
  };
  const frame = (now: number) => {
    raf = 0;
    if (done || !ctx || !cur) return;
    const t = fadeMs ? Math.min(1, (now - fadeFrom) / fadeMs) : 1;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#040506';
    ctx.fillRect(0, 0, W, H);
    if (prev && t < 1) draw(prev, 1);
    if (!draw(cur, prev && t < 1 ? t : 1) && prev) draw(prev, 1);
    else if (t >= 1) prev = null;
    if (!intro.hasAttribute('data-drawn')) set('drawn', '');
    tick();
    if (prev || (cur.el instanceof HTMLVideoElement && !cur.el.paused)) raf = requestAnimationFrame(frame);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const show = (el: Src['el'], ms = 0) => {
    if (cur?.el === el) return kick();
    prev = ms && cur ? cur : null;
    cur = { el, fit: el === still ? { s: 1, dx: 0, dy: 0 } : fitOf(el) };
    fadeFrom = performance.now();
    fadeMs = ms;
    kick();
  };
  const onDecoded = (img: HTMLImageElement, fn: () => void) => {
    const go = () => { if (img.naturalWidth) void img.decode().then(fn, fn); };
    if (img.complete) go(); else img.addEventListener('load', go, { once: true });
  };

  /* ---------- video helpers ---------- */
  const attach = (video: HTMLVideoElement, preload: 'auto' | 'metadata') => {
    if (video.dataset.attached) return;
    video.dataset.attached = '';
    video.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach(source => { source.src = source.dataset.src!; });
    video.preload = preload;
    video.load();
  };
  /** A media error or no usable source (a stale "missing src" error from
   *  before the sources were attached does not count). */
  const onFail = (video: HTMLVideoElement, fn: () => void) => {
    const check = () => window.setTimeout(() => { if (video.dataset.attached !== undefined && (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE)) fn(); }, 0);
    video.addEventListener('error', check);
    video.querySelector('source:last-of-type')?.addEventListener('error', check);
  };

  /* ---------- per-frame checks (while a clip plays) ---------- */
  function tick() {
    if (intro.dataset.stage === 'look' && look.currentTime >= HOLD) { look.pause(); ask(); }
    else if (intro.dataset.stage === 'go' && (look.currentTime >= WHITE - .05 || look.ended)) whiteOut();
  }

  /* ---------- the stages ---------- */
  // Boot: the orb still (drawn as soon as it is decoded).
  onDecoded(orb, () => { if (!cur) show(orb); });

  /** No clips: the robot still (if it loads) and the question. */
  function stillPath() {
    if (done || intro.dataset.path === 'still' || intro.dataset.stage === 'ask') return;
    set('path', 'still');
    lookReady = false;
    transform.pause();
    look.pause();
    onDecoded(still, () => show(still, reduce ? 0 : 500));
    ask();
  }

  if (reduce || slow) stillPath();
  else {
    set('path', 'video');
    onFail(transform, stillPath);
    onFail(look, () => { lookReady = false; });
    const start = window.setTimeout(stillPath, 2500);
    transform.addEventListener('playing', () => {
      window.clearTimeout(start);
      if (intro.dataset.path !== 'video' || intro.dataset.stage !== 'boot') return;
      stage('transform');
      status('Assembling');
      show(transform);
      // LOOK is 5.7 MB: fetch it only now, and only on a fast connection.
      if (!slow) attach(look, 'auto');
    }, { once: true });
    transform.addEventListener('ended', () => {
      if (intro.dataset.path !== 'video') return;
      status('Online');
      if (look.readyState >= 3 && !look.error) {
        stage('look');
        look.currentTime = 0;
        look.play().then(() => { lookReady = true; show(look, 220); }, () => { show(still, 300); ask(); });
      } else {
        // LOOK is not playable yet: hold the robot (the transform ends on it).
        onDecoded(still, () => show(still, 300));
        ask();
      }
    });
    // A stall mid-transform: give it a moment, then the still path.
    transform.addEventListener('waiting', () => later(() => { if (intro.dataset.stage === 'transform' && transform.readyState < 3) stillPath(); }, 2500));
    attach(transform, 'auto');
    transform.play().catch(stillPath);
  }

  /* ---------- he asks ---------- */
  function ask() {
    if (done || intro.dataset.stage === 'ask') return;
    stage('ask');
    set('asking', '');
    const line = $<HTMLElement>('.intro__say-full').textContent ?? '';
    const typed = $<HTMLElement>('[data-intro-say]');
    const question = $<HTMLElement>('#intro-q').textContent?.replace(/ /g, ' ') ?? '';
    const asked = () => {
      if (done) return;
      typed.textContent = line;
      set('asked', '');
      $<HTMLElement>('[data-intro-live]').textContent = `${line} ${question}`;
      yes.focus({ preventScroll: true });
    };
    if (reduce) { asked(); return; }
    let i = 0;
    const type = () => {
      if (done) return;
      typed.textContent = line.slice(0, ++i);
      if (i < line.length) later(type, 34);
      else later(asked, 260);
    };
    later(type, 240);
  }

  // Pointer tilt while he waits (fine pointers, motion allowed).
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let tx = 0, ty = 0, x = 0, y = 0, spin = 0;
    const step = () => {
      x += (tx - x) * .08; y += (ty - y) * .08;
      tiltEl.style.setProperty('--ry', x.toFixed(3));
      tiltEl.style.setProperty('--rx', y.toFixed(3));
      spin = Math.abs(tx - x) + Math.abs(ty - y) > .01 && !done ? requestAnimationFrame(step) : 0;
    };
    intro.addEventListener('pointermove', event => {
      if (intro.dataset.stage !== 'ask') return;
      tx = (event.clientX / innerWidth - .5) * 8;
      ty = -(event.clientY / innerHeight - .5) * 5;
      if (!spin) spin = requestAnimationFrame(step);
    }, { passive: true });
  }

  /* ---------- Yes ---------- */
  yes.addEventListener('click', async () => {
    if (done || intro.dataset.stage === 'go' || intro.dataset.stage === 'white') return;
    if (reduce) { leave(200); return; }
    if (lookReady && intro.dataset.path === 'video' && !look.error) {
      stage('go');
      try { look.currentTime = RESUME; } catch { /* keeps playing from the hold */ }
      look.play().then(kick, () => void fallbackOpen());
      // Never wait on a stalled clip: white within the clip's length + 1.5 s.
      later(whiteOut, (WHITE - HOLD) * 1000 + 1500);
      return;
    }
    await fallbackOpen();
  });
  async function fallbackOpen() {
    if (done) return;
    stage('go');
    const box = yes.getBoundingClientRect();
    await cover({ x: box.left + box.width / 2, y: box.top + box.height / 2 }, 'The work');
    finish(true);
  }
  function whiteOut() {
    if (done || intro.dataset.stage === 'white') return;
    stage('white');
    later(() => finish(true), 230);
  }

  /* ---------- Skip ---------- */
  function skip() { leave(reduce ? 200 : 300); }
  function leave(ms: number) {
    if (done || intro.hasAttribute('data-leaving')) return;
    intro.style.transitionDuration = `${ms}ms`;
    set('leaving', '');
    later(() => finish(false), ms);
  }
  $<HTMLButtonElement>('[data-intro-skip]').addEventListener('click', skip);

  /** Hand over to the homepage: un-inert it, let the hero's entrance play,
   *  remove the intro, focus <main>. `light`: through the gate's white. */
  function finish(light: boolean) {
    if (done) return;
    done = true;
    timers.forEach(window.clearTimeout);
    cancelAnimationFrame(raf);
    document.removeEventListener('keydown', keys);
    if (light) void reveal('The work');
    inerted.forEach(el => { el.inert = false; });
    scrollTo(0, 0);
    delete root.dataset.introOn;
    [transform, look].forEach(video => video.pause());
    intro.remove();
    document.getElementById('main')?.focus({ preventScroll: true });
  }
}

export {};
