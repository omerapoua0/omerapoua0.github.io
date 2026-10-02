/*
 * Live skill network behind the hero. Nodes drift, edges link nearby nodes and
 * signals travel along edges like messages between agents. Labelled nodes are
 * real skills; hovering or tapping one shows where the CV evidences it, and a
 * click/tap broadcasts a burst of signals. The canvas is decorative (the same
 * information is in the capability matrix) and pauses offscreen, in hidden
 * tabs and when motion is off; reduced motion draws a single still frame.
 */
type Skill = { label: string; note: string };
type GraphNode = { x: number; y: number; vx: number; vy: number; bx: number; by: number; r: number; ax?: number; ay?: number; label?: string; note?: string };
type Pulse = { a: number; b: number; t: number; speed: number; hops: number; hot: boolean };

const canvas = document.querySelector<HTMLCanvasElement>('[data-graph]');
const hero = canvas?.closest<HTMLElement>('[data-hero]');
const tip = hero?.querySelector<HTMLElement>('[data-graph-tip]');
const context = canvas?.getContext('2d');

if (canvas && hero && context) {
  const ctx = context;
  const root = document.documentElement;
  const skills: Skill[] = JSON.parse(canvas.dataset.skills || '[]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionOn = () => root.dataset.motion !== 'off' && !(reduce.matches && root.dataset.motion !== 'on');
  let width = 0, height = 0;
  let nodes: GraphNode[] = [];
  let pulses: Pulse[] = [];
  let pointer = { x: -9999, y: -9999 };
  let hover = -1;
  let pinned = 0;
  let inView = true;
  let frame = 0;
  let last = 0;
  let spawn = 0;
  const rand = (min: number, max: number) => min + Math.random() * (max - min);
  const reach = () => (width < 720 ? 118 : 168);

  function build() {
    const box = canvas!.getBoundingClientRect();
    width = box.width; height = box.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas!.width = Math.round(width * ratio);
    canvas!.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const phone = width < 720;
    const count = Math.round(Math.min(120, Math.max(40, (width * height) / 13000)));
    nodes = Array.from({ length: count }, () => {
      const bx = rand(-.18, .18), by = rand(-.18, .18);
      return { x: rand(0, width), y: rand(0, height), vx: bx, vy: by, bx, by, r: rand(1, 2.4) };
    });
    // Skill nodes live where they don't cover the text: the right side on
    // desktop, the top band on phones. They spring around an anchor.
    const shown = phone ? skills.slice(0, 6) : skills;
    const area = phone ? { x0: .04, x1: .9, y0: .1, y1: .37 } : { x0: .56, x1: .93, y0: .14, y1: .8 };
    const cols = phone ? 2 : 3;
    shown.forEach((skill, index) => {
      const node = nodes[index];
      const col = index % cols, row = Math.floor(index / cols), rows = Math.ceil(shown.length / cols);
      const ax = width * (area.x0 + (area.x1 - area.x0) * ((col + .5 + rand(-.25, .25)) / cols));
      const ay = height * (area.y0 + (area.y1 - area.y0) * ((row + .5 + rand(-.2, .2)) / rows));
      Object.assign(node, { x: ax, y: ay, ax, ay, bx: 0, by: 0, vx: 0, vy: 0, r: 3.4, label: skill.label, note: skill.note });
    });
    pulses = [];
  }

  const neighbours = (index: number) => {
    const node = nodes[index], limit = reach() ** 2, found: number[] = [];
    nodes.forEach((other, j) => { if (j !== index && (other.x - node.x) ** 2 + (other.y - node.y) ** 2 < limit) found.push(j); });
    return found;
  };
  const send = (from: number, hot = false) => {
    const near = neighbours(from);
    if (near.length) pulses.push({ a: from, b: near[Math.floor(Math.random() * near.length)], t: 0, speed: rand(.012, .022), hops: 0, hot });
  };
  const broadcast = (from: number) => { neighbours(from).slice(0, 12).forEach(to => pulses.push({ a: from, b: to, t: 0, speed: rand(.02, .03), hops: 0, hot: true })); };

  function step(dt: number) {
    for (const node of nodes) {
      if (node.ax !== undefined && node.ay !== undefined) {
        node.vx += (node.ax - node.x) * .0009 * dt + rand(-.02, .02);
        node.vy += (node.ay - node.y) * .0009 * dt + rand(-.02, .02);
        node.vx *= .94; node.vy *= .94;
      } else {
        node.vx += (node.bx - node.vx) * .02 * dt;
        node.vy += (node.by - node.vy) * .02 * dt;
      }
      const dx = node.x - pointer.x, dy = node.y - pointer.y, d = Math.hypot(dx, dy);
      if (d < 150 && d > .1) { const f = (1 - d / 150) * .55 * dt; node.vx += (dx / d) * f; node.vy += (dy / d) * f; }
      node.x += node.vx * dt; node.y += node.vy * dt;
      if (node.ax === undefined) {
        if (node.x < -20) node.x = width + 20; else if (node.x > width + 20) node.x = -20;
        if (node.y < -20) node.y = height + 20; else if (node.y > height + 20) node.y = -20;
      }
    }
    spawn += dt;
    if (spawn > 7) { spawn = 0; send(Math.floor(Math.random() * nodes.length)); }
    pulses = pulses.filter(pulse => {
      pulse.t += pulse.speed * dt;
      if (pulse.t < 1) return true;
      if (pulse.hops < 4 && Math.random() < .6) {
        const near = neighbours(pulse.b).filter(j => j !== pulse.a);
        if (near.length) { Object.assign(pulse, { a: pulse.b, b: near[Math.floor(Math.random() * near.length)], t: 0, hops: pulse.hops + 1 }); return true; }
      }
      return false;
    }).slice(-140);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    const limit = reach();
    const lit = hover >= 0 ? hover : -1;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
        if (d2 > limit * limit) continue;
        const d = Math.sqrt(d2);
        let alpha = (1 - d / limit) * .28;
        const mx = (a.x + b.x) / 2 - pointer.x, my = (a.y + b.y) / 2 - pointer.y;
        if (mx * mx + my * my < 160 * 160) alpha *= 2.2;
        if (i === lit || j === lit) alpha = Math.max(alpha, .75);
        ctx.strokeStyle = `rgba(142,152,255,${Math.min(alpha, .85).toFixed(3)})`;
        ctx.lineWidth = i === lit || j === lit ? 1.4 : 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    for (const pulse of pulses) {
      const a = nodes[pulse.a], b = nodes[pulse.b];
      if (!a || !b) continue;
      const x = a.x + (b.x - a.x) * pulse.t, y = a.y + (b.y - a.y) * pulse.t;
      ctx.fillStyle = pulse.hot ? 'rgba(111,211,163,.22)' : 'rgba(183,189,255,.18)';
      ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = pulse.hot ? '#6fd3a3' : '#dfe2ff';
      ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.font = '500 11px "JetBrains Mono Variable", ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    nodes.forEach((node, index) => {
      if (node.label) {
        const active = index === lit;
        ctx.fillStyle = active ? '#6fd3a3' : '#b7bdff';
        ctx.beginPath(); ctx.arc(node.x, node.y, active ? 5 : node.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = active ? 'rgba(111,211,163,.6)' : 'rgba(142,152,255,.45)';
        ctx.beginPath(); ctx.arc(node.x, node.y, active ? 12 : 8, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = active ? '#ffffff' : 'rgba(231,234,239,.86)';
        const text = node.label.toUpperCase();
        const flip = node.x + 16 + ctx.measureText(text).width > width - 8;
        ctx.textAlign = flip ? 'right' : 'left';
        ctx.fillText(text, node.x + (flip ? -14 : 14), node.y);
        ctx.textAlign = 'left';
      } else {
        ctx.fillStyle = 'rgba(231,234,239,.55)';
        ctx.beginPath(); ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  const running = () => motionOn() && inView && !document.hidden;
  function loop(time: number) {
    const dt = last ? Math.min((time - last) / 16.67, 3) : 1;
    last = time;
    step(dt);
    draw();
    frame = running() ? requestAnimationFrame(loop) : 0;
    if (!frame) last = 0;
  }
  const kick = () => { if (running() && !frame) frame = requestAnimationFrame(loop); else if (!running()) draw(); };

  function showTip(index: number) {
    if (!tip) return;
    if (index < 0) { tip.hidden = true; return; }
    const node = nodes[index];
    tip.querySelector('[data-tip-label]')!.textContent = node.label ?? '';
    tip.querySelector('[data-tip-note]')!.textContent = node.note ?? '';
    tip.style.left = `${Math.min(Math.max(node.x, 130), width - 130)}px`;
    tip.style.top = `${node.y}px`;
    tip.toggleAttribute('data-below', node.y < 150);
    tip.hidden = false;
  }
  const nearestLabel = (x: number, y: number, radius: number) => {
    let best = -1, bestD = radius * radius;
    nodes.forEach((node, index) => { if (!node.label) return; const d = (node.x - x) ** 2 + (node.y - y) ** 2; if (d < bestD) { best = index; bestD = d; } });
    return best;
  };
  const local = (event: PointerEvent) => { const box = canvas.getBoundingClientRect(); return { x: event.clientX - box.left, y: event.clientY - box.top }; };

  hero.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    pointer = local(event);
    hover = nearestLabel(pointer.x, pointer.y, 30);
    hero.style.cursor = hover >= 0 ? 'pointer' : '';
    showTip(hover);
    if (!running()) draw();
  });
  hero.addEventListener('pointerleave', () => { pointer = { x: -9999, y: -9999 }; if (!pinned) { hover = -1; showTip(-1); } if (!running()) draw(); });
  hero.addEventListener('pointerdown', event => {
    if ((event.target as Element).closest('a, button')) return;
    const at = local(event);
    const label = nearestLabel(at.x, at.y, event.pointerType === 'touch' ? 44 : 30);
    let source = label;
    if (source < 0) { let bestD = Infinity; nodes.forEach((node, index) => { const d = (node.x - at.x) ** 2 + (node.y - at.y) ** 2; if (d < bestD) { bestD = d; source = index; } }); }
    if (source >= 0) broadcast(source);
    if (label >= 0) {
      hover = label; showTip(label);
      window.clearTimeout(pinned); pinned = window.setTimeout(() => { pinned = 0; hover = -1; showTip(-1); if (!running()) draw(); }, 2800);
    }
    kick();
  });

  new ResizeObserver(() => { build(); hover = -1; showTip(-1); kick(); }).observe(hero);
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; kick(); }).observe(hero);
  document.addEventListener('visibilitychange', kick);
  window.addEventListener('omar:motion', kick);
  reduce.addEventListener('change', kick);
  // Test hook: labelled node positions (no effect on the page).
  Object.defineProperty(canvas, 'graphLabels', { value: () => nodes.filter(node => node.label).map(node => ({ label: node.label, x: node.x, y: node.y })) });
  build();
  for (let i = 0; i < 24; i++) send(Math.floor(Math.random() * nodes.length));
  kick();
}

export {};
