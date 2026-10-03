/*
 * Otto's 3D body, built procedurally (no downloaded models). Scale: 1 unit is
 * about 10 cm; the floor is y = 0 and Otto faces +z (the camera). Pivots are
 * exposed so motion.ts can pose him: body → waist → head / neck / arms, each
 * arm shoulder → elbow → wrist → fingers. Ceramic shell, black-glass visor,
 * lime light. "lo" tier swaps physical materials for cheaper standard ones.
 */
import {
  AdditiveBlending, BufferGeometry, CanvasTexture, CapsuleGeometry, Color, ConeGeometry, CylinderGeometry, DoubleSide,
  ExtrudeGeometry, Group, Material, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Object3D,
  PlaneGeometry, PointLight, Shape, SphereGeometry, SRGBColorSpace, Texture, TorusGeometry,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export type Tier = 'hi' | 'lo';
export type Arm = { shoulder: Object3D; elbow: Object3D; wrist: Object3D; fingers: { base: Object3D; tip: Object3D }[]; thumb: Object3D; palm: Object3D };
export type Rig = {
  root: Group; body: Group; waist: Group; head: Group; antenna: Group; armL: Arm; armR: Arm; chest: Mesh; face: Mesh;
  flame: Mesh; ring: Mesh; light: PointLight; shadow: Mesh; pool: Mesh;
  setCurl: (arm: Arm, curl: number, point?: boolean) => void;
  dispose: () => void;
};

const roundedRect = (w: number, h: number, r: number) => {
  const shape = new Shape();
  const x = -w / 2, y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y); shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r); shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h); shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r); shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
};

