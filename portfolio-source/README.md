# Omar Aboelella portfolio

Static Astro portfolio (seven pages plus five project tours), redesigned in October 2026 as **v4 Studio**:
soft studio greys, white surfaces, black type and one electric-blue accent (#1f4bff), with a deep-navy contact band;
Onest display type and JetBrains Mono spec labels. Read [CLAUDE.md](CLAUDE.md) first. The
previous revision's README is kept as [OMAR-README.md](OMAR-README.md) for history only.

- **v7 (October 2026):** the hero robot is Omar's Higgsfield-generated mascot
  (AI-generated, not Omar), loaded from Higgsfield's CDN (`src/data/robot.ts`;
  files in `public/robot/` override it). Every time the homepage opens it
  turns its head to you and waves once, then holds, breathing, turning toward
  your pointer. (v8 replaced this robot and its greeting; see below.) The Pause motion control was removed
  at the user's request; `prefers-reduced-motion` is honoured everywhere
  (poster only, no loops, no scroll effects). Current Digis Squared work:
  INOS and OctiMind alongside KATANA (technology selection, audits, business
  and product strategy).
- **v8 (October 2026): the opening.** On the first homepage view of a browser
  session (sessionStorage `omar-intro`, decided before first paint by an
  inline script in `index.astro`; JavaScript only) a full-screen intro plays
  (`Intro.astro`, `src/scripts/intro.ts`): the glossy sphere head transforms
  into Otto, Omar's robot (Higgsfield clips, URLs and timings in
  `src/data/robot.ts`), he turns to look at you and asks "Do you want to see
  the work?". "Yes, show me" plays his hands-together burst of light into the
  white light gate, which dissolves into the homepage; "Contact Omar" opens
  the contact page through the gate; "Skip intro" or Esc fades straight to
  the homepage. Reduced motion, Save-Data / 2g / 3g, a CDN that does not
  answer within 2.5 s or a video error: no clips, the robot still (or the dark
  HUD stage) with the question. Later views: no intro; the hero shows the
  robot still, "Say hi to Otto" makes him move (v9, below), "Replay intro" plays
  the intro again. The light gate plays the same clip from 3.4 s for 0.7 s.
- **v9 (October 2026): Otto.** The robot is named Otto: "Hi — I'm Otto,
  Omar's robot." In the intro he now asks with a new clip (ASK): he turns to
  you and presents the question with an open hand, and the question, "Do you
  want to see his work?", appears as his palm opens toward it, much bigger
  (about 1.4× on desktop, as big as fits in two or three lines on phones)
  with a bigger, glowing "Yes, show me". In the hero, "Say hi to Otto" plays
  his moves in turn: a wave, a heart made with his hands (glowing red), then
  he looks at you and holds; clips load only when you reach for him (hover,
  focus, press). On a capable device he may wave once if the hero sits idle
  for ~20 s. **Weaker phones:** a capability tier set before first paint
  (`html[data-tier="lite"]` for ≤ 4 GB memory, ≤ 4 cores (not on iPhones,
  whose browser caps the count), Save-Data or a 2g/3g connection;
  `?tier=lite|full` to try either) keeps the same design but drops what
  costs most: no intro or gate clips (the intro assembles Otto from his two
  stills in CSS), no backdrop blur, blending, cursor ring, tilt, pins or
  scroll scrub, ambient light at rest, short reveals. Every device gains
  render-on-demand sections (`content-visibility`), heroes that pause off
  screen, layout-free pointer handlers and responsive WebP plates. Numbers
  below.
- **Hero:** who I am in one line, See my work / Book a lesson / Contact me, the
  robot (abstract CSS orb as its loading/CDN-down fallback), spec chips that
  count up, and four big doors underneath: Work, Skills, Lessons, Contact. No
  chat.
- **The light gate:** choosing a door, card or main call to action plays "the
  robot opens it": two light seams meet like hands, white light bursts open,
  and the next page rises out of the white. Ordinary links get a quick white
  rise. Reduced motion gets a short fade.
- **Everywhere:** a Contact pill in the sticky header on every width, a
  ⌘K / Ctrl+K command menu (quick links, pages, case studies, tours, copy email,
  CV, LinkedIn, GitHub). No Pause motion switch (removed at the user's
  request); reduced motion is honoured.
