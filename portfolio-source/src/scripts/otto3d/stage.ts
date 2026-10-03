/*
 * Mounts the 3D Otto into a canvas (lazy-loaded by otto-stage.ts). Owns the
 * renderer, lights, camera, render loop and events:
 *   listens: otto:state {state, ms}, otto:handoff {phase, id, name, media},
 *            omar:motion, pointer moves, visibility
 *   emits:   otto:ready, otto:landed, otto:palm {x, y}, otto:anchor {x, y},
 *            otto:handoff-done {rect}, otto:fail {reason}
 * The loop only runs while the stage is on screen, the tab is visible and
 * motion is on; otherwise it renders once per change. Device pixel ratio
 * adapts to keep frames under budget; a slow start falls back to the SVG.
 */
import { ACESFilmicToneMapping, Timer, Color, HemisphereLight, DirectionalLight, type MeshBasicMaterial, NeutralToneMapping, PerspectiveCamera, PMREMGenerator, Scene, Vector3, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildRig, type Tier } from './rig';
import { createChest, createFace } from './face';
import { createDirector, type OttoState } from './motion';

export type Mode = 'hero' | 'dock';
export type OttoHandle = { dispose: () => void; setStill: (still: boolean) => void; snapshot: () => { opaque: number; lime: number }; stats: () => { fps: number; dpr: number; tier: Tier } };

const emit = (name: string, detail: Record<string, unknown> = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));

