/*
 * The hand-off: Otto offers his hand to take the visitor inside a project.
 * Shows a real "Take Otto's hand" button (plus "Stay here"): tethered to his
 * palm on wide screens, in a tray right under him (his hand reaching down to
 * it) on phones. A 4 s countdown runs only with motion on and holds while
 * the offer is hovered, Stay is focused, Take has keyboard focus, a dialog is
 * open or the tab is hidden. Keyboard and reduced-motion visitors always
 * choose for themselves.
 *   handoff(id, { name, media }) → Promise<'take' | 'stay'>
 * Taking his hand (the squeeze, grip, pull, dive or iris, the cover and the
 * page change) lives in otto-take.ts, fetched as soon as the offer opens.
 * Back to Otto from a tour arrives with html[data-arrive="return"] (the head
 * script paints the cover); it is cleared here once the cover has lifted.
 */
const COUNTDOWN = 4000;
const OFFER_FALLBACK = 900;
const root = document.documentElement;
const still = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.motion === 'off';
const emit = (name: string, detail: Record<string, unknown> = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));
const sleep = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));
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
  const lead = offer.querySelector<HTMLElement>('[data-offer-lead]');
  const ring = offer.querySelector<HTMLElement>('[data-offer-ring]');
  const robot = stage.querySelector<HTMLElement>('.otto-stage__poster [data-robot]');
  const is3d = () => stage.dataset.mode === '3d';
  const wide = innerWidth >= 720;
  const taking = import('./otto-take').catch(() => null); // ready long before a tap

  // Bring Otto into view: on wide screens the stage is the hero; on phones he
  // sits just under the header with the tray (which hangs ~70 px below the
  // stage) on screen too.
  const box = stage.getBoundingClientRect();
  const headerBottom = Math.max(0, document.querySelector<HTMLElement>('.site-header, header')?.getBoundingClientRect().bottom ?? 0);
  const visible = Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0)) / Math.max(1, box.height);
  const fits = wide ? visible >= .6 : box.top >= headerBottom - 1 && box.bottom + 76 <= innerHeight;
  if (!fits) window.scrollTo({ top: Math.max(0, scrollY + box.top - (wide ? 0 : headerBottom + 6)), behavior: still() ? 'auto' : 'smooth' });
  const opener = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
  opener?.blur();
  hero.dataset.handoff = 'offer';
  dimmed(hero).forEach(node => { node.inert = true; });
  try { new Image().src = info.media ?? ''; } catch { /* no media */ }
  const prefetch = document.createElement('link');
  prefetch.rel = 'prefetch'; prefetch.href = target;
  document.head.append(prefetch);
  // On phones he reaches down to the tray under him.
  if (wide) robot?.removeAttribute('data-reach'); else robot?.setAttribute('data-reach', 'down');
  // Listen before emitting: a still 3D Otto reports his palm synchronously.
  const palmWait = is3d() ? waitFor<{ x: number; y: number }>('otto:palm', OFFER_FALLBACK) : Promise.resolve(null);
  emit('otto:handoff', { phase: 'offer', id, name: info.name, media: info.media, reach: wide ? 'out' : 'down' });
  if (!is3d()) emit('otto:state', { state: 'offer' });
  let palm = await palmWait;
  if (!palm && !is3d() && robot) {
    // The SVG Otto's open hand, once the reach has settled.
    if (!still()) await sleep(440);
    const hand = robot.querySelector('.robot__hand')?.getBoundingClientRect();
    if (hand && hand.width) palm = { x: hand.left + hand.width / 2, y: hand.top + hand.height / 2 };
  }

  const counting = !still();
  take.setAttribute('aria-label', `Take Otto’s hand: open the ${info.name} tour`);
  status.textContent = counting
    ? `Otto is offering his hand to show you ${info.name}. He’ll take you in about 4 seconds unless you choose Stay here or press Escape.`
    : `Otto is offering his hand to show you ${info.name}. Take his hand, or choose Stay here.`;
  if (lead) lead.textContent = info.name;
  offer.removeAttribute('data-take');
  offer.hidden = false;
  const place = (at: { x: number; y: number } | null) => {
    const stageBox = stage.getBoundingClientRect();
    if (at && wide) {
      // The button's grip sits right at his palm; its centre on the palm's height.
      const grip = take.offsetTop + take.offsetHeight / 2;
      const x = Math.min(Math.max(at.x - stageBox.left + 18, 16), stageBox.width - offer.offsetWidth - 16);
      const y = Math.min(Math.max(at.y - stageBox.top - grip, 16), stageBox.height - offer.offsetHeight - 16);
      offer.style.setProperty('--ox', `${x}px`);
      offer.style.setProperty('--oy', `${y}px`);
      offer.dataset.anchor = 'palm';
    } else if (wide) offer.dataset.anchor = 'below'; // no palm (yet): centred under him
    else {
      offer.dataset.anchor = 'dock';
      // The tray's notch points up at his hand.
      const trayBox = offer.getBoundingClientRect();
      const hx = at ? Math.min(Math.max(at.x - trayBox.left, 28), trayBox.width - 28) : trayBox.width / 2;
      offer.style.setProperty('--hx', `${Math.round(hx)}px`);
    }
  };
  place(palm);
  // A 3D palm that reports late (a slow first frame) still gets the button.
  const latePalm = (event: Event) => { if (!offer.hidden && !offer.hasAttribute('data-take')) place((event as CustomEvent<{ x: number; y: number }>).detail); };
  if (is3d()) window.addEventListener('otto:palm', latePalm);
  take.focus({ preventScroll: true });
  // Make sure both choices are actually on screen (short phones, deep links),
  // unless the scroll above is still on its way there.
  const offerBox = offer.getBoundingClientRect();
  if (fits && (offerBox.bottom > innerHeight - 8 || offerBox.top < headerBottom)) offer.scrollIntoView({ block: 'nearest', behavior: still() ? 'auto' : 'smooth' });

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
      window.removeEventListener('otto:palm', latePalm);
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

  offer.removeAttribute('data-counting');
  if (choice === 'stay') {
    offer.hidden = true;
    ring?.style.setProperty('--p', '0');
    hero.removeAttribute('data-handoff');
    robot?.removeAttribute('data-reach');
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

  // Take: squeeze into his hand, grip, pull, dive (3D) or zoom + iris (SVG), cover, go.
  hero.dataset.handoff = 'take';
  ring?.style.setProperty('--p', '0');
  const takeIt = await taking;
  if (takeIt) await takeIt.take({ id, info, offer, robot, threeD: is3d(), moving: !still(), target });
  else location.assign(target);
  return 'take';
}

