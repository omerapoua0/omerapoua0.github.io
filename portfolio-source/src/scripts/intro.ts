/*
 * The homepage intro (Intro.astro). The inline head script in index.astro
 * sets html[data-intro-on] before first paint when sessionStorage has no
 * `omar-intro` flag (first homepage view of the session); this script sets
 * the flag at once, runs the intro and removes it. Without the attribute
 * (later views, storage blocked, no JavaScript) the layer is removed or
 * never shown.
 *
 * Paths:
 * - full motion: ORB still → TRANSFORM clip (the orb becomes Otto) → ASK
 *   clip (v9), cross-faded over the shared robot frame: he turns to you, the
 *   line "Hi — I'm Otto, Omar's robot." types out from ASK.say, and the
 *   question appears at ASK.question as his open hand presents it; he then
 *   holds on the clip's last frame, facing you → "Yes": a light flare, and
 *   under its peak a cut into LOOK at LOOK.resume (parked there while he waits), on to LOOK.white (hands
 *   together, light, white) → the white hands over to the light gate
 *   (gate.ts reveal), which dissolves into the homepage while the hero
 *   staggers in. Without a playable ASK (no URL yet, an error, not buffered
 *   when the transform ends): the v8 path, LOOK from 0 paused at LOOK.hold.
 * - lite (html[data-tier="lite"], Base.astro): no clips and no per-frame
 *   canvas drawing. The ORB and ROBOT stills are painted once each into two
 *   canvases; a CSS assemble (stage "assemble": clip reveal, scan line, ring
 *   glow) turns the orb into Otto; the question comes with a CSS light hint;
 *   Yes plays the gate's CSS open.
 * - still: prefers-reduced-motion (Yes = a 200 ms fade), Save-Data or a
 *   2g/3g connection, a transform that has not started within 2.5 s, or a
 *   video error: no clips; the ROBOT still (or, if the CDN is unreachable,
 *   the dark HUD stage with the ring glow) and the question. Yes plays the
 *   gate's CSS open (hands, burst) and the same reveal. LOOK (5.7 MB) is
 *   fetched only once the transform plays on a fast connection, and if it
 *   is not playable when needed the still holds and Yes uses the CSS open.
 * - Skip intro / Esc: a 300 ms fade straight to the homepage.
 * Voice (v10, scripts/voice.ts; opt-in with the Sound switch in the top
 * bar, default off): INTRO plays VOICE_AT (0.9 s) into ASK, or as the line
 * starts typing on the other paths, or at once if Sound is turned on while
 * he is already speaking/asking (once per intro); YES plays on "Yes" and
 * fades out over the gate once its words are over; Skip stops it. The text
 * on screen is the caption.
 * The page underneath is inert while the intro shows and does not scroll;
 * at the end focus moves to <main>. Every picture is drawn into one canvas
 * (never an LCP candidate), each source with its measured framing
 * (src/data/robot.ts).
 * State for CSS/QA on [data-intro]: data-stage boot | transform | assemble |
 * look | ask | go | white, data-path video | still | lite, data-clip ask |
 * look (the clip that brought him to the question), data-moving (ASK still
 * playing), data-asking (the speech box, from the first typed letter),
 * data-asked, data-flare up | down (Yes from ASK: the cut into LOOK).
 */
