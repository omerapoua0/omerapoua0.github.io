/*
 * Otto's 3D body, built procedurally (no downloaded models). Scale: 1 unit is
 * about 10 cm; Otto faces +z (the camera).
 *
 * A realistic humanoid service robot, shown from the waist up like a product
 * shot: a glossy black helmet faceplate (his lime LED eyes glow behind the
 * glass), satin-white armour panels over a dark mechanical neck, spine and
 * joints, and full arms with shoulder caps, hinged elbows and articulated
 * hands. The joint chain (shoulder → elbow → wrist → fingers) is what
 * motion.ts poses. "lo" tier swaps physical materials for standard ones.
 */
import {
  AdditiveBlending, CylinderGeometry, DirectionalLight, BufferGeometry, CanvasTexture, CapsuleGeometry, Color, DoubleSide, EquirectangularReflectionMapping, Float32BufferAttribute,
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

  // Materials: satin-white armour, dark graphite mechanics, black glass, lime light.
  const shell = mat(hi
    ? new MeshPhysicalMaterial({ color: new Color('#dcded9'), roughness: .36, metalness: 0, clearcoat: .55, clearcoatRoughness: .18, sheen: .25, sheenRoughness: .6, sheenColor: new Color('#ffffff') })
    : new MeshStandardMaterial({ color: new Color('#dcded9'), roughness: .4, metalness: 0 }));
  const graphite = mat(hi
    ? new MeshPhysicalMaterial({ color: new Color('#141516'), roughness: .3, metalness: .65, clearcoat: .35, clearcoatRoughness: .25 })
    : new MeshStandardMaterial({ color: new Color('#141516'), roughness: .34, metalness: .6 }));
  const steel = mat(new MeshStandardMaterial({ color: new Color('#5d6063'), roughness: .25, metalness: .9 }));
  // The faceplate reflects a small "studio" (an equirect canvas): a soft
  // overhead softbox and two tall side strips, dark straight ahead, so the
  // helmet catches long product-shot highlights but never a hot spot across the eyes.
  const studio = tex(canvasTexture(256, (ctx, w) => {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, 128);
    const sky = ctx.createLinearGradient(0, 0, 0, 64);
    sky.addColorStop(0, '#e4e6df'); sky.addColorStop(.4, '#7a7d76'); sky.addColorStop(.75, '#0c0d0c'); sky.addColorStop(1, '#000');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, 64);
    for (const u of [.06, .44, .56]) {
      const strip = ctx.createLinearGradient(u * w - 9, 0, u * w + 9, 0);
      strip.addColorStop(0, 'rgba(255,255,255,0)'); strip.addColorStop(.5, 'rgba(255,255,255,.7)'); strip.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = strip; ctx.fillRect(u * w - 9, 18, 18, 64);
    }
  }, 128));
  studio.mapping = EquirectangularReflectionMapping;
  const visorMat = mat(hi
    ? new MeshPhysicalMaterial({ color: new Color('#030303'), roughness: .06, metalness: .15, clearcoat: 1, clearcoatRoughness: .03, envMap: studio, envMapIntensity: 2.2 })
    : new MeshStandardMaterial({ color: new Color('#040404'), roughness: .1, metalness: .2, envMap: studio, envMapIntensity: 2 }));
  const glass = mat(new MeshStandardMaterial({ color: new Color('#020302'), roughness: .12, metalness: .1, envMap: studio, envMapIntensity: 1.6 }));
  const lime = mat(new MeshBasicMaterial({ color: new Color('#d9ff3f'), toneMapped: false }));
  const faceMat = mat(new MeshBasicMaterial({ map: faceMap, transparent: true, toneMapped: false, depthWrite: false, blending: AdditiveBlending }));
  const chestMat = mat(new MeshBasicMaterial({ map: chestMap, transparent: true, toneMapped: false }));
  const glow = (texture: Texture, opacity = 1) => mat(new MeshBasicMaterial({ map: tex(texture), transparent: true, opacity, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide, forceSinglePass: true }));

  const root = new Group();
  const body = new Group();
  root.add(body);
  // A cool white rim light from behind (hi only): the edge highlight that
  // makes white armour read as a real object on a dark page.
  if (hi) {
    const rimLight = new DirectionalLight(new Color('#eef3ff'), 1.4);
    rimLight.position.set(2.4, 2.6, -3.2);
    root.add(rimLight);
  }

  // A faint lime glow low behind him (the "flame": it flares as he flies in).
  const BOTTOM = .34;
  const beamGeometry = new PlaneGeometry(1.4, 1.4);
  beamGeometry.translate(0, -.5, 0);
  const flame = mesh(beamGeometry, glow(radialTexture('rgba(217,255,63,0.35)', 'rgba(217,255,63,0)'), .6), body, 0, BOTTOM, -.3);
  flame.renderOrder = 3;
  // Kept for the rig contract (motion.ts drives its intensity), but placed
  // out of reach: on white armour any lime fill reads as a green cast.
  const light = new PointLight('#d9ff3f', .2, .3);
  light.position.set(0, -2, -2);
  body.add(light);

  const waist = new Group();
  waist.position.y = BOTTOM;
  body.add(waist);

  // Pelvis and a mechanical spine: graphite, ribbed like a bellows.
  const pelvis = mesh(new SphereGeometry(.3, seg(40), seg(20), 0, Math.PI * 2, Math.PI * .45, Math.PI * .55), graphite, waist, 0, .2, 0);
  pelvis.scale.set(1, .8, .72);
  mesh(new CylinderGeometry(.17, .2, .42, seg(32)), graphite, waist, 0, .38, 0).scale.z = .8;
  for (const y of [.24, .31, .38, .45, .52]) {
    const rib = mesh(new TorusGeometry(.19 - (y - .24) * .08, .018, seg(8), seg(40)), steel, waist, 0, y, 0);
    rib.rotation.x = Math.PI / 2; rib.scale.y = .8;
  }

  // Torso: a sculpted white shell (broad chest, narrower waist), flattened
  // front to back. The torso group carries that scale; arms and head hang off
  // the unscaled waist so their rotations never shear.
  const torso = new Group();
  torso.scale.z = .58;
  waist.add(torso);
  const torsoProfile = pebble(.46, .9, 1.1, .3, .44, 3.1);
  mesh(new LatheGeometry(torsoProfile.points(seg(48)), seg(72)), shell, torso);
  // Panel seams: a waist band and a yoke line across the upper chest.
  if (hi) for (const y of [.62, 1.0]) {
    mesh(new TorusGeometry(torsoProfile.r(y) + .002, .0045, 6, 96), graphite, torso, 0, y, 0).rotation.x = Math.PI / 2;
  }
  // Abdomen plate: dark, between the chest shell and the spine.
  mesh(surfacePatch(torsoProfile.r, .3, .1, .04, .55, .004, seg(24), seg(8)), graphite, torso);

  // Chest status display (the camera dives into it during the hand-off).
  const CHEST_Y = .8;
  mesh(surfacePatch(torsoProfile.r, .36, .24, .07, CHEST_Y, .004, seg(32), seg(14)), glass, torso);
  const chestGeometry = surfacePatch(torsoProfile.r, .31, .2, .05, CHEST_Y, .009, seg(32), seg(12));
  const chestZ = torsoProfile.r(CHEST_Y) + .009;
  chestGeometry.translate(0, -CHEST_Y, -chestZ);
  const chest = mesh(chestGeometry, chestMat, torso, 0, CHEST_Y, chestZ);
  chest.renderOrder = 1;

  // Neck: a graphite column with a collar, three cable runs and a thin lime ring.
  const TOP = 1.12;
  mesh(new CylinderGeometry(.2, .26, .06, seg(40)), graphite, waist, 0, TOP - .01, 0).scale.z = .7;
  mesh(new CylinderGeometry(.075, .09, .17, seg(24)), graphite, waist, 0, TOP + .08, 0);
  for (const [x, z, tilt] of [[-.065, .045, .18], [.065, .045, -.18], [0, -.07, 0]] as const) {
    const cable = mesh(new CylinderGeometry(.016, .016, .17, seg(10)), steel, waist, x, TOP + .08, z);
    cable.rotation.z = tilt;
  }
  const ring = mesh(new TorusGeometry(.095, .007, seg(8), seg(40)), lime, waist, 0, TOP + .06, 0);
  ring.rotation.x = Math.PI / 2;

  // Head: a helmet. White shell at the back and crown, a glossy black
  // faceplate wrapping the front, ear modules ringed in lime.
  const head = new Group();
  head.position.y = TOP + .15;
  waist.add(head);
  const skull = new Group();
  skull.position.set(0, .27, -.01);
  skull.scale.set(1, 1.13, 1.08);
  head.add(skull);
  mesh(new SphereGeometry(.285, seg(48), seg(32)), shell, skull);
  // The faceplate: a cap of a slightly larger sphere, centred on +z.
  const PLATE = 2.05;
  mesh(new SphereGeometry(.2935, seg(48), seg(32), Math.PI / 2 - PLATE / 2, PLATE, .5, 1.52), visorMat, skull);
  // A graphite trim round the faceplate edge (hi only).
  if (hi) {
    const trim = mesh(new SphereGeometry(.2915, seg(48), seg(32), Math.PI / 2 - PLATE / 2 - .05, PLATE + .1, .46, 1.6), graphite, skull);
    trim.renderOrder = -1;
  }
  // LED eyes behind the glass: the face canvas on a band of the faceplate.
  const EYES = 1.25;
  const face = mesh(new SphereGeometry(.296, seg(32), seg(8), Math.PI / 2 - EYES / 2, EYES, 1.2, .34), faceMat, skull);
  face.renderOrder = 2;
  for (const side of [-1, 1]) {
    const ear = mesh(new CylinderGeometry(.08, .09, .06, seg(32)), graphite, skull, side * .283, -.02, -.03);
    ear.rotation.z = Math.PI / 2;
    const earRing = mesh(new TorusGeometry(.066, .006, seg(8), seg(32)), lime, skull, side * .316, -.02, -.03);
    earRing.rotation.y = Math.PI / 2;
  }

  // "Antenna": a small sensor nub on the crown (it still wobbles on landing).
  const antenna = new Group();
  antenna.position.y = .27 + .32;
  head.add(antenna);
  mesh(new CylinderGeometry(.03, .045, .03, seg(16)), graphite, antenna, 0, 0, -.06);
  mesh(new SphereGeometry(.012, seg(10), seg(8)), lime, antenna, 0, .018, -.06);

  // Arms: a white shoulder cap over a graphite ball joint, a white upper arm,
  // a graphite hinge at the elbow, a tapered white forearm and an articulated
  // hand (graphite fingers, a white back plate). Palm faces +z when the arm hangs.
  const buildArm = (side: -1 | 1): Arm => {
    const shoulder = new Group();
    shoulder.position.set(side * .52, .98, 0);
    waist.add(shoulder);
    mesh(new SphereGeometry(.105, seg(24), seg(16)), graphite, shoulder);
    const cap = mesh(new SphereGeometry(.15, seg(32), seg(20), 0, Math.PI * 2, 0, Math.PI * .62), shell, shoulder, 0, .02, 0);
    cap.scale.set(1.05, 1, .95);
    cap.rotation.z = side * -.35;
    mesh(new CapsuleGeometry(.085, .2, seg(8), seg(24)), shell, shoulder, 0, -.22, 0).scale.z = .92;
    const elbow = new Group();
    elbow.position.y = -.42;
    shoulder.add(elbow);
    const hinge = mesh(new CylinderGeometry(.072, .072, .15, seg(24)), graphite, elbow);
    hinge.rotation.z = Math.PI / 2;
    if (hi) mesh(new TorusGeometry(.074, .006, 6, seg(32)), steel, elbow, side * .07, 0, 0).rotation.y = Math.PI / 2;
    const forearm = mesh(new LatheGeometry([new Vector2(0, -.36), new Vector2(.058, -.35), new Vector2(.066, -.3), new Vector2(.084, -.12), new Vector2(.086, -.06), new Vector2(.07, -.02), new Vector2(0, -.01)], seg(28)), shell, elbow);
    forearm.scale.z = .9;
    const wrist = new Group();
    wrist.position.y = -.38;
    elbow.add(wrist);
    mesh(new CylinderGeometry(.048, .052, .05, seg(20)), graphite, wrist, 0, -.01, 0);
    const hand = new Group();
    hand.rotation.set(.12, side * -.35, 0);
    wrist.add(hand);
    const palm = mesh(new CapsuleGeometry(.055, .05, seg(6), seg(20)), graphite, hand, 0, -.09, 0);
    palm.scale.set(1.45, 1, .55);
    const back = mesh(new CapsuleGeometry(.05, .045, seg(6), seg(20)), shell, hand, 0, -.085, -.022);
    back.scale.set(1.4, 1, .38);
    const fingers: Arm['fingers'] = [];
    for (const fx of [-.054, -.018, .018, .054]) {
      const base = new Group();
      base.position.set(fx, -.15, 0);
      base.rotation.z = fx * 1.2;
      hand.add(base);
      mesh(new CapsuleGeometry(.0165, .04, seg(6), seg(12)), graphite, base, 0, -.03, 0);
      const tip = new Group();
      tip.position.y = -.065;
      base.add(tip);
      mesh(new CapsuleGeometry(.0155, .03, seg(6), seg(12)), graphite, tip, 0, -.025, 0);
      fingers.push({ base, tip });
    }
    const thumb = new Group();
    thumb.position.set(side * .08, -.07, .02);
    thumb.rotation.z = side * .8;
    hand.add(thumb);
    mesh(new CapsuleGeometry(.019, .055, seg(6), seg(12)), graphite, thumb, 0, -.045, 0);
    return { shoulder, elbow, wrist, fingers, thumb, palm };
  };
  const armL = buildArm(-1);
  const armR = buildArm(1);

  // Floor shadow and lime pool: kept for the rig contract, but he's framed
  // from the waist up, so they stay hidden.
  const shadowMat = mat(new MeshBasicMaterial({ map: tex(radialTexture('rgba(0,0,0,0.75)', 'rgba(0,0,0,0)')), transparent: true, depthWrite: false }));
  const shadow = mesh(new PlaneGeometry(1.6, 1.6), shadowMat, root, 0, .002, 0);
  shadow.rotation.x = -Math.PI / 2;
  shadow.visible = false;
  const poolMat = mat(new MeshBasicMaterial({ map: tex(radialTexture('rgba(217,255,63,0.6)', 'rgba(217,255,63,0)')), transparent: true, opacity: .2, blending: AdditiveBlending, depthWrite: false, toneMapped: false }));
  const pool = mesh(new PlaneGeometry(1.3, 1.3), poolMat, root, 0, .004, 0);
  pool.rotation.x = -Math.PI / 2;
  pool.visible = false;

  /** Curl 0 (open) → 1 (fist). With point, the index finger stays straight. */
  const setCurl = (arm: Arm, curl: number, point = false) => {
    arm.fingers.forEach((finger, index) => {
      const g = point && index === 1 ? 0 : curl;
      finger.base.rotation.x = -1.35 * g;
      finger.tip.rotation.x = -1.5 * g;
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
