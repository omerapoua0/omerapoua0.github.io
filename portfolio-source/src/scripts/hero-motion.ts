/*
 * Hero motion: one "Pause motion" switch (html[data-motion] + `omar:motion`,
 * which the network, ticker and forms listen to), the decoding role line, the
 * live MAPE-K loop and magnetic buttons. Reduced-motion visitors start with
 * motion off and can opt in; everything stops offscreen and in hidden tabs.
 */
const root = document.documentElement;
const hero = document.querySelector<HTMLElement>('[data-hero]');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
if (reduce.matches && !root.dataset.motion) root.dataset.motion = 'off';
const motionOn = () => root.dataset.motion !== 'off';

if (hero) {
  let inView = true;
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

  const timers: { run: () => void; stop: () => void }[] = [];
  const every = (ms: number, tick: () => void) => {
    let id = 0;
    const control = { run: () => { if (!id) id = window.setInterval(tick, ms); }, stop: () => { window.clearInterval(id); id = 0; } };
    timers.push(control);
    return control;
  };
  const sync = () => timers.forEach(timer => (motionOn() && inView && !document.hidden ? timer.run() : timer.stop()));

  /* Decoding role line: each change scrambles through glyphs, then settles. */
  const cycle = hero.querySelector<HTMLElement>('[data-decode-cycle]');
  const lines: string[] = cycle ? JSON.parse(cycle.dataset.lines || '[]') : [];
  if (cycle && lines.length > 1) {
    const glyphs = '01ABCDEFXYZ∑∂λπ∫≈#/<>';
    let index = 0;
    let decoding = 0;
    const decode = (target: string) => {
      window.clearInterval(decoding);
      let frameCount = 0;
      const total = 16;
      decoding = window.setInterval(() => {
        frameCount += 1;
        const settled = Math.floor((frameCount / total) * target.length);
        cycle.textContent = target.split('').map((char, i) => (i < settled || char === ' ' ? char : glyphs[Math.floor(Math.random() * glyphs.length)])).join('');
        if (frameCount >= total) { window.clearInterval(decoding); cycle.textContent = target; }
      }, 34);
    };
    every(2900, () => { index = (index + 1) % lines.length; decode(lines[index]); });
  }

  /* Live MAPE-K loop: Monitor → Analyse → Plan → Execute over shared Knowledge. */
  const stages = [...hero.querySelectorAll<HTMLElement>('[data-mapek] [data-stage]')];
  if (stages.length) {
    let stage = 0;
    stages[0].setAttribute('data-active', '');
    every(1300, () => { stages[stage].removeAttribute('data-active'); stage = (stage + 1) % stages.length; stages[stage].setAttribute('data-active', ''); });
  }

  /* Magnetic buttons (fine pointers only). */
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.querySelectorAll<HTMLElement>('[data-magnetic]').forEach(button => {
      button.addEventListener('pointermove', event => {
        if (!motionOn()) return;
        const box = button.getBoundingClientRect();
        const x = (event.clientX - box.left - box.width / 2) * .25;
        const y = (event.clientY - box.top - box.height / 2) * .35;
        button.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      });
      button.addEventListener('pointerleave', () => { button.style.transform = ''; });
    });
  }

  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }).observe(hero);
  window.addEventListener('omar:motion', sync);
  document.addEventListener('visibilitychange', sync);
  sync();
}

export {};
