/*
 * Otto's faces, drawn on canvases used as textures. Both are LED dot-matrix
 * panels behind black glass: the face band (eyes and a small dotted mouth)
 * and the chest screen (an "O" badge, or a project poster during the
 * hand-off). Shapes are drawn into a tiny mask (one pixel per LED), then each
 * lit cell becomes a soft lime dot with a bloom. Redraws only on change.
 */
import { CanvasTexture, SRGBColorSpace } from 'three';

export type Expression = 'neutral' | 'happy' | 'wink' | 'confused' | 'think' | 'squint';
export type FaceState = { lookX: number; lookY: number; blink: number; expression: Expression; talk: number; time: number };

const LIME = '#d9ff3f';
const canvasOf = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

/** One LED: a hot centre fading to lime (drawn once, stamped per lit cell). */
const ledSprite = (() => {
  let sprite: HTMLCanvasElement | null = null;
  return () => {
    if (sprite) return sprite;
    sprite = canvasOf(32, 32);
    const ctx = sprite.getContext('2d')!;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(250,255,222,1)');
    g.addColorStop(.32, 'rgba(226,255,96,1)');
    g.addColorStop(.58, 'rgba(217,255,63,.55)');
    g.addColorStop(1, 'rgba(217,255,63,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
    return sprite;
  };
})();

/** A dot-matrix panel: draw shapes in cell units on `mask`, then `flush()` paints LEDs. */
function ledPanel(ctx: CanvasRenderingContext2D, cols: number, rows: number, pitch: number, ox = 0, oy = 0) {
  const mask = canvasOf(cols, rows);
  const m = mask.getContext('2d', { willReadFrequently: true })!;
  const halo = canvasOf(Math.ceil(cols / 3), Math.ceil(rows / 3));
  const h = halo.getContext('2d')!;
  // The unlit matrix: faint dots so the glass reads as a real display.
  const grid = canvasOf(ctx.canvas.width, ctx.canvas.height);
  const g = grid.getContext('2d')!;
  g.fillStyle = 'rgba(217,255,63,.055)';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { g.beginPath(); g.arc(ox + (c + .5) * pitch, oy + (r + .5) * pitch, pitch * .2, 0, Math.PI * 2); g.fill(); }
  const begin = () => {
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.clearRect(0, 0, cols, rows);
    m.fillStyle = LIME; m.strokeStyle = LIME; m.lineCap = 'round'; m.lineJoin = 'round';
    return m;
  };
  const flush = (alpha = 1, unlit = true) => {
    if (unlit) ctx.drawImage(grid, 0, 0);
    const w = cols * pitch, hh = rows * pitch;
    // Bloom: the mask blurred twice by upscaling (cheap, works in every browser).
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = .5 * alpha;
    ctx.drawImage(mask, ox, oy, w, hh);
    h.clearRect(0, 0, halo.width, halo.height);
    h.drawImage(mask, 0, 0, halo.width, halo.height);
    ctx.globalAlpha = .55 * alpha;
    ctx.drawImage(halo, ox - pitch, oy - pitch, w + pitch * 2, hh + pitch * 2);
    const data = m.getImageData(0, 0, cols, rows).data;
    const dot = ledSprite(), size = pitch * 1.18;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const a = data[(r * cols + c) * 4 + 3] / 255;
      if (a < .14) continue;
      ctx.globalAlpha = Math.min(1, a * 1.3) * alpha;
      ctx.drawImage(dot, ox + (c + .5) * pitch - size / 2, oy + (r + .5) * pitch - size / 2, size, size);
    }
    ctx.restore();
  };
  return { begin, flush };
}

