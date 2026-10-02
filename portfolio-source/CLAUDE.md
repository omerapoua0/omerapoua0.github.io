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

## Active architecture

- Astro 7, React 19, TypeScript strict. Node >=22.13; pnpm 11.11.0.
- Seven pages: index, work, automations, research, cv, tutoring, contact.
- `src/layouts/OmarLayout.astro`: metadata, navigation, footer, fonts, shared CSS.
- `src/layouts/OmarHome.astro`: home sections and the React work wheel.
- `src/components/FilmHero.astro`: actual photographed, edited 20-second video.
- `src/components/ui/works-wheel.tsx`: supplied CrafterUI ring-to-drum geometry,
  adapted under MIT. Keep its full notice and accessibility features.
- CSS order: omar.css, nocturne.css, editorial.css; works-wheel.css is scoped to
  its component. Editorial overrides define charcoal, ivory and oxblood.
- `src/scripts/site.ts`: theme, menu, reveals and project-video behaviour.
- `src/scripts/forms.ts`: validated, editable enquiry drafts.

No old Three.js desk, robotic hero, abstract film, cube scene or generated body
is included or mounted in this clean handoff. Historic dependencies remain in
the exact lockfile for reproducibility; they do not make the current hero 3D.
Avoid unnecessary framework migrations or replacing actual footage with shapes.

## Important behaviour

The hero chooses one MP4 before loading: desktop 1280x800, phone 640x800.
Both are 20 seconds, 24fps, H.264/yuv420p, silent and progressive-download ready.
Keep visible pause/play, offscreen pause, explicit-pause persistence, and static
posters for reduced motion, save-data, disabled JavaScript or failed media.

The project wheel must not hijack ordinary page scrolling. Preserve keyboard
controls, horizontal touch intent, mobile page scrolling, reduced-motion and
server-rendered links, hidden-card focus safety, and idle/offscreen suspension.
Keep direct navigation to each case study; do not make all information require
discovering an interaction.

Enquiry forms validate and prepare an editable `mailto:` email. They do not
send, store, authenticate, reserve a lesson, or confirm a booking. Never show
"Sent" or a confirmed booking unless a real service has actually succeeded.

## Facts and honest attribution

Use the current CV and page copy as supplied facts, not permission to invent
clients, achievements, publications, qualifications, returns or testimonials.
Omar studies BSc Computer Science & Mathematics at Birkbeck, expected 2028.
A PhD, optimisation, quantitative finance and quantum computing are research
interests/aspirations, not completed degrees or published research. NOOKBASE is
in development. KATANA's Level 4 autonomy is a programme direction, not a
completed individual achievement. INOS contributions are part of wider R&D.
Do not claim trading performance or provide investment recommendations.

The hero uses individually verified Mixkit Free License camera footage. It does
not depict Omar, his projects or workplace. Project videos are concept visuals,
not actual product recordings. Omar's portrait belongs on About & CV; do not
generate a different face/body or pretend stock actors are Omar. Marks retain
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

Bundled browser QA scripts were written for isolated macOS Chrome and a local
Playwright runtime. They need adaptation on a Linux cloud runner: install the
approved test dependency/browser, remove the hard-coded macOS executablePath,
and supply `PORTFOLIO_QA_URL`. They never use personal browser profiles or send
enquiries. Build is portable; do not report browser QA as passed until run.

The film editor needs FFmpeg/FFprobe and licensed originals not included here.
Keep the supplied finished files unless an explicitly authorised change needs
re-editing. Source/license records and output hashes are in the public manifest.

## Acceptance checks after changes

Check seven routes at phone/tablet/desktop widths, both themes, accessible
keyboard navigation, no overflow or broken assets, no-JS links, media playback
and fallbacks, wheel interaction, and form validation/review/edit. Verify all
facts, credits and true delivery status. Make the user-facing result concise.
