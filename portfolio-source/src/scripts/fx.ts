/*
 * Small site-wide motion: 3D tilt toward the pointer on [data-tilt] cards
 * (fine pointers only), magnetic buttons ([data-magnetic]), a cursor-follow
 * highlight ([data-glow] reads --gx/--gy), pointer parallax on heroes
 * ([data-pointer-parallax] sets --mx/--my), and scroll velocity fed to the
 * marquee bands so they lean and speed up as you scroll. All of it stops
 * with reduced motion, and none of it runs on the lite tier
 * (html[data-tier="lite"], Base.astro).
 *
 * Pointer handlers never read layout: each element's box is measured once
 * when the pointer enters it (and again after a scroll or resize), and the
 * style writes happen in one rAF per frame.
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const still = () => reduce.matches;
const lite = document.documentElement.dataset.tier === 'lite';
const pointerFx = !lite && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* Cached boxes, dropped on scroll/resize (the pointer may stay put while the
   page moves under it). */
let epoch = 0;
addEventListener('scroll', () => { epoch++; }, { passive: true });
addEventListener('resize', () => { epoch++; }, { passive: true });
const boxes = new WeakMap<Element, { box: DOMRect; epoch: number }>();
const boxOf = (el: Element) => {
  const hit = boxes.get(el);
  if (hit && hit.epoch === epoch) return hit.box;
  const box = el.getBoundingClientRect();
  boxes.set(el, { box, epoch });
  return box;
};
/** Run `write` for `el` once per frame, with the latest pointer event. */
const pending = new Map<Element, () => void>();
let frame = 0;
const flush = () => { frame = 0; const jobs = [...pending.values()]; pending.clear(); jobs.forEach(job => job()); };
const schedule = (el: Element, job: () => void) => { pending.set(el, job); if (!frame) frame = requestAnimationFrame(flush); };

if (pointerFx) {
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach(card => {
    card.addEventListener('pointerenter', () => boxes.delete(card), { passive: true });
    card.addEventListener('pointermove', event => {
      if (still()) return;
      const { clientX, clientY } = event;
      schedule(card, () => {
        const box = boxOf(card);
        const x = (clientX - box.left) / box.width - .5, y = (clientY - box.top) / box.height - .5;
        card.style.setProperty('--tilt-x', `${(-y * 7).toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${(x * 9).toFixed(2)}deg`);
        card.style.setProperty('--glare-x', `${((x + .5) * 100).toFixed(1)}%`);
        card.style.setProperty('--glare-y', `${((y + .5) * 100).toFixed(1)}%`);
        card.setAttribute('data-tilting', '');
      });
    }, { passive: true });
    card.addEventListener('pointerleave', () => { pending.delete(card); card.removeAttribute('data-tilting'); card.style.removeProperty('--tilt-x'); card.style.removeProperty('--tilt-y'); });
  });

  /* Magnetic buttons: drift up to 8px toward the pointer. The box is the
     one measured on entry (before any drift), so the pull never feeds back. */
  document.querySelectorAll<HTMLElement>('[data-magnetic], .btn').forEach(button => {
    button.addEventListener('pointerenter', () => boxes.delete(button), { passive: true });
    button.addEventListener('pointermove', event => {
      if (still()) return;
      const { clientX, clientY } = event;
      schedule(button, () => {
        const box = boxOf(button);
        const dx = (clientX - box.left - box.width / 2) / (box.width / 2);
        const dy = (clientY - box.top - box.height / 2) / (box.height / 2);
        button.style.translate = `${(dx * 8).toFixed(1)}px ${(dy * 6).toFixed(1)}px`;
      });
    }, { passive: true });
    button.addEventListener('pointerleave', () => { pending.delete(button); button.style.translate = ''; });
  });

  /* Cursor-follow highlight. */
  document.querySelectorAll<HTMLElement>('[data-glow]').forEach(card => {
    card.addEventListener('pointerenter', () => boxes.delete(card), { passive: true });
    card.addEventListener('pointermove', event => {
      const { clientX, clientY } = event;
      // A different key from the tilt (the same card may do both).
      schedule(card.firstElementChild ?? card, () => {
        const box = boxOf(card);
        card.style.setProperty('--gx', `${(clientX - box.left).toFixed(0)}px`);
        card.style.setProperty('--gy', `${(clientY - box.top).toFixed(0)}px`);
      });
    }, { passive: true });
  });

  /* Pointer parallax for heroes ([data-pointer-parallax]): the grid, watermark
     and robot stage read --mx/--my (-1..1). */
  document.querySelectorAll<HTMLElement>('[data-pointer-parallax]').forEach(hero => {
    const apply = (x: number, y: number) => { hero.style.setProperty('--mx', x.toFixed(3)); hero.style.setProperty('--my', y.toFixed(3)); };
    hero.addEventListener('pointerenter', () => boxes.delete(hero), { passive: true });
    hero.addEventListener('pointermove', event => {
      if (still()) return;
      const { clientX, clientY } = event;
      schedule(hero, () => {
        const box = boxOf(hero);
        apply(((clientX - box.left) / box.width - .5) * 2, ((clientY - box.top) / box.height - .5) * 2);
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', () => schedule(hero, () => apply(0, 0)));
    reduce.addEventListener('change', () => { if (still()) apply(0, 0); });
  });
}

/* Scroll velocity, written only on the marquee bands that read it (never on
   :root, which would restyle the whole document every frame) and only while
   one of them is on screen. The bands lean (--scroll-vel, CSS skew) and
   speed up: their slide animations get a playbackRate of up to 5×, easing
   back to 1× as the scroll settles. The animations are looked up once per
   band when it comes on screen, not per frame. Not on the lite tier (its
   marquees rest). */
const leaners = lite ? [] : [...document.querySelectorAll<HTMLElement>('.mq, .marquee')];
if (leaners.length && 'IntersectionObserver' in window) {
  const inView = new Map<HTMLElement, Animation[]>();
  let lastY = window.scrollY, vel = 0, raf = 0;
  const tracks = (band: HTMLElement) => band.getAnimations({ subtree: true }).filter(animation => animation.effect?.getComputedTiming().iterations === Infinity);
  const write = (value: number) => inView.forEach((animations, band) => {
    band.style.setProperty('--scroll-vel', value.toFixed(3));
    animations.forEach(animation => { animation.playbackRate = 1 + Math.abs(value) * 4; });
  });
  const settle = () => {
    vel *= .9;
    raf = Math.abs(vel) > .01 && inView.size ? requestAnimationFrame(settle) : 0;
    if (!raf) vel = 0;
    write(vel);
  };
  const watcher = new IntersectionObserver(entries => entries.forEach(entry => {
    const band = entry.target as HTMLElement;
    if (entry.isIntersecting) inView.set(band, tracks(band));
    else {
      inView.get(band)?.forEach(animation => { animation.playbackRate = 1; });
      inView.delete(band);
      band.style.setProperty('--scroll-vel', '0');
    }
  }));
  leaners.forEach(band => watcher.observe(band));
  addEventListener('scroll', () => {
    const y = window.scrollY;
    if (!still() && inView.size) vel = Math.max(-1, Math.min(1, vel + (y - lastY) / 500));
    lastY = y;
    if (!raf && inView.size && vel) raf = requestAnimationFrame(settle);
  }, { passive: true });
}

export {};