/** Face band canvas (matches the glass band in rig.ts: 80 x 24 LEDs). */
export function createFace() {
  const COLS = 80, ROWS = 24, PITCH = 9.6;
  const canvas = canvasOf(768, 231);
  const ctx = canvas.getContext('2d')!;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  const panel = ledPanel(ctx, COLS, ROWS, PITCH, 0, 0);
  let last = '';

  const set = (state: FaceState) => {
    // Whole-cell steps keep the matrix crisp, like a real LED panel.
    const ex = Math.round(state.lookX * 3), ey = Math.round(state.lookY * 2);
    const open = Math.round((1 - state.blink) * 8) / 8;
    const bars = state.talk > 0 ? [0, 1, 2, 3, 4].map(i => Math.round(1 + 3.4 * state.talk * (.5 + .5 * Math.sin(state.time * 22 + i * 1.7)))) : [];
    const dots = state.expression === 'think' ? Math.floor(state.time * 3) % 4 : 0;
    const key = `${ex},${ey},${open},${state.expression},${bars.join('-')},${dots}`;
    if (key === last) return false;
    last = key;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const m = panel.begin();
    const lx = 26.5 + ex, rx = 53.5 + ex, y = 10.5 + ey;
    const eye = (cx: number, cy: number, o: number, kind: 'open' | 'happy' | 'squint') => {
      if (kind === 'happy') {
        m.lineWidth = 2.3;
        m.beginPath(); m.arc(cx, cy + 2.6, 4.1, Math.PI * 1.12, Math.PI * 1.88); m.stroke();
        return;
      }
      const hgt = Math.max(1.2, 9 * o * (kind === 'squint' ? .42 : 1));
      m.beginPath(); m.roundRect(cx - 3.5, cy - hgt / 2, 7, hgt, Math.min(3.2, hgt / 2)); m.fill();
    };
    const smile = (wide: boolean) => {
      m.lineWidth = 1.7;
      m.beginPath();
      if (wide) m.arc(40 + ex * .5, 14.6, 4.6, Math.PI * .18, Math.PI * .82);
      else m.arc(40 + ex * .5, 15.4, 3, Math.PI * .22, Math.PI * .78);
      m.stroke();
    };
    switch (state.expression) {
      case 'happy': eye(lx, y, 1, 'happy'); eye(rx, y, 1, 'happy'); break;
      case 'wink': eye(lx, y, 1, 'happy'); eye(rx, y, open, 'open'); break;
      case 'squint': eye(lx, y, open, 'squint'); eye(rx, y, open, 'squint'); break;
      case 'confused':
        eye(lx, y, open, 'open'); eye(rx, y + 1, open * .5, 'open');
        m.font = '700 11px system-ui, sans-serif'; m.textAlign = 'center'; m.textBaseline = 'middle';
        m.fillText('?', 66, 7.5);
        break;
      case 'think':
        eye(lx + 1, y - 1.5, open * .8, 'open'); eye(rx + 1, y - 1.5, open * .8, 'open');
        for (let i = 0; i < 3; i++) { m.globalAlpha = i < dots ? 1 : .3; m.beginPath(); m.arc(37 + i * 3, 20, .75, 0, Math.PI * 2); m.fill(); }
        m.globalAlpha = 1;
        break;
      default: eye(lx, y, open, 'open'); eye(rx, y, open, 'open');
    }
    if (bars.length) {
      bars.forEach((hgt, i) => { m.fillRect(36 + i * 2, 19.5 - hgt / 2, 1, hgt); });
    } else if (state.expression === 'happy' || state.expression === 'wink') smile(true);
    else if (state.expression === 'neutral') smile(false);
    panel.flush();
    texture.needsUpdate = true;
    return true;
  };
  return { texture, set, dispose: () => texture.dispose() };
}

/** Chest screen canvas (0.48 x 0.32 units on the body; same LED pitch as the face). */
export function createChest() {
  const canvas = canvasOf(512, 352);
  const ctx = canvas.getContext('2d')!;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const panel = ledPanel(ctx, 30, 21, 16.8, 4, 0);
  let mode = '';
  let pulse = -1;

  const badge = (glow: number) => {
    const level = Math.round(glow * 10);
    if (mode === 'badge' && level === pulse) return;
    mode = 'badge'; pulse = level;
    ctx.clearRect(0, 0, 512, 352);
    const m = panel.begin();
    m.lineWidth = 1.7;
    m.beginPath(); m.arc(15, 10.5, 5.6, 0, Math.PI * 2); m.stroke();
    panel.flush(.5 + .45 * glow);
    texture.needsUpdate = true;
  };

  /** Show a project on the chest: its poster image if any, else a lime grid and the name. */
  const project = (name: string, image?: string) => new Promise<void>(resolve => {
    mode = `project:${name}`;
    const drawText = () => {
      ctx.fillStyle = '#050605'; ctx.fillRect(0, 0, 512, 352);
      ctx.strokeStyle = 'rgba(217,255,63,.25)'; ctx.lineWidth = 1;
      for (let x = 0; x <= 512; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 352); ctx.stroke(); }
      for (let y = 0; y <= 352; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
      ctx.fillStyle = LIME; ctx.shadowColor = LIME; ctx.shadowBlur = 18;
      ctx.font = '600 40px "JetBrains Mono Variable", ui-monospace, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(name.toUpperCase().slice(0, 18), 256, 176);
      ctx.shadowBlur = 0; ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    };
    if (!image) { drawText(); texture.needsUpdate = true; resolve(); return; }
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (mode !== `project:${name}`) return resolve();
      const scale = Math.max(512 / img.width, 352 / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.clearRect(0, 0, 512, 352);
      ctx.drawImage(img, (512 - w) / 2, (352 - h) / 2, w, h);
      ctx.fillStyle = 'rgba(217,255,63,.06)';
      for (let y = 0; y < 352; y += 4) ctx.fillRect(0, y, 512, 1);
      texture.needsUpdate = true;
      resolve();
    };
    img.onerror = () => { drawText(); texture.needsUpdate = true; resolve(); };
    img.src = image;
  });
  badge(0);
  return { texture, badge, project, reset: () => { mode = ''; pulse = -1; badge(0); }, isProject: () => mode.startsWith('project:'), dispose: () => texture.dispose() };
}