// Leaving mid-offer (a link, the back button) settles it as "stay", so a
// restored page never resumes a countdown that ran while it was away.
addEventListener('pagehide', () => pending?.('stay'));

// Coming back with the back button (bfcache): reset the stage (otto-take.ts lifts the cover).
addEventListener('pageshow', event => {
  if (!event.persisted) return;
  pending?.('stay');
  // Back to Otto from a tour we reached some other way (the command menu):
  // the tour's shutter came down, so lift the homepage's cover the same way.
  try {
    const back = JSON.parse(sessionStorage.getItem('otto-return') || 'null') as { t?: number } | null;
    sessionStorage.removeItem('otto-return');
    const cover = document.querySelector<HTMLElement>('[data-otto-cover]');
    if (back?.t && Date.now() - back.t < 10000 && cover && !cover.dataset.state) {
      cover.dataset.state = 'leave';
      window.setTimeout(() => { if (cover.dataset.state === 'leave') cover.removeAttribute('data-state'); }, 800);
    }
  } catch { /* storage unavailable */ }
  document.querySelectorAll<HTMLElement>('[data-hero]').forEach(hero => {
    hero.removeAttribute('data-handoff');
    dimmed(hero).forEach(node => { node.inert = false; });
    hero.querySelectorAll<HTMLElement>('[data-robot]').forEach(robot => { robot.removeAttribute('data-dive'); robot.removeAttribute('data-reach'); });
  });
  active = false;
  emit('otto:handoff', { phase: 'cancel' });
  emit('otto:state', { state: 'wave', ms: 1200 });
});

// Back to Otto from a tour (a fresh load): the head script painted the cover; clear it once it's lifted.
if (root.dataset.arrive === 'return') window.setTimeout(() => { if (root.dataset.arrive === 'return') delete root.dataset.arrive; }, 900);