- **Every page:** a studio hero (numbered eyebrow, word-by-word title,
  counting spec chips, drifting light, a watermark word), sliding marquees,
  slides, wipes and scroll-drawn lines, sticky storytelling where it helps
  (the BP pipeline on Automations, stacking questions on Research, the tour
  chapter rail), and a navy contact band with the email, Write to Omar and
  the next page.
- **Projects:** a server-rendered project index with a sticky duotone preview
  pane, area filters and a remembered list/grid switch, case studies with explicit stage notes, and a
  capability matrix linking each skill to where the CV shows it in use.
- **Enquiries:** tutoring and contact journeys that validate step by step and
  end on a check-your-answers review. They prepare an email the visitor sends
  themselves; nothing is sent, stored or booked by the site.

```sh
npx pnpm@11.11.0 install --frozen-lockfile --ignore-scripts
npx pnpm@11.11.0 run check:portfolio
npx pnpm@11.11.0 run build
npx pnpm@11.11.0 run preview --host 127.0.0.1 --port 4174
```

Node >=22.13 is required. Build output is `dist/`; no backend is required.

## Verification

```sh
node scripts/qa-content.mjs   # after build: honesty wording, personal data, budgets
PORTFOLIO_QA_URL=http://127.0.0.1:4174 \
PLAYWRIGHT_EXECUTABLE=/path/to/chromium \
AXE_PATH=/path/to/axe-core/axe.min.js \
NODE_PATH=/path/to/node_modules/with/playwright node scripts/qa.cjs
```

Playwright and axe-core are intentionally not project dependencies, so the
lockfile stays unchanged; point `NODE_PATH`/`AXE_PATH` at an isolated install.
`qa.cjs` covers 7 routes and 5 tours × 5 widths, axe WCAG 2.2 AA at 390 and
1280, links and legacy anchors, no-JS readability (the doors are real links),
the light gate (leaving page opaque white, arriving page white at first paint
and revealed within 1.5 s, the reduced-motion fade, same-page doors, bfcache,
the robot's clip within the click → pagehide budget), the intro (first
view, transform → question, focus on Yes, Yes → homepage with no layout
shift, second view none, Replay intro, Skip and Esc, Contact, reduced motion,
Save-Data and CDN-blocked paths, no-JS, axe at 390 and 1280), the hero robot
(no autoplay, Say hi by click, keyboard and tap holds the facing-you frame,
forced-colours focus ring, pointer turn, reduced motion / Save-Data still
only; H.264 unsupported, clip 404 and still 404 fallbacks; no layout shift), no Pause control anywhere and reduced
motion stopping every loop and scroll effect, Contact in one tap from
every page, the command menu, the project index and matrix, the mobile menu,
both enquiry journeys, the interior heroes and contact bands, scroll
reveals finishing visible on every page, the scrollytelling, scroll-spy and
contact topic shortcuts, gate hops from interior pages, and LCP/CLS with
and without the intro, with stand-ins and with the CDN blocked (the LCP must
never be third-party media).

The robot's CDN is never contacted by QA: `qa.cjs` serves local stand-ins
(generated with ffmpeg into `.qa/robot8`, or `QA_ROBOT_MEDIA=<dir>` with
orb.webp, robot.webp, transform.mp4, look.mp4, ask.mp4, wave.mp4, heart.mp4
and optionally look-h264.mp4). Never commit stand-in media. Checks run as a
capable device (8 cores, 8 GB) unless they ask for the lite tier; v9 adds
the tier detection and overrides, the lite homepage (no clips requested, no
cursor, pins, scrub or blur), the lite intro end to end, the ASK-timed
question, the hero's WAVE → HEART → LOOK cycle and on-intent prefetch (a
touch scroll starting on Otto fetches nothing; the idle wave fetches only
WAVE), the speech box with its first letter, the ring glow only after ASK,
the ASK pan (palm on screen, copy clear of his helmet), Yes's flare cut into
LOOK, the question size and fit at 360/390/1000/1440 for the still and ASK
framings, and lite LCP/CLS/TBT budgets (homepage with and without the
intro, /work and /inside/katana).

