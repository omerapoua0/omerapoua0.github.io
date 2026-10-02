# Video-led portfolio direction

## Current revision: photographic editorial, 2 October 2026

The user rejected the abstract film's synthetic appearance. The current
revision supersedes the Nocturne art direction documented below. It uses
actual photographed footage, not a capture of animated geometry: a physical
circuit board, graph drawing, programmer's hands and London. Clips are
individually verified Mixkit Free License assets with preserved provenance.
Desktop: 1280×800, 3,330,008 bytes. Phone: 640×800, 1,492,630 bytes.
Both are silent H.264/yuv420p, 24 fps, 480 frames, exactly 20 seconds, fast-start
and fully decoded. Four shots have half-second dissolves and a circular return.
No stock actor is presented as Omar; no generated portrait is used.

The shared seven-page identity is charcoal/ivory with restrained oxblood,
Inter Tight sans typography, rectangular controls, larger body copy and
clean typographic project plates. Decorative serif headings, illustrated
project covers and pill buttons are no longer part of the active design.
Project, CV, research, tutoring and honest email-draft paths are retained.
The wheel keeps its established accessible interaction geometry.

The prior implementation and its evidence below remain historical records,
not a description of the currently loaded hero. Publishing status remains
local-only until the personal GitHub deployment path is available.

Current verification: 76/76 whole-site route, theme, responsive, menu, no-JS
and enquiry-review/edit checks; 11/11 film cases including the 720/721px
asset breakpoint; five project-wheel interaction/fallback cases. The flat
export has 84 files, seven routes and 32 internal destinations, all verified
without HTTP failures or page errors. Both exported MP4s decode and the
wheel hydrates and turns. Reports: .qa/report.json, .qa/film-report.json,
.qa/wheel-editorial/report.json and .qa/export-report.json. The native in-app
browser independently decoded the 1280×800 film with readyState 4, duration
20 seconds and advancing playback. Strict TypeScript and static build pass.

## Original objective

Research, plan and implement a distinctive premium portfolio showing agentic
machine learning, AI engineering, mathematics study and finance interests.
The hero must be an actual video. Integrate the supplied WorksWheel reference.
Keep the real CV, projects, research, teaching and enquiry paths accessible.

The supplied reference was read in full from the user's 18,394-byte attachment
`pasted-text-1.txt`. It describes a ring of project cards that opens into a
perspective drum. It is a work index, not a video hero.

## Research and decisions

- CrafterUI primary component/library: https://www.crafterui.com/
- Matching source: https://github.com/SriSomanaath/crafterui/tree/main/apps/web/registry/crafterui/ui
- License: https://github.com/SriSomanaath/crafterui/blob/main/LICENSE
- Video-led portfolio implementation reference: https://hashton.dev/work/hashton
- Three.js physical materials: https://threejs.org/docs/#MeshPhysicalMaterial
- Media recording: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- Video element and accessibility: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/video

The visual decision is an original black-cherry / champagne / glacier / coral
system, rather than the previous green desk scene. The hero film is original
code-rendered kinetic artwork: mathematical structure, connected reasoning and
a quantitative surface. It is conceptual art, not a claimed model result,
published research, trading performance or footage of a real deployment.

The supplied wheel's distinctive geometry will remain. Its original perpetual
render loop, tiny type, globally duplicated IDs and mobile scroll capture will
be adapted for usable production behaviour. Ordinary page scrolling must work.

Keep Astro, React and TypeScript. `src/components/ui` is the reusable UI directory.
Component-scoped CSS replaces the reference's Tailwind utility classes, so a
destructive shadcn scaffold or framework migration is unnecessary. No new paid
service, account, database or backend is needed.

## Implementation lanes

1. Original film, poster and reproducible rendering script.
2. WorksWheel component and responsive/keyboard behaviour.
3. Editorial home, shared palette, factual capability/study/research content.
4. Full responsive, media, form, licensing and static-export verification.

## Completion evidence required

