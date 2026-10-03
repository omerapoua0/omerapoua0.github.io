/*
 * The hand-off: Otto offers his hand to take the visitor inside a project.
 * Shows a real "Take Otto's hand" button (plus "Stay here") next to his palm,
 * runs a short countdown when motion is on, then plays the grab and pull, opens
 * a portal out of his chest screen and navigates to /inside/<id>.html. The
 * portal shares view-transition-name "portal" with the inside page's monitor,
 * so supporting browsers morph one into the other.
 *   handoff(id, { name, media }) → Promise<'take' | 'stay'>
 * The countdown only runs for pointer visitors with motion on; it holds while
 * the offer is hovered, Stay is focused, Take has keyboard focus, a dialog is
 * open or the tab is hidden. Keyboard and reduced-motion visitors always
 * choose for themselves.
 */
const COUNTDOWN = 4000;
const OFFER_FALLBACK = 900;
const DONE_FALLBACK = 1300;
const root = document.documentElement;
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.motion === 'off';
const emit = (name: string, detail: Record<string, unknown> = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
const waitFor = <T>(name: string, ms: number) => new Promise<T | null>(resolve => {
  const done = (value: T | null) => { window.removeEventListener(name, on); window.clearTimeout(timer); resolve(value); };
  const on = (event: Event) => done((event as CustomEvent<T>).detail);
  const timer = window.setTimeout(() => done(null), ms);
  window.addEventListener(name, on);
});
const dimmed = (hero: HTMLElement) => [...hero.querySelectorAll<HTMLElement>('.agent__intro, [data-chat]')];

let active = false;
// The open offer's resolver, so leaving the page (or a bfcache restore) can settle it as "stay".
let pending: ((value: 'take' | 'stay') => void) | null = null;

export async function handoff(id: string, info: { name: string; media?: string }): Promise<'take' | 'stay'> {
  const stage = document.querySelector<HTMLElement>('[data-otto-stage][data-stage-mode="hero"]');
  const hero = stage?.closest<HTMLElement>('[data-hero]');
  const offer = stage?.querySelector<HTMLElement>('[data-otto-offer]');
  const target = `/inside/${id}.html`;
  if (!stage || !hero || !offer || active) { location.assign(target); return 'take'; }
  active = true;
  const take = offer.querySelector<HTMLButtonElement>('[data-offer-take]')!;
  const stay = offer.querySelector<HTMLButtonElement>('[data-offer-stay]')!;
  const status = offer.querySelector<HTMLElement>('[data-offer-status]')!;
  const ring = offer.querySelector<HTMLElement>('[data-offer-ring]');
  const is3d = () => stage.dataset.mode === '3d';

  // Bring the stage into view and let Otto come forward.
  const box = stage.getBoundingClientRect();
  const visible = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0)) / Math.max(1, box.height);
  if (visible < .6) stage.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'center' });
  const opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
  opener?.blur();
  hero.dataset.handoff = 'offer';
  dimmed(hero).forEach(node => { node.inert = true; });
  try { new Image().src = info.media ?? ''; } catch { /* no media */ }
  const prefetch = document.createElement('link');
  prefetch.rel = 'prefetch'; prefetch.href = target;
  document.head.append(prefetch);
  // Listen before emitting: a still 3D Otto reports his palm synchronously.
  const palmWait = is3d() ? waitFor<{ x: number; y: number }>('otto:palm', OFFER_FALLBACK) : Promise.resolve(null);
  emit('otto:handoff', { phase: 'offer', id, name: info.name, media: info.media });
  if (!is3d()) emit('otto:state', { state: 'point' });
  const palm = await palmWait;

  const counting = !still();
  take.setAttribute('aria-label', `Take Otto’s hand: open the ${info.name} tour`);
  status.textContent = counting
    ? `Otto is offering his hand to show you ${info.name}. He’ll take you in about 4 seconds unless you choose Stay here or press Escape.`
    : `Otto is offering his hand to show you ${info.name}. Take his hand, or choose Stay here.`;
  offer.hidden = false;
  const stageBox = stage.getBoundingClientRect();
  if (palm && innerWidth >= 720) {
    const x = Math.min(Math.max(palm.x - stageBox.left + 24, 16), stageBox.width - offer.offsetWidth - 16);
    const y = Math.min(Math.max(palm.y - stageBox.top - offer.offsetHeight / 2, 16), stageBox.height - offer.offsetHeight - 16);
    offer.style.setProperty('--ox', `${x}px`);
    offer.style.setProperty('--oy', `${y}px`);
    offer.dataset.anchor = 'palm';
  } else offer.dataset.anchor = 'dock';
  take.focus({ preventScroll: true });
  // Make sure both choices are actually on screen (short phones, deep links).
  const header = document.querySelector<HTMLElement>('.site-header, header')?.getBoundingClientRect().bottom ?? 0;
  const offerBox = offer.getBoundingClientRect();
  if (offerBox.bottom > innerHeight - 8 || offerBox.top < header) offer.scrollIntoView({ block: 'nearest', behavior: still() ? 'auto' : 'smooth' });

  const choice = await new Promise<'take' | 'stay'>(resolve => {
    let elapsed = 0, last = performance.now(), raf = 0;
    const sync = () => offer.toggleAttribute('data-counting', counting && !still());
    sync();
    const finish = (value: 'take' | 'stay') => {
      if (pending !== finish) return;
      pending = null;
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('omar:motion', sync);
      take.removeEventListener('click', onTake); stay.removeEventListener('click', onStay);
      resolve(value);
    };
    pending = finish;
    const onTake = () => finish('take');
    const onStay = () => finish('stay');
    // Escape means "stay" unless something else (the command menu, the mobile menu) is using it.
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog[open]') || document.querySelector('[data-menu][aria-expanded="true"]')) return;
      event.preventDefault();
      finish('stay');
    };
    take.addEventListener('click', onTake); stay.addEventListener('click', onStay);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('omar:motion', sync);
    const tick = (now: number) => {
      const hold = still() || document.hidden || offer.matches(':hover') || stay.matches(':focus') || take.matches(':focus-visible') || !!document.querySelector('dialog[open]');
      if (!hold) elapsed += Math.min(now - last, 100); // a hidden tab or a long frame never counts
      last = now;
      ring?.style.setProperty('--p', String(Math.min(1, elapsed / COUNTDOWN)));
      if (elapsed >= COUNTDOWN) return finish('take');
      raf = requestAnimationFrame(tick);
    };
    if (counting) raf = requestAnimationFrame(tick);
  });

  offer.hidden = true;
  offer.removeAttribute('data-counting');
  ring?.style.setProperty('--p', '0');
  if (choice === 'stay') {
    hero.removeAttribute('data-handoff');
    dimmed(hero).forEach(node => { node.inert = false; });
    emit('otto:handoff', { phase: 'cancel', id });
    status.textContent = '';
    // Focus goes back where the visitor was (the chat log on touch screens, so no keyboard pops up).
    const touch = window.matchMedia('(pointer: coarse)').matches;
    const back = opener?.isConnected && !(touch && opener.matches('input, textarea')) ? opener : hero.querySelector<HTMLElement>('[data-chat-log]');
    back?.focus({ preventScroll: true });
    active = false;
    return 'stay';
  }

  // Take: grab, pull, dive through the chest screen, open the portal, go.
  hero.dataset.handoff = 'take';
  (navigator as Navigator & { vibrate?: (ms: number) => boolean }).vibrate?.(12);
  const doneWait = is3d() && !still() ? waitFor<{ rect: { left: number; top: number; right: number; bottom: number } }>('otto:handoff-done', DONE_FALLBACK) : Promise.resolve(null);
  emit('otto:handoff', { phase: 'take', id });
  if (!is3d()) emit('otto:state', { state: 'pew' });
  const done = await doneWait;
  try {
    sessionStorage.setItem('otto-handoff', JSON.stringify({ id, t: Date.now() }));
    sessionStorage.setItem('otto-inside', id);
  } catch { /* storage unavailable */ }
  const portal = document.createElement('div');
  portal.className = 'otto-portal';
  portal.setAttribute('aria-hidden', 'true');
  if (info.media) portal.style.setProperty('--img', `url("${info.media}")`);
  const rect = done?.rect;
  if (rect && !still()) {
    portal.style.setProperty('--from', `inset(${rect.top}px ${innerWidth - rect.right}px ${innerHeight - rect.bottom}px ${rect.left}px round 14px)`);
    portal.dataset.from = 'chest';
  }
  document.body.append(portal);
  await new Promise(resolve => window.setTimeout(resolve, still() ? 200 : 300));
  location.assign(target);
  return 'take';
}

// Leaving mid-offer (a link, the back button) settles it as "stay", so a
// restored page never resumes a countdown that ran while it was away.
addEventListener('pagehide', () => pending?.('stay'));

// Coming back with the back button (bfcache): reset the stage.
addEventListener('pageshow', event => {
  if (!event.persisted) return;
  pending?.('stay');
  document.querySelectorAll('.otto-portal').forEach(node => node.remove());
  document.querySelectorAll<HTMLElement>('[data-hero]').forEach(hero => {
    hero.removeAttribute('data-handoff');
    dimmed(hero).forEach(node => { node.inert = false; });
  });
  active = false;
  emit('otto:handoff', { phase: 'cancel' });
  emit('otto:state', { state: 'wave', ms: 1200 });
});
