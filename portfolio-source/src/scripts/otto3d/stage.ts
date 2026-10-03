/*
 * Mounts the 3D Otto into a canvas (lazy-loaded by otto-stage.ts). Owns the
 * renderer, lights, camera, render loop and events:
 *   listens: otto:state {state, ms}, otto:handoff {phase, id, name, media},
 *            omar:motion, pointer moves, visibility
 *   emits:   otto:ready, otto:landed, otto:palm {x, y}, otto:anchor {x, y},
 *            otto:handoff-done {rect}, otto:fail {reason}
 * The loop only runs while the stage is on screen, the tab is visible and
 * motion is on; otherwise it renders once per change (deferred while
 * offscreen). A hidden warm-up proves the frame rate before Otto is shown;
 * afterwards resolution adapts to the frame budget.
 */
import { ACESFilmicToneMapping, Box3, Timer, Color, HemisphereLight, DirectionalLight, type MeshBasicMaterial, NeutralToneMapping, PerspectiveCamera, PMREMGenerator, Scene, Vector3, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildRig, type Tier } from './rig';
import { createChest, createFace } from './face';
import { createDirector, type OttoState } from './motion';

export type Mode = 'hero' | 'dock';
export type OttoHandle = { dispose: () => void; setStill: (still: boolean) => void; snapshot: () => { opaque: number; lime: number }; stats: () => { fps: number; dpr: number; tier: Tier } };

const emit = (name: string, detail: Record<string, unknown> = {}) => window.dispatchEvent(new CustomEvent(name, { detail }));

