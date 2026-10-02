/* Concept-visual previews: play only while visible, never with reduced motion
   or data saving, and only for the active item inside a project pane. */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
const videos = [...document.querySelectorAll<HTMLVideoElement>('video[data-preview]')];
const visible = new Set<HTMLVideoElement>();

function evaluate(video: HTMLVideoElement) {
  const inactivePane = video.closest('[data-pane-item]:not([data-active])');
  const allowed = !reduce.matches && !saveData && visible.has(video) && !inactivePane && video.offsetParent !== null;
  if (allowed) {
    if (!video.getAttribute('src') && video.dataset.src) video.src = video.dataset.src;
    video.play().catch(() => {});
  } else if (!video.paused) video.pause();
}

videos.forEach(video => {
  video.addEventListener('playing', () => video.setAttribute('data-playing', ''));
  video.addEventListener('pause', () => video.removeAttribute('data-playing'));
  video.addEventListener('error', () => { video.removeAttribute('data-playing'); video.remove(); });
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
