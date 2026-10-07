/*
 * Otto's voice (v10): opt-in, default OFF. Pre-recorded lines (Voice.astro:
 * <audio preload="none"> with data-src, so nothing is fetched until Sound is
 * turned on). Every [data-sound-toggle] button (the intro's top bar, the
 * hero's HUD chip) switches it; aria-pressed and html[data-sound] follow.
 * The choice is remembered for the session (sessionStorage omar-sound).
 * Turning it on is the user gesture that unlocks audio: the toggle's lines
 * (data-sound-lines, e.g. "intro yes") are attached and, still inside the
 * click, played muted and paused, so a later timed play (INTRO, ≈ 0.9 s into
 * ASK) is allowed on Safari too.
 * play(): one line at a time (a new line fades the current one out first),
 * a short volume fade in, volume 0.8; failures are silent (the captions,
 * which the callers show, stay). release(): fade a line out once its words
 * are over (YES over the light gate). Reduced motion does not affect sound;
 * the lite tier plays it too.
 */
export type Line = 'intro' | 'yes' | 'hello' | 'thanks';
type Info = { duration: number; speech: [number, number]; text: string };

const KEY = 'omar-sound';
const VOLUME = .8;
const root = document.documentElement;
const els = new Map<string, HTMLAudioElement>();
document.querySelectorAll<HTMLAudioElement>('audio[data-voice-line]').forEach(el => els.set(el.dataset.voiceLine!, el));
const listeners = new Set<(on: boolean) => void>();
let on = false;
try { on = sessionStorage.getItem(KEY) === '1'; } catch { /* storage blocked: off */ }
let current: HTMLAudioElement | null = null;
let fadeTimer = 0;

export const info = (line: Line): Info | null => {
  const el = els.get(line);
  try { return el ? JSON.parse(el.dataset.info || 'null') as Info : null; } catch { return null; }
};
export const isOn = () => on;
export const available = () => els.size > 0;
export const onChange = (fn: (on: boolean) => void) => { listeners.add(fn); };

/** Set the source (once) and start fetching. */
export function prepare(lines: Line[]) {
  for (const line of lines) {
    const el = els.get(line);
    if (!el || el.dataset.attached !== undefined) continue;
    el.dataset.attached = '';
    el.src = el.dataset.src!;
    el.preload = 'auto';
    el.load();
  }
}

/** Ramp the volume of `el` to `to` over `ms` (no clicks), then `done`. */
function ramp(el: HTMLAudioElement, to: number, ms: number, done?: () => void) {
  window.clearInterval(Number(el.dataset.ramp || 0));
  const from = el.volume, start = performance.now();
  const id = window.setInterval(() => {
    const t = Math.min(1, (performance.now() - start) / ms);
    try { el.volume = from + (to - from) * t; } catch { /* read-only volume (iOS) */ }
    if (t >= 1) { window.clearInterval(id); done?.(); }
  }, 16);
  el.dataset.ramp = String(id);
}

/** Stop whatever is speaking (a short fade). */
export function stop(ms = 140) {
  window.clearTimeout(fadeTimer);
  const el = current;
  current = null;
  if (!el) return;
  delete el.dataset.live;
  ramp(el, 0, ms, () => { if (!el.dataset.live) { el.pause(); try { el.currentTime = 0; } catch { /* not seekable */ } } });
}

/** Speak a line (only with Sound on). Resolves true once it plays. */
export function play(line: Line): Promise<boolean> {
  const el = els.get(line);
  if (!on || !el) return Promise.resolve(false);
  if (current && current !== el) stop();
  window.clearTimeout(fadeTimer);
  prepare([line]);
  current = el;
  el.dataset.live = '';
  el.dataset.started = String(performance.now());
  el.muted = false;
  try { el.volume = 0; } catch { /* read-only */ }
  try { if (el.currentTime > 0) el.currentTime = 0; } catch { /* not seekable yet */ }
  return el.play().then(() => {
    if (current !== el) return false;
    ramp(el, VOLUME, 120);
    return true;
  }, () => { if (current === el) { current = null; delete el.dataset.live; } return false; });
}

/** Let a line finish its words, then fade it out (over `ms`). */
export function release(line: Line, ms = 600) {
  const el = els.get(line);
  if (!el || current !== el) return;
  const end = (info(line)?.speech[1] ?? 0) * 1000 + 150;
  const spoken = performance.now() - Number(el.dataset.started || 0);
  window.clearTimeout(fadeTimer);
  fadeTimer = window.setTimeout(() => { if (current === el) stop(ms); }, Math.max(0, end - spoken));
}

function sync() {
  root.dataset.sound = on ? 'on' : 'off';
  document.querySelectorAll<HTMLButtonElement>('[data-sound-toggle]').forEach(button => button.setAttribute('aria-pressed', String(on)));
}

/** Switch Sound (from a toggle's click: the unlocking gesture). */
export function setOn(value: boolean, lines: Line[] = []) {
  on = value;
  try { sessionStorage.setItem(KEY, on ? '1' : '0'); } catch { /* not remembered */ }
  sync();
  if (on) {
    prepare(lines);
    // Unlock inside the gesture: play muted, pause at once (unless a real
    // play() took the element meanwhile).
    for (const line of lines) {
      const el = els.get(line);
      if (!el || el === current) continue;
      el.muted = true;
      el.play().then(() => { if (el !== current) { el.pause(); try { el.currentTime = 0; } catch { /* fine */ } } el.muted = false; }, () => { el.muted = false; });
    }
  } else stop();
  listeners.forEach(fn => fn(on));
}

if (els.size) {
  sync();
  document.querySelectorAll<HTMLButtonElement>('[data-sound-toggle]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => setOn(!on, (button.dataset.soundLines || '').split(' ').filter(Boolean) as Line[]));
  });
}
