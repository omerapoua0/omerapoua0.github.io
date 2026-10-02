# Omar Aboelella portfolio

Seven-page static Astro portfolio, redesigned in October 2026 as **Proof**:
cool paper and deep ink, one cobalt accent, Onest with Old Standard TT italic
accents and JetBrains Mono metadata. Read [CLAUDE.md](CLAUDE.md) first. The
previous revision's README is kept as [OMAR-README.md](OMAR-README.md) for
history only; its wheel and charcoal/ivory/oxblood styling are retired.

- **Hero:** "Hi, I'm Omar." over an original, code-drawn **live skill network**:
  nodes drift, signals travel between them like agents passing messages, and
  hovering or tapping a skill shows where the CV evidences it; clicking sends
  a burst of signals. A decoding role line, a live MAPE-K loop, magnetic
  buttons, a cursor ring, a kinetic skills ticker and count-up numbers follow.
  One "Pause motion" control stops everything; reduced motion starts paused.
- **Projects:** a server-rendered project index with a sticky duotone preview
  pane and area filters, case studies with explicit stage notes, and a
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
anchors, no-JS fallbacks, the live network (animates, evidence tooltips,
signals), the motion switch and reduced motion, count-ups, scroll reveals,
project index and matrix interaction, the mobile menu, both enquiry journeys
and throttled LCP/CLS. Reports go to `.qa/` (ignored).

Build success does not mean publication. Do not deploy without explicit user
authorisation. Preserve copyright notices, retained credits and personal-data
boundaries (no phone number on pages; the site links the personal GitHub).
