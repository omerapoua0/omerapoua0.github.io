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

- Astro 7, TypeScript strict. Node >=22.13; pnpm 11.11.0. React and three remain
  declared for lockfile stability but no page ships a React island.
- Seven pages: index, work, automations, research, cv, tutoring, contact.
- `src/data/*.ts`: the single typed source of facts (projects, experience,
  capabilities, site/status vocabulary). Change facts here, not in markup.
- `src/layouts/Base.astro`: metadata, JSON-LD, font preloads, header, footer.
- `src/styles/tokens.css`, `base.css`, `layout.css`, `forms.css`; component
  styles are scoped in each `.astro` file. Palette: cool paper/ink + cobalt.
- `src/components/PersonalHero.astro` + `src/scripts/film.ts` + `hero-motion.ts`:
  cinematic first-person hero ("Hi, I'm Omar.", cycling line, real portrait,
  live London time) over the full-bleed licensed film, chapter rail and one
  "Pause motion" switch (`html[data-motion]`, `omar:motion`). `Ticker.astro`:
  kinetic CV-word band. `[data-reveal]`/`[data-reveal-stagger]`: scroll reveals. `ProjectIndex`,
  `CaseStudy`, `ProjectMedia` (duotone plates), `CapabilityMatrix`, `Timeline`, `Figure` (explanatory schematics).
- `src/scripts/site.ts` (theme, menu sheet, header, sticky CTA), `forms.ts`
  (enquiry engine), `project-index.ts`, `previews.ts`.

The CrafterUI wheel was replaced at the user's request for a full redesign;
keep its MIT notice in THIRD-PARTY-NOTICES as previously distributed code.

## Important behaviour

The hero film starts immediately with one edition per viewport: desktop 1280x800,
phone 640x800, H.264 MP4 first with a VP9 WebM fallback (20 s, 24 fps, silent).
If autoplay is refused (iPhone Low Power Mode), data saving is on or media fails,
it switches to moving chapter stills (hero-still-*.webp) with a retry button.
Keep the visible motion switch (WCAG 2.2.2), offscreen pause, reduced-motion
start-paused behaviour and the poster for disabled JavaScript.

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

The hero uses individually verified Mixkit Free License camera footage. It does
not depict Omar, his projects or workplace. Project videos are concept visuals,
not actual product recordings. Omar's real portrait is used on About & CV and,
while he reviews a with/without-photo comparison, in the home hero (sized crops
portrait-hero/portrait-avatar; remove with `<PersonalHero showPortrait={false} />`).
Never generate or alter a face/body or present stock actors as Omar. Marks retain
their respective owners' rights. Retain LICENSE, both notices and film credits.

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

The film editor needs FFmpeg/FFprobe and licensed originals not included here.
The October 2026 grade (FFmpeg filter recorded in the manifest) was applied to
the finished edit because originals were unreachable. Source/license records
and output hashes are in the public manifest.

## Acceptance checks after changes

Check seven routes at phone/tablet/desktop widths, both themes, accessible
keyboard navigation, no overflow or broken assets, no-JS links, media playback
and fallbacks, project index/matrix interaction, and form validation/review/edit. Verify all
facts, credits and true delivery status. Make the user-facing result concise.