/** A soft radial sprite texture (for the floor shadow and glows). */
export function radialTexture(inner: string, outer: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, inner);
  gradient.addColorStop(1, outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function buildRig(tier: Tier, faceMap: Texture, chestMap: Texture): Rig {
  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const keep = <T extends BufferGeometry>(geometry: T) => { geometries.push(geometry); return geometry; };
  const mat = <T extends Material>(material: T) => { materials.push(material); return material; };

  const shell = mat(tier === 'hi'
    ? new MeshPhysicalMaterial({ color: new Color('#eceee7'), roughness: .3, metalness: 0, clearcoat: 1, clearcoatRoughness: .1, sheen: .25, sheenColor: new Color('#ffffff') })
    : new MeshStandardMaterial({ color: new Color('#eceee7'), roughness: .35, metalness: 0 }));
  const joint = mat(new MeshStandardMaterial({ color: new Color('#1b1d19'), roughness: .38, metalness: .85 }));
  // Black glass stays black at any angle; the face texture paints its own sheen.
  const glass = mat(new MeshBasicMaterial({ color: new Color('#040504') }));
  const lime = mat(new MeshBasicMaterial({ color: new Color('#d9ff3f'), toneMapped: false }));
  const faceMat = mat(new MeshBasicMaterial({ map: faceMap, transparent: true, toneMapped: false, depthWrite: false }));
  const chestMat = mat(new MeshBasicMaterial({ map: chestMap, toneMapped: false }));
  const mesh = (geometry: BufferGeometry, material: Material, parent: Object3D, x = 0, y = 0, z = 0) => {
    const m = new Mesh(keep(geometry), material);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  };

  const root = new Group();
  const body = new Group();
  root.add(body);

  // Hover thruster with a lime ring and a soft exhaust flame.
  mesh(new CylinderGeometry(.24, .15, .22, 32), joint, body, 0, .29, 0);
  const ring = mesh(new TorusGeometry(.2, .022, 12, 48), lime, body, 0, .19, 0);
  ring.rotation.x = Math.PI / 2;
  const flameTexture = radialTexture('rgba(217,255,63,0.95)', 'rgba(217,255,63,0)');
  const flameMat = mat(new MeshBasicMaterial({ map: flameTexture, transparent: true, blending: AdditiveBlending, depthWrite: false, toneMapped: false, side: DoubleSide }));
  const flame = mesh(new ConeGeometry(.13, .5, 24, 1, true), flameMat, body, 0, -.07, 0);
  flame.rotation.x = Math.PI;
  const light = new PointLight('#d9ff3f', .9, 1.6);
  light.position.set(0, .08, 0);
  body.add(light);

  // Waist, hips and torso with the chest screen.
  const waist = new Group();
  waist.position.y = .52;
  body.add(waist);
  const hips = mesh(new SphereGeometry(.26, 32, 16), joint, waist, 0, 0, 0);
  hips.scale.y = .6;
  mesh(new RoundedBoxGeometry(.92, .8, .62, 5, .26), shell, waist, 0, .42, 0);
  const chestFrame = mesh(new ExtrudeGeometry(roundedRect(.52, .36, .07), { depth: .02, bevelEnabled: true, bevelThickness: .008, bevelSize: .008, bevelSegments: 2, curveSegments: 8 }), glass, waist, 0, .44, .3);
  chestFrame.renderOrder = 1;
  const chest = mesh(new PlaneGeometry(.48, .32), chestMat, waist, 0, .44, .332);

  // Neck and head with the black-glass visor and the face screen.
  const neck = mesh(new CylinderGeometry(.11, .14, .14, 24), joint, waist, 0, .84, 0);
  neck.castShadow = false;
  const head = new Group();
  head.position.y = .9;
  waist.add(head);
  mesh(new RoundedBoxGeometry(1.04, .78, .82, 6, .32), shell, head, 0, .4, 0);
  mesh(new ExtrudeGeometry(roundedRect(.86, .54, .2), { depth: .04, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 3, curveSegments: 12 }), glass, head, 0, .4, .37);
  const face = mesh(new PlaneGeometry(.8, .48), faceMat, head, 0, .4, .43);
  face.renderOrder = 2;
  for (const side of [-1, 1]) {
    const ear = mesh(new CylinderGeometry(.13, .13, .1, 32), joint, head, side * .55, .4, 0);
    ear.rotation.z = Math.PI / 2;
    const earRing = mesh(new TorusGeometry(.1, .012, 8, 40), lime, head, side * .605, .4, 0);
    earRing.rotation.y = Math.PI / 2;
  }
  const antenna = new Group();
  antenna.position.y = .79;
  head.add(antenna);
  mesh(new CylinderGeometry(.018, .022, .26, 12), joint, antenna, 0, .13, 0);
  mesh(new SphereGeometry(.055, 20, 12), lime, antenna, 0, .29, 0);

  // Arms: shoulder → elbow → wrist → palm, three two-part fingers and a thumb.
  const buildArm = (side: -1 | 1): Arm => {
    const shoulder = new Group();
    shoulder.position.set(side * .58, .72, 0);
    waist.add(shoulder);
    mesh(new SphereGeometry(.14, 24, 16), joint, shoulder);
    mesh(new CapsuleGeometry(.095, .26, 6, 16), shell, shoulder, 0, -.2, 0);
    const elbow = new Group();
    elbow.position.y = -.4;
    shoulder.add(elbow);
    mesh(new SphereGeometry(.09, 20, 12), joint, elbow);
    mesh(new CapsuleGeometry(.085, .22, 6, 16), shell, elbow, 0, -.18, 0);
    const band = mesh(new TorusGeometry(.088, .012, 8, 32), lime, elbow, 0, -.3, 0);
    band.rotation.x = Math.PI / 2;
    const wrist = new Group();
    wrist.position.y = -.36;
    elbow.add(wrist);
    const palm = mesh(new RoundedBoxGeometry(.17, .19, .07, 2, .03), joint, wrist, 0, -.1, 0);
    const fingers: Arm['fingers'] = [];
    for (const fx of [-.055, 0, .055]) {
      const base = new Group();
      base.position.set(fx, -.19, 0);
      wrist.add(base);
      mesh(new CapsuleGeometry(.024, .045, 4, 10), shell, base, 0, -.04, 0);
      const tip = new Group();
      tip.position.y = -.085;
      base.add(tip);
      mesh(new CapsuleGeometry(.022, .04, 4, 10), shell, tip, 0, -.035, 0);
      fingers.push({ base, tip });
    }
    const thumb = new Group();
    thumb.position.set(side * -.09, -.1, .02);
    thumb.rotation.z = side * -.6;
    wrist.add(thumb);
    mesh(new CapsuleGeometry(.024, .06, 4, 10), shell, thumb, 0, -.05, 0);
    return { shoulder, elbow, wrist, fingers, thumb, palm };
  };
  const armL = buildArm(-1);
  const armR = buildArm(1);

  // Floor: a soft contact shadow and a faint lime pool from the thruster.
  const shadowMat = mat(new MeshBasicMaterial({ map: radialTexture('rgba(0,0,0,0.75)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }));
  const shadow = mesh(new PlaneGeometry(1.6, 1.6), shadowMat, root, 0, .002, 0);
  shadow.rotation.x = -Math.PI / 2;
  const poolMat = mat(new MeshBasicMaterial({ map: radialTexture('rgba(217,255,63,0.6)', 'rgba(217,255,63,0)'), transparent: true, opacity: .16, blending: AdditiveBlending, depthWrite: false, toneMapped: false }));
  const pool = mesh(new PlaneGeometry(1.2, 1.2), poolMat, root, 0, .004, 0);
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
      flameTexture.dispose();
      (shadowMat.map as Texture | null)?.dispose();
      (poolMat.map as Texture | null)?.dispose();
    },
  };
}
