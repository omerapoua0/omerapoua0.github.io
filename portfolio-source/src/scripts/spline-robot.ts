/*
 * Loads the 21st.dev Spline robot only when it can be enjoyed: after the page
 * has painted, when the stage is on screen, with WebGL, without reduced motion
 * or Save-Data. Otherwise (or if the scene can't be fetched) Otto's SVG shows.
 * Otto's poses ('otto:state') become a data-pose for the beam/flash overlay.
 */
const stage = document.querySelector<HTMLElement>('[data-spline-robot]');
const canvas = stage?.querySelector<HTMLCanvasElement>('canvas');

if (stage && canvas) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
  const webgl = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();
  const fallback = () => { stage.dataset.state = 'fallback'; };

  window.addEventListener('otto:state', event => {
    const { state } = (event as CustomEvent<{ state: string }>).detail ?? {};
    stage.dataset.pose = state;
  });

  if (reduce || saveData || !webgl) fallback();
  else {
    const start = async () => {
      try {
        const { Application } = await import('@splinetool/runtime');
        const app = new Application(canvas);
        await Promise.race([app.load(stage.dataset.scene!), new Promise((_, reject) => window.setTimeout(() => reject(new Error('timeout')), 15000))]);
        stage.dataset.state = 'ready';
        window.addEventListener('omar:motion', () => { if (document.documentElement.dataset.motion === 'off') app.stop(); else app.play(); });
        if (document.documentElement.dataset.motion === 'off') app.stop();
      } catch { fallback(); }
    };
    const begin = () => {
      if (!('IntersectionObserver' in window)) return void start();
      const seen = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { seen.disconnect(); void start(); } });
      seen.observe(stage);
    };
    if (document.readyState === 'complete') window.setTimeout(begin, 300); else addEventListener('load', () => window.setTimeout(begin, 300), { once: true });
  }
}

export {};
