/*
 * Horizontal card sliders ([data-slider]): native scroll-snap (swipe works
 * without JS), plus arrows, a progress bar and a gentle auto-advance while
 * on screen. Auto-advance stops on hover, focus or touch, with reduced motion
 * and when motion is paused.
 */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

document.querySelectorAll<HTMLElement>('[data-slider]').forEach(slider => {
  const track = slider.querySelector<HTMLElement>('[data-slider-track]')!;
  const slides = [...slider.querySelectorAll<HTMLElement>('[data-slide]')];
  const progress = slider.querySelector<HTMLElement>('[data-slider-progress]');
  if (!track || !slides.length) return;
  let visible = false, held = false, timer = 0;
  const current = () => {
    const left = track.scrollLeft;
    let best = 0;
    slides.forEach((slide, index) => { if (Math.abs(slide.offsetLeft - track.offsetLeft - left) < Math.abs(slides[best].offsetLeft - track.offsetLeft - left)) best = index; });
    const atEnd = left + track.clientWidth >= track.scrollWidth - 4;
    return atEnd ? slides.length - 1 : best;
  };
  const go = (index: number) => {
    const target = slides[(index + slides.length) % slides.length];
    track.scrollTo({ left: target.offsetLeft - track.offsetLeft, behavior: reduce.matches ? 'auto' : 'smooth' });
  };
  const update = () => progress?.style.setProperty('--p', String((current() + 1) / slides.length));
  track.addEventListener('scroll', () => window.requestAnimationFrame(update), { passive: true });
  slider.querySelector('[data-slider-prev]')?.addEventListener('click', () => { held = true; go(current() - 1); });
  slider.querySelector('[data-slider-next]')?.addEventListener('click', () => { held = true; go(current() + 1); });

  const auto = () => {
    window.clearInterval(timer);
    if (visible && !held && !reduce.matches && root.dataset.motion !== 'off') timer = window.setInterval(() => go(current() + 1), 4500);
  };
  ['pointerenter', 'focusin', 'touchstart'].forEach(type => slider.addEventListener(type, () => { held = true; auto(); }, { passive: true }));
  slider.addEventListener('pointerleave', event => { if ((event as PointerEvent).pointerType === 'mouse') { held = false; auto(); } });
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; auto(); }, { threshold: .4 }).observe(slider);
  window.addEventListener('omar:motion', auto);
  update();
});

export {};
