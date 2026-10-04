/*
 * Otto's controller. Any script can set a pose with
 *   window.dispatchEvent(new CustomEvent('otto:state', { detail: { state: 'talk', ms: 1200 } }))
 * (ms returns him to idle afterwards). Also: random blinks and eyes that follow
 * the pointer or the last touch. With reduced or paused motion Otto still
 * changes pose, but nothing loops and his eyes stay put. While a hand-off is
 * open (otto:handoff offer/take, until cancel) only the hand-off poses
 * (offer, grab, pull) apply, so chat chatter never drops his offered hand.
 */
export type RobotState = 'idle' | 'wave' | 'talk' | 'think' | 'confused' | 'cheeky' | 'point' | 'pew' | 'welcome' | 'offer' | 'grab' | 'pull';
// States the 3D Otto has that the SVG Otto shows with its nearest pose.
const svgPose: Partial<Record<RobotState, RobotState>> = { welcome: 'wave' };
const handPoses: RobotState[] = ['offer', 'grab', 'pull'];

const robots = [...document.querySelectorAll<HTMLElement>('[data-robot]')];
const root = document.documentElement;
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const still = () => reduce.matches || root.dataset.motion === 'off';

if (robots.length) {
  let back = 0;
  let holding = false; // a hand-off is open
  window.addEventListener('otto:handoff', event => {
    const phase = (event as CustomEvent<{ phase?: string }>).detail?.phase;
    const was = holding;
    holding = phase === 'offer' || phase === 'take';
    if (holding) window.clearTimeout(back); // a pending "back to idle" must not drop his hand
    else if (was) set('confused', 900); // declined: a little shrug, as the 3D Otto does
  });
  const set = (requested: RobotState, ms = 0) => {
    const state = svgPose[requested] ?? requested;
    if (holding && !handPoses.includes(state)) return;
    window.clearTimeout(back);
    robots.forEach(robot => {
      robot.dataset.state = state;
      if (!['idle', 'talk', 'wave'].includes(state)) { robot.style.removeProperty('--ex'); robot.style.removeProperty('--ey'); }
    });
    if (ms > 0) back = window.setTimeout(() => robots.forEach(robot => { robot.dataset.state = 'idle'; }), ms);
  };
  window.addEventListener('otto:state', event => {
    const { state, ms } = (event as CustomEvent<{ state: RobotState; ms?: number }>).detail ?? {};
    if (state) set(state, ms);
  });

  /* Blinks every 2.5–6s while motion is on and the tab is visible. */
  const blink = () => {
    if (!still() && !document.hidden) {
      robots.forEach(robot => robot.setAttribute('data-blink', ''));
      window.setTimeout(() => robots.forEach(robot => robot.removeAttribute('data-blink')), 130);
    }
    window.setTimeout(blink, 2500 + Math.random() * 3500);
  };
  window.setTimeout(blink, 1800);

  /* Eyes follow the pointer (±5 view units), only in idle/talk. */
  let frame = 0, px = 0, py = 0;
  const look = () => {
    frame = 0;
    robots.forEach(robot => {
      if (still() || !['idle', 'talk', 'wave'].includes(robot.dataset.state || '')) { robot.style.removeProperty('--ex'); robot.style.removeProperty('--ey'); return; }
      const box = robot.getBoundingClientRect();
      const cx = box.left + box.width / 2, cy = box.top + box.height * .36;
      const dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1, d / 260);
      robot.style.setProperty('--ex', `${((dx / d) * 5 * reach).toFixed(2)}px`);
      robot.style.setProperty('--ey', `${((dy / d) * 4 * reach).toFixed(2)}px`);
    });
  };
  addEventListener('pointermove', event => { px = event.clientX; py = event.clientY; if (!frame) frame = requestAnimationFrame(look); }, { passive: true });
  addEventListener('pointerdown', event => { px = event.clientX; py = event.clientY; if (!frame) frame = requestAnimationFrame(look); }, { passive: true });
  window.addEventListener('omar:motion', look);

  /* A tap or click on Otto makes him wave. */
  robots.forEach(robot => robot.addEventListener('click', () => { if (!holding) set('wave', 1200); }));
}

export {};
