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

  // Speech bubble: the latest thing Otto says, kept short, near his head, and
  // nudged sideways so it stays in the free space (never under the chat card).
  // Inside tours write their own (full) narration lines: data-bubble-owner="page".
  const ownBubble = !!bubble && stage.dataset.bubbleOwner !== 'page';
  let anchorY = NaN; // the 3D head anchor, before clamping
  const place = () => {
    if (!bubble || !ownBubble) return;
    const width = stage.clientWidth;
    // Never let the bubble grow out of the top of the stage (short phone stages).
    if (stage.dataset.mode === '3d' && Number.isFinite(anchorY)) stage.style.setProperty('--by', `${Math.round(Math.max(anchorY, bubble.offsetHeight + 8))}px`);
    const gx = parseFloat(stage.style.getPropertyValue('--gx')), gw = parseFloat(stage.style.getPropertyValue('--gw'));
    const lo = gw > 0 ? gx - gw / 2 + 8 : 8, hi = gw > 0 ? gx + gw / 2 - 8 : width - 8;
    bubble.style.maxWidth = `${Math.round(Math.max(150, hi - lo))}px`;
    const anchor = stage.dataset.mode === '3d' ? parseFloat(stage.style.getPropertyValue('--bx')) : gx > 0 ? gx : width / 2;
    if (!Number.isFinite(anchor)) return;
    const size = bubble.offsetWidth, left = anchor - size * .12;
    bubble.style.setProperty('--nudge', `${Math.round(Math.min(Math.max(left, lo), Math.max(lo, hi - size)) - left)}px`);
  };
  let hideTimer = 0;
  window.addEventListener('otto:say', event => {
    if (!bubble || !ownBubble) return;
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
    place();
    bubble.setAttribute('data-show', '');
    window.clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => bubble.removeAttribute('data-show'), dock ? 3200 : 7000);
  });
  window.addEventListener('otto:anchor', event => {
    if (stage.dataset.mode !== '3d' || !bubble) return;
    const { x, y } = (event as CustomEvent<{ x: number; y: number }>).detail;
    const box = stage.getBoundingClientRect();
    anchorY = y - box.top;
    stage.style.setProperty('--bx', `${Math.round(x - box.left)}px`);
    stage.style.setProperty('--by', `${Math.round(Math.max(anchorY, bubble.offsetHeight + 8))}px`);
    if (bubble.hasAttribute('data-show')) place();
  });
  window.addEventListener('otto:mode', place);
  window.addEventListener('otto:layout', place);

  // Desktop hero: Otto stands in the gap between the intro and the chat, not
  // at the page centre. --gx/--gw (px, relative to the stage) drive the SVG
  // Otto's CSS and the 3D camera (otto:layout).
  if (!dock) {
    const hero = stage.closest('[data-hero]');
    const layout = () => {
      const intro = hero?.querySelector('.agent__intro')?.getBoundingClientRect();
      const chat = hero?.querySelector('[data-chat]')?.getBoundingClientRect();
      const box = stage.getBoundingClientRect();
      const gap = intro && chat ? chat.left - intro.right : 0;
      if (intro && chat && gap > 160 && Math.abs(chat.top - intro.top) < box.height) {
        stage.style.setProperty('--gx', `${Math.round((intro.right + chat.left) / 2 - box.left)}px`);
        stage.style.setProperty('--gw', `${Math.round(gap)}px`);
      } else { stage.style.removeProperty('--gx'); stage.style.removeProperty('--gw'); }
      window.dispatchEvent(new CustomEvent('otto:layout'));
    };
    layout();
    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(stage);
    else addEventListener('resize', layout);
  }

  if (!canvas || !capable(dock)) { toSvg(canvas ? 'gate' : 'no-canvas'); return; }

  const hero = dock ? null : stage.closest<HTMLElement>('[data-hero]');
  const deadline = window.setTimeout(() => { if (!settled) toSvg('deadline'); }, DEADLINE);
  window.addEventListener('otto:fail', () => { session.set('otto3d', 'off'); handle = null; toSvg('fail'); });
  // An offer made before 3D arrives is played by the SVG Otto, start to finish.
  window.addEventListener('otto:handoff', event => {
    if ((event as CustomEvent<{ phase?: string }>).detail?.phase === 'offer' && stage.dataset.mode === 'pending') toSvg('handoff');
  });
  const reveal = () => {
    stage.dataset.mode = '3d';
    window.dispatchEvent(new CustomEvent('otto:mode', { detail: { mode: '3d' } }));
  };
  window.addEventListener('otto:ready', event => {
    settled = true;
    window.clearTimeout(deadline);
    const tier = (event as CustomEvent<{ tier?: string }>).detail?.tier ?? 'hi';
    if (session.get('otto3d') !== 'lo') session.set('otto3d', tier);
    // Never swap robots in the middle of an offer: wait until it's declined.
    if (hero?.hasAttribute('data-handoff')) {
      const later = (next: Event) => {
        if ((next as CustomEvent<{ phase?: string }>).detail?.phase !== 'cancel') return;
        window.removeEventListener('otto:handoff', later);
        reveal();
      };
      window.addEventListener('otto:handoff', later);
    } else reveal();
  }, { once: true });

  const start = async () => {
    // The WebGL context is only created now (after load, idle and on screen), so
    // visitors who never reach Otto, or only ever see the SVG one, never pay for it.
    const gl = canvas.getContext('webgl2', { antialias: (window.devicePixelRatio || 1) < 2, alpha: true, powerPreference: 'default', failIfMajorPerformanceCaveat: flag !== 'force' }) as WebGL2RenderingContext | null;
    if (!gl) { window.clearTimeout(deadline); toSvg('no-webgl'); session.set('otto3d', 'off'); return; }
    // CPU-rendered WebGL (SwiftShader, llvmpipe…) can't carry Otto smoothly.
    // Firefox reports it in RENDERER; Chromium/WebKit only through the debug extension.
    let renderer = String(gl.getParameter(gl.RENDERER) ?? '');
    if (/^webkit webgl$/i.test(renderer)) {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      if (info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? '');
    }
    if (flag !== 'force' && /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) {
      window.clearTimeout(deadline);
      toSvg('software'); session.set('otto3d', 'off');
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return;
    }
    try {
      const { mount } = await import('./otto3d/stage');
      const first = !session.get('otto-entered');
      session.set('otto-entered', '1');
      // Decided after warm-up: if the SVG Otto already stood in, the 3D one just appears.
      const entrance = () => dock || stage.dataset.mode === 'svg' || still() ? 'none' as const : first ? 'fly' as const : 'rise' as const;
      const tier = session.get('otto3d') === 'lo' ? 'lo' as const : 'hi' as const;
      handle = await mount(canvas, gl, { mode: dock ? 'dock' : 'hero', entrance, still: still(), tier, force: flag === 'force' });
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
