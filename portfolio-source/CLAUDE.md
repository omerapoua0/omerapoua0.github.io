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

## Active architecture (v6 "Neon" dark redesign on the v4/v5 structure, October 2026; v7 adds the hero robot, v8 the opening intro, v9 names him Otto, gives him moves and a lite tier for weaker phones, v10 gives him a voice and fits every screen size)

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
  `head` slot (the homepage puts its CDN preconnect there) and two inline
  head scripts: the capability tier (below) and the light-gate arrival.
  No floating Contact pill: the sticky header's Contact is the one tap
  everywhere (the pill covered copy on phones).
- **Capability tier (v9, performance on weaker phones).** Before first
  paint the head script sets `html[data-tier="lite"]` when
  `navigator.deviceMemory <= 2`, `hardwareConcurrency <= 2` (ignored on
  Apple WebKit, which caps it for privacy: iPhones stay full), Save-Data, or
  `effectiveType` slow-2g/2g; otherwise `"full"` (v9 used 4 GB / 4 cores / 3g,
  which put good phones on lite: the user lost the transition). The user's
  rule (Oct 2026): keep the transition on every device; lite only trims other
  effects. `?tier=lite|full`
  overrides it for the session (sessionStorage `omar-tier`; QA). Full tier =
  the unchanged experience. Lite (`src/styles/tier.css` + script checks): the
  intro still plays the real clips (v9.1), no
  cursor ring / magnetic pull / tilt (`cursor.ts`, `fx.ts`), no
  backdrop-filter, no screen/lighten blending or haze, beams/glows/labels/
  marquees at rest, no pinned/scrubbed hero or gallery (native snap
  scroller; `neon.css` scrub, `scrub.ts`), short opacity/translate reveals,
  no scroll-driven decoration, no preview videos (`previews.ts`), no gate
  clip and a lighter gate, robot moves only on an explicit tap, no idle
  wave. Every tier: below-the-fold blocks use `content-visibility: auto`
  (+ `contain-intrinsic-size: auto …`, tier.css; the pinned gallery opts
  out), heroes pause their loops off screen (`[data-offscreen]`, site.ts),
  pointer handlers cache boxes and write once per frame (fx.ts), marquee
  animations are looked up once per band, project plates ship 800w/1120w
  WebP (`ProjectMedia`, srcset/sizes). Lite interior heroes and tours
  show their copy and media at first paint (only the title's word slide-up
  stays), so a delayed fade never holds back LCP. Budgets (README table): lite phone at
  6× CPU + Slow 4G homepage LCP ≤ 2.5 s, TBT ≤ 200 ms, CLS ≤ 0.05; scroll
  frame-time p95 ≤ 20 ms at 4× CPU; full tier no worse than v8. The intro
  question is painted (opacity .004) from the first frame so LCP is decided
  at load. Do not add per-frame layout reads, filter/box-shadow animations
  on large areas, or new always-on loops.
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
- **The robot and the opening** (v7 hero robot, v8 intro, v9 Otto's moves;
  media, framing and timings in `src/data/robot.ts`). **Otto**, "Omar's
  robot" (named at the user's request in v9: "Hi — I'm Otto, Omar's robot.";
  the mascot, never Omar; keep "Omar's robot" in copy; no "OA-01" anywhere,
  qa-content checks): a glossy black humanoid with red
  neon contour lines and a red ring emitter on the side of its head,
  generated for Omar with Higgsfield (AI-generated, original design). Public,
  immutable files on Higgsfield's CDN (`d8j0ntlcm91z4.cloudfront.net`, range
  requests OK; the homepage preconnects, gate.ts adds a preconnect on the
  first pointer move elsewhere): ORB still (sphere head, start frame), ROBOT
  still (end frame; the hero poster), TRANSFORM clip (1280×720, 5.06 s: orb
  → robot) and LOOK clip (1344×768, 5.18 s, 5.7 MB: turns to you 0–1 s,
  holds to 2.3, hands up, palms together ≈ 3.0–3.5, light burst, white by
  ≈ 4.6). v9 moves (1280×720, 5.06 s, ≈ 1.2 MB each, all starting on the
  ROBOT still): ASK (turns to you 0–0.8, right hand presents toward screen
  left 1.7–3.75, holds facing you 4.2–5.06), WAVE and HEART (both return to
  the still). `public/robot/` files (orb.webp, robot.webp, transform.mp4/.webm,
  look.mp4/.webm, ask/wave/heart.mp4/.webm) override them at build time.
  Never commit stand-in media. The user loves the robot and the design: do
  not redesign either.
  The v7 media (design #1) are gone everywhere (qa-content checks).
  - **Intro** (`Intro.astro`, `src/scripts/intro.ts`): every fresh open or
    reload of the homepage (v9.1, "whenever you open"): an inline head script
    in `index.astro` sets `html[data-intro-on]` before first paint unless the
    navigation is back/forward or the referrer is another page of this site.
    The transform may take up to 8 s to start on mobile data (status "Waking
    up") before the still path; if autoplay is refused (NotAllowedError, e.g.
    iOS Low Power Mode) a "Tap to wake Otto" button on the orb plays it; without JS the layer
    is `display:none`. Stages (`data-stage`): boot (ORB still, HUD, "Otto ·
    online" typing, Skip intro + Contact top right) → transform (clip, red
    scan line, ticks, "Assembling") → ask with the ASK clip (`data-clip=
    "ask"`, cross-faded over the shared robot frame with its measured fit;
    `data-moving` while it plays; on landscape screens the frame pans to
    `--px-ask` while he turns, so his open palm (frame x 7–22%) shows by the
    copy under a lighter left shade, and the desktop column is capped left
    of his helmet (`--head`: 45% facing you, 55% for the still); on portrait
    phones the palm cannot fit, so the lite tier's light hint runs from him
    to the question instead): "Hi — I'm Otto, Omar's robot." types from ASK.say 1.0 s and the
    big question "Do you want to see his work?" appears at ASK.question
    2.1 s as his palm presents it (the speech box appears with its first
    letter, never empty while he turns), with "Yes, show me" (focused, big, glowing)
    and "Contact Omar" (gate to /contact.html), announced in an aria-live
    region; he holds on ASK's last frame facing you (breathing, ring glow at
    RING.ask only once ASK has ended, pointer tilt) while LOOK is fetched and
    parked at 2.3 s → go (no LOOK frame matches ASK's end pose, so not a
    cross-fade: a light flare rises over him, `data-flare` up → down, and
    LOOK at 2.3 s cuts in under its 150 ms peak; on to white at 4.6 s). Without a playable ASK: the
    v8 path (look: LOOK from 0 paused at LOOK.hold 1.6 s, then ask). The
    question is ~1.4× v8 on desktop (cqw/cqh sized: 2–3 lines on phones,
    clear of his head) → white → `gate.ts` `reveal()`: the
    gate's white dissolves into the homepage while the hero's paused
    entrance animations play (they are paused under `html[data-intro-on]`).
    Then the intro is removed, the page un-inerted, focus on `<main>`. Skip /
    Esc: 300 ms fade. All pictures are drawn into one canvas with each
    source's measured fit (s, dx, dy) so hand-overs line up and no
    third-party media is ever the LCP (text is). The rest of the page is
    inert and does not scroll during the intro, and `<main>` is
    `content-visibility: hidden` under it (not laid out or painted until the
    hand-over; no script may force its layout meanwhile, e.g. no
    `offsetWidth` reads in robot.ts).
  - Lite path (`data-path="lite"`, Save-Data or 2g without reduced motion; v9.1): no
    clips; the ORB and ROBOT stills painted once each into two canvases, a
    CSS assemble (stage `assemble`: clip reveal in step with the scan line,
    ring glow, ≈ 2 s), the question with a CSS light hint running from Otto
    to it, Yes = the gate's CSS open (`cover()`).
  - Fallback ("still" path, `data-path="still"`): reduced motion (Yes = 200 ms
    fade), the transform not playing within 8 s, or a
    video error: no clips, the ROBOT still (or the dark HUD stage if the CDN
    is unreachable) with the question; Yes plays the gate's CSS open
    (`cover()`) and the same reveal. LOOK is fetched only once the transform
    plays; if it is not playable at the end, the still holds and Yes uses the
    CSS open.
  - **Hero** (`RobotStage.astro`, `src/scripts/robot.ts`): the ROBOT still
    (painted into a canvas, so never LCP), big on the right on desktop, full
    width above the copy on phones, edges dissolved by masks and `lighten`
    blending; breathing idle, red ring/neon glow, spring pointer tilt
    (cached rect), touch sway. No autoplay during load. "Say hi to Otto,
    Omar's robot" (a real button; HUD focus frame, a real outline in forced
    colours; an sr-only live line says the move) plays his next move in
    turn: WAVE → HEART → LOOK (0 → 1.6 s, held facing you) → WAVE…; WAVE and
    HEART end on the still (invisible cut back). Clips are `preload="none"`
    and fetched on intent only (mouse/pen hover or pointerdown, or keyboard
    focus, on Otto prefetches the next move; on touch only the tap fetches,
    since a finger landing on him may be a scroll; after a real press the
    following one is warmed, never after the idle wave; lite: only the tap
    fetches). ASK, WAVE and HEART carry a measured fit (s 1.0125, dx 12,
    dy 26: the transform's framing, not the stills'); keep it when clips
    change, or the still ↔ move hand-overs jump. One idle surprise (full tier, motion allowed, no
    Save-Data): after ~20 s of the hero in view with no input he waves once
    per page view. Stage state: `data-move`, `data-moves`, `data-greet`,
    `data-video`; a failed move is skipped. "Replay intro" clears the flag and
    reloads. Fallbacks: no H.264 / error / stall → the still stays; still
    fails → the abstract CSS orb (PLACEHOLDER), which "Say hi" flares.
  - Gate: `LightGate.astro` carries LOOK (`data-seek` OPEN_SEEK 3.4 s,
    `data-play` OPEN_PLAY_MS 700, white over the last 260 ms, ≈ 0.8 s to
    navigation, within the qa.cjs click → pagehide budget). Warmed and parked
    on hover/focus of a `[data-open]` link (fine pointers, no Save-Data);
    plays only if buffered and parked, otherwise the CSS seams.
  - QA: the CDN is unreachable from CI containers; `qa.cjs` answers it with
    ffmpeg stand-ins in `.qa/robot8` (VP9-in-MP4 incl. ASK/WAVE/HEART, plus
    an H.264 copy for the "unsupported" path) with byte ranges, or blocks it
    ('block' mode). Every check runs as a later homepage view unless it asks
    for the intro, and as a capable device (8 cores, 8 GB) unless it asks for
    `device: 'low'` (lite) — this container reports 4 cores.
  - **Voice** (v10, the user's final call: "Actually put the voice"):
    opt-in only, default OFF. Four pre-recorded lines (Higgsfield Seed
    Audio, preset voice "Archie", AI-generated; WAV 24 kHz on the same CDN;
    `VOICE` in `src/data/robot.ts` with duration, speech span and text):
    INTRO "Hi, I'm Otto, Omar's robot. Do you want to see his work?", YES
    "Great, let's go and see it!", HELLO (with WAVE), THANKS (with HEART).
    `Voice.astro` (homepage only): `<audio preload="none">` with data-src;
    `scripts/voice.ts` attaches a source only when Sound is turned on.
    `SoundToggle.astro`: speaker icon + "Sound", `aria-pressed`, hidden
    without JS, in the intro's top bar (lines "intro yes") and as a HUD chip
    beside Replay intro in the hero (lines "hello thanks"); the toggle click
    is the unlocking gesture (its lines are played muted and paused);
    sessionStorage `omar-sound` remembers it for the session,
    `html[data-sound]`. Intro: INTRO at VOICE_AT 0.9 s into ASK (or as the
    line types on other paths, or at once if turned on while he is
    speaking/asking; once), YES on Yes, faded out after its words over the
    gate (`release`), Skip stops it; the on-screen text is the caption.
    Hero: a user press on Otto speaks the move's line and shows it in a HUD
    caption bubble by his head (`[data-robot-caption]`, aria-live polite)
    for the line's duration; LOOK and the idle wave are silent. One line at
    a time, 120 ms fade in, volume 0.8, failures silent (captions stay),
    works on lite and with reduced motion. QA answers `.wav` with ffmpeg
    tones.
  - **Every screen size** (v10): QA's 29-viewport matrix (phones 320×568 →
    430×932, landscape 844×390/932×430, Z Fold cover 344×882 and inner
    673×841/841×673, Pixel Fold 617×841/841×617, Z Flip, iPad mini/Air/Pro
    both ways, 1280×600 → 2560×1440). Otto's head boxes (`HEAD` in
    src/data/robot.ts, fractions of the frame, measured on the real frames
    in the Higgsfield sandbox: still [.485,.03,.74,.52], ASK [.455,.05,.74,
    .56]; palm x .07–.24) must stay clear of the question (per line), the
    speech line and the buttons. Intro layouts: "stack" for portrait
    (`(max-aspect-ratio: 1249/1000), (max-width: 599px)`): head centred
    (`--hc` .615, ASK .6), frame height ≤ 210cqw and ≤ (--talk-top − 6px) /
    .56 (intro.ts measures the copy with a ResizeObserver), ≥ 56cqw so it
    still covers the width, bottom masked into the dark; "side" for
    `(min-aspect-ratio: 5/4) and (min-width: 600px)`: copy column capped at
    `--head` (.485 still, .45 ASK), `--px` .62, ASK pan `--px-ask` .3;
    short screens (≤ 640 px tall) bottom-anchor the column with smaller
    buttons. Top bar:
    44 px targets everywhere, safe-area insets, narrow phones show the Sound
    icon and "Skip →" (accessible names unchanged). Homepage hero: side by
    side only for `(min-width: 1000px) and (min-aspect-ratio: 1/1)`
    (portrait iPad Pro stacks), a two-column compact hero for
    `(max-width: 999px) and (min-aspect-ratio: 6/5)` (phones/tablets on
    their side), `--hero-h` min(100svh, 1000px). The homepage CSS sits at
    its 30 KB gz budget (qa-content): new homepage CSS must replace, not
    add. The gate is fixed inset 0 with viewport-fit=cover, so
    its white covers the safe areas.
  Never draw a cartoon robot. The name Otto now belongs to this robot; the
  old Otto (v3 SVG robot and chat) stays gone.
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
  ring, stops count-ups and plays the intro without clips (QA checks
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
this and is not edited. The robot (Otto, "Omar's robot") is an AI-generated mascot, not Omar.
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
