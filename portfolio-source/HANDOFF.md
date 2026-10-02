# Claude Code source handoff

Prepared from the active local portfolio on 2 October 2026. `portfolio-source/`
contains the seven-page Astro source, current live-action video hero, adapted
project wheel, exact dependency lockfile, legal notices and required public
assets. The personal CV and portrait are deliberately included because they
already belong to the portfolio; no passwords, tokens or account sessions are
part of this handoff.

Current visual direction: real full-bleed photography, charcoal/ivory/oxblood,
Inter Tight, sharp editorial controls. Film: physical circuit-board macro,
mathematical graph drawing, hands typing/planning, London financial district.
Desktop and mobile editions use licensed stock footage, not footage of Omar.
Both are 20 seconds, 24fps, H.264/yuv420p, silent, fast-start. Their manifest
contains creator credits, verified license links, source hashes and output sizes.

## What is and is not complete

This is a local source package, not a deployed cloud project or a GitHub push.
The rebuilt portfolio is not yet published at `omerapoua0.github.io`. Do not
reuse an unrelated account's authentication or spend money. The user must
separately authorise any publication or account action.

The current browser QA scripts cover responsive pages, themes, menus, form
drafts, actual video playback/fallbacks and project-wheel interaction. Their
macOS Chrome/Playwright setup is not immediately Linux-cloud compatible.
Adapt the isolated test runner before claiming browser results in Claude cloud.
The portable Astro build and strict TypeScript check are separate from UI QA.

Forms prepare email drafts only; nothing is automatically sent or stored.
Research and future degrees are labelled as interests/aspirations. NOOKBASE is
in development. Project videos are labelled concept visuals, not recordings.

## Included and excluded

Included: seven page sources; two Omar layouts; FilmHero; WorksWheel; four active
styles; site/forms scripts; package configuration and original exact lockfile;
current source README and rights notices; current edited film/posters/manifest;
project covers/videos/logos; CV; portrait; favicon and metadata files; current QA
and editorial edit scripts.

Excluded: `.git`, credentials, auth/OAuth helpers, `node_modules`, `dist`, previous
exports/backups, QA screenshots/reports, original stock downloads, old Three.js
scene source, old studio models/textures, abstract hero films and old math films.
Historical sections of the original notices/README identify the wider local
repository; those historical assets are intentionally not in this clean package.
The original copyright/license text is preserved rather than silently stripped.

The copied package scripts have been scoped to this clean source: obsolete
upstream scene tests/checks were removed, and `check:portfolio` checks only the
included active wheel/site/forms TypeScript. Dependency declarations and
`pnpm-lock.yaml` remain unchanged. A dormant old-poster CSS fallback was updated
only in this copy to point at the included current poster.

## Start in Claude Code

Read `portfolio-source/CLAUDE.md`, then open that folder as the project root.
Use Node >=22.13 and pnpm 11.11.0. Install with `--frozen-lockfile --ignore-scripts`,
run `check:portfolio`, build, and open a preview. Keep work scoped to the user's
current request. Do not automatically migrate frameworks, deploy, send a form,
create a backend, add tracking or purchase services.

`handoff-manifest.json` inventories the packaged files and SHA256 hashes.
`safety-scan.json` records a filename/token-pattern scan without secret values.
`verification.json` records the actual local validation performed on this copy.
These are useful checks, not a guarantee that every possible secret pattern can
be detected. The source archive excludes generated verification build output.
