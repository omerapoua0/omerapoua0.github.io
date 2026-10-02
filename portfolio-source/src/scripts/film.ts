/*
 * Hero film and motion switch.
 *
 * - Starts straight away (no waiting for the full page load) with one edition
 *   chosen per viewport: H.264 MP4 first for Safari/iOS, VP9 WebM fallback.
 *   Sources are created only when playback is wanted (WebKit can emit errors
 *   for empty sources).
 * - If autoplay is refused (iPhone Low Power Mode, browser policy), data saving
 *   is on, or the media fails, it switches to "stills mode": four chapter stills
 *   cross-fade with a slow pan-and-zoom, so the hero still moves. A tap on
 *   "Play the film" retries real playback with a user gesture.
 * - One "Pause motion" control pauses the film, stills, cycling line and ticker
 *   (html[data-motion="off"] + an `omar:motion` event). Reduced-motion visitors
 *   start with motion off and can opt in.
 * - Pauses offscreen and in hidden tabs. A chapter rail reflects and seeks.
 */
const root = document.documentElement;
const hero = document.querySelector<HTMLElement>('[data-film-hero]');
const video = hero?.querySelector<HTMLVideoElement>('[data-hero-video]');
const toggle = hero?.querySelector<HTMLButtonElement>('[data-film-toggle]');
const retry = hero?.querySelector<HTMLButtonElement>('[data-film-retry]');
const status = hero?.querySelector<HTMLElement>('[data-film-status]');
const rail = hero?.querySelector<HTMLElement>('[data-chapters]');
const DURATION = 20;

