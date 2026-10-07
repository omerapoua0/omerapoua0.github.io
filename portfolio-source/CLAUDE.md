# Omar Aboelella portfolio: Claude Code handoff

## Scope and authority

Work only inside this portfolio project. The user has authorised a source
handoff to Claude Code cloud, not automatic publication, purchases, hosting
subscriptions, new accounts, messages, or enquiries. Do not deploy or push
without a current explicit instruction. Do not ask for passwords or tokens in
chat, import another account's credentials, or use an unrelated GitHub account.
The intended personal GitHub account is `omerapoua0`.

Preserve user changes. Do not reset, clean, or delete unrelated work. Inspect
before editing; use small, reviewable changes. No Supabase or paid service is
required. This is a static portfolio, not a hosted backend.

## Active architecture (v6 "Neon" dark redesign on the v4/v5 structure, October 2026; v7 adds the hero robot)

- Astro 7, TypeScript strict. Node >=22.13; pnpm 11.11.0. React and three.js
  remain declared for lockfile stability, but no page ships a React island or
  three.js (`scripts/qa-content.mjs` fails the build output if three ships).
- Pages: index, work, automations, research, cv, tutoring, contact, plus the
  five project tours `/inside/{katana,nookbase,inos,bitget,bp}.html`.
- `src/data/*.ts`: the single typed source of facts (projects, experience,
  capabilities, site/status vocabulary, `site.linkedin` from the CV header).
- Palette (`src/styles/tokens.css`, DARK ONLY, no theme toggle): near-black
  `#07080b`/`#0b0d12`, raised panels `#12151c`/`#171b24`, hairlines
  `#ffffff14`/`#ffffff2b`, type `#f4f6fb`, muted `#9aa3b5`. Neon accents:
  electric blue (`--blue #2f6bff`; text-safe `--accent #4d84ff`; fills with
  white text `--accent-fill #2d63f2`) is primary (links, primary buttons,
  focus); neon red (`--red #ff2d46`, glow `#ff4d62`) is secondary (HUD ticks,
  highlights, the second neon line); cool white `#e6eeff` for beams, glows and
  the gate. Never put white text on red. No lime (`#d9ff3f`), no green, no
  serif. qa-content checks the dark theme-color/color-scheme on every page.
  Type: big bold uppercase Onest display, JetBrains Mono HUD labels. Pills.