export type Entrance = 'fly' | 'rise' | 'none';
export async function mount(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext, opts: { mode: Mode; entrance: Entrance | (() => Entrance); still: boolean; tier?: Tier; force?: boolean }): Promise<OttoHandle> {
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
  let dockBox: Box3 | null = null; // the settled figure's bounds, for dock framing
  let shift = 0; // px: lens shift that centres Otto in the gap between the intro and the chat
  const applyShift = (amount: number) => {
    const width = canvas.clientWidth || 1, height = canvas.clientHeight || 1;
    if (Math.abs(amount) > .5) camera.setViewOffset(width, height, -amount, 0, width, height);
    else camera.clearViewOffset();
  };
  const frame = () => {
    const width = canvas.clientWidth || 1, height = canvas.clientHeight || 1;
    const narrow = width < 720;
    shift = 0;
    if (dock) {
      // Frame the whole figure (antenna to thruster, both arms) in the small dock.
      if (!dockBox) { rig.root.updateMatrixWorld(true); dockBox = new Box3().setFromObject(rig.body); }
      const size = dockBox.getSize(new Vector3()), center = dockBox.getCenter(new Vector3());
      const t = Math.tan(home.fov * Math.PI / 360);
      const distance = Math.max(size.y * 1.14 / (2 * t), size.x * 1.24 / (2 * t * (width / height))) + size.z / 2;
      home.pos.set(0, center.y + .12, distance); home.look.set(0, center.y, 0);
    }
    else {
      let z = narrow ? 6.8 : 8.9;
      const style = getComputedStyle(canvas.parentElement ?? canvas);
      const gx = parseFloat(style.getPropertyValue('--gx')), gw = parseFloat(style.getPropertyValue('--gw'));
      if (gx > 0 && gw > 0) {
        shift = gx - width / 2;
        // Open-armed Otto is ~2.3 units wide: back the camera off just enough
        // that he fits the gap (10% grace), so he never sits behind the text.
        z = Math.min(40, Math.max(z, 2.3 * height / (2 * Math.tan(home.fov * Math.PI / 360) * gw * 1.1)));
      }
      home.pos.set(0, 1.42, z); home.look.set(0, 1.28, 0);
    }
    camera.aspect = width / height;
    if (!take) { // during the dive, tick() owns the camera
      camera.position.copy(home.pos);
      camera.fov = home.fov;
      camera.lookAt(home.look);
      applyShift(shift);
    }
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
  // Resizing clears the drawing buffer, so redraw at once (no blank frame).
  const resize = () => { frame(); fitDpr(); if (ready && !failed) draw(); requestRender(); };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  let still = opts.still;
  let visible = true;
  let raf = 0;
  let ready = false; // nothing renders until the shaders have compiled
  let dirty = false; // a still frame was requested while offscreen or hidden
  const clock = new Timer();
  const delta = () => { clock.update(); return clock.getDelta(); };
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
  /* Frame budget. The frame cadence is compared with the best cadence seen so
   * far, so a display or power-saving cap (30 Hz Low Power Mode, 144 Hz
   * monitors) is never mistaken for overload. Slow windows step resolution
   * down (never back up past a level that proved slow), then mark the
   * session 'lo'; a device still under 20 fps at 1x falls back to the SVG. */
  const gaps: number[] = [];
  let best = Infinity, slowWindows = 0, calmUntil = 0;
  const budget = (gap: number, now: number) => {
    if (still || take || now < calmUntil) { gaps.length = 0; return; }
    gaps.push(gap);
    if (gaps.length < 60) return;
    gaps.sort((a, b) => a - b);
    const median = gaps[30];
    gaps.length = 0;
    best = Math.min(best, median);
    if (median <= Math.max(20, best * 1.35)) { slowWindows = 0; return; }
    if (dpr > 1) { dpr = Math.max(1, dpr - .25); fitDpr(); calmUntil = now + 1000; return; }
    if (tier === 'hi') { tier = 'lo'; try { sessionStorage.setItem('otto3d', 'lo'); } catch { /* storage unavailable */ } }
    if (median > 50 && ++slowWindows >= 2 && !opts.force) fail('slow');
  };

  const tick = () => {
    raf = 0;
    if (failed) return;
    const now = performance.now();
    const dt = delta();
    budget(dt * 1000, now); // before drawing, so a resolution change never presents a blank frame
    if (failed) return;
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
      applyShift(shift * (1 - e)); // ease the lens shift out so the chest ends dead centre
      camera.updateProjectionMatrix();
      (rig.chest.material as MeshBasicMaterial).color.setScalar(1 + .8 * e);
    }
    draw();
    director.takeEvents().forEach(name => emit(`otto:${name}`));
    if (offerAt > 0 && performance.now() >= offerAt) { offerAt = -1; emit('otto:palm', project(world(rig.armR.palm))); }
    const anchor = project(world(rig.head).add(new Vector3(0, .95, 0)));
    const anchorKey = `${Math.round(anchor.x / 2)},${Math.round(anchor.y / 2)}`;
    if (anchorKey !== lastAnchor) { lastAnchor = anchorKey; emit('otto:anchor', anchor); }

    schedule();
  };
  const running = () => visible && !document.hidden && (!still || !!take || director.entering);
  function schedule() { if (ready && !failed && !raf && running()) raf = requestAnimationFrame(tick); }
  function requestRender() {
    if (!ready || failed) return;
    if (!visible || document.hidden) { dirty = true; return; } // drawn when he's back on screen
    if (running()) schedule();
    else if (!raf) raf = requestAnimationFrame(() => { raf = 0; director.settle(); face.set(director.update(0)); draw(); schedule(); });
  }
  const wake = () => { delta(); if (dirty) { dirty = false; requestRender(); } schedule(); };

  function fail(reason: string) {
    if (failed) return;
    failed = true;
    emit('otto:fail', { reason });
    dispose();
  }

  // Inputs.
  const onPointer = (event: PointerEvent) => {
    if (still) return; // with motion off Otto keeps a still pose, eyes included
    const head = project(world(rig.head).add(new Vector3(0, .4, 0)));
    const span = Math.max(window.innerWidth, 600) * .5;
    director.look((event.clientX - head.x) / span, (event.clientY - head.y) / span, true);
    if (event.pointerType !== 'mouse') window.setTimeout(() => director.look(0, 0, false), 2500);
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
      // The camera dive is motion: skipped when motion is reduced or paused.
      if (!still) take = { start: performance.now(), from: camera.position.clone(), to: chestWorld.clone().add(new Vector3(0, 0, .3)) };
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
  const onVisibility = () => { if (document.hidden) { if (raf) { cancelAnimationFrame(raf); dirty = true; } raf = 0; } else wake(); };
  const onContextLost = (event: Event) => { event.preventDefault(); fail('context-lost'); };
  window.addEventListener('pointermove', onPointer, { passive: true });
  window.addEventListener('pointerdown', onPointer, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  window.addEventListener('otto:state', onState);
  window.addEventListener('otto:handoff', onHandoff);
  window.addEventListener('omar:motion', onMotion);
  window.addEventListener('otto:layout', resize);
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onContextLost);
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) wake(); }, { rootMargin: '80px' });
  io.observe(canvas);

  function setStill(value: boolean) {
    still = value;
    director.setStill(value);
    if (value) requestRender(); else { delta(); schedule(); }
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
    window.removeEventListener('otto:layout', resize);
    document.removeEventListener('visibilitychange', onVisibility);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    rig.dispose(); face.dispose(); chest.dispose(); envTarget.dispose(); pmrem.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  /* Warm-up, while the canvas is still invisible: draw Otto at his home pose
   * for up to ~0.9 s and only reveal him if frames come at >= ~22 fps (median
   * interval <= 45 ms). A slow GPU never sees the 3D Otto start and then
   * swap to the SVG one. A frame gap over 1 s (hidden tab) restarts it. */
  const probe = () => new Promise<boolean>(resolve => {
    const gaps: number[] = [];
    let last = 0, began = 0;
    const median = () => [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] ?? Infinity;
    const step = (now: number) => {
      if (failed) return resolve(true);
      if (last && now - last > 1000) { gaps.length = 0; began = 0; }
      draw();
      if (last && began) gaps.push(now - last);
      if (!began) began = now;
      last = now;
      if (gaps.length >= 8) return resolve(median() <= 45);
      if (now - began > 900) return resolve(gaps.length >= 5 && median() <= 45);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });

  // Compile shaders off the main path where supported, prove the frame rate, then go.
  frame(); fitDpr();
  director.setStill(still);
  director.settle();
  if (dock) { dockBox = null; frame(); }
  try { await renderer.compileAsync(scene, camera); } catch { /* older three/WebGL: compile on first draw */ }
  if (!still && !opts.force && !(await probe())) { fail('slow'); throw new Error('Otto 3D: frame rate too low'); }
  if (failed) throw new Error('Otto 3D: failed during warm-up');
  // Decided now, not at import time: if the SVG Otto already stood in, no fly-in.
  const entrance = typeof opts.entrance === 'function' ? opts.entrance() : opts.entrance;
  if (entrance !== 'none' && !still) director.entrance(entrance);
  else emit('otto:landed');
  director.update(0);
  draw();
  ready = true;
  delta(); // fresh timer baseline, so warm-up time doesn't count as one long frame
  calmUntil = performance.now() + 1500; // ignore start-up hitches when budgeting
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
    stats: () => ({ fps: Number.isFinite(best) ? Math.round(1000 / best) : 0, dpr, tier }),
  };
  (window as unknown as { __otto?: unknown }).__otto = { handle, director };
  return handle;
}
