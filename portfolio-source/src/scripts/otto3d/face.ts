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
  // A real helmet has no cartoon face: two faint cool-white sensor slits
  // glow behind the black glass. They blink, follow your pointer, narrow
  // when he squints or thinks, and brighten softly while he talks.
  const canvas = canvasOf(768, 231);
  const ctx = canvas.getContext('2d')!;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  let last = '';
  const slit = (cx: number, cy: number, w: number, h: number, alpha: number) => {
    if (h < 1) return;
    ctx.save();
    // Soft outer bloom, then the bright core.
    const halo = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * .9);
    halo.addColorStop(0, `rgba(205,220,240,${.22 * alpha})`);
    halo.addColorStop(1, 'rgba(205,220,240,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(cx - w, cy - w, w * 2, w * 2);
    ctx.shadowColor = `rgba(220,232,250,${.9 * alpha})`; ctx.shadowBlur = 14;
    ctx.fillStyle = `rgba(236,242,252,${.85 * alpha})`;
    ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2); ctx.fill();
    ctx.restore();
  };
  const set = (state: FaceState) => {
    const ex = Math.round(state.lookX * 14), ey = Math.round(state.lookY * 8);
    const open = Math.round((1 - state.blink) * 10) / 10;
    const narrow = state.expression === 'squint' || state.expression === 'think' ? .55 : 1;
    const talk = state.talk > 0 ? Math.round((.5 + .5 * Math.sin(state.time * 14)) * state.talk * 4) / 4 : 0;
    const key = `${ex},${ey},${open},${narrow},${talk},${state.expression}`;
    if (key === last) return false;
    last = key;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const alpha = .62 + .3 * talk;
    const y = 104 + ey + (state.expression === 'think' ? -10 : 0);
    const h = 15 * open * narrow;
    slit(270 + ex, y, 84, h, alpha);
    slit(498 + ex, state.expression === 'confused' ? y + 6 : y, 84, h * (state.expression === 'confused' ? .6 : 1), alpha);
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
  let mode = '';
  let pulse = -1;

  const badge = (glow: number) => {
    const level = Math.round(glow * 10);
    if (mode === 'badge' && level === pulse) return;
    mode = 'badge'; pulse = level;
    // A quiet status display: a dim wordmark and one breathing cool-white dot.
    ctx.clearRect(0, 0, 512, 352);
    ctx.fillStyle = 'rgba(200,210,225,.32)';
    ctx.font = '500 34px "JetBrains Mono Variable", ui-monospace, monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('OTTO · 01', 256, 160);
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
    ctx.save(); ctx.shadowColor = 'rgba(225,235,250,.9)'; ctx.shadowBlur = 16;
    ctx.fillStyle = `rgba(236,242,252,${.35 + .5 * glow})`;
    ctx.beginPath(); ctx.arc(256, 214, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
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
      ctx.fillStyle = 'rgba(255,255,255,.04)';
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
