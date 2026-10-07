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
 *
 * The hero robot's media live on Higgsfield's CDN (src/data/robot.ts). QA
 * never fetches them: requests to that host are answered with local
 * STAND-INS (dark ~5 s clips with simple shapes: an orb that becomes a
 * "robot", and LOOK ending white; v9's ASK (a "hand" box presenting to the
 * left), WAVE and HEART (a red box at the chest); two webp stills), taken
 * from QA_ROBOT_MEDIA (a directory with orb.webp, robot.webp, transform.mp4,
 * look.mp4, ask.mp4, wave.mp4, heart.mp4 and optionally look-h264.mp4) or
 * generated with ffmpeg into .qa/robot8. The
 * stand-in clips are VP9 in an MP4 container, which this Chromium (no H.264)
 * accepts for the .mp4 URLs; look-h264.mp4 is real H.264, used to test the
 * "H.264 unsupported" path. Stand-ins are never committed.
 * v10: Otto's voice lines (WAV on the same CDN) are answered with short
 * stand-in tones (voice-intro.wav, voice-yes.wav, voice-hello.wav,
 * voice-thanks.wav, generated with ffmpeg next to the clips).
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

/* Robot stand-ins (see the header). */
const ROBOT_HOST = 'd8j0ntlcm91z4.cloudfront.net';
const robotDir = process.env.QA_ROBOT_MEDIA || path.join(output, 'robot8');
let robotMedia = null; // { orb, still, transform, look, h264 } file paths, or null when unavailable
function prepareRobotMedia() {
  const fsSync = require('node:fs');
  const want = { orb: 'orb.webp', still: 'robot.webp', transform: 'transform.mp4', look: 'look.mp4', ask: 'ask.mp4', wave: 'wave.mp4', heart: 'heart.mp4', h264: 'look-h264.mp4' };
  const files = Object.fromEntries(Object.entries(want).map(([key, name]) => [key, path.join(robotDir, name)]));
  if (!process.env.QA_ROBOT_MEDIA && !['look', 'ask', 'wave', 'heart'].every(key => fsSync.existsSync(files[key]))) {
    const { execFileSync } = require('node:child_process');
    fsSync.mkdirSync(robotDir, { recursive: true });
    const ff = args => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args], { stdio: 'pipe' });
    // Near-black frames with simple shapes: a blue "orb" (top centre right)
    // that grows into a red "robot" (head ≈ 62% / 28%, shoulders below);
    // LOOK turns white from ≈ 3.6 s, like the real clip's burst of light.
    const bg = (w, h, d) => ['-f', 'lavfi', '-i', `color=c=0x05070b:s=${w}x${h}:r=24:d=${d}`];
    const robotShape = (w, h, extra = '') => `drawbox=x=${Math.round(w * .55)}:y=${Math.round(h * .08)}:w=${Math.round(w * .14)}:h=${Math.round(h * .38)}:color=0xff2d46@0.85:t=fill${extra},drawbox=x=${Math.round(w * .4)}:y=${Math.round(h * .55)}:w=${Math.round(w * .45)}:h=${Math.round(h * .45)}:color=0x9a1f2e@0.8:t=fill${extra}`;
    try {
      ff([...bg(1280, 720, 5.06), '-vf', `drawbox=x=600:y=90:w=180:h=180:color=0x4d84ff@0.9:t=fill:enable='lt(t,2.2)',drawbox=x='600-40*(t-2.2)':y=90:w='180+20*(t-2.2)':h='180+60*(t-2.2)':color=0xe6eeff@0.6:t=fill:enable='between(t,2.2,4.0)',${robotShape(1280, 720, ":enable='gte(t,3.2)'")}`, '-c:v', 'libvpx-vp9', '-b:v', '300k', '-an', files.transform]);
      ff([...bg(1344, 768, 5.18), '-vf', `${robotShape(1344, 768)},drawbox=x='740-120*min(t,1)':y=60:w=40:h=40:color=white@0.9:t=fill,drawbox=x=0:y=0:w=1344:h=768:color=white@1:t=fill:enable='gt(t,3.6)'`, '-c:v', 'libvpx-vp9', '-b:v', '300k', '-an', files.look]);
      // v9 moves (1280 × 720, 5.06 s, starting and, for WAVE/HEART, ending on the robot).
      ff([...bg(1280, 720, 5.06), '-vf', `${robotShape(1280, 720)},drawbox=x='700-260*min(max(t-1.7,0),0.4)/0.4':y=330:w=90:h=60:color=0xe6eeff@0.9:t=fill:enable='between(t,1.7,3.75)'`, '-c:v', 'libvpx-vp9', '-b:v', '300k', '-an', files.ask]);
      ff([...bg(1280, 720, 5.06), '-vf', `${robotShape(1280, 720)},drawbox=x=520:y='200+40*sin(12*t)':w=60:h=90:color=0xe6eeff@0.9:t=fill:enable='between(t,1.25,2.9)'`, '-c:v', 'libvpx-vp9', '-b:v', '300k', '-an', files.wave]);
      ff([...bg(1280, 720, 5.06), '-vf', `${robotShape(1280, 720)},drawbox=x=700:y=420:w=110:h=90:color=0xff2d46@1:t=fill:enable='between(t,1.7,3.75)'`, '-c:v', 'libvpx-vp9', '-b:v', '300k', '-an', files.heart]);
      ff([...bg(1344, 752, 1), '-vf', 'drawbox=x=780:y=150:w=200:h=200:color=0x4d84ff@0.9:t=fill', '-frames:v', '1', '-c:v', 'libwebp', files.orb]);
      ff([...bg(1344, 752, 1), '-vf', robotShape(1344, 752), '-frames:v', '1', '-c:v', 'libwebp', files.still]);
      try { ff([...bg(1344, 768, 5.18), '-vf', robotShape(1344, 768), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-an', files.h264]); } catch { /* no libx264: that path is skipped */ }
    } catch (error) { console.warn('Robot stand-ins unavailable (ffmpeg):', error.message.split('\n')[0]); }
  }
  // v10 voice stand-ins: 1.2 s stereo 24 kHz tones.
  const voices = { intro: 'voice-intro.wav', yes: 'voice-yes.wav', hello: 'voice-hello.wav', thanks: 'voice-thanks.wav' };
  for (const [key, name] of Object.entries(voices)) {
    files[`voice-${key}`] = path.join(robotDir, name);
    if (!fsSync.existsSync(files[`voice-${key}`])) {
      try { require('node:child_process').execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `sine=frequency=${{ intro: 330, yes: 440, hello: 550, thanks: 660 }[key]}:duration=1.2`, '-ar', '24000', '-ac', '2', files[`voice-${key}`]], { stdio: 'pipe' }); } catch { /* no voice stand-ins: those checks are skipped */ }
    }
  }
  robotMedia = ['orb', 'still', 'transform', 'look', 'ask', 'wave', 'heart'].every(key => fsSync.existsSync(files[key])) ? { ...files, h264: fsSync.existsSync(files.h264) ? files.h264 : null, voice: Object.keys(voices).every(key => fsSync.existsSync(files[`voice-${key}`])) } : null;
}
/** Answer the robot CDN with stand-ins. mode: 'play' (default), 'h264' (the
 *  clips are H.264, which this Chromium cannot decode), 'poster404' (the
 *  stills are gone), 'video404' (the clips are gone), 'block' (the CDN is
 *  unreachable, as from this container). Options: posterDelay ms. */
