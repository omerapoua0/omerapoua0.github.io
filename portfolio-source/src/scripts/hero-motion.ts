/* Cycling "I build / I teach / I study" line and the portrait's pointer tilt.
   Both stop when motion is off (reduced motion or the hero's "Pause motion"),
   when the hero is offscreen and when the tab is hidden. */
const root = document.documentElement;
const hero = document.querySelector<HTMLElement>('[data-film-hero]');
const items = [...(hero?.querySelectorAll<HTMLElement>('[data-cycle] .cycle__item') ?? [])];
const motionOn = () => root.dataset.motion !== 'off';

if (hero && items.length > 1) {
  let index = 0;
  let timer = 0;
  let inView = true;
  const step = () => {
    const leaving = items[index];
    index = (index + 1) % items.length;
    items.forEach(item => item.classList.remove('is-leaving'));
    leaving.classList.remove('is-active');
    leaving.classList.add('is-leaving');
    items[index].classList.add('is-active');
  };
  const sync = () => {
    const run = motionOn() && inView && !document.hidden;
    if (run && !timer) timer = window.setInterval(step, 2600);
    if (!run && timer) { window.clearInterval(timer); timer = 0; }
  };
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }).observe(hero);
  window.addEventListener('omar:motion', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}

const tilt = hero?.querySelector<HTMLElement>('[data-tilt] .chero__portrait-card');
if (hero && tilt && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let frame = 0;
  hero.addEventListener('pointermove', event => {
    if (!motionOn() || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      const box = hero.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .5;
      const y = (event.clientY - box.top) / box.height - .5;
      tilt.style.setProperty('--rx', `${(x * 10).toFixed(2)}deg`);
      tilt.style.setProperty('--ry', `${(-y * 8).toFixed(2)}deg`);
    });
  });
  hero.addEventListener('pointerleave', () => { tilt.style.setProperty('--rx', '0deg'); tilt.style.setProperty('--ry', '0deg'); });
}

export {};
