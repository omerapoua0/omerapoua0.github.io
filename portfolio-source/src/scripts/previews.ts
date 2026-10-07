/* Concept-visual previews: play only while visible, never with reduced motion,
   data saving or on the lite tier (html[data-tier="lite"]: the poster image
   stays), and only for the active item inside a project pane. */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true || document.documentElement.dataset.tier === 'lite';
const videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-preview]')];
const visible = new Set<HTMLVideoElement>();

function evaluate(video: HTMLVideoElement) {
  const inactivePane = video.closest('[data-pane-item]:not([data-active])');
  const allowed = !reduce.matches && !saveData && visible.has(video) && !inactivePane && video.offsetParent !== null;
  if (allowed) {
    if (!video.getAttribute('src') && video.dataset.src) video.src = video.dataset.src;
    const sources = [...video.querySelectorAll<HTMLSourceElement>('source[data-src]')].filter(source => !source.getAttribute('src'));
    if (sources.length) { sources.forEach(source => { source.src = source.dataset.src!; }); video.load(); }
    video.play().catch(() => {});
  } else if (!video.paused) video.pause();
}

videos.forEach(video => {
  video.addEventListener('playing', () => video.setAttribute('data-playing', ''));
  video.addEventListener('pause', () => video.removeAttribute('data-playing'));
  // A browser that can play none of the sources: drop the video. If it had a
  // poster and nothing is drawn behind it, leave the poster as a still image.
  const fail = () => {
    if (!video.isConnected) return;
    const poster = video.getAttribute('poster');
    if (poster && !(video.previousElementSibling instanceof HTMLImageElement)) {
      const still = new Image();
      still.src = poster;
      still.alt = video.getAttribute('aria-label') ?? '';
      still.decoding = 'async';
      video.replaceWith(still);
    } else video.remove();
  };
  video.addEventListener('error', fail);
  // With <source> children the error fires on the last source, not the video.
  video.querySelector('source:last-of-type')?.addEventListener('error', fail);
});

if ('IntersectionObserver' in window && videos.length) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    const video = entry.target as HTMLVideoElement;
    if (entry.isIntersecting) visible.add(video); else visible.delete(video);
    evaluate(video);
  }), { threshold: .25 });
  videos.forEach(video => observer.observe(video));
}
document.addEventListener('previews:update', () => videos.forEach(evaluate));
reduce.addEventListener('change', () => videos.forEach(evaluate));

export {};
