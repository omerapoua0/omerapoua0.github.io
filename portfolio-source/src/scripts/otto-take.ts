/*
 * Taking Otto's hand: one continuous move from the homepage into a tour that
 * never relies on view transitions. Loaded by otto-handoff.ts when Otto
 * offers his hand (so it isn't first-load weight), run when the visitor takes it:
 *   1. the button squeezes into his hand (ripple, a short vibration where
 *      supported); Otto grips (fingers curl) and pulls;
 *   2. 3D: the camera dives into his chest screen ("ENTERING <NAME>"), and at
 *      `otto:handoff-done {rect}` OttoCover takes over from that rectangle;
 *      SVG: Otto zooms toward you and a lime iris opens from his chest badge;
 *   3. once the cover is fully opaque (and painted) we navigate. The tour
 *      paints the identical cover at first paint (Base.astro head script) and
 *      plays the arrival, so paint holding bridges the page change.
 * Reduced motion or Pause: no squeeze, dive or zoom, a 180 ms cover fade.
 * If this page comes back from the bfcache, the cover lifts as a shutter.
 */
const DIVE_FALLBACK = 1150; // 3D: the chest hand-over normally comes at ~0.8 s
const SQUEEZE = 240;
const GRIP = 150;
const PULL = 210;
type Rect = { left: number; top: number; right: number; bottom: number };
type Lines = { path: string; kicker: string; name: string; status: string };
const emit = (name: string, detail: Record<string, unknown> = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
const sleep = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));
const px = (value: number) => `${Math.round(value * 10) / 10}px`;
// A couple of painted frames (capped, since a hidden tab runs no frames).
const frames = (count = 2) => Promise.race([sleep(120), new Promise<void>(resolve => {
  const step = () => (--count <= 0 ? resolve() : requestAnimationFrame(step));
  requestAnimationFrame(step);
})]);
const waitFor = <T>(name: string, ms: number) => new Promise<T | null>(resolve => {
  const done = (value: T | null) => { window.removeEventListener(name, on); window.clearTimeout(timer); resolve(value); };
  const on = (event: Event) => done((event as CustomEvent<T>).detail);
  const timer = window.setTimeout(() => done(null), ms);
  window.addEventListener(name, on);
});

/** OttoCover's lines: where we're going. */
function label(cover: HTMLElement, lines: Lines) {
  Object.entries(lines).forEach(([key, value]) => { const node = cover.querySelector(`[data-cover-${key}]`); if (node) node.textContent = value; });
}

/** Fill OttoCover with the project; it stays hidden until a data-state is set. */
function prepareCover(id: string, info: { name: string; media?: string }) {
  const cover = document.querySelector<HTMLElement>('[data-otto-cover]');
  if (!cover) return null;
  label(cover, { path: `otto://inside/${id}`, kicker: 'Inside', name: info.name, status: `Entering ${info.name}` });
  cover.dataset.kind = 'project';
  // Cover exactly what the visitor sees. A fixed inset: 0 box follows the layout
  // viewport, which a phone widens when something overflows sideways; the tour
  // paints its cover over its own viewport, so the two must match.
  const view = window.visualViewport;
  const off = !!view && (Math.abs(view.width - innerWidth) > 1 || Math.abs(view.height - innerHeight) > 1 || !!view.offsetLeft || !!view.offsetTop);
  cover.style.inset = off && view ? `${view.offsetTop}px auto auto ${view.offsetLeft}px` : '';
  cover.style.width = off && view ? `${view.width}px` : '';
  cover.style.height = off && view ? `${view.height}px` : '';
  if (info.media) cover.style.setProperty('--img', `url("${info.media}")`); else cover.style.removeProperty('--img');
  cover.removeAttribute('data-state');
  return cover;
}