- Source and browser: actual looping video decodes and advances; pause works.
- Video fallback: poster remains readable with reduced motion, data-saving,
  blocked autoplay, JavaScript disabled or video decoding failure.
- Visual review: coherent colour, typography and spacing on desktop and phone.
- Work index: genuine ring/drum transition, real project links, keyboard controls,
  correct touch behaviour, no scroll trap, readable reduced-motion/no-JS paths.
- Content: agentic systems/ML, AI engineering, Birkbeck study, quantitative and
  quantum interests explicitly visible; exploratory/future claims labelled.
- Existing projects, CV, automations, tutoring and contact remain reachable.
- Forms still validate and prepare an editable enquiry without false sent states.
- Runtime: no horizontal overflow, broken assets, hydration or console errors.
- Build, strict new-code TypeScript and production preview tests pass.
- Third-party MIT/font notices and original-film provenance retained.
- GitHub export works. Public publishing remains a separately reported access
  constraint; never represent a local preview as a deployed public revision.

## Progress classification

The preceding turn changed authoritative files and verified a working desk
portfolio, so it was progress. It did not satisfy the current video/wheel
objective: that hero was WebGL rather than a video and the supplied wheel was
not yet present. This plan preserves and addresses the full requested end state.

## Implemented and verified: 2 October 2026

- The homepage now mounts FilmHero and the supplied ring-to-drum WorksWheel;
  neither earlier hero is imported. No WebGL renderer remains in its JS bundle.
- Original film: 1440×900, 24 fps, 12-second H.264 MP4 (3,240,823 bytes) and
  VP9 WebM (2,365,793 bytes). Both decoded, advanced, changed frames and looped;
  zero dropped frames in the isolated verification. Renderer loop endpoints
  are pixel-identical. Evidence: `.qa/hero-film-playback.json`.
- The native Codex in-app browser also decoded and played the MP4: readyState 4,
  duration 12 seconds, currentTime 6.452 seconds, paused false. An early WebKit
  empty-source error was discovered and fixed by creating valid sources only
  when playback is wanted. MP4 is the first source, with WebM as an alternative.
- Film QA: 11 passing cases for 320/390/768/1440px playback, explicit pause,
  offscreen suspension, reduced motion, save-data, no-JS, denied autoplay,
  unavailable media and each standalone format. `.qa/film-report.json`.
- Site QA: 76 passing route/theme/responsive/menu/no-JS/form cases. All seven
  routes, both themes, and tutoring/project validation, review and edit flows.
  No external requests or submissions. `.qa/report.json`.
- Wheel QA: desktop, 390px and 320px, keyboard/links/buttons, horizontal touch,
  native vertical scrolling, opt-in wheel boundaries, inert culled cards,
  idle/offscreen suspension, and reduced-motion/no-JS six-link lists.
  Explicit choices reveal an offscreen stage smoothly without stealing focus.
  `.qa/wheel-final/report.json`.
- Visual review fixed cropped still-view covers, pale-art caption contrast,
  phone input sizes and small subject-choice descriptions. Desktop/mobile and
  dark/light layouts are coherent; no horizontal overflow or browser errors.
- Six covers describe KATANA, NOOKBASE, INOS, Bitget, bp and independent
  mathematical study. Delivered experience, in-development product work and
  exploratory/future research are distinct. University, PhD aspiration, tools,
  teaching, quantitative-finance and quantum interests are explicitly visible.
- Strict current-code TypeScript, seven-page static build and diff checks pass.
  Full CrafterUI MIT and applicable font/source notices remain accessible.
- The flattened `pages-ready-video/` artifact is prepared for the personal
  GitHub site. All files, seven routes, internal link targets, actual MP4 and
  hydrated wheel are checked through a separate static server.

Implementation objective is complete locally. This is not a public deployment.
CLI authentication for `omerapoua0` is invalid; the unrelated `NookbaseLTD`
account is active and has not been used to publish this personal portfolio.
The earlier browser upload permission constraint was not bypassed. Publishing
needs the user's personal-account authentication or permitted upload path.