export async function mount(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, opts: { mode: Mode; entrance: 'fly' | 'rise' | 'none'; still: boolean; tier?: Tier; force?: boolean }): Promise<OttoHandle> {
  let tier: Tier = opts.tier ?? 'hi';
  const renderer = new WebGLRenderer({ canvas, context: gl, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = NeutralToneMapping ?? ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTarget = pmrem.fromScene(room, .04);
  scene.environment = envTarget.texture;
  scene.environmentIntensity = .8;
  room.dispose?.();

  const key = new DirectionalLight(new Color('#fff4e6'), 2.4);
  key.position.set(2.5, 4, 3.5);
  const rim = new DirectionalLight(new Color('#d9ff3f'), 1.6);
  rim.position.set(-3, 2.5, -2.5);
  const fill = new HemisphereLight(new Color('#cfd8ff'), new Color('#0a0b09'), .35);
  scene.add(key, rim, fill);

  const face = createFace();
  const chest = createChest();
  const rig = buildRig(tier, face.texture, chest.texture);
  scene.add(rig.root);
  const director = createDirector(rig);

  const dock = opts.mode === 'dock';
  const camera = new PerspectiveCamera(dock ? 24 : 26, 1, .1, 60);
  const home = { pos: new Vector3(), look: new Vector3(), fov: camera.fov };
  const frame = () => {
    const width = canvas.clientWidth || 1, height = canvas.clientHeight || 1;
    const narrow = width < 720;
    if (dock) { home.pos.set(0, 1.55, 4.2); home.look.set(0, 1.45, 0); }
    else { home.pos.set(0, 1.42, narrow ? 6.8 : 8.9); home.look.set(0, 1.28, 0); }
    camera.aspect = width / height;
    camera.position.copy(home.pos);
    camera.fov = home.fov;
    camera.lookAt(home.look);
    camera.updateProjectionMatrix();
  };

  // Resolution: start at min(dpr, 2), capped by pixel budget, then adapt.
  const fine = window.matchMedia('(pointer: fine)').matches;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  const fitDpr = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight, budget = fine ? 2.4e6 : 1.0e6;
    while (dpr > 1 && w * h * dpr * dpr > budget) dpr -= .25;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
  };
  const resize = () => { frame(); fitDpr(); requestRender(); };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  let still = opts.still;
  let visible = true;
  let raf = 0;
  const clock = new Timer();
  const delta = () => { clock.update(); return clock.getDelta(); };
  const frameTimes: number[] = [];
  let firstFrames: number[] = [];
  let fpsCap = 0, lastDraw = 0, slowSince = 0, fastSince = 0;
  let take: { start: number; from: Vector3; to: Vector3 } | null = null;
  let offerAt = -1;
  let lastAnchor = '';
  let failed = false;

  const project = (v: Vector3) => {
    const p = v.clone().project(camera);
    const box = canvas.getBoundingClientRect();
    return { x: box.left + (p.x + 1) / 2 * box.width, y: box.top + (1 - p.y) / 2 * box.height };
  };
  const world = (object: { getWorldPosition: (v: Vector3) => Vector3 }) => object.getWorldPosition(new Vector3());

  const draw = () => {
    renderer.render(scene, camera);
  };
  const tick = () => {
    raf = 0;
    if (failed) return;
    const now = performance.now();
    if (fpsCap && now - lastDraw < 1000 / fpsCap - 1) { schedule(); return; }
    const dt = delta();
    lastDraw = now;
    const faceState = director.update(dt);
    face.set(faceState);
    if (!chest.isProject()) chest.badge(.5 + .5 * Math.sin(director.time * Math.PI * 2 / 4));

    // Hand-off camera dive toward the chest screen.
    if (take) {
      const t = Math.min(1, Math.max(0, (performance.now() - take.start - 300) / 900));
      const e = t * t * t;
      camera.position.lerpVectors(take.from, take.to, e);
      camera.fov = home.fov + (20 - home.fov) * e;
      camera.lookAt(world(rig.chest));
      camera.updateProjectionMatrix();
      (rig.chest.material as MeshBasicMaterial).color.setScalar(1 + .8 * e);
    }
    draw();
    director.takeEvents().forEach(name => emit(`otto:${name}`));
    if (offerAt > 0 && performance.now() >= offerAt) { offerAt = -1; emit('otto:palm', project(world(rig.armR.palm))); }
    const anchor = project(world(rig.head).add(new Vector3(0, .95, 0)));
    const anchorKey = `${Math.round(anchor.x / 2)},${Math.round(anchor.y / 2)}`;
    if (anchorKey !== lastAnchor) { lastAnchor = anchorKey; emit('otto:anchor', anchor); }

    // Frame budget: bail out on a slow start, then adapt resolution and tier.
    if (firstFrames && !still) {
      firstFrames.push(dt * 1000);
      if (firstFrames.length === 30) {
        const sorted = [...firstFrames].sort((a, b) => a - b);
        if (sorted[15] > 34 && dpr <= 1 && !opts.force) { fail('slow'); return; }
        firstFrames = [];
      }
    }
    frameTimes.push(dt * 1000);
    if (frameTimes.length >= 60) {
      const mean = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      frameTimes.length = 0;
      if (mean > 34) fpsCap = 30;
      if (mean > 20 && dpr > 1) { dpr = Math.max(1, dpr - .25); fitDpr(); slowSince = now; }
      else if (mean > 24 && dpr <= 1 && tier === 'hi') { tier = 'lo'; window.sessionStorage?.setItem('otto3d', 'lo'); }
      if (mean < 12) { if (!fastSince) fastSince = now; else if (now - fastSince > 3000 && dpr < Math.min(window.devicePixelRatio || 1, 2) && now - slowSince > 3000) { dpr += .25; fitDpr(); fastSince = 0; } }
      else fastSince = 0;
    }
    schedule();
  };
  const running = () => visible && !document.hidden && (!still || !!take || director.entering);
  function schedule() { if (!raf && running()) raf = requestAnimationFrame(tick); }
  function requestRender() {
    if (running()) schedule();
    else if (!raf) raf = requestAnimationFrame(() => { raf = 0; director.settle(); face.set(director.update(0)); draw(); });
  }

  function fail(reason: string) {
    if (failed) return;
    failed = true;
    emit('otto:fail', { reason });
    dispose();
  }

  // Inputs.
  const onPointer = (event: PointerEvent) => {
    const head = project(world(rig.head).add(new Vector3(0, .4, 0)));
    const span = Math.max(window.innerWidth, 600) * .5;
    director.look((event.clientX - head.x) / span, (event.clientY - head.y) / span, true);
    if (event.pointerType !== 'mouse') window.setTimeout(() => director.look(0, 0, false), 2500);
    if (still) requestRender();
  };
  const onLeave = () => director.look(0, 0, false);
  const onState = (event: Event) => {
    const { state, ms } = (event as CustomEvent<{ state: OttoState; ms?: number }>).detail ?? {};
    if (!state) return;
    director.setState(state, ms ?? 0);
    requestRender();
  };
  const onHandoff = (event: Event) => {
    const { phase, name, media } = (event as CustomEvent<{ phase: 'offer' | 'take' | 'cancel'; name?: string; media?: string }>).detail ?? {};
    if (phase === 'offer') {
      director.handoff('offer');
      void chest.project(name ?? '', media).then(requestRender);
      offerAt = performance.now() + (still ? 0 : 700);
      if (still) { director.settle(); draw(); offerAt = -1; emit('otto:palm', project(world(rig.armR.palm))); }
    } else if (phase === 'take') {
      director.handoff('take');
      const chestWorld = world(rig.chest);
      take = { start: performance.now(), from: camera.position.clone(), to: chestWorld.clone().add(new Vector3(0, 0, .3)) };
      // Report the chest-screen rectangle so the portal can grow out of it.
      window.setTimeout(() => {
        const c = world(rig.chest);
        const a = project(c.clone().add(new Vector3(-.24, .16, 0))), b = project(c.clone().add(new Vector3(.24, -.16, 0)));
        emit('otto:handoff-done', { rect: { left: Math.min(a.x, b.x), top: Math.min(a.y, b.y), right: Math.max(a.x, b.x), bottom: Math.max(a.y, b.y) } });
      }, still ? 0 : 1000);
    } else if (phase === 'cancel') {
      director.handoff('cancel');
      chest.reset();
      take = null;
      frame();
      (rig.chest.material as MeshBasicMaterial).color.setScalar(1);
    }
    requestRender();
  };
  const onMotion = () => { setStill(document.documentElement.dataset.motion === 'off' || window.matchMedia('(prefers-reduced-motion: reduce)').matches); };
  const onVisibility = () => { if (document.hidden) { if (raf) cancelAnimationFrame(raf); raf = 0; } else { delta(); schedule(); } };
  const onContextLost = (event: Event) => { event.preventDefault(); fail('context-lost'); };
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerdown', onPointer, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('otto:state', onState);
  window.addEventListener('otto:handoff', onHandoff);
  window.addEventListener('omar:motion', onMotion);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onContextLost);
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) { delta(); schedule(); } }, { rootMargin: '80px' });
  io.observe(canvas);

  function setStill(value: boolean) {
    still = value;
    director.setStill(value);
    if (value) { firstFrames = []; requestRender(); } else { delta(); schedule(); }
  }

  function dispose() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    observer.disconnect();
    io.disconnect();
    window.removeEventListener('pointermove', onPointer);
    window.removeEventListener('pointerdown', onPointer);
    document.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('otto:state', onState);
    window.removeEventListener('otto:handoff', onHandoff);
    window.removeEventListener('omar:motion', onMotion);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    rig.dispose(); face.dispose(); chest.dispose(); envTarget.dispose(); pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  // First frame: compile shaders off the main path where supported, then go.
  frame(); fitDpr();
  director.setStill(still);
  if (opts.entrance === 'fly' && !still) director.entrance('fly');
  else if (opts.entrance === 'rise' && !still) director.entrance('rise');
  else { director.settle(); emit('otto:landed'); }
  try { await renderer.compileAsync(scene, camera); } catch { /* older three/WebGL: compile on first draw */ }
  draw();
  emit('otto:ready', { tier });
  if (running()) schedule();
  else requestRender();

  const handle: OttoHandle = {
    dispose,
    setStill,
    snapshot() {
      draw();
      const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
      const pixels = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      let opaque = 0, lime = 0;
      for (let i = 0; i < pixels.length; i += 16) {
        if (pixels[i + 3] > 200) opaque++;
        if (pixels[i] > 170 && pixels[i + 1] > 200 && pixels[i + 2] < 130 && pixels[i + 3] > 200) lime++;
      }
      const total = pixels.length / 16;
      return { opaque: opaque / total, lime: lime / total };
    },
    stats: () => ({ fps: frameTimes.length ? 1000 / (frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length) : 0, dpr, tier }),
  };
  (window as unknown as { __otto?: unknown }).__otto = { handle, director };
  return handle;
}
