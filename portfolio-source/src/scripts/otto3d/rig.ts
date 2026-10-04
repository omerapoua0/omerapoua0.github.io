/*
 * Otto's 3D body, built procedurally (no downloaded models). Scale: 1 unit is
 * about 10 cm; the floor is y = 0 and Otto faces +z (the camera).
 *
 * A levitating companion: a glossy pebble head floats above a bean-shaped
 * body (no neck, a lime levitation glow in the gap), a wide black-glass face
 * band shows his LED-dot eyes, and his hands float free (no visible arms),
 * each held by a magnetic lime ring at the wrist. The arm joint chain still
 * exists (shoulder → elbow → wrist → fingers) so motion.ts can pose him; only
 * the hands are drawn. Surfaces are lathed superellipse profiles, and the
 * glass panels are rounded rectangles conformed to those surfaces. "lo" tier
 * swaps physical materials for standard ones and drops the soft glows.
 */
import {
  AdditiveBlending, BufferGeometry, CanvasTexture, CapsuleGeometry, Color, DoubleSide, EquirectangularReflectionMapping, Float32BufferAttribute,
  Group, LatheGeometry, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Object3D,
  PlaneGeometry, PointLight, SphereGeometry, SRGBColorSpace, Texture, TorusGeometry, Vector2,
} from 'three';

export type Tier = 'hi' | 'lo';
export type Arm = { shoulder: Object3D; elbow: Object3D; wrist: Object3D; fingers: { base: Object3D; tip: Object3D }[]; thumb: Object3D; palm: Object3D };
export type Rig = {
  root: Group; body: Group; waist: Group; head: Group; antenna: Group; armL: Arm; armR: Arm; chest: Mesh; face: Mesh;
  flame: Mesh; ring: Mesh; light: PointLight; shadow: Mesh; pool: Mesh;
  setCurl: (arm: Arm, curl: number, point?: boolean) => void;
  dispose: () => void;
};

const canvasTexture = (size: number, paint: (ctx: CanvasRenderingContext2D, size: number) => void, height = size) => {
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = height;
  paint(canvas.getContext('2d')!, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};

/** A soft radial sprite texture (for the floor shadow and glows). */
export function radialTexture(inner: string, outer: string) {
  return canvasTexture(64, (ctx, s) => {
    const gradient = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gradient.addColorStop(0, inner);
    gradient.addColorStop(1, outer);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, s, s);
  });
}

const smooth = (t: number) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };

/**
 * A pebble profile: a superellipse (exponent p) from y0 to y1, widest at c,
 * whose radius eases from rLow (below) to rHigh (above). r(y) gives the
 * surface radius at a height; points(n) samples it for a lathe (dense at the poles).
 */
function pebble(y0: number, c: number, y1: number, rLow: number, rHigh: number, p: number) {
  const R = (y: number) => rLow + (rHigh - rLow) * smooth((y - y0) / (y1 - y0));
  const r = (y: number) => {
    const u = Math.min(1, Math.abs(y - c) / (y < c ? c - y0 : y1 - c));
    return R(y) * Math.pow(1 - Math.pow(u, p), 1 / p);
  };
  const points = (n: number) => {
    const out: Vector2[] = [];
    for (let i = 0; i <= n; i++) {
      const phi = Math.PI * i / n, cs = Math.cos(phi);
      const y = c - (cs > 0 ? c - y0 : y1 - c) * Math.sign(cs) * Math.pow(Math.abs(cs), 2 / p);
      out.push(new Vector2(R(y) * Math.pow(Math.abs(Math.sin(phi)), 2 / p), y));
    }
    return out;
  };
  return { r, points };
}

/**
 * A rounded rectangle (w x h, corner radius rad, in arc-length units) laid
 * on a lathe surface r(y), centred at height yc, lifted `lift` off it. UVs
 * run 0..1 across the full rectangle, so a canvas maps onto it undistorted.
 */
