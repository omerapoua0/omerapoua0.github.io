// Static checks over the built site (run after `pnpm run build`):
// honesty wording, personal-data boundaries, credits and size budgets.
import { readdir, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const dist = path.resolve('dist');
const failures = [];
const info = [];
const pages = ['index', 'work', 'automations', 'research', 'cv', 'tutoring', 'contact'];
const html = Object.fromEntries(await Promise.all(pages.map(async page => [page, await readFile(path.join(dist, `${page}.html`), 'utf8')])));
const text = Object.fromEntries(Object.entries(html).map(([page, source]) => [page, source.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;|&rsquo;/g, '’').replace(/\s+/g, ' ')]));
const all = Object.values(text).join(' ');
const expect = (condition, message) => { if (!condition) failures.push(message); };

// Personal-data boundaries: no phone number on any page; personal GitHub only.
expect(!/(\+44|\b0?7\d{3}\s?\d{6}\b)/.test(Object.values(html).join(' ')), 'A phone number appears in the built pages');
expect(!/github\.com\/omarapoua\b/.test(Object.values(html).join(' ')), 'The work GitHub account appears; the site uses the personal account');
expect(Object.values(html).every(source => source.includes('github.com/omerapoua0')), 'Personal GitHub link missing from a page');

// Delivery honesty: no false sent/booked states.
expect(!/\b(message sent|enquiry sent|booking confirmed|lesson (is )?booked|successfully sent)\b/i.test(all), 'A false sent/booked state appears');
expect(/Nothing has been sent/.test(text.tutoring) && /Nothing has been sent/.test(text.contact), 'Review screens must say nothing has been sent');

// Attribution and status wording that must stay visible.
const required = [
  ['index', /Hi, I’m/, 'First-person greeting'],
  ['index', /No AI model; nothing you type leaves this page/, 'Chat disclosure under the composer'],
  ['work', /programme direction/i, 'KATANA Level 4 described as programme direction'],
  ['work', /wider R&D/i, 'INOS described as part of wider R&D'],
  ['work', /no claim of trading performance|not investment advice|nothing here is investment advice/i, 'Bitget: no performance claims'],
  ['work', /pre-launch/i, 'NOOKBASE pre-launch'],
  ['work', /150 beta users/i, 'NOOKBASE beta user count'],
  ['work', /Concept visual, not product footage/i, 'Concept visuals labelled'],
  ['research', /unpublished/i, 'AI in Higher Education marked unpublished'],
  ['research', /upcoming, not completed/i, 'Santander placement marked upcoming'],
  ['research', /aspiration/i, 'PhD as aspiration'],
  ['cv', /IBM Data Science/, 'Certification: IBM Data Science'],
  ['cv', /Google Mathematics for Machine Learning/, 'Certification: Google Mathematics for ML'],
  ['cv', /Microsoft Fabric/, 'Certification: Microsoft Fabric'],
  ['cv', /First Class Honours/, 'Target First Class Honours'],
  ['cv', /Arabic \(native\)/, 'Languages'],
  ['tutoring', /Enhanced DBS checked/, 'DBS statement'],
  ['tutoring', /Free 15-minute intro call/i, 'Intro call'],
  ['tutoring', /within one working day/i, 'Reply time'],
  ['tutoring', /Parents welcome to sit in/i, 'Parents can sit in'],
  ['tutoring', /No payment taken online/i, 'No payment online'],
];
for (const [page, pattern, label] of required) expect(pattern.test(text[page]), `${page}: missing "${label}"`);

