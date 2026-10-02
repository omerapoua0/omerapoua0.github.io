# Omar Aboelella portfolio

Seven-page static Astro portfolio, redesigned in October 2026 as **Proof**:
cool paper and deep ink with a cobalt accent (the dark homepage hero uses one signal lime), Onest with Old Standard TT italic
accents and JetBrains Mono metadata. Read [CLAUDE.md](CLAUDE.md) first. The
previous revision's README is kept as [OMAR-README.md](OMAR-README.md) for
history only; its wheel and charcoal/ivory/oxblood styling are retired.

- **Hero:** "Ask me anything. *Well, almost.*" A chat over answers I wrote
  from my CV (`src/data/agent.ts`), matched in the browser by weighted keywords
  (`src/scripts/agent-match.ts`). Answers show a short tool trace, stream in,
  and end with cards, sources, copy/link buttons and follow-up chips; an
  honest fallback says when I haven't written about something. Slash commands
  (`/help`, Tab completion, ↑/↓ history), `?ask=` permalinks, a remembered
  transcript with Clear and opt-in sound. No model, nothing leaves the page,
  and the composer says so. A code-drawn signal network moves behind it.
- **Everywhere:** a ⌘K / Ctrl+K command menu (pages, case studies, questions
  for the chat, copy email, theme, sound).
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
anchors, no-JS fallbacks, the chat (streaming, cards, sources, free-text routing,
honest fallback, slash commands, Tab, history, persistence, Clear, `?ask=`, and
routing for every question in `scripts/agent-questions.json`),
the command menu, the list/grid switch, the motion switch and reduced motion,
count-ups, scroll reveals, project index and matrix interaction, the mobile
menu, both enquiry journeys and throttled LCP/CLS. Reports go to `.qa/` (ignored).

Build success does not mean publication. Do not deploy without explicit user
authorisation. Preserve copyright notices, retained credits and personal-data
boundaries (no phone number on pages; the site links the personal GitHub).
