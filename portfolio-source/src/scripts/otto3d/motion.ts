/*
 * Otto's director: turns states ("talk", "think"…) and clips (the fly-in
 * entrance, the hand-off) into joint targets, then moves every joint with a
 * critically damped spring so motion never snaps. Idle life (hover bob,
 * breathing, glances, blinks, eyes and head following the pointer) is
 * layered on top. Pure maths: no DOM, so it can run in tests.
 */
import type { Arm, Rig } from './rig';
import type { Expression, FaceState } from './face';

export type OttoState = 'idle' | 'wave' | 'talk' | 'think' | 'confused' | 'cheeky' | 'point' | 'pew' | 'welcome' | 'offer' | 'grab' | 'pull';
type ArmPose = { sx: number; sz: number; ex: number; ez: number; wy: number; curl: number; point?: boolean };
type Pose = { L: ArmPose; R: ArmPose; lean: number; turn: number; roll: number; headRoll: number; headPitch: number; expression: Expression; talk: number };

const arm = (sx: number, sz: number, ex: number, wy: number, curl: number, ez = 0, point = false): ArmPose => ({ sx, sz, ex, ez, wy, curl, point });
const REST_L = arm(.06, -.14, -.28, -1.2, .3);
const REST_R = arm(.06, .14, -.28, 1.2, .3);
const pose = (p: Partial<Pose>): Pose => ({ L: REST_L, R: REST_R, lean: 0, turn: 0, roll: 0, headRoll: 0, headPitch: 0, expression: 'neutral', talk: 0, ...p });

const POSES: Record<OttoState, Pose> = {
  idle: pose({}),
  // The waving hand rides a little higher (sz 2.8, was 2.55) so his floating hand stays clear of the chat.
  wave: pose({ R: arm(-.15, 2.8, -.2, 0, .05), expression: 'happy', headRoll: -.06 }),
  // Arms open a little less (sz ±.24, was ±.5): his floating hands ride wide of the body, so this keeps them clear of the text and chat.
  welcome: pose({ L: arm(-.42, -.24, -.42, -.2, .05), R: arm(-.42, .24, -.42, .2, .05), lean: .1, expression: 'happy' }),
  talk: pose({ L: arm(-.32, -.18, -.9, -.6, .2), talk: 1 }),
  think: pose({ R: arm(-1.15, -.5, -1.95, .4, .55), headRoll: .17, headPitch: -.08, expression: 'think', roll: .03 }),
  confused: pose({ L: arm(-.25, -.5, -1.2, -.2, .15), R: arm(-.25, .5, -1.2, .2, .15), headRoll: -.24, expression: 'confused' }),
  cheeky: pose({ R: arm(-.95, .25, -1.45, 1.4, .92), expression: 'wink', headRoll: .1 }),
  point: pose({ R: arm(-1.42, .42, -.08, .9, .8, 0, true), turn: .12, expression: 'happy' }),
  pew: pose({ R: arm(-1.42, .42, -.08, .9, .8, 0, true), turn: .12, expression: 'squint' }),
  // The offered hand reaches straight toward you (sz 0): with no arm to follow, a hand drifting off to the side read as reaching for the chat.
  offer: pose({ R: arm(-1.32, 0, -.3, 0, .1), L: arm(-.2, -.3, -.5, -.6, .25), lean: .14, expression: 'happy' }),
  grab: pose({ R: arm(-1.3, 0, -.36, .12, .92), L: arm(-.2, -.3, -.5, -.6, .25), lean: .17, expression: 'happy' }),
  // The pull: elbow drawn back and up, body leaning back, as if drawing you in.
  pull: pose({ R: arm(-.78, .12, -1.72, .1, .95), L: arm(.22, -.42, -.36, -.6, .3), lean: -.2, headPitch: .06, expression: 'happy' }),
};
/* Phones: the button sits in a tray right under him, so he reaches down to it. */
const OFFER_LOW = pose({ R: arm(-.86, .34, -.48, .3, .08), L: arm(-.2, -.3, -.5, -.6, .25), lean: .24, headPitch: .14, expression: 'happy' });
const GRAB_LOW = pose({ ...OFFER_LOW, R: { ...OFFER_LOW.R, ex: -.56, curl: .92 } });
/** The take clip: grip for this long, then pull. */
const GRIP = .2;

