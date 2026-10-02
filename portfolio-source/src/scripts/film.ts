/*
 * Hero film. Retains the earlier proven behaviour: one edition chosen per
 * viewport before loading, sources created only when playback is wanted (WebKit can emit
 * errors for empty sources), visible pause/play, explicit pause persistence,
 * offscreen/hidden-tab pause and a poster for reduced motion, save-data, no JS
 * or failed media. Adds a chapter rail that reflects and seeks the film.
 */
const hero = document.querySelector<HTMLElement>('[data-film-hero]');
const video = hero?.querySelector<HTMLVideoElement>('[data-hero-video]');
const toggle = hero?.querySelector<HTMLButtonElement>('[data-film-toggle]');
const status = hero?.querySelector<HTMLElement>('[data-film-status]');
const rail = hero?.querySelector<HTMLElement>('[data-chapters]');

if (hero && video && toggle) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const mobile = window.matchMedia('(max-width: 720px)').matches;
  const chapters = [...(rail?.querySelectorAll<HTMLButtonElement>('[data-chapter]') ?? [])];
  const starts = chapters.map(button => Number(button.dataset.start) || 0);
  let explicitlyPaused = false;
  let inView = true;
  let loaded = false;
  let failed = false;
  let frame = 0;

  const announce = (message: string) => { if (status) status.textContent = message; };
  const fallback = () => {
    if (!loaded) return;
    failed = true;
    video.pause();
    hero.dataset.filmError = 'true';
    hero.removeAttribute('data-film-ready');
    toggle.hidden = true;
    if (rail) rail.hidden = true;
    announce('Showing the film still. Everything on the page is still available.');
  };

  // MP4 (H.264) stays first for Safari/iOS; VP9 WebM covers browsers without H.264.
  const load = () => {
    if (loaded) return;
    loaded = true;
    const candidates = (mobile ? [[video.dataset.mobile, 'video/mp4'], [video.dataset.mobileWebm, 'video/webm']] : [[video.dataset.mp4, 'video/mp4'], [video.dataset.webm, 'video/webm']])
      .filter((entry): entry is [string, string] => !!entry[0]);
    if (!candidates.length) { fallback(); return; }
    let failures = 0;
    candidates.forEach(([url, type]) => {
      const source = document.createElement('source');
      source.src = url;
      source.type = type;
      source.addEventListener('error', () => { failures += 1; if (failures === candidates.length) fallback(); });
      video.append(source);
    });
    video.load();
  };

  const paintChapters = () => {
    const duration = video.duration || 20;
    const time = video.currentTime;
    let active = 0;
    starts.forEach((start, index) => { if (time >= start) active = index; });
    chapters.forEach((button, index) => {
      const start = starts[index];
      const end = starts[index + 1] ?? duration;
      const progress = Math.min(1, Math.max(0, (time - start) / (end - start)));
      button.style.setProperty('--p', index < active ? '1' : index === active ? progress.toFixed(3) : '0');
      if (index === active) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
  };
  const tick = () => { paintChapters(); frame = video.paused ? 0 : requestAnimationFrame(tick); };

  const label = () => {
    const playing = !video.paused;
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', playing ? 'Pause hero film' : 'Play hero film');
    const text = toggle.querySelector('[data-film-control]');
    if (text) text.textContent = playing ? 'Pause film' : 'Play film';
    toggle.querySelector('[data-film-icon]')?.setAttribute('d', playing ? 'M4 3h3v10H4zm5 0h3v10H9z' : 'M5 3l8 5-8 5z');
    hero.dataset.filmPlaying = String(playing);
  };

  const play = async (explicit = false) => {
    if (failed) return;
    if (!explicit && (reduce.matches || connection?.saveData || explicitlyPaused || !inView || document.hidden)) return;
    load();
    try {
      await video.play();
      if (explicit) announce('Hero film playing.');
    } catch {
      if (explicit) announce('Playback is unavailable. You can still explore the portfolio.');
    }
    label();
  };

  paintChapters();

  toggle.addEventListener('click', () => {
    if (video.paused) { explicitlyPaused = false; void play(true); }
    else { explicitlyPaused = true; video.pause(); announce('Hero film paused.'); }
    label();
  });

  // Chapters seek the film. With reduced motion or a paused film they show that
  // chapter as a still frame instead of starting playback.
  chapters.forEach((button, index) => button.addEventListener('click', () => {
    if (failed) return;
    load();
    const seek = () => {
      video.currentTime = starts[index] + .05;
      hero.dataset.filmReady = 'true';
      paintChapters();
      announce(`Chapter ${index + 1}: ${button.textContent?.replace(/^0\d/, '').trim()}.`);
    };
    if (video.readyState >= 1) seek();
    else video.addEventListener('loadedmetadata', seek, { once: true });
    if (!explicitlyPaused && !reduce.matches) void play(true);
  }));

  video.addEventListener('playing', () => { hero.dataset.filmReady = 'true'; if (!frame) frame = requestAnimationFrame(tick); });
  video.addEventListener('play', label);
  video.addEventListener('pause', () => { label(); paintChapters(); });
  video.addEventListener('seeked', paintChapters);
  video.addEventListener('error', fallback);
  reduce.addEventListener('change', () => { if (reduce.matches) video.pause(); else void play(); label(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); else void play(); });

  // Start fetching the film only after the page has loaded, so it never
  // competes with the portrait, text and fonts for first-paint bandwidth.
  const start = () => {
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView) void play(); else video.pause();
      }, { threshold: .1 }).observe(hero);
    } else void play();
  };
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
  label();
}

export {};
