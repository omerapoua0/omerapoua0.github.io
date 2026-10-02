/*
 * Hero motion switch: one "Pause motion" control (html[data-motion] +
 * `omar:motion`, which the network, chat, ticker and forms listen to).
 * Reduced-motion visitors start with motion off and can opt in.
 */
const root = document.documentElement;
const hero = document.querySelector<HTMLElement>('[data-hero]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
if (reduce.matches && !root.dataset.motion) root.dataset.motion = 'off';
const motionOn = () => root.dataset.motion !== 'off';

if (hero) {
  const toggle = hero.querySelector<HTMLButtonElement>('[data-motion-toggle]');
  const label = () => {
    const on = motionOn();
    const text = toggle?.querySelector('[data-motion-label]');
    if (text) text.textContent = on ? 'Pause motion' : 'Play motion';
    toggle?.querySelector('[data-motion-icon]')?.setAttribute('d', on ? 'M4 3h3v10H4zm5 0h3v10H9z' : 'M5 3l8 5-8 5z');
  };
  toggle?.addEventListener('click', () => {
    root.dataset.motion = motionOn() ? 'off' : 'on';
    window.dispatchEvent(new Event('omar:motion'));
    label();
  });
  reduce.addEventListener('change', () => { if (reduce.matches) { root.dataset.motion = 'off'; window.dispatchEvent(new Event('omar:motion')); label(); } });
  label();
}

export {};
