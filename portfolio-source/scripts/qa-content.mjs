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
  ['index', /Hi, I’m Otto/, 'No-JS greeting from Otto'],
  ['index', /Answers written by Omar\. No AI model; nothing you choose leaves this page\./, 'Chat disclosure under the choices'],
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

// Size budgets (gzip). First-load JS follows static imports only; the 3D Otto
// (three.js) is a dynamic import fetched after the load event, measured below.
const staticImport = /(?:from|import)\s*["'](\.\/[^"']+\.js)["']/g;
const anyImport = /(?:from|import)\s*\(?\s*["'`](\.\/[^"'`]+\.js)["'`]/g;
const walk = async (entries, pattern, skip = new Set()) => {
  const queue = [...new Set(entries)], seen = new Set();
  let bytes = 0;
  while (queue.length) {
    const asset = queue.shift();
    if (seen.has(asset) || skip.has(asset)) continue;
    seen.add(asset);
    const file = await readFile(path.join(dist, asset));
    bytes += gzipSync(file).length;
    if (asset.endsWith('.js')) for (const match of file.toString().matchAll(pattern)) queue.push(path.posix.join(path.posix.dirname(asset), match[1]));
  }
  return { bytes, seen };
};
const inlineJs = source => [...source.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].reduce((sum, match) => sum + gzipSync(match[1]).length, 0);
const inside = ['katana', 'nookbase', 'inos', 'bitget', 'bp'];
const insideHtml = Object.fromEntries(await Promise.all(inside.map(async id => [id, await readFile(path.join(dist, 'inside', `${id}.html`), 'utf8')])));
// Index: Otto's conversation, voice, stage loader and hand-off plus the motion pass
// (~2.5KB) and command menu. Inside tours: narration plus the stage loader.
const budgets = { index: 34, inside: 22, other: 20 };
let lazy = null;
for (const [name, source] of [...pages.map(page => [page, html[page]]), ...inside.map(id => [`inside/${id}`, insideHtml[id]])]) {
  const scripts = [...source.matchAll(/src="(\/_astro\/[^"]+\.js)"/g)].map(match => match[1]);
  const styles = [...source.matchAll(/href="(\/_astro\/[^"]+\.css)"/g)].map(match => match[1]);
  const first = await walk(scripts, staticImport);
  const js = first.bytes + inlineJs(source);
  const css = (await walk(styles, staticImport)).bytes + [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].reduce((sum, match) => sum + gzipSync(match[1]).length, 0);
  const budget = name === 'index' ? budgets.index : name.startsWith('inside/') ? budgets.inside : budgets.other;
  info.push(`${name}: first-load JS ${(js / 1024).toFixed(1)}KB gz (budget ${budget}KB), CSS ${(css / 1024).toFixed(1)}KB gz`);
  expect(js <= budget * 1024, `${name}: first-load JS ${js}B gz exceeds ${budget}KB`);
  expect(css <= 30 * 1024, `${name}: CSS ${css}B gz exceeds 30KB`);
  // The lazy 3D graph: everything reachable through dynamic imports but not loaded up front.
  const all = await walk(scripts, anyImport);
  const extra = [...all.seen].filter(asset => !first.seen.has(asset));
  const weight = extra.length ? (await walk(extra, staticImport, first.seen)).bytes : 0;
  if (lazy === null) lazy = weight;
  expect(Math.abs(weight - lazy) < 2048, `${name}: lazy JS differs from other pages (${weight}B vs ${lazy}B)`);
  expect(!/rel="modulepreload"[^>]*stage|stage[^"]*"[^>]*rel="modulepreload"/.test(source) && !extra.some(asset => source.includes(asset)), `${name}: the 3D module must not be preloaded`);
}
info.push(`lazy 3D Otto (three.js rig, faces, motion, stage): ${((lazy ?? 0) / 1024).toFixed(1)}KB gz, fetched after load on capable devices only`);
expect(lazy > 40 * 1024 && lazy <= 170 * 1024, `3D Otto chunk ${lazy}B gz outside 40–170KB`);

// Homepage Otto: disclosure and greeting. Inside tours: indexable, in the sitemap, honest caveats.
const sitemap = (await readdir(dist)).filter(file => /^sitemap.*\.xml$/.test(file));
const sitemapText = (await Promise.all(sitemap.map(file => readFile(path.join(dist, file), 'utf8')))).join(' ');
expect(/I’m Otto, Omar’s robot/.test(text.index), 'index: Otto’s greeting missing');
// Choice-only chat: visitors pick replies; there is nothing to type into and no typing copy.
const hero = html.index.slice(html.index.indexOf('data-hero'), html.index.indexOf('</section>', html.index.indexOf('data-hero')));
expect(hero.includes('data-chat-choices') && /<button[^>]*class="otto-choice"/.test(hero), 'index: Otto’s choices missing from the hero');
expect(!/<(input|textarea|select)\b|contenteditable/i.test(hero), 'index: the hero chat must not have a text box');
expect(!/nothing you type|for commands|Type \//i.test(text.index), 'index: typing copy remains');
expect(!/preview-(otto|3d)/.test(Object.values(html).join(' ')), 'A link to a retired preview page remains');
for (const id of inside) {
  const source = insideHtml[id];
  expect(!/<meta name="robots" content="[^"]*noindex/.test(source), `inside/${id}: should be indexable`);
  expect(new RegExp(`/inside/${id}(\\.html)?<`).test(sitemapText), `inside/${id}: missing from the sitemap`);
  expect(/data-otto-stage/.test(source) && /data-stage-mode="dock"/.test(source), `inside/${id}: Otto's dock missing`);
  if (id === 'katana') expect(/programme(’|&#39;|')s direction|programme direction/i.test(source), 'inside/katana: Level 4 caveat missing');
  if (id === 'bitget') expect(/no claim of trading performance|not investment advice/i.test(source), 'inside/bitget: no-performance caveat missing');
  if (id === 'inos') expect(/wider R&amp;D|wider R&D/i.test(source), 'inside/inos: wider R&D caveat missing');
  if (id === 'nookbase') expect(/pre-launch/i.test(source), 'inside/nookbase: pre-launch status missing');
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
else console.log(`Content checks passed (${required.length + 16} rules).`);