if (hero && video && toggle) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const mobile = window.matchMedia('(max-width: 720px)').matches;
  const chapters = [...(rail?.querySelectorAll<HTMLButtonElement>('[data-chapter]') ?? [])];
  const starts = chapters.map(button => Number(button.dataset.start) || 0);
  const stills = [...hero.querySelectorAll<HTMLImageElement>('[data-stills] img')];
  if (reduce.matches && !root.dataset.motion) root.dataset.motion = 'off';
  const motionOn = () => root.dataset.motion !== 'off';
  let inView = true;
  let loaded = false;
  let failed = false;
  let stillsMode = false;
  let stillsClock = 0;
  let stillsLast = 0;
  let frame = 0;

  const announce = (message: string) => { if (status) status.textContent = message; };
  const now = () => stillsMode ? stillsClock : video.currentTime;
  const activeChapter = (time: number) => starts.reduce((active, start, index) => time >= start ? index : active, 0);

  const paint = () => {
    const time = now();
    const active = activeChapter(time);
    chapters.forEach((button, index) => {
      const end = starts[index + 1] ?? DURATION;
      const progress = Math.min(1, Math.max(0, (time - starts[index]) / (end - starts[index])));
      button.style.setProperty('--p', index < active ? '1' : index === active ? progress.toFixed(3) : '0');
      if (index === active) button.setAttribute('aria-current', 'true'); else button.removeAttribute('aria-current');
    });
    if (stillsMode) stills.forEach((img, index) => img.toggleAttribute('data-active', index === active));
  };
  const running = () => stillsMode ? motionOn() && inView && !document.hidden : !video.paused;
  const loop = (time: number) => {
    if (stillsMode && running()) {
      if (stillsLast) stillsClock = (stillsClock + (time - stillsLast) / 1000) % DURATION;
      stillsLast = time;
    } else stillsLast = 0;
    paint();
    frame = running() ? requestAnimationFrame(loop) : 0;
  };
  const ensureLoop = () => { if (!frame) frame = requestAnimationFrame(loop); };

  const enterStills = (reason: 'blocked' | 'save-data' | 'error') => {
    if (!stillsMode) {
      stillsMode = true;
      stillsClock = video.currentTime || 0;
      video.pause();
      hero.dataset.filmStills = reason;
      hero.removeAttribute('data-film-ready');
      stills.forEach(img => { const src = mobile ? img.dataset.srcMobile : img.dataset.src; if (src && !img.getAttribute('src')) img.src = src; });
    }
    if (retry) retry.hidden = reason === 'error';
    paint();
    ensureLoop();
  };
  const exitStills = () => {
    stillsMode = false;
    hero.removeAttribute('data-film-stills');
    if (retry) retry.hidden = true;
  };

  const load = () => {
    if (loaded) return;
    loaded = true;
    const candidates = (mobile ? [[video.dataset.mobile, 'video/mp4'], [video.dataset.mobileWebm, 'video/webm']] : [[video.dataset.mp4, 'video/mp4'], [video.dataset.webm, 'video/webm']])
      .filter((entry): entry is [string, string] => !!entry[0]);
    let failures = 0;
    const fail = () => { failed = true; hero.dataset.filmError = 'true'; enterStills('error'); };
    if (!candidates.length) { fail(); return; }
    candidates.forEach(([url, type]) => {
      const source = document.createElement('source');
      source.src = url;
      source.type = type;
      source.addEventListener('error', () => { failures += 1; if (failures === candidates.length) fail(); });
      video.append(source);
    });
    video.muted = true;
    video.load();
  };

  const label = () => {
    const on = motionOn();
    const text = toggle.querySelector('[data-film-control]');
    if (text) text.textContent = on ? 'Pause motion' : 'Play motion';
    toggle.querySelector('[data-film-icon]')?.setAttribute('d', on ? 'M4 3h3v10H4zm5 0h3v10H9z' : 'M5 3l8 5-8 5z');
  };

  const tryVideo = async () => {
    load();
    if (failed) return false;
    video.muted = true;
    try { await video.play(); exitStills(); return true; }
    catch { return false; }
  };
  const play = async (explicit = false) => {
    if (!explicit && (!motionOn() || !inView || document.hidden)) return;
    if (failed) { enterStills('error'); return; }
    if (saveData && !explicit) { enterStills('save-data'); return; }
    if (stillsMode && !explicit) { ensureLoop(); return; }
    if (!(await tryVideo()) && !failed) enterStills('blocked');
  };

  const setMotion = (on: boolean) => {
    root.dataset.motion = on ? 'on' : 'off';
    window.dispatchEvent(new Event('omar:motion'));
    label();
  };

  toggle.addEventListener('click', () => {
    if (motionOn()) { setMotion(false); video.pause(); announce('Motion paused.'); }
    else { setMotion(true); void play(true); announce('Motion playing.'); }
    paint();
  });
  retry?.addEventListener('click', async () => {
    if (!motionOn()) setMotion(true);
    if (await tryVideo()) announce('Film playing.');
    else announce('Your phone is blocking video right now, for example in Low Power Mode. Showing film stills instead.');
  });

  chapters.forEach((button, index) => button.addEventListener('click', () => {
    if (stillsMode) { stillsClock = starts[index] + .05; paint(); return; }
    load();
    const seek = () => {
      video.currentTime = starts[index] + .05;
      hero.dataset.filmReady = 'true';
      paint();
      announce(`Chapter ${index + 1}: ${button.querySelector('.chapter__label')?.textContent ?? ''}.`);
    };
    if (video.readyState >= 1) seek(); else video.addEventListener('loadedmetadata', seek, { once: true });
    if (motionOn()) void play(true);
  }));

  video.addEventListener('playing', () => { hero.dataset.filmReady = 'true'; exitStills(); ensureLoop(); });
  video.addEventListener('pause', paint);
  video.addEventListener('seeked', paint);
  window.addEventListener('omar:motion', () => { if (!motionOn()) video.pause(); label(); });
  reduce.addEventListener('change', () => { if (reduce.matches) { setMotion(false); video.pause(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); else void play(); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) void play(); else video.pause();
    }, { threshold: .1 }).observe(hero);
  } else void play();
  label();
  paint();
}

export {};
