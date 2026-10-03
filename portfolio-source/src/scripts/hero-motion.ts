/*
 * The "Pause motion" switch (WCAG 2.2.2): every [data-motion-toggle] on the
 * page flips html[data-motion] and fires `omar:motion`, which Otto, the
 * ticker, the orbit, the columns and the forms listen to. The choice is kept
 * for the session (the head script in Base.astro restores it before paint);
 * reduced-motion visitors start paused and can opt in.
 */
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
if (reduce.matches && !root.dataset.motion) root.dataset.motion = 'off';
const motionOn = () => root.dataset.motion !== 'off';
const toggles = [...document.querySelectorAll<HTMLButtonElement>('[data-motion-toggle]')];

const label = () => {
  const on = motionOn();
  toggles.forEach(toggle => {
    const text = toggle.querySelector('[data-motion-label]');
    if (text) text.textContent = on ? 'Pause motion' : 'Play motion';
    toggle.querySelector('[data-motion-icon]')?.setAttribute('d', on ? 'M4 3h3v10H4zm5 0h3v10H9z' : 'M5 3l8 5-8 5z');
  });
};
const set = (value: 'on' | 'off') => {
  root.dataset.motion = value;
  try { sessionStorage.setItem('omar-motion', value); } catch { /* storage unavailable */ }
  window.dispatchEvent(new Event('omar:motion'));
  label();
};
toggles.forEach(toggle => toggle.addEventListener('click', () => set(motionOn() ? 'off' : 'on')));
reduce.addEventListener('change', () => { if (reduce.matches) set('off'); });
label();

export {};