import { cover, reveal } from './gate';
import * as voice from './voice';

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
  const askClip = intro.querySelector<HTMLVideoElement>('[data-intro-ask]');
  const yes = $<HTMLButtonElement>('[data-intro-yes]');
  const tiltEl = $<HTMLElement>('[data-intro-tilt]');
  // let: a reduced-motion visitor who taps "Tap to wake Otto" has chosen the
  // motion (v9.1), so the rest of the intro then plays in full.
  let reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lite = root.dataset.tier === 'lite';
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const slow = !!connection?.saveData || /^(slow-2g|2g)$/.test(connection?.effectiveType ?? '');
  const num = (el: HTMLElement | null, key: string, fallback: number) => Number(el?.dataset[key]) || fallback;
  const fitOf = (el: HTMLElement): Fit => { try { return JSON.parse(el.dataset.fit || ''); } catch { return { s: 1, dx: 0, dy: 0 }; } };
  const HOLD = num(look, 'hold', 1.6), RESUME = num(look, 'resume', 2.3), WHITE = num(look, 'white', 4.6);
  const SAY = num(askClip, 'say', 1), QUESTION = num(askClip, 'question', 2.1), VOICE_AT = num(askClip, 'voiceAt', .9);
  const set = (key: string, value: string | null) => { if (value === null) delete intro.dataset[key]; else intro.dataset[key] = value; };
  const stage = (value: string) => set('stage', value);
  const status = (text: string) => { $<HTMLElement>('[data-intro-status]').textContent = text; };
  const timers: number[] = [];
  const later = (fn: () => void, ms: number) => { timers.push(window.setTimeout(fn, ms)); };
  let done = false, lookReady = false, askReady = false, spoken = false, answered = false;
  /** INTRO, once (only with Sound on). */
  const speak = () => { if (done || spoken || !voice.isOn()) return; spoken = true; void voice.play('intro'); };
  if (voice.isOn()) voice.prepare(['intro', 'yes']);
  voice.onChange(on => { if (on && (saying || hasAsked)) speak(); });

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

  // Portrait screens: the frame keeps his chin above the copy (Intro.astro
  // reads --talk-top). Only the intro is laid out here (main is unrendered).
  const talk = $<HTMLElement>('.intro__talk');
  const measureTalk = () => { if (!done) intro.style.setProperty('--talk-top', `${talk.offsetTop}px`); };
  measureTalk();
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(measureTalk); ro.observe(intro); ro.observe(talk); }

  /* ---------- the canvas: every picture is drawn here ---------- */
  const W = canvas.width, H = canvas.height;
  let cur: Src | null = null, prev: Src | null = null, fadeFrom = 0, fadeMs = 0, raf = 0;
  const ready = (el: Src['el']) => el instanceof HTMLVideoElement ? el.readyState >= 2 : el.complete && el.naturalWidth > 0;
  const draw = (src: Src, alpha: number, into = ctx) => {
    if (!into || !ready(src.el)) return false;
    const w = src.el instanceof HTMLVideoElement ? src.el.videoWidth : src.el.naturalWidth;
    const h = src.el instanceof HTMLVideoElement ? src.el.videoHeight : src.el.naturalHeight;
    const k = Math.max(W / w, H / h) * src.fit.s, dw = w * k, dh = h * k;
    into.globalAlpha = alpha;
    into.imageSmoothingQuality = 'high';
    into.drawImage(src.el, (W - dw) / 2 + src.fit.dx, (H - dh) / 2 + src.fit.dy, dw, dh);
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
  const attach = (video: HTMLVideoElement | null, preload: 'auto' | 'metadata') => {
    if (!video || video.dataset.attached !== undefined) return;
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
  const playable = (video: HTMLVideoElement | null): video is HTMLVideoElement => !!video && video.dataset.attached !== undefined && video.readyState >= 3 && !video.error;

  /* ---------- per-frame checks (while a clip plays) ---------- */
  function tick() {
    const at = intro.dataset.stage;
    if (at === 'look' && look.currentTime >= HOLD) { look.pause(); ask(); }
    else if (at === 'ask' && askClip && cur?.el === askClip) {
      if (askClip.currentTime >= VOICE_AT) speak();
      if (askClip.currentTime >= SAY) say();
      if (askClip.currentTime >= QUESTION) asked();
      if (askClip.ended || askClip.paused) set('moving', null);
    }
    else if (at === 'go' && (look.currentTime >= WHITE - .05 || look.ended)) whiteOut();
  }

  /* ---------- the stages ---------- */
  // (Declared before any path starts: a reduced-motion visitor is asked at once.)
  const line = $<HTMLElement>('.intro__say-full').textContent ?? '';
  const typed = $<HTMLElement>('[data-intro-say]');
  let saying = false, hasAsked = false;
  /** No clips: the robot still (if it loads) and the question. */
  function stillPath() {
    if (done || intro.dataset.path === 'still' || intro.dataset.stage === 'ask') return;
    set('path', 'still');
    lookReady = false;
    askReady = false;
    transform.pause();
    look.pause();
    askClip?.pause();
    onDecoded(still, () => show(still, reduce ? 0 : 500));
    ask();
  }

  /** Lite: each still painted once (canvas a: the orb, canvas b: Otto), and
   *  a CSS assemble between them. Never a per-frame draw. */
  function litePath() {
    set('path', 'lite');
    const canvasB = $<HTMLCanvasElement>('[data-intro-screen-b]');
    const paint = (into: HTMLCanvasElement, img: HTMLImageElement, fit: Fit) => {
      const c = into.getContext('2d');
      if (c && draw({ el: img, fit }, 1, c) && into === canvas) set('drawn', '');
    };
    onDecoded(orb, () => paint(canvas, orb, fitOf(orb)));
    let assembled = false;
    const assemble = () => {
      if (done || assembled) return;
      assembled = true;
      stage('assemble');
      status('Assembling');
      later(() => { status('Online'); ask(); }, 2100);
    };
    // A beat on the orb, then he assembles once his still is ready (or the
    // question comes on the dark HUD stage if the still never loads).
    later(() => onDecoded(still, () => { paint(canvasB, still, { s: 1, dx: 0, dy: 0 }); assemble(); }), 900);
    later(() => { if (!assembled) ask(); }, 4000);
  }

  // Boot: the orb still (drawn as soon as it is decoded).
  // v9.1: every tier gets the real transformation (the user's call: keep the
  // transition everywhere; lite only trims other effects). Only Save-Data /
  // 2g get the CSS assemble, and reduced motion the still.
  if (reduce || !slow) onDecoded(orb, () => { if (!cur) show(orb); });

  // Reduced motion (often switched on by Android power saving): no autoplay,
  // but the orb offers "Tap to wake Otto" (motion the visitor asks for); the
  // question still comes on its own after a few seconds.
  if (slow && !reduce) litePath();
  else if (reduce) wakeFirst();
  else videoPath();

  function wakeFirst() {
    const wake = $<HTMLButtonElement>('[data-intro-wake]');
    if (!wake) { stillPath(); return; }
    set('path', 'wake');
    wake.hidden = false;
    wake.style.display = '';
    set('wake', '');
    status('Tap to wake');
    const auto = window.setTimeout(() => { if (intro.dataset.path === 'wake') { wake.hidden = true; wake.style.display = 'none'; set('wake', null); stillPath(); } }, 6000);
    wake.addEventListener('click', () => {
      window.clearTimeout(auto);
      wake.hidden = true;
      wake.style.display = 'none';
      set('wake', null);
      reduce = false;
      videoPath();
    }, { once: true });
  }

  function videoPath() {
    set('path', 'video');
    onFail(transform, stillPath);
    onFail(look, () => { lookReady = false; });
    if (askClip) onFail(askClip, () => { askReady = false; });
    // Mobile networks can take a few seconds to start a 1 MB clip: wait on
    // the orb (status "Waking up") rather than giving up early.
    let start = window.setTimeout(stillPath, 8000);
    status('Waking up');
    transform.addEventListener('playing', () => {
      window.clearTimeout(start);
      if (intro.dataset.path !== 'video' || intro.dataset.stage !== 'boot') return;
      stage('transform');
      status('Assembling');
      show(transform);
      // ASK first (he asks with it), then LOOK (5.7 MB, for Yes) once ASK
      // plays; without ASK, LOOK straight away (v8).
      if (askClip) attach(askClip, 'auto'); else attach(look, 'auto');
    }, { once: true });
    askClip?.addEventListener('playing', () => attach(look, 'auto'), { once: true });
    // He holds on ASK's last frame, facing you (breathing resumes).
    askClip?.addEventListener('ended', () => { set('moving', null); asked(); kick(); });
    // While he waits, LOOK is parked on the frame Yes continues from.
    look.addEventListener('canplay', () => {
      if (intro.dataset.clip === 'ask' && intro.dataset.stage === 'ask' && look.paused && Math.abs(look.currentTime - RESUME) > .05) { try { look.currentTime = RESUME; } catch { /* not seekable yet */ } }
    });
    transform.addEventListener('ended', () => {
      if (intro.dataset.path !== 'video') return;
      status('Online');
      if (playable(askClip)) {
        set('clip', 'ask');
        askClip.currentTime = 0;
        askClip.play().then(() => {
          askReady = true;
          show(askClip, 220);
          ask(true);
          attach(look, 'auto');
        }, () => lookPath());
      } else lookPath();
    });
    // A stall mid-transform: give it a moment, then the still path.
    transform.addEventListener('waiting', () => later(() => { if (intro.dataset.stage === 'transform' && transform.readyState < 3) stillPath(); }, 5000));
    attach(transform, 'auto');
    // Autoplay can be refused (iOS Low Power Mode, some data savers): then a
    // tap on the orb wakes him (a user gesture always may play), instead of
    // dropping the transformation.
    const wake = $<HTMLButtonElement>('[data-intro-wake]');
    transform.play().catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'NotAllowedError') || !wake) { stillPath(); return; }
      window.clearTimeout(start);
      wake.hidden = false;
      wake.style.display = '';
      set('wake', '');
      status('Tap to wake');
      wake.addEventListener('click', () => {
        wake.hidden = true;
        wake.style.display = 'none';
        set('wake', null);
        status('Waking up');
        start = window.setTimeout(stillPath, 8000);
        transform.play().catch(stillPath);
        // Prime the next clips inside the same gesture so iOS lets them play.
        [askClip, look].forEach(video => { if (video) { video.muted = true; video.play().then(() => video.pause(), () => undefined); } });
      }, { once: true });
    });
  }

  /** v8: LOOK from 0, paused at HOLD (he looks at you), then he asks. */
  function lookPath() {
    if (done || intro.dataset.stage === 'ask' || intro.dataset.stage === 'look') return;
    set('clip', 'look');
    attach(look, 'auto');
    if (playable(look)) {
      stage('look');
      look.currentTime = 0;
      look.play().then(() => { lookReady = true; show(look, 220); }, () => { show(still, 300); ask(); });
    } else {
      // LOOK is not playable yet: hold the robot (the transform ends on it).
      onDecoded(still, () => show(still, 300));
      ask();
    }
  }

  /* ---------- he asks ---------- */
  /** `timed`: the ASK clip drives the line and the question (tick() at
   *  ASK.say / ASK.question, with timers as a safety net for a stall). */
  function ask(timed = false) {
    if (done || intro.dataset.stage === 'ask') return;
    stage('ask');
    // The speech box comes with the first typed letter (in the timed path,
    // at ASK.say), never as an empty box while he turns.
    if (!timed) set('asking', '');
    if (reduce) { asked(); return; }
    if (timed) {
      set('moving', '');
      later(say, SAY * 1000 + 700);
      later(asked, QUESTION * 1000 + 1200);
    } else later(say, 240);
  }
  function say() {
    if (done || saying || hasAsked) return;
    saying = true;
    set('asking', '');
    if (intro.dataset.clip !== 'ask' || intro.dataset.path !== 'video') speak();
    let i = 0;
    const type = () => {
      if (done || hasAsked) return;
      typed.textContent = line.slice(0, ++i);
      if (i < line.length) later(type, 34);
      else if (intro.dataset.clip !== 'ask' || intro.dataset.path !== 'video') later(asked, 260);
    };
    type();
  }
  function asked() {
    if (done || hasAsked) return;
    hasAsked = true;
    set('asking', '');
    speak();
    typed.textContent = line;
    set('asked', '');
    const question = $<HTMLElement>('#intro-q').textContent?.replace(/ /g, ' ') ?? '';
    $<HTMLElement>('[data-intro-live]').textContent = `${line} ${question}`;
    yes.focus({ preventScroll: true });
  }

  // Pointer tilt while he waits (fine pointers, motion allowed, full tier).
  if (!reduce && !lite && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
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
    answered = true;
    void voice.play('yes');
    if (reduce) { leave(200); return; }
    if (intro.dataset.path === 'video' && intro.dataset.clip === 'ask' && askReady && playable(look)) {
      // From ASK's last frame (facing you) into LOOK at RESUME. The two
      // poses differ (no LOOK frame matches ASK's end), so a cross-fade
      // would show two heads: instead a short light flare rises over him and
      // the clip cuts under its peak, then the flare falls away into LOOK
      // (hands up, palms together, white).
      stage('go');
      set('moving', null);
      set('flare', 'up');
      askClip?.pause();
      const peak = new Promise<void>(resolve => later(resolve, 150));
      const go = () => look.play().then(async () => { await peak; show(look); set('flare', 'down'); }, () => void fallbackOpen());
      if (Math.abs(look.currentTime - RESUME) > .05 || look.seeking) {
        look.addEventListener('seeked', go, { once: true });
        try { look.currentTime = RESUME; } catch { void fallbackOpen(); return; }
      } else go();
      later(whiteOut, (WHITE - RESUME) * 1000 + 2500);
      return;
    }
    if (lookReady && intro.dataset.path === 'video' && intro.dataset.clip === 'look' && !look.error) {
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
    // YES finishes its words over the gate, then fades; Skip is silent.
    if (answered) voice.release('yes', 700); else voice.stop();
    inerted.forEach(el => { el.inert = false; });
    scrollTo(0, 0);
    delete root.dataset.introOn;
    [transform, look, askClip].forEach(video => video?.pause());
    intro.remove();
    document.getElementById('main')?.focus({ preventScroll: true });
  }
}

export {};
