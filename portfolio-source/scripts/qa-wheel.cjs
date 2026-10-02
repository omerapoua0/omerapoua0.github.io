/* Local-only, isolated browser QA. No personal profile or external submission. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const base = process.env.PORTFOLIO_QA_URL || 'http://127.0.0.1:4174';
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const output = process.env.WHEEL_QA_OUTPUT || await fs.mkdtemp(path.join(os.tmpdir(), 'omar-wheel-qa-'));
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const results = [];
  const warnings = [];
  async function settled(page, turn) {
    await page.waitForFunction(expected => {
      const stage = document.querySelector('.works-wheel-stage');
      return stage?.dataset.animating === 'false' && Math.abs(Number(stage.dataset.turn) - expected) < .002;
    }, turn);
  }
  async function showStage(page) {
    await page.locator('.works-wheel-stage').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForFunction(() => document.querySelector('.works-wheel-stage')?.dataset.visible === 'true');
  }
  try {
    for (const width of [1440, 390, 320]) {
      const mobile = width < 720;
      const context = await browser.newContext({ viewport: { width, height: 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      page.setDefaultTimeout(12000);
      page.on('pageerror', error => warnings.push({ width, error: error.message }));
      await page.goto(`${base}/`, { waitUntil: 'networkidle' });
      const wheel = page.locator('.works-wheel');
      await wheel.scrollIntoViewIfNeeded();
      await page.locator('.works-wheel[data-enhanced=true]').waitFor();
      const stage = page.locator('.works-wheel-stage');
      const count = await page.locator('.works-wheel-card').count();
      assert.ok(count >= 5, 'Expected the actual portfolio items');
      await showStage(page); await settled(page, 0);
      assert.equal(await page.locator('.works-wheel-card[tabindex="0"]').count(), count, 'Ring links are reachable');
      await page.locator('.works-wheel-composition').screenshot({ path: path.join(output, `${width}-ring.png`) });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(overflow <= 1, `No page overflow at ${width}px: ${overflow}`);

      await stage.focus(); await page.keyboard.press('ArrowRight'); await settled(page, 1);
      assert.equal(await page.locator('.works-wheel-card[tabindex="0"]').count(), 1);
      assert.ok(await page.locator('.works-wheel-card[inert]').count() >= count - 2);
      assert.equal(await page.locator('.works-wheel-card[inert]').evaluateAll(cards => cards.every(card => card.tabIndex === -1 && card.getAttribute('aria-hidden') === 'true' && getComputedStyle(card).pointerEvents === 'none')), true);
      await page.locator('.works-wheel-composition').screenshot({ path: path.join(output, `${width}-drum.png`) });
      await page.keyboard.press('End'); await settled(page, count);
      assert.ok(await page.getByRole('button', { name: 'Next project', exact: true }).isDisabled());
      await page.keyboard.press('Home'); await settled(page, 1);
      await page.keyboard.press('ArrowRight'); await settled(page, 2);
      await page.keyboard.press('ArrowLeft'); await settled(page, 1);
      await page.keyboard.press('Escape'); await settled(page, 0);
      await page.keyboard.press('Enter'); await settled(page, 1);
      // Capture the link activation without navigating or submitting anything.
      await page.evaluate(() => {
        window.__wheelActivated = '';
        document.querySelector('.works-wheel-stage').addEventListener('click', event => {
          const link = event.target.closest('a');
          if (link) { event.preventDefault(); window.__wheelActivated = link.getAttribute('href'); }
        }, { once: true, capture: true });
      });
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => window.__wheelActivated), await page.locator('.works-wheel-card').first().getAttribute('href'));
      await page.getByRole('button', { name: 'Next project', exact: true }).click();
      await settled(page, 2);
      assert.equal(await stage.getAttribute('data-visible'), 'true', 'Explicit next reveals the stage without test scrolling');
      await page.getByRole('button', { name: 'Previous project', exact: true }).click();
      await settled(page, 1);
      await page.locator('.works-wheel-index button').last().click();
      await settled(page, count);
      await page.getByRole('button', { name: 'Overview', exact: true }).click();
      await settled(page, 0);

      const idleMutations = await stage.evaluate(el => new Promise(resolve => {
        let changes = 0;
        const observer = new MutationObserver(records => { changes += records.length; });
        observer.observe(el, { subtree: true, attributes: true, attributeFilter: ['style'] });
        setTimeout(() => { observer.disconnect(); resolve(changes); }, 350);
      }));
      assert.equal(idleMutations, 0, 'No perpetual idle animation');
      await stage.focus(); await page.keyboard.press('End');
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForFunction(() => document.querySelector('.works-wheel-stage').dataset.visible === 'false');
      assert.equal(await stage.getAttribute('data-animating'), 'false', 'Offscreen loop stops');
      await showStage(page); await settled(page, count);
      await stage.focus(); await page.keyboard.press('Escape'); await settled(page, 0);

      if (!mobile) {
        const rect = await stage.boundingBox();
        await page.mouse.move(rect.x + rect.width / 2, rect.y + 40);
        const before = await page.evaluate(() => scrollY);
        await page.mouse.wheel(0, 260); await pause(300);
        assert.ok(await page.evaluate(() => scrollY) > before + 40, 'Default wheel scrolls the page');
        assert.equal(await stage.getAttribute('data-turn'), '0.000');
        await showStage(page);
        await page.locator('.works-wheel-scroll-toggle').click(); await showStage(page);
        const enabled = await stage.boundingBox();
        await page.mouse.move(enabled.x + enabled.width / 2, enabled.y + 40);
        await page.mouse.wheel(0, 700); await settled(page, 1);
        await stage.focus(); await page.keyboard.press('End'); await settled(page, count);
        const endRect = await stage.boundingBox();
        await page.mouse.move(endRect.x + endRect.width / 2, endRect.y + 40);
        const endBefore = await page.evaluate(() => scrollY);
        await page.mouse.wheel(0, 260); await pause(300);
        assert.ok(await page.evaluate(() => scrollY) > endBefore + 40, 'Opt-in wheel releases at endpoint');
        await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
        await showStage(page); await stage.focus(); await page.keyboard.press('Escape'); await settled(page, 0);
        const light = await wheel.evaluate(el => ({ background: getComputedStyle(el).backgroundColor, surface: getComputedStyle(el).getPropertyValue('--surface').trim(), glow: getComputedStyle(el).getPropertyValue('--ww-stage-glow').trim() }));
        assert.equal(light.glow, '#e4e0da', 'Light stage uses a neutral editorial palette');
        await page.locator('.works-wheel-composition').screenshot({ path: path.join(output, `${width}-light-ring.png`) });
      } else {
        assert.equal(await page.locator('.works-wheel-scroll-toggle').isVisible(), false);
        const cdp = await context.newCDPSession(page);
        async function swipe(dx, dy) {
          await showStage(page);
          const rect = await stage.boundingBox();
          const x = rect.x + rect.width * .9, y = rect.y + 48;
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
          for (let i = 1; i <= 10; i++) {
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 10, y: y + dy * i / 10 }] });
            await pause(18);
          }
          await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        }
        await swipe(-230, 0); await settled(page, 1);
        await stage.focus(); await page.keyboard.press('Escape'); await settled(page, 0);
        await showStage(page);
        const before = await page.evaluate(() => scrollY);
        await swipe(0, -180); await pause(300);
        assert.ok(await page.evaluate(() => scrollY) > before + 40, 'Mobile vertical swipe scrolls the page');
        assert.equal(await stage.getAttribute('data-turn'), '0.000', 'Vertical swipe does not turn wheel');
      }
      results.push({ width, interactive: 'pass', count, overflow, idleMutations });
      await context.close();
    }
    for (const mode of ['reduced', 'no-js']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference', javaScriptEnabled: mode !== 'no-js' });
      const page = await context.newPage();
      await page.goto(`${base}/`, { waitUntil: 'networkidle' });
      await page.locator('.works-wheel').scrollIntoViewIfNeeded();
      if (mode === 'reduced') await pause(350);
      assert.ok(await page.locator('.works-wheel-fallback').isVisible());
      assert.equal(await page.locator('.works-wheel-interactive').isVisible(), false);
      const links = await page.locator('.works-wheel-fallback a[href]').count();
      assert.ok(links >= 5);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
      await page.locator('.works-wheel-fallback').screenshot({ path: path.join(output, `${mode}-list.png`) });
      results.push({ mode, accessibleLinks: links, fallback: 'pass' });
      await context.close();
    }
    await fs.writeFile(path.join(output, 'report.json'), JSON.stringify({ results, warnings, noExternalSubmission: true }, null, 2));
    console.log(JSON.stringify({ status: 'pass', output, results, warnings }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
