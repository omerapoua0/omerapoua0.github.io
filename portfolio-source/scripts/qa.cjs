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

async function check(name, run) {
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
    for (const route of routes) {
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
    for (const file of ['/Omar-Aboelella-CV.pdf', '/THIRD-PARTY-NOTICES.txt', '/LICENSE.txt', '/hero-editorial.mp4', '/hero-editorial.webm', '/hero-editorial-mobile.mp4', '/hero-editorial-mobile.webm', '/hero-editorial-manifest.json']) {
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
    assert.ok(await page.locator('.hero__poster').isVisible(), 'hero poster visible without JS');
    assert.ok(await page.locator('.ticker').isVisible(), 'ticker visible without JS');
    await context.close();
  });

  /* 5. Hero film and motion: immediate playback, motion switch, chapters,
        offscreen pause, reduced motion, save-data, blocked autoplay, failure. */
  const videoState = page => page.evaluate(() => { const v = document.querySelector('[data-hero-video]'); return { paused: v.paused, time: v.currentTime, src: v.currentSrc }; });
  await check('film plays at once; motion switch pauses film, line and ticker; chapters seek', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => { const v = document.querySelector('[data-hero-video]'); return v && !v.paused && v.currentTime > 0.3; }, null, { timeout: 8000 });
    const first = await page.locator('.cycle__item.is-active').textContent();
    await page.waitForFunction(text => document.querySelector('.cycle__item.is-active')?.textContent !== text, first, { timeout: 5000 });
    const toggle = page.locator('[data-film-toggle]');
    assert.match(await toggle.textContent(), /Pause motion/);
    await toggle.click();
    assert.equal((await videoState(page)).paused, true);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.motion), 'off');
    assert.match(await toggle.textContent(), /Play motion/);
    assert.equal(await page.locator('.ticker__track').first().evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
    const frozen = await page.locator('.cycle__item.is-active').textContent();
    await page.waitForTimeout(3000);
    assert.equal(await page.locator('.cycle__item.is-active').textContent(), frozen, 'cycling line frozen');
    await page.locator('[data-chapter="2"]').click();
    await page.waitForFunction(() => Math.abs(document.querySelector('[data-hero-video]').currentTime - 10.05) < .5);
    assert.equal(await page.locator('[data-chapter="2"]').getAttribute('aria-current'), 'true');
    assert.equal((await videoState(page)).paused, true, 'paused motion persists after chapter seek');
    await toggle.click();
    await page.waitForFunction(() => !document.querySelector('[data-hero-video]').paused);
    await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
    await page.waitForFunction(() => document.querySelector('[data-hero-video]').paused);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForFunction(() => !document.querySelector('[data-hero-video]').paused);
    await context.close();
  });
  await check('film: phone edition plays in the first viewport without scrolling', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('[data-hero-video]').paused, null, { timeout: 8000 });
    assert.match((await videoState(page)).src, /hero-editorial-mobile\./);
    assert.equal(await page.evaluate(() => scrollY), 0);
    await context.close();
  });
  await check('film: blocked autoplay (iPhone Low Power Mode) switches to moving stills', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await context.addInitScript(() => { HTMLMediaElement.prototype.play = function () { return Promise.reject(new DOMException('blocked', 'NotAllowedError')); }; });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('[data-film-hero]').dataset.filmStills === 'blocked', null, { timeout: 8000 });
    assert.ok(await page.locator('[data-film-retry]').isVisible(), 'retry offered');
    const active = () => page.evaluate(() => [...document.querySelectorAll('[data-stills] img')].findIndex(img => img.hasAttribute('data-active')));
    const start = await active();
    assert.ok(start >= 0);
    await page.waitForFunction(index => [...document.querySelectorAll('[data-stills] img')].findIndex(img => img.hasAttribute('data-active')) !== index, start, { timeout: 7000 });
    assert.ok(await page.locator('[data-stills] img[data-active]').evaluate(img => img.complete && img.naturalWidth > 0 && /hero-still-\d-m\.webp/.test(img.src)));
    await context.close();
  });
  await check('film: reduced motion starts still and offers play', async () => {
    const context = await isolated(browser, { reducedMotion: 'reduce' });
    const page = await context.newPage();
    const media = [];
    page.on('request', request => { if (/hero-editorial.*\.(mp4|webm)/.test(request.url())) media.push(request.url()); });
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    assert.deepEqual(media, []);
    assert.ok(await page.locator('.hero__poster').isVisible());
    assert.match(await page.locator('[data-film-toggle]').textContent(), /Play motion/);
    assert.equal(await page.locator('.cycle__item.is-active').textContent(), 'I build AI that reasons.');
    assert.equal(await page.locator('.ticker__track').first().evaluate(el => getComputedStyle(el).animationName), 'none');
    await context.close();
  });
  await check('film: save-data uses stills and loads no video', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference' });
    await context.addInitScript(() => Object.defineProperty(navigator, 'connection', { value: { saveData: true } }));
    const page = await context.newPage();
    const media = [];
    page.on('request', request => { if (/hero-editorial.*\.(mp4|webm)/.test(request.url())) media.push(request.url()); });
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    assert.deepEqual(media, []);
    assert.equal(await page.evaluate(() => document.querySelector('[data-film-hero]').dataset.filmStills), 'save-data');
    await context.close();
  });
  await check('film: failed media falls back to moving stills', async () => {
    const context = await isolated(browser, { reducedMotion: 'no-preference' });
    await context.route(/hero-editorial.*\.(mp4|webm)$/, route => route.abort());
    const page = await context.newPage();
    await page.goto(`${base}/index.html`);
    await page.waitForFunction(() => document.querySelector('[data-film-hero]').dataset.filmError === 'true', null, { timeout: 10000 });
    assert.equal(await page.evaluate(() => document.querySelector('[data-film-hero]').dataset.filmStills), 'error');
    assert.ok(!(await page.locator('[data-film-retry]').isVisible()), 'no retry for broken media');
    await context.close();
  });

  /* 5b. Personal hero and scroll motion. */
  for (const [label, viewport] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
    await check(`personal hero ${label}: name, portrait, London time and credit`, async () => {
      const context = await isolated(browser, { viewport });
      const page = await context.newPage();
      await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
      assert.match(await page.locator('h1').textContent(), /Hi, I’m Omar/);
      const portrait = label === 'desktop' ? '.chero__portrait img' : '.chero__avatar';
      assert.ok(await page.locator(portrait).isVisible(), 'portrait visible');
      assert.ok(await page.locator(portrait).evaluate(img => img.complete && img.naturalWidth > 0), 'portrait loaded');
      assert.match(await page.locator('[data-london-time]').textContent(), /^\d{2}:\d{2}$/);
      assert.match(await page.locator('.chero__credit').textContent(), /not me/);
      await context.close();
    });
  }
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