function surfacePatch(r: (y: number) => number, w: number, h: number, rad: number, yc: number, lift: number, sx: number, sy: number) {
  const position: number[] = [], uv: number[] = [], index: number[] = [];
  const rRef = r(yc) + lift;
  for (let j = 0; j <= sy; j++) for (let i = 0; i <= sx; i++) {
    let x = (i / sx - .5) * w, y = (j / sy - .5) * h;
    if (Math.abs(x) > w / 2 - rad && Math.abs(y) > h / 2 - rad) {
      // Pull the corner square onto a quarter circle (radial square → disc map).
      const cx = Math.sign(x) * (w / 2 - rad), cy = Math.sign(y) * (h / 2 - rad);
      const vx = x - cx, vy = y - cy, len = Math.hypot(vx, vy), m = Math.max(Math.abs(vx), Math.abs(vy));
      x = cx + vx / len * m; y = cy + vy / len * m;
    }
    const theta = x / rRef, rr = r(yc + y) + lift;
    position.push(rr * Math.sin(theta), yc + y, rr * Math.cos(theta));
    uv.push(x / w + .5, y / h + .5);
  }
  for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) {
    const a = j * (sx + 1) + i, b = a + 1, c = a + sx + 1, d = c + 1;
    index.push(a, b, d, a, d, c);
  }
  const geometry = new BufferGeometry();
  geometry.setIndex(index);
  geometry.setAttribute('position', new Float32BufferAttribute(position, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  return geometry;
}

export function buildRig(tier: Tier, faceMap: Texture, chestMap: Texture): Rig {
  const hi = tier === 'hi';
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const textures: Texture[] = [];
  const keep = <T extends BufferGeometry>(geometry: T) => { geometries.push(geometry); return geometry; };
  const mat = <T extends Material>(material: T) => { materials.push(material); return material; };
  const tex = (texture: Texture) => { textures.push(texture); return texture; };
  const mesh = (geometry: BufferGeometry, material: Material, parent: Object3D, x = 0, y = 0, z = 0) => {
    const m = new Mesh(keep(geometry), material);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };
  const seg = (n: number) => (hi ? n : Math.max(8, Math.round(n / 2)));

  // Materials: pearl-white clearcoat shell, graphite, black glass, lime light.
  const shell = mat(hi
    ? new MeshPhysicalMaterial({ color: new Color('#f3f4ef'), roughness: .26, metalness: 0, clearcoat: 1, clearcoatRoughness: .05, specularIntensity: .6 })
    : new MeshStandardMaterial({ color: new Color('#f3f4ef'), roughness: .3, metalness: 0 }));
  const graphite = mat(new MeshStandardMaterial({ color: new Color('#17191a'), roughness: .32, metalness: .7 }));
  // The black glass reflects its own small "studio" (an equirect canvas): a
  // soft overhead light and two side strips, dark straight ahead, so the
  // panels catch a highlight along their top edge but never a hot spot
  // across the eyes.
  const studio = tex(canvasTexture(256, (ctx, w) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, 128);
    const sky = ctx.createLinearGradient(0, 0, 0, 64);
    sky.addColorStop(0, '#d8dbd2'); sky.addColorStop(.42, '#6a6d66'); sky.addColorStop(.78, '#0c0d0c'); sky.addColorStop(1, '#000');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, 64);
    for (const u of [.08, .42]) {
      const strip = ctx.createLinearGradient(u * w - 10, 0, u * w + 10, 0);
      strip.addColorStop(0, 'rgba(255,255,255,0)'); strip.addColorStop(.5, 'rgba(255,255,255,.55)'); strip.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = strip; ctx.fillRect(u * w - 10, 26, 20, 50);
    }
  }, 128));
  studio.mapping = EquirectangularReflectionMapping;
  const glass = mat(hi
    ? new MeshPhysicalMaterial({ color: new Color('#010201'), roughness: .1, metalness: 0, clearcoat: 1, clearcoatRoughness: .06, envMap: studio, envMapIntensity: 2 })
    : new MeshStandardMaterial({ color: new Color('#020302'), roughness: .14, metalness: .1, envMap: studio, envMapIntensity: 2 }));
  const lime = mat(new MeshBasicMaterial({ color: new Color('#d9ff3f'), toneMapped: false }));
  const faceMat = mat(new MeshBasicMaterial({ map: faceMap, transparent: true, toneMapped: false, depthWrite: false }));
  const chestMat = mat(new MeshBasicMaterial({ map: chestMap, transparent: true, toneMapped: false }));
  // Additive glows need no back-then-front pass: one draw call each.
  const glow = (texture: Texture, opacity = 1) => mat(new MeshBasicMaterial({ map: tex(texture), transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide, forceSinglePass: true }));
  const softLime = glow(radialTexture('rgba(217,255,63,0.9)', 'rgba(217,255,63,0)'));

  const root = new Group();
  const body = new Group();
  root.add(body);

  // Levitation: a lime emitter ring under the body, a soft hanging glow (the
  // "flame": small at rest, stretched while flying in) and a lime point light.
  const BOTTOM = .34;
  const beamTexture = tex(canvasTexture(128, (ctx, s) => {
    ctx.translate(s / 2, 0);
    ctx.scale(1, 1.6);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, s / 2);
    g.addColorStop(0, 'rgba(236,255,140,0.95)');
    g.addColorStop(.25, 'rgba(217,255,63,0.5)');
    g.addColorStop(.6, 'rgba(217,255,63,0.12)');
    g.addColorStop(1, 'rgba(217,255,63,0)');
    ctx.fillStyle = g;
    ctx.fillRect(-s / 2, 0, s, s);
  }));
  const beamGeometry = new PlaneGeometry(1.5, 1.5);
  beamGeometry.translate(0, -.75, 0);
  const flame = mesh(beamGeometry, glow(beamTexture, .9), body, 0, BOTTOM + .06, 0);
  flame.renderOrder = 3;
  const light = new PointLight('#d9ff3f', .9, 1.8);
  light.position.set(0, BOTTOM - .1, .1);
  body.add(light);

  // The bean body (fuller below, a touch narrower at the top), slightly
  // flattened front to back. The torso group carries that scale; the arms
  // and head hang off the unscaled waist so their rotations never shear.
  const waist = new Group();
  waist.position.y = BOTTOM;
  body.add(waist);
  const torso = new Group();
  torso.scale.z = .9;
  waist.add(torso);
  const bodyProfile = pebble(0, .45, 1, .48, .41, 2.5);
  mesh(new LatheGeometry(bodyProfile.points(seg(52)), seg(80)), shell, torso);
  if (hi) { // a fine parting line low on the body
    const SEAM_Y = .22;
    mesh(new TorusGeometry(bodyProfile.r(SEAM_Y) + .001, .0042, 6, 96), graphite, torso, 0, SEAM_Y, 0).rotation.x = Math.PI / 2;
  }
  const ring = mesh(new TorusGeometry(bodyProfile.r(.02), .016, seg(12), seg(64)), lime, torso, 0, .02, 0);
  ring.rotation.x = Math.PI / 2;

  // Chest screen: a black-glass panel conformed to the body, and the canvas
  // screen on it. The screen's origin is its centre (the camera dives into it).
  const CHEST_Y = .53;
  mesh(surfacePatch(bodyProfile.r, .56, .4, .1, CHEST_Y, .004, seg(36), seg(16)), glass, torso);
  const chestGeometry = surfacePatch(bodyProfile.r, .48, .32, .07, CHEST_Y, .009, seg(36), seg(14));
  const chestZ = bodyProfile.r(CHEST_Y) + .009;
  chestGeometry.translate(0, -CHEST_Y, -chestZ);
  const chest = mesh(chestGeometry, chestMat, torso, 0, CHEST_Y, chestZ);
  chest.renderOrder = 1;

  // The neck gap: a graphite socket ringed in lime on the body, a matching
  // pad under the head, a soft lime glow in the gap and, just in front, a
  // fainter spill that tints the head's underside and the body's top (a
  // faked light: cheaper than a real one on every phone).
  const TOP = 1;
  const socket = mesh(new SphereGeometry(.17, seg(32), seg(12)), graphite, torso, 0, TOP - .035, 0);
  socket.scale.y = .32;
  const collar = mesh(new TorusGeometry(bodyProfile.r(TOP - .018), .011, seg(10), seg(56)), lime, torso, 0, TOP - .018, 0);
  collar.rotation.x = Math.PI / 2;
  const gapTexture = radialTexture('rgba(217,255,63,0.75)', 'rgba(217,255,63,0)');
  mesh(new PlaneGeometry(.86, .2), glow(gapTexture), waist, 0, TOP + .05, 0).renderOrder = 3;
  if (hi) mesh(new PlaneGeometry(1, .36), glow(radialTexture('rgba(217,255,63,0.5)', 'rgba(217,255,63,0)'), .55), waist, 0, TOP + .05, .56).renderOrder = 3;

  // Head: a wide pebble (cheeks a touch fuller), floating above the body.
  const head = new Group();
  head.position.y = TOP + .04;
  waist.add(head);
  const HEAD_C = .44;
  const skull = new Group();
  skull.position.y = HEAD_C;
  skull.scale.z = .84;
  head.add(skull);
  const headProfile = pebble(-.385, -.02, .385, .64, .58, 2.25);
  mesh(new LatheGeometry(headProfile.points(seg(52)), seg(80)), shell, skull);
  const chin = mesh(new SphereGeometry(.17, seg(32), seg(12)), graphite, skull, 0, -.37, 0);
  chin.scale.y = .3;
  // Face band: a thin graphite bezel, the black glass, then the LED canvas.
  const BAND_Y = -.015;
  mesh(surfacePatch(headProfile.r, 1.31, .42, .17, BAND_Y, .003, seg(64), seg(18)), graphite, skull);
  mesh(surfacePatch(headProfile.r, 1.27, .385, .155, BAND_Y, .007, seg(64), seg(18)), glass, skull);
  const face = mesh(surfacePatch(headProfile.r, 1.26, .38, .15, BAND_Y, .0095, seg(64), seg(18)), faceMat, skull);
  face.renderOrder = 2;
  // The band carries on round the back of the head as a fine parting line.
  if (hi) {
    const bandAngle = .655 / (headProfile.r(BAND_Y) + .003);
    mesh(new TorusGeometry(headProfile.r(BAND_Y) + .001, .0042, 6, 96, Math.PI * 2 - bandAngle * 2), graphite, skull, 0, BAND_Y, 0)
      .rotation.set(Math.PI / 2, 0, bandAngle - Math.PI * 1.5);
  }

  // The "antenna": a little lime orb floating above the crown (it wobbles
  // on landing and leans as he looks around).
  const antenna = new Group();
  antenna.position.y = HEAD_C + .38;
  head.add(antenna);
  mesh(new SphereGeometry(.036, seg(24), seg(16)), lime, antenna, 0, .09, 0);
  if (hi) mesh(new PlaneGeometry(.2, .2), softLime, antenna, 0, .09, 0).renderOrder = 3;

  // Floating hands. The joint chain is invisible; each hand hangs from its
  // wrist inside a magnetic lime ring. Palm faces +z (fingers curl that way).
  const ringGlow = hi ? glow(canvasTexture(128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(217,255,63,0)');
    g.addColorStop(.6, 'rgba(217,255,63,0)');
    g.addColorStop(.82, 'rgba(217,255,63,0.7)');
    g.addColorStop(.92, 'rgba(217,255,63,0.16)');
    g.addColorStop(1, 'rgba(217,255,63,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  })) : null;
  const buildArm = (side: -1 | 1): Arm => {
    const shoulder = new Group();
    shoulder.position.set(side * .58, 1.04, 0);
    waist.add(shoulder);
    const elbow = new Group();
    elbow.position.y = -.3;
    shoulder.add(elbow);
    const wrist = new Group();
    wrist.position.y = -.26;
    elbow.add(wrist);
    // The hand is tilted back a little at the wrist and turned a little
    // toward you, so a resting hand shows three quarters (not its edge), a
    // hand reaching toward you shows its palm and a waving hand faces you.
    const hand = new Group();
    hand.rotation.set(.3, side * -.6, 0);
    hand.scale.setScalar(1.3);
    wrist.add(hand);
    // Wrist stub, with the magnetic ring floating round it, canted a little
    // (like a gyroscope) so it reads as a ring from the front, not a line.
    mesh(new CapsuleGeometry(.054, .05, seg(6), seg(20)), shell, hand, 0, -.06, 0).scale.z = .84;
    const cuff = new Group();
    cuff.position.y = -.058;
    cuff.rotation.set(-.42, 0, side * .18);
    hand.add(cuff);
    mesh(new TorusGeometry(.083, .0105, seg(10), seg(48)), lime, cuff).rotation.x = Math.PI / 2;
    if (ringGlow) mesh(new PlaneGeometry(.2, .2), ringGlow, cuff).rotation.x = -Math.PI / 2;
    // A smooth pebble palm, three fanned fingers and a thumb, all in the shell.
    const palm = mesh(new SphereGeometry(.1, seg(32), seg(24)), shell, hand, 0, -.145, 0);
    palm.scale.set(1.04, 1, .5);
    const fingers: Arm['fingers'] = [];
    for (const fx of [-.06, 0, .06]) {
      const base = new Group();
      base.position.set(fx, -.215, 0);
      base.rotation.z = fx * 2;
      hand.add(base);
      mesh(new CapsuleGeometry(.029, .05, seg(6), seg(16)), shell, base, 0, -.035, 0);
      const tip = new Group();
      tip.position.y = -.08;
      base.add(tip);
      mesh(new CapsuleGeometry(.027, .036, seg(6), seg(16)), shell, tip, 0, -.032, 0);
      fingers.push({ base, tip });
    }
    // The thumb sits on the outer edge, as it does on a real open palm.
    const thumb = new Group();
    thumb.position.set(side * .085, -.13, .02);
    thumb.rotation.z = side * .75;
    hand.add(thumb);
    mesh(new CapsuleGeometry(.03, .07, seg(6), seg(16)), shell, thumb, 0, -.055, 0);
    return { shoulder, elbow, wrist, fingers, thumb, palm };
  };
  const armL = buildArm(-1);
  const armR = buildArm(1);

  // Floor: a soft contact shadow and a faint lime pool from the levitation light.
  const shadowMat = mat(new MeshBasicMaterial({ map: tex(radialTexture('rgba(0,0,0,0.75)', 'rgba(0,0,0,0)')), transparent: true, depthWrite: false }));
  const shadow = mesh(new PlaneGeometry(1.6, 1.6), shadowMat, root, 0, .002, 0);
  shadow.rotation.x = -Math.PI / 2;
  const poolMat = mat(new MeshBasicMaterial({ map: tex(radialTexture('rgba(217,255,63,0.6)', 'rgba(217,255,63,0)')), transparent: true, opacity: .2, blending: AdditiveBlending, depthWrite: false, toneMapped: false }));
  const pool = mesh(new PlaneGeometry(1.3, 1.3), poolMat, root, 0, .004, 0);
  pool.rotation.x = -Math.PI / 2;

  /** Curl 0 (open) → 1 (fist). With point, the middle finger stays straight. */
  const setCurl = (arm: Arm, curl: number, point = false) => {
    arm.fingers.forEach((finger, index) => {
      const g = point && index === 1 ? 0 : curl;
      finger.base.rotation.x = -1.4 * g;
      finger.tip.rotation.x = -1.6 * g;
    });
    arm.thumb.rotation.x = -.9 * curl;
  };

  return {
    root, body, waist, head, antenna, armL, armR, chest, face, flame, ring, light, shadow, pool, setCurl,
    dispose() {
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      textures.forEach(texture => texture.dispose());
    },
  };
}
