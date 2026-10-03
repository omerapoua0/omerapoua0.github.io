/*
 * Otto's faces, drawn on canvases used as textures: the visor (eyes + an
 * equaliser mouth) and the chest screen (an "O" badge, or a project poster
 * during the hand-off). Redraws only when something visible changed.
 */
import { CanvasTexture, SRGBColorSpace } from 'three';

export type Expression = 'neutral' | 'happy' | 'wink' | 'confused' | 'think' | 'squint';
export type FaceState = { lookX: number; lookY: number; blink: number; expression: Expression; talk: number; time: number };

const LIME = '#d9ff3f';
const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
};

export function createFace() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 308;
  const ctx = canvas.getContext('2d')!;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  let last = '';

  const eye = (cx: number, cy: number, open: number, kind: 'open' | 'happy' | 'squint') => {
    ctx.save();
    ctx.shadowColor = LIME; ctx.shadowBlur = 22;
    ctx.fillStyle = LIME; ctx.strokeStyle = LIME;
    if (kind === 'happy') {
      ctx.lineWidth = 15; ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy + 22, 34, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
    } else {
      const h = Math.max(8, 96 * open * (kind === 'squint' ? .45 : 1));
      roundRect(ctx, cx - 33, cy - h / 2, 66, h, 28);
      ctx.fill();
      if (h > 40) { // a little glint keeps the eyes alive
        ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,.85)';
        ctx.beginPath(); ctx.arc(cx + 12, cy - h * .22, 7, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  };

  const set = (state: FaceState) => {
    const ex = Math.round(state.lookX * 16), ey = Math.round(state.lookY * 12);
    const bars = state.talk > 0 ? [0, 1, 2, 3, 4].map(i => Math.round(6 + 24 * state.talk * (.5 + .5 * Math.sin(state.time * 22 + i * 1.7)))) : [];
    const dots = state.expression === 'think' ? Math.floor(state.time * 3) % 4 : 0;
    const key = `${ex},${ey},${state.blink.toFixed(2)},${state.expression},${bars.join('-')},${dots}`;
    if (key === last) return false;
    last = key;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // A soft glass reflection across the top-left of the visor.
    const sheen = ctx.createLinearGradient(0, 0, 220, 300);
    sheen.addColorStop(0, 'rgba(255,255,255,.11)');
    sheen.addColorStop(.45, 'rgba(255,255,255,.04)');
    sheen.addColorStop(.46, 'rgba(255,255,255,0)');
    ctx.fillStyle = sheen;
    roundRect(ctx, 6, 6, 500, 296, 70);
    ctx.fill();
    const open = 1 - state.blink;
    const lx = 160 + ex, rx = 352 + ex, y = 132 + ey;
    switch (state.expression) {
      case 'happy': eye(lx, y, 1, 'happy'); eye(rx, y, 1, 'happy'); break;
      case 'wink': eye(lx, y, 1, 'happy'); eye(rx, y, open, 'open'); break;
      case 'squint': eye(lx, y, open, 'squint'); eye(rx, y, open, 'squint'); break;
      case 'confused':
        eye(lx, y, open, 'open'); eye(rx, y, open * .5, 'open');
        ctx.save(); ctx.fillStyle = LIME; ctx.shadowColor = LIME; ctx.shadowBlur = 16; ctx.font = '700 64px system-ui, sans-serif'; ctx.fillText('?', 432, 76); ctx.restore();
        break;
      case 'think':
        eye(lx + 10, y - 10, open * .8, 'open'); eye(rx + 10, y - 10, open * .8, 'open');
        ctx.save(); ctx.fillStyle = LIME; ctx.shadowColor = LIME; ctx.shadowBlur = 12;
        for (let i = 0; i < 3; i++) { ctx.globalAlpha = i < dots ? 1 : .25; ctx.beginPath(); ctx.arc(226 + i * 30, 262, 8, 0, Math.PI * 2); ctx.fill(); }
        ctx.restore();
        break;
      default: eye(lx, y, open, 'open'); eye(rx, y, open, 'open');
    }
    if (bars.length) {
      ctx.save(); ctx.fillStyle = LIME; ctx.shadowColor = LIME; ctx.shadowBlur = 12;
      bars.forEach((h, i) => { roundRect(ctx, 211 + i * 20, 258 - h / 2, 10, h, 5); ctx.fill(); });
      ctx.restore();
    } else if (state.expression === 'happy' || state.expression === 'wink' || state.expression === 'neutral') {
      ctx.save(); ctx.strokeStyle = LIME; ctx.shadowColor = LIME; ctx.shadowBlur = 12; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath();
      if (state.expression === 'neutral') ctx.arc(256, 238, 26, Math.PI * .2, Math.PI * .8);
      else ctx.arc(256, 226, 40, Math.PI * .15, Math.PI * .85);
      ctx.stroke(); ctx.restore();
    }
    texture.needsUpdate = true;
    return true;
  };
  return { texture, set, dispose: () => texture.dispose() };
}

export function createChest() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 352;
  const ctx = canvas.getContext('2d')!;
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  let mode = '';
  let pulse = -1;

  const badge = (glow: number) => {
    const level = Math.round(glow * 10);
    if (mode === 'badge' && level === pulse) return;
    mode = 'badge'; pulse = level;
    ctx.fillStyle = '#050605'; ctx.fillRect(0, 0, 512, 352);
    ctx.strokeStyle = 'rgba(217,255,63,.07)'; ctx.lineWidth = 1;
    for (let y = 0; y < 352; y += 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
    ctx.save();
    ctx.globalAlpha = .45 + .35 * glow;
    ctx.strokeStyle = LIME; ctx.shadowColor = LIME; ctx.shadowBlur = 24; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.arc(256, 176, 72, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
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
      ctx.drawImage(img, (512 - w) / 2, (352 - h) / 2, w, h);
      ctx.fillStyle = 'rgba(217,255,63,.08)';
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
