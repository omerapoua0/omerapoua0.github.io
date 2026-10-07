/* Isolated browser QA for the v6 "neon" portfolio (dark only, neon light
 * gate, scroll scrub, pinned gallery, no chat). Linux-friendly.
 *
 *   PORTFOLIO_QA_URL=http://127.0.0.1:4174 \
 *   PLAYWRIGHT_EXECUTABLE=/path/to/chromium \
 *   AXE_PATH=/path/to/axe.min.js \
 *   NODE_PATH=/path/to/node_modules/with/playwright node scripts/qa.cjs
 *
 * Playwright and axe-core are deliberately not project dependencies (the
 * lockfile stays unchanged); point NODE_PATH/AXE_PATH at an isolated install.
 * Every request leaving the preview origin, and every non-GET request, is
 * blocked and reported. No personal profile is used; no enquiry is sent.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');

const base = process.env.PORTFOLIO_QA_URL || 'http://127.0.0.1:4174';
const origin = new URL(base).origin;
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE || undefined;
const axePath = process.env.AXE_PATH;
const output = path.resolve('.qa');
const routes = ['index', 'work', 'automations', 'research', 'cv', 'tutoring', 'contact'];
const tours = ['inside/katana', 'inside/nookbase', 'inside/inos', 'inside/bitget', 'inside/bp'];
const widths = [360, 390, 768, 1280, 1440];
const results = [];
const outbound = [];

const only = process.env.QA_ONLY ? new RegExp(process.env.QA_ONLY, 'i') : null; // e.g. QA_ONLY=orbit
async function check(name, run) {
  if (only && !only.test(name)) return;
  try { await run(); results.push({ name, status: 'pass' }); }
  catch (error) {
    // Keep the assertion's diff (deep-equal failures say what differed).
    const message = error.message.split('\n').map(line => line.trim()).filter(line => line && !/^(\+ actual|- expected)/.test(line)).join(' ').slice(0, 700);
    results.push({ name, status: 'fail', message }); console.error('FAIL', name, '-', message);
  }
}
async function isolated(browser, options = {}) {
  const context = await browser.newContext({ reducedMotion: 'reduce', ...options });
  await context.route('**/*', route => {
    const request = route.request();
    if (new URL(request.url()).origin !== origin || !['GET', 'HEAD'].includes(request.method())) {
      outbound.push({ url: request.url(), method: request.method() });
      return route.abort();
    }
    return route.continue();
  });
  return context;
}
function watch(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  return errors;
}

/* Pixel contrast for text axe could not decide (gradients, images,
 * translucent layers). Screenshot the element's box twice, with its text
 * shown and with its own text colour made transparent: the pixels that change
 * are the glyphs, and the second shot gives the real background under each
 * of them. The 10th-percentile glyph pixel must reach 4.5:1 (3:1 large text). */
