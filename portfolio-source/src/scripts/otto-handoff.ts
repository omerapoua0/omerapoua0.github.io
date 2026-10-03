/*
 * The hand-off: Otto offers his hand to take the visitor inside a project.
 * Shows a real "Take Otto's hand" button (plus "Stay here") next to his palm,
 * runs a short countdown when motion is on, then plays the grab and pull, opens
 * a portal out of his chest screen and navigates to /inside/<id>.html. The
 * portal shares view-transition-name "portal" with the inside page's monitor,
 * so supporting browsers morph one into the other.
 *   handoff(id, { name, media }) → Promise<'take' | 'stay'>
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

let active = false;

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
  const svg = stage.dataset.mode !== '3d';

  // Bring the stage into view and let Otto come forward.
  const box = stage.getBoundingClientRect();
  const visible = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0)) / Math.max(1, box.height);
  if (visible < .6) stage.scrollIntoView({ behavior: still() ? 'auto' : 'smooth', block: 'center' });
  (document.activeElement as HTMLElement | null)?.blur?.();
  hero.dataset.handoff = 'offer';
  try { new Image().src = info.media ?? ''; } catch { /* no media */ }
  const prefetch = document.createElement('link');
  prefetch.rel = 'prefetch'; prefetch.href = target;
  document.head.append(prefetch);
  emit('otto:handoff', { phase: 'offer', id, name: info.name, media: info.media });
  if (svg) emit('otto:state', { state: 'point' });

  const palm = svg ? null : await waitFor<{ x: number; y: number }>('otto:palm', OFFER_FALLBACK);
  take.textContent = 'Take Otto’s hand';
  take.setAttribute('aria-label', `Take Otto’s hand: open the ${info.name} tour`);
  offer.hidden = false;
  const stageBox = stage.getBoundingClientRect();
  if (palm && innerWidth >= 720) {
    const x = Math.min(Math.max(palm.x - stageBox.left + 24, 16), stageBox.width - offer.offsetWidth - 16);
    const y = Math.min(Math.max(palm.y - stageBox.top - offer.offsetHeight / 2, 16), stageBox.height - offer.offsetHeight - 16);
    offer.style.setProperty('--ox', `${x}px`);
    offer.style.setProperty('--oy', `${y}px`);
    offer.dataset.anchor = 'palm';
  } else offer.dataset.anchor = 'dock';
  status.textContent = `Otto is offering his hand to show you ${info.name}. Take his hand, or choose Stay here.`;
  take.focus({ preventScroll: true });

  const choice = await new Promise<'take' | 'stay'>(resolve => {
    let paused = false, elapsed = 0, last = performance.now(), raf = 0;
    const counting = !still();
    offer.toggleAttribute('data-counting', counting);
    const finish = (value: 'take' | 'stay') => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey, true);
      take.removeEventListener('click', onTake); stay.removeEventListener('click', onStay);
      offer.removeEventListener('pointerenter', onEnter); offer.removeEventListener('pointerleave', onLeave);
      stay.removeEventListener('focus', onEnter); stay.removeEventListener('blur', onLeave);
      resolve(value);
    };
    const onTake = () => finish('take');
    const onStay = () => finish('stay');
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); finish('stay'); } };
    const onEnter = () => { paused = true; };
    const onLeave = () => { paused = false; last = performance.now(); };
    take.addEventListener('click', onTake); stay.addEventListener('click', onStay);
    offer.addEventListener('pointerenter', onEnter); offer.addEventListener('pointerleave', onLeave);
    stay.addEventListener('focus', onEnter); stay.addEventListener('blur', onLeave);
    document.addEventListener('keydown', onKey, true);
    const tick = (now: number) => {
      if (!paused) elapsed += now - last;
      last = now;
      ring?.style.setProperty('--p', String(Math.min(1, elapsed / COUNTDOWN)));
      if (elapsed >= COUNTDOWN) return finish('take');
      raf = requestAnimationFrame(tick);
    };
    if (counting) raf = requestAnimationFrame(tick);
  });

  offer.hidden = true;
  offer.removeAttribute('data-counting');
  if (choice === 'stay') {
    hero.removeAttribute('data-handoff');
    emit('otto:handoff', { phase: 'cancel', id });
    status.textContent = '';
    active = false;
    return 'stay';
  }

  // Take: grab, pull, dive through the chest screen, open the portal, go.
  hero.dataset.handoff = 'take';
  (navigator as Navigator & { vibrate?: (ms: number) => boolean }).vibrate?.(12);
  emit('otto:handoff', { phase: 'take', id });
  if (svg) emit('otto:state', { state: 'pew' });
  const done = svg || still() ? null : await waitFor<{ rect: { left: number; top: number; right: number; bottom: number } }>('otto:handoff-done', DONE_FALLBACK);
  try { sessionStorage.setItem('otto-handoff', JSON.stringify({ id, t: Date.now() })); } catch { /* storage unavailable */ }
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

// Coming back with the back button (bfcache): reset the stage.
addEventListener('pageshow', event => {
  if (!event.persisted) return;
  document.querySelectorAll('.otto-portal').forEach(node => node.remove());
  document.querySelectorAll<HTMLElement>('[data-hero][data-handoff]').forEach(hero => hero.removeAttribute('data-handoff'));
  active = false;
  emit('otto:handoff', { phase: 'cancel' });
  emit('otto:state', { state: 'wave', ms: 1200 });
});
