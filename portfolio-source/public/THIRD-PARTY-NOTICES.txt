# Third-party notices

## Previously used: editorial film

The site no longer uses stock footage: the v4 "Studio" homepage hero is a
display title with an original CSS light-sculpture placeholder (a robot media
slot; see below). Earlier revisions of this repository distributed the
following, so its credits are retained.

The earlier hero was an edited 20-second live-action film assembled from four
Mixkit clips individually identified as Stock Video Free License assets:

- Circuit board, Ruben Velasco: https://mixkit.co/free-stock-video/circuit-board-2381/
- Mathematical study, Ruben Velasco: https://mixkit.co/free-stock-video/a-young-student-with-a-black-pen-draws-a-mathematical-50113/
- Programmer's hands, Mixkit: https://mixkit.co/free-stock-video/hands-of-a-programmer-working-on-a-desk-41652/
- London financial district, Dubassy: https://mixkit.co/free-stock-video/floor-of-londons-financial-district-4495/

Applicable license: https://mixkit.co/license/modal/videoFree/
Terms: https://mixkit.co/terms/
The footage illustrates subject interests. It does not depict Omar, his own
projects or his workplace, and does not imply a filmmaker's endorsement.
The website serves only the edited montage, not the raw source clips.
Desktop and mobile framing, timing, grading, dissolves and compression are
portfolio adaptations. Reproducible edit: scripts/edit-editorial-film.cjs.
Source credits, hashes and output verification: hero-editorial-manifest.json.
The October 2026 "Proof" redesign applies a further cool colour grade to the
same edit and adds VP9 WebM encodes; shots, timing and credits are unchanged.

Project schematics (Bitget, BP and research figures), the Automations
pipeline schematic and other diagrams on the site are original
code-drawn explanatory visuals, not results, data or product screenshots. Supplied
company marks retain their respective owners' rights; their presence
identifies the stated project or work history only.

## Previously used: CrafterUI Works Wheel

The redesign replaces the wheel with a server-rendered project index, so the
wheel is no longer shipped. Its notice is retained because earlier revisions
in this repository's history distributed the adapted code.

The Work & Questions wheel adapted the user-supplied CrafterUI Works Wheel:
https://github.com/SriSomanaath/crafterui/blob/main/apps/web/registry/crafterui/ui/works-wheel.tsx
The original tangent-ring / bowed-drum transform geometry is retained. Scoped
styling, SSR/reduced-motion lists, accessible navigation, intent-based touch,
opt-in scroll, idle suspension and frame-independent easing are adaptations.
No demonstration artwork from the reference is redistributed.

MIT License
Copyright (c) 2026 CrafterUI
Copyright (c) 2026 Moumen Soliman (site scaffold, from github.com/moumen-soliman/lab)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Earlier workspace assets retained recoverably

The original abstract computational film is retained as hero-film.mp4 and
hero-film.webm, with its renderer in src/lib/CinematicFilm.ts. It is no longer
loaded by the homepage. Its trefoil, agent graph and probability surface are
original conceptual code-native artwork, not a claimed research result.

The earlier Three.js workspace code and assets remain in the repository, but
that hero is not imported or rendered by the current homepage. Henry
Heffernan's portfolio (https://henryheffernan.com/) informed that earlier
interaction direction. No Henry models, textures, OS, games, audio, branding
or analytics are included.

Two furniture models and their textures are from Poly Haven under CC0 1.0:

- Metal Office Desk by Ulan Cabanilla: https://polyhaven.com/a/metal_office_desk
- Potted Plant 04 by James Ray Cock: https://polyhaven.com/a/potted_plant_04

Source license: https://polyhaven.com/license
CC0: https://creativecommons.org/publicdomain/zero/1.0/
Detailed download provenance and file verification: `studio/ATTRIBUTION.txt`.
Attribution is retained to acknowledge these artists; their models are not
represented as Omar's original modelling work.

## Retained portfolio template source