- `src/styles/neon.css`: shared v6 primitives: HUD corners (`span.hud`,
  `var(--hud)`), tick rulers, volumetric `.beams`, `.haze` noise, floating
  `.spec-label`s, `.neon-line` dividers (blue + red, stroke-dashoffset from
  the scroll; every SectionHead has one), `.fill-text` (fills with light as
  you scroll), `.copy-btn` confirm animation, and the scroll-scrub engine:
  `[data-scrub="cover|contain|exit|entry"]` exposes `--p` 0→1 via a CSS view
  timeline (`view(block 0px)`, so scroll-padding doesn't offset it), with
  `scrub.ts` as the IntersectionObserver/rAF fallback. Scrub rules only apply
  under `html.js` + no reduced motion; at rest the page is static and
  readable. IMPORTANT: write scroll-driven animations as
  longhands (`animation-name` … `animation-timeline`); the minifier folds an
  `animation` shorthand + timeline into an invalid declaration (qa-content
  checks this).
- `src/layouts/Base.astro`: metadata, JSON-LD, header, footer, LightGate, a
  `head` slot (the homepage puts its CDN preconnect there) and the inline
  head script (marks a light-gate arrival).
  No floating Contact pill: the sticky header's Contact is the one tap
  everywhere (the pill covered copy on phones).
- **Homepage** (`index.astro`): `HomeHero.astro` inside `.hero-pin`
  (one-line who, uppercase display title with staggered word reveal, See my
  work / Book a lesson / Contact me, the robot (see "The hero robot" below),
  HUD spec chips that count up, sweeping beams, haze, HUD frame + tick ruler, floating spec
  labels, pointer-parallax grid, outlined OMAR watermark). Desktop pins the
  hero for ~55vh of scroll: title lines split and slide apart, copy fades,
  the robot scales up and drifts to centre, then it releases; phones get the
  split without the pin. Then the four doors (Work, Skills →
  `/index.html#skills`, Lessons, Contact; real links; hover/focus lifts them,
  draws a blue + red neon outline and runs a destination ticker), then
  `HomeSections.astro`: skills marquee (speeds up with scroll velocity),
  "What I do" (Build / Reason / Teach sticky storytelling, `[data-scrolly]`,
  a HUD visual whose neon diagram draws per chapter, and a progress rail),
  selected work as a horizontal gallery (`[data-hgallery]`: pinned and driven
  by vertical scroll on desktop with motion; a native snap scroller on touch,
  narrow screens and reduced motion; `scrub.ts` scrolls the page to a
  card focused by keyboard), skills with evidence (`CapabilityMatrix`),
  lessons, about (statement fills with light), and the contact band. `fx.ts`
  (site-wide): card tilt, magnetic pull on every `.btn` and `[data-magnetic]`,
  cursor-follow spotlight (`[data-glow]`), pointer parallax on heroes
  (`[data-pointer-parallax]` sets --mx/--my), and marquee lean + playbackRate
  from scroll velocity. `cursor.ts`: neon ring that grows over links, becomes
  an "Open" pill over gate links/cards, hides over text fields.
- **Interior pages** (v4 structure, v6 neon look). Shared parts: `PageHero.astro` (numbered
  eyebrow "01/07", huge uppercase title with staggered word reveal, lede,
  calls to action, optional aside card, counting HUD spec chips, sweeping beams,
  haze, HUD frame, tick ruler, spec labels, drifting blue/red light,
  pointer-parallax grid, outlined watermark word), `Marquee.astro`
  (aria-hidden sliding words; the facts are also on the page as text),
  `ContactBand.astro` (blue-black neon band with beams and HUD frame: mailto + copy, Write to Omar pre-set to a
  topic, LinkedIn, GitHub, and a "Next" page link; it closes every page but
  home and contact, and hides the footer's big CTA), `SectionHead` (blue
  number pill), and `src/styles/studio.css` (panels, eyebrow pills, reveal
  variants `data-reveal="left|right|scale|wipe"`, `data-reveal-stagger="…"`
  passes its value to children, scroll-driven `data-fx="parallax|grow-x|
  grow-y|slide-x"`, and the reading-progress line on top of the header).
  - Projects: fanned plate deck, stack marquee, the restyled `ProjectIndex`
    (pill filters, card rows, sticky pane) and `CaseStudy` panels with a
    sticky drifting plate and "Open the tour".
  - Automations: live schematic card; sticky scrollytelling of the BP
    pipeline (`[data-scrolly]` + `[data-scrolly-step]`, site.ts sets
    `data-at`); offer cards that open the form pre-filled; principles on a
    line that draws as you scroll.
  - Research: the five questions as cards that stack (sticky) on desktop.
  - About & CV: portrait card with parallax, profile facts, two timelines
    whose rail draws on scroll, education cards, skills marquee and pills.
  - Lessons: tutor card, promise cards, levels path, five-step process line,
    the guided enquiry, FAQ cards, and a small band for non-lesson enquiries.
  - Contact: navy "Direct" card (mailto + copy, LinkedIn, GitHub, CV, lessons
    shortcut), topic shortcuts (`?topic=…#write` pre-select the form), the
    guided message form.
  - Tours: hero with word reveal and the project name as watermark, stack
    marquee, sticky chapter rail with scroll-spy (`[data-spy]`), chapter
    cards (the stage chapter is navy), prev/next tour cards with plates, and
    a band whose Next is the next tour.
  `site.ts` also handles copy-email buttons (`[data-copy-email]`), scroll-spy
  and scrollytelling.
- **The neon light gate** ("the robot opens it"): `LightGate.astro` +
  `gate.ts`. Doors, cards and primary CTAs (`[data-open]`, optional label
  value) play the full open: a red neon seam from the left and a blue one from
  the right close like hands at the click point, a cool-white burst with a
  red/blue rim fills the screen, label + red→blue line run. Other links play
  the quick variant: a near-black veil with a cool-white scan line. gate.ts
  navigates only once the layer's animation has finished (opaque), after
  writing sessionStorage `omar-gate` {t, path, label, m}; the Base head script
  marks `html[data-gate="in"]` (+ `data-gate-mode="quick"`) before first
  paint so the next page starts white (open) or dark (quick) and dissolves
  (~0.5 s) while `main`'s first blocks stagger in; the header stays put. A door to
  a section of the same page opens, jumps, reveals. bfcache restores are never
  white. There is no cross-document view transition (removed on purpose).
  Reduced motion: a 160 ms fade out, 200 ms fade in.
  `window.__gate(href, mode)` is used by the command menu.
- **The hero robot** (v7, `RobotStage.astro` + `src/scripts/robot.ts`,
  media and timings in `src/data/robot.ts`). Omar's mascot (not Omar): a
  glossy black humanoid with a black visor, white eye lights, red neon on its
  left and blue on its right, generated for Omar with Higgsfield. The poster
  (1344×752 webp) and two H.264 clips (greet: head turn + wave, 5.04 s; open:
  hands together → burst of light) are public, immutable files on
  Higgsfield's CDN (`d8j0ntlcm91z4.cloudfront.net`, range requests OK);
  visitors' browsers load them from there (the homepage preconnects; gate.ts
  adds a preconnect on the first pointer move elsewhere). Files in
  `public/robot/` (hero.webp, greet.mp4/.webm, open.mp4/.webm) override the
  remote ones at build time (existsSync). Never commit stand-in media.
  - Layout: desktop, big on the right, its frame bleeding behind the copy,
    sized so the waving hand clears the copy; phones/tablets, full width
    above the copy (a taller crop via `--canvas-right`). Edges dissolve via
    an intersected linear+radial mask and `.hero__robot` is blended with
    `mix-blend-mode: lighten`, so the media's near-black backdrop gives way to
    the hero's own beams and glows (no frame edge); the hero grid has a soft
    hole where the robot stands.
  - "Interacts whenever you open": robot.ts attaches the clip after the load
    event and plays greet once from 0 on every load (also via the gate), on a
    bfcache restore and when the hero re-enters view after leaving it; then it
    holds the last frame (facing you) with a CSS idle (breathing scale, neon
    rim and beam pulsing). Fine pointers: spring-smoothed 3D turn toward the
    pointer (`--rx/--ry`) and a light that follows it; touch: a slow ambient
    sway. The `<button>` "Say hi to the robot" (cursor label "Say hi"; a HUD
    focus frame) replays the wave. A replay cross-fades from the held frame
    to the poster (the first frame) first.
  - Fallbacks: reduced motion or Save-Data → poster only, the wave plays only
    when pressed; no H.264 / source error / refused play / stall → the poster
    stays, the button and tilt keep working; poster fails (CDN down) → the
    abstract CSS orb (PLACEHOLDER, kept on purpose) shows instead. With JS
    the decoded poster is painted into a `<canvas>` so the third-party image
    is never an LCP candidate (the page's LCP stays text); without JS the
    `<img>` shows. State attributes: `data-poster`, `data-still`,
    `data-video`, `data-greet`.
  - Gate: `LightGate.astro` always carries the open clip (`data-seek` =
    OPEN_SEEK 3.2 s, palms pressed; `data-play` = 1400 ms through the burst,
    then the gate's white takes over). Warmed and parked on hover/focus of a
    `[data-open]` link (fine pointers, no Save-Data); it plays only if
    buffered and parked on that frame, otherwise the CSS seams play. A stale
    "missing src" source error is ignored (only no usable source or a media
    error counts). Layer order: clip < white < HUD.
  - QA: the CDN is unreachable from CI containers; `qa.cjs` answers it with
    local stand-ins (VP9-in-MP4, which Playwright's Chromium accepts for the
    .mp4 URLs, plus an H.264 copy for the "unsupported" path) generated with
    ffmpeg into `.qa/robot` or taken from `QA_ROBOT_MEDIA`, with byte-range
    support so the gate can seek.
  Never draw a cartoon robot or bring back the old Otto.
- Header (`SiteHeader.astro`): dark glass bar, black-orb brand mark, pill
  nav, ⌘K search, blue Contact pill on every width, mobile sheet. Footer:
  dark; its big CTA is hidden on the homepage (the contact band
  replaces it). `CommandPalette.astro` + `palette.ts`: Quick links, pages,
  work, tours, copy email, CV, LinkedIn, GitHub. No chat or Ask items.
- Project tours: `src/pages/inside/[id].astro`, static, dark: hero with the
  concept visual, chapter rail (anchor links), five chapters, prev/next tours.
- **No Pause motion control** (removed at the user's explicit request, Oct
  2026: the hero/page-hero/tour/footer/menu switches, `hero-motion.ts`,
  `html[data-motion]`, `omar:motion` and the `omar-motion` session key are
  gone; qa-content fails the build output if any returns). Do not re-add it
  unless the user asks. `prefers-reduced-motion` is the motion opt-out and
  must stay complete: every infinite loop sits behind
  `prefers-reduced-motion: no-preference`, and reduced motion also releases
  the hero pin, the pinned gallery and every scroll scrub, hides the cursor
  ring, stops count-ups and robot autoplay (QA checks
  `document.getAnimations()` on every page and a dedicated scroll test).
- Other: `ProjectIndex`, `CaseStudy`, `ProjectMedia` (duotone plates),
  `CapabilityMatrix`, `Timeline`, `Figure`, `SectionHead`;
  `site.ts` (menu sheet, header shadow, floating pill, reveals, count-up),
  `forms.ts`, `project-index.ts`, `previews.ts`, `cursor.ts`.
- The old Otto chat/robot system (OttoHero, otto-chat/stage/handoff/take,
  otto3d, Robot, OttoCover, data/otto.ts, data/agent.ts), Orbit, Columns,
  Stats, Ticker, slider, `PageIntro` and `home.ts` were removed in v4.

The CrafterUI wheel was replaced at the user's request for a full redesign;
keep its MIT notice in THIRD-PARTY-NOTICES as previously distributed code.

## Important behaviour

There is no chat UI anywhere and no "do you want to discover?" copy: copy is
direct and specific, and contact is always one tap away (header pill on every
page, floating pill on phones). Doors and cards are real links; everything
reads without JavaScript (the gate never covers a no-JS page). There is no
Pause motion switch (the user removed it; reduced motion is honoured
everywhere), first-load JS
<= 30KB gz per page, and smooth GPU-friendly motion (transforms/opacity).

The project index must keep server-rendered links that work without JS,
keyboard focus parity with hover, and no scroll hijacking. Concept visuals stay
labelled "Concept visual, not product footage".

Enquiry forms validate and prepare an editable `mailto:` email (with copy and
Gmail fallbacks and a length guard). They do not
send, store, authenticate, reserve a lesson, or confirm a booking. Never show
"Sent" or a confirmed booking unless a real service has actually succeeded.

## Facts and honest attribution

Use the current CV and page copy as supplied facts, not permission to invent
clients, achievements, publications, qualifications, returns or testimonials.
Omar studies BSc Computer Science & Mathematics at Birkbeck, expected 2028.
A PhD, optimisation, quantitative finance and quantum computing are research
interests/aspirations, not completed degrees or published research. NOOKBASE is
in development: pre-launch with around 150 beta users (user-approved, from the
CV). The user confirmed the tutoring promises shown (enhanced DBS, free 15-minute
intro call, reply within one working day, parents may sit in). The site links the
personal GitHub `omerapoua0`; the CV's separate work GitHub stays in the PDF only.
No phone number on pages. KATANA's Level 4 autonomy is a programme direction, not a
completed individual achievement. Current Digis Squared work (user-stated, Oct
2026): as AI Product Engineer Omar works on INOS and OctiMind together with
KATANA: technology selection, (technical and security) audits, and business
and product strategy. His earlier INOS/OctiMind traineeship (Sep 2024 – Mar
2025) was part of wider R&D; the products are Digis Squared's, built by a
wider team. No invented metrics, clients or outcomes. The CV PDF predates
this and is not edited. The hero robot is an AI-generated mascot, not Omar.
Do not claim trading performance or provide investment recommendations.

Project videos are concept visuals, not actual product recordings. Omar's real
portrait is used on About & CV and as the hero avatar (sized crops
portrait-hero/portrait-avatar, and the head-and-shoulders portrait-bust).
Never generate or alter a face/body or present stock actors as Omar. Marks retain
their respective owners' rights. Retain LICENSE and both notices (including the previously used film credits).

## Development

```sh
corepack prepare pnpm@11.11.0 --activate
pnpm install --frozen-lockfile --ignore-scripts
pnpm run check:portfolio
pnpm run build
pnpm run preview --host 0.0.0.0 --port 4174
```

If Corepack is unavailable, use `npx pnpm@11.11.0` for the same commands.
`dist/` is the static output. All personal GitHub Pages publication remains
pending; a successful local build is not deployment evidence.

Browser QA (`scripts/qa.cjs`) runs on Linux with an isolated Playwright and
axe-core supplied through `NODE_PATH`, `PLAYWRIGHT_EXECUTABLE` and `AXE_PATH`
(see README). `scripts/qa-content.mjs` checks the built output. Neither adds
project dependencies. Do not report browser QA as passed until actually run.

## Acceptance checks after changes

Check seven routes and the tours at phone/tablet/desktop widths, the light gate, accessible
keyboard navigation, no overflow or broken assets, no-JS links, media playback
and fallbacks, project index/matrix interaction, and form validation/review/edit. Verify all
facts, credits and true delivery status. Make the user-facing result concise.