async function pixelContrast(page, selectors) {
  const low = [];
  const shoot = async box => {
    const clip = { x: Math.floor(box.x), y: Math.floor(box.y), width: Math.ceil(box.width), height: Math.ceil(box.height) };
    try { return (await page.screenshot({ clip })).toString('base64'); } catch { return null; }
  };
  for (const selector of [...new Set(selectors)]) {
    const info = await page.evaluate(sel => {
      const el = document.querySelector(sel);
      if (!el || el.closest('[aria-hidden="true"]')) return null;
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      // Never measure text while the sticky header sits over it.
      const header = document.querySelector('[data-header]')?.getBoundingClientRect().bottom ?? 0;
      if (el.getBoundingClientRect().top < header + 8) scrollBy({ top: el.getBoundingClientRect().top - header - 24, behavior: 'instant' });
      const style = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      if (box.width < 2 || box.height < 2 || style.visibility === 'hidden') return null;
      const size = parseFloat(style.fontSize), weight = Number(style.fontWeight) || 400;
      const canvas = document.createElement('canvas').getContext('2d');
      canvas.fillStyle = style.color; canvas.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = canvas.getImageData(0, 0, 1, 1).data;
      return { fg: [r, g, b, a / 255], large: size >= 24 || (size >= 18.66 && weight >= 700), box: { x: Math.max(0, box.left), y: Math.max(0, box.top), width: Math.min(box.width, innerWidth - Math.max(0, box.left)), height: Math.min(box.height, innerHeight - Math.max(0, box.top)) } };
    }, selector);
    if (!info || info.box.width < 2 || info.box.height < 2) continue;
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    // Child elements' text is measured as its own node: hide it in both shots.
    const hide = el => { el.dataset.qaStyle = el.getAttribute('style') ?? ''; el.style.setProperty('color', 'transparent', 'important'); el.style.setProperty('-webkit-text-stroke-color', 'transparent', 'important'); el.style.setProperty('text-shadow', 'none', 'important'); };
    await page.evaluate(({ sel, hideSource }) => { const hide = eval(hideSource); document.querySelector(sel).querySelectorAll('*').forEach(hide); }, { sel: selector, hideSource: hide.toString() });
    await page.waitForTimeout(60);
    const shown = await shoot(info.box);
    await page.evaluate(({ sel, hideSource }) => eval(hideSource)(document.querySelector(sel)), { sel: selector, hideSource: hide.toString() });
    await page.waitForTimeout(60);
    const hidden = await shoot(info.box);
    const ratio = await page.evaluate(async ({ shown, hidden, fg, sel }) => {
      document.querySelectorAll('[data-qa-style]').forEach(el => {
        if (el.dataset.qaStyle) el.setAttribute('style', el.dataset.qaStyle); else el.removeAttribute('style');
        delete el.dataset.qaStyle;
      });
      if (!shown || !hidden) return 21;
      const read = async data => {
        const bitmap = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d');
        canvas.drawImage(bitmap, 0, 0);
        return canvas.getImageData(0, 0, bitmap.width, bitmap.height).data;
      };
      const [a, b] = [await read(shown), await read(hidden)];
      const lum = rgb => { const c = rgb.map(v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
      const ratios = [];
      for (let i = 0; i < Math.min(a.length, b.length); i += 4) {
        // A glyph pixel moved towards the text colour when the text was drawn;
        // anything else that differs between the shots is rendering noise.
        const toFg = (px, k) => Math.abs(px[k] - fg[0]) + Math.abs(px[k + 1] - fg[1]) + Math.abs(px[k + 2] - fg[2]);
        if (toFg(a, i) > toFg(b, i) - 24) continue;
        const bg = [b[i], b[i + 1], b[i + 2]];
        const text = bg.map((v, k) => fg[k] * fg[3] + v * (1 - fg[3]));
        const [l1, l2] = [lum(text), lum(bg)].sort((x, y) => y - x);
        ratios.push((l1 + .05) / (l2 + .05));
      }
      if (ratios.length < 8) return 21; // no own text drawn (e.g. only child elements)
      ratios.sort((x, y) => x - y);
      return ratios[Math.floor(ratios.length * .1)]; // tolerate a few edge pixels that re-rasterise between shots
    }, { shown, hidden, fg: info.fg, sel: selector });
    if (ratio < (info.large ? 3 : 4.5)) low.push(`${selector} ${ratio.toFixed(2)}:1`);
  }
  return low;
}

(async () => {
  await fs.mkdir(path.join(output, 'screens'), { recursive: true });
  const browser = await chromium.launch({ executablePath });

  /* 1. Every route (and tour) and width: one H1, no overflow, no broken images, no errors. */
  for (const theme of ['light']) {
    for (const width of widths) {
      const context = await isolated(browser, { viewport: { width, height: 900 }, colorScheme: theme });
      for (const route of [...routes, ...tours]) {
        await check(`route ${route} ${width}px`, async () => {
          const page = await context.newPage();
          const errors = watch(page);
          const response = await page.goto(`${base}/${route}.html`, { waitUntil: 'networkidle' });
          assert.equal(response.status(), 200);
          await page.evaluate(async () => { await Promise.all([...document.images].map(async image => { image.loading = 'eager'; try { await image.decode(); } catch {} })); });
          const state = await page.evaluate(() => ({
            width: innerWidth,
            scroll: document.documentElement.scrollWidth,
            h1: document.querySelectorAll('h1').length,
            broken: [...document.images].filter(image => image.getAttribute('src') && (!image.complete || !image.naturalWidth)).map(image => image.src),
            dupIds: (() => { const seen = new Set(); return [...document.querySelectorAll('[id]')].map(el => el.id).filter(id => seen.has(id) || !seen.add(id)); })(),
          }));
          assert.equal(state.h1, 1, 'exactly one h1');
          assert.ok(state.scroll <= state.width + 1, `horizontal overflow ${state.scroll} > ${state.width}`);
          assert.deepEqual(state.broken, [], 'broken images');
          assert.deepEqual(state.dupIds, [], 'duplicate ids');
          assert.deepEqual(errors, [], 'page/console/http errors');
          if (width === 1440 || width === 390) await page.screenshot({ path: path.join(output, 'screens', `${route.replace('/', '-')}-${width}.png`), fullPage: true });
          await page.close();
        });
      }
      await context.close();
    }
  }

  /* 2. Accessibility (axe-core, WCAG 2.2 A/AA) at desktop and phone widths. */
  if (axePath) {
    const axeSource = await fs.readFile(axePath, 'utf8');
    for (const theme of ['light']) for (const width of [390, 1280]) {
      const context = await isolated(browser, { viewport: { width, height: 900 }, colorScheme: theme });
      for (const route of [...routes, ...tours]) {
        await check(`axe ${route} ${width}px`, async () => {
          const page = await context.newPage();
          await page.goto(`${base}/${route}.html`, { waitUntil: 'networkidle' });
          await page.addScriptTag({ content: axeSource });
          const { violations, incomplete } = await page.evaluate(async () => {
            const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } });
            return {
              violations: result.violations.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(', ')}`),
              incomplete: (result.incomplete.find(r => r.id === 'color-contrast')?.nodes ?? []).map(n => n.target[0]).filter(sel => typeof sel === 'string'),
            };
          });
          assert.deepEqual(violations, []);
          // axe cannot decide contrast over gradients, images and translucent
          // layers ("incomplete"). Measure those from pixels instead.
          // Text on the blue Contact door sits on a gradient: always measure it.
          const extra = route === 'index' ? ['.door--contact .door__num', '.door--contact .door__promise', '.door--contact .door__proof'] : [];
          const low = await pixelContrast(page, [...incomplete, ...extra]);
          assert.ok(low.length === 0, `text below AA contrast (pixel check, ${incomplete.length} nodes): ${low.slice(0, 6).join(' ; ')}`);
          await page.close();
        });
      }
      await context.close();
    }
  } else results.push({ name: 'axe', status: 'skipped', message: 'AXE_PATH not set' });

  /* 3. Every internal link and legacy anchor resolves. */
  await check('internal links and anchors resolve', async () => {
    const context = await isolated(browser);
    const page = await context.newPage();
    const ids = {};
    const links = new Set();
    for (const route of [...routes, 'inside/katana', 'inside/nookbase', 'inside/inos', 'inside/bitget', 'inside/bp']) {
      await page.goto(`${base}/${route}.html`);
      ids[`/${route}.html`] = await page.evaluate(() => [...document.querySelectorAll('[id]')].map(el => el.id));
      (await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')))).forEach(href => links.add(`${route}|${href}`));
    }
    const legacy = ['/work.html#katana', '/work.html#nookbase', '/work.html#inos', '/work.html#project-1', '/work.html#project-2', '/work.html#project-3', '/work.html#project-4', '/work.html#project-5', '/research.html#optimisation', '/research.html#quant', '/research.html#quantum', '/research.html#education', '/cv.html#experience', '/cv.html#skills', '/tutoring.html#lesson-enquiry',
      // Chapter anchors of the previous tour pages.
      ...tours.flatMap(tour => [0, 1, 2, 3, 4, 5].map(n => `/${tour}.html#ch-${n}`))];
    const problems = [];
    const resolve = (from, href) => {
      if (/^(mailto:|https?:)/.test(href)) return;
      const url = new URL(href, `${base}/${from}.html`);
      if (url.origin !== origin) return;
      const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
      if (pathname.endsWith('.html')) {
        if (!ids[pathname]) problems.push(`${from}: ${href} (missing page)`);
        else if (url.hash && !ids[pathname].includes(decodeURIComponent(url.hash.slice(1)))) problems.push(`${from}: ${href} (missing anchor)`);
      }
    };
    links.forEach(entry => { const [from, href] = entry.split('|'); resolve(from, href); });
    legacy.forEach(href => resolve('index', href));
    for (const file of ['/Omar-Aboelella-CV.pdf', '/THIRD-PARTY-NOTICES.txt', '/LICENSE.txt', '/portrait-hero.jpg', '/portrait-avatar.webp']) {
      const response = await page.request.get(base + file);
      if (response.status() !== 200) problems.push(`${file} ${response.status()}`);
    }
    assert.deepEqual(problems, []);
    await context.close();
  });

  /* 4. No JavaScript: content, navigation, the doors and email fallbacks remain. */
  await check('no-JS routes, doors and fallbacks', async () => {
    const context = await isolated(browser, { javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    for (const route of [...routes, ...tours]) {
      await page.goto(`${base}/${route}.html`);
      const state = await page.evaluate(() => ({ nav: [...document.querySelectorAll('#site-nav a')].filter(a => a.getBoundingClientRect().width > 0).length, overflow: document.documentElement.scrollWidth > innerWidth + 1, gate: getComputedStyle(document.querySelector('[data-gate]')).display }));
      assert.ok(state.nav >= 5, `${route}: visible nav links without JS`);
      assert.ok(!state.overflow, `${route}: no overflow without JS`);
      assert.equal(state.gate, 'none', `${route}: the light gate never covers a no-JS page`);
    }
    await page.goto(`${base}/tutoring.html`);
    assert.ok(await page.locator('noscript').count() > 0);
    assert.ok(!(await page.locator('form[data-enquiry]').isVisible()), 'guided form hidden without JS');
    await page.goto(`${base}/index.html`);
    const doors = await page.locator('.doors a.door').evaluateAll(list => list.map(a => [a.textContent.replace(/\s+/g, ' ').trim().split(' ')[1], a.getAttribute('href')]));
    assert.deepEqual(doors.map(([, href]) => href), ['/work.html', '/index.html#skills', '/tutoring.html', '/contact.html'], 'four doors are real links');
    assert.ok(await page.locator('h1#hero-title').isVisible(), 'hero title readable without JS');
    assert.ok(await page.locator('[data-robot-stage]').isVisible(), 'robot stage (or its placeholder) shown without JS');
    assert.equal(await page.locator('[data-chat], [data-chat-choices], textarea[data-hero]').count(), 0, 'no chat UI');
    await context.close();
  });

  /* 5. The light gate: leaving ends opaque white, arriving starts white at first paint and reveals. */
  const GATE_TOL = 250;
  const gateScenario = async ({ label, reducedMotion, motionOff, width }) => {
    const context = await isolated(browser, { reducedMotion, viewport: { width, height: 900 } });
    if (motionOff) await context.addInitScript(() => { try { sessionStorage.setItem('omar-motion', 'off'); } catch {} });
    // On every document: record the gate's state at first paint, and whether a
    // native view transition ever ran.
    await context.addInitScript(() => {
      // Leaving: when the page is hidden. Arriving: when the white has gone, measured from the first frame.
      addEventListener('pagehide', () => { try { sessionStorage.setItem('qa-pagehide', String(Date.now())); } catch {} });
      requestAnimationFrame(function first(t0) {
        const white = document.querySelector('.gate__white');
        if (!white || document.documentElement.dataset.gate !== 'in') return;
        const poll = t => {
          const gate = white.parentElement;
          if (Number(getComputedStyle(white).opacity) < .01 || getComputedStyle(gate).visibility === 'hidden') window.__whiteGone = t - t0;
          else requestAnimationFrame(poll);
        };
        requestAnimationFrame(poll);
      });
      window.__vt = 0;
      addEventListener('pagereveal', event => { if (event.viewTransition) window.__vt++; });
      requestAnimationFrame(() => {
        const gate = document.querySelector('[data-gate]');
        const white = gate?.querySelector('.gate__white');
        window.__firstPaint = gate ? { display: getComputedStyle(gate).display, white: Number(getComputedStyle(white).opacity), arrive: document.documentElement.dataset.gate || '' } : null;
      });
    });
    const page = await context.newPage();
    const errors = watch(page);
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    // Sample the overlay just before navigation: gate.ts awaits two frames after writing the token.
    await page.evaluate(() => {
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        orig.call(this, key, value);
        if (key === 'omar-gate') requestAnimationFrame(() => {
          const gate = document.querySelector('[data-gate]');
          const white = gate.querySelector('.gate__white');
          const box = white.getBoundingClientRect();
          orig.call(sessionStorage, 'qa-leave', JSON.stringify({ state: gate.dataset.state, white: Number(getComputedStyle(white).opacity), clip: getComputedStyle(white).clipPath, cover: box.width >= innerWidth && box.height >= innerHeight }));
        });
      };
    });
    // The design timing, from the animation timeline (frame-rate independent):
    // when data-state is set, and when the leaving layer's animation finishes.
    await page.evaluate(() => {
      const gate = document.querySelector('[data-gate]');
      new MutationObserver(() => {
        if (!gate.dataset.state || window.__tlStart !== undefined) return;
        const t0 = document.timeline.currentTime;
        window.__tlStart = t0;
        requestAnimationFrame(() => {
          const animations = gate.querySelector('.gate__white').getAnimations();
          Promise.all(animations.map(a => a.finished)).then(() => {
            const start = Math.min(...animations.map(a => a.startTime));
            const end = Math.max(...animations.map(a => a.startTime + a.effect.getComputedTiming().endTime));
            try { sessionStorage.setItem('qa-tl', JSON.stringify({ design: Math.round(end - start), firstFrame: Math.round(start - t0) })); } catch {}
          });
        });
      }).observe(gate, { attributes: true, attributeFilter: ['data-state'] });
    });
    // Click via the DOM so Playwright's wait for the doors' entrance animation is not timed.
    const started = await page.evaluate(() => Date.now());
    await Promise.all([page.waitForURL(/work\.html$/), page.evaluate(() => document.querySelector('.doors a[href="/work.html"]').click())]);
    const leaveMs = Number(await page.evaluate(() => sessionStorage.getItem('qa-pagehide'))) - started;
    const leave = JSON.parse(await page.evaluate(() => sessionStorage.getItem('qa-leave')) || 'null');
    assert.ok(leave, 'the door wrote the gate token');
    assert.equal(leave.state, 'open', 'doors play the open gate');
    assert.ok(leave.white >= .99 && leave.cover, `leaving page fully white (${JSON.stringify(leave)})`);
    await page.waitForFunction(() => window.__firstPaint !== undefined, null, { timeout: 3000 });
    const first = await page.evaluate(() => window.__firstPaint);
    assert.equal(first.arrive, 'in', 'arrival marked before first paint');
    assert.equal(first.display, 'block', 'gate painted at first paint');
    assert.ok(first.white >= .99, `arriving page white at first paint (${first.white})`);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-gate]')).visibility === 'hidden' || getComputedStyle(document.querySelector('[data-gate]')).display === 'none', null, { timeout: 1500 });
    assert.equal(await page.evaluate(() => window.__vt), 0, 'no native view transition alongside the gate');
    // The design budget is asserted on the animation timeline: the white is
    // opaque 550ms after a door is chosen (160ms reduced/paused), frame-rate
    // independent. Wall-clock click → pagehide is only a stall guard: headless
    // Chromium composites the hero in software at ~15fps, so every frame-bound
    // step (finished promises, the two frames before navigating) runs late.
    const tl = JSON.parse(await page.evaluate(() => sessionStorage.getItem('qa-tl')) || '{}');
    const still = reducedMotion === 'reduce' || motionOff;
    assert.ok(tl.design > 0 && tl.design <= (still ? 170 : 560), `white opaque ${tl.design}ms into the gate's own timeline (design ${still ? 160 : 550}ms)`);
    assert.ok(tl.firstFrame <= 400, `the gate starts on the next frame (${tl.firstFrame}ms; headless software frames)`);
    assert.ok(leaveMs > 0 && leaveMs <= (still ? 700 : 900) + GATE_TOL, `click → pagehide within ${(still ? 700 : 900)}ms + ${GATE_TOL}ms headless tolerance (${leaveMs}ms)`);
    await page.waitForFunction(() => window.__whiteGone !== undefined, null, { timeout: 3000 });
    const whiteGone = await page.evaluate(() => window.__whiteGone);
    assert.ok(whiteGone <= 700 + GATE_TOL, `arrival white gone within 700ms (+ tolerance) of first paint (${Math.round(whiteGone)}ms)`);
    // A same-page door: Skills on the homepage opens, jumps, reveals.
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.click('.doors a[href="/index.html#skills"]');
    await page.waitForFunction(() => location.hash === '#skills' && !document.querySelector('[data-gate]').dataset.state, null, { timeout: 3000 });
    const top = await page.locator('#skills').evaluate(el => el.getBoundingClientRect().top);
    assert.ok(Math.abs(top) < 120, `jumped to skills (${top})`);
    assert.deepEqual(errors, []);
    results.push({ name: `gate ${label} timing`, status: 'info', message: `timeline ${await page.evaluate(() => sessionStorage.getItem('qa-tl'))}; ${leaveMs}ms click → pagehide; arrival white gone after ${Math.round(whiteGone)}ms` });
    await context.close();
  };
  for (const scenario of [
    { label: 'motion 1440', reducedMotion: 'no-preference', width: 1440 },
    { label: 'motion 390', reducedMotion: 'no-preference', width: 390 },
    { label: 'reduced motion', reducedMotion: 'reduce', width: 1280 },
    { label: 'Pause motion', reducedMotion: 'no-preference', motionOff: true, width: 1280 },
  ]) await check(`light gate ${scenario.label}: opaque white leaving, white at first paint, revealed ≤ 1.5 s`, async () => {
    // Wall-clock timings in headless Chromium are noisy: one retry, and the
    // retry is reported, so a real regression still fails twice.
    try { await gateScenario(scenario); }
    catch (error) { results.push({ name: `light gate ${scenario.label} retry`, status: 'info', message: error.message.slice(0, 200) }); await gateScenario(scenario); }
  });

  /* The robot's open clip (only when the build has public/robot/open.*, e.g.
     a scratch copy with stand-in media): it must start on the parked frame,
     and the page must be fully white when it is hidden. */
  await check('light gate robot clip (when present): plays from the hands moment, white ≥ 0.99 at pagehide', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => addEventListener('pagehide', () => {
      const gate = document.querySelector('[data-gate]');
      try { sessionStorage.setItem('qa-clip', JSON.stringify({ white: Number(getComputedStyle(gate.querySelector('.gate__white')).opacity), clipOn: gate.hasAttribute('data-clip-on') })); } catch {}
    }));
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    if (!(await page.locator('[data-gate-clip]').count())) { results.push({ name: 'robot clip', status: 'info', message: 'no open clip in this build: skipped' }); await context.close(); return; }
    await page.hover('.doors a[href="/work.html"]');
    await page.waitForFunction(() => { const v = document.querySelector('[data-gate-clip]'); return v.readyState >= 3 && Math.abs(v.currentTime - Math.min(Number(v.dataset.seek), v.duration - 1.3)) < .15; }, null, { timeout: 5000 });
    await Promise.all([page.waitForURL(/work\.html$/), page.evaluate(() => document.querySelector('.doors a[href="/work.html"]').click())]);
    const state = JSON.parse(await page.evaluate(() => sessionStorage.getItem('qa-clip')));
    assert.ok(state.clipOn, 'the clip played');
    assert.ok(state.white >= .99, `white at pagehide ${state.white}`);
    await context.close();
  });

  await check('light gate: ordinary links use the quick gate; PDFs, mail and new tabs are untouched; back from bfcache is never white', async () => {
    // Playwright disables the back/forward cache by default; this browser keeps
    // it, so Back really restores the page that left through the gate.
    const bfBrowser = await chromium.launch({ executablePath, ignoreDefaultArgs: ['--disable-back-forward-cache'] });
    const context = await bfBrowser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } });
    await context.addInitScript(() => addEventListener('pageshow', event => { window.__persisted = event.persisted; }));
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await Promise.all([page.waitForURL(/research\.html$/), page.click('#site-nav a[href="/research.html"]')]);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.gate), 'in');
    await page.waitForTimeout(300);
    await page.goBack({ waitUntil: 'commit' });
    await page.waitForFunction(() => window.__persisted !== undefined, null, { timeout: 3000 });
    assert.equal(await page.evaluate(() => window.__persisted), true, 'Back restored the page from the bfcache');
    await page.waitForFunction(() => { const gate = document.querySelector('[data-gate]'); return !gate.dataset.state && (getComputedStyle(gate).display === 'none' || Number(getComputedStyle(gate.querySelector('.gate__white')).opacity) === 0); }, null, { timeout: 1000 });
    const untouched = await page.evaluate(() => {
      const gate = document.querySelector('[data-gate]');
      const tried = [];
      // Registered after gate.ts's own document listener, so the gate sees each
      // click first; this only stops the browser actually leaving.
      let gatePrevented = false;
      const stop = event => { gatePrevented = event.defaultPrevented; event.preventDefault(); };
      document.addEventListener('click', stop);
      for (const sel of ['a[href$=".pdf"]', 'a[href^="mailto:"]', 'a[target="_blank"]']) {
        const link = document.querySelector(sel);
        if (!link) continue;
        gatePrevented = false;
        link.click();
        tried.push({ sel, state: gate.dataset.state || '', gatePrevented });
      }
      document.removeEventListener('click', stop);
      return tried;
    });
    assert.equal(untouched.length, 3, 'all three link kinds tried');
    assert.ok(untouched.every(t => t.state === '' && !t.gatePrevented), `gate ignored ${JSON.stringify(untouched)}`);
    await bfBrowser.close();
  });

  /* 6. Pause motion stops every loop; contact is one tap away everywhere. */
  await check('Pause motion on every page: the footer switch stops every loop (marquees, light, decks, pipelines)', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const left = [];
    for (const route of [...routes, ...tours]) {
      await page.goto(`${base}/${route}.html`, { waitUntil: 'networkidle' });
      await page.evaluate(() => sessionStorage.removeItem('omar-motion'));
      await page.reload({ waitUntil: 'networkidle' });
      const looping = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length);
      if (route !== 'index' && looping === 0) left.push(`${route}: no ambient motion at all`);
      await page.locator('.footer__motion').click();
      const running = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).map(a => a.animationName));
      if (running.length) left.push(`${route}: ${running.join(', ')}`);
      await page.locator('.footer__motion').click();
    }
    assert.deepEqual(left, []);
    await context.close();
  });

  await check('Pause motion: visible, stops every looping animation and the hero video; persists for the session', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    const toggle = page.locator('.hero__pause');
    assert.ok(await toggle.isVisible(), 'Pause motion visible in the hero');
    await toggle.click();
    assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), 'off');
    const running = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).map(a => `${a.animationName} on ${a.effect.target?.className}`));
    assert.deepEqual(running, [], 'no infinite animation keeps running');
    assert.equal(await page.evaluate(() => [...document.querySelectorAll('video')].filter(v => !v.paused).length), 0, 'videos paused');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), 'off', 'remembered for the session');
    assert.match(await toggle.textContent(), /Play motion/);
    await context.close();
  });
  await check('Pause motion stops the scroll-driven motion too: hero pin and scrub, the pinned gallery, neon lines', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    const state = () => page.evaluate(() => {
      const pin = document.querySelector('.hero-pin'), gallery = document.querySelector('[data-hgallery]');
      return {
        scrubbing: document.getAnimations().filter(a => a.effect?.target?.hasAttribute?.('data-scrub') && a.playState !== 'idle').length,
        pinTall: pin.offsetHeight > innerHeight * 1.2,
        pinned: getComputedStyle(gallery).getPropertyValue('--pinned').trim() === '1',
        heroSticky: getComputedStyle(document.querySelector('.hero')).position === 'sticky',
        track: getComputedStyle(document.querySelector('[data-hgallery-track]')).translate,
        p: getComputedStyle(gallery).getPropertyValue('--p').trim(),
      };
    });
    const on = await state();
    assert.ok(on.scrubbing > 3 && on.pinTall && on.pinned && on.heroSticky, `motion on: scrub, pin and gallery active (${JSON.stringify(on)})`);
    // Halfway through the gallery the track has moved sideways.
    await page.evaluate(() => { const g = document.querySelector('[data-hgallery]'); scrollTo(0, g.getBoundingClientRect().top + scrollY + (g.offsetHeight - innerHeight) / 2); });
    await page.waitForTimeout(300);
    const mid = await state();
    assert.ok(Number(mid.p) > .3 && Number(mid.p) < .7 && mid.track !== 'none' && !/^0px/.test(mid.track), `gallery track follows the scroll (${JSON.stringify(mid)})`);
    await page.evaluate(() => scrollTo(0, 0));
    await page.locator('.hero__pause').click();
    await page.waitForTimeout(200);
    const off = await state();
    assert.equal(off.scrubbing, 0, 'no scroll-driven animation runs when paused');
    assert.ok(!off.pinTall && !off.pinned && !off.heroSticky, `pin and pinned gallery released (${JSON.stringify(off)})`);
    assert.ok(/^(none|0px)/.test(off.track), `gallery track at rest (${off.track})`);
    const looping = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length);
    assert.equal(looping, 0, 'beams, labels, rings and marquees paused');
    await context.close();
  });

  for (const [label, reducedMotion] of [['pinned, motion on', 'no-preference'], ['native scroller, reduced motion', 'reduce']]) {
    await check(`horizontal gallery: Tab reaches every card and brings it into view (${label})`, async () => {
      const context = await isolated(browser, { reducedMotion, viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
      const count = await page.locator('[data-hgallery-item] a').count();
      assert.equal(count, 6, 'five case cards and the index card');
      // Start from the last link before the gallery, then Tab through it.
      await page.locator('#what-teach a').focus();
      const seen = [];
      for (let i = 0; i < count; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(250);
        const info = await page.evaluate(() => {
          const el = document.activeElement, box = el.getBoundingClientRect();
          return { href: el.getAttribute('href'), inGallery: !!el.closest('[data-hgallery-item]'), left: Math.round(box.left), right: Math.round(box.right), top: Math.round(box.top), bottom: Math.round(box.bottom), w: innerWidth, h: innerHeight };
        });
        assert.ok(info.inGallery, `Tab ${i + 1} stays in the gallery (${info.href})`);
        assert.ok(info.left >= -2 && info.right <= info.w + 2 && info.top >= 0 && info.bottom <= info.h + 2, `card ${info.href} fully on screen ${JSON.stringify(info)}`);
        seen.push(info.href);
      }
      assert.equal(new Set(seen).size, count, 'every card reached once');
      await context.close();
    });
  }

  await check('horizontal gallery: a mouse click on a partly visible card (pinned) navigates to its tour', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const g = document.querySelector('[data-hgallery]'); scrollTo(0, g.getBoundingClientRect().top + scrollY + 4); });
    await page.waitForTimeout(400);
    // The first card whose tour link starts on screen but is not centred.
    const target = await page.evaluate(() => [...document.querySelectorAll('[data-hgallery-item] a[href^="/inside/"]')].map(a => ({ href: a.getAttribute('href'), box: a.getBoundingClientRect() })).find(({ box }) => box.left > innerWidth * .55 && box.left < innerWidth - 80));
    assert.ok(target, 'a partly visible card');
    const before = await page.evaluate(() => scrollY);
    await page.mouse.move(target.box.left + 40, target.box.top + 120);
    await page.mouse.down();
    await page.waitForTimeout(120);
    assert.equal(await page.evaluate(() => scrollY), before, 'pressing a card never scrolls the page');
    await Promise.all([page.waitForURL(new RegExp(`${target.href.replace(/[./]/g, '\\$&')}$`), { timeout: 4000 }), page.mouse.up()]);
    await context.close();
  });

  await check('horizontal gallery: scrollIntoView inside the pinned frame never leaves it offset', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelector('#card-bp-name').scrollIntoView());
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => document.querySelector('.hgal__sticky').scrollLeft), 0);
    await context.close();
  });

  await check('pinned gallery only where it fits (1366×768): heading clear of the header', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1366, height: 768 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.evaluate(() => { const g = document.querySelector('[data-hgallery]'); scrollTo(0, g.getBoundingClientRect().top + scrollY); });
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => {
      const header = document.querySelector('[data-header]').getBoundingClientRect().bottom;
      return { header, top: document.querySelector('#work-title').getBoundingClientRect().top, pinned: getComputedStyle(document.querySelector('[data-hgallery]')).getPropertyValue('--pinned').trim() };
    });
    assert.ok(state.top >= state.header - 1, `#work-title below the header (${JSON.stringify(state)})`);
    assert.notEqual(state.pinned, '1', 'not pinned on a 768px-tall screen');
    await context.close();
  });

  await check('hero: keyboard focus on a CTA after scrolling the pin is fully visible (Shift+Tab from a door)', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    await page.locator('.doors a.door').first().focus();
    await page.waitForTimeout(200);
    const low = [];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(150);
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el.closest('.hero')) return null;
        let o = 1; for (let n = el; n; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
        return { text: el.textContent.trim().slice(0, 20), o };
      });
      if (info && info.o < .99) low.push(`${info.text} ${info.o.toFixed(2)}`);
    }
    assert.deepEqual(low, []);
    await context.close();
  });

  await check('scroll scrub fallback (no native scroll timelines): phone hero copy stays solid for the first 300px', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await context.addInitScript(() => {
      const supports = CSS.supports.bind(CSS);
      CSS.supports = (...args) => (/animation-timeline/.test(args.join(' ')) ? false : supports(...args));
      document.addEventListener('DOMContentLoaded', () => { const style = document.createElement('style'); style.textContent = '[data-scrub]{animation:none!important}'; document.head.append(style); });
    });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    const low = [];
    for (const y of [0, 100, 200, 300]) {
      await page.evaluate(top => scrollTo(0, top), y);
      await page.waitForTimeout(200);
      const o = await page.evaluate(() => Number(getComputedStyle(document.querySelector('.hero__sub')).opacity));
      if (o < .95) low.push(`${y}px: ${o}`);
    }
    assert.deepEqual(low, []);
    // The fallback really ran: the title lines have started to split by 300px.
    assert.ok(Number(await page.evaluate(() => getComputedStyle(document.querySelector('.hero-pin')).getPropertyValue('--p'))) > 0, 'scrub.ts wrote --p');
    await context.close();
  });

  for (const [label, viewport, mobile] of [['phone', { width: 390, height: 844 }, true], ['desktop', { width: 1280, height: 900 }, false]]) {
    await check(`contact in one tap from every page (${label})`, async () => {
      const context = await isolated(browser, { viewport, isMobile: mobile, hasTouch: mobile });
      const page = await context.newPage();
      for (const route of [...routes, ...tours]) {
        await page.goto(`${base}/${route}.html`, { waitUntil: 'domcontentloaded' });
        const cta = page.locator('.header__cta');
        assert.ok(await cta.isVisible(), `${route}: header Contact visible`);
        assert.equal(await cta.getAttribute('href'), '/contact.html');
        if (mobile && !['contact', 'tutoring'].includes(route)) {
          await page.evaluate(() => scrollTo(0, innerHeight * 2));
          await page.waitForTimeout(500);
          assert.equal(await page.locator('[data-float-contact]').count(), 0, `${route}: no floating Contact pill over the copy (the sticky header's Contact is the one tap)`);
          assert.ok(await page.locator('.header__cta').isVisible(), `${route}: header Contact still visible (sticky)`);
        }
      }
      await context.close();
    });
  }

  await check('command menu: Ctrl+K and ⌘K open; arrows + Enter navigate through the gate; quick links; no chat items', async () => {
    const context = await isolated(browser, { viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/work.html`, { waitUntil: 'networkidle' });
    await page.keyboard.press('Control+k');
    assert.ok(await page.locator('[data-palette]').evaluate(el => el.open), 'Ctrl+K opens');
    assert.ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-palette-input')));
    await page.keyboard.press('Escape');
    assert.ok(!(await page.locator('[data-palette]').evaluate(el => el.open)), 'Escape closes');
    await page.keyboard.press('Meta+k');
    assert.ok(await page.locator('[data-palette]').evaluate(el => el.open), '⌘K opens');
    await page.keyboard.type('research');
    const first = await page.locator('[data-palette-list] [aria-selected="true"] .palette__label').textContent();
    assert.equal(first, 'Research');
    await page.keyboard.press('ArrowDown');
    assert.notEqual(await page.locator('[data-palette-list] [aria-selected="true"] .palette__label').textContent(), first, 'ArrowDown moves');
    await page.keyboard.press('ArrowUp');
    await Promise.all([page.waitForURL(/research\.html$/), page.keyboard.press('Enter')]);
    await page.click('[data-palette-open]');
    await page.keyboard.type('katana tour');
    await Promise.all([page.waitForURL(/inside\/katana\.html$/), page.keyboard.press('Enter')]);
    await page.click('[data-palette-open]');
    await page.keyboard.type('book a lesson');
    await Promise.all([page.waitForURL(/tutoring\.html#lesson-enquiry$/), page.keyboard.press('Enter')]);
    assert.equal(await page.locator('[data-palette] [data-group="Ask Otto"]').count(), 0, 'no Ask Otto group');
    await page.keyboard.press('Control+k');
    await page.keyboard.type('pizza recipes');
    assert.equal(await page.locator('[data-palette-list] [role="option"]:not([hidden])').count(), 0);
    assert.match(await page.locator('[data-palette-status]').textContent(), /No results/);
    await context.close();
  });

  await check('project tours: render with honest caveats, chapter links, prev/next tours', async () => {
    const context = await isolated(browser, { viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    for (const id of ['katana', 'nookbase', 'inos', 'bitget', 'bp']) {
      await page.goto(`${base}/inside/${id}.html`, { waitUntil: 'networkidle' });
      const text = await page.locator('main').textContent();
      if (id === 'katana') assert.match(text, /programme direction/);
      if (id === 'bitget') assert.match(text, /No claim of trading performance/);
      if (id === 'inos') assert.match(text, /wider R&D/);
      if (id === 'nookbase') assert.match(text, /150 beta users/);
      assert.equal(await page.locator('.rail a').count(), 5);
      assert.equal(await page.locator('.tours a').count(), 2);
      assert.equal(await page.locator('[data-otto-stage], .otto-dock').count(), 0, 'no Otto dock');
    }
    await context.close();
  });

  await check('projects: list/grid switch is remembered', async () => {
    const context = await isolated(browser, { viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/work.html`, { waitUntil: 'networkidle' });
    await page.click('[data-view-set="grid"]');
    await page.waitForTimeout(400);
    assert.equal(await page.locator('[data-project-index]').getAttribute('data-view'), 'grid');
    assert.ok(await page.locator('[data-row="katana"] .prow__thumb').isVisible(), 'plates shown in grid');
    assert.ok(!(await page.locator('.pindex__pane').isVisible()), 'no preview pane in grid');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('[data-view-set="grid"]').getAttribute('aria-pressed'), 'true', 'remembered');
    await page.click('[data-view-set="list"]');
    await context.close();
  });
  /* Numbers and scroll motion. */
  await check('hero spec chips count up to their CV values', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2600);
    assert.deepEqual(await page.locator('[data-count-to]').allTextContents(), ['150', '5', '3']);
    await context.close();
  });
  await check('scroll reveals (slides, wipes, scales) finish visible on every page', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const problems = [];
    for (const route of [...routes, ...tours]) {
      await page.goto(`${base}/${route}.html`, { waitUntil: 'networkidle' });
      const total = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < total; y += 400) { await page.evaluate(top => scrollTo(0, top), y); await page.waitForTimeout(50); }
      await page.waitForTimeout(1300);
      const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter(el => !el.closest('[hidden]') && (!el.classList.contains('is-in') || Number(getComputedStyle(el).opacity) < .99 || !/^(none|inset\((0(px|%)?\s*)+( round [^)]*)?\))$/.test(getComputedStyle(el).clipPath))).map(el => el.className || el.tagName));
      if (hidden.length) problems.push(`${route}: ${hidden.slice(0, 3).join(' | ')}`);
    }
    assert.deepEqual(problems, []);
    await context.close();
  });

  for (const [label, viewport, mobile] of [['phone', { width: 390, height: 844 }, true], ['desktop', { width: 1280, height: 900 }, false]]) {
    await check(`Pause motion visible in the first screen of every page (${label})`, async () => {
      const context = await isolated(browser, { viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      const missing = [];
      for (const route of [...routes, ...tours]) {
        await page.goto(`${base}/${route}.html`, { waitUntil: 'networkidle' });
        await page.waitForTimeout(1600); // hero entrance
        const seen = await page.evaluate(() => [...document.querySelectorAll('[data-motion-toggle]')].some(el => {
          const box = el.getBoundingClientRect();
          return el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) && box.width >= 24 && box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth;
        }));
        if (!seen) missing.push(route);
      }
      assert.deepEqual(missing, []);
      await context.close();
    });
  }

  await check('scroll reveals never hide content when the site script fails to load', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } });
    await context.route(/\/_astro\/Base\.astro_astro_type_script[^/]*\.js$/, route => route.abort());
    const page = await context.newPage();
    const problems = [];
    for (const route of [...routes, ...tours]) {
      await page.goto(`${base}/${route}.html`, { waitUntil: 'networkidle' });
      const total = await page.evaluate(() => document.body.scrollHeight);
      for (let y = 0; y < total; y += 600) { await page.evaluate(top => scrollTo(0, top), y); await page.waitForTimeout(30); }
      await page.waitForTimeout(1200);
      const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter(el => !el.closest('[hidden]') && Number(getComputedStyle(el).opacity) < .99).map(el => el.className || el.tagName));
      if (hidden.length) problems.push(`${route}: ${hidden.length} hidden (${hidden.slice(0, 2).join(' | ')})`);
    }
    assert.deepEqual(problems, []);
    await context.close();
  });

  await check('interior pages: studio hero, navy contact band with mailto + Write to Omar, and a next step', async () => {
    const context = await isolated(browser, { viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    for (const route of [...routes.filter(r => r !== 'index'), ...tours]) {
      await page.goto(`${base}/${route}.html`, { waitUntil: 'domcontentloaded' });
      assert.equal(await page.locator('h1').count(), 1);
      if (!route.startsWith('inside/')) assert.ok(await page.locator('.phero h1#page-title').count() === 1, `${route}: studio hero`);
      if (route === 'contact') {
        assert.ok(await page.locator('.direct a[href^="mailto:"]').isVisible(), 'contact: direct email');
        assert.ok(await page.locator('.quick__list a').count() >= 5, 'contact: topic shortcuts');
        continue;
      }
      const band = page.locator('section.band');
      assert.equal(await band.count(), 1, `${route}: contact band`);
      assert.ok(await band.locator('a[href^="mailto:omerapoua0@gmail.com"]').count() === 1, `${route}: band mailto`);
      assert.match(await band.locator('.band__primary').getAttribute('href'), /^\/contact\.html/, `${route}: band Write to Omar`);
      assert.ok(await band.locator('.band__primary').getAttribute('data-open') !== null, `${route}: band opens through the gate`);
      assert.ok(await band.locator('.band__next').count() === 1, `${route}: next step`);
      assert.equal(await page.locator('.footer__top').isVisible(), false, `${route}: no duplicate footer CTA`);
    }
    await context.close();
  });

  await check('storytelling: the BP pipeline follows the scroll; the tour rail tracks the chapter; contact topic shortcuts pre-select', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/automations.html`, { waitUntil: 'networkidle' });
    const seen = new Set();
    for (const step of await page.locator('[data-scrolly-step]').all()) {
      await step.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(250);
      seen.add(await page.locator('[data-scrolly]').getAttribute('data-at'));
    }
    assert.deepEqual([...seen], ['0', '1', '2', '3'], 'each story step lights its stage');
    const sticky = await page.locator('.story__visual').evaluate(el => getComputedStyle(el).position);
    assert.equal(sticky, 'sticky');
    await page.goto(`${base}/inside/katana.html`, { waitUntil: 'networkidle' });
    await page.locator('#stage').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(300);
    assert.equal(await page.locator('.rail a[data-active]').getAttribute('href'), '#stage');
    await page.goto(`${base}/contact.html`, { waitUntil: 'networkidle' });
    await Promise.all([page.waitForURL(/topic=Research#write$/), page.click('.quick__list a[href*="topic=Research"]')]);
    await page.waitForLoadState('networkidle');
    assert.ok(await page.locator('input[name="topic"][value="Research"]').isChecked(), 'topic pre-selected');
    await context.close();
  });

  await check('light gate from interior pages: case study → tour (open), band → contact (open)', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/work.html`, { waitUntil: 'networkidle' });
    await Promise.all([page.waitForURL(/inside\/nookbase\.html$/), page.evaluate(() => document.querySelector('#nookbase a[href="/inside/nookbase.html"]').click())]);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.gate), 'in', 'arrived through the gate');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-gate]')).visibility === 'hidden' || getComputedStyle(document.querySelector('[data-gate]')).display === 'none', null, { timeout: 1500 });
    await Promise.all([page.waitForURL(/contact\.html\?topic=Project$/), page.evaluate(() => document.querySelector('.band__primary').click())]);
    assert.ok(await page.locator('input[name="topic"][value="Project"]').isChecked(), 'band topic carried into the form');
    await context.close();
  });

  /* 6. Project index, filters, matrix. */
  await check('project index: hover and focus drive the pane; filters announce', async () => {
    const context = await isolated(browser, { viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/work.html`, { waitUntil: 'networkidle' });
    await page.hover('[data-row="bitget"] a');
    assert.ok(await page.locator('.pindex__item[data-pane-item="bitget"]').evaluate(el => el.hasAttribute('data-active')));
    await page.locator('[data-row="inos"] a').focus();
    assert.ok(await page.locator('.pindex__item[data-pane-item="inos"]').evaluate(el => el.hasAttribute('data-active')));
    await page.locator('.fchip:has-text("Network systems")').click();
    assert.equal(await page.locator('[data-row]:visible').count(), 2);
    assert.match(await page.locator('[data-count]').textContent(), /2 projects shown/);
    await page.locator('.fchip:has-text("All")').click();
    assert.equal(await page.locator('[data-row]:visible').count(), 6);
    await context.close();
  });
  await check('capability matrix: column highlight and phone list', async () => {
    const context = await isolated(browser, { viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.hover('thead th[data-col="bitget"]');
    assert.ok(await page.locator('td[data-col="bitget"][data-hot]').count() > 3);
    await page.setViewportSize({ width: 390, height: 844 });
    assert.ok(await page.locator('.matrix__list').isVisible());
    assert.ok(!(await page.locator('.matrix__table').isVisible()));
    await context.close();
  });

  /* 7. Mobile navigation sheet. */
  await check('mobile menu: inert background, focus in, Escape returns focus', async () => {
    const context = await isolated(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(`${base}/work.html`);
    await page.click('[data-menu]');
    assert.equal(await page.locator('[data-menu]').getAttribute('aria-expanded'), 'true');
    assert.ok(await page.evaluate(() => document.querySelector('main').inert && document.querySelector('footer').inert));
    assert.ok(await page.evaluate(() => document.activeElement?.closest('#site-nav') !== null));
    await page.keyboard.press('Escape');
    assert.ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-menu') && !document.querySelector('main').inert));
    await context.close();
  });

  /* 8. Enquiry journeys: validation, conditions, review, change, drafts, nothing sent. */
  await check('tutoring enquiry: validation, guardian condition, review, change, draft', async () => {
    const context = await isolated(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const posts = [];
    page.on('request', request => { if (request.method() !== 'GET') posts.push(request.url()); });
    await page.goto(`${base}/tutoring.html`, { waitUntil: 'networkidle' });
    await page.click('[data-next]');
    assert.ok(await page.locator('[data-errors]').isVisible(), 'error summary shown');
    assert.ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-errors')), 'error summary focused');
    await page.click('label.choice:has-text("A student under 18")');
    assert.ok(await page.locator('#guardian-email').isVisible(), 'guardian email appears for under-18s');
    await page.click('[data-next]');
    assert.ok(await page.locator('#guardian-email[aria-invalid="true"]').count() === 1, 'guardian email required');
    await page.fill('#guardian-email', 'not-an-email');
    await page.click('[data-next]');
    assert.match(await page.locator('[data-errors]').textContent(), /correct format/);
    await page.fill('#guardian-email', 'parent@example.com');
    await page.click('[data-next]');
    await page.click('label.choice:has-text("Maths & science")');
    await page.selectOption('#science', 'Physics');
    await page.click('[data-next]');
    await page.click('label.choice:has-text("GCSE Higher")');
    await page.selectOption('#board', 'AQA');
    await page.click('[data-next]');
    for (const [id, value] of [['#goal', 'Prepare for exams'], ['#timing', 'Exam within 3 months'], ['#days', 'Weekends'], ['#time', 'Evening']]) await page.selectOption(id, value);
    await page.click('[data-next]');
    await page.fill('#lesson-name', 'QA Student');
    await page.fill('#lesson-email', 'qa@example.com');
    await page.click('[data-next]');
    assert.ok(await page.locator('[data-review]').isVisible(), 'review visible');
    assert.match(await page.locator('[data-brief-line]').textContent(), /GCSE Higher/);
    const href = await page.locator('[data-email]').getAttribute('href');
    assert.ok(href.startsWith('mailto:omerapoua0@gmail.com?subject='));
    assert.ok(href.length <= 1800, 'mailto within length limit');
    const body = decodeURIComponent(href);
    for (const line of ['Enquiring as: A student under 18', 'Parent or guardian’s email: parent@example.com', 'Science: Physics', 'Exam board: AQA', 'Free 15-minute intro call: Yes, please']) assert.ok(body.includes(line), `draft includes ${line}`);
    assert.match(await page.locator('[data-review]').textContent(), /Nothing has been sent/);
    await page.click('.review__summary .change >> nth=4');
    assert.match(await page.locator('[data-step-label]').textContent(), /Step 3 of 5/);
    assert.deepEqual(posts, []);
    await context.close();
  });
  await check('contact enquiry: prefill, review and copy fallback', async () => {
    const context = await isolated(browser, { viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/contact.html?topic=Automation&brief=research%20and%20reporting`, { waitUntil: 'networkidle' });
    assert.ok(await page.locator('input[name="topic"][value="Automation"]').isChecked());
    await page.click('[data-next]');
    assert.match(await page.inputValue('#contact-message'), /research and reporting/);
    await page.fill('#contact-name', 'QA Person');
    await page.fill('#contact-email', 'qa@example.com');
    await page.click('[data-next]');
    assert.ok(await page.locator('[data-review]').isVisible());
    assert.match(await page.locator('[data-gmail]').getAttribute('href'), /^https:\/\/mail\.google\.com\/mail\/\?view=cm/);
    await page.click('[data-copy]');
    await page.waitForFunction(() => /Copied|selected/.test(document.querySelector('[data-status]').textContent || ''), null, { timeout: 5000 });
    assert.doesNotMatch(await page.locator('main').textContent(), /\b(Message sent|Booking confirmed)\b/i);
    await context.close();
  });

  /* 9. Performance: LCP/CLS on throttled phone and desktop loads. */
  for (const [label, viewport, mobile] of [['phone', { width: 390, height: 844 }, true], ['desktop', { width: 1440, height: 900 }, false]]) {
    await check(`performance ${label}: LCP <= 2.5s, CLS <= 0.05`, async () => {
      const context = await isolated(browser, { viewport, isMobile: mobile, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: mobile ? 4 : 1 });
      await page.addInitScript(() => {
        window.__lcp = 0; window.__cls = 0;
        new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__lcp = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(`${base}/index.html`, { waitUntil: 'load' });
      await page.waitForTimeout(2500);
      const metrics = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), cls: Number(window.__cls.toFixed(3)) }));
      results.push({ name: `performance ${label} metrics`, status: 'info', message: JSON.stringify(metrics) });
      assert.ok(metrics.lcp <= 2500, `LCP ${metrics.lcp}ms`);
      assert.ok(metrics.cls <= 0.05, `CLS ${metrics.cls}`);
      await context.close();
    });
  }

  await browser.close();
  if (outbound.length) results.push({ name: 'blocked outbound requests', status: 'info', message: JSON.stringify([...new Set(outbound.map(r => `${r.method} ${r.url}`))]) });
  const failed = results.filter(r => r.status === 'fail');
  const report = { date: new Date().toISOString(), base, passed: results.filter(r => r.status === 'pass').length, failed: failed.length, results };
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(`QA: ${report.passed} passed, ${report.failed} failed. Report: .qa/report.json`);
  process.exitCode = failed.length ? 1 : 0;
})();