## Performance (v9)

Measured before (v8, c74f8b7 content) and after (v9) on the same machine with
Playwright Chromium (headless, software rendering), CDP CPU throttling and
network emulation (Slow 4G: 150 ms RTT, 1.6 Mbps; Fast 3G: 562 ms, 1.44
Mbps), the built site served with gzip like GitHub Pages, the robot CDN
answered with the local stand-ins (as in QA), median of 3 runs. "Low phone" =
390×844, DPR 2.75, mobile + touch, `deviceMemory` 3 GB and 4 cores (so v9
picks the lite tier); "capable phone" = DPR 2, 8 GB, 8 cores (full tier).
Homepage runs are later views (no intro) unless marked. Scroll smoothness is
the main-thread rAF frame time while wheel-scrolling the page (headless
Chromium cannot synthesise touch scrolls); software rendering exaggerates
compositing work (blur, blending), so real GPUs do better on every row.

| Scenario | Tier (before → after) | LCP ms | TBT ms | CLS | Main thread ms | Style+layout ms | JS / CSS KB (gz, transferred) |
|---|---|---|---|---|---|---|---|
| Low phone, homepage (later view), 6× CPU, Slow 4G | full (no tiers) → lite | 2552 → **1580** | 0 → **0** | 0 → 0 | 4685 → **1792** | 2252 → 894 | 7.7 / 27.8 → 10.8 / 28.9 |
| Low phone, homepage, 4× CPU, Fast 3G | full (no tiers) → lite | 2220 → **1916** | 115 → **0** | 0 → 0 | 3700 → **1361** | 1566 → 678 | 7.7 / 27.8 → 10.8 / 28.9 |
| Low phone, /work, 6× CPU, Slow 4G | full (no tiers) → lite | 2008 → **1380** | 14 → **0** | 0 → 0 | 4520 → **2151** | 2085 → 943 | 4.9 / 23 → 5 / 23.4 |
| Low phone, homepage first view (intro), 6× CPU, Slow 4G | full (no tiers) → lite | 2868 → **1740** | 788 → **0** | 0.0022 → 0.0017 | 10285 → **4369** | 2082 → 1070 | 7.7 / 27.8 → 10.8 / 28.9 |
| Capable phone (full tier), homepage, Slow 4G | full (no tiers) → full | 912 → **844** | 0 → **0** | 0 → 0 | 1049 → **373** | 314 → 148 | 7.7 / 27.8 → 10.8 / 28.9 |
| Desktop 1440 (full tier), homepage | full (no tiers) → full | 492 → **440** | 55 → **51** | 0.0029 → 0.0029 | 812 → **663** | 256 → 190 | 7.7 / 27.8 → 10.8 / 28.9 |

| Scroll (rAF frame times while wheel-scrolling ~9000 px) | Tier after | p95 frame ms | dropped frames |
|---|---|---|---|
| Low phone 390×844, homepage, 4× CPU | lite | 33.4 → **16.8** | 14.2% → **2.5%** |
| Low phone, /work, 4× CPU | lite | 33.3 → **16.8** | 7.7% → **1%** |
| Capable phone, homepage, 4× CPU | full | 33.4 → **33.3** | 15.6% → **10.7%** |
| Desktop 1440, homepage, 1× | full | 33.4 → **33.3** | 14.6% → **13.5%** |
| Desktop 1440, homepage, 4× CPU | full | 50 → **50** | 29.5% → **27.2%** |

Intro on the low phone: question asked after 11244 ms → 5551 ms, clips requested 2 → 0, main-thread script 5377 → 108 ms.

Budgets: lite phone (6× CPU, Slow 4G) homepage LCP ≤ 2.5 s, TBT ≤ 200 ms,
CLS ≤ 0.05 (checked by `qa.cjs` too), scroll p95 ≤ 20 ms at 4× CPU on lite,
full tier no worse than v8, first-load JS ≤ 30 KB gz per page.

Build success does not mean publication. Do not deploy without explicit user
authorisation. Preserve copyright notices, retained credits and personal-data
boundaries (no phone number on pages; the site links the personal GitHub).
