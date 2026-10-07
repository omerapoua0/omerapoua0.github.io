/* Omar's robot (the site's mascot, not Omar): a glossy black humanoid with a
   black visor, two small white eye lights, red neon on its left side and blue
   on its right, lit by a cool-white beam from the top left on a near-black
   (#05070b) background. Generated for Omar with Higgsfield (AI-generated; it
   depicts no real person; see THIRD-PARTY-NOTICES).

   The media are public, immutable files on Higgsfield's CDN (cache-control:
   public, max-age=31536000, immutable; HTTP range requests supported, which
   the gate's seek needs). Visitors' browsers load them from there.

   Local override: files in public/robot/ win over the remote ones when they
   exist at build time (RobotStage.astro and LightGate.astro check with
   existsSync): hero.webp (poster), greet.mp4 / greet.webm, open.mp4 /
   open.webm. A .webm is added as an extra first source (useful where H.264
   is missing, e.g. headless Chromium). Never commit stand-in media. */

export const ROBOT_ORIGIN = 'https://d8j0ntlcm91z4.cloudfront.net';
const base = `${ROBOT_ORIGIN}/user_3Hu8nuHpTz0mXVPyD5jCOMXRDom`;

export interface RobotMedia {
  /** 1344×752 webp, 37 KB; identical to greet's first frame. */
  poster: { src: string; width: number; height: number };
  /** 1280×720 H.264, 24 fps, 5.04 s: 0–0.5 s head turned to its right (as
   *  the poster), 0.5–1.5 s turns to face you, 2.0–3.5 s raises its hand and
   *  waves, 4–5 s hand down, facing you (the held last frame). */
  greet: { mp4: string; duration: number };
  /** 1280×720 H.264, 5.04 s: 1–2 s hands come together, 2–3 s palms
   *  pressed, 3.3–4 s light bursts from the hands, white by ~4.8 s. */
  open: { mp4: string; duration: number };
}

export const robot: RobotMedia = {
  poster: { src: `${base}/hf_20261006_225842_4f700f9c-811f-40d8-a73a-50c195cd53ab_min.webp`, width: 1344, height: 752 },
  greet: { mp4: `${base}/hf_20261006_230045_e5e9ccdb-dc57-4ba0-9cbf-b0049c9ca019.mp4`, duration: 5.04 },
  open: { mp4: `${base}/hf_20261006_230045_4dfd8994-91e8-402b-8d57-024605a8a72a.mp4`, duration: 5.04 },
};

/** The light gate plays open.mp4 from the palms-pressed moment (seconds)… */
export const OPEN_SEEK = 3.2;
/** …for this long (ms) through the burst; the gate's own white takes over
 *  over the last 260 ms, so the page is opaque white before it navigates. */
export const OPEN_PLAY_MS = 1400;

/** Accessible name of the hero robot button (replays the wave). */
export const ROBOT_LABEL = 'Say hi to the robot';
