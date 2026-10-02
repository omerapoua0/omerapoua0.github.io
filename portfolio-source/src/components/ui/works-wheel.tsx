"use client";

/*
 * Adapted from the user-supplied CrafterUI Works Wheel, preserving its tangent
 * ring, bowed perspective drum and single-turn transform geometry.
 * Source: https://github.com/SriSomanaath/crafterui/blob/main/apps/web/registry/crafterui/ui/works-wheel.tsx
 * Adaptations: scoped CSS, SSR list, accessible controls, intent-based dragging,
 * opt-in wheel input, frame-independent easing and an on-demand animation loop.
 *
 * MIT License
 * Copyright (c) 2026 CrafterUI
 * Copyright (c) 2026 Moumen Soliman (site scaffold, from github.com/moumen-soliman/lab)
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import * as React from 'react';
import '../../styles/works-wheel.css';

export interface WorksWheelItem {
  title: string;
  image: string;
  href?: string;
  category?: string;
  description?: string;
}
export interface WorksWheelProps extends Omit<React.ComponentPropsWithoutRef<'section'>, 'children'> {
  items: WorksWheelItem[];
  label?: string;
  action?: string;
}

const CARD_H = .38, CARD_MAX_W = .34, CARD_RATIO = 1.45;
const STEP = 40, DRUM = 2.22, LENS = 2.7, RING_R = 1.14, BOW = 1.82, CULL = 1.6;
const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));
const rad = (degrees: number) => degrees * Math.PI / 180;
function place(ringDeg: number, drumDeg: number, ringR: number, drumR: number, bow: number, morph: number) {
  return `translateX(${-morph * bow * (1 - Math.cos(rad(drumDeg)))}px) rotateZ(${(1 - morph) * ringDeg}deg) translateY(${-(1 - morph) * ringR}px) rotateX(${morph * drumDeg}deg) translateZ(${morph * drumR}px)`;
}

type Drag = { id: number; x: number; y: number; start: number; locked: boolean };

export function WorksWheel({ items, label = 'Selected work', action = 'Explore project', className = '', ...props }: WorksWheelProps) {
  const uid = React.useId();
  const stageId = `${uid}-stage`;
  const helpId = `${uid}-help`;
  const stageRef = React.useRef<HTMLDivElement>(null);
  const wheelRef = React.useRef<HTMLDivElement>(null);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const titleRef = React.useRef<HTMLDivElement>(null);
  const cards = React.useRef<(HTMLAnchorElement | null)[]>([]);
  const turn = React.useRef(0);
  const target = React.useRef(0);
  const wake = React.useRef<() => void>(() => {});
  const drag = React.useRef<Drag | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  const [reduced, setReduced] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [expanded, setExpanded] = React.useState(false);
  const [wheelInput, setWheelInput] = React.useState(false);
  const count = items.length;
  const selected = items[active];
  const enhanced = hydrated && !reduced && count > 1;

  React.useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const read = () => setReduced(media.matches || document.documentElement.dataset.motion === 'off');
    read(); setHydrated(true);
    media.addEventListener('change', read);
    window.addEventListener('omar:motion', read);
    return () => { media.removeEventListener('change', read); window.removeEventListener('omar:motion', read); };
  }, []);

  const to = React.useCallback((next: number) => {
    target.current = clamp(next, 0, count);
    setExpanded(target.current > .01);
    wake.current();
  }, [count]);

  // Only explicit controls reveal the stage. Wheel, drag and ordinary keyboard
  // scrolling retain their native behavior, and focus stays on the control.
  const choose = React.useCallback((next: number) => {
    const stage = stageRef.current;
    if (stage) {
      const bounds = stage.getBoundingClientRect();
      const visibleHeight = Math.max(0, Math.min(bounds.bottom, innerHeight) - Math.max(bounds.top, 0));
      if (visibleHeight < Math.min(bounds.height, innerHeight) * .65) {
        stage.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }
    }
    to(next);
  }, [to]);

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!enhanced || !stage) return;
    let frame = 0, previous = 0, visible = true;
    let width = 0, height = 0;
    let cardW = 0, cardH = 0, ringR = 0, ringScale = 0, drumR = 0;
    const paint = () => {
      const morph = clamp(turn.current, 0, 1);
      const position = Math.max(0, turn.current - 1);
      if (wheelRef.current) wheelRef.current.style.transform = `translateZ(${-morph * drumR}px)`;
      cards.current.forEach((card, index) => {
        if (!card) return;
        const distance = index - position;
        const culled = morph > .5 && Math.abs(distance) > CULL;
        const interactive = !culled && (morph < .05 || Math.abs(distance) < .5);
        card.style.transform = place(distance * 360 / count, distance * STEP, ringR, drumR, cardH * BOW, morph);
        card.style.opacity = culled ? '0' : '1';
        card.style.zIndex = String(Math.round(100 - Math.abs(distance) * 2));
        card.style.pointerEvents = interactive ? 'auto' : 'none';
        card.tabIndex = interactive && card.hasAttribute('href') ? 0 : -1;
        card.inert = culled;
        card.setAttribute('aria-hidden', String(culled));
        const face = card.firstElementChild as HTMLElement | null;
        if (face) face.style.transform = `scale(${ringScale + (1 - ringScale) * morph})`;
      });
      if (labelRef.current) labelRef.current.style.opacity = String(1 - morph);
      if (titleRef.current) titleRef.current.style.opacity = String(morph);
      const nextActive = clamp(Math.round(position), 0, count - 1);
      setActive(current => current === nextActive ? current : nextActive);
      stage.dataset.turn = turn.current.toFixed(3);
    };
    const draw = (now: number) => {
      frame = 0;
      if (!visible || document.hidden) { stage.dataset.animating = 'false'; previous = 0; return; }
      const delta = previous ? Math.min((now - previous) / 1000, .064) : 1 / 60;
      previous = now;
      const gap = target.current - turn.current;
      turn.current = Math.abs(gap) < .0005 ? target.current : turn.current + gap * (1 - Math.exp(-9 * delta));
      paint();
      if (Math.abs(target.current - turn.current) > .0005) frame = requestAnimationFrame(draw);
      else { turn.current = target.current; paint(); previous = 0; stage.dataset.animating = 'false'; }
    };
    const start = () => {
      if (!frame && visible && !document.hidden && width > 0) { stage.dataset.animating = 'true'; frame = requestAnimationFrame(draw); }
    };
    wake.current = start;
    const measure = () => {
      width = stage.clientWidth; height = stage.clientHeight;
      cardW = Math.min(height * CARD_H * CARD_RATIO, width * (width < 600 ? .64 : CARD_MAX_W));
      cardH = cardW / CARD_RATIO;
      drumR = cardH * DRUM;
      ringR = cardH * RING_R;
      ringScale = clamp((2 * Math.PI * ringR / count) * .82 / (cardW || 1), .16, 1);
      // Fit the whole ring on narrow/short stages without changing its proportions.
      const fit = Math.min(1, (Math.min(width, height) - 36) / (2 * ringR + cardW * ringScale));
      ringR *= fit; ringScale *= fit;
      stage.style.perspective = `${cardH * LENS}px`;
      cards.current.forEach(card => { if (card) Object.assign(card.style, { width: `${cardW}px`, height: `${cardH}px`, marginLeft: `${-cardW / 2}px`, marginTop: `${-cardH / 2}px` }); });
      paint(); start();
    };
    const resize = new ResizeObserver(measure);
    resize.observe(stage); measure();
    const intersection = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false;
      stage.dataset.visible = String(visible);
      if (visible) start();
      else { cancelAnimationFrame(frame); frame = 0; previous = 0; stage.dataset.animating = 'false'; }
    }, { rootMargin: '80px' });
    intersection.observe(stage);
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previous = 0; stage.dataset.animating = 'false'; } else start(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { cancelAnimationFrame(frame); resize.disconnect(); intersection.disconnect(); document.removeEventListener('visibilitychange', visibility); wake.current = () => {}; };
  }, [enhanced, count]);

  React.useEffect(() => {
    const stage = stageRef.current;
    if (!enhanced || !stage || !wheelInput) return;
    let settle = 0;
    const onWheel = (event: WheelEvent) => {
      if (!matchMedia('(pointer:fine) and (min-width:721px)').matches || event.ctrlKey) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1);
      if (!delta || (target.current <= 0 && delta < 0) || (target.current >= count && delta > 0)) return;
      event.preventDefault();
      to(target.current + delta / 700);
      clearTimeout(settle);
      settle = window.setTimeout(() => to(Math.round(target.current)), 150);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => { clearTimeout(settle); stage.removeEventListener('wheel', onWheel); };
  }, [enhanced, wheelInput, count, to]);

  function endDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.locked) to(Math.round(target.current));
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  return <section {...props} className={`works-wheel ${className}`} aria-label={props['aria-label'] || label} data-enhanced={enhanced}>
    <div className="works-wheel-interactive" hidden={!enhanced}>
      <div className="works-wheel-composition">
        <div className="works-wheel-stage" ref={stageRef} id={stageId} data-expanded={expanded} tabIndex={0} role="region" aria-label={`${label}, interactive project wheel`} aria-describedby={helpId}
          onKeyDown={event => {
            if (event.altKey || event.ctrlKey || event.metaKey) return;
            if (['ArrowRight', 'ArrowDown'].includes(event.key)) to(Math.round(target.current) + 1);
            else if (['ArrowLeft', 'ArrowUp'].includes(event.key)) to(Math.round(target.current) - 1);
            else if (event.key === 'Home') to(1);
            else if (event.key === 'End') to(count);
            else if (event.key === 'Escape') to(0);
            else if (event.key === 'Enter' && event.target === event.currentTarget) { if (target.current < .5) to(1); else cards.current[active]?.click(); }
            else return;
            event.preventDefault();
            if (event.key !== 'Enter' && event.target !== event.currentTarget) event.currentTarget.focus({ preventScroll: true });
          }}
          onPointerDown={event => {
            if (event.button !== 0 || (event.target as Element).closest('a,button')) return;
            drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: target.current, locked: false };
          }}
          onPointerMove={event => {
            const state = drag.current;
            if (!state || state.id !== event.pointerId) return;
            const dx = state.x - event.clientX, dy = state.y - event.clientY;
            if (!state.locked) {
              if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; }
              if (Math.abs(dx) < 9 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
              state.locked = true; event.currentTarget.setPointerCapture(event.pointerId);
            }
            to(state.start + dx / (event.currentTarget.clientWidth < 600 ? 220 : 300));
          }}
          onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={() => { drag.current = null; }}>
          <div className="works-wheel-drum" ref={wheelRef}>{items.map((item, index) => <a key={`${item.title}-${index}`} id={`${uid}-card-${index}`} href={item.href} aria-label={`${item.title}${item.category ? `, ${item.category}` : ''}`} className="works-wheel-card" ref={node => { cards.current[index] = node; }} tabIndex={-1}><span className="works-wheel-face"><img src={item.image} alt="" draggable={false} loading="lazy" width="1000" height="690" />{item.href && action && <span className="works-wheel-affordance">{action} ↗</span>}</span></a>)}</div>
          <div className="works-wheel-ring-label" ref={labelRef} aria-hidden="true"><span>Explore the work</span><strong>{label}</strong><span>Turn a new perspective</span></div>
          <div className="works-wheel-front-title" ref={titleRef} aria-hidden="true"><span>{selected?.category}</span><strong>{selected?.title}</strong></div>
          <span className="works-wheel-drag-hint" aria-hidden="true">← Drag the open space to turn →</span>
        </div>
        <aside className="works-wheel-index"><p className="works-wheel-eyebrow">The index / {String(count).padStart(2, '0')}</p><ol>{items.map((item, index) => <li key={`${item.title}-${index}`}><button type="button" aria-controls={stageId} aria-pressed={expanded && index === active} onClick={() => choose(index + 1)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><span aria-hidden="true">↗</span></button></li>)}</ol><p className="works-wheel-index-note">Choose a project.<br />See the thinking behind it.</p></aside>
      </div>
      <div className="works-wheel-bottom"><div className="works-wheel-readout" aria-live="polite" aria-atomic="true"><span className="works-wheel-eyebrow">{expanded ? `${String(active + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}` : 'A different perspective'}</span><h3>{expanded ? selected?.title : 'Ideas, in motion.'}</h3><p>{expanded ? selected?.description : 'Turn the wheel to explore the work, one project at a time.'}</p>{expanded && selected?.href && <a className="works-wheel-open" href={selected.href}>{action || 'Open project'} <span aria-hidden="true">↗</span></a>}</div><div className="works-wheel-controls"><div className="works-wheel-buttons"><button type="button" onClick={() => choose(Math.round(target.current) - 1)} disabled={!expanded} aria-label="Previous project" aria-controls={stageId}>←</button><button type="button" className="works-wheel-overview" onClick={() => choose(0)} aria-controls={stageId}>Overview</button><button type="button" onClick={() => choose(Math.round(target.current) + 1)} disabled={expanded && active === count - 1} aria-label="Next project" aria-controls={stageId}>→</button></div><button type="button" className="works-wheel-scroll-toggle" onClick={() => setWheelInput(value => !value)} aria-pressed={wheelInput}>Scroll to turn: {wheelInput ? 'on' : 'off'}</button><p id={helpId}>Arrow keys to turn. Home or End to jump. Enter to open. Swipe sideways on the open space.</p></div></div>
    </div>
    <ol className="works-wheel-fallback" hidden={enhanced}>{items.map((item, index) => <li key={`${item.title}-${index}`}><a href={item.href} className="works-wheel-list-card"><img src={item.image} alt="" width="1000" height="690" loading="lazy" /><div><span className="works-wheel-eyebrow">{item.category || String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3>{item.description && <p>{item.description}</p>}{item.href && <span className="works-wheel-open">{action || 'Open project'} ↗</span>}</div></a></li>)}</ol>
    {!count && <p className="works-wheel-empty">Projects will appear here when added.</p>}
  </section>;
}
export default WorksWheel;
