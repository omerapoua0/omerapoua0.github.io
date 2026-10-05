/*
 * Homepage interaction: pointer parallax for the hero (grid, watermark and
 * the robot stage read --mx/--my) and the contact band's copy-email button.
 * (Magnetic buttons and card highlights live in fx.ts, site-wide.) Pointer effects run on fine pointers only and stop
 * with reduced motion or Pause motion. All of it is decoration: content and
 * links work without it.
 */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
const still = () => reduce.matches || root.dataset.motion === 'off';

/* Hero parallax. */
const hero = document.querySelector<HTMLElement>('[data-hero]');
if (hero && fine.matches) {
  let frame = 0, x = 0, y = 0;
  const apply = () => { frame = 0; hero.style.setProperty('--mx', x.toFixed(3)); hero.style.setProperty('--my', y.toFixed(3)); };
  hero.addEventListener('pointermove', event => {
    if (still()) return;
    const box = hero.getBoundingClientRect();
    x = ((event.clientX - box.left) / box.width - .5) * 2;
    y = ((event.clientY - box.top) / box.height - .5) * 2;
    if (!frame) frame = requestAnimationFrame(apply);
  });
  hero.addEventListener('pointerleave', () => { x = 0; y = 0; if (!frame) frame = requestAnimationFrame(apply); });
  window.addEventListener('omar:motion', () => { if (still()) { x = 0; y = 0; apply(); } });
}

/* Copy the email address (the address itself is always a mailto link). */
document.querySelectorAll<HTMLButtonElement>('[data-copy-email]').forEach(button => {
  if (!navigator.clipboard) return;
  button.hidden = false;
  const label = button.querySelector('[data-copy-label]');
  const status = button.parentElement?.querySelector('[data-copy-status]');
  button.addEventListener('click', async () => {
    const email = button.dataset.copyEmail ?? '';
    let ok = false;
    try { await Promise.race([navigator.clipboard.writeText(email), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))]); ok = true; } catch { ok = false; }
    if (label) label.textContent = ok ? 'Copied' : 'Copy failed';
    if (status) status.textContent = ok ? 'Email address copied.' : `Could not copy. The address is ${email}.`;
    window.setTimeout(() => { if (label) label.textContent = 'Copy'; }, 1800);
  });
});

export {};
