/*
 * Inside pages v2: Otto's guided tour of one project.
 * - Narration: when a chapter crosses the middle of the viewport, Otto's
 *   line goes into the dock bubble and out as `otto:say`, and he plays
 *   `otto:state` (talk, then the chapter's pose). The same lines are printed
 *   as kickers, so nothing here is needed to read the page.
 * - Arrival: after a hand-off (sessionStorage `otto-handoff`, < 10s old) the
 *   head script has already painted OttoCover and CSS plays the arrival (the
 *   cover collapses into the monitor, Otto flies to his dock). Here the h1
 *   takes focus without scrolling, Otto says "We're in" as he lands, and the
 *   cover is cleared once it's done. Focus is never moved otherwise. The
 *   entrance plays once (html[data-tour-entered]).
 * - "Back to Otto" (and Esc) returns to Otto behind a quick cover shutter:
 *   history when we came straight from the homepage, otherwise a fresh visit
 *   to the homepage (which lifts the same cover: sessionStorage otto-return).
 * - Pause: html[data-motion] + `omar:motion`, remembered for the session.
 *   The concept video only plays with motion on (previews.ts does the rest).
 *   With reduced motion nothing on the page moves, so there's no toggle.
 * - The dock (data-bubble-owner="page") gets its bubble text from here; a
 *   3D Otto, if otto-stage.ts mounts one, only hears `otto:say`/`otto:state`.
 */
type Pose = 'idle' | 'wave' | 'talk' | 'think' | 'confused' | 'cheeky' | 'point' | 'pew';

const ARRIVE_SAY = 700;
const ENTRANCE = 1500;
/* The CSS arrival (OttoCover.astro): Otto lands in his dock at ~0.82 s; all over by 0.9 s. */
const LANDED = 840;
const ARRIVAL_DONE = 1400;
const STILL_DONE = 350;
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
  if (toggle) toggle.hidden = reduce.matches;
  const label = toggle?.querySelector('[data-inside-motion-label]');
  if (label) label.textContent = paused ? 'Play motion' : 'Pause motion';
  toggle?.querySelector('[data-inside-motion-icon]')?.setAttribute('d', paused ? 'M5 3l8 5-8 5z' : 'M4 3h3v10H4zm5 0h3v10H9z');
  /* previews.ts treats an inactive [data-pane-item] as "do not play". */
  media?.toggleAttribute('data-active', motionOn());
  document.dispatchEvent(new Event('previews:update'));
}
/* Once the entrance is over (or the visitor has touched the switch) it never replays. */
const entered = () => { root.dataset.tourEntered = ''; };
const portal = root.dataset.arrive === 'portal';
window.setTimeout(entered, portal ? ARRIVAL_DONE : ENTRANCE);
if (toggle) {
  toggle.hidden = reduce.matches;
  toggle.addEventListener('click', () => {
    entered();
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
const arrived = () => handoff || portal;
const cover = document.querySelector<HTMLElement>('[data-otto-cover]');
/* The CSS arrival hides the cover itself (even if this script is late); this
   only tidies up once it's over, so it can be reused for "Back to Otto". */
const clearArrival = () => { if (root.dataset.arrive === 'portal') delete root.dataset.arrive; };
if (portal) window.setTimeout(clearArrival, motionOn() ? ARRIVAL_DONE : STILL_DONE);
window.addEventListener('pageswap', () => { entered(); clearArrival(); });

/* ---- Back to Otto ----------------------------------------------------- */
/* History only when the previous page is Otto's (the homepage); from anywhere
   else (another tour, /work.html via the command menu) start a fresh visit. */
const referrer = (() => { try { return document.referrer ? new URL(document.referrer) : null; } catch { return null; } })();
const fromOtto = !!referrer && referrer.origin === location.origin && (referrer.pathname === '/' || referrer.pathname === '/index.html');
const canGoBack = fromOtto && history.length > 1;
/* The cover comes down ("Back to Otto"), then we leave; the homepage lifts it. */
let leaving = false;
const goBack = () => {
  if (leaving) return;
  leaving = true;
  const go = () => { if (canGoBack) history.back(); else location.href = '/index.html'; };
  if (!cover) return go();
  clearArrival();
  cover.dataset.kind = 'back';
  const text = (key: string, value: string) => { const node = cover.querySelector(`[data-cover-${key}]`); if (node) node.textContent = value; };
  text('path', 'otto://home'); text('kicker', 'Back to'); text('name', 'Otto'); text('status', 'Returning to Otto');
  cover.dataset.state = 'back';
  session.set('otto-return', JSON.stringify({ t: Date.now() }));
  window.setTimeout(go, motionOn() ? 300 : 170);
};
document.querySelectorAll<HTMLAnchorElement>('[data-inside-back]').forEach(link => link.addEventListener('click', event => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  goBack();
}));
/* Back here from the next page (bfcache): lift the cover so the tour is usable again. */
window.addEventListener('pageshow', event => {
  if (!event.persisted || !leaving) return;
  leaving = false;
  cover?.removeAttribute('data-state');
});
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
  /* Written after the event, so the full line wins over any other listener. */
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
  /* After a hand-off Otto speaks as he lands in his dock ("We're in."). */
  window.setTimeout(() => {
    chapters.forEach(chapter => band.observe(chapter));
    window.addEventListener('scroll', schedule, { passive: true });
  }, portal && motionOn() ? LANDED : ARRIVE_SAY);

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
