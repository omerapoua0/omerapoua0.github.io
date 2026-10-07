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
  into OA-01, Omar's robot (Higgsfield clips, URLs and timings in
  `src/data/robot.ts`), he turns to look at you and asks "Do you want to see
  the work?". "Yes, show me" plays his hands-together burst of light into the
  white light gate, which dissolves into the homepage; "Contact Omar" opens
  the contact page through the gate; "Skip intro" or Esc fades straight to
  the homepage. Reduced motion, Save-Data / 2g / 3g, a CDN that does not
  answer within 2.5 s or a video error: no clips, the robot still (or the dark
  HUD stage) with the question. Later views: no intro; the hero shows the
  robot still, "Say hi to OA-01" makes him look at you, "Replay intro" plays
  the intro again. The light gate plays the same clip from 3.4 s for 0.7 s.
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
orb.webp, robot.webp, transform.mp4, look.mp4 and optionally look-h264.mp4). Never commit
stand-in media.

Build success does not mean publication. Do not deploy without explicit user
authorisation. Preserve copyright notices, retained credits and personal-data
boundaries (no phone number on pages; the site links the personal GitHub).
