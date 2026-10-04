/* Isolated browser QA for the redesigned portfolio. Linux-friendly.
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

  /* 1. Every route, width and theme: one H1, no overflow, no broken images, no errors. */
  for (const theme of ['light', 'dark']) {
    for (const width of widths) {
      const context = await isolated(browser, { viewport: { width, height: 900 }, colorScheme: theme });
      for (const route of routes) {
        await check(`route ${route} ${width}px ${theme}`, async () => {
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
          if (width === 1440 || width === 390) await page.screenshot({ path: path.join(output, 'screens', `${route}-${width}-${theme}.png`), fullPage: true });
          await page.close();
        });
      }
      await context.close();
    }
  }

  /* 2. Accessibility (axe-core, WCAG 2.2 A/AA) in both themes at desktop and phone widths. */
  if (axePath) {
    const axeSource = await fs.readFile(axePath, 'utf8');
    for (const theme of ['light', 'dark']) for (const width of [390, 1280]) {
      const context = await isolated(browser, { viewport: { width, height: 900 }, colorScheme: theme });
      for (const route of routes) {
        await check(`axe ${route} ${width}px ${theme}`, async () => {
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

  /* 4. No JavaScript: content, navigation and email fallbacks remain. */
  await check('no-JS routes and fallbacks', async () => {
    const context = await isolated(browser, { javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(`${base}/${route}.html`);
      const state = await page.evaluate(() => ({ nav: [...document.querySelectorAll('#site-nav a')].filter(a => a.getBoundingClientRect().width > 0).length, overflow: document.documentElement.scrollWidth > innerWidth + 1 }));
      assert.ok(state.nav >= 5, `${route}: visible nav links without JS`);
      assert.ok(!state.overflow, `${route}: no overflow without JS`);
    }
    await page.goto(`${base}/tutoring.html`);
    assert.ok(await page.locator('noscript').count() > 0);
    assert.ok(!(await page.locator('form[data-enquiry]').isVisible()), 'guided form hidden without JS');
    await page.goto(`${base}/index.html`);
    assert.ok(await page.locator('.agent__who img').isVisible(), 'hero photo visible without JS');
    assert.match(await page.locator('[data-chat-log]').textContent(), /Hi, I’m Otto, Omar’s robot/, 'intro answer readable without JS');
    assert.ok(await page.locator('[data-otto-stage] .otto-stage__poster [data-robot]').isVisible(), 'SVG Otto shown without JS');
    assert.ok(!(await page.locator('[data-chat-choices]').isVisible()), 'choices hidden without JS (the links stand in)');
    assert.equal(await page.locator('[data-hero] input, [data-hero] textarea').count(), 0, 'nothing to type into');
    assert.ok(await page.locator('.chat__nojs a[href="/inside/katana.html"]').count() === 1, 'no-JS links into the tours');
    assert.ok(await page.locator('.ticker').isVisible(), 'ticker visible without JS');
    await context.close();
  });

  /* 5. Homepage: Otto (3D, with the SVG Otto standing in), the choice-only
   *    chat, the hand-off ("Take Otto's hand") and the inside tours. Visitors
   *    never type: every Otto reply ends with choices (real buttons).
   *    Headless Chromium only has software WebGL (SwiftShader), which the site
   *    refuses by design (failIfMajorPerformanceCaveat), so 3D checks force it
   *    with ?otto3d=force. SwiftShader frames take ~300ms, so 3D clicks go
   *    through evaluate(). */
  const settled = page => page.waitForFunction(() => !document.querySelector('[data-chat]').hasAttribute('data-busy'), null, { timeout: 15000 });
  const choiceButton = (page, label) => page.locator('[data-chat-choices]').getByRole('button', { name: label, exact: true });
  /** Choose a reply like a visitor (a real click), then wait for Otto to finish. */
  const choose = async (page, label) => { await choiceButton(page, label).click(); await settled(page); };
  /** The same, through evaluate() (3D pages, where a frame takes ~300ms). */
  const pick = (page, label) => page.evaluate(text => {
    const button = [...document.querySelectorAll('[data-chat-choices] button')].find(item => item.textContent.trim() === text);
    if (!button) throw new Error(`no choice "${text}"`);
    button.click();
  }, label);
  const choices = page => page.locator('[data-chat-choices] button').allTextContents().then(list => list.map(text => text.trim()));
  const lastOtto = page => page.locator('.turn--agent').last();
  const heroStage = '[data-otto-stage][data-stage-mode="hero"]';
  const modeSettled = (page, timeout = 30000) => page.waitForFunction(sel => ['3d', 'svg'].includes(document.querySelector(sel).dataset.mode), heroStage, { timeout });
  // Forced 3D: the 3 s deadline may show the SVG Otto first; wait for 3D or a real failure.
  const mode3d = page => page.waitForFunction(sel => { const el = document.querySelector(sel); return el.dataset.mode === '3d' || ['fail', 'error', 'no-webgl', 'gate'].includes(el.dataset.reason); }, heroStage, { timeout: 60000 });
  const lime = page => page.evaluate(() => window.__otto?.handle.snapshot().lime ?? 0);
  const topics = ['His work', 'Research & study', 'Lessons for my child', 'Internships & hiring', 'Get in touch', 'Tell me a joke'];
  const moods = ['Good, thanks', 'Bit tired, honestly', 'Who’s Omar?', 'And you, Otto?'];
  for (const [label, options] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
    await check(`otto ${label}: lands, greets and asks how you are; mood → topics → answers, all by choosing (no text box)`, async () => {
      const context = await isolated(browser, { reducedMotion: 'no-preference', ...options });
      const page = await context.newPage();
      const errors = watch(page);
      await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
      assert.match(await page.locator('h1').textContent(), /Ask Otto anything\.\s*Well, almost\. About Omar\./);
      assert.ok(await page.locator('.agent__who img').evaluate(img => img.currentSrc.includes('portrait-bust') && img.naturalWidth > 0), 'head-and-shoulders photo');
      assert.match(await page.locator('[data-london-time]').textContent(), /^\d{2}:\d{2}$/);
      assert.equal(await page.locator('[data-disclosure]').textContent(), 'Answers written by Omar. No AI model; nothing you choose leaves this page.');
      assert.equal(await page.locator('[data-hero] input, [data-hero] textarea, [data-hero] select, [data-hero] [contenteditable]').count(), 0, 'nothing to type into in the hero');
      await modeSettled(page);
      assert.equal(await page.locator(heroStage).getAttribute('data-mode'), 'svg', `software WebGL is refused or fails the warm-up, so the SVG Otto stands in (${await page.locator(heroStage).getAttribute('data-reason')})`);
      assert.ok(await page.locator(`${heroStage} [data-robot]`).isVisible(), 'SVG Otto visible');
      await page.waitForFunction(() => document.querySelectorAll('.turn--agent').length >= 2 && /How are you doing\?/.test(document.querySelector('[data-chat-log]').textContent), null, { timeout: 9000 });
      assert.match(await page.locator('.turn--agent').first().textContent(), /I’m Otto, Omar’s robot/);
      assert.ok(await page.locator('[data-otto-bubble]').evaluate(el => el.hasAttribute('data-show') && el.textContent.length > 4), 'speech bubble shows Otto’s line');
      assert.deepEqual(await choices(page), moods, 'mood choices');
      // A tidy grid where the composer was: 2 per row, at least 44px tall, inside the card, never a hidden scroller.
      const grid = await page.evaluate(() => {
        const box = document.querySelector('[data-chat-choices]');
        const card = document.querySelector('[data-chat]').getBoundingClientRect();
        const rects = [...box.querySelectorAll('button')].map(button => button.getBoundingClientRect());
        return { rows: new Set(rects.map(rect => Math.round(rect.top))).size, minHeight: Math.min(...rects.map(rect => rect.height)), inside: rects.every(rect => rect.left >= card.left - 1 && rect.right <= card.right + 1 && rect.bottom <= card.bottom + 1), scroller: box.scrollWidth > box.clientWidth + 1, below: box.getBoundingClientRect().top > document.querySelector('[data-chat-log]').getBoundingClientRect().bottom - 1 };
      });
      assert.equal(grid.rows, 2, 'four mood choices sit two per row');
      assert.ok(grid.minHeight >= 44, `choices at least 44px tall (${grid.minHeight})`);
      assert.ok(grid.inside && !grid.scroller && grid.below, 'choices sit below the log, inside the card, with no horizontal scroller');
      await choose(page, 'Good, thanks');
      assert.match(await lastOtto(page).locator('.bubble').textContent(), /I’m here to talk about Omar\. Where shall we start\?/);
      assert.deepEqual(await choices(page), topics, 'topic choices');
      await choose(page, 'Lessons for my child');
      assert.match(await lastOtto(page).locator('.bubble').textContent(), /enhanced DBS checked/);
      assert.equal(await lastOtto(page).locator('a.card[href="/tutoring.html#lesson-enquiry"]').count(), 1, 'lesson enquiry card');
      assert.equal(await lastOtto(page).locator('.turn__foot a[href="/tutoring.html"]').count(), 1, 'source link');
      assert.equal(await page.locator('.turn--you').last().textContent(), 'Lessons for my child', 'the choice shows as the visitor’s bubble');
      await choose(page, 'How do lessons work?');
      assert.match(await lastOtto(page).locator('.bubble').textContent(), /intro call/);
      await choose(page, 'Back to topics');
      assert.deepEqual(await choices(page), topics, 'back to the topics');
      await choose(page, 'Tell me a joke');
      assert.ok((await lastOtto(page).locator('.bubble').textContent()).length > 20);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || [...document.querySelectorAll('.chat *')].some(el => el.getBoundingClientRect().right > document.querySelector('.chat').getBoundingClientRect().right + 1 && getComputedStyle(el).position !== 'absolute'));
      assert.ok(!overflow, 'no horizontal overflow; chat content stays inside the card');
      assert.deepEqual(errors, []);
      await context.close();
    });
  }
  await check('otto: breadth-first crawl of every choice (answers within 4): 2+ choices each, no duplicates, short labels, every answer reachable, no errors', async () => {
    const intentIds = [...(await fs.readFile(path.join(__dirname, '..', 'src', 'data', 'agent.ts'), 'utf8')).matchAll(/id: '([\w-]+)', ask:/g)].map(match => match[1]);
    assert.ok(intentIds.length >= 20, `intent ids read from agent.ts (${intentIds.length})`);
    const context = await isolated(browser, { viewport: { width: 390, height: 844 } }); // reduced motion: instant replies
    const page = await context.newPage();
    const errors = watch(page);
    await page.goto(`${base}/index.html?otto3d=off`, { waitUntil: 'networkidle' });
    const fresh = async () => {
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await page.goto(`${base}/index.html?otto3d=off`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-chat-choices] button');
    };
    const press = async label => {
      await pick(page, label);
      await page.waitForFunction(() => !document.querySelector('[data-chat]').hasAttribute('data-busy') || !document.querySelector('[data-otto-offer]').hidden, null, { timeout: 10000 });
      if (await page.locator('[data-otto-offer]').isVisible()) {
        assert.equal(await page.locator('[data-hero]').getAttribute('data-handoff'), 'offer', `${label}: Otto offers his hand`);
        await page.locator('[data-offer-stay]').click();
        await settled(page);
      }
    };
    const read = () => page.evaluate(() => {
      const turn = [...document.querySelectorAll('.turn--agent')].pop();
      return { node: turn?.dataset.node ?? '', intent: turn?.dataset.intent ?? '', text: turn?.querySelector('.bubble')?.textContent ?? '', choices: [...document.querySelectorAll('[data-chat-choices] button')].map(button => ({ label: button.textContent.trim(), to: button.dataset.to, height: button.getBoundingClientRect().height })) };
    });
    const menus = /^(hello|mood-|topics$|work$|projects:|back:)/;
    const queue = [{ path: [], to: 'hello' }];
    const queued = new Set(['hello']);
    const reached = new Set();
    const problems = [];
    let nodes = 0, clicks = 0, deepest = 0;
    while (queue.length) {
      const { path: steps, to } = queue.shift();
      await fresh();
      for (const label of steps) { await press(label); clicks += 1; }
      const state = await read();
      const where = steps.join(' → ') || 'greeting';
      // The click landed on the reply it names (after "Stay here", a project's full answer).
      const expected = to.startsWith('go:') ? to.slice(3) : to.startsWith('again:') ? `later:${to.slice(6)}` : to;
      if (state.node !== expected) problems.push(`${where}: expected reply "${expected}", got "${state.node}"`);
      nodes += 1;
      deepest = Math.max(deepest, steps.length);
      if (state.intent && steps.length <= 4) reached.add(state.intent);
      const labels = state.choices.map(item => item.label);
      if (!state.text.trim()) problems.push(`${where}: Otto said nothing`);
      if (labels.length < 2) problems.push(`${where}: ${labels.length} choice(s)`);
      if (labels.length > (menus.test(state.node) ? 6 : 4)) problems.push(`${where}: ${labels.length} choices`);
      if (new Set(labels).size !== labels.length) problems.push(`${where}: duplicate labels ${labels.join(' | ')}`);
      labels.filter(text => text.length > 30).forEach(text => problems.push(`${where}: label over 30 characters "${text}"`));
      state.choices.filter(item => item.height < 44).forEach(item => problems.push(`${where}: "${item.label}" ${item.height}px tall`));
      // No dead ends: every reply that isn't itself the topics (or the greeting) leads back to them.
      if (!/^(hello|mood-|topics$)/.test(state.node) && !state.choices.some(item => item.to === 'topics')) problems.push(`${where}: no way back to the topics`);
      // Breadth-first, so each reply is first met at its shallowest depth. The crawl
      // carries on past depth 4 until every reachable reply has been checked.
      for (const item of state.choices) {
        if (queued.has(item.to)) continue;
        queued.add(item.to);
        queue.push({ path: [...steps, item.label], to: item.to });
      }
    }
    results.push({ name: 'otto crawl', status: 'info', message: `${nodes} replies visited with ${clicks} clicks (deepest ${deepest} choices); ${reached.size}/${intentIds.length} answers reached within 4 choices` });
    assert.deepEqual(problems, [], problems.join('; '));
    const missing = intentIds.filter(id => !reached.has(id));
    assert.deepEqual(missing, [], `answers not reachable within 4 choices: ${missing.join(', ')}`);
    assert.deepEqual(errors, [], `console/page errors: ${errors.join('; ')}`);
    await context.close();
  });
  for (const [label, options] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['phone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }]]) {
    await check(`otto 3d ${label}: renders the ceramic robot (lit pixels), lazy-loaded after first paint`, async () => {
      const context = await isolated(browser, { reducedMotion: 'no-preference', ...options });
      const page = await context.newPage();
      const errors = watch(page);
      const scripts = [];
      page.on('request', request => { if (request.resourceType() === 'script') scripts.push(request.url()); });
      await page.goto(`${base}/index.html?otto3d=force`, { waitUntil: 'load' });
      const before = scripts.length;
      await mode3d(page);
      assert.equal(await page.locator(heroStage).getAttribute('data-mode'), '3d', `3D mode (${await page.locator(heroStage).getAttribute('data-reason')})`);
      assert.ok(scripts.length > before, 'the 3D module loads after the load event');
      await page.waitForFunction(() => document.querySelector('[data-otto-stage][data-stage-mode="hero"]').hasAttribute('data-landed'), null, { timeout: 30000 });
      const snap = await page.evaluate(() => window.__otto.handle.snapshot());
      assert.ok(snap.opaque > .012, `Otto drawn (${(snap.opaque * 100).toFixed(1)}% of the canvas opaque)`);
      assert.ok(snap.lime > .0005, `lime eyes and ring lit (${(snap.lime * 100).toFixed(2)}%)`);
      assert.ok(await page.locator(`${heroStage} canvas`).isVisible(), 'canvas visible');
      await page.waitForFunction(sel => getComputedStyle(document.querySelector(`${sel} .otto-stage__poster`)).opacity === '0', heroStage, { timeout: 5000 }); // SVG poster faded out in 3D
      assert.match(await page.evaluate(() => sessionStorage.getItem('otto3d')), /^(hi|lo)$/, 'tier remembered');
      assert.deepEqual(errors.filter(e => !/GPU stall|WebGL|swiftshader/i.test(e)), []);
      await context.close();
    });
  }
  await check('otto 3d: hand-off on desktop, chosen via His work → KATANA: offer, Take Otto’s hand, dive, portal, inside page arrives; Back returns', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = watch(page);
    await page.goto(`${base}/index.html?otto3d=force`, { waitUntil: 'load' });
    await mode3d(page);
    assert.equal(await page.locator(heroStage).getAttribute('data-mode'), '3d');
    for (const [label, then] of [['Good, thanks', /Where shall we start/], ['His work', /Reasoning systems, mostly/]]) {
      await pick(page, label);
      await page.waitForFunction(pattern => !document.querySelector('[data-chat]').hasAttribute('data-busy') && new RegExp(pattern).test([...document.querySelectorAll('.turn--agent')].pop()?.textContent || ''), then.source, { timeout: 30000 });
    }
    assert.deepEqual(await choices(page), ['KATANA', 'NOOKBASE', 'INOS & OctiMind', 'Bitget models', 'BP pipeline', 'Back to topics'], 'His work lists the five projects');
    await pick(page, 'KATANA');
    await page.waitForFunction(() => /Let me take you inside/.test(document.querySelector('[data-chat-log]').textContent), null, { timeout: 15000 });
    await page.locator('[data-offer-take]').waitFor({ state: 'visible', timeout: 15000 });
    assert.equal(await page.locator('[data-hero]').getAttribute('data-handoff'), 'offer');
    assert.match(await page.locator('[data-offer-take]').getAttribute('aria-label'), /KATANA tour/);
    assert.ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-offer-take')), 'focus on Take');
    assert.equal(await page.locator('[data-otto-offer]').getAttribute('data-anchor'), 'palm', 'button sits by Otto’s palm');
    await Promise.all([page.waitForURL(/\/inside\/katana\.html$/, { timeout: 30000 }), page.evaluate(() => document.querySelector('[data-offer-take]').click())]);
    await page.waitForLoadState('load');
    assert.match(await page.locator('h1').textContent(), /KATANA/);
    assert.ok(await page.evaluate(() => document.documentElement.dataset.arrive === 'portal'), 'arrival marked as a portal hand-off');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('otto-handoff')), null, 'hand-off token consumed');
    assert.ok(await page.locator('text=Concept visual, not product footage').count() >= 1);
    await Promise.all([page.waitForURL(/index\.html/, { timeout: 15000 }), page.evaluate(() => document.querySelector('[data-inside-back]').click())]);
    await page.waitForFunction(() => /Back from the inside! Where next\?/.test(document.querySelector('[data-chat-log]')?.textContent || '') && !document.querySelector('[data-chat]').hasAttribute('data-busy'), null, { timeout: 20000 });
    assert.deepEqual(await choices(page), ['NOOKBASE', 'INOS & OctiMind', 'Bitget models', 'BP pipeline', 'Something else'], 'the other projects, or something else');
    assert.ok(!(await page.locator('[data-hero]').getAttribute('data-handoff')), 'stage reset');
    assert.equal(await page.locator('.otto-portal').count(), 0, 'portal removed');
    await pick(page, 'Something else');
    await page.waitForFunction(() => !document.querySelector('[data-chat]').hasAttribute('data-busy'), null, { timeout: 30000 });
    assert.deepEqual(await choices(page), topics, '"Something else" goes back to the topics');
    assert.deepEqual(errors.filter(e => !/GPU stall|WebGL|swiftshader/i.test(e)), []);
    await context.close();
  });
  await check('otto: hand-off on phone (SVG Otto): a tapped project counts down and takes you inside; the ring shows it', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await modeSettled(page);
    for (const label of ['Good, thanks', 'His work']) { await choiceButton(page, label).tap(); await settled(page); }
    await choiceButton(page, 'NOOKBASE').tap();
    await page.locator('[data-offer-take]').waitFor({ state: 'visible', timeout: 10000 });
    assert.equal(await page.locator('[data-otto-offer]').getAttribute('data-anchor'), 'dock', 'docked offer on phones');
    assert.ok(await page.locator('[data-otto-offer]').evaluate(el => el.hasAttribute('data-counting')), 'countdown runs');
    assert.equal(await page.locator('[data-offer-take] [data-offer-ring]').count(), 1, 'countdown ring present');
    await page.waitForTimeout(1200);
    assert.ok(await page.locator('[data-offer-ring]').evaluate(el => parseFloat(el.style.getPropertyValue('--p')) > .1), 'ring fills');
    assert.match(await page.locator('#otto-offer-desc').textContent(), /about 4 seconds/, 'the timer is described to screen readers');
    const box = await page.locator('[data-otto-offer]').boundingBox();
    assert.ok(box && box.x >= 0 && box.x + box.width <= 391 && box.y + box.height <= 845, 'offer fully on screen');
    await page.waitForURL(/inside\/nookbase/, { timeout: 12000 });
    assert.match(await page.locator('h1').textContent(), /NOOKBASE/);
    await context.close();
  });
  await check('otto: "Stay here" and Esc cancel the hand-off and show the full answer with what next', async () => {
    const context = await isolated(browser, { reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await choose(page, 'Good, thanks');
    await choose(page, 'His work');
    await choiceButton(page, 'BP pipeline').click();
    await page.locator('[data-offer-stay]').waitFor({ state: 'visible', timeout: 10000 });
    assert.ok(!(await page.locator('[data-otto-offer]').evaluate(el => el.hasAttribute('data-counting'))), 'no countdown with reduced motion');
    assert.ok(await page.locator('[data-chat]').evaluate(el => el.inert), 'dimmed chat is inert during the offer');
    await page.waitForTimeout(4500);
    assert.ok(page.url().endsWith('/index.html'), 'never leaves without a choice when motion is reduced');
    await page.locator('[data-offer-stay]').click();
    await settled(page);
    assert.ok(page.url().endsWith('/index.html'), 'stayed');
    assert.ok(!(await page.locator('[data-hero]').getAttribute('data-handoff')), 'stage reset');
    assert.ok(!(await page.locator('[data-chat]').evaluate(el => el.inert)), 'chat usable again');
    assert.ok(await page.evaluate(() => !!document.activeElement && document.activeElement !== document.body), 'focus returned, not dropped to body');
    assert.match(await lastOtto(page).locator('.bubble').textContent(), /Bloomberg/);
    assert.equal(await lastOtto(page).locator('a.card[href="/inside/bp.html"]').count(), 1, 'inside card offered');
    assert.deepEqual(await choices(page), ['Take me inside after all', 'Tell me more', 'Other projects', 'Back to topics']);
    await choose(page, 'Other projects');
    assert.deepEqual(await choices(page), ['KATANA', 'NOOKBASE', 'INOS & OctiMind', 'Bitget models', 'Back to topics'], 'the other projects');
    await choiceButton(page, 'Bitget models').click();
    await page.locator('[data-offer-take]').waitFor({ state: 'visible', timeout: 10000 });
    await page.keyboard.press('Escape');
    await settled(page);
    assert.ok(page.url().endsWith('/index.html'), 'Esc stays');
    assert.ok(await page.locator('[data-otto-offer]').evaluate(el => el.hidden), 'offer closed');
    assert.match(await lastOtto(page).locator('.bubble').textContent(), /no claim of trading returns/);
    await choiceButton(page, 'Take me inside after all').click();
    await page.locator('[data-offer-stay]').waitFor({ state: 'visible', timeout: 10000 });
    await page.locator('[data-offer-stay]').click();
    await settled(page);
    assert.match(await lastOtto(page).locator('.bubble').textContent(), /Whenever you’re ready/);
    await context.close();
    // Motion on, keyboard only: Enter on a choice moves focus to the next reply's first choice; Take gets keyboard focus, so nothing counts down; the command menu's Esc is its own.
    const live = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } });
    const page2 = await live.newPage();
    await page2.goto(`${base}/index.html?otto3d=off`, { waitUntil: 'networkidle' });
    await page2.waitForTimeout(500);
    await choiceButton(page2, 'Good, thanks').focus();
    await page2.keyboard.press('Enter');
    await settled(page2);
    assert.equal(await page2.evaluate(() => document.activeElement?.textContent.trim()), 'His work', 'focus moves to the first new choice');
    assert.ok(await page2.evaluate(() => document.activeElement.matches(':focus-visible')), 'and it shows');
    await page2.keyboard.press('Enter');
    await settled(page2);
    assert.equal(await page2.evaluate(() => document.activeElement?.textContent.trim()), 'KATANA');
    await page2.keyboard.press('Enter');
    await page2.locator('[data-offer-take]').waitFor({ state: 'visible', timeout: 10000 });
    await page2.waitForTimeout(5000);
    assert.ok(page2.url().includes('/index.html'), 'a keyboard choice never auto-navigates');
    await page2.keyboard.press('Control+k');
    assert.ok(await page2.locator('[data-palette]').evaluate(el => el.open), 'menu opens over the offer');
    await page2.keyboard.press('Escape');
    assert.ok(!(await page2.locator('[data-palette]').evaluate(el => el.open)), 'Esc closes the menu');
    assert.ok(await page2.locator('[data-otto-offer]').isVisible(), '…and leaves the offer open');
    await page2.keyboard.press('Escape');
    assert.ok(await page2.locator('[data-otto-offer]').evaluate(el => el.hidden), 'then Esc declines the offer');
    await settled(page2);
    assert.equal(await page2.evaluate(() => document.activeElement?.textContent.trim()), 'Take me inside after all', 'focus lands on the first choice after staying');
    await live.close();
  });
  await check('otto: transcript and last choices survive a reload; Clear starts over; ?ask= takes intent ids only', async () => {
    const context = await isolated(browser, { viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await choose(page, 'Good, thanks');
    await choose(page, 'Research & study');
    await choose(page, 'His degree');
    const before = await choices(page);
    assert.deepEqual(before, ['Tell me more', 'When does he graduate?', 'Any certifications?', 'Back to topics']);
    assert.equal(await page.evaluate(() => localStorage.getItem('otto-history')), null, 'no typing history is kept');
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await page.locator('.turn--you').count(), 3, 'choices restored');
    assert.match(await lastOtto(page).textContent(), /Birkbeck/);
    assert.deepEqual(await choices(page), before, 'the last choices come back');
    await choose(page, 'When does he graduate?');
    assert.match(await lastOtto(page).locator('.bubble').textContent(), /2028/);
    await page.click('[data-chat-clear]');
    assert.equal(await page.locator('.turn--you').count(), 0, 'cleared');
    assert.deepEqual(await choices(page), moods, 'back to the greeting');
    assert.equal(await page.evaluate(() => document.activeElement?.textContent.trim()), 'Good, thanks', 'focus on the first choice, not lost with the Clear button');
    await page.goto(`${base}/index.html?ask=safe`, { waitUntil: 'networkidle' });
    await settled(page);
    assert.match(await lastOtto(page).textContent(), /enhanced DBS check/);
    assert.equal(await page.locator('.turn--you').last().textContent(), 'Is Omar DBS checked?');
    assert.deepEqual(await choices(page), ['How much are lessons?', 'Where’s he based?', 'Back to topics']);
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    for (const junk of ['are you DBS checked', 'idk', '<img src=x onerror=alert(1)>']) {
      await page.goto(`${base}/index.html?ask=${encodeURIComponent(junk)}`, { waitUntil: 'networkidle' });
      assert.equal(await page.locator('.turn--you').count(), 0, `?ask=${junk} is ignored`);
      assert.deepEqual(await choices(page), moods, 'the greeting plays instead');
    }
    await context.close();
  });
  await check('otto: reduced motion keeps a still 3D Otto and answers instantly; Pause motion stills the SVG Otto', async () => {
    const still = await isolated(browser, { reducedMotion: 'reduce', viewport: { width: 390, height: 844 } });
    const page = await still.newPage();
    await page.goto(`${base}/index.html?otto3d=force`, { waitUntil: 'load' });
    assert.match(await page.locator('[data-greeting]').textContent(), /I’m Otto, Omar’s robot\. How are you doing\?/);
    await mode3d(page);
    assert.equal(await page.locator(heroStage).getAttribute('data-mode'), '3d');
    const a = await lime(page); await page.waitForTimeout(1200); const b = await lime(page);
    assert.ok(a > .0005 && a === b, `still frame (${a} vs ${b})`);
    assert.match(await page.locator('[data-motion-toggle]').textContent(), /Play motion/);
    const started = Date.now();
    for (const label of ['Good, thanks', 'Get in touch', 'Where’s he based?']) {
      await pick(page, label);
      await page.waitForFunction(() => !document.querySelector('[data-chat]').hasAttribute('data-busy'), null, { timeout: 15000 });
    }
    assert.ok(Date.now() - started < 6000, `instant answers (${Date.now() - started}ms for three)`);
    assert.match(await lastOtto(page).textContent(), /London/);
    assert.equal(await page.locator('.typing').count(), 0, 'no typing dots with reduced motion');
    await still.close();
    const live = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    const page2 = await live.newPage();
    await page2.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await modeSettled(page2);
    assert.notEqual(await page2.locator(`${heroStage} .robot__body`).evaluate(el => getComputedStyle(el).animationName), 'none', 'Otto floats');
    await page2.click('[data-motion-toggle]');
    assert.equal(await page2.evaluate(() => document.documentElement.dataset.motion), 'off');
    assert.equal(await page2.locator(`${heroStage} .robot__body`).evaluate(el => getComputedStyle(el).animationName), 'none', 'Otto still');
    assert.equal(await page2.locator('.chat__glow').evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
    assert.equal(await page2.locator('.ticker__track').first().evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
    const started2 = Date.now();
    await choose(page2, 'Good, thanks');
    assert.ok(Date.now() - started2 < 1500, 'Pause motion answers instantly too');
    await page2.reload({ waitUntil: 'networkidle' });
    assert.equal(await page2.evaluate(() => document.documentElement.dataset.motion), 'off', 'Pause remembered for the session');
    await page2.click('[data-motion-toggle]');
    await live.close();
  });
  await check('otto: ?otto3d=off and a failed 3D session fall back to the SVG Otto', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html?otto3d=off`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator(heroStage).getAttribute('data-mode'), 'svg');
    assert.equal(await page.locator(heroStage).getAttribute('data-reason'), 'gate');
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await modeSettled(page);
    assert.match(await page.locator(heroStage).getAttribute('data-reason'), /^(software|no-webgl)$/, 'CPU-rendered WebGL is refused up front');
    assert.equal(await page.evaluate(() => sessionStorage.getItem('otto3d')), 'off', 'refused or slow WebGL is remembered for the session');
    await page.goto(`${base}/inside/inos.html`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('[data-otto-stage][data-stage-mode="dock"]').getAttribute('data-mode'), 'svg', 'inside dock stays SVG');
    await context.close();
  });
  await check('command menu: Ctrl+K and ⌘K open; arrows + Enter navigate; Ask Otto items reach Otto; no free-text ask', async () => {
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
    await page.keyboard.type('inside katana');
    await Promise.all([page.waitForURL(/inside\/katana\.html$/), page.keyboard.press('Enter')]);
    await page.click('[data-palette-open]');
    await page.keyboard.type('internships');
    await Promise.all([page.waitForURL(/index\.html\?ask=hire$/), page.keyboard.press('Enter')]);
    await settled(page);
    assert.match(await lastOtto(page).textContent(), /Sales & Trading/);
    assert.equal(await page.locator('[data-palette] [data-free]').count(), 0, 'no free-text ask in the menu');
    await page.keyboard.press('Control+k');
    await page.keyboard.type('pizza recipes');
    assert.equal(await page.locator('[data-palette-list] [role="option"]:not([hidden])').count(), 0, 'nothing to ask');
    assert.match(await page.locator('[data-palette-status]').textContent(), /No results/);
    const turns = await page.locator('.turn').count();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('.turn').count(), turns, 'Enter on no results does nothing');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Control+k');
    await page.keyboard.type('dbs');
    await page.keyboard.press('Enter');
    await settled(page);
    assert.match(await lastOtto(page).textContent(), /enhanced DBS check/, 'an Ask Otto item answers in the homepage chat');
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('omar:ask', { detail: { text: 'idk' } })));
    await page.waitForTimeout(300);
    assert.match(await lastOtto(page).textContent(), /enhanced DBS check/, 'free text from omar:ask is ignored');
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
  for (const theme of ['light', 'dark']) for (const width of [360, 390, 768, 1280]) {
    await check(`inside tours ${width}px ${theme}: render, indexable, no overflow, axe, Esc goes back`, async () => {
      const context = await isolated(browser, { viewport: { width, height: 900 }, colorScheme: theme });
      const page = await context.newPage();
      const errors = watch(page);
      const axeSource = axePath && (width === 390 || width === 1280) ? await fs.readFile(axePath, 'utf8') : '';
      for (const id of ['katana', 'nookbase', 'inos', 'bitget', 'bp']) {
        await page.goto(`${base}/inside/${id}.html`, { waitUntil: 'networkidle' });
        assert.equal(await page.locator('h1').count(), 1);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${id}: no overflow`);
        assert.equal(await page.locator('meta[name="robots"][content*="noindex"]').count(), 0, `${id}: indexable`);
        assert.ok(await page.locator('[data-otto-stage][data-stage-mode="dock"] [data-robot]').count() === 1, `${id}: Otto docked`);
        assert.ok(await page.locator('[data-inside-back]').first().isVisible(), `${id}: Back to Otto`);
        if (axeSource) {
          await page.addScriptTag({ content: axeSource });
          const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => `${v.id}: ${v.nodes.slice(0, 3).map(n => n.target.join(' ')).join(', ')}`));
          assert.deepEqual(violations, [], `${id}: axe`);
        }
      }
      await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
      await Promise.all([page.waitForURL(/inside\/bitget/), page.evaluate(() => { location.href = '/inside/bitget.html'; })]);
      await page.waitForLoadState('networkidle');
      await page.keyboard.press('Escape');
      await page.waitForURL(/index\.html/);
      assert.deepEqual(errors, []);
      await context.close();
    });
  }
  await check('inside tours: no JavaScript still reads as a full page', async () => {
    const context = await isolated(browser, { javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    for (const id of ['katana', 'bitget']) {
      await page.goto(`${base}/inside/${id}.html`);
      const text = await page.locator('main').innerText();
      assert.ok(text.length > 600, `${id}: content readable without JS (${text.length} chars)`);
      assert.ok(await page.locator('[data-otto-stage] [data-robot]').isVisible(), `${id}: Otto visible`);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${id}: no overflow`);
    }
    await context.close();
  });

  /* 5d. Motion pass: 3D orbit, sliding columns, question slider, Pause motion. */
  await check('orbit: drifts, drag spins without opening a card, arrows step, tap opens; slider and columns move; Pause stops them', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const errors = watch(page);
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.locator('[data-orbit]').scrollIntoViewIfNeeded();
    const spin = () => page.locator('[data-orbit-ring]').evaluate(el => parseFloat(el.style.getPropertyValue('--spin')) || 0);
    const a = await spin(); await page.waitForTimeout(700);
    assert.notEqual(await spin(), a, 'drifts on its own');
    const box = await page.locator('[data-orbit]').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 - 220, box.y + box.height / 2, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(900);
    assert.ok(page.url().endsWith('/index.html'), 'drag did not open a card');
    const before = await page.locator('[data-orbit-count]').textContent();
    await page.click('[data-orbit-next]');
    await page.waitForTimeout(800);
    assert.notEqual(await page.locator('[data-orbit-count]').textContent(), before, 'arrow steps');
    const front = await page.evaluate(() => { const items = [...document.querySelectorAll('[data-orbit-item]')]; return items.sort((x, y) => parseFloat(getComputedStyle(y).getPropertyValue('--o')) - parseFloat(getComputedStyle(x).getPropertyValue('--o')))[0].querySelector('a').getAttribute('href'); });
    await Promise.all([page.waitForURL(url => url.pathname === front), page.evaluate(href => document.querySelector(`[data-orbit] a[href="${href}"]`).click(), front)]);
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    const track = page.locator('.cols__track').first();
    assert.notEqual(await track.evaluate(el => getComputedStyle(el).animationName), 'none', 'columns glide');
    await page.locator('[data-slider]').scrollIntoViewIfNeeded();
    const left = await page.locator('[data-slider-track]').evaluate(el => el.scrollLeft);
    await page.click('[data-slider-next]');
    await page.waitForTimeout(900);
    assert.ok(await page.locator('[data-slider-track]').evaluate(el => el.scrollLeft) > left, 'slider advances');
    await page.evaluate(() => scrollTo(0, 0));
    await page.click('[data-motion-toggle]');
    await page.locator('[data-orbit]').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const b = await spin(); await page.waitForTimeout(800);
    assert.equal(await spin(), b, 'orbit stops when motion is paused');
    assert.equal(await track.evaluate(el => getComputedStyle(el).animationPlayState), 'paused', 'columns pause');
    assert.deepEqual(errors, []);
    await context.close();
  });
  await check('orbit without JavaScript is a swipeable row of links', async () => {
    const context = await isolated(browser, { javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`);
    assert.equal(await page.locator('.orbit__ring').evaluate(el => getComputedStyle(el).display), 'flex');
    assert.ok(await page.locator('[data-orbit] a[href="/inside/katana.html"]').isVisible());
    await context.close();
  });

  /* 5b. Numbers and scroll motion. */
  await check('numbers count up to their CV values', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.locator('.stats').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1900);
    assert.deepEqual(await page.locator('[data-count-to]').allTextContents(), ['150', '5', '3', '2']);
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
