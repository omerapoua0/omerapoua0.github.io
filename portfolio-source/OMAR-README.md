# Omar Aboelella portfolio

Seven static Astro pages with a restrained photographic identity: charcoal,
ivory and oxblood, Inter Tight typography and sharp controls. The hero is an
edited 20-second live-action film, not a WebGL scene or animated object.
Photographed hardware, graph drawing, programming and London connect the
portfolio's subject areas. It is licensed editorial footage, not footage of
Omar or his own projects. Separate desktop and phone edits preserve framing.

The user-supplied CrafterUI Works Wheel is adapted under MIT: the tangent ring
morphs into the bowed perspective drum, with keyboard controls, horizontal
touch gestures, on-demand rendering and readable SSR/reduced-motion lists.
The six original covers describe real work or clearly labelled research interests.
Research, direction and completion evidence: `docs/video-portfolio-plan.md`.

Earlier SonicXBoy and Henry-inspired workspace code is retained recoverably,
but neither old hero is imported or rendered by the current homepage.

## Build and preview

Requires Node 22.13 or newer. Dependencies were installed from npm with package
scripts disabled. Use the pinned pnpm version:

```sh
npx pnpm@11.11.0 install --frozen-lockfile --ignore-scripts
npx pnpm@11.11.0 run build
npx pnpm@11.11.0 run preview --host 127.0.0.1 --port 4174
```

Production files are in `dist/`. The personal GitHub Pages site is
https://omerapoua0.github.io. No paid hosting, Supabase or server runtime is needed.
`scripts/prepare-pages.mjs` produces the equivalent flat `pages-ready-video/` export
for uploading through GitHub's web file chooser.

## Behaviour

- Real hero film in fast-start H.264 MP4: 3.33 MB desktop and 1.49 MB phone, with a visible pause control.
- Poster-only on reduced motion, save-data, no JavaScript or failed media loading.
- Video pauses offscreen and retains an explicit visitor pause on re-entry.
- Ring-to-drum project navigation, readable index and direct case-study links.
- Wheel scrolling is opt-in; normal page and vertical touch scrolling stay natural.
- Projects, Automations, Research, About & CV, Tutoring and Contact pages.
- Light/dark appearance saved on the visitor's device.
- Mobile menu with a no-JavaScript navigation fallback.
- Enquiries prepare an editable email. They are not submitted or stored by the
  site and they are not confirmed bookings. No email is sent automatically.
- Project videos are concept visualisations, not product screen recordings.
- No third-party tracking or creator analytics remain in the built website.

Original portrait is used only on the About page. No generated body or cutout is
used in the hero. CV dates and future study/research ambitions are labelled
honestly. NOOKBASE is in development.

## Verification

`node --test tests/*.test.mjs` checks the retained upstream mathematical source.
`npm run check:portfolio` checks current TypeScript with strict settings.
`scripts/qa.cjs` checks all seven routes, both themes, responsive navigation,
no-JavaScript access and draft-form validation. `scripts/qa-film.cjs` checks
actual playback, pause, offscreen behaviour and media/network fallbacks.
`scripts/qa-wheel.cjs` checks geometry, controls, touch intent and idle suspension.
These use isolated test browsers and never send an enquiry.

To reproduce the current film, use `scripts/edit-editorial-film.cjs` with the
verified source clips and FFmpeg/FFprobe. Originals stay in ignored
`.film-sources/`; only the edited end product is published. Source attribution,
license links and output hashes are in `public/hero-editorial-manifest.json`.
The earlier abstract-film renderer remains recoverable but is not mounted.

Local completion does not mean publication. The personal GitHub Pages site has
not been updated with this rebuild; deployment needs the correct personal-account
upload/authentication path, not the unrelated account active in the CLI.

Keep `LICENSE` and `THIRD-PARTY-NOTICES.md` with the source. Deployed copies are
also provided as accessible text files.
