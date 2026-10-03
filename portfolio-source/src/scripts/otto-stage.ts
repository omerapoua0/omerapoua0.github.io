/*
 * Decides how Otto appears in each [data-otto-stage] (hero or inside-page
 * dock) and loads the 3D module only when it's worth it: after the page has
 * loaded, while the stage is on screen, with WebGL 2 and no data-saving or
 * low-memory signals. Until then a lime landing pad waits ("Otto is on his
 * way…"); after a 3 s deadline, or on any failure, the SVG Otto stands in.
 * data-mode: pending → 3d | svg. Also runs the speech bubble (otto:say).
 * URL switches for testing: ?otto3d=off | ?otto3d=force.
 */
type Handle = { dispose: () => void; setStill: (still: boolean) => void };
const DEADLINE = 3000;
const root = document.documentElement;
const params = new URLSearchParams(location.search);
const flag = params.get('otto3d');
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const still = () => reduce.matches || root.dataset.motion === 'off';
const session = {
  get: (key: string) => { try { return sessionStorage.getItem(key); } catch { return null; } },
  set: (key: string, value: string) => { try { sessionStorage.setItem(key, value); } catch { /* storage unavailable */ } },
};

/** Whether this visit should try the 3D Otto (WebGL itself is checked separately). */
function capable(dock: boolean) {
  if (flag === 'off') return false;
  if (flag === 'force') return true;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string }; deviceMemory?: number };
  if (nav.connection?.saveData || /(^|-)2g$/.test(nav.connection?.effectiveType ?? '')) return false;
  if (window.matchMedia('(prefers-reduced-data: reduce)').matches) return false;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 4) return false;
  if (session.get('otto3d') === 'off') return false;
  // Inside-page docks only go 3D when the hero already ran it well this session.
  if (dock && !/^(hi|lo)$/.test(session.get('otto3d') ?? '')) return false;
  return true;
}

function initStage(stage: HTMLElement) {
  const dock = stage.dataset.stageMode === 'dock';
  const canvas = stage.querySelector<HTMLCanvasElement>('canvas[data-otto-canvas]');
  const bubble = stage.querySelector<HTMLElement>('[data-otto-bubble]');
  let handle: Handle | null = null;
  let settled = false;
  const toSvg = (reason: string) => {
    if (stage.dataset.mode === 'svg') return;
    stage.dataset.mode = 'svg';
    stage.dataset.reason = reason;
    window.dispatchEvent(new CustomEvent('otto:mode', { detail: { mode: 'svg' } }));
    if (!dock) window.dispatchEvent(new CustomEvent('otto:landed'));
  };
  // Remembered so the chat can greet at once if Otto landed before it listened.
  if (!dock) window.addEventListener('otto:landed', () => stage.setAttribute('data-landed', ''));

  // Speech bubble: the latest thing Otto says, kept short, near his head.
  let hideTimer = 0;
  window.addEventListener('otto:say', event => {
    if (!bubble) return;
    const text = String((event as CustomEvent<{ text?: string }>).detail?.text ?? '').trim();
    if (!text) { bubble.removeAttribute('data-show'); return; }
    // Short sentences travel together ("KATANA? Good choice. Let me take you inside.").
    let line = '';
    for (const sentence of text.match(/[^.!?]+[.!?]+(?=\s|$)|[^.!?]+$/g) ?? [text]) {
      const next = `${line} ${sentence.trim()}`.trim();
      if (line && (next.length > 110 || line.length >= 48)) break;
      line = next;
    }
    bubble.textContent = line.length > 110 ? `${line.slice(0, 107).trimEnd()}…` : line;
    bubble.setAttribute('data-show', '');
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => bubble.removeAttribute('data-show'), dock ? 3200 : 7000);
  });
  window.addEventListener('otto:anchor', event => {
    if (stage.dataset.mode !== '3d' || !bubble) return;
    const { x, y } = (event as CustomEvent<{ x: number; y: number }>).detail;
    const box = stage.getBoundingClientRect();
    stage.style.setProperty('--bx', `${Math.round(x - box.left)}px`);
    stage.style.setProperty('--by', `${Math.round(y - box.top)}px`);
  });

  if (!canvas || !capable(dock)) { toSvg(canvas ? 'gate' : 'no-canvas'); return; }
  const gl = canvas.getContext('webgl2', { antialias: (window.devicePixelRatio || 1) < 2, alpha: true, powerPreference: 'high-performance', failIfMajorPerformanceCaveat: flag !== 'force' }) as WebGL2RenderingContext | null;
  if (!gl) { toSvg('no-webgl'); session.set('otto3d', 'off'); return; }

  const deadline = window.setTimeout(() => { if (!settled) toSvg('deadline'); }, DEADLINE);
  window.addEventListener('otto:fail', () => { session.set('otto3d', 'off'); handle = null; toSvg('fail'); });
  window.addEventListener('otto:ready', event => {
    settled = true;
    window.clearTimeout(deadline);
    const tier = (event as CustomEvent<{ tier?: string }>).detail?.tier ?? 'hi';
    if (session.get('otto3d') !== 'lo') session.set('otto3d', tier);
    stage.dataset.mode = '3d';
    window.dispatchEvent(new CustomEvent('otto:mode', { detail: { mode: '3d' } }));
  }, { once: true });

  const start = async () => {
    try {
      const { mount } = await import('./otto3d/stage');
      const late = stage.dataset.mode === 'svg';
      const first = !session.get('otto-entered');
      const entrance = dock || late || still() ? 'none' : first ? 'fly' : 'rise';
      session.set('otto-entered', '1');
      handle = await mount(canvas, gl, { mode: dock ? 'dock' : 'hero', entrance, still: still(), force: flag === 'force' });
    } catch (error) {
      console.warn('Otto 3D unavailable:', error);
      session.set('otto3d', 'off');
      toSvg('error');
    }
  };
  const begin = () => {
    const go = () => {
      if (!('IntersectionObserver' in window)) return void start();
      const seen = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { seen.disconnect(); void start(); } }, { rootMargin: '120px' });
      seen.observe(stage);
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number }).requestIdleCallback;
    if (idle) idle(go, { timeout: 1200 }); else window.setTimeout(go, 200);
  };
  if (document.readyState === 'complete') begin(); else addEventListener('load', begin, { once: true });

  window.addEventListener('omar:motion', () => handle?.setStill(still()));
  reduce.addEventListener('change', () => handle?.setStill(still()));
  addEventListener('pagehide', event => { if (!event.persisted && handle) { handle.dispose(); handle = null; } });
}

document.querySelectorAll<HTMLElement>('[data-otto-stage]').forEach(initStage);

export {};