async function routeRobot(context, mode = 'play', { posterDelay = 0 } = {}) {
  await context.route(url => url.hostname === ROBOT_HOST, async route => {
    const url = route.request().url();
    if (mode === 'block') return route.abort('connectionrefused');
    const image = /\.webp$/.test(url);
    if (!robotMedia) return route.fulfill({ status: 404, body: '' });
    if (image) {
      if (mode === 'poster404') return route.fulfill({ status: 404, body: '' });
      if (posterDelay) await new Promise(resolve => setTimeout(resolve, posterDelay));
      return route.fulfill({ path: /0df9aeb7/.test(url) ? robotMedia.orb : robotMedia.still, contentType: 'image/webp', headers: { 'cache-control': 'no-store' } });
    }
    if (/\.wav$/.test(url)) {
      robotLog.push(url.split('/').pop());
      const line = /2fd4c0cf/.test(url) ? 'intro' : /282d86e6/.test(url) ? 'yes' : /737260d3/.test(url) ? 'hello' : /a2c7efb9/.test(url) ? 'thanks' : null;
      if (!line || !robotMedia.voice) return route.fulfill({ status: 404, body: '' });
      return route.fulfill({ path: robotMedia[`voice-${line}`], contentType: 'audio/wav', headers: { 'accept-ranges': 'bytes', 'cache-control': 'public, max-age=31536000, immutable' } });
    }
    if (mode === 'video404') return route.fulfill({ status: 404, body: '' });
    const file = mode === 'h264' ? robotMedia.h264 : /99e661a7/.test(url) ? robotMedia.transform : /df410d0c/.test(url) ? robotMedia.ask : /0d5a7893/.test(url) ? robotMedia.wave : /86ab53ef/.test(url) ? robotMedia.heart : robotMedia.look;
    robotLog.push(url.split('/').pop());
    if (!file) return route.fulfill({ status: 404, body: '' });
    // Like the CDN: byte ranges, so the gate can seek the clip.
    const body = require('node:fs').readFileSync(file);
    const range = /bytes=(\d*)-(\d*)/.exec(route.request().headers().range || '');
    const headers = { 'accept-ranges': 'bytes', 'cache-control': 'public, max-age=31536000, immutable' };
    if (!range) return route.fulfill({ status: 200, body, contentType: 'video/mp4', headers });
    const start = range[1] ? Number(range[1]) : Math.max(0, body.length - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
    return route.fulfill({ status: 206, body: body.subarray(start, end + 1), contentType: 'video/mp4', headers: { ...headers, 'content-range': `bytes ${start}-${end}/${body.length}` } });
  });
}
/** Every robot clip a context requested (file names), for the on-demand checks. */
const robotLog = [];
/** Later homepage views: the intro has already played in this session. */
/* v9.1: the intro plays on every fresh open or reload, not when the homepage
   is reached from another page of the site: "seen" = arrived from inside. */
const introSeen = context => context.addInitScript(() => { try { Object.defineProperty(Document.prototype, 'referrer', { configurable: true, get: () => `${location.origin}/work.html` }); } catch { /* ignore */ } });

const only = process.env.QA_ONLY ? new RegExp(process.env.QA_ONLY, 'i') : null; // e.g. QA_ONLY=orbit
/* Contexts a check opened: a failing check must not leave pages running
   (their loops and videos would slow every later timing check). */
const openContexts = new Set();
async function check(name, run) {
  if (only && !only.test(name)) return;
  const before = new Set(openContexts);
  try { await run(); results.push({ name, status: 'pass' }); }
  catch (error) {
    // Keep the assertion's diff (deep-equal failures say what differed).
    const message = error.message.split('\n').map(line => line.trim()).filter(line => line && !/^(\+ actual|- expected)/.test(line)).join(' ').slice(0, 700);
    results.push({ name, status: 'fail', message }); console.error('FAIL', name, '-', message);
  } finally {
    for (const context of [...openContexts]) if (!before.has(context)) await context.close().catch(() => {});
  }
}
/* v9 capability tier (Base.astro head script): every check runs as a
   capable device (8 cores, 8 GB) unless it asks for device 'low' (4 cores,
   2 GB: the lite tier) or 'native' (whatever this machine reports). */
const emulateDevice = (context, device) => device === 'native' ? null : context.addInitScript(low => {
  Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { configurable: true, get: () => (low ? 2 : 8) });
  Object.defineProperty(Navigator.prototype, 'deviceMemory', { configurable: true, get: () => (low ? 2 : 8) });
}, device === 'low');
async function isolated(browser, { intro = false, device = 'capable', ...options } = {}, robot = 'play') {
  const context = await browser.newContext({ reducedMotion: 'reduce', ...options });
  openContexts.add(context);
  context.on('close', () => openContexts.delete(context));
  await emulateDevice(context, device);
  // Every check runs as a later homepage view unless it asks for the intro.
  if (!intro) await introSeen(context);
  await context.route('**/*', route => {
    const request = route.request();
    if (new URL(request.url()).origin !== origin || !['GET', 'HEAD'].includes(request.method())) {
      outbound.push({ url: request.url(), method: request.method() });
      return route.abort();
    }
    return route.continue();
  });
  // Registered last, so it is consulted first: the robot CDN gets stand-ins.
  await routeRobot(context, robot);
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
  prepareRobotMedia();
  results.push({ name: 'robot stand-ins', status: 'info', message: robotMedia ? `${robotDir} (h264: ${robotMedia.h264 ? 'yes' : 'no'})` : 'unavailable: robot playback checks are skipped' });
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
  const gateScenario = async ({ label, reducedMotion, width }) => {
    const context = await isolated(browser, { reducedMotion, viewport: { width, height: 900 } });
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
    // opaque 550ms after a door is chosen (160ms with reduced motion), frame-rate
    // independent. Wall-clock click → pagehide is only a stall guard: headless
    // Chromium composites the hero in software at ~15fps, so every frame-bound
    // step (finished promises, the two frames before navigating) runs late.
    const tl = JSON.parse(await page.evaluate(() => sessionStorage.getItem('qa-tl')) || '{}');
    const still = reducedMotion === 'reduce';
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
  ]) await check(`light gate ${scenario.label}: opaque white leaving, white at first paint, revealed ≤ 1.5 s`, async () => {
    // Wall-clock timings in headless Chromium are noisy: one retry, and the
    // retry is reported, so a real regression still fails twice.
    try { await gateScenario(scenario); }
    catch (error) { results.push({ name: `light gate ${scenario.label} retry`, status: 'info', message: error.message.slice(0, 200) }); await gateScenario(scenario); }
  });

  /* The robot's open clip (Higgsfield's CDN, answered here by the stand-in):
     it must start on the parked frame, and the page must be fully white when
     it is hidden. */
  await check('light gate robot clip: LOOK plays from the palms-together moment, white ≥ 0.99 at pagehide, within the click → pagehide budget', async () => {
    if (!robotMedia) { results.push({ name: 'robot clip', status: 'skipped', message: 'no stand-in media' }); return; }
    const context = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => addEventListener('pagehide', () => {
      const gate = document.querySelector('[data-gate]');
      try { sessionStorage.setItem('qa-clip', JSON.stringify({ t: Date.now(), white: Number(getComputedStyle(gate.querySelector('.gate__white')).opacity), clipOn: gate.hasAttribute('data-clip-on') })); } catch {}
    }));
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    assert.equal(await page.locator('[data-gate-clip]').count(), 1, 'the gate carries the open clip');
    await page.hover('.doors a[href="/work.html"]');
    await page.waitForFunction(() => { const v = document.querySelector('[data-gate-clip]'); return v.readyState >= 3 && Math.abs(v.currentTime - Math.min(Number(v.dataset.seek), v.duration - Number(v.dataset.play) / 1000 - .1)) < .15; }, null, { timeout: 5000 });
    const clicked = Date.now();
    await Promise.all([page.waitForURL(/work\.html$/), page.evaluate(() => document.querySelector('.doors a[href="/work.html"]').click())]);
    const state = JSON.parse(await page.evaluate(() => sessionStorage.getItem('qa-clip')));
    const leaveMs = state.t - clicked;
    assert.ok(state.clipOn, 'the clip played');
    assert.ok(leaveMs > 0 && leaveMs <= 900 + GATE_TOL, `click → pagehide within 900ms + ${GATE_TOL}ms with the clip (${leaveMs}ms)`);
    results.push({ name: 'gate robot clip timing', status: 'info', message: `${leaveMs}ms click → pagehide` });
    assert.ok(state.white >= .99, `white at pagehide ${state.white}`);
    await context.close();
  });

  await check('light gate: ordinary links use the quick gate; PDFs, mail and new tabs are untouched; back from bfcache is never white', async () => {
    // Playwright disables the back/forward cache by default; this browser keeps
    // it, so Back really restores the page that left through the gate.
    const bfBrowser = await chromium.launch({ executablePath, ignoreDefaultArgs: ['--disable-back-forward-cache'] });
    const context = await bfBrowser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } });
    await introSeen(context);
    await routeRobot(context);
    await context.addInitScript(() => addEventListener('pageshow', event => { window.__persisted = event.persisted; }));
    await context.addInitScript(() => document.addEventListener('play', event => { if (event.target.matches?.('[data-robot-video]')) window.__robotPlays = (window.__robotPlays || 0) + 1; }, true));
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    const playsBefore = await page.evaluate(() => window.__robotPlays || 0);
    await Promise.all([page.waitForURL(/research\.html$/), page.click('#site-nav a[href="/research.html"]')]);
    assert.equal(await page.evaluate(() => document.documentElement.dataset.gate), 'in');
    await page.waitForTimeout(300);
    await page.goBack({ waitUntil: 'commit' });
    await page.waitForFunction(() => window.__persisted !== undefined, null, { timeout: 3000 });
    assert.equal(await page.evaluate(() => window.__persisted), true, 'Back restored the page from the bfcache');
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => window.__robotPlays || 0), playsBefore, 'the robot does not autoplay after a bfcache restore');
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

  /* 6. No Pause control (removed at the user's request, Oct 2026): the
     visitor's prefers-reduced-motion is the motion opt-out, and it must stop
     every loop and every scroll-driven effect. Contact is one tap away. */
  const loops = page => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).map(a => `${a.animationName} on ${a.effect.target?.className?.baseVal ?? a.effect.target?.className}`));
  /* The hero robot: it greets on every open, holds the last frame, replays on
     "Say hi", turns toward the pointer, and degrades to the poster (and the
     poster to the orb) without breaking. */
  const countPlays = context => context.addInitScript(() => document.addEventListener('play', event => { if (event.target.matches?.('[data-robot-video]')) { window.__robotPlays = (window.__robotPlays || 0) + 1; (window.__robotMoves ||= []).push(event.target.dataset.robotVideo); } }, true));
  /* v9: "Say hi" cycles WAVE → HEART → LOOK; `video` is the clip of the
     current (or last) move, `src` every clip fetched so far. */
  const robotState = page => page.evaluate(() => {
    const stage = document.querySelector('[data-robot-stage]'), videos = [...stage.querySelectorAll('[data-robot-video]')], img = stage.querySelector('.robot__poster'), orb = stage.querySelector('[data-orb]');
    const video = videos.find(v => v.dataset.robotVideo === stage.dataset.move) ?? videos[0];
    return { poster: stage.dataset.poster, video: stage.dataset.video, greet: stage.dataset.greet, move: stage.dataset.move ?? null, moves: window.__robotMoves || [], plays: window.__robotPlays || 0, paused: video.paused, t: video.currentTime, duration: video.duration, src: videos.map(v => v.currentSrc).join(''),
      still: stage.dataset.still, stillOpacity: Math.max(Number(getComputedStyle(img).opacity), Number(getComputedStyle(stage.querySelector('.robot__still') ?? img).opacity)), mediaOpacity: Number(getComputedStyle(stage.querySelector('.robot-stage__media')).opacity), orbVisible: getComputedStyle(orb).visibility === 'visible' && Number(getComputedStyle(orb).opacity) > .9 };
  });
  const greetDone = (page, timeout = 12000) => page.waitForFunction(() => document.querySelector('[data-robot-stage]').dataset.greet === 'done', null, { timeout });

  await check('robot: the ROBOT still <img> has intrinsic width/height, sits behind a real "Say hi to Otto" button, and causes no layout shift', async () => {
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const context = await isolated(browser, { viewport, reducedMotion: 'no-preference' });
      await context.addInitScript(() => { window.__shifts = []; new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__shifts.push({ value: entry.value, nodes: entry.sources.map(source => source.node?.className ?? '') }); }).observe({ type: 'layout-shift', buffered: true }); });
      const page = await context.newPage();
      await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const info = await page.evaluate(() => {
        const img = document.querySelector('.robot__poster'), button = document.querySelector('[data-robot-hi]'), stage = document.querySelector('[data-robot-stage]').getBoundingClientRect();
        const still = document.querySelector('.robot__still')?.getBoundingClientRect(), shown = img.getBoundingClientRect();
        return { painted: !!still && Math.abs(still.width - shown.width) < 2 && Math.abs(still.height - shown.height) < 2 && Math.abs(still.left - shown.left) < 2, stillOpacity: Number(getComputedStyle(document.querySelector('.robot__still') ?? img).opacity), w: img.getAttribute('width'), h: img.getAttribute('height'), decoding: img.decoding, src: img.getAttribute('src'), tag: button.tagName, type: button.type, name: button.getAttribute('aria-label'), mediaHidden: document.querySelector('.robot-stage__media').getAttribute('aria-hidden'), stage: { w: stage.width, h: stage.height }, shifts: window.__shifts, intro: !!document.querySelector('[data-intro]'), replay: !document.querySelector('[data-intro-replay]').hidden };
      });
      assert.ok(info.painted && info.stillOpacity > .99, `the still is painted over exactly the <img> box (${info.painted}, ${info.stillOpacity})`);
      assert.equal(info.w, '1344'); assert.equal(info.h, '752'); assert.equal(info.decoding, 'async');
      assert.match(info.src, /^https:\/\/d8j0ntlcm91z4\.cloudfront\.net\/.+69dabef2-b785-4918-bc7a-1b0cf9704c6f_min\.webp$/, 'the ROBOT still from the CDN (src/data/robot.ts)');
      assert.equal(info.tag, 'BUTTON'); assert.equal(info.type, 'button'); assert.equal(info.name, 'Say hi to Otto, Omar’s robot');
      assert.equal(info.mediaHidden, 'true', 'the media are aria-hidden');
      assert.ok(!info.intro, 'a later homepage view has no intro');
      assert.ok(info.replay, '"Replay intro" is offered');
      assert.ok(info.stage.w > viewport.width * .7 && info.stage.h > 250, `the robot is big (${JSON.stringify(info.stage)})`);
      const robotShift = info.shifts.filter(shift => shift.nodes.some(name => /robot|orb|hero__robot/.test(name)));
      assert.deepEqual(robotShift, [], `no layout shift from the robot at ${viewport.width}px`);
      await context.close();
    }
  });

  await check('robot: no autoplay; "Say hi" (click and keyboard) cycles WAVE → HEART → LOOK (held facing you); WAVE and HEART return to the still; forced-colors focus ring', async () => {
    if (!robotMedia) { results.push({ name: 'robot moves', status: 'skipped', message: 'no stand-in media' }); return; }
    const context = await isolated(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    await countPlays(context);
    const page = await context.newPage();
    const errors = watch(page);
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const idle = await robotState(page);
    assert.equal(idle.plays, 0, 'nothing plays on its own'); assert.equal(idle.src, '', 'no clip is fetched until asked');
    assert.equal(await page.evaluate(() => document.querySelector('[data-robot-stage]').dataset.moves), 'heart wave look', 'his moves, in turn (v9.1: the heart first)');
    for (const move of ['heart', 'wave']) {
      await page.click('[data-robot-hi]');
      await page.waitForFunction(name => { const s = document.querySelector('[data-robot-stage]'); return s.dataset.move === name && s.dataset.greet === 'playing' && s.dataset.video === 'on'; }, move, { timeout: 5000 });
      assert.equal(await page.evaluate(() => document.querySelector('[data-robot-said]').textContent), move === 'wave' ? 'Otto waves hello.' : 'Otto makes a heart with his hands.', `${move}: announced`);
      await greetDone(page);
      await page.waitForTimeout(300);
      const after = await robotState(page);
      assert.ok(after.move === move && after.video === 'off' && after.stillOpacity > .99, `${move} played to its end and he is back on the still (${JSON.stringify(after)})`);
    }
    await page.locator('.hero__ctas .btn--ghost').focus();
    await page.keyboard.press('Tab');
    assert.ok(await page.evaluate(() => document.activeElement?.hasAttribute('data-robot-hi')), 'Tab after the hero CTAs reaches the robot button');
    await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('.robot-stage__focus')).opacity) > .9, null, { timeout: 2000 }).catch(() => {});
    const ring = await page.locator('.robot-stage__focus').evaluate(el => ({ opacity: Number(getComputedStyle(el).opacity), visible: document.activeElement.matches(':focus-visible') }));
    assert.ok(ring.visible && ring.opacity > .9, `keyboard focus shows the HUD frame (${JSON.stringify(ring)})`);
    await page.emulateMedia({ forcedColors: 'active' });
    const forced = await page.evaluate(() => { const style = getComputedStyle(document.activeElement); return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) }; });
    assert.ok(forced.style === 'solid' && forced.width >= 2, `forced colours: a real outline (${JSON.stringify(forced)})`);
    await page.emulateMedia({ forcedColors: 'none' });
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => { const s = document.querySelector('[data-robot-stage]'); return s.dataset.move === 'look' && s.dataset.greet === 'playing'; }, null, { timeout: 5000 });
    await greetDone(page);
    const held = await robotState(page);
    assert.equal(held.move, 'look');
    assert.ok(held.paused && held.t >= 1.5 && held.t < 2.1, `LOOK held on the frame where he faces you (${held.t})`);
    assert.equal(held.video, 'on', 'the held frame stays on screen');
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => (window.__robotPlays || 0) >= 4, null, { timeout: 4000 });
    await greetDone(page);
    await page.waitForTimeout(800);
    const last = await robotState(page);
    assert.deepEqual(last.moves, ['heart', 'wave', 'look', 'heart'], 'the cycle starts again after LOOK');
    assert.equal(last.plays, 4, 'no extra plays');
    assert.deepEqual(errors, []);
    await context.close();
  });

  await check('robot: turns toward the pointer (spring) with a following light, without a layout read per move', async () => {
    const context = await isolated(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.mouse.move(1400, 200);
    await page.mouse.move(1420, 210, { steps: 4 });
    await page.waitForTimeout(900);
    const tilt = await page.evaluate(() => ({ ry: Number(getComputedStyle(document.querySelector('[data-robot-tilt]')).getPropertyValue('--ry')), pointer: document.querySelector('[data-robot-stage]').hasAttribute('data-pointer') }));
    assert.ok(tilt.ry > 1 && tilt.pointer, `turned toward a pointer on its right (${JSON.stringify(tilt)})`);
    await page.mouse.move(200, 400, { steps: 4 });
    await page.waitForTimeout(900);
    assert.ok(Number(await page.evaluate(() => getComputedStyle(document.querySelector('[data-robot-tilt]')).getPropertyValue('--ry'))) < -1, 'and toward a pointer on its left');
    await context.close();
  });

  await check('robot: touch devices get the ambient sway (no pointer tilt) and tap to look', async () => {
    if (!robotMedia) return;
    const context = await isolated(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
    await countPlays(context);
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    assert.ok((await loops(page)).some(name => /robot-sway/.test(name)), 'ambient sway runs');
    await page.tap('[data-robot-hi]');
    await page.waitForFunction(() => (window.__robotPlays || 0) >= 1, null, { timeout: 4000 });
    await greetDone(page);
    await context.close();
  });

  for (const [label, options, init] of [
    ['reduced motion', { reducedMotion: 'reduce' }, null],
    ['Save-Data', { reducedMotion: 'no-preference' }, () => Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => ({ saveData: true }) })],
  ]) {
    await check(`robot (${label}): still only, nothing fetched or played until the visitor presses "Say hi"`, async () => {
      const context = await isolated(browser, { viewport: { width: 1440, height: 900 }, ...options });
      if (init) await context.addInitScript(init);
      await countPlays(context);
      const page = await context.newPage();
      await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      const still = await robotState(page);
      assert.equal(still.greet, 'still'); assert.equal(still.plays, 0, 'no autoplay'); assert.equal(still.src, '', 'clip not fetched');
      assert.equal(still.poster, 'ok'); assert.equal(still.still, 'canvas', 'still painted'); assert.ok(still.stillOpacity > .99, 'still shown');
      if (!robotMedia) return context.close();
      await page.click('[data-robot-hi]');
      await page.waitForFunction(() => (window.__robotPlays || 0) >= 1, null, { timeout: 5000 });
      await greetDone(page);
      await context.close();
    });
  }

  await check('robot: H.264 unsupported or the clip gone → the still stays and "Say hi" and the tilt still work', async () => {
    for (const mode of [robotMedia?.h264 ? 'h264' : null, 'video404'].filter(Boolean)) {
      const context = await isolated(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' }, mode);
      const page = await context.newPage();
      const errors = watch(page);
      await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
      await page.click('[data-robot-hi]');
      await page.waitForFunction(() => document.querySelector('[data-robot-stage]').dataset.greet === 'failed', null, { timeout: 8000 });
      await page.waitForTimeout(800);
      const state = await robotState(page);
      assert.equal(state.video, 'off', `${mode}: video hidden`);
      assert.ok(state.stillOpacity > .99 && state.mediaOpacity > .99 && !state.orbVisible, `${mode}: still stays (${JSON.stringify(state)})`);
      await page.click('[data-robot-hi]');
      assert.ok(await page.evaluate(() => document.querySelector('[data-robot-stage]').hasAttribute('data-hi')), `${mode}: the press is acknowledged`);
      await page.mouse.move(1400, 200); await page.mouse.move(1420, 220, { steps: 3 });
      await page.waitForTimeout(800);
      assert.ok(Number(await page.evaluate(() => getComputedStyle(document.querySelector('[data-robot-tilt]')).getPropertyValue('--ry'))) > 1, `${mode}: still turns toward the pointer`);
      assert.deepEqual(errors.filter(line => !(mode === 'video404' && /^404 .*\.mp4$/.test(line)) && !/Failed to load resource.*404/.test(line)), [], `${mode}: no errors`);
      await context.close();
    }
  });

  await check('robot: still gone (CDN down) → the abstract orb fallback shows, "Say hi" flares it and fetches nothing', async () => {
    const context = await isolated(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' }, 'poster404');
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('[data-robot-stage]').dataset.poster === 'failed', null, { timeout: 5000 });
    await page.waitForTimeout(800);
    const state = await robotState(page);
    assert.ok(state.orbVisible, 'orb visible');
    assert.ok(state.mediaOpacity < .01, 'no broken still shown');
    await page.click('[data-robot-hi]');
    await page.waitForTimeout(400);
    const after = await robotState(page);
    assert.equal(after.src, '', 'no clip fetched behind the orb');
    assert.ok(await page.evaluate(() => document.querySelector('[data-robot-stage]').hasAttribute('data-hi')), 'the press flares the orb');
    await context.close();
  });

  /* The homepage intro (v8, v9): the orb becomes Otto, who turns to you and
     asks "Do you want to see his work?" (the ASK clip presents it), Yes
     opens the homepage through the light. */
  const introState = page => page.evaluate(() => {
    const intro = document.querySelector('[data-intro]');
    return { present: !!intro, shown: !!intro && getComputedStyle(intro).display !== 'none', stage: intro?.dataset.stage, path: intro?.dataset.path, asked: intro?.hasAttribute('data-asked'), html: document.documentElement.dataset.introOn ?? null, inert: document.querySelector('main').inert, active: document.activeElement?.id || document.activeElement?.getAttribute('data-intro-yes') !== null && 'yes' || document.activeElement?.tagName, live: document.querySelector('[data-intro-live]')?.textContent ?? '', look: document.querySelector('[data-intro-look]')?.currentSrc ?? '', transform: document.querySelector('[data-intro-transform]')?.currentSrc ?? '', ask: document.querySelector('[data-intro-ask]')?.currentSrc ?? '', clip: intro?.dataset.clip ?? null, tier: document.documentElement.dataset.tier };
  });
  const asked = (page, timeout) => page.waitForFunction(() => document.querySelector('[data-intro]')?.hasAttribute('data-asked'), null, { timeout });
  const introGone = (page, timeout) => page.waitForFunction(() => !document.querySelector('[data-intro]') && document.documentElement.dataset.introOn === undefined, null, { timeout });

  await check('intro: first homepage view plays it (transform → ASK: he turns to you and presents the question); Yes cross-fades into LOOK and opens the homepage through the light; focus, no shift; second view none; Replay intro replays', async () => {
    if (!robotMedia) { results.push({ name: 'intro video path', status: 'skipped', message: 'no stand-in media' }); return; }
    const context = await isolated(browser, { intro: true, viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    await context.addInitScript(() => { window.__shift = 0; new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__shift += entry.value; }).observe({ type: 'layout-shift', buffered: true }); });
    // When the question appears, where is ASK? (It is timed to his open palm.)
    // Also: the speech box only with its first letter (never an empty box
    // while he turns), the ring glow only once he holds still, and Yes's
    // flare (the cut from ASK into LOOK under its peak).
    await context.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { const intro = document.querySelector('[data-intro]'); window.__flares = []; if (intro) new MutationObserver(() => {
      if (intro.hasAttribute('data-asked') && window.__askedAt === undefined) { window.__askedAt = document.querySelector('[data-intro-ask]')?.currentTime ?? -1; window.__ringAtAsk = Number(getComputedStyle(intro.querySelector('.intro__ring')).opacity); }
      if (intro.hasAttribute('data-asking') && window.__askingTyped === undefined) window.__askingTyped = { typed: intro.querySelector('[data-intro-say]').textContent.length, at: document.querySelector('[data-intro-ask]')?.currentTime ?? -1 };
      if (intro.dataset.flare && window.__flares.at(-1) !== intro.dataset.flare) window.__flares.push(intro.dataset.flare);
    }).observe(intro, { attributes: true }); }));
    const page = await context.newPage();
    const errors = watch(page);
    await page.goto(`${base}/index.html`);
    const first = await introState(page);
    assert.ok(first.shown && first.html === '' && first.inert, `intro on, page underneath inert (${JSON.stringify(first)})`);
    assert.ok(await page.locator('[data-intro-skip]').isVisible(), 'Skip intro visible from the start');
    await page.waitForFunction(() => ['transform', 'look', 'ask'].includes(document.querySelector('[data-intro]')?.dataset.stage), null, { timeout: 5000 });
    await asked(page, 14000);
    const ask = await introState(page);
    assert.equal(ask.path, 'video', 'the clips played');
    assert.equal(ask.clip, 'ask', 'he asks with the ASK clip');
    assert.match(ask.ask, /df410d0c/, 'ASK was fetched once the transform played');
    assert.equal(ask.active, 'yes', 'focus on "Yes, show me"');
    assert.match(ask.live, /Hi — I’m Otto, Omar’s robot\. Do you want to see his work\?/, 'question announced');
    const askedAt = await page.evaluate(() => window.__askedAt);
    assert.ok(askedAt >= 1.9 && askedAt < 2.9, `the question appears as his palm presents it (ASK at ${askedAt} s)`);
    const asking = await page.evaluate(() => window.__askingTyped);
    assert.ok(asking && asking.typed >= 1 && asking.at >= .9, `the speech box appears with its first letter, as he faces you (${JSON.stringify(asking)})`);
    assert.ok((await page.evaluate(() => window.__ringAtAsk)) < .05, 'no ring glow while he moves (the real ring is elsewhere)');
    // The camera pans with ASK so his open palm (frame x 7–22%) is on screen
    // beside the copy, and the copy stays clear of his helmet (ASK: x ≥ 45%).
    await page.waitForTimeout(1500);
    const pan = await page.evaluate(() => { const f = document.querySelector('.intro__frame').getBoundingClientRect(), q = document.querySelector('#intro-q').getBoundingClientRect(); return { palm: f.left + f.width * .07, head: f.left + f.width * .45, q: q.right }; });
    assert.ok(pan.palm >= 0 && pan.q <= pan.head + 4, `palm on screen, question clear of his helmet (${JSON.stringify(pan)})`);
    // He finishes the gesture and holds, facing you; LOOK waits, parked where Yes continues.
    await page.waitForFunction(() => { const intro = document.querySelector('[data-intro]'), v = document.querySelector('[data-intro-ask]'); return v.ended && !intro.hasAttribute('data-moving'); }, null, { timeout: 6000 });
    await page.waitForFunction(() => Math.abs(document.querySelector('[data-intro-look]').currentTime - 2.3) < .1, null, { timeout: 4000 });
    assert.match((await introState(page)).look, /37408964/, 'LOOK fetched once ASK played');
    const before = await page.evaluate(() => window.__shift);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => document.querySelector('[data-intro]')?.dataset.stage === 'go', null, { timeout: 2000 });
    await page.waitForFunction(() => window.__flares.includes('down'), null, { timeout: 3000 });
    assert.deepEqual(await page.evaluate(() => window.__flares), ['up', 'down'], 'Yes from ASK: the flare rises, LOOK cuts in under it, the flare falls');
    await page.waitForFunction(() => !document.querySelector('[data-intro]') || document.querySelector('[data-intro-look]').currentTime > 2.5, null, { timeout: 3000 });
    await introGone(page, 6000);
    const after = await introState(page);
    assert.ok(!after.inert, 'the homepage is interactive again');
    assert.equal(after.active, 'main', 'focus moved to the main content');
    await page.waitForTimeout(1200);
    assert.ok(await page.locator('#hero-title').isVisible(), 'the hero is there');
    assert.ok(await page.evaluate(() => Number(getComputedStyle(document.querySelector('.hero__word > span')).opacity) > .99 && !document.querySelector('[data-gate]').dataset.state), 'hero shown, the light gone');
    assert.ok((await page.evaluate(() => window.__shift)) - before <= .01, 'no layout shift when the intro is removed');
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle', referer: `${base}/work.html` });
    assert.ok(!(await introState(page)).present, 'no intro when the homepage is reached from another page of the site');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.dataset.introOn === '' && !!document.querySelector('[data-intro]'), null, { timeout: 5000 });
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle', referer: `${base}/work.html` });
    await page.locator('[data-intro-replay]').click({ force: true }); // the robot breathes: never "stable"
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => document.documentElement.dataset.introOn === '' && !!document.querySelector('[data-intro]'), null, { timeout: 5000 });
    assert.deepEqual(errors, []);
    await context.close();
  });

  await check('intro: Skip intro, Esc and Contact Omar', async () => {
    const context = await isolated(browser, { intro: true, viewport: { width: 390, height: 844 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`);
    await page.waitForTimeout(400);
    await page.click('[data-intro-skip]');
    await introGone(page, 1000);
    assert.equal((await introState(page)).active, 'main');
    const second = await context.newPage(); // a new tab: a new session
    await second.goto(`${base}/index.html`);
    await second.waitForTimeout(400);
    await second.keyboard.press('Escape');
    await introGone(second, 1000);
    const third = await context.newPage();
    await third.goto(`${base}/index.html`);
    await Promise.all([third.waitForURL(/contact\.html$/, { timeout: 4000 }), third.click('.intro__bar a[href="/contact.html"]')]);
    await context.close();
  });

  // Save-Data makes the lite tier (v9): its CSS path, no clips.
  for (const [label, options, mode, limit, path] of [['reduced motion', { reducedMotion: 'reduce' }, 'play', 1500, 'still'], ['CDN blocked', { reducedMotion: 'no-preference' }, 'block', 3000, 'still'], ['Save-Data', { reducedMotion: 'no-preference' }, 'play', 5000, 'lite']]) {
    await check(`intro (${label}): no clips, the ${path} path with the question within ${limit / 1000} s; Yes opens the homepage`, async () => {
      const context = await isolated(browser, { intro: true, viewport: { width: 390, height: 844 }, ...options }, mode);
      if (label === 'Save-Data') await context.addInitScript(() => Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => ({ saveData: true }) }));
      const page = await context.newPage();
      const started = Date.now();
      await page.goto(`${base}/index.html`);
      await asked(page, limit);
      const ask = await introState(page);
      assert.ok(Date.now() - started <= limit + 800, `asked after ${Date.now() - started}ms`);
      assert.equal(ask.path, path);
      if (label !== 'CDN blocked') assert.ok(!ask.look && !ask.transform && !ask.ask, `no clip fetched (${ask.look} ${ask.transform} ${ask.ask})`);
      assert.equal(ask.active, 'yes');
      await page.click('[data-intro-yes]');
      await introGone(page, label === 'reduced motion' ? 800 : 2500);
      assert.ok(await page.locator('#hero-title').isVisible());
      await context.close();
    });
  }

  await check('intro: no JavaScript → no intro at all', async () => {
    const context = await isolated(browser, { intro: true, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('[data-intro]')).display), 'none');
    assert.ok(await page.locator('h1#hero-title').isVisible());
    await context.close();
  });

  if (axePath) for (const width of [390, 1280]) await check(`axe: the intro question at ${width}px`, async () => {
    const context = await isolated(browser, { intro: true, viewport: { width, height: width < 600 ? 844 : 800 }, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`);
    await asked(page, 3000);
    await page.waitForTimeout(700);
    await page.addScriptTag({ path: axePath });
    const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(', ')}`));
    assert.deepEqual(violations, []);
    assert.deepEqual(await pixelContrast(page, ['#intro-q', '.intro__say-typed', '[data-intro-status]', '.intro__link--skip']), [], 'intro text contrast');
    await context.close();
  });

  /* v10: Otto's voice (opt-in, default off; scripts/voice.ts). Stand-in tones. */
  const wavs = () => robotLog.filter(name => /\.wav$/.test(name));
  const audioState = (page, line) => page.evaluate(name => { const a = document.querySelector(`audio[data-voice-line="${name}"]`); return a ? { src: a.currentSrc, paused: a.paused, t: a.currentTime, played: a.played.length, volume: a.volume, muted: a.muted } : null; }, line);
  const playedLine = (page, line, timeout = 4000) => page.waitForFunction(name => { const a = document.querySelector(`audio[data-voice-line="${name}"]`); return a && !a.muted && (a.currentTime > .15 || a.ended); }, line, { timeout });
  await check('voice: default off and nothing fetched on load; turning Sound on in the intro fetches and plays INTRO at once (the question is showing), Yes plays YES over the gate; the choice is remembered for the session; never two lines at once', async () => {
    if (!robotMedia?.voice) { results.push({ name: 'voice', status: 'skipped', message: 'no stand-in voice' }); return; }
    robotLog.length = 0;
    const context = await isolated(browser, { intro: true, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = watch(page);
    await page.goto(`${base}/index.html`);
    await asked(page, 3000);
    await page.waitForTimeout(600);
    const toggle = page.locator('.intro__bar [data-sound-toggle]');
    assert.ok(await toggle.isVisible(), 'the Sound switch is in the intro bar');
    assert.equal(await toggle.getAttribute('aria-pressed'), 'false', 'default off');
    assert.equal(await toggle.evaluate(el => el.textContent.trim()), 'Sound');
    assert.ok((await toggle.boundingBox()).height >= 44, 'a 44 px tap target');
    assert.deepEqual(wavs(), [], 'no voice line requested on load');
    assert.ok(await page.evaluate(() => [...document.querySelectorAll('audio[data-voice-line]')].every(a => a.preload === 'none' && !a.currentSrc)), 'preload="none", no source until Sound is on');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-pressed'), 'true');
    await playedLine(page, 'intro');
    assert.ok(wavs().some(name => /2fd4c0cf/.test(name)), `INTRO fetched (${wavs()})`);
    assert.equal(await page.evaluate(() => sessionStorage.getItem('omar-sound')), '1', 'remembered for the session');
    const introVolume = (await audioState(page, 'intro')).volume;
    assert.ok(introVolume > .3 && introVolume <= .81, `volume ≈ 0.8 after its fade in (${introVolume})`);
    await page.click('[data-intro-yes]');
    await playedLine(page, 'yes');
    const both = await page.evaluate(() => [...document.querySelectorAll('audio[data-voice-line]')].filter(a => !a.paused && !a.muted && a.volume > .05).length);
    assert.ok(both <= 1, `one line at a time (${both} playing)`);
    await introGone(page, 2000);
    assert.equal(await page.locator('.robot-stage__sound').getAttribute('aria-pressed'), 'true', 'the hero switch shows Sound on');
    await page.reload();
    assert.equal(await page.locator('.robot-stage__sound').getAttribute('aria-pressed'), 'true', 'still on after a reload (same session)');
    assert.deepEqual(errors, []);
    await context.close();
  });

  await check('voice: with Sound on, pressing Otto plays HELLO with WAVE and THANKS with HEART, each captioned by his head (aria-live) for the line; LOOK says nothing; Sound off → no line, no caption, nothing fetched', async () => {
    if (!robotMedia?.voice) { results.push({ name: 'voice hero', status: 'skipped', message: 'no stand-in voice' }); return; }
    robotLog.length = 0;
    const context = await isolated(browser, { viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const errors = watch(page);
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    const stage = '[data-robot-stage]';
    // Off: a press plays WAVE silently.
    await page.locator('[data-robot-hi]').click({ force: true });
    await page.waitForFunction(s => document.querySelector(s).dataset.greet === 'playing', stage, { timeout: 5000 });
    assert.deepEqual(wavs(), [], 'Sound off: no line fetched');
    assert.equal(await page.locator('[data-robot-caption]').textContent(), '', 'Sound off: no caption');
    await page.waitForFunction(s => document.querySelector(s).dataset.greet === 'done', stage, { timeout: 9000 });
    // On (the hero chip), then HEART → THANKS.
    const chip = page.locator('.robot-stage__sound');
    assert.equal(await chip.getAttribute('aria-pressed'), 'false');
    await chip.click();
    assert.equal(await chip.getAttribute('aria-pressed'), 'true');
    await page.locator('[data-robot-hi]').click({ force: true });
    await playedLine(page, 'thanks');
    const caption = await page.evaluate(() => { const c = document.querySelector('[data-robot-caption]'); return { text: c.textContent, live: c.getAttribute('aria-live'), shown: c.hasAttribute('data-show') }; });
    assert.deepEqual(caption, { text: 'Thanks for stopping by!', live: 'polite', shown: true }, 'THANKS captioned');
    assert.equal(await page.evaluate(s => document.querySelector(s).dataset.move, stage), 'heart');
    await page.waitForFunction(() => !document.querySelector('[data-robot-caption]').hasAttribute('data-show'), null, { timeout: 5000 });
    await page.waitForFunction(s => document.querySelector(s).dataset.greet === 'done', stage, { timeout: 9000 });
    // LOOK: no line.
    const before = wavs().length;
    await page.locator('[data-robot-hi]').click({ force: true });
    await page.waitForFunction(s => document.querySelector(s).dataset.move === 'look', stage, { timeout: 3000 });
    await page.waitForTimeout(500);
    assert.equal(wavs().length, before, 'LOOK: no line');
    assert.ok(!(await page.evaluate(() => document.querySelector('[data-robot-caption]').hasAttribute('data-show'))), 'LOOK: no caption');
    await page.waitForFunction(s => document.querySelector(s).dataset.greet === 'done', stage, { timeout: 6000 });
    // WAVE → HELLO.
    await page.locator('[data-robot-hi]').click({ force: true });
    await playedLine(page, 'hello');
    assert.equal(await page.locator('[data-robot-caption]').textContent(), 'Hello! Nice to meet you.');
    assert.ok(wavs().some(name => /737260d3/.test(name)) && wavs().some(name => /a2c7efb9/.test(name)), `HELLO and THANKS fetched (${wavs()})`);
    assert.ok(!wavs().some(name => /2fd4c0cf|282d86e6/.test(name)), 'the intro lines were not fetched here');
    // Off again: the line stops, the caption goes.
    await chip.click();
    await page.waitForFunction(() => { const a = document.querySelector('audio[data-voice-line="hello"]'); return (a.paused || a.volume < .05) && !document.querySelector('[data-robot-caption]').hasAttribute('data-show'); }, null, { timeout: 2000 });
    if (axePath) {
      await chip.click();
      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async () => (await window.axe.run({ include: [['.robot-stage__hud'], ['[data-robot-caption]']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => v.id));
      assert.deepEqual(violations, [], 'axe on the Sound switch and the caption');
    }
    assert.deepEqual(errors, []);
    await context.close();
  });

  await check('voice: in the intro with motion, INTRO plays ≈ 0.9 s into ASK when Sound was turned on earlier in the session; it also works on the lite tier; a failing line is silent and the captions stay', async () => {
    if (!robotMedia?.voice) { results.push({ name: 'voice timed', status: 'skipped', message: 'no stand-in voice' }); return; }
    const context = await isolated(browser, { intro: true, viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    await context.addInitScript(() => { try { sessionStorage.setItem('omar-sound', '1'); } catch { /* blocked */ } window.__voiceAt = null; document.addEventListener('playing', event => { const a = event.target; if (a.dataset?.voiceLine === 'intro' && window.__voiceAt === null) window.__voiceAt = document.querySelector('[data-intro-ask]')?.currentTime ?? -1; }, true); });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`);
    assert.equal(await page.locator('.intro__bar [data-sound-toggle]').getAttribute('aria-pressed'), 'true', 'remembered on');
    await asked(page, 14000);
    await page.waitForFunction(() => window.__voiceAt !== null, null, { timeout: 4000 });
    const at = await page.evaluate(() => window.__voiceAt);
    assert.ok(at >= .8 && at < 1.6, `INTRO starts ≈ 0.9 s into ASK (${at})`);
    await context.close();
    // Lite tier, and a line that fails (404): the question and Yes still work, no error surfaces.
    const lite = await isolated(browser, { intro: true, device: 'low', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
    await lite.route(url => url.hostname === ROBOT_HOST && /\.wav$/.test(url.pathname), route => route.fulfill({ status: 404, body: '' }));
    const p2 = await lite.newPage();
    const pageErrors = [];
    p2.on('pageerror', error => pageErrors.push(error.message));
    await p2.goto(`${base}/index.html`);
    assert.equal(await p2.evaluate(() => document.documentElement.dataset.tier), 'lite');
    await p2.locator('.intro__bar [data-sound-toggle]').click();
    await asked(p2, 6000);
    assert.equal(await p2.locator('.intro__bar [data-sound-toggle]').getAttribute('aria-pressed'), 'true');
    assert.ok(await p2.locator('#intro-q').isVisible(), 'the question (the caption) stays');
    await p2.click('[data-intro-yes]');
    await introGone(p2, 3000);
    assert.deepEqual(pageErrors, [], 'failing audio is silent');
    await lite.close();
  });

  /* v10: every screen size. The intro (question, Yes, top bar) and the
     homepage at phones, foldables, tablets (both orientations), laptops and
     desktops: no horizontal scroll, the question and Yes on screen and clear
     of Otto's head (HEAD in src/data/robot.ts, measured on the real frames:
     the still's helmet and ASK's frontal pose; per line of the question),
     the speech line below the top bar, 44 px tap targets, the header's
     Contact usable; axe at a few. Stand-in stills (the frames' geometry is
     what is checked). */
  const HEAD = { still: [.485, .03, .74, .52], ask: [.455, .05, .74, .56] };
  const matrix = [[320, 568], [360, 640], [375, 667], [360, 780], [390, 844], [393, 852], [412, 915], [430, 932], [844, 390], [932, 430], [344, 882], [673, 841], [841, 673], [617, 841], [841, 617], [412, 914], [744, 1133], [1133, 744], [820, 1180], [1180, 820], [1024, 1366], [1366, 1024], [1280, 720], [1366, 768], [1440, 900], [1536, 864], [1920, 1080], [2560, 1440], [1280, 600]];
  const axeAt = new Set(['320x568', '844x390', '1024x1366', '2560x1440']);
  for (const [width, height] of matrix) await check(`every screen ${width}×${height}: intro question + Yes on screen and clear of his head (still and ASK), top bar usable, no overflow; homepage hero and header fit`, async () => {
    const touch = Math.min(width, height) < 900 || (width === 1024 && height === 1366) || (width === 1366 && height === 1024);
    const context = await isolated(browser, { intro: true, viewport: { width, height }, isMobile: Math.min(width, height) < 600, hasTouch: touch, reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`);
    await asked(page, 3000);
    await page.waitForTimeout(450);
    for (const clip of ['still', 'ask']) {
      if (clip === 'ask') { await page.evaluate(() => { document.querySelector('[data-intro]').dataset.clip = 'ask'; }); await page.waitForTimeout(1600); }
      const m = await page.evaluate(() => {
        const box = el => { const r = (typeof el === 'string' ? document.querySelector(el) : el).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; };
        const range = document.createRange(); range.selectNodeContents(document.querySelector('#intro-q'));
        return { frame: box('.intro__frame'), bar: box('.intro__bar'), status: box('.intro__status'), skip: box('.intro__skip'), say: box('.intro__say'), lines: [...range.getClientRects()].map(r => [r.left, r.top, r.right, r.bottom]), q: box('#intro-q'), yes: box('[data-intro-yes]'), contact: box('[data-intro-contact]'), taps: [...document.querySelectorAll('.intro__bar :is(a, button:not([hidden]))')].map(el => Math.round(el.getBoundingClientRect().height)), scroll: document.documentElement.scrollWidth };
      });
      const [fl, ft, fr, fb] = m.frame, fw = fr - fl, fh = fb - ft, H = HEAD[clip];
      const head = [fl + fw * H[0], ft + fh * H[1], fl + fw * H[2], ft + fh * H[3]];
      const hits = r => !(r[2] <= head[0] + 1 || r[0] >= head[2] - 1 || r[3] <= head[1] + 1 || r[1] >= head[3] - 1);
      const on = r => r[0] >= -1 && r[1] >= -1 && r[2] <= width + 1 && r[3] <= height + 1;
      const where = JSON.stringify({ head: head.map(Math.round), say: m.say.map(Math.round), q: m.q.map(Math.round), yes: m.yes.map(Math.round) });
      assert.ok(m.scroll <= width + 1, `${clip}: no horizontal scroll (${m.scroll})`);
      assert.ok(on(m.q) && on(m.yes) && on(m.contact) && on(m.say), `${clip}: question, speech line and buttons on screen ${where}`);
      assert.ok(!m.lines.some(hits) && !hits(m.say) && !hits(m.yes) && !hits(m.contact), `${clip}: nothing over his head ${where}`);
      assert.ok(m.say[1] >= m.bar[3] - 1, `${clip}: the speech line is below the top bar (${Math.round(m.say[1])} vs ${Math.round(m.bar[3])})`);
      assert.ok(m.status[2] <= m.skip[0], 'top bar: status and controls do not overlap');
      assert.ok(m.taps.every(h => h >= 44) && m.yes[3] - m.yes[1] >= 44 && m.contact[3] - m.contact[1] >= 44, `44 px tap targets (${m.taps})`);
      const visible = (Math.min(width, head[2]) - Math.max(0, head[0])) * (Math.min(height, head[3]) - Math.max(0, head[1])) / ((head[2] - head[0]) * (head[3] - head[1]));
      assert.ok(visible >= .85, `${clip}: his head is on screen (${visible.toFixed(2)} visible)`);
    }
    if (axePath && axeAt.has(`${width}x${height}`)) {
      await page.addScriptTag({ path: axePath });
      const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })).violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(', ')}`));
      assert.deepEqual(violations, [], 'axe on the intro');
    }
    await page.click('[data-intro-skip]');
    await introGone(page, 1500);
    await page.waitForTimeout(300);
    const home = await page.evaluate(() => {
      const contact = [...document.querySelectorAll('[data-header] a[href="/contact.html"]')].find(el => el.getBoundingClientRect().width > 0)?.getBoundingClientRect();
      const title = document.querySelector('#hero-title').getBoundingClientRect(), stage = document.querySelector('[data-robot-stage]').getBoundingClientRect();
      const chips = [...document.querySelectorAll('.robot-stage__hud > :not([hidden])')].map(el => el.getBoundingClientRect());
      return { scroll: document.documentElement.scrollWidth, contact: contact && [contact.left, contact.right, contact.height], title: [title.left, title.right, title.top], stageH: stage.height, chips: chips.map(r => [r.left, r.right, r.top]) };
    });
    assert.ok(home.scroll <= width + 1, `homepage: no horizontal scroll (${home.scroll})`);
    assert.ok(home.contact && home.contact[0] >= 0 && home.contact[1] <= width && home.contact[2] >= 36, `header Contact usable (${home.contact})`);
    assert.ok(home.title[0] >= 0 && home.title[1] <= width + 1, `hero title fits (${home.title})`);
    assert.ok(home.title[2] < height, `the hero title starts on the first screen (${Math.round(home.title[2])})`);
    assert.ok(home.stageH >= Math.min(width, height) * .4, `Otto is not tiny (${Math.round(home.stageH)} px tall)`);
    assert.ok(home.chips.every(([l, r, t]) => l >= 0 && r <= width && t >= 0), `Sound / Replay chips on screen (${JSON.stringify(home.chips)})`);
    await context.close();
  });

  /* v9: the capability tier (Base.astro head script) and the lite tier. */
  const tierOf = page => page.evaluate(() => document.documentElement.dataset.tier);
  await check('tier: capable devices get "full"; ≤ 2 GB memory, ≤ 2 cores, Save-Data or a 2g connection get "lite" (4 GB / 4 cores / 3g stay "full"); ?tier= overrides it for the session', async () => {
    const cases = [
      ['capable (8 cores, 8 GB)', {}, null, '', 'full'],
      ['low (2 cores, 2 GB)', { device: 'low' }, null, '', 'lite'],
      ['4 GB only', {}, () => Object.defineProperty(Navigator.prototype, 'deviceMemory', { configurable: true, get: () => 4 }), '', 'full'],
      ['2 GB only', {}, () => Object.defineProperty(Navigator.prototype, 'deviceMemory', { configurable: true, get: () => 2 }), '', 'lite'],
      ['4 cores only', {}, () => Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { configurable: true, get: () => 4 }), '', 'full'],
      ['2 cores only', {}, () => Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { configurable: true, get: () => 2 }), '', 'lite'],
      ['4 cores, iPhone (WebKit caps the count)', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' }, () => Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { configurable: true, get: () => 4 }), '', 'full'],
      ['Save-Data', {}, () => Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => ({ saveData: true }) }), '', 'lite'],
      ['3g (noisy on mobile)', {}, () => Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => ({ effectiveType: '3g' }) }), '', 'full'],
      ['2g', {}, () => Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => ({ effectiveType: '2g' }) }), '', 'lite'],
      ['?tier=lite on a capable device', {}, null, '?tier=lite', 'lite'],
      ['?tier=full on a low device', { device: 'low' }, null, '?tier=full', 'full'],
    ];
    const wrong = [];
    for (const [label, options, init, query, want] of cases) {
      const context = await isolated(browser, { viewport: { width: 390, height: 844 }, ...options });
      if (init) await context.addInitScript(init);
      const page = await context.newPage();
      await page.goto(`${base}/index.html${query}`);
      const got = await tierOf(page);
      if (got !== want) wrong.push(`${label}: ${got} (want ${want})`);
      if (query) { // the override lasts for the session (QA, sharing a lite view)
        await page.goto(`${base}/work.html`);
        if ((await tierOf(page)) !== want) wrong.push(`${label}: not kept on the next page`);
      }
      await context.close();
    }
    assert.deepEqual(wrong, []);
  });

  for (const [label, options, query] of [['?tier=lite', { device: 'capable' }, '?tier=lite'], ['emulated low device (2 GB, 4 cores)', { device: 'low' }, '']]) {
    await check(`lite tier (${label}): no clips requested, no custom cursor, no pins or scrub, no backdrop blur, ambient light at rest; the robot and every link still work`, async () => {
      const context = await isolated(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', ...options });
      const page = await context.newPage();
      const errors = watch(page);
      const clips = [];
      page.on('request', request => { if (/\.(mp4|webm)(\?|$)/.test(request.url())) clips.push(request.url().split('/').pop()); });
      await page.goto(`${base}/index.html${query}`, { waitUntil: 'networkidle' });
      assert.equal(await tierOf(page), 'lite');
      await page.mouse.move(700, 400); await page.mouse.move(760, 430, { steps: 3 });
      await page.hover('[data-robot-hi]');
      await page.hover('.door--work'); // a [data-open] link: no gate clip warm-up on lite
      for (let y = 0; y < 9000; y += 900) { await page.evaluate(top => scrollTo(0, top), y); await page.waitForTimeout(120); }
      await page.waitForTimeout(600);
      const state = await page.evaluate(() => {
        const pin = document.querySelector('.hero-pin'), gallery = document.querySelector('[data-hgallery]');
        const blur = [...document.querySelectorAll('body *')].filter(el => { const cs = getComputedStyle(el); return (cs.backdropFilter && cs.backdropFilter !== 'none') || (cs.webkitBackdropFilter && cs.webkitBackdropFilter !== 'none'); }).length;
        return {
          ring: !!document.querySelector('.cursor-ring'),
          pinTall: pin.offsetHeight > innerHeight * 1.2,
          heroSticky: getComputedStyle(document.querySelector('.hero')).position === 'sticky',
          pinned: getComputedStyle(gallery).getPropertyValue('--pinned').trim() === '1',
          track: getComputedStyle(document.querySelector('[data-hgallery-track]')).overflowX,
          scrubbing: document.getAnimations().filter(a => a.effect?.target?.hasAttribute?.('data-scrub') && a.playState !== 'idle').length,
          blur,
          beams: document.getAnimations().filter(a => /beam-sweep|label-float|glow-a|glow-b|slide|band-drift/.test(a.animationName) && a.playState === 'running').map(a => a.animationName),
          haze: [...document.querySelectorAll('.haze')].every(el => getComputedStyle(el).display === 'none'),
          blend: getComputedStyle(document.querySelector('.hero__robot')).mixBlendMode,
          tilt: getComputedStyle(document.querySelector('.door')).transform,
          playing: [...document.querySelectorAll('video')].filter(v => !v.paused).length,
          neon: [...document.querySelectorAll('.neon-line path')].slice(0, 4).map(el => parseFloat(getComputedStyle(el).strokeDashoffset)),
        };
      });
      assert.deepEqual(clips, [], 'no video requested on load, scroll or hover');
      assert.ok(!state.ring, 'no custom cursor ring');
      assert.ok(!state.pinTall && !state.heroSticky && !state.pinned && state.track === 'auto', `no pinned hero or gallery: a native snap scroller (${JSON.stringify(state)})`);
      assert.equal(state.scrubbing, 0, 'no scroll scrub');
      assert.equal(state.blur, 0, 'no backdrop-filter');
      assert.deepEqual(state.beams, [], 'ambient light and marquees at rest');
      assert.ok(state.haze && state.blend === 'normal', 'no noise layer, no lighten blending on the robot');
      assert.ok(state.tilt === 'none', `no tilt (${state.tilt})`);
      assert.equal(state.playing, 0, 'no preview video plays');
      assert.ok(state.neon.every(v => v === 0), `neon lines drawn at rest (${state.neon})`);
      // The robot works on an explicit tap only: then (and only then) his first move is fetched.
      await page.evaluate(() => scrollTo(0, 0));
      await page.waitForTimeout(300);
      await page.click('[data-robot-hi]');
      await page.waitForFunction(() => ['playing', 'done', 'failed'].includes(document.querySelector('[data-robot-stage]').dataset.greet), null, { timeout: 5000 });
      assert.ok(clips.length === 1 && /0d5a7893/.test(clips[0]), `the tap fetched WAVE only (${clips})`);
      // A door still opens through the light (CSS seams; no clip).
      await Promise.all([page.waitForURL(/work\.html$/, { timeout: 5000 }), page.click('.door--work')]);
      assert.equal(await tierOf(page), 'lite', 'the tier holds on the next page');
      assert.deepEqual(errors, []);
      await context.close();
    });
  }

  await check('Save-Data intro end to end (v9.1: weak devices keep the real transformation; only Save-Data / 2g get this): the CSS assemble (orb → Otto), the question with its light hint, Yes through the CSS gate; no clip, no per-frame drawing', async () => {
    for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 800 }]) {
      const context = await isolated(browser, { intro: true, viewport, reducedMotion: 'no-preference' });
      await context.addInitScript(() => Object.defineProperty(Navigator.prototype, 'connection', { configurable: true, get: () => ({ saveData: true }) }));
      await context.addInitScript(() => { const raf = window.requestAnimationFrame.bind(window); window.__draws = 0; const draw = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function (...args) { if (this.canvas.closest?.('[data-intro]')) window.__draws++; return draw.apply(this, args); }; window.requestAnimationFrame = raf; });
      const page = await context.newPage();
      const errors = watch(page);
      const clips = [];
      page.on('request', request => { if (/\.(mp4|webm)(\?|$)/.test(request.url())) clips.push(request.url()); });
      await page.goto(`${base}/index.html`);
      await page.waitForFunction(() => document.querySelector('[data-intro]')?.dataset.stage === 'assemble', null, { timeout: 4000 });
      const assembling = await page.evaluate(() => ({ path: document.querySelector('[data-intro]').dataset.path, scan: document.getAnimations().some(a => a.animationName === 'intro-scan'), reveal: document.getAnimations().some(a => a.animationName === 'intro-assemble'), status: document.querySelector('[data-intro-status]').textContent }));
      assert.ok(assembling.path === 'lite' && assembling.scan && assembling.reveal && assembling.status === 'Assembling', `assembling in CSS (${JSON.stringify(assembling)})`);
      await asked(page, 6000);
      await page.waitForTimeout(500);
      const state = await page.evaluate(() => ({ draws: window.__draws, hint: Number(getComputedStyle(document.querySelector('.intro__hint')).opacity), robot: Number(getComputedStyle(document.querySelector('.intro__screen--b')).opacity), orb: Number(getComputedStyle(document.querySelector('.intro__screen:not(.intro__screen--b)')).opacity), live: document.querySelector('[data-intro-live]').textContent, active: document.activeElement?.hasAttribute('data-intro-yes') }));
      assert.ok(state.draws <= 2, `each still painted once, nothing per frame (${state.draws} draws)`);
      assert.ok(state.robot > .99 && state.orb < .01, `Otto has replaced the orb (${JSON.stringify(state)})`);
      assert.ok(state.hint > .9, 'the light hint presents the question');
      assert.match(state.live, /Hi — I’m Otto, Omar’s robot\. Do you want to see his work\?/);
      assert.ok(state.active, 'focus on Yes');
      await page.click('[data-intro-yes]');
      await page.waitForFunction(() => document.querySelector('[data-gate]')?.dataset.state === 'open' || !document.querySelector('[data-intro]'), null, { timeout: 2000 });
      await introGone(page, 3000);
      assert.ok(await page.locator('#hero-title').isVisible());
      assert.deepEqual(clips, [], 'no clip requested');
      assert.deepEqual(errors, []);
      await context.close();
    }
  });

  await check('moves: hero clips are fetched only on intent (hover, focus or press on Otto), never during load; the next move is warmed after a press', async () => {
    if (!robotMedia) return;
    const context = await isolated(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const clips = [];
    page.on('request', request => { const m = /(0d5a7893|86ab53ef|37408964|df410d0c)/.exec(request.url()); if (m) clips.push(m[1]); });
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    assert.deepEqual(clips, [], 'nothing fetched during load');
    assert.deepEqual(await page.evaluate(() => [...document.querySelectorAll('[data-robot-video]')].map(v => v.preload)), ['none', 'none', 'none'], 'every move is preload="none" until asked');
    await page.hover('[data-robot-hi]');
    await page.waitForFunction(() => document.querySelector('[data-robot-video="wave"]').preload === 'auto', null, { timeout: 2000 });
    await page.waitForTimeout(300);
    assert.deepEqual([...new Set(clips)], ['0d5a7893'], `hovering Otto prefetches his next move only (${clips})`);
    await page.click('[data-robot-hi]');
    await page.waitForTimeout(2200);
    assert.ok(clips.includes('86ab53ef'), 'while he waves, HEART (the next move) is warmed');
    const focusOnly = await isolated(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    const second = await focusOnly.newPage();
    const more = [];
    second.on('request', request => { if (/0d5a7893/.test(request.url())) more.push(request.url()); });
    await second.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await second.locator('[data-robot-hi]').focus();
    await second.waitForTimeout(600);
    assert.equal(more.length > 0, true, 'keyboard focus prefetches too');
    await context.close(); await focusOnly.close();
  });

  await check('moves: a touch scroll that starts on Otto fetches no clip (only a tap does)', async () => {
    if (!robotMedia) return;
    const context = await isolated(browser, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const clips = [];
    page.on('request', request => { const m = /(0d5a7893|86ab53ef|37408964)/.exec(request.url()); if (m) clips.push(m[1]); });
    await page.goto(`${base}/index.html?tier=full`, { waitUntil: 'networkidle' });
    const box = await page.locator('[data-robot-hi]').boundingBox();
    const cdp = await context.newCDPSession(page);
    // A finger lands on Otto and drags up (a scroll, no tap).
    const x = Math.round(box.x + box.width / 2); let y = Math.round(box.y + box.height / 2);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 0; i < 12; i++) { y -= 30; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await page.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await page.waitForTimeout(2500);
    assert.ok(await page.evaluate(() => scrollY > 100), 'the page scrolled');
    assert.deepEqual(clips, [], 'no gesture clip fetched by a scroll');
    await page.evaluate(() => scrollTo(0, 0));
    await page.tap('[data-robot-hi]');
    await page.waitForTimeout(800);
    assert.deepEqual([...new Set(clips)], ['0d5a7893'], 'the tap fetches his move');
    await context.close();
  });

  await check('moves: the idle surprise (≈ 12 s, no input) plays the HEART once and fetches nothing else', async () => {
    if (!robotMedia) return;
    const context = await isolated(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    const page = await context.newPage();
    const clips = [];
    page.on('request', request => { const m = /(0d5a7893|86ab53ef|37408964)/.exec(request.url()); if (m) clips.push(m[1]); });
    await page.goto(`${base}/index.html?tier=full`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => document.querySelector('[data-robot-stage]').dataset.move === 'heart', null, { timeout: 18000 });
    await page.waitForTimeout(3000);
    assert.deepEqual([...new Set(clips)], ['86ab53ef'], `only HEART fetched (${clips})`);
    await context.close();
  });

  for (const viewport of [{ width: 360, height: 640 }, { width: 390, height: 844 }, { width: 1000, height: 800 }, { width: 1440, height: 900 }]) {
    await check(`intro question is big and clear at ${viewport.width}×${viewport.height}: in 2–3 lines, clear of his head (the still and ASK's frontal pose), no overflow; Yes is the biggest button`, async () => {
      const context = await isolated(browser, { intro: true, viewport, isMobile: viewport.width < 600, hasTouch: viewport.width < 600, reducedMotion: 'reduce' });
      const page = await context.newPage();
      await page.goto(`${base}/index.html`);
      await asked(page, 3000);
      await page.waitForTimeout(400);
      const m = await page.evaluate(() => {
        const q = document.querySelector('#intro-q'), box = q.getBoundingClientRect(), cs = getComputedStyle(q);
        const yes = document.querySelector('[data-intro-yes]').getBoundingClientRect(), contact = document.querySelector('[data-intro-contact]').getBoundingClientRect();
        const frame = document.querySelector('.intro__frame').getBoundingClientRect();
        return { size: parseFloat(cs.fontSize), lines: Math.round(box.height / parseFloat(cs.lineHeight)), top: box.top, left: box.left, right: box.right, bottom: box.bottom,
          headBottom: frame.top + frame.height * .52, headLeft: frame.left + frame.width * .485,
          yes: { h: yes.height, w: yes.width, fs: parseFloat(getComputedStyle(document.querySelector('[data-intro-yes]')).fontSize), bottom: yes.bottom, right: yes.right }, contact: { h: contact.height, fs: parseFloat(getComputedStyle(document.querySelector('[data-intro-contact]')).fontSize), bottom: contact.bottom, right: contact.right },
          scroll: document.documentElement.scrollWidth, w: innerWidth, h: innerHeight };
      });
      const phone = viewport.width < 600;
      assert.ok(m.size >= (phone ? (viewport.height < 700 ? 34 : 44) : viewport.width >= 1280 ? 88 : 52), `question font ${m.size}px`);
      assert.ok(m.lines >= 2 && m.lines <= (phone ? 3 : 3), `${m.lines} lines`);
      assert.ok(m.right <= m.w - 8 && m.left >= 8 && m.scroll <= m.w + 1, `no overflow (${JSON.stringify(m)})`);
      if (phone) assert.ok(m.top >= m.headBottom - 4, `clear of his head (question top ${Math.round(m.top)} vs head bottom ${Math.round(m.headBottom)})`);
      else assert.ok(m.right <= m.headLeft + 4, `left of his head (question right ${Math.round(m.right)} vs head ${Math.round(m.headLeft)})`);
      assert.ok(m.yes.h >= 60 && m.yes.fs >= 18 && m.yes.h > m.contact.h && m.contact.h >= 56, `Yes is big (${JSON.stringify(m.yes)}), Contact Omar a bit bigger than a normal button (${JSON.stringify(m.contact)})`);
      assert.ok(m.yes.bottom <= m.h && m.contact.bottom <= m.h && m.yes.right <= m.w && m.contact.right <= m.w, 'both buttons on screen');
      // ASK's framing (data-clip="ask"; he faces you): helmet x 45.5–74%, y 5–56%
      // of the frame (measured on the real clip, ≈ 2.1 s to its last frame).
      await page.evaluate(() => { document.querySelector('[data-intro]').dataset.clip = 'ask'; });
      await page.waitForTimeout(1700);
      const a = await page.evaluate(() => { const f = document.querySelector('.intro__frame').getBoundingClientRect(), q = document.querySelector('#intro-q').getBoundingClientRect(), say = document.querySelector('.intro__say').getBoundingClientRect();
        return { headLeft: f.left + f.width * .455, headBottom: f.top + f.height * .56, q: { right: q.right, left: q.left }, sayTop: say.top, size: parseFloat(getComputedStyle(document.querySelector('#intro-q')).fontSize), scroll: document.documentElement.scrollWidth, w: innerWidth }; });
      if (phone) assert.ok(a.sayTop >= a.headBottom - 4, `ASK: the speech line is below his chin (${Math.round(a.sayTop)} vs ${Math.round(a.headBottom)})`);
      else assert.ok(a.q.right <= a.headLeft + 4, `ASK: the question is left of his helmet (${Math.round(a.q.right)} vs ${Math.round(a.headLeft)})`);
      assert.ok(a.size >= (phone ? (viewport.height < 700 ? 34 : 44) : viewport.width >= 1280 ? 80 : 52) && a.q.left >= 8 && a.scroll <= a.w + 1, `ASK: still big, no overflow (${JSON.stringify(a)})`);
      await context.close();
    });
  }

  await check('no Pause control anywhere; with motion every interior page has ambient motion; with reduced motion no loop runs on any page', async () => {
    const on = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } });
    const off = await isolated(browser, { reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } });
    const [pageOn, pageOff] = [await on.newPage(), await off.newPage()];
    const left = [];
    for (const route of [...routes, ...tours]) {
      await pageOn.goto(`${base}/${route}.html`, { waitUntil: 'networkidle' });
      const state = await pageOn.evaluate(() => ({ toggles: document.querySelectorAll('[data-motion-toggle], .mtoggle, .footer__motion, .motion-pill').length, attr: document.documentElement.hasAttribute('data-motion'), text: /\b(Pause|Play|Resume) motion\b/i.test(document.body.innerText + [...document.querySelectorAll('[aria-label]')].map(el => el.getAttribute('aria-label')).join(' ')) }));
      if (state.toggles || state.attr || state.text) left.push(`${route}: a Pause/Play motion control remains ${JSON.stringify(state)}`);
      if (route !== 'index' && (await loops(pageOn)).length === 0) left.push(`${route}: no ambient motion at all`);
      await pageOff.goto(`${base}/${route}.html`, { waitUntil: 'networkidle' });
      await pageOff.evaluate(() => { document.querySelector('.footer')?.scrollIntoView(); });
      await pageOff.waitForTimeout(150);
      const running = await loops(pageOff);
      if (running.length) left.push(`${route} (reduced motion): ${running.join(', ')}`);
    }
    assert.deepEqual(left, []);
    await on.close(); await off.close();
  });

  await check('reduced motion: no loop, no cursor ring, no autoplaying video, no count-up; the hero and gallery are static', async () => {
    const context = await isolated(browser, { reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await page.mouse.move(700, 400);
    await page.mouse.move(760, 420);
    await page.waitForTimeout(2500);
    assert.deepEqual(await loops(page), [], 'no infinite animation runs');
    const state = await page.evaluate(() => ({
      playing: [...document.querySelectorAll('video')].filter(v => !v.paused).length,
      robotSrc: document.querySelector('[data-robot-video]')?.currentSrc ?? '',
      ring: !!document.querySelector('.cursor-ring:not([hidden])'),
      counts: [...document.querySelectorAll('[data-count-to]')].map(el => el.textContent),
      ry: getComputedStyle(document.querySelector('[data-robot-tilt]')).getPropertyValue('--ry').trim(),
    }));
    assert.equal(state.playing, 0, 'no video plays');
    assert.equal(state.robotSrc, '', 'the robot clip is not even fetched');
    assert.ok(!state.ring, 'no cursor ring');
    assert.deepEqual(state.counts, ['150', '5', '3'], 'numbers shown final');
    assert.ok(!state.ry || Number(state.ry) === 0, `robot does not tilt (${state.ry})`);
    await context.close();
  });

  await check('reduced motion releases the scroll-driven motion (hero pin and scrub, pinned gallery, neon lines) that runs with motion', async () => {
    const state = page => page.evaluate(() => {
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
    const on = await isolated(browser, { reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });
    const page = await on.newPage();
    await page.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    const live = await state(page);
    // (Scrubs in blocks not yet rendered, content-visibility, have no animation yet.)
    assert.ok(live.scrubbing >= 3 && live.pinTall && live.pinned && live.heroSticky, `motion on: scrub, pin and gallery active (${JSON.stringify(live)})`);
    // Halfway through the gallery the track has moved sideways.
    await page.evaluate(() => { const g = document.querySelector('[data-hgallery]'); scrollTo(0, g.getBoundingClientRect().top + scrollY + (g.offsetHeight - innerHeight) / 2); });
    await page.waitForTimeout(300);
    const mid = await state(page);
    assert.ok(Number(mid.p) > .3 && Number(mid.p) < .7 && mid.track !== 'none' && !/^0px/.test(mid.track), `gallery track follows the scroll (${JSON.stringify(mid)})`);
    await on.close();
    const off = await isolated(browser, { reducedMotion: 'reduce', viewport: { width: 1440, height: 900 } });
    const still = await off.newPage();
    await still.goto(`${base}/index.html`, { waitUntil: 'networkidle' });
    await still.evaluate(() => { const g = document.querySelector('[data-hgallery]'); scrollTo(0, g.getBoundingClientRect().top + scrollY + 200); });
    await still.waitForTimeout(200);
    const rest = await state(still);
    assert.equal(rest.scrubbing, 0, 'no scroll-driven animation runs with reduced motion');
    assert.ok(!rest.pinTall && !rest.pinned && !rest.heroSticky, `pin and pinned gallery released (${JSON.stringify(rest)})`);
    assert.ok(/^(none|0px)/.test(rest.track), `gallery track at rest (${rest.track})`);
    assert.equal(await still.locator('[data-hgallery-track]').evaluate(el => getComputedStyle(el).overflowX), 'auto', 'the gallery is a native horizontal scroller');
    await off.close();
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
      // The page grows as content-visibility renders each block (v9): keep
      // going until the real bottom.
      for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 400) { await page.evaluate(top => scrollTo(0, top), y); await page.waitForTimeout(50); }
      // Blocks scrolled past are skipped (content-visibility) and their
      // reveal transitions wait until they are on screen again; render them
      // all to see every reveal finish.
      await page.addStyleTag({ content: '*{content-visibility:visible!important}' });
      await page.waitForTimeout(1300);
      const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter(el => !el.closest('[hidden]') && (!el.classList.contains('is-in') || Number(getComputedStyle(el).opacity) < .99 || !/^(none|inset\((0(px|%)?\s*)+( round [^)]*)?\))$/.test(getComputedStyle(el).clipPath))).map(el => el.className || el.tagName));
      if (hidden.length) problems.push(`${route}: ${hidden.slice(0, 3).join(' | ')}`);
    }
    assert.deepEqual(problems, []);
    await context.close();
  });

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

  /* 9. Performance: LCP/CLS on throttled phone and desktop loads, with the
     intro (first homepage view) and without it (later views), with the
     stand-ins and with the robot CDN blocked. Third-party media must never be
     the LCP (the stills and clips are drawn into canvases; text is LCP). */
  /* v9: the lite tier on a weak phone (6× CPU, Slow 4G) also keeps Total
     Blocking Time ≤ 200 ms. */
  for (const [label, viewport, mobile, intro, mode, posterDelay, device = 'capable', cpu = mobile ? 4 : 1] of [
    ['lite phone (2 GB, 4 cores), 6× CPU, later view', { width: 390, height: 844 }, true, false, 'play', 0, 'low', 6],
    ['lite phone (2 GB, 4 cores), 6× CPU, intro', { width: 390, height: 844 }, true, true, 'play', 0, 'low', 6],
    ['phone, intro', { width: 390, height: 844 }, true, true, 'play', 0],
    ['phone, intro, CDN blocked', { width: 390, height: 844 }, true, true, 'block', 0],
    ['desktop, intro', { width: 1440, height: 900 }, false, true, 'play', 0],
    ['desktop, intro, CDN blocked', { width: 1440, height: 900 }, false, true, 'block', 0],
    ['phone, later view', { width: 390, height: 844 }, true, false, 'play', 0],
    ['phone, later view, robot still 2 s late', { width: 390, height: 844 }, true, false, 'play', 2000],
    ['desktop, later view', { width: 1440, height: 900 }, false, false, 'play', 0],
  ]) {
    await check(`performance ${label}: LCP <= 2.5s, CLS <= 0.05${device === 'low' ? ', TBT <= 200ms' : ''}, LCP never third-party media`, async () => {
      const context = await isolated(browser, { intro, device, viewport, isMobile: mobile, hasTouch: mobile, reducedMotion: 'no-preference' }, mode);
      if (posterDelay) await routeRobot(context, 'play', { posterDelay });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
      await page.addInitScript(() => {
        window.__lcp = 0; window.__cls = 0; window.__long = [];
        new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__long.push([entry.startTime, entry.duration]); }).observe({ type: 'longtask', buffered: true });
        new PerformanceObserver(list => { for (const entry of list.getEntries()) { window.__lcp = entry.startTime; window.__lcpEl = `${entry.element?.tagName ?? ''}.${entry.element?.className ?? ''}`.slice(0, 60); window.__lcpUrl = entry.url; } }).observe({ type: 'largest-contentful-paint', buffered: true });
        new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(`${base}/index.html`, { waitUntil: 'load' });
      // Long enough for the intro to reach its question (no input yet, so LCP
      // is still being recorded), or for the late still.
      if (intro) await page.waitForFunction(() => document.querySelector('[data-intro]')?.hasAttribute('data-asked'), null, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(2500 + posterDelay);
      const metrics = await page.evaluate(() => { const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0; return { lcp: Math.round(window.__lcp), element: window.__lcpEl, url: window.__lcpUrl || '', cls: Number(window.__cls.toFixed(3)), tbt: Math.round(window.__long.filter(([start]) => start >= fcp).reduce((sum, [, d]) => sum + Math.max(0, d - 50), 0)), tier: document.documentElement.dataset.tier, asked: document.querySelector('[data-intro]')?.hasAttribute('data-asked') ?? null }; });
      results.push({ name: `performance ${label} metrics`, status: 'info', message: JSON.stringify(metrics) });
      assert.ok(metrics.lcp <= 2500, `LCP ${metrics.lcp}ms`);
      assert.ok(metrics.cls <= 0.05, `CLS ${metrics.cls}`);
      if (device === 'low') { assert.equal(metrics.tier, 'lite'); assert.ok(metrics.tbt <= 200, `TBT ${metrics.tbt}ms`); }
      assert.ok(!/^(VIDEO|CANVAS|IMG)/.test(metrics.element) && !/cloudfront/.test(metrics.url), `LCP is not third-party media (${metrics.element} ${metrics.url})`);
      await context.close();
    });
  }

  // v9: on the lite tier the interior heroes and tours show their copy and
  // media at first paint (no delayed fade holding back LCP).
  for (const route of ['work', 'inside/katana']) {
    await check(`performance lite phone (2 GB, 4 cores), 6× CPU, /${route}: LCP <= 2.5s, CLS <= 0.05`, async () => {
      const context = await isolated(browser, { device: 'low', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
      await page.addInitScript(() => { window.__lcp = 0; window.__cls = 0; new PerformanceObserver(list => { for (const entry of list.getEntries()) { window.__lcp = entry.startTime; window.__lcpEl = `${entry.element?.tagName ?? ''}.${entry.element?.className ?? ''}`.slice(0, 60); } }).observe({ type: 'largest-contentful-paint', buffered: true }); new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__cls += entry.value; }).observe({ type: 'layout-shift', buffered: true }); });
      await page.goto(`${base}/${route}.html`, { waitUntil: 'load' });
      await page.waitForTimeout(3000);
      const metrics = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), element: window.__lcpEl, cls: Number(window.__cls.toFixed(3)), tier: document.documentElement.dataset.tier }));
      results.push({ name: `performance lite /${route} metrics`, status: 'info', message: JSON.stringify(metrics) });
      assert.equal(metrics.tier, 'lite');
      assert.ok(metrics.lcp <= 2500, `LCP ${metrics.lcp}ms (${metrics.element})`);
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