The repository started from [SonicXBoy's portfolio](https://github.com/vixkosla/sonicxboy-portfolio), commit `18ddce765cf36affd170211d4e88fda097921763`. Its original source remains in the repository with the notice below. The current home page does not import or render that cube hero or its motion choreography. Adaptation does not imply that Omar authored the original template or its featured projects. The original author is not represented as endorsing this adaptation.

The upstream MIT license is retained unchanged in `LICENSE` and reproduced below:

MIT License

Copyright (c) 2026 SonicXBoy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Fonts

The template declares the following Fontsource font packages. The corresponding font files are licensed under the SIL Open Font License 1.1, not the MIT license for the website code. Their original copyright notices follow. A declaration here does not mean every font is shipped in every build. The current v4 "Studio" design ships only Onest (text and display) and JetBrains Mono (labels and data); Old Standard TT and the other declared families are no longer shipped.

- Onest: Copyright 2021 The Onest Project Authors (https://github.com/simpals/onest). Package `@fontsource-variable/onest` 5.2.11.
- Inter Tight: Copyright 2022 The Inter Project Authors (https://github.com/rsms/inter-tight). Package `@fontsource-variable/inter-tight` 5.3.0. Typeface of the previous revision, verified against the installed package LICENSE on 2 October 2026.
- JetBrains Mono: Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono). JetBrainsMono-Italic[wght].ttf: Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono). Package `@fontsource-variable/jetbrains-mono` 5.2.8.
- Tektur: Copyright 2023 The Tektur Project Authors (https://www.github.com/hyvyys/Tektur). Package `@fontsource-variable/tektur` 5.2.7.
- Faster One: Copyright 2012 The Faster Project Authors (https://github.com/etunni/faster), with Reserved Font Name 'Faster'. Package `@fontsource/faster-one` 5.2.7.
- Monoton: Copyright (c) 2011, Vernon Adams (vern@newtypography.co.uk) with Reserved Font Name 'Monoton'. All rights reserved. Package `@fontsource/monoton` 5.2.7.
- Old Standard TT: Copyright 2011 The Old Standard Project Authors (amkryukov@gmail.com). OldStandard-Italic.ttf: Copyright 2011 The Old Standard Project Authors (amkryukov@gmail.com). OldStandard-Bold.ttf: Copyright 2011 The Old Standard Project Authors (amkryukov@gmail.com). Package `@fontsource/old-standard-tt` 5.3.0.
- Ponomar: Copyright 2025 The Ponomar Project Authors (https://github.com/slavonic/ponomar). Package `@fontsource/ponomar` 5.3.0.

Verified against the corresponding published package `LICENSE` files through the jsDelivr npm mirror on 2 October 2026. Package versions identify the checked license text; dependency lockfiles govern installed versions.

### SIL Open Font License 1.1

-----------------------------------------------------------
SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007
-----------------------------------------------------------

PREAMBLE
The goals of the Open Font License (OFL) are to stimulate worldwide
development of collaborative font projects, to support the font creation
efforts of academic and linguistic communities, and to provide a free and
open framework in which fonts may be shared and improved in partnership
with others.

The OFL allows the licensed fonts to be used, studied, modified and
redistributed freely as long as they are not sold by themselves. The
fonts, including any derivative works, can be bundled, embedded,
redistributed and/or sold with any software provided that any reserved
names are not used by derivative works. The fonts and derivatives,
however, cannot be released under any other type of license. The
requirement for fonts to remain under this license does not apply
to any document created using the fonts or their derivatives.

DEFINITIONS
"Font Software" refers to the set of files released by the Copyright
Holder(s) under this license and clearly marked as such. This may
include source files, build scripts and documentation.

"Reserved Font Name" refers to any names specified as such after the
copyright statement(s).

"Original Version" refers to the collection of Font Software components as
distributed by the Copyright Holder(s).

"Modified Version" refers to any derivative made by adding to, deleting,
or substituting -- in part or in whole -- any of the components of the
Original Version, by changing formats or by porting the Font Software to a
new environment.

"Author" refers to any designer, engineer, programmer, technical
writer or other person who contributed to the Font Software.

PERMISSION & CONDITIONS
Permission is hereby granted, free of charge, to any person obtaining
a copy of the Font Software, to use, study, copy, merge, embed, modify,
redistribute, and sell modified and unmodified copies of the Font
Software, subject to the following conditions:

1) Neither the Font Software nor any of its individual components,
in Original or Modified Versions, may be sold by itself.

2) Original or Modified Versions of the Font Software may be bundled,
redistributed and/or sold with any software, provided that each copy
contains the above copyright notice and this license. These can be
included either as stand-alone text files, human-readable headers or
in the appropriate machine-readable metadata fields within text or
binary files as long as those fields can be easily viewed by the user.

3) No Modified Version of the Font Software may use the Reserved Font
Name(s) unless explicit written permission is granted by the corresponding
Copyright Holder. This restriction only applies to the primary font name as
presented to the users.

4) The name(s) of the Copyright Holder(s) or the Author(s) of the Font
Software shall not be used to promote, endorse or advertise any
Modified Version, except to acknowledge the contribution(s) of the
Copyright Holder(s) and the Author(s) or with their explicit written
permission.

5) The Font Software, modified or unmodified, in part or in whole,
must be distributed entirely under this license, and must not be
distributed under any other license. The requirement for fonts to
remain under this license does not apply to any document created
using the Font Software.

TERMINATION
This license becomes null and void if any of the above conditions are
not met.

DISCLAIMER
THE FONT SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO ANY WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT
OF COPYRIGHT, PATENT, TRADEMARK, OR OTHER RIGHT. IN NO EVENT SHALL THE
COPYRIGHT HOLDER BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
INCLUDING ANY GENERAL, SPECIAL, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL
DAMAGES, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF THE USE OR INABILITY TO USE THE FONT SOFTWARE OR FROM
OTHER DEALINGS IN THE FONT SOFTWARE.

## Omar's content and organisation marks

Omar's original portrait, CV, supplied biographical text and project media are personal portfolio content. Their inclusion does not place them under the upstream template's MIT license or grant rights to reuse Omar's likeness or personal information.

