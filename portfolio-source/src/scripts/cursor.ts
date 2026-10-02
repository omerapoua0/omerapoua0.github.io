/* A trailing cursor ring for fine pointers. The native cursor stays visible
   (forms and text selection work as usual); the ring grows over links and
   buttons. Off for touch, reduced motion and when motion is paused. */
const root = document.documentElement;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

if (fine.matches && !reduce.matches) {
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  document.body.append(ring);
  let x = -100, y = -100, rx = -100, ry = -100, frame = 0;
  const loop = () => {
    rx += (x - rx) * .2; ry += (y - ry) * .2;
    ring.style.transform = `translate(${rx.toFixed(1)}px, ${ry.toFixed(1)}px)`;
    frame = Math.abs(x - rx) + Math.abs(y - ry) > .3 ? requestAnimationFrame(loop) : 0;
  };
  addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || root.dataset.motion === 'off') { ring.hidden = true; return; }
    ring.hidden = false;
    x = event.clientX; y = event.clientY;
    ring.toggleAttribute('data-hot', !!(event.target as Element).closest?.('a, button, label, summary, [data-graph]'));
    if (!frame) frame = requestAnimationFrame(loop);
  }, { passive: true });
  document.addEventListener('pointerleave', () => { ring.hidden = true; });
}

export {};
