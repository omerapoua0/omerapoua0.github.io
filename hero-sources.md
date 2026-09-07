# Hero scene sources

## Simplified mathematics / v17

The former four tilted equations and dense animated canvas field have been replaced with a single native MathML Euler formula, e^(iθ) = cos θ + i sin θ, and its unit-circle geometry. One point and a radius rotate anticlockwise on the unit circle over 28 seconds. No numbered teaching panels, text parallax, equation collage or additional drawing loop remain. The background film and cloud atmosphere are unchanged. Shared pause, reduced motion and offscreen/hidden-tab states stop the phase animation. Source and mocked lifecycle checks passed; no new browser visual QA was performed for this release.

## Cloud atmosphere / skills release

- Original cloud artwork created with built-in imagegen, then encoded as a 1536×1024 WebP (18,698 bytes) at `hero-clouds.webp`. Prompt: “Photorealistic cinematic wispy volumetric cloud/fog background, dark charcoal void, mostly black left half for copy, airy illuminated wisps right and bottom, faint desaturated emerald and blue rim light, restrained contrast. No text, objects, robots, stars, logos, watermark, UI, borders, scenery, or hard shapes.”
- The cloud texture drifts via compositor transforms in a 46-second alternating cycle. It respects the shared hero pause state, reduced-motion preference and tab/hero visibility. Data-saver users do not download it. The existing mathematical background film is retained at a slower playback rate.
- Skills and positioning expanded from the user's requested Docker/LangGraph/AI management/workflow skills and the existing CV-derived experience. Capability cards link to relevant projects or the technical profile; no fabricated proficiency ratings, client metrics or certifications were added. The downloadable original CV remains unchanged.
- Validation for this release is source-level and mock lifecycle testing, not additional browser visual QA.

- Robot: user-supplied Spline scene, embedded directly from https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode. The scene is not claimed as original portfolio artwork. Its authored robot and interactions are retained; no Spline attribution is removed.
- Runtime: @splinetool/runtime 1.10.22, loaded on demand from the pinned public package URL. API documentation: https://www.npmjs.com/package/@splinetool/runtime and https://docs.spline.design/exporting-your-scene/web/code-api-for-web.
- Topology: a code-generated tubular neighbourhood of the (2,3) torus knot (trefoil). Its centreline is ((.78 + .29 cos(3u)) cos(2u), (.78 + .29 cos(3u)) sin(2u), .4 sin(3u)); normal-frame tube radius .16. Red/green/blue parameter colours and a depth-tested coordinate grid are rendered on the surface.
- Mathematics: native MathML typesetting for the time-dependent Schrödinger equation, Bayes' theorem, the non-dividend Black–Scholes PDE, and Euler's identity. No remote maths library or equation images are needed.
- Opening order: Robot → Mathematics → Topology → Compute → Quantum. The initial robot scene begins loading immediately; its automatic dwell timer starts after loading succeeds or fails, while manual controls always remain available.
- The obsolete particle robot and equation masks have been removed. Each scene has exclusive visibility; transitions never blend old models under the new scenes. If the external robot cannot load, a clear message invites visitors to the local maths/topology scenes. Browsing and contact links do not depend on Spline.

Validation for the polish release: real Spline browser load, exclusive scene visibility, seven pages at 320/390/768/1024/1440px, desktop three-column project layout, mobile stacking, keyboard menu use, lesson/contact draft journeys, light theme and screenshots. Standalone mathematical canvas and mocked Spline lifecycle tests also passed.

## Product identities

- KATANA: https://digis2.com/product/katana/ — official asset https://digis2.com/uploads/KATANA_LOGO_c344843dc8.png.
- INOS: https://digis2.com/product/inos/ — official asset https://digis2.com/uploads/INOS_Logo_2a4614d305.png.
- NOOKBASE: user's current app master at `/Users/omar/Dev/NookOS/apps/web/public/brand-mark.png`, referenced by the app's `brand.ts` and `brand-icons.tsx`; copied without modification. No remote dependency added for this asset.
- KATANA's refreshed film is an original animated closed-loop network diagram, explicitly labelled concept visual, not product footage. Existing NOOKBASE/INOS concept videos are preserved.
