# Omar Aboelella portfolio

Static Astro portfolio (seven pages plus five inside tours), redesigned in October 2026 as **Proof**:
cool paper and deep ink with a cobalt accent (the dark homepage hero uses one signal lime), Onest with Old Standard TT italic
accents and JetBrains Mono metadata. Read [CLAUDE.md](CLAUDE.md) first. The
previous revision's README is kept as [OMAR-README.md](OMAR-README.md) for
history only; its wheel and charcoal/ivory/oxblood styling are retired.

- **Hero: Otto, my robot host.** "Ask Otto anything. *Well, almost. About
  Omar.*" A big 3D Otto (three.js, built in code, lazy-loaded after the page
  is ready) flies in, waves and asks how you are; the SVG Otto stands in on
  devices where 3D isn't worth it. You talk to him by choosing from the
  replies he offers (there is no text box, so he can't be thrown by "idk"):
  a greeting and mood, then topics (work, research and study, lessons,
  internships, getting in touch, a joke), all from answers I wrote
  (`src/data/agent.ts`, with the conversation in `src/data/otto.ts`). Pick a
  project and he offers his hand: take it and he pulls you through his chest
  screen into a guided tour, `/inside/<project>.html`. `?ask=<intent>`
  permalinks, a remembered transcript, opt-in sound and a Pause motion switch.
  No model, nothing leaves the page, and the note under the choices says so.
- **Everywhere:** a ⌘K / Ctrl+K command menu (pages, case studies, inside
  tours, Otto's written answers, copy email, theme, sound).
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
`qa.cjs` covers 7 routes × 5 widths × 2 themes, axe WCAG 2.2 AA, links and legacy
anchors, no-JS fallbacks, Otto (3D mode via `?otto3d=force`, since headless
Chromium only has software WebGL, which the site refuses by design; the SVG
fallback; the hand-off with Take, countdown, Stay and Esc; reduced motion), the
choice-only chat (greeting, moods, topics, the hand-off chosen via His work →
KATANA, keyboard focus, persistence, Clear, `?ask=` for intent ids only, and a
breadth-first crawl of every choice: 2+ choices per reply, no duplicates,
labels of 30 characters or fewer, no dead ends, every answer within 4
choices), the inside tours,
the command menu, the list/grid switch, the motion switch and reduced motion,
count-ups, scroll reveals, project index and matrix interaction, the mobile
menu, both enquiry journeys and throttled LCP/CLS. Reports go to `.qa/` (ignored).

Build success does not mean publication. Do not deploy without explicit user
authorisation. Preserve copyright notices, retained credits and personal-data
boundaries (no phone number on pages; the site links the personal GitHub).
