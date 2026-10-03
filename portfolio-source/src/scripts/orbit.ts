/*
 * 3D project ring. Drifts slowly while on screen (motion on); drag/swipe spins
 * it with inertia and snaps to the nearest card; arrows, ←/→ keys and focus
 * bring a card to the front. A drag never triggers the card's link.
 */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const still = () => reduce.matches || root.dataset.motion === 'off';

document.querySelectorAll<HTMLElement>('[data-orbit]').forEach(orbit => {
  const ring = orbit.querySelector<HTMLElement>('[data-orbit-ring]')!;
  const items = [...orbit.querySelectorAll<HTMLElement>('[data-orbit-item]')];
  const count = orbit.querySelector<HTMLElement>('[data-orbit-count]');
  const n = items.length, step = 360 / n;
  let angle = 0, velocity = 0, last = 0, frame = 0, visible = false, hold = 0;
  let tween: { from: number; to: number; start: number; ms: number } | null = null;
  let drag: { x: number; angle: number; moved: number; t: number } | null = null;
  const norm = (deg: number) => ((deg % 360) + 540) % 360 - 180;
  const front = () => ((Math.round(-angle / step) % n) + n) % n;

  const render = () => {
    ring.style.setProperty('--spin', `${angle.toFixed(2)}deg`);
    items.forEach((item, index) => {
      const facing = Math.cos((norm(index * step + angle) * Math.PI) / 180);
      item.style.setProperty('--o', String(Math.max(0, .25 + .75 * facing).toFixed(3)));
    });
    if (count) count.textContent = `${front() + 1} / ${n}`;
  };
  const goTo = (target: number, ms = 650) => { tween = { from: angle, to: target, start: performance.now(), ms: still() ? 1 : ms }; velocity = 0; kick(); };
  const snap = () => goTo(Math.round(angle / step) * step, 500);
  const pause = (ms = 4000) => { hold = performance.now() + ms; };

  const loop = (time: number) => {
    const dt = last ? Math.min(time - last, 50) : 16;
    last = time;
    if (tween) {
      const p = Math.min(1, (time - tween.start) / tween.ms);
      const eased = 1 - (1 - p) ** 3;
      angle = tween.from + (tween.to - tween.from) * eased;
      if (p >= 1) tween = null;
    } else if (!drag && Math.abs(velocity) > .002) {
      angle += velocity * dt;
      velocity *= .94;
      if (Math.abs(velocity) <= .002) snap();
    } else if (!drag && !still() && visible && time > hold) {
      angle -= .006 * dt; // gentle drift, about 6° a second
    }
    render();
    const busy = tween || drag || Math.abs(velocity) > .002 || (!still() && visible);
    frame = busy && !document.hidden ? requestAnimationFrame(loop) : 0;
    if (!frame) last = 0;
  };
  function kick() { if (!frame) frame = requestAnimationFrame(loop); }

  orbit.addEventListener('pointerdown', event => {
    if ((event.target as Element).closest('button')) return;
    drag = { x: event.clientX, angle, moved: 0, t: performance.now() };
    tween = null; velocity = 0;
    kick();
  });
  orbit.addEventListener('pointermove', event => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const now = performance.now();
    const next = drag.angle + dx * .28;
    velocity = (next - angle) / Math.max(8, now - drag.t);
    drag.t = now;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    // Capture only once it's clearly a drag, so a tap still opens the card.
    if (drag.moved > 6 && !orbit.hasPointerCapture(event.pointerId)) { orbit.setPointerCapture(event.pointerId); orbit.setAttribute('data-dragging', ''); }
    if (drag.moved > 6) angle = next;
  });
  const release = () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    orbit.removeAttribute('data-dragging');
    pause();
    if (moved < 6) { velocity = 0; return; }
    orbit.dataset.dragged = String(Date.now());
    if (Math.abs(velocity) < .02) snap();
    kick();
  };
  orbit.addEventListener('pointerup', release);
  orbit.addEventListener('pointercancel', release);
  // A real drag shouldn't open the card under the pointer.
  orbit.addEventListener('click', event => {
    if (Date.now() - Number(orbit.dataset.dragged || 0) < 300) { event.preventDefault(); event.stopPropagation(); }
  }, true);

  const nudge = (direction: number) => { pause(6000); goTo(Math.round(angle / step) * step - direction * step); };
  orbit.querySelector('[data-orbit-prev]')?.addEventListener('click', () => nudge(-1));
  orbit.querySelector('[data-orbit-next]')?.addEventListener('click', () => nudge(1));
  orbit.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); nudge(1); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); nudge(-1); }
  });
  items.forEach((item, index) => item.addEventListener('focusin', () => {
    pause(8000);
    const target = -index * step;
    goTo(angle + norm(target - angle));
  }));
  orbit.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') pause(1e9); });
  orbit.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') pause(1500); });

  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; kick(); }).observe(orbit);
  window.addEventListener('omar:motion', kick);
  document.addEventListener('visibilitychange', kick);
  render();
});

export {};
