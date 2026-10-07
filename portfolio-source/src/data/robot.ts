/* OA-01, Omar's robot (the site's mascot, not Omar): a glossy black humanoid
   with red neon contour lines and a concentric red ring emitter on the side
   of its head, three-quarter profile, on a near-black smoky background.
   Original design, AI-generated for Omar with Higgsfield; it depicts no real
   person (see THIRD-PARTY-NOTICES).

   The media are public, immutable files on Higgsfield's CDN (cache-control:
   public, max-age=31536000, immutable; HTTP range requests supported, which
   the gate's seek needs). Visitors' browsers load them from there.

   Where they are used:
   - the homepage intro (Intro.astro + scripts/intro.ts), first homepage view
     of a browser session: ORB still -> TRANSFORM clip -> LOOK clip paused at
     LOOK.hold (he looks at you and asks) -> "Yes" plays LOOK from
     LOOK.resume to LOOK.white -> white light gate -> the homepage;
   - the hero (RobotStage.astro + scripts/robot.ts): the ROBOT still; "Say hi
     to OA-01" plays LOOK from 0 to LOOK.hold and holds, facing you;
   - the light gate (LightGate.astro + scripts/gate.ts): LOOK from OPEN_SEEK
     (palms together -> burst of light) for OPEN_PLAY_MS.

   Local override: files in public/robot/ win over the remote ones when they
   exist at build time (existsSync in the components): orb.webp, robot.webp,
   transform.mp4 / transform.webm, look.mp4 / look.webm. A .webm is added as
   an extra first source. Never commit stand-in media. */

export const ROBOT_ORIGIN = 'https://d8j0ntlcm91z4.cloudfront.net';
const base = `${ROBOT_ORIGIN}/user_3Hu8nuHpTz0mXVPyD5jCOMXRDom`;

/** How a source is drawn into the shared 1344 × 752 frame (the stills'
 *  size): "cover", then scaled by `s` and moved by dx/dy frame pixels. The
 *  values were measured on the real media (best pixel match of the
 *  transform's first frame with the ORB still, of its last frame with the
 *  ROBOT still, and of LOOK's first frame with the ROBOT still), so the
 *  hand-overs between them do not jump. */
export interface Fit { s: number; dx: number; dy: number }
export const FRAME = { width: 1344, height: 752 };

export const robot = {
  /** Start of the intro: glossy black sphere, white visor slit, red and blue
   *  orbit rings. 1344 × 752 webp, 21.7 KB. In the transform clip the
   *  sphere is drawn ≈ 1.5× larger: `fit` puts the still on that framing. */
  orb: { src: `${base}/hf_20261007_090741_0df9aeb7-1ee7-410b-b9d0-dbd0f0a3aa7c_min.webp`, width: 1344, height: 752, fit: { s: 1.49, dx: -115, dy: 170 } as Fit },
  /** The finished robot, three-quarter profile facing left (head ≈ 62% across,
   *  28% down; the red ring at ≈ 71% / 25%). 1344 × 752 webp, 36.4 KB. The
   *  hero's poster and the intro's still fallback. */
  still: { src: `${base}/hf_20261007_090627_69dabef2-b785-4918-bc7a-1b0cf9704c6f_min.webp`, width: 1344, height: 752 },
  /** 1280 × 720 H.264, 24 fps, 5.06 s, 1.06 MB: 0–0.8 s orb with rings;
   *  0.8–1.8 rings snap in, the visor flares; ≈ 2.0 bare sphere; 2.2–3.2 it
   *  splits and unfolds; 3.2–4.0 armour assembles, neon lights up; 4.0–5.06
   *  the finished robot, nearly still (the ROBOT still). */
  transform: { mp4: `${base}/hf_20261007_090931_99e661a7-2a3e-4037-b3b8-deb8ab7062f1.mp4`, duration: 5.06, fit: { s: .99, dx: 12, dy: 24 } as Fit },
  /** 1344 × 768 H.264, 24 fps, 5.18 s, 5.7 MB (audio track, always muted):
   *  starts on the ROBOT still; 0–1.0 s turns to look at you; 1.0–2.3 holds
   *  (the asking pose); 2.3–3.0 raises both hands; 3.0–3.5 palms together;
   *  3.5–4.5 cool-white light bursts from the hands; white by ≈ 4.6 s. */
  look: { mp4: `${base}/hf_20261007_090943_37408964-1dfa-49d9-a00e-9e3274b9c883.mp4`, duration: 5.18, fit: { s: .985, dx: -2, dy: 0 } as Fit },
};

/** LOOK timings (seconds). */
export const LOOK = {
  /** Paused here while he asks: looking straight at you. */
  hold: 1.6,
  /** "Yes" continues from here (hands rise)… */
  resume: 2.3,
  /** …to the white frame, where the light gate takes over. */
  white: 4.6,
};
/** Where the red ring (and the asking pose's ring) sit in the frame, in %. */
export const RING = { still: { x: 71, y: 25 }, ask: { x: 71.5, y: 29 } };

/** The light gate plays LOOK from just before the palms meet… */
export const OPEN_SEEK = 3.4;
/** …for this long (ms), into the burst (3.4 → 4.1 s); the gate's own white fades in over
 *  the last 260 ms, so the page is opaque white before it navigates, and a
 *  door still leaves in ≈ 0.8 s (the click → pagehide budget in qa.cjs). */
export const OPEN_PLAY_MS = 700;

/** Accessible name of the hero robot button (plays LOOK: he turns to you). */
export const ROBOT_LABEL = 'Say hi to OA-01, Omar’s robot';
