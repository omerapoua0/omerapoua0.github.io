/* Isolated browser QA for the v4 "studio" portfolio (light theme, light gate,
 * no chat). Linux-friendly.
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
  catch (error) { results.push({ name, status: 'fail', message: error.message.split('\n')[0] }); console.error('FAIL', name, '-', error.message.split('\n')[0]); }
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
          const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(', ')}`));
          assert.deepEqual(violations, []);
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
    const legacy = ['/work.html#katana', '/work.html#nookbase', '/work.html#inos', '/work.html#project-1', '/work.html#project-2', '/work.html#project-3', '/work.html#project-4', '/work.html#project-5', '/research.html#optimisation', '/research.html#quant', '/research.html#quantum', '/research.html#education', '/cv.html#experience', '/cv.html#skills', '/tutoring.html#lesson-enquiry'];
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
  const gateScenario = async ({ label, reducedMotion, motionOff, width }) => {
    const context = await isolated(browser, { reducedMotion, viewport: { width, height: 900 } });
    if (motionOff) await context.addInitScript(() => { try { sessionStorage.setItem('omar-motion', 'off'); } catch {} });
    // On every document: record the gate's state at first paint, and whether a
    // native view transition ever ran.
    await context.addInitScript(() => {
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
    // Click via the DOM so Playwright's wait for the doors' entrance animation is not timed.
    const started = Date.now();
    await Promise.all([page.waitForURL(/work\.html$/), page.evaluate(() => document.querySelector('.doors a[href="/work.html"]').click())]);
    const leaveMs = Date.now() - started;
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
    if (reducedMotion === 'reduce' || motionOff) assert.ok(leaveMs < 1500, `reduced/paused leave is quick (${leaveMs}ms)`);
    // A same-page door: Skills on the homepage opens, jumps, reveals.
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.click('.doors a[href="/index.html#skills"]');
    await page.waitForFunction(() => location.hash === '#skills' && !document.querySelector('[data-gate]').dataset.state, null, { timeout: 3000 });
    const top = await page.locator('#skills').evaluate(el => el.getBoundingClientRect().top);
    assert.ok(Math.abs(top) < 120, `jumped to skills (${top})`);
    assert.deepEqual(errors, []);
    results.push({ name: `gate ${label} leave duration`, status: 'info', message: `${leaveMs}ms click → next URL` });
    await context.close();
  };
  for (const scenario of [
    { label: 'motion 1440', reducedMotion: 'no-preference', width: 1440 },
    { label: 'motion 390', reducedMotion: 'no-preference', width: 390 },
    { label: 'reduced motion', reducedMotion: 'reduce', width: 1280 },
    { label: 'Pause motion', reducedMotion: 'no-preference', motionOff: true, width: 1280 },
  ]) await check(`light gate ${scenario.label}: opaque white leaving, white at first paint, revealed ≤ 1.5 s`, () => gateScenario(scenario));

  await check('light gate: ordinary links use the quick gate; PDFs, mail and new tabs are untouched; back from bfcache is never white', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await Promise.all([page.waitForURL(/research\.html$/), page.click('#site-nav a[href="/research.html"]')]);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.gate), 'in');
    await page.goBack({ waitUntil: 'networkidle' });
    await page.waitForTimeout(900);
    assert.ok(!(await page.locator('[data-gate]').evaluate(el => el.dataset.state === 'open' || el.dataset.state === 'quick')), 'not left white after Back');
    const untouched = await page.evaluate(() => {
      const gate = document.querySelector('[data-gate]');
      const tried = [];
      for (const sel of ['a[href$=".pdf"]', 'a[href^="mailto:"]', 'a[target="_blank"]']) {
        const link = document.querySelector(sel);
        if (!link) continue;
        link.addEventListener('click', event => event.preventDefault(), { once: true });
        link.click();
        tried.push(gate.dataset.state || '');
      }
      return tried;
    });
    assert.ok(untouched.every(state => state === ''), `gate ignored ${JSON.stringify(untouched)}`);
    await context.close();
  });

  /* 6. Pause motion stops every loop; contact is one tap away everywhere. */
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
          assert.ok(await page.locator('[data-float-contact]').isVisible(), `${route}: floating Contact after scrolling`);
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
  await check('scroll reveals finish visible', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    const total = await page.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < total; y += 400) { await page.evaluate(top => scrollTo(0, top), y); await page.waitForTimeout(60); }
    await page.waitForTimeout(1200);
    const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter(el => !el.classList.contains('is-in') || Number(getComputedStyle(el).opacity) < .99).length);
    assert.equal(hidden, 0);
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