Organisation and project marks retain their respective owners' rights. They are used to identify organisations and projects discussed in the portfolio, not to suggest sponsorship or endorsement. They are not relicensed under MIT. The supplied root workspace's `brand-sources.md` records the organisation-logo provenance:

- Digis Squared: [official website](https://digis2.com/), inline `loader_logo` SVG.
- Bitget: [official brand information](https://www.bitget.com/support/articles/12560603882517), official website logo asset.
- bp: [official careers website](https://careers.bp.com/about), header logo asset hosted through its careers service.
- Rapport: [official website](https://www.rapportservice.com/), its published logo asset.
- Southfields Academy: [official website](https://www.southfieldsacademy.com/), its published logo asset.
- NOOKBASE, KATANA and INOS marks and project media: supplied in Omar's existing portfolio workspace. Inclusion is not an independent verification of trademark ownership or third-party permission.

Project concept images and videos must not be described as screenshots of a live product unless independently established. The original portrait is used without generating a replacement face or body.

## v4 "Studio" visuals (October 2026)

- The light gate (page transition), the robot media slot's placeholder (a white sphere with blue rim light and two rings), the light blobs, grids, watermarks, marquees and the Automations pipeline schematic are original CSS/SVG made for this portfolio. No third-party models, textures, scenes, characters or animation libraries are used, and no new dependency was added.
- Robot media slot: if Omar adds his own robot images or clips to `public/robot/` (for example generated with Higgsfield), they are Omar's supplied content, used under the terms of the service that generated them. They depict a robot, not Omar. Until such files exist, only the placeholder above is shipped.
- Omar's portrait on About & CV and the lessons page is his real photograph, cropped only; it is not generated or altered.

## v9: Otto's moves (October 2026)

- The robot is named Otto ("Omar's robot") at Omar's request. Three more
  short clips of the same robot were generated for Omar with Higgsfield from
  its still: ASK (he turns to you and presents the intro's question with an
  open hand), WAVE (he waves hello) and HEART (he makes a heart with his
  hands that glows red). Like the v8 media they are AI-generated, the same
  original design, depict no real person and are not Omar; they are Omar's
  supplied content, used under the terms of the service that generated them,
  served from Higgsfield's CDN (d8j0ntlcm91z4.cloudfront.net) and not
  redistributed by this repository. Their audio tracks are never played.
- The lite tier's CSS "assemble" and light hint are original CSS made for
  this portfolio; no dependency was added.

## v8: the opening intro and the new robot (October 2026)

- Otto, "Omar's robot" (a glossy black humanoid with red neon contour lines
  and a red ring emitter on the side of its head), its sphere-head start
  frame and two clips (the sphere transforming into the robot; the robot
  looking at you, raising its hands and opening a burst of light) were
  generated for Omar with Higgsfield. They are AI-generated, an original
  design (inspired by a reference image Omar supplied, not copied from it),
  depict no real person and are not Omar; they are Omar's supplied content,
  used under the terms of the service that generated them. The files are
  served from Higgsfield's CDN (d8j0ntlcm91z4.cloudfront.net); this
  repository does not redistribute them. They replace the v7 robot media,
  which are no longer used.

## v7: the hero robot (October 2026) (media replaced in v8)

- The robot mascot on the homepage hero (a still and two short clips: "greet",
  the head turn and wave, and "open", hands together and a burst of light,
  used by the light gate) was generated for Omar with Higgsfield. It is
  AI-generated, depicts no real person and is not Omar; it is Omar's supplied
  content, used under the terms of the service that generated it. The files
  are served from Higgsfield's CDN (d8j0ntlcm91z4.cloudfront.net); this
  repository does not redistribute them.
- The abstract CSS orb kept as its loading/fallback state, the pointer light,
  the neon pulse and the blend into the page are original CSS.

## Previously used: Otto, the robot host

- Otto was an original character made for this portfolio: an original SVG drawing (`Robot.astro`) and a 3D version built in code from primitive shapes (`src/scripts/otto3d/`). Otto, its chat and both renderers were removed in the v4 redesign (October 2026) and are no longer shipped.
- The 3D Otto was rendered with three.js 0.185.1 (core plus the `RoundedBoxGeometry` and `RoomEnvironment` add-ons). three.js remains declared in `package.json` for lockfile stability but no page ships it. Because earlier revisions distributed it, its MIT License is retained:

```text
The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

- Previously used (noindex comparison preview only, removed in October 2026): the 21st.dev "Spline Scene" component idea by serafimcloud (https://21st.dev/community/components/serafimcloud/splite, listed there under MIT), a Spline scene loaded at runtime from `https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode` (rights remain with its author under Spline's terms) and `@splinetool/runtime` 2.0.66. None of these ship with the site any more.

## Other dependencies

Runtime and build dependencies keep their own licenses, available in their installed packages and upstream repositories. This notice does not replace those terms. Retain applicable dependency notices when redistributing bundled code.

## Distribution

Keep this notice and the upstream MIT license with redistributed source and deployable copies. Make this notice accessible with the deployed site when serving the fonts, and retain applicable font copyright and OFL terms.
