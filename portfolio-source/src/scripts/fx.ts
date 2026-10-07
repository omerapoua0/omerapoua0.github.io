/*
 * Small site-wide motion: 3D tilt toward the pointer on [data-tilt] cards
 * (fine pointers only), magnetic buttons ([data-magnetic]), a cursor-follow
 * highlight ([data-glow] reads --gx/--gy), pointer parallax on heroes
 * ([data-pointer-parallax] sets --mx/--my), and scroll velocity fed to the
 * marquee bands so they lean and speed up as you scroll. All of it stops
 * with reduced motion.
 */
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const still = () => reduce.matches;

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach(card => {
    card.addEventListener('pointermove', event => {
      if (still()) return;
      const box = card.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .5, y = (event.clientY - box.top) / box.height - .5;
      card.style.setProperty('--tilt-x', `${(-y * 7).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${(x * 9).toFixed(2)}deg`);
      card.style.setProperty('--glare-x', `${((x + .5) * 100).toFixed(1)}%`);
      card.style.setProperty('--glare-y', `${((y + .5) * 100).toFixed(1)}%`);
      card.setAttribute('data-tilting', '');
    });
    card.addEventListener('pointerleave', () => { card.removeAttribute('data-tilting'); card.style.removeProperty('--tilt-x'); card.style.removeProperty('--tilt-y'); });
  });
}

/* Magnetic buttons: drift up to 8px toward the pointer. */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-magnetic], .btn').forEach(button => {
    button.addEventListener('pointermove', event => {
      if (still()) return;
      const box = button.getBoundingClientRect();
      const dx = (event.clientX - box.left - box.width / 2) / (box.width / 2);
      const dy = (event.clientY - box.top - box.height / 2) / (box.height / 2);
      button.style.translate = `${(dx * 8).toFixed(1)}px ${(dy * 6).toFixed(1)}px`;
    });
    button.addEventListener('pointerleave', () => { button.style.translate = ''; });
  });

  /* Cursor-follow highlight. */
  document.querySelectorAll<HTMLElement>('[data-glow]').forEach(card => {
    card.addEventListener('pointermove', event => {
      const box = card.getBoundingClientRect();
      card.style.setProperty('--gx', `${(event.clientX - box.left).toFixed(0)}px`);
      card.style.setProperty('--gy', `${(event.clientY - box.top).toFixed(0)}px`);
    });
  });
}

/* Pointer parallax for heroes ([data-pointer-parallax]): the grid, watermark
   and robot stage read --mx/--my (-1..1). */
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll<HTMLElement>('[data-pointer-parallax]').forEach(hero => {
    let raf = 0, x = 0, y = 0;
    const apply = () => { raf = 0; hero.style.setProperty('--mx', x.toFixed(3)); hero.style.setProperty('--my', y.toFixed(3)); };
    hero.addEventListener('pointermove', event => {
      if (still()) return;
      const box = hero.getBoundingClientRect();
      x = ((event.clientX - box.left) / box.width - .5) * 2;
      y = ((event.clientY - box.top) / box.height - .5) * 2;
      if (!raf) raf = requestAnimationFrame(apply);
    });
    hero.addEventListener('pointerleave', () => { x = 0; y = 0; if (!raf) raf = requestAnimationFrame(apply); });
    reduce.addEventListener('change', () => { if (still()) { x = 0; y = 0; apply(); } });
  });
}

/* Scroll velocity, written only on the marquee bands that read it (never on
   :root, which would restyle the whole document every frame) and only while
   one of them is on screen. The bands lean (--scroll-vel, CSS skew) and
   speed up: their slide animations get a playbackRate of up to 5×, easing
   back to 1× as the scroll settles. */
const leaners = [...document.querySelectorAll<HTMLElement>('.mq, .marquee')];
if (leaners.length && 'IntersectionObserver' in window) {
  const inView = new Set<HTMLElement>();
  let lastY = window.scrollY, vel = 0, frame = 0;
  const tracks = (band: HTMLElement) => band.getAnimations({ subtree: true }).filter(animation => animation.effect?.getComputedTiming().iterations === Infinity);
  const write = (value: number) => inView.forEach(band => {
    band.style.setProperty('--scroll-vel', value.toFixed(3));
    tracks(band).forEach(animation => { animation.playbackRate = 1 + Math.abs(value) * 4; });
  });
  const settle = () => {
    vel *= .9;
    frame = Math.abs(vel) > .01 && inView.size ? requestAnimationFrame(settle) : 0;
    if (!frame) vel = 0;
    write(vel);
  };
  const watcher = new IntersectionObserver(entries => entries.forEach(entry => {
    const band = entry.target as HTMLElement;
    if (entry.isIntersecting) inView.add(band);
    else { inView.delete(band); band.style.setProperty('--scroll-vel', '0'); tracks(band).forEach(animation => { animation.playbackRate = 1; }); }
  }));
  leaners.forEach(band => watcher.observe(band));
  addEventListener('scroll', () => {
    const y = window.scrollY;
    if (!still() && inView.size) vel = Math.max(-1, Math.min(1, vel + (y - lastY) / 500));
    lastY = y;
    if (!frame && inView.size && vel) frame = requestAnimationFrame(settle);
  }, { passive: true });
}

export {};
