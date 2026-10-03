/*
 * Inside pages v2: Otto's guided tour of one project.
 * - Narration: when a chapter crosses the middle of the viewport, Otto's
 *   line goes into the dock bubble and out as `otto:say`, and he plays
 *   `otto:state` (talk, then the chapter's pose). The same lines are printed
 *   as kickers, so nothing here is needed to read the page.
 * - Arrival: after a hand-off (sessionStorage `otto-handoff`, < 10s old) the
 *   h1 takes focus without scrolling and Otto says "We're in". Focus is never
 *   moved otherwise.
 * - "Back to Otto" (and Esc) returns to Otto: history when we came from a
 *   same-origin page that isn't another tour, otherwise the homepage.
 * - Pause: html[data-motion] + `omar:motion`, remembered for the session.
 *   The concept video only plays with motion on (previews.ts does the rest).
 */
type Pose = 'idle' | 'wave' | 'talk' | 'think' | 'confused' | 'cheeky' | 'point' | 'pew';

const ARRIVE_SAY = 700;
const NARRATE = 900;
const POSE_HOLD = 1600;
const BUBBLE_HIDE = 3200;
const HANDOFF_MAX_AGE = 10000;

const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const compact = window.matchMedia('(max-width: 1023px)');
const motionOn = () => !reduce.matches && root.dataset.motion !== 'off';
const session = {
  get(key: string) { try { return sessionStorage.getItem(key); } catch { return null; } },
  set(key: string, value: string) { try { sessionStorage.setItem(key, value); } catch { /* storage unavailable */ } },
  remove(key: string) { try { sessionStorage.removeItem(key); } catch { /* storage unavailable */ } },
};

/* ---- Motion switch ---------------------------------------------------- */
if (!root.dataset.motion) {
  const saved = session.get('omar-motion');
  if (saved === 'on' || saved === 'off') root.dataset.motion = saved;
  else if (reduce.matches) root.dataset.motion = 'off';
}
const toggle = document.querySelector<HTMLButtonElement>('[data-inside-motion]');
const media = document.querySelector<HTMLElement>('[data-tour-media]');
function syncMotion() {
  const paused = root.dataset.motion === 'off';
  const label = toggle?.querySelector('[data-inside-motion-label]');
  if (label) label.textContent = paused ? 'Play motion' : 'Pause motion';
  toggle?.querySelector('[data-inside-motion-icon]')?.setAttribute('d', paused ? 'M5 3l8 5-8 5z' : 'M4 3h3v10H4zm5 0h3v10H9z');
  /* previews.ts treats an inactive [data-pane-item] as "do not play". */
  media?.toggleAttribute('data-active', motionOn());
  document.dispatchEvent(new Event('previews:update'));
}
if (toggle) {
  toggle.hidden = false;
  toggle.addEventListener('click', () => {
    const next = root.dataset.motion === 'off' ? 'on' : 'off';
    root.dataset.motion = next;
    session.set('omar-motion', next);
    window.dispatchEvent(new Event('omar:motion'));
  });
}
window.addEventListener('omar:motion', syncMotion);
reduce.addEventListener('change', syncMotion);
syncMotion();
root.dataset.tourReady = '';

/* ---- Arrival ---------------------------------------------------------- */
const handoff = (() => {
  const raw = session.get('otto-handoff');
  if (raw === null) return false;
  session.remove('otto-handoff');
  let t = Number.NaN;
  try {
    const value: unknown = JSON.parse(raw);
    t = typeof value === 'number' ? value : Number((value as { t?: unknown } | null)?.t);
  } catch { t = Number(raw); }
  const age = Date.now() - t;
  return Number.isFinite(age) && age >= 0 && age < HANDOFF_MAX_AGE;
})();
if (handoff) document.querySelector<HTMLElement>('#tour-title')?.focus({ preventScroll: true });
const arrived = () => handoff || root.dataset.arrive === 'portal' || root.classList.contains('arrive-css');

/* ---- Back to Otto ----------------------------------------------------- */
const referrer = (() => { try { return document.referrer ? new URL(document.referrer) : null; } catch { return null; } })();
const canGoBack = !!referrer && referrer.origin === location.origin && !referrer.pathname.startsWith('/inside/') && history.length > 1;
const goBack = () => { if (canGoBack) history.back(); else location.href = '/index.html'; };
document.querySelectorAll<HTMLAnchorElement>('[data-inside-back]').forEach(link => link.addEventListener('click', event => {
  if (!canGoBack || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  history.back();
}));
/* Capture phase, so an open menu sheet (closed by site.ts on Esc) is still seen as open. */
window.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
  if (document.querySelector('dialog[open], [aria-modal="true"]') || document.querySelector('[data-menu][aria-expanded="true"]')) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
  goBack();
}, true);