/** Grow the cover from a rectangle (3D chest screen) or a circle (SVG badge iris). */
function grow(cover: HTMLElement, from: { rect?: Rect; circle?: { x: number; y: number; r: number } }) {
  const box = cover.getBoundingClientRect();
  const W = box.width || innerWidth, H = box.height || innerHeight;
  const set = (name: string, value: string) => cover.style.setProperty(name, value);
  let ms = 340;
  if (from.circle) {
    const { r } = from.circle;
    const x = from.circle.x - box.left, y = from.circle.y - box.top; // into the cover's own box
    const R = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) + 2;
    const s = 1.2; // the world inside rushes toward you a little as the iris opens
    set('--clip-from', `circle(${px(r)} at ${px(x)} ${px(y)})`);
    set('--clip-to', `circle(${px(R)} at ${px(x)} ${px(y)})`);
    set('--inner-from', `translate(${px((1 - s) * (x - W / 2))}, ${px((1 - s) * (y - H / 2))}) scale(${s})`);
    set('--i0-x', px(x - r)); set('--i0-y', px(y - r)); set('--i0-d', px(2 * r));
    set('--i1-x', px(x - R)); set('--i1-y', px(y - R)); set('--i1-d', px(2 * R));
    cover.dataset.iris = '';
    ms = 420;
    set('--grow-ease', 'cubic-bezier(.55, 0, .3, 1)');
  } else {
    cover.removeAttribute('data-iris');
    // Default: a chest-sized window in the middle of the screen.
    const r = from.rect ?? { left: W / 2 - 90, top: H / 2 - 60, right: W / 2 + 90, bottom: H / 2 + 60 };
    const w = Math.max(8, r.right - r.left), h = Math.max(6, r.bottom - r.top);
    const k = Math.max(w / W, h / H);
    set('--clip-from', `inset(${px(r.top - box.top)} ${px(box.right - r.right)} ${px(box.bottom - r.bottom)} ${px(r.left - box.left)} round ${px(Math.min(14, w * .06))})`);
    set('--clip-to', 'inset(0px 0px 0px 0px round 0px)');
    set('--inner-from', `translate(${px(r.left + w / 2 - box.left - W / 2)}, ${px(r.top + h / 2 - box.top - H / 2)}) scale(${k.toFixed(4)})`);
    set('--grow-ease', 'cubic-bezier(.45, 0, .2, 1)');
  }
  set('--grow-ms', `${ms}ms`);
  cover.dataset.state = 'grow';
  // Done when the window has really finished opening (a late first frame
  // delays it), with a cap in case animation events never come.
  const win = cover.querySelector('.otto-cover__win');
  return new Promise<void>(resolve => {
    const done = () => { win?.removeEventListener('animationend', onEnd); window.clearTimeout(cap); resolve(); };
    const onEnd = (event: Event) => { if ((event as AnimationEvent).animationName === 'cover-clip') done(); };
    const cap = window.setTimeout(done, ms + 400);
    win?.addEventListener('animationend', onEnd);
  });
}

/** SVG take: grip, pull, then zoom toward the viewer around his chest badge. */
async function svgTake(robot: HTMLElement | null) {
  emit('otto:state', { state: 'grab' });
  await sleep(GRIP);
  emit('otto:state', { state: 'pull' });
  await sleep(PULL);
  const badge = robot?.querySelector('.robot__badge')?.getBoundingClientRect();
  robot?.setAttribute('data-dive', '');
  await sleep(60);
  return badge && badge.width ? { x: badge.left + badge.width / 2, y: badge.top + badge.height / 2, r: badge.width * .62 } : undefined;
}

export async function take(o: { id: string; info: { name: string; media?: string }; offer: HTMLElement; robot: HTMLElement | null; threeD: boolean; moving: boolean; target: string }) {
  const { id, info, offer, robot, threeD, moving } = o;
  (navigator as Navigator & { vibrate?: (pattern: number | number[]) => boolean }).vibrate?.([12, 40, 18]);
  const cover = prepareCover(id, info);
  const chestWait = threeD && moving ? waitFor<{ rect?: Rect }>('otto:handoff-done', DIVE_FALLBACK) : null;
  offer.dataset.take = '';
  emit('otto:handoff', { phase: 'take', id, name: info.name, media: info.media });
  const svg = !threeD && moving ? svgTake(robot) : null;
  if (!threeD && !moving) emit('otto:state', { state: 'grab' });
  const squeezed = sleep(moving ? SQUEEZE : 0).then(() => { offer.hidden = true; });
  if (cover) {
    if (!moving) { cover.dataset.state = 'fade'; await sleep(200); }
    else if (threeD) { const done = await chestWait; await grow(cover, { rect: done?.rect }); }
    else { const circle = await svg; await grow(cover, circle ? { circle } : {}); }
    cover.dataset.state = 'on';
  } else if (svg) await svg;
  await squeezed;
  try {
    sessionStorage.setItem('otto-handoff', JSON.stringify({ id, t: Date.now() }));
    sessionStorage.setItem('otto-inside', id);
  } catch { /* storage unavailable */ }
  await frames(2); // the opaque cover is on screen before the page changes
  emit('otto:navigate', { id });
  location.assign(o.target);
}

// Off to a tour: if this page is restored (bfcache), its cover says where we're back to…
addEventListener('pagehide', event => {
  const cover = document.querySelector<HTMLElement>('[data-otto-cover][data-state]');
  if (!cover || !event.persisted) return;
  label(cover, { path: 'otto://home', kicker: 'Back to', name: 'Otto', status: 'Returning to Otto' });
  cover.dataset.kind = 'back';
});
// …and lifts like a shutter.
addEventListener('pageshow', event => {
  const cover = document.querySelector<HTMLElement>('[data-otto-cover][data-state]');
  if (!cover || !event.persisted) return;
  cover.dataset.state = 'leave';
  window.setTimeout(() => { if (cover.dataset.state === 'leave') cover.removeAttribute('data-state'); }, 800);
});
