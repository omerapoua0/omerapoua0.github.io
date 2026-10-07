/*
 * The hero robot (RobotStage.astro): OA-01, Omar's robot. The homepage intro
 * (intro.ts) is its greeting on the first homepage view of a session; here,
 * in the hero, it stands in three-quarter profile (the ROBOT still) with a
 * breathing idle (CSS). On fine pointers it turns toward the pointer
 * (spring-smoothed 3D tilt) and a soft light follows the pointer across it;
 * touch gets a slow ambient sway (CSS). "Say hi to OA-01" plays the LOOK clip
 * from 0 to LOOK.hold (he turns his head and looks at you) and holds there;
 * pressing again cross-fades back to the still and plays it again.
 *
 * Nothing plays on its own, so neither the clip nor the third-party still
 * can become the page's Largest Contentful Paint (the still is painted into
 * a canvas; the clip only ever starts after a press, and LCP stops at the
 * first input). The clip is fetched only on the first press. A source error
 * (no H.264, CDN gone), a refused play() or a stall leaves the still in
 * place; the tilt, light and button keep working on it. If the still itself
 * failed (the orb fallback shows), a press only flashes the orb.
 *
 * State for CSS and QA on the stage: data-video "on" | "off" and data-greet
 * "still" | "playing" | "done" | "failed".
 */
const stage = document.querySelector<HTMLElement>('[data-robot-stage]');
const video = stage?.querySelector<HTMLVideoElement>('[data-robot-video]');

if (stage && video) {
  const tilt = stage.querySelector<HTMLElement>('[data-robot-tilt]');
  const hero = stage.closest<HTMLElement>('[data-hero]') ?? stage;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hold = Number(video.dataset.hold) || 1.6;
  const sources = [...video.querySelectorAll<HTMLSourceElement>('source[data-src]')];
  const set = (key: 'video' | 'greet', value: string) => { stage.dataset[key] = value; };

  // The still: painted into a canvas once decoded (see RobotStage.astro).
  const img = stage.querySelector<HTMLImageElement>('.robot__poster');
  const paint = () => {
    if (!img || stage.dataset.still || !img.naturalWidth) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.className = 'robot__still';
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.setAttribute('aria-hidden', 'true');
      canvas.getContext('2d')!.drawImage(img, 0, 0);
      img.after(canvas);
      void canvas.offsetWidth; // start the fade from 0
      stage.dataset.still = 'canvas';
    } catch { stage.dataset.still = 'img'; }
  };
  if (img) {
    if (img.complete && img.naturalWidth) void img.decode().then(paint, paint);
    else img.addEventListener('load', () => void img.decode().then(paint, paint), { once: true });
  }

  let attached = false, failed = false, stall = 0, swap = 0, watch = 0;
  set('video', 'off');
  set('greet', 'still');

  const attach = () => {
    if (attached) return;
    attached = true;
    sources.forEach(source => { source.src = source.dataset.src!; });
    video.preload = 'auto';
    video.load();
  };
  /** Back to the still. `hard`: the media cannot play here at all. */
  const fallBack = (hard: boolean) => {
    window.clearTimeout(stall);
    cancelAnimationFrame(watch);
    if (hard) failed = true;
    if (!video.paused) video.pause();
    set('video', 'off');
    set('greet', 'failed');
  };
  // With <source> children the error fires on the last source, not the
  // video. Before attach() the sources have no src, and the browser's
  // resource selection reports exactly that as an error (possibly late):
  // only a video left with no usable source, or a media error, has failed.
  const failHard = () => window.setTimeout(() => { if (attached && (video.error || video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE)) fallBack(true); }, 0);
  video.addEventListener('error', failHard);
  sources.at(-1)?.addEventListener('error', failHard);
  video.addEventListener('playing', () => { window.clearTimeout(stall); set('video', 'on'); set('greet', 'playing'); });
  const watchdog = (ms: number) => { window.clearTimeout(stall); stall = window.setTimeout(() => fallBack(false), ms); };
  video.addEventListener('waiting', () => { if (stage.dataset.greet === 'playing') watchdog(2500); });
  /** Pause on the frame where he looks at you, and hold it. */
  const holdAt = () => {
    cancelAnimationFrame(watch);
    const step = () => {
      if (video.currentTime >= hold || video.ended) {
        video.pause();
        window.clearTimeout(stall);
        set('greet', 'done');
        return;
      }
      watch = requestAnimationFrame(step);
    };
    watch = requestAnimationFrame(step);
  };

  /** Turn and look at you: LOOK from 0 to `hold`. A replay first cross-fades
   *  from the held frame to the still (LOOK's first frame), then plays. */
  const look = () => {
    if (failed || stage.dataset.poster === 'failed') return;
    if (stage.dataset.greet === 'playing' && !video.paused) return;
    attach();
    const start = () => {
      // Seek only when needed: a redundant seek can leave play() pending.
      if (video.currentTime > 0) { try { video.currentTime = 0; } catch { /* not seekable yet */ } }
      watchdog(8000);
      video.play().then(holdAt, () => fallBack(false));
    };
    window.clearTimeout(swap);
    if (stage.dataset.video === 'on') { set('video', 'off'); swap = window.setTimeout(start, 240); }
    else start();
  };

  // Say hi: he looks at you (also with reduced motion or Save-Data: the
  // visitor asked for it). A short neon flash acknowledges every press (the
  // orb flares instead when it stands in for the still).
  stage.querySelector('[data-robot-hi]')?.addEventListener('click', () => {
    stage.removeAttribute('data-hi');
    void stage.offsetWidth;
    stage.setAttribute('data-hi', '');
    window.setTimeout(() => stage.removeAttribute('data-hi'), 900);
    look();
  });

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

  // Pointer: turn toward it (fine pointers, no reduced motion). The stage's
  // box is cached (refreshed on resize and scroll), so a pointer move never
  // forces a layout; the handler only stores the pointer, and the rAF step
  // does the maths and the style writes.
  if (tilt && fine.matches) {
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
