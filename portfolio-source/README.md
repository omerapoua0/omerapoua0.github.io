# Omar Aboelella portfolio

Static Astro portfolio (seven pages plus five project tours), redesigned in October 2026 as **v4 Studio**:
soft studio greys, white surfaces, black type and one electric-blue accent (#1f4bff), with a deep-navy contact band;
Onest display type and JetBrains Mono spec labels. Read [CLAUDE.md](CLAUDE.md) first. The
previous revision's README is kept as [OMAR-README.md](OMAR-README.md) for history only.

- **Hero:** who I am in one line, See my work / Book a lesson / Contact me, the
  robot stage (the photoreal robot drops into `public/robot/`; until then an
  abstract light sculpture stands in), spec chips that count up, and four big
  doors underneath: Work, Skills, Lessons, Contact. No chat.
- **The light gate:** choosing a door, card or main call to action plays "the
  robot opens it": two light seams meet like hands, white light bursts open,
  and the next page rises out of the white. Ordinary links get a quick white
  rise. Reduced motion and Pause motion get a short fade.
- **Everywhere:** a Contact pill in the sticky header on every width, a
  ⌘K / Ctrl+K command menu (quick links, pages, case studies, tours, copy email,
  CV, LinkedIn, GitHub) and a visible Pause motion switch.
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
and revealed within 1.5 s, reduced motion and Pause motion fades, same-page
doors, bfcache), Pause motion stopping every loop, Contact in one tap from
every page, the command menu, the project index and matrix, the mobile menu,
both enquiry journeys, the interior heroes and contact bands, scroll
reveals finishing visible on every page, the scrollytelling, scroll-spy and
contact topic shortcuts, gate hops from interior pages, and LCP/CLS.

Build success does not mean publication. Do not deploy without explicit user
authorisation. Preserve copyright notices, retained credits and personal-data
boundaries (no phone number on pages; the site links the personal GitHub).
