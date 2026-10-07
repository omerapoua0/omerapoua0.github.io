/*
 * The hero robot (RobotStage.astro). It greets you: every time the homepage
 * opens (including through the light gate), on a bfcache restore and when
 * the hero comes back into view after leaving it, it plays the greet clip
 * once from 0 (turns its head to you and waves), then holds the last frame,
 * facing you, with a breathing idle (CSS). On fine pointers it turns toward
 * the pointer (spring-smoothed 3D tilt) and a soft light follows the pointer
 * across it; touch gets a slow ambient sway (CSS). The "Say hi to the robot"
 * button replays the wave.
 *
 * The clip is attached only after the page's load event (it never competes
 * with the first paint) and never autoplays with prefers-reduced-motion or
 * Save-Data: those visitors keep the poster, and the wave plays only when
 * they press the button. A source error (no H.264, CDN gone), a refused
 * play() or a stall leaves the poster in place; the tilt, light and button
 * keep working on the still.
 *
 * State for CSS and QA on the stage: data-video "on" | "off" (the video is
 * shown only while it has frames; the poster is its first frame, so the cut
 * is invisible) and data-greet "waiting" | "playing" | "done" | "still" |
 * "failed".
 */
const stage = document.querySelector<HTMLElement>('[data-robot-stage]');
const video = stage?.querySelector<HTMLVideoElement>('[data-robot-video]');

if (stage && video) {
  const tilt = stage.querySelector<HTMLElement>('[data-robot-tilt]');
  const hero = stage.closest<HTMLElement>('[data-hero]') ?? stage;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const auto = () => !reduce.matches && !saveData;
  const sources = [...video.querySelectorAll<HTMLSourceElement>('source[data-src]')];
  const set = (key: 'video' | 'greet', value: string) => { stage.dataset[key] = value; };

  let attached = false, failed = false, inView = true, left = false, pending = false, stall = 0, swap = 0;
  set('video', 'off');
  set('greet', auto() ? 'waiting' : 'still');

  const attach = () => {
    if (attached) return;
    attached = true;
    sources.forEach(source => { source.src = source.dataset.src!; });
    video.preload = 'auto';
    video.load();
  };
  /** Back to the poster. `hard`: the media cannot play here at all. */
  const fallBack = (hard: boolean) => {
    window.clearTimeout(stall);
    if (hard) failed = true;
    if (!video.paused) video.pause();
    set('video', 'off');
    set('greet', 'failed');
  };
  // With <source> children the error fires on the last source, not the
  // video. Before attach() the sources have no src, and the browser's
  // resource selection reports exactly that as an error: ignore it.
  const failHard = () => { if (attached) fallBack(true); };
  video.addEventListener('error', failHard);
  sources.at(-1)?.addEventListener('error', failHard);
  video.addEventListener('playing', () => { window.clearTimeout(stall); set('video', 'on'); set('greet', 'playing'); });
  // Ended: the video stays on screen, holding its last frame (facing you).
  video.addEventListener('ended', () => { window.clearTimeout(stall); set('greet', 'done'); });
  // A stall mid-wave: give it a moment, then show the poster again.
  const watchdog = (ms: number) => { window.clearTimeout(stall); stall = window.setTimeout(() => fallBack(false), ms); };
  video.addEventListener('waiting', () => { if (stage.dataset.greet === 'playing') watchdog(2500); });

  /** Play the greeting once from 0. A replay first cross-fades from the held
   *  last frame to the poster (the first frame), then plays. */
  const greet = (asked = false) => {
    if (failed || (!asked && !auto())) return;
    if (stage.dataset.greet === 'playing' && !video.paused && video.currentTime < (video.duration || 5) - 1) return;
    attach();
    const start = () => {
      // Seek only when needed: a redundant seek can leave play() pending.
      if (video.currentTime > 0) { try { video.currentTime = 0; } catch { /* not seekable yet */ } }
      watchdog(asked ? 8000 : 5000);
      video.play().catch(() => fallBack(false));
    };
    window.clearTimeout(swap);
    if (stage.dataset.video === 'on') { set('video', 'off'); swap = window.setTimeout(start, 240); }
    else start();
  };

  // First greeting: after load (never ahead of the page's own content), as
  // soon as the clip can play through, if the hero is still on screen.
  const begin = () => {
    if (!auto()) return;
    video.addEventListener('canplaythrough', () => { if (inView && document.visibilityState === 'visible') greet(); else pending = true; }, { once: true });
    attach();
  };
  const afterLoad = () => window.setTimeout(begin, 120);
  if (document.readyState === 'complete') afterLoad(); else addEventListener('load', afterLoad, { once: true });

  // Back on screen after leaving it: greet again.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      const entry = entries[entries.length - 1];
      inView = entry.intersectionRatio >= .35;
      if (!entry.isIntersecting) left = true;
      else if (inView && (left || pending) && attached) { left = false; pending = false; greet(); }
    }, { threshold: [0, .35] }).observe(stage);
  }
  // Restored from the back/forward cache: the page "opens" again.
  addEventListener('pageshow', event => { if (event.persisted) greet(); });

  // Say hi: replays the wave (also with reduced motion or Save-Data: the
  // visitor asked for it). A short neon flash acknowledges every press.
  stage.querySelector('[data-robot-hi]')?.addEventListener('click', () => {
    stage.removeAttribute('data-hi');
    void stage.offsetWidth;
    stage.setAttribute('data-hi', '');
    window.setTimeout(() => stage.removeAttribute('data-hi'), 900);
    greet(true);
  });

  // Pointer: turn toward it (fine pointers, no reduced motion).
  if (tilt && fine.matches) {
    const spring = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 };
    let raf = 0;
    const step = () => {
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
      if (event.pointerType !== 'mouse' || reduce.matches || !inView) return;
      const box = stage.getBoundingClientRect();
      // Relative to the robot's head (≈ 66% across, 28% down the frame).
      const nx = Math.max(-1, Math.min(1, (event.clientX - (box.left + box.width * .66)) / (innerWidth * .5)));
      const ny = Math.max(-1, Math.min(1, (event.clientY - (box.top + box.height * .28)) / (innerHeight * .6)));
      spring.tx = nx * 9;
      spring.ty = -ny * 5;
      stage.style.setProperty('--lx', `${(((event.clientX - box.left) / box.width) * 100).toFixed(1)}%`);
      stage.style.setProperty('--ly', `${(((event.clientY - box.top) / box.height) * 100).toFixed(1)}%`);
      stage.setAttribute('data-pointer', '');
      kick();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { spring.tx = 0; spring.ty = 0; stage.removeAttribute('data-pointer'); kick(); });
    reduce.addEventListener('change', () => { if (reduce.matches) { spring.tx = spring.ty = spring.x = spring.y = spring.vx = spring.vy = 0; step(); } });
  }
}

export {};
