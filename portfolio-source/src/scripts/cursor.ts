/* A trailing neon cursor ring for fine pointers. The native cursor stays
   visible (forms and text selection work as usual). The ring morphs: it
   grows over links, becomes a labelled pill ("Open") only over large targets
   (doors, gallery cards, [data-cursor-label]), shrinks to a dot over buttons
   (their own fill-wipe is the hover effect), steps aside over text fields and
   squeezes on press. Off for touch, reduced motion and when
   motion is paused. */
const root = document.documentElement;
const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

if (fine.matches && !reduce.matches) {
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  ring.setAttribute('aria-hidden', 'true');
  ring.hidden = true;
  document.body.append(ring);
  let x = -100, y = -100, rx = -100, ry = -100, frame = 0, last: Element | null = null;
  const loop = () => {
    rx += (x - rx) * .22; ry += (y - ry) * .22;
    ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
    frame = Math.abs(x - rx) + Math.abs(y - ry) > .3 ? requestAnimationFrame(loop) : 0;
  };
  const morph = (target: Element | null) => {
    if (target === last) return;
    last = target;
    const text = !!target?.closest?.('input:not([type="radio"]):not([type="checkbox"]), textarea, select, [contenteditable]');
    const big = target?.closest?.<HTMLElement>('.door, [data-hgallery-item] a, .tours__card, [data-cursor-label]');
    const button = !big && !!target?.closest?.('.btn, .copy-btn, .header__cta');
    ring.toggleAttribute('data-text', text);
    ring.dataset.label = big && !text ? (big.dataset.cursorLabel || 'Open') : '';
    ring.toggleAttribute('data-btn', !text && button);
    ring.toggleAttribute('data-hot', !text && !big && !button && !!target?.closest?.('a, button, label, summary, [data-graph]'));
  };
  addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || root.dataset.motion === 'off') { ring.hidden = true; return; }
    ring.hidden = false;
    x = event.clientX; y = event.clientY;
    morph(event.target as Element);
    if (!frame) frame = requestAnimationFrame(loop);
  }, { passive: true });
  addEventListener('pointerdown', () => ring.setAttribute('data-down', ''), { passive: true });
  addEventListener('pointerup', () => ring.removeAttribute('data-down'), { passive: true });
  document.addEventListener('pointerleave', () => { ring.hidden = true; });
  addEventListener('omar:motion', () => { if (root.dataset.motion === 'off') ring.hidden = true; });
}

export {};
