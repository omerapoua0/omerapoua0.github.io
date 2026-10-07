/*
 * The hero robot (RobotStage.astro): Otto, Omar's robot. The homepage intro
 * (intro.ts) is his greeting on the first homepage view of a session; here,
 * in the hero, he stands in three-quarter profile (the ROBOT still) with a
 * breathing idle (CSS). On fine pointers he turns toward the pointer
 * (spring-smoothed 3D tilt) and a soft light follows the pointer across him;
 * touch gets a slow ambient sway (CSS).
 *
 * "Say hi to Otto" plays his next move, in turn (v9): WAVE (he waves hello),
 * HEART (a heart with his hands, glowing red), LOOK (from 0 to LOOK.hold: he
 * turns and looks at you, and holds there). WAVE and HEART end on the
 * three-quarter pose, so he cuts back to the still invisibly; a press after
 * LOOK cross-fades from the held frame to the still first. A move without a
 * clip (no URL), or one that failed, is skipped.
 *
 * Nothing plays on its own during load, so neither the clips nor the
 * third-party still can become the page's Largest Contentful Paint (the
 * still is painted into a canvas; a clip only ever starts after a press, and
 * LCP stops at the first input). Clips are fetched on intent only: hovering,
 * focusing or pressing Otto with a mouse or pen prefetches his next move
 * (preload="auto"; on touch only the tap fetches it, as a finger landing on
 * him may be a scroll), and a real press warms the move after it (the idle
 * wave does not); on the lite tier (html[data-tier="lite"]) only the tap
 * itself fetches a clip.
 * One idle surprise on capable devices: after ~20 s of the hero in view with
 * no input, he waves once (never on lite, reduced motion or Save-Data, never
 * during the intro, at most once per page view, not after a press).
 * A source error (no H.264, CDN gone), a refused play() or a stall leaves
 * the still in place; the tilt, light and button keep working on it. If the
 * still itself failed (the orb fallback shows), a press only flashes the orb.
 *
 * Voice (v10, scripts/voice.ts; the Sound switch, default off): with Sound
 * on, a press that plays WAVE says HELLO and HEART says THANKS (LOOK: no
 * line; never two lines at once; the idle wave stays silent), and the line
 * shows as a caption bubble by his head for its length (aria-live), even if
 * the audio fails.
 *
 * State for CSS and QA on the stage: data-video "on" | "off", data-greet
 * "still" | "playing" | "done" | "failed", data-move (the clip on screen or
 * last played: wave | heart | look), data-moves (the cycle, e.g.
 * "wave heart look"); on each video: data-on while shown.
 */
import * as voice from './voice';

const stage = document.querySelector<HTMLElement>('[data-robot-stage]');
const all = stage ? [...stage.querySelectorAll<HTMLVideoElement>('[data-robot-video]')] : [];