class Spring {
  x: number; v = 0;
  constructor(public target: number, public omega: number, public zeta = 1) { this.x = target; }
  step(dt: number) {
    // semi-implicit Euler on a damped spring; dt is already sub-stepped
    const a = -2 * this.zeta * this.omega * this.v - this.omega * this.omega * (this.x - this.target);
    this.v += a * dt;
    this.x += this.v * dt;
  }
  snap(value: number) { this.x = this.target = value; this.v = 0; }
}

const bezier = (a: number[], b: number[], c: number[], t: number) => a.map((_, i) => (1 - t) ** 2 * a[i] + 2 * (1 - t) * t * b[i] + t * t * c[i]);
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const easeInOut = (t: number) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function createDirector(rig: Rig) {
  const springs = new Map<string, Spring>();
  const spring = (key: string, initial: number, omega: number, zeta = 1) => {
    let s = springs.get(key);
    if (!s) { s = new Spring(initial, omega, zeta); springs.set(key, s); }
    return s;
  };
  const OMEGA = { body: 6, head: 12, arm: 10, finger: 18, antenna: 12, land: 9 };

  let state: OttoState = 'idle';
  let stateUntil = 0;
  let time = 0;
  let still = false;
  let pointer = { x: 0, y: 0, active: false };
  let glance = { x: 0, y: 0, until: 0, next: 3 };
  let blink = { t: 1, next: 2.4, double: false };
  let entrance: { start: number; kind: 'fly' | 'rise' } | null = null;
  let handoff: { phase: 'offer' | 'take'; start: number; low: boolean } | null = null;
  let landedAt = -1;
  const events: string[] = [];

  const setState = (next: OttoState, ms = 0) => {
    if (handoff && !['offer', 'grab', 'pull'].includes(next)) return; // the hand-off owns Otto until it ends
    state = next;
    stateUntil = ms > 0 ? time + ms / 1000 : 0;
  };

  const target = (key: string, value: number, omega: number, zeta = 1) => { spring(key, value, omega, zeta).target = value; };
  const value = (key: string) => springs.get(key)?.x ?? 0;

  const applyArm = (side: 'L' | 'R', armRig: Arm, armPose: ArmPose) => {
    target(`${side}.sx`, armPose.sx, OMEGA.arm, .78);
    target(`${side}.sz`, armPose.sz, OMEGA.arm, .78);
    target(`${side}.ex`, armPose.ex, OMEGA.arm, .8);
    target(`${side}.ez`, armPose.ez, OMEGA.arm, .8);
    target(`${side}.wy`, armPose.wy, OMEGA.arm);
    target(`${side}.curl`, armPose.curl, OMEGA.finger);
    armRig.shoulder.rotation.set(value(`${side}.sx`), 0, value(`${side}.sz`));
    armRig.elbow.rotation.set(value(`${side}.ex`), 0, value(`${side}.ez`));
    armRig.wrist.rotation.set(0, value(`${side}.wy`), 0);
    rig.setCurl(armRig, clamp(value(`${side}.curl`), 0, 1), armPose.point);
  };

  /** Advance by dt seconds. Returns the face state for the visor. */
  function update(dtRaw: number): FaceState {
    const dt = Math.min(dtRaw, 1 / 30);
    time += dt;
    // Move every joint toward last frame's targets (sub-stepped at 120 Hz); still mode jumps.
    const sub = Math.max(1, Math.ceil(dt * 120));
    for (const s of springs.values()) {
      if (still) s.snap(s.target);
      else for (let i = 0; i < sub; i++) s.step(dt / sub);
    }
    if (stateUntil && time >= stateUntil) { state = 'idle'; stateUntil = 0; }
    const gripping = !!handoff && handoff.phase === 'take' && time - handoff.start < GRIP;
    const current = !handoff ? POSES[state]
      : handoff.phase === 'offer' ? (handoff.low ? OFFER_LOW : POSES.offer)
      : gripping ? (handoff.low ? GRAB_LOW : POSES.grab) : POSES.pull;
    const live = !still;

    // Body position: home, gliding forward to offer the hand, or the entrance path.
    let bx = 0, by = 0, bz = 0, pitchExtra = 0, bank = 0, flare = .35, trail = 0;
    // Offering, he glides forward; pulling, he draws back (and up a touch), taking you with him.
    if (handoff) { bz = handoff.phase === 'offer' || gripping ? .85 : .25; by = handoff.phase === 'take' && !gripping ? .12 : 0; }
    if (entrance && live) {
      const t = (time - entrance.start) / (entrance.kind === 'fly' ? 1.6 : .6);
      if (entrance.kind === 'fly' && t < 1) {
        const e = easeOutCubic(clamp(t, 0, 1));
        const [x, y, z] = bezier([2.6, 2.4, -14], [-1.2, 1.6, -5], [0, 0, 0], e);
        const [x2] = bezier([2.6, 2.4, -14], [-1.2, 1.6, -5], [0, 0, 0], Math.min(1, e + .02));
        ['bx', 'by', 'bz'].forEach((key, i) => spring(key, 0, OMEGA.land, .55).snap([x, y, z][i]));
        pitchExtra = .21 * (1 - e);
        bank = clamp(-(x2 - x) * 6, -.32, .32);
        flare = 1.6 - 1.2 * e;
        trail = .45 * (1 - e);
      } else if (entrance.kind === 'rise' && t < 1) {
        const e = easeOutCubic(clamp(t, 0, 1));
        spring('by', 0, OMEGA.land, .55).snap(-.3 * (1 - e));
        spring('scale', 1, OMEGA.body).snap(.92 + .08 * e);
      } else {
        if (landedAt < 0) { landedAt = time; events.push('landed'); setState('wave', 1100); }
        entrance = null;
      }
    }
    target('bx', bx, OMEGA.land, .55);
    target('by', by, OMEGA.land, .55);
    target('bz', bz, handoff ? 7 : OMEGA.land, handoff ? .9 : .55);
    target('scale', 1, OMEGA.body);

    // Idle life, layered on top of the springs.
    const bob = live ? Math.sin(time * Math.PI * 2 / 3.2) * .045 : 0;
    const breathe = live ? 1 + Math.sin(time * Math.PI * 2 / 4) * .008 : 1;
    const sway = live ? Math.sin(time * Math.PI * 2 / 6.4) * .021 : 0;
    rig.body.position.set(value('bx'), value('by') + bob + .02, value('bz'));
    const s = value('scale');
    rig.body.scale.set(s, s * breathe, s);

    // Where Otto looks: the pointer, a passing glance, or the camera.
    if (live && time > glance.next && !pointer.active) {
      glance = { x: (Math.random() * 2 - 1) * .6, y: (Math.random() * 2 - 1) * .3, until: time + .9, next: time + 4 + Math.random() * 4 };
    }
    // With motion off he looks straight ahead (as the SVG Otto keeps his eyes still).
    const lookX = handoff || entrance || !live ? 0 : pointer.active ? pointer.x : time < glance.until ? glance.x : 0;
    const lookY = handoff || entrance || !live ? 0 : pointer.active ? pointer.y : time < glance.until ? glance.y : 0;
    target('yaw', clamp(lookX, -1, 1) * .49, OMEGA.head);
    target('pitch', clamp(lookY, -1, 1) * .28, OMEGA.head);
    target('lean', current.lean, OMEGA.body);
    target('turn', current.turn, OMEGA.body);
    target('roll', current.roll, OMEGA.body);
    target('headRoll', current.headRoll, OMEGA.head);
    target('headPitch', current.headPitch, OMEGA.head);
    rig.body.rotation.set(value('lean') + pitchExtra, value('turn') + value('yaw') * .25, value('roll') + bank + sway);
    rig.head.rotation.set(value('pitch') + value('headPitch') + (state === 'talk' && live ? Math.sin(time * 9) * .05 : 0), value('yaw') * .75, value('headRoll'));

    // Arms (with a 3-beat wave and talking hand gestures on top).
    const R = { ...current.R }, L = { ...current.L };
    if (state === 'wave' && !handoff && live) { R.ez = Math.sin(time * Math.PI * 2 * 2.2) * .4; R.sz += Math.sin(time * Math.PI * 2 * 2.2 + .6) * .12; }
    if (state === 'talk' && live) { L.ex += Math.sin(time * 5.2) * .18; }
    if (trail) { L.sx += trail; R.sx += trail; }
    applyArm('L', rig.armL, L);
    applyArm('R', rig.armR, R);

    // Antenna wobble after landing, thruster flare and the floor shadow.
    const landedFor = landedAt >= 0 ? time - landedAt : 9;
    target('antenna', landedFor < 1.2 ? Math.sin(landedFor * 18) * .35 * (1.2 - landedFor) : value('pitch') * -.4, OMEGA.antenna, .3);
    rig.antenna.rotation.x = value('antenna');
    target('flare', handoff?.phase === 'take' ? 1.3 : flare, 8);
    const f = value('flare') * (live ? .9 + Math.sin(time * 31) * .1 : 1);
    rig.flame.scale.set(f, f * 1.3, f);
    rig.light.intensity = .5 + .5 * f;
    const height = Math.max(0, rig.body.position.y);
    rig.shadow.scale.setScalar(1 + .15 * height + Math.abs(rig.body.position.z) * .02);
    (rig.shadow.material as { opacity: number }).opacity = clamp(.55 - .25 * height, .1, .55);
    rig.shadow.position.x = rig.body.position.x; rig.shadow.position.z = rig.body.position.z;
    rig.pool.position.copy(rig.shadow.position);

    // Face: blinks, expression, talking equaliser.
    if (live) {
      blink.t += dt;
      if (blink.t > blink.next) { blink.t = 0; blink.double = Math.random() < .15; blink.next = 2.6 + Math.random() * 3.4; }
    }
    const b = blink.t < .12 ? Math.sin((blink.t / .12) * Math.PI) : blink.double && blink.t > .2 && blink.t < .32 ? Math.sin(((blink.t - .2) / .12) * Math.PI) : 0;
    const expression: Expression = handoff ? 'happy' : current.expression;
    return { lookX: clamp(lookX, -1, 1), lookY: clamp(lookY, -1, 1), blink: still ? 0 : b, expression, talk: (state === 'talk' || current.talk) && live ? 1 : current.talk && still ? .4 : 0, time };
  }

  return {
    update,
    setState,
    get state() { return handoff ? handoff.phase : state; },
    look(x: number, y: number, active = true) { pointer = { x, y, active }; },
    entrance(kind: 'fly' | 'rise') { entrance = { start: time, kind }; landedAt = -1; },
    get entering() { return !!entrance; },
    handoff(phase: 'offer' | 'take' | 'cancel', opts: { low?: boolean } = {}) {
      if (phase === 'cancel') { handoff = null; setState('confused', 900); return; }
      handoff = { phase, start: time, low: phase === 'take' ? !!handoff?.low : !!opts.low };
    },
    setStill(value: boolean) {
      still = value;
      if (value && entrance) { entrance = null; ['bx', 'by', 'bz'].forEach(key => spring(key, 0, OMEGA.land).snap(0)); spring('scale', 1, OMEGA.body).snap(1); if (landedAt < 0) { landedAt = time; events.push('landed'); } }
    },
    /** Jump every spring to its target (used for still frames and snapshots). */
    settle() { for (let i = 0; i < 240; i++) update(1 / 60); },
    takeEvents() { return events.splice(0); },
    get time() { return time; },
    easeInOut,
  };
}
