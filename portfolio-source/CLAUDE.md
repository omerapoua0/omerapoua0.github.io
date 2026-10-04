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

## Active architecture ("Proof" redesign, October 2026)

- Astro 7, TypeScript strict. Node >=22.13; pnpm 11.11.0. React remains
  declared for lockfile stability but no page ships a React island. three.js
  (already a dependency) renders the 3D Otto in a lazily loaded chunk.
- Pages: index, work, automations, research, cv, tutoring, contact, plus the
  five inside tours `/inside/{katana,nookbase,inos,bitget,bp}.html`.
- `src/data/*.ts`: the single typed source of facts (projects, experience,
  capabilities, site/status vocabulary). Change facts here, not in markup.
- `src/layouts/Base.astro`: metadata, JSON-LD, font preloads, header, footer,
  the inline head script (restores Pause motion; marks a portal arrival).
- `src/styles/tokens.css`, `base.css`, `layout.css`, `forms.css`; component
  styles are scoped in each `.astro` file. Palette: cool paper/ink + cobalt;
  the dark homepage hero uses a single signal lime (#d9ff3f).
- **Homepage hero: Otto, Omar's robot host** (`src/components/OttoHero.astro`).
  - Stage: `src/scripts/otto-stage.ts` decides per `[data-otto-stage]` (hero
    or inside-page dock) whether to load the 3D Otto: after `load`, idle and
    on screen, with WebGL 2 (no software GL), no Save-Data/2G/low memory, and
    a 3 s deadline. `data-mode` pending → 3d | svg; `?otto3d=off|force` for
    testing; sessionStorage `otto3d` remembers hi/lo/off for the session.
  - 3D Otto: `src/scripts/otto3d/` — `rig.ts` (procedural ceramic robot:
    rounded shell, black glass visor, jointed arms and fingers, thruster),
    `face.ts` (canvas-drawn eyes/mouth and chest screen), `motion.ts`
    (spring-driven director: fly-in, wave, welcome, talk, offer/grab/pull),
    `stage.ts` (renderer, lights, camera, adaptive resolution and frame cap,
    slow-device bail-out, offscreen/hidden-tab pause, `window.__otto` debug).
  - SVG Otto: `Robot.astro` + `robot.ts` (poses via `otto:state`); the poster
    before 3D arrives and the fallback everywhere 3D is not used.
  - Brain: `src/data/otto.ts` + `src/data/agent.ts` (third-person answers,
    follow-up details, social replies, inside cards) and
    `src/scripts/otto-brain.ts` (typo snapping, small talk/troll handling,
    context, multi-intent) via `agent-match.ts`. `otto-chat.ts`: greeting after
    Otto lands, mood dialogue, streaming, persistence, `?ask=`, slash commands.
  - Hand-off: `otto-handoff.ts`. For a project, Otto offers his hand: a big
    "Take Otto's hand" button tethered to his palm on wide screens, a tray
    right under him (his hand reaching down to it) on phones, plus "Stay
    here"/Esc. A 4 s countdown runs only with motion on and pauses on
    hover/focus. Take is one continuous move in every browser, with no view
    transition: the button squeezes into his hand, he grips and pulls, then
    3D: the camera dives into his chest screen ("ENTERING <NAME>",
    `otto3d/stage.ts`) and `OttoCover.astro` grows out of that rectangle;
    SVG: he zooms toward you as a lime iris opens from his chest badge. Only
    once the cover is opaque does the browser go to `/inside/<id>.html`. The
    inline head script in `Base.astro` (sessionStorage `otto-handoff`
    {id, t}) marks `html[data-arrive="portal"]`, so the tour paints the
    identical cover at first paint; CSS then completes the bar, collapses it
    into the tour's monitor (rects measured by an inline script in
    `inside/[id].astro`) and flies a big SVG Otto into his dock; native
    cross-document view transitions are skipped for these page changes.
    "Back to Otto" uses the same cover as a quick shutter (`otto-return`).
    Reduced motion/Pause: a <= 200 ms cover fade on each side, no flight.
  - Events: `otto:state|say|anchor|palm|handoff|handoff-done|ready|landed|fail|mode`,
    `omar:motion|ask|sound`.
- Inside tours: `src/pages/inside/[id].astro` + `inside.ts` (six chapters
  narrated by Otto, chapter rail, Back to Otto/Esc, Otto docked).
- `hero-motion.ts` is the "Pause motion" switch (`html[data-motion]`,
  `omar:motion`, remembered per session). `CommandPalette.astro` +
  `palette.ts`: site-wide ⌘K/Ctrl+K menu (pages, inside tours, Ask Otto).
  `Ticker.astro`, `Stats.astro`, `Orbit.astro` (3D project ring), `Columns`,
  `slider.ts`, `fx.ts`, `cursor.ts`, `[data-reveal]` scroll reveals.
  `ProjectIndex` (filters, list/grid switch), `CaseStudy`, `ProjectMedia`
  (duotone plates), `CapabilityMatrix`, `Timeline`, `Figure`.
- `src/scripts/site.ts` (theme, menu sheet, header, sticky CTA), `forms.ts`
  (enquiry engine), `project-index.ts`, `previews.ts`.

The CrafterUI wheel was replaced at the user's request for a full redesign;
keep its MIT notice in THIRD-PARTY-NOTICES as previously distributed code.

## Important behaviour

The hero has no stock video (the user rejected it as generic). Otto must stay
light for everyone: the 3D chunk never loads before `load`, never on refused
or software WebGL, Save-Data or low-memory devices, and the SVG Otto is always
a complete experience. The chat is scripted and must say so: keep the
disclosure under the composer, never call a model or send what visitors type
anywhere, keep every answer within the CV and `src/data/*.ts` facts with a
source link, and keep the honest fallback for anything not written. After
changing intents, rerun the routing check (`scripts/otto-questions.json`, 150+
cases). Keep the visible "Pause motion" switch (WCAG 2.2.2), reduced-motion
instant answers, offscreen/hidden-tab pausing, and readable content without
JavaScript (intro answer and links).

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
completed individual achievement. INOS contributions are part of wider R&D.
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

Check seven routes at phone/tablet/desktop widths, both themes, accessible
keyboard navigation, no overflow or broken assets, no-JS links, media playback
and fallbacks, project index/matrix interaction, and form validation/review/edit. Verify all
facts, credits and true delivery status. Make the user-facing result concise.