if (stage && all.length) {
  const root = document.documentElement;
  const lite = root.dataset.tier === 'lite';
  const tilt = stage.querySelector<HTMLElement>('[data-robot-tilt]');
  const hero = stage.closest<HTMLElement>('[data-hero]') ?? stage;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const saveData = !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  const said = stage.querySelector<HTMLElement>('[data-robot-said]');
  const set = (key: 'video' | 'greet' | 'move' | 'moves', value: string) => { stage.dataset[key] = value; };
  const caption = stage.querySelector<HTMLElement>('[data-robot-caption]');
  const voiced: Record<string, voice.Line> = { wave: 'hello', heart: 'thanks' };
  let captionTimer = 0;
  const hideCaption = () => { window.clearTimeout(captionTimer); caption?.removeAttribute('data-show'); captionTimer = window.setTimeout(() => { if (caption) caption.textContent = ''; }, 300); };
  /** With Sound on: his line for this move, and its caption. */
  const speak = (name: string) => {
    const line = voiced[name];
    if (!voice.isOn() || !line) { voice.stop(); return; }
    const meta = voice.info(line);
    void voice.play(line);
    if (!caption || !meta) return;
    window.clearTimeout(captionTimer);
    caption.textContent = meta.text;
    caption.setAttribute('data-show', '');
    captionTimer = window.setTimeout(hideCaption, meta.duration * 1000);
  };
  voice.onChange(on => { if (!on) hideCaption(); });
  const lines: Record<string, string> = { wave: 'Otto waves hello.', heart: 'Otto makes a heart with his hands.', look: 'Otto turns and looks at you.' };

  // The still: painted into a canvas once decoded (see RobotStage.astro).
  const img = stage.querySelector<HTMLImageElement>('.robot__poster');
  let painted = false;
  const paint = () => {
    if (!img || painted || stage.dataset.still || !img.naturalWidth) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.className = 'robot__still';
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.setAttribute('aria-hidden', 'true');
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      img.after(canvas);
      painted = true;
      // Start the fade from 0 two frames on (no forced layout: behind the
      // intro the whole homepage is unrendered, and a synchronous layout
      // read here would lay it all out in one long task).
      requestAnimationFrame(() => requestAnimationFrame(() => { stage.dataset.still = 'canvas'; }));
    } catch { stage.dataset.still = 'img'; }
  };
  if (img) {
    if (img.complete && img.naturalWidth) void img.decode().then(paint, paint);
    else img.addEventListener('load', () => void img.decode().then(paint, paint), { once: true });
  }

  /* ---------- the moves ---------- */
  type Move = { name: string; video: HTMLVideoElement; hold: number; attached: boolean; failed: boolean };
  const moves: Move[] = ['heart', 'wave', 'look']
    .map(name => all.find(video => video.dataset.robotVideo === name))
    .filter((video): video is HTMLVideoElement => !!video)
    .map(video => ({ name: video.dataset.robotVideo!, video, hold: Number(video.dataset.hold) || 0, attached: false, failed: false }));
  let turn = 0, current: Move | null = null, stall = 0, swap = 0, watch = 0, pressed = false;
  const usable = () => moves.filter(move => !move.failed);
  /** The move the next press plays (skipping failed ones). */
  const upcoming = () => { const list = usable(); return list.length ? list[turn % list.length] : null; };
  set('video', 'off');
  set('greet', 'still');
  set('moves', moves.map(move => move.name).join(' '));

  const attach = (move: Move | null) => {
    if (!move || move.attached) return;
    move.attached = true;
    move.video.querySelectorAll<HTMLSourceElement>('source[data-src]').forEach(source => { source.src = source.dataset.src!; });
    move.video.preload = 'auto';
    move.video.load();
  };
  /** Back to the still. `hard`: this clip cannot play here at all. */
  const fallBack = (move: Move, hard: boolean) => {
    window.clearTimeout(stall);
    cancelAnimationFrame(watch);
    if (hard) move.failed = true;
    if (!move.video.paused) move.video.pause();
    move.video.removeAttribute('data-on');
    if (current === move) { current = null; set('video', 'off'); set('greet', 'failed'); }
  };
  const watchdog = (move: Move, ms: number) => { window.clearTimeout(stall); stall = window.setTimeout(() => fallBack(move, false), ms); };
  moves.forEach(move => {
    const { video } = move;
    // With <source> children the error fires on the last source, not the
    // video. Before attach() the sources have no src, and the browser's
    // resource selection reports exactly that as an error (possibly late):
    // only a video left with no usable source, or a media error, has failed.
    const failHard = () => window.setTimeout(() => { if (move.attached && (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE)) fallBack(move, true); }, 0);
    video.addEventListener('error', failHard);
    video.querySelector('source:last-of-type')?.addEventListener('error', failHard);
    video.addEventListener('playing', () => {
      if (current !== move) return;
      window.clearTimeout(stall);
      video.setAttribute('data-on', '');
      set('video', 'on');
      set('greet', 'playing');
    });
    video.addEventListener('waiting', () => { if (current === move && stage.dataset.greet === 'playing') watchdog(move, 2500); });
    // WAVE and HEART end on the three-quarter pose: back to the still.
    video.addEventListener('ended', () => {
      if (current !== move || move.hold) return;
      window.clearTimeout(stall);
      set('greet', 'done');
      video.removeAttribute('data-on');
      set('video', 'off');
    });
  });
  /** LOOK: pause on the frame where he looks at you, and hold it. */
  const holdAt = (move: Move) => {
    cancelAnimationFrame(watch);
    const step = () => {
      if (current !== move) return;
      if (move.video.currentTime >= move.hold || move.video.ended) {
        move.video.pause();
        window.clearTimeout(stall);
        set('greet', 'done');
        return;
      }
      watch = requestAnimationFrame(step);
    };
    watch = requestAnimationFrame(step);
  };

  /** Play the next move. A held LOOK frame first cross-fades to the still. */
  const play = (fromUser = false) => {
    if (stage.dataset.poster === 'failed') return;
    if (current && stage.dataset.greet === 'playing' && !current.video.paused) return; // let him finish
    const move = upcoming();
    if (!move) return;
    turn++;
    attach(move);
    const previous = current;
    current = move;
    set('move', move.name);
    if (said) said.textContent = lines[move.name] ?? '';
    if (fromUser) speak(move.name);
    const start = () => {
      if (current !== move) return;
      const { video } = move;
      // Seek only when needed: a redundant seek can leave play() pending.
      if (video.currentTime > 0) { try { video.currentTime = 0; } catch { /* not seekable yet */ } }
      watchdog(move, 8000);
      video.play().then(() => { if (move.hold) holdAt(move); }, () => fallBack(move, false));
    };
    window.clearTimeout(swap);
    if (previous && previous.video.hasAttribute('data-on')) {
      previous.video.removeAttribute('data-on');
      if (!previous.video.paused) previous.video.pause();
      set('video', 'off');
      swap = window.setTimeout(start, 240);
    } else start();
    // Fetch the one after this, so a second press is ready (not on lite, and
    // only after a real press: the idle wave never pulls a second clip).
    if (!lite && fromUser) window.setTimeout(() => { if (current === move) attach(upcoming()); }, 1500);
  };

  // Say hi: his next move (also with reduced motion or Save-Data: the
  // visitor asked for it). A short neon flash acknowledges every press (the
  // orb flares instead when it stands in for the still).
  const hit = stage.querySelector<HTMLElement>('[data-robot-hi]');
  hit?.addEventListener('click', () => {
    pressed = true;
    stage.removeAttribute('data-hi');
    void stage.offsetWidth;
    stage.setAttribute('data-hi', '');
    window.setTimeout(() => stage.removeAttribute('data-hi'), 900);
    play(true);
  });
  // Intent: hovering, focusing or pressing Otto fetches his next move.
  if (hit && !lite) {
    const intent = () => { if (stage.dataset.poster !== 'failed' && (!saveData || pressed)) attach(upcoming()); };
    // Mouse and pen only: a finger that lands on him may just be starting a
    // scroll (touch fires pointerenter and pointerdown too); a tap fetches
    // the clip itself, in play().
    const pointerIntent = (event: PointerEvent) => { if (event.pointerType !== 'touch') intent(); };
    hit.addEventListener('pointerenter', pointerIntent, { passive: true });
    hit.addEventListener('pointerdown', pointerIntent, { passive: true });
    hit.addEventListener('focus', intent);
  }

  // v9.1: his heart is the first move. He greets you with it once the intro
  // hands over to the homepage, and (once per page view) after ~12 s with
  // the hero in view and no input — on every tier, never with reduced
  // motion or Save-Data.
  const wave = moves[0];
  let greeted = false;
  if (wave && !saveData && !reduce.matches) {
    const greet = () => {
      if (greeted || pressed || stage.dataset.poster === 'failed' || wave.failed || upcoming() !== wave) return;
      greeted = true;
      attach(wave);
      window.setTimeout(() => { if (!pressed && !document.hidden) play(); }, 1400);
    };
    if (root.dataset.introOn !== undefined) {
      attach(wave);
      new MutationObserver((_, observer) => { if (root.dataset.introOn === undefined) { observer.disconnect(); greet(); } }).observe(root, { attributes: true, attributeFilter: ['data-intro-on'] });
    }
  }
  if (wave && !saveData && !reduce.matches && 'IntersectionObserver' in window) {
    let visible = false, idle = 0, spent = false;
    const arm = () => {
      window.clearTimeout(idle);
      if (spent || pressed || !visible || document.hidden) return;
      idle = window.setTimeout(() => {
        if (spent || greeted || pressed || !visible || document.hidden || reduce.matches || root.dataset.introOn !== undefined || stage.dataset.poster === 'failed' || wave.failed) return;
        if (current && !current.video.paused) return;
        spent = true;
        if (upcoming() !== wave) return; // only as his first move
        play();
      }, 12000);
    };
    new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); arm(); }, { threshold: .4 }).observe(stage);
    for (const type of ['pointermove', 'pointerdown', 'keydown', 'scroll', 'wheel', 'touchstart']) addEventListener(type, arm, { passive: true });
    document.addEventListener('visibilitychange', arm);
  }

  // Replay the homepage intro (intro.ts): clear its session flag and reload.
  const replay = stage.querySelector<HTMLButtonElement>('[data-intro-replay]');
  if (replay) {
    replay.hidden = false;
    replay.addEventListener('click', () => {
      try { sessionStorage.removeItem('omar-intro'); } catch { /* storage blocked: the intro cannot run */ }
      scrollTo(0, 0);
      location.reload();
    });
  }

  // Pointer: turn toward it (fine pointers, no reduced motion, full tier).
  // The stage's box is cached (refreshed on resize and scroll), so a pointer
  // move never forces a layout; the handler only stores the pointer, and the
  // rAF step does the maths and the style writes.
  if (tilt && fine.matches && !lite) {
    const spring = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
    let raf = 0, box: DOMRect | null = null, pointer: { x: number; y: number } | null = null, over = false;
    const measure = () => { box = null; };
    addEventListener('resize', measure, { passive: true });
    addEventListener('scroll', measure, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(stage);
    const step = () => {
      if (pointer) {
        box ??= stage.getBoundingClientRect();
        // Relative to the robot's head (≈ 62% across, 28% down the frame).
        const nx = Math.max(-1, Math.min(1, (pointer.x - (box.left + box.width * .62)) / (innerWidth * .5)));
        const ny = Math.max(-1, Math.min(1, (pointer.y - (box.top + box.height * .28)) / (innerHeight * .6)));
        spring.tx = nx * 9;
        spring.ty = -ny * 5;
        stage.style.setProperty('--lx', `${(((pointer.x - box.left) / box.width) * 100).toFixed(1)}%`);
        stage.style.setProperty('--ly', `${(((pointer.y - box.top) / box.height) * 100).toFixed(1)}%`);
        pointer = null;
      }
      for (const [p, v, t] of [['x', 'vx', 'tx'], ['y', 'vy', 'ty']] as const) {
        spring[v] = (spring[v] + (spring[t] - spring[p]) * .06) * .82;
        spring[p] += spring[v];
      }
      tilt.style.setProperty('--ry', spring.x.toFixed(3));
      tilt.style.setProperty('--rx', spring.y.toFixed(3));
      const settled = Math.abs(spring.vx) + Math.abs(spring.vy) < .002 && Math.abs(spring.tx - spring.x) + Math.abs(spring.ty - spring.y) < .01;
      raf = settled ? 0 : requestAnimationFrame(step);
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(step); };
    hero.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reduce.matches) return;
      pointer = { x: event.clientX, y: event.clientY };
      if (!over) { over = true; stage.setAttribute('data-pointer', ''); }
      kick();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { pointer = null; spring.tx = 0; spring.ty = 0; over = false; stage.removeAttribute('data-pointer'); kick(); });
    reduce.addEventListener('change', () => { if (reduce.matches) { spring.tx = spring.ty = spring.x = spring.y = spring.vx = spring.vy = 0; step(); } });
  }
}

export {};