/* ---- Narration -------------------------------------------------------- */
const chapters = [...document.querySelectorAll<HTMLElement>('[data-chapter]')];
const bubble = document.querySelector<HTMLElement>('[data-otto-bubble]');
const dock = document.querySelector<HTMLElement>('[data-otto-stage]');
const rail = document.querySelector<HTMLElement>('[data-rail] ol');
const railLinks = [...document.querySelectorAll<HTMLAnchorElement>('[data-rail] a')];
const counter = document.querySelector<HTMLElement>('[data-tour-counter]');
let active = -1;
let poseTimer = 0;
let hideTimer = 0;

const state = (pose: Pose, ms: number) => window.dispatchEvent(new CustomEvent('otto:state', { detail: { state: pose, ms } }));
function say(text: string) {
  window.dispatchEvent(new CustomEvent('otto:say', { detail: { text } }));
  if (!bubble) return;
  bubble.textContent = text;
  bubble.removeAttribute('data-show');
  void bubble.offsetWidth; // restart the pop-in
  bubble.setAttribute('data-show', '');
  window.clearTimeout(hideTimer);
  if (compact.matches) hideTimer = window.setTimeout(() => bubble.removeAttribute('data-show'), BUBBLE_HIDE);
}

function activate(index: number) {
  if (index === active || !chapters[index]) return;
  active = index;
  const chapter = chapters[index];
  const steps = chapters.length - 1;
  railLinks.forEach((link, i) => {
    if (i + 1 === index) link.setAttribute('aria-current', 'step'); else link.removeAttribute('aria-current');
    link.toggleAttribute('data-done', i + 1 < index);
  });
  rail?.style.setProperty('--progress', String(Math.max(0, index - 1) / Math.max(1, steps - 1)));
  if (counter) counter.textContent = String(index).padStart(2, '0');

  const line = index === 0 && arrived() ? chapter.dataset.ottoLineArrive : chapter.dataset.ottoLine;
  if (line) say(line);
  const pose = (chapter.dataset.ottoPose || 'talk') as Pose;
  window.clearTimeout(poseTimer);
  state('talk', NARRATE);
  if (pose !== 'talk') poseTimer = window.setTimeout(() => state(pose, POSE_HOLD), NARRATE);
}

if (chapters.length && 'IntersectionObserver' in window) {
  /* A thin band across the middle of the viewport decides the chapter. */
  const inBand = new Set<Element>();
  let settle = 0;
  const pick = () => {
    settle = 0;
    const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;
    const current = chapters.filter(chapter => inBand.has(chapter)).pop();
    if (current) activate(chapters.indexOf(current));
    else if (atEnd) activate(chapters.length - 1);
  };
  let first = true;
  const schedule = () => {
    window.clearTimeout(settle);
    if (first) { first = false; pick(); } else settle = window.setTimeout(pick, 160);
  };
  const band = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) inBand.add(entry.target); else inBand.delete(entry.target); });
    schedule();
  }, { rootMargin: '-45% 0px -45% 0px' });
  window.setTimeout(() => {
    chapters.forEach(chapter => band.observe(chapter));
    window.addEventListener('scroll', schedule, { passive: true });
  }, ARRIVE_SAY);

  /* Chapters rise in once, as they arrive. */
  const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    reveal.unobserve(entry.target);
  }), { threshold: .08, rootMargin: '0px 0px -8% 0px' });
  chapters.slice(1).forEach(chapter => reveal.observe(chapter));
} else chapters.forEach(chapter => chapter.classList.add('is-in'));

/* Phone: Otto steps aside when the footer arrives, so its links stay clear. */
const footer = document.querySelector('footer');
if (dock && footer && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => dock.toggleAttribute('data-away', entry.isIntersecting && compact.matches)).observe(footer);
}
compact.addEventListener('change', () => {
  if (!compact.matches) { dock?.removeAttribute('data-away'); bubble?.setAttribute('data-show', ''); }
});

export {};
