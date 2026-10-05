/*
 * Small site-wide motion: 3D tilt toward the pointer on [data-tilt] cards
 * (fine pointers only), magnetic buttons ([data-magnetic]), a cursor-follow
 * highlight ([data-glow] reads --gx/--gy), and scroll velocity fed to CSS as --scroll-vel so
 * bands like the ticker lean and speed up as you scroll. All of it stops
 * with reduced motion or when motion is paused.
 */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const still = () => reduce.matches || root.dataset.motion === 'off';

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
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(button => {
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

let lastY = window.scrollY, vel = 0, frame = 0;
const settle = () => {
  vel *= .88;
  root.style.setProperty('--scroll-vel', vel.toFixed(3));
  frame = Math.abs(vel) > .01 ? requestAnimationFrame(settle) : 0;
  if (!frame) root.style.setProperty('--scroll-vel', '0');
};
addEventListener('scroll', () => {
  const y = window.scrollY;
  if (!still()) vel = Math.max(-1, Math.min(1, vel + (y - lastY) / 600));
  lastY = y;
  if (!frame) frame = requestAnimationFrame(settle);
}, { passive: true });

export {};