// Size budgets (gzip): JS per page <= 20KB, CSS per page <= 30KB.
for (const page of pages) {
  const assets = [...html[page].matchAll(/(?:src|href)="(\/_astro\/[^"]+\.(js|css))"/g)].map(match => match[1]);
  let js = 0, css = 0;
  // Follow static and dynamic relative imports so the whole module graph counts.
  const queue = [...new Set(assets)];
  const seen = new Set();
  while (queue.length) {
    const asset = queue.shift();
    if (seen.has(asset)) continue;
    seen.add(asset);
    const source = await readFile(path.join(dist, asset));
    if (asset.endsWith('.js')) {
      js += gzipSync(source).length;
      for (const match of source.toString().matchAll(/(?:from|import)\s*\(?\s*["'](\.\/[^"']+\.js)["']/g)) queue.push(path.posix.join(path.posix.dirname(asset), match[1]));
    } else css += gzipSync(source).length;
  }
  // Inline scripts/styles count too.
  for (const match of html[page].matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)) js += gzipSync(match[1]).length;
  for (const match of html[page].matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) css += gzipSync(match[1]).length;
  info.push(`${page}: JS ${(js / 1024).toFixed(1)}KB gz, CSS ${(css / 1024).toFixed(1)}KB gz`);
  // The homepage carries the motion pass (3D orbit, slider, tilt, ~2.5KB) on top of the chat.
  const jsBudget = page === 'index' ? 24 : 20;
  expect(js <= jsBudget * 1024, `${page}: JS ${js}B gz exceeds ${jsBudget}KB`);
  expect(css <= 30 * 1024, `${page}: CSS ${css}B gz exceeds 30KB`);
}
// Otto preview and inside pages: disclosure, noindex while in preview, facts, JS budget.
const jsWeight = async (source, { dynamic }) => {
  const assets = [...source.matchAll(/(?:src|href)="(\/_astro\/[^"]+\.js)"/g)].map(match => match[1]);
  const queue = [...new Set(assets)], seen = new Set();
  let js = 0;
  while (queue.length) {
    const asset = queue.shift();
    if (seen.has(asset)) continue;
    seen.add(asset);
    const file = await readFile(path.join(dist, asset));
    js += gzipSync(file).length;
    const pattern = dynamic ? /(?:from|import)\s*\(?\s*["'](\.\/[^"']+\.js)["']/g : /(?:from|import)\s*["'](\.\/[^"']+\.js)["']/g;
    for (const match of file.toString().matchAll(pattern)) queue.push(path.posix.join(path.posix.dirname(asset), match[1]));
  }
  for (const match of source.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)) js += gzipSync(match[1]).length;
  return js;
};
const otto = await readFile(path.join(dist, 'preview-otto.html'), 'utf8');
const ottoText = otto.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
expect(/No AI model; nothing you type leaves this page/.test(ottoText), 'preview-otto: chat disclosure missing');
expect(/I’m Otto, Omar’s robot/.test(ottoText), 'preview-otto: greeting missing');
for (const file of ['preview-otto.html', 'preview-3d.html', ...['katana', 'nookbase', 'inos', 'bitget', 'bp'].map(id => `inside/${id}.html`)]) {
  const source = await readFile(path.join(dist, file), 'utf8');
  expect(source.includes('<meta name="robots" content="noindex">'), `${file}: should be noindex while in preview`);
}
const ottoJs = await jsWeight(otto, { dynamic: true });
// Otto's brain, voice, rig and teleport cost ~13KB over the chat-only homepage:
// still less than one web font. The motion pass adds ~2.5KB. The old first-person answers drop out on promotion.
info.push(`preview-otto: JS ${(ottoJs / 1024).toFixed(1)}KB gz (budget 38KB)`);
expect(ottoJs <= 38 * 1024, `preview-otto: JS ${ottoJs}B gz exceeds 38KB`);
const threeD = await jsWeight(await readFile(path.join(dist, 'preview-3d.html'), 'utf8'), { dynamic: false });
info.push(`preview-3d: JS ${(threeD / 1024).toFixed(1)}KB gz before the lazy Spline runtime`);
for (const id of ['katana', 'nookbase', 'inos', 'bitget', 'bp']) {
  const source = await readFile(path.join(dist, 'inside', `${id}.html`), 'utf8');
  if (id === 'katana') expect(/programme(’|&#39;|')s direction|programme direction/i.test(source), 'inside/katana: Level 4 caveat missing');
  if (id === 'bitget') expect(/no claim of trading performance|not investment advice/i.test(source), 'inside/bitget: no-performance caveat missing');
  if (id === 'inos') expect(/wider R&amp;D|wider R&D/i.test(source), 'inside/inos: wider R&D caveat missing');
  const weight = await jsWeight(source, { dynamic: true });
  expect(weight <= 20 * 1024, `inside/${id}: JS ${weight}B gz exceeds 20KB`);
}

// Every link the chat can show (cards and sources) must resolve to a built page and anchor.
const agentSource = (await readFile(path.resolve('src/data/agent.ts'), 'utf8')) + (await readFile(path.resolve('src/data/otto.ts'), 'utf8'));
for (const [, href] of agentSource.matchAll(/href: '([^']+)'/g)) {
  if (/^https?:/.test(href)) continue;
  if (href.includes('${')) continue;
  const [file, anchor] = href.split('#');
  const page = file.replace(/^\//, '').replace(/\.html(\?.*)?$/, '');
  if (file.endsWith('.pdf')) { expect((await readdir(dist)).includes(file.slice(1)), `agent link ${href}: missing file`); continue; }
  expect(pages.includes(page), `agent link ${href}: unknown page`);
  if (anchor && html[page]) expect(html[page].includes(`id="${anchor}"`), `agent link ${href}: missing anchor`);
}

const media = await readdir(dist);
for (const [file, limit] of [['portrait-hero.webp', 60e3], ['portrait-avatar.webp', 12e3]]) {
  expect(media.includes(file), `${file} missing from dist`);
  if (media.includes(file)) { const size = (await readFile(path.join(dist, file))).length; info.push(`${file}: ${(size / 1e3).toFixed(0)}KB`); expect(size <= limit, `${file} over budget`); }
}
expect(!media.some(file => /^hero-(editorial|still)/.test(file)), 'Stock hero film files should no longer ship');

info.forEach(line => console.log(line));
if (failures.length) { failures.forEach(line => console.error('FAIL', line)); process.exitCode = 1; }
else console.log(`Content checks passed (${required.length + 13} rules).`);
