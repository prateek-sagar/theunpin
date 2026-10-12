import { useEffect, useRef, useState } from "react";
import "./ThreadField.css";

/* A field of thin threads that enter from the left edge and wander to the
   right. The field is read as a river in three zones:

     Zone 1 (x < 0.56)  — the original seeded random walk and its breathing.
                          This zone is intentionally unchanged.
     Zone 2 (0.56–0.64) — every thread is gathered into a tight, pinned neck at
                          x = 0.60 (the checkpoint), then held through the gate.
     Zone 3 (x > 0.64)  — each thread leaves with the shared heading and diverges
                          again through its own walk, wander and eddy.

   Threads never branch, split or merge: thread N stays thread N. All variation
   is seeded, so the field is identical on every render. Zone 1 geometry is
   reproduced exactly (see buildPosePath), so only zones 2 and 3 are new. */

/* Field. */
const THREAD_COUNT = 106;
const TOP_BOTTOM_PADDING = 100;
const ACCENT_EVERY = 12;

const VIEWBOX_WIDTH = 1600;
const VIEWBOX_HEIGHT = 960;

const SEED = 20241011;

/* Hero background variant. The field can be dropped behind the hero: the
   threads are dimmed to HERO_THREAD_OPACITY and a veil plus a bottom fade are
   laid over them so the copy and the principles row stay readable. Small
   screens render only the first HERO_THREAD_COUNT_MOBILE threads, keeping the
   animation cheap. */
export const HERO_THREAD_OPACITY = 0.7;
export const HERO_VEIL_STRENGTH = 0.72;
export const HERO_VEIL_END_X = 0.74;
export const HERO_FADE_BOTTOM = 0.28;
export const HERO_THREAD_COUNT_MOBILE = 50;

/* Optional passes, intentionally switched off. The braid / knit weave and the
   name overlay must not appear in the approved field; the flags keep them out
   without deleting the capability. */
export const NAME_ENABLED = false;
export const BRAID_ENABLED = false;
export const KNIT_ENABLED = false;

/* Random-walk shape (zone 1). */
const WAYPOINT_COUNT = 10;
const MAX_HEADING_DEG = 40;
const TURN_RATE = 7;
const TURN_RATE_VARIATION = 0.8;
const START_HEADING_DEG = 30;
const STEP_X_JITTER = 0.30;
const WALK_RETURN_PULL = 160;
const OVERSHOOT_X = 1.04;

/* Left-edge start spacing: a smooth non-linear warp of the lanes (so the field
   is not evenly gridded) plus a little seeded jitter. */
const START_SPACING_SHAPE = 0.5; // 0 = even spacing, higher = more curvature
const START_SPACING_JITTER = 0.4; // jitter, as a fraction of one even lane gap
const MIN_START_GAP = 8; // px floor so non-linear starts never clump together

/* Appearance. */
const OPACITY_MIN = 0.12;
const OPACITY_RANGE = 0.18;
const ACCENT_OPACITY = 0.55;
const ACCENT_HIGHLIGHT_OPACITY = 0.85;

/* Palette. Flat, luminous tints chosen with the seeded generator. Neutral and
   accent are rendered from CSS variables, so the palette can be swapped for the
   live brand colours; the tints carry their own flat colour on the stroke
   attribute. Set COLOR_ENABLED to false for the neutral-only look, and
   COLOR_EXTENDED to false to fall back to the original six tints. */
const COLOR_ENABLED = true;
const COLOR_EXTENDED = true;
const THREAD_PALETTE = {
  neutral: "#F3F5F7",
  tints: [
    { name: "teal", hex: "#5EEAD4", bright: true },
    { name: "sky", hex: "#93C5FD", bright: true },
    { name: "mist", hex: "#A5B4FC", bright: false },
    { name: "mint", hex: "#A7F3D0", bright: true },
    { name: "sand", hex: "#FDE68A", bright: false },
    { name: "rose", hex: "#FBCFE8", bright: true },
    { name: "aqua", hex: "#67E8F9", bright: true },
    { name: "violet", hex: "#C4B5FD", bright: false },
    { name: "lilac", hex: "#E9D5FF", bright: true },
    { name: "peach", hex: "#FDBA74", bright: false },
    { name: "coral", hex: "#FDA4AF", bright: false },
    { name: "lime", hex: "#BEF264", bright: true },
  ],
  baseCount: 6, // the original tints, used when COLOR_EXTENDED is false
};
const NEUTRAL_WEIGHT = 0.3; // reduced (from 0.4) so the field reads more colourful
const COLORED_OPACITY_MAX = 0.35;

/* Thickness tiers. Fine / medium / bold / hero, drawn from their own seeded
   stream so geometry, colours and motion are never disturbed. Hero threads are
   the highlighted ones. THICKNESS_MAX caps the whole range; THICKNESS_MIN keeps
   a hairline floor. */
const THICKNESS_MIN = 0.5;
const THICKNESS_MAX = 1.5;
const THICKNESS_FINE_WEIGHT = 0.5; // ~50% of threads, 0.5 - 1px
const THICKNESS_MEDIUM_WEIGHT = 0.3; // ~30%, 1 - 2px
const THICKNESS_BOLD_WEIGHT = 0.15; // ~15%, 2 - 3px
const THICKNESS_HERO_WEIGHT = 0.05; // ~5% (capped), 3 - 3.5px
const THICKNESS_FINE_MAX = 1.0;
const THICKNESS_MEDIUM_MAX = 1.6;
const THICKNESS_BOLD_MAX = 2.4;

/* Glow. Restrained: only hero and bold threads get a soft underlay, plus a
   gentle band at the neck. Fine threads stay crisp and unglowed so the field
   keeps its delicate texture. GLOW_OPACITY_MAX caps every glow so text over the
   section stays readable. GLOW_ENABLED off removes every glow layer (underlays,
   neck band and the neck brighten) while colours and thickness stay as they are. */
const GLOW_ENABLED = false;
const GLOW_WIDTH_MULTIPLIER = 3.5; // underlay width relative to its thread
const GLOW_OPACITY = 0.15; // per-underlay opacity (0.12 - 0.2 is the target)
const GLOW_OPACITY_MAX = 0.2; // hard ceiling for any single glow layer
const GLOW_BLUR = 3; // feGaussianBlur stdDeviation, in viewBox units; 0 = no filter
const NECK_GLOW_OPACITY = 0.1; // soft band centred on the pinch
const NECK_GLOW_COLOR = "#DDF6FF"; // threads' blended colour, not a hue shift
const NECK_BRIGHTEN = 0.4; // up to +40% opacity as threads approach the neck

/* Brand accent threads are forced to this tone and drawn from --tf-accent. */
const ACCENT_TONE = "accent";
const NEUTRAL_TONE = "neutral";

/* Motion. Set MOTION_ENABLED to false to freeze the whole field. */
const MOTION_ENABLED = true;
const MORPH_SHIFT = 0.035; // sway amplitude, as a fraction of the viewBox height (2–5%)
const MORPH_DURATION_MIN = 12; // seconds for one full A → B → A breath
const MORPH_DURATION_MAX = 24;
const ACCENT_TRAVEL_DURATION = 10; // seconds for the highlight to cross a thread
const ACCENT_DASH_LENGTH = 90; // highlight length, in normalised path units
const ACCENT_PATH_LENGTH = 1000; // pathLength each thread is normalised to

/* Three-zone collection. The gather is a long, smooth blend across roughly a
   quarter of the width; it ends in a short pinch, then the release fans out. All
   x values are fractions of the section width; the neck sits slightly above the
   vertical middle, matching the sketch. */
const NECK_X = 0.70; // horizontal position of the neck, fraction of the width
const COLLECT_START_X = 0.48; // nominal start of the gather window
const COLLECT_END_X = NECK_X; // where every thread has reached the neck
const COLLECT_START_JITTER = 0.035; // ± per-thread start offset, fraction of width
const COLLECT_SPEED_JITTER = 0.15; // ± per-thread ease speed
const COLLECT_DISTANCE_SCALE = 0.05; // extra lead for the farthest threads, fraction of width
const PINCH_LENGTH = 0.025; // length of the pinned pinch at the narrowest point, fraction of width

const NECK_Y_CENTER = 0.46 * VIEWBOX_HEIGHT; // shared centre line of the neck
const NECK_HEIGHT = 0.16 * VIEWBOX_HEIGHT; // width of the band at its narrowest

/* Neck wobble. A tiny, per-thread seeded vertical ripple that starts exactly at
   the funnel end (zero there, so the narrowest band stays put) and fades in with
   smootherstep as the threads pass through and leave the pinch. Neighbouring
   threads get different frequencies and phases, so nothing runs in step. */
const WOBBLE_AMPLITUDE_MIN = 0.005 * VIEWBOX_HEIGHT; // per-thread wobble, fraction of height
const WOBBLE_AMPLITUDE_MAX = 0.015 * VIEWBOX_HEIGHT;
const WOBBLE_FREQUENCY_MIN = 1.5; // cycles per width
const WOBBLE_FREQUENCY_MAX = 3.4;
const WOBBLE_EASE_IN = 0.13; // fraction of width over which the wobble fades in

/* Release dynamics (zone 3). Angles are in degrees, lengths in viewBox units. */
const RELEASE_HEADING_DEG = 60; // heading clamp, a little wider than the walk
const RELEASE_FAN_RATE = 155; // how fast threads fan away from the neck
const RELEASE_TURN_RATE_MIN = 6; // per-thread wander amplitude
const RELEASE_TURN_RATE_MAX = 16;
const RELEASE_TURN_FREQ_MIN = 0.7; // per-thread wander frequency, cycles / width
const RELEASE_TURN_FREQ_MAX = 1.6;
const EDDY_AMPLITUDE_MIN = 3; // gentle low-frequency sideways curl
const EDDY_AMPLITUDE_MAX = 8;
const EDDY_FREQUENCY_MIN = 1.8;
const EDDY_FREQUENCY_MAX = 3.6;
const FLOW_DRIFT = 3; // weak shared rightward drift (individuality dominates)
const RETURN_PULL = 14; // gentle pull back toward the centre band
const RELEASE_EASE_IN = 0.07; // fraction of width before the spread reaches full strength
const RELEASE_SAMPLE_STEP = 6; // integration step, in viewBox units
const EDDY_PHASE_DRIFT = 1.3; // pose B eddy phase offset (radians) → living drift

/* Deterministic pseudo-random generator (mulberry32) so every render produces
   the identical field and the output is safe for server rendering. */
function createSeededRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round = (value) => Math.round(value * 100) / 100;
const deg2rad = (deg) => (deg * Math.PI) / 180;
const clamp = (value, lo, hi) => (value < lo ? lo : value > hi ? hi : value);

/* --tf-background (#0b1220) as rgb channels, so the hero veil and fade can be
   built as rgba() gradients that match the field exactly. */
const HERO_VEIL_COLOR = "11, 18, 32";

/* Smootherstep (6t^5 - 15t^4 + 10t^3). Zero slope AND zero curvature at both
   ends, so the gather leaves the incoming path and reaches the neck with no
   kink and no sudden change of bend. Used for both the gather and the release
   ease-in. */
function smootherstep(t) {
  const c = clamp(t, 0, 1);
  return c * c * c * (c * (c * 6 - 15) + 10);
}

function smootherstepDeriv(t) {
  const c = clamp(t, 0, 1);
  const d = c - 1;
  return 30 * c * c * d * d;
}

const random = createSeededRandom(SEED);
const laneSpan = VIEWBOX_HEIGHT - TOP_BOTTOM_PADDING * 2;
const spanX = VIEWBOX_WIDTH * OVERSHOOT_X;

const COLLECT_START_PX = COLLECT_START_X * VIEWBOX_WIDTH;
const COLLECT_END_PX = COLLECT_END_X * VIEWBOX_WIDTH;
const PINCH_END_PX = COLLECT_END_PX + PINCH_LENGTH * VIEWBOX_WIDTH;

/* Separate seeded stream for the start spacing, so the walk and colour streams
   stay exactly as they were. */
const startRandom = createSeededRandom(SEED ^ 0x27d4eb2f);

/* Non-linear start positions: warp the even lane parameter through a seeded
   power curve, add a little jitter, keep it monotonic, then fit the padded
   band. The gaps between starts vary smoothly instead of being equal. */
function buildStartYs() {
  const n = THREAD_COUNT;
  const gamma = 1 + (startRandom() * 2 - 1) * START_SPACING_SHAPE;
  const jitter = START_SPACING_JITTER / (n - 1);
  const raw = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    raw.push(Math.pow(t, gamma) + (startRandom() * 2 - 1) * jitter);
  }
  const minGap = MIN_START_GAP / laneSpan;
  for (let i = 1; i < n; i++) {
    if (raw[i] < raw[i - 1] + minGap) raw[i] = raw[i - 1] + minGap;
  }
  const lo = raw[0];
  const scale = laneSpan / (raw[n - 1] - lo);
  return raw.map((e) => TOP_BOTTOM_PADDING + (e - lo) * scale);
}

const START_YS = buildStartYs();

/* A separate seeded stream for the palette, so adding colours never disturbs
   the random-walk stream and the paths and motion stay exactly as they were. */
const colorRandom = createSeededRandom(SEED ^ 0x68e31da4);

/* The active tint set: the full extended palette, or the original six when
   COLOR_EXTENDED is off. */
function activeTints() {
  return COLOR_EXTENDED
    ? THREAD_PALETTE.tints
    : THREAD_PALETTE.tints.slice(0, THREAD_PALETTE.baseCount);
}

/* Weighted pick from the palette. Bright-only is used for hero threads, which
   prefer accent and luminous tints. */
function pickWeightedColor(brightOnly = false) {
  const pool = brightOnly ? activeTints().filter((t) => t.bright) : activeTints();
  if (!brightOnly && colorRandom() < NEUTRAL_WEIGHT) return NEUTRAL_TONE;
  return pool[Math.floor(colorRandom() * pool.length)].hex;
}

/* Re-pick when a tone would repeat three threads in a row, so no more than two
   neighbours ever share a colour. */
function pickThreadColor(prevTone, prevPrevTone, brightOnly = false) {
  let tone = pickWeightedColor(brightOnly);
  let guard = 0;
  while (tone === prevTone && tone === prevPrevTone && guard < 12) {
    tone = pickWeightedColor(brightOnly);
    guard += 1;
  }
  return tone;
}

/* A third separate stream for the styling pass: thickness tier and width. Kept
   apart from the walk, colour, release and gather streams so the geometry and
   motion are byte-for-byte unchanged. */
const styleRandom = createSeededRandom(SEED ^ 0x1b873593);
const styleRand = (min, max) => min + styleRandom() * (max - min);

/* Assign a tier to every thread. Heroes are chosen with the seeded generator and
   spread across the height (threads are ordered top-to-bottom), so the highlight
   never clusters. The remaining slots are filled from a seeded shuffle of a pool
   built to the target weights, so the fine / medium / bold mix stays close to
   50 / 30 / 15 without clumping. */
function buildTiers(n) {
  const heroCount = Math.max(1, Math.round(n * THICKNESS_HERO_WEIGHT));
  const heroes = new Set();
  for (let b = 0; b < heroCount; b++) {
    const lo = Math.floor((n * b) / heroCount);
    const hi = Math.max(lo, Math.floor((n * (b + 1)) / heroCount) - 1);
    heroes.add(lo + Math.floor(styleRandom() * (hi - lo + 1)));
  }

  const boldCount = Math.round(n * THICKNESS_BOLD_WEIGHT);
  const mediumCount = Math.round(n * THICKNESS_MEDIUM_WEIGHT);
  const fineCount = Math.max(0, n - heroCount - boldCount - mediumCount);
  const pool = [];
  for (let i = 0; i < fineCount; i++) pool.push("fine");
  for (let i = 0; i < mediumCount; i++) pool.push("medium");
  for (let i = 0; i < boldCount; i++) pool.push("bold");
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(styleRandom() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  const tiers = new Array(n);
  let p = 0;
  for (let i = 0; i < n; i++) tiers[i] = heroes.has(i) ? "hero" : pool[p++];
  return tiers;
}

const TIERS = buildTiers(THREAD_COUNT);

/* Width within a tier. */
function pickThickness(tier) {
  if (tier === "hero") return round(styleRand(THICKNESS_BOLD_MAX, THICKNESS_MAX));
  if (tier === "bold") return round(styleRand(THICKNESS_MEDIUM_MAX, THICKNESS_BOLD_MAX));
  if (tier === "medium") return round(styleRand(THICKNESS_FINE_MAX, THICKNESS_MEDIUM_MAX));
  return round(styleRand(THICKNESS_MIN, THICKNESS_FINE_MAX));
}

/* Walk forward from the left edge, turning the heading a little each step and
   easing it back toward the thread's starting y. x only ever increases. This is
   the original zone-1 walk, untouched. */
function buildWaypoints(homeY) {
  const stepsX = [];
  let rawTotal = 0;
  for (let j = 0; j < WAYPOINT_COUNT - 1; j++) {
    const length = 1 + (random() * 2 - 1) * STEP_X_JITTER;
    stepsX.push(length);
    rawTotal += length;
  }
  const scale = spanX / rawTotal;

  const turnRate = TURN_RATE * (1 + (random() * 2 - 1) * TURN_RATE_VARIATION);
  let heading = (random() * 2 - 1) * START_HEADING_DEG;

  const points = [{ x: 0, y: homeY }];
  let x = 0;
  let y = homeY;

  for (let j = 0; j < WAYPOINT_COUNT - 1; j++) {
    const dx = stepsX[j] * scale;

    heading += turnRate * (random() * 2 - 1);
    heading += WALK_RETURN_PULL * ((homeY - y) / VIEWBOX_HEIGHT);
    if (heading > MAX_HEADING_DEG) heading = MAX_HEADING_DEG;
    if (heading < -MAX_HEADING_DEG) heading = -MAX_HEADING_DEG;

    x += dx;
    y += dx * Math.tan(deg2rad(heading));
    points.push({ x, y });
  }

  return points;
}

/* Pose B: the same waypoints with the left edge pinned and only the y of the
   interior and end points nudged by a small seeded amount. Each leg is clamped
   so the shifted path never exceeds the walk's own heading limit. */
function shiftWaypoints(points) {
  const step = MORPH_SHIFT * VIEWBOX_HEIGHT;
  const limit = Math.tan(deg2rad(MAX_HEADING_DEG));
  const shifted = [{ x: points[0].x, y: points[0].y }];
  let prevY = points[0].y;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const maxDy = dx * limit;
    let y = points[i].y + (random() * 2 - 1) * step;
    if (y - prevY > maxDy) y = prevY + maxDy;
    if (prevY - y > maxDy) y = prevY - maxDy;
    shifted.push({ x: points[i].x, y });
    prevY = y;
  }

  return shifted;
}

/* Catmull-Rom waypoints, converted to cubic Beziers exactly as the original
   toPath did, but kept as data so the crossing segment can be split cleanly. */
function toCubics(points) {
  const segs = [];
  const last = points.length - 1;
  for (let i = 0; i < last; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || points[i + 1];
    segs.push({
      p0: p1,
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      p1: p2,
    });
  }
  return segs;
}

function cubicPoint(seg, t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * seg.p0.x + b * seg.c1.x + c * seg.c2.x + d * seg.p1.x,
    y: a * seg.p0.y + b * seg.c1.y + c * seg.c2.y + d * seg.p1.y,
  };
}

function cubicTangent(seg, t) {
  const u = 1 - t;
  const a = 3 * u * u;
  const b = 6 * u * t;
  const c = 3 * t * t;
  return {
    x: a * (seg.c1.x - seg.p0.x) + b * (seg.c2.x - seg.c1.x) + c * (seg.p1.x - seg.c2.x),
    y: a * (seg.c1.y - seg.p0.y) + b * (seg.c2.y - seg.c1.y) + c * (seg.p1.y - seg.c2.y),
  };
}

/* De Casteljau split of one cubic at the parameter where x = X. The left half
   reproduces the original curve exactly up to X, so zone 1 is untouched. */
function splitAtX(seg, X) {
  let lo = 0;
  let hi = 1;
  let t = 0.5;
  for (let i = 0; i < 40; i++) {
    t = (lo + hi) / 2;
    if (cubicPoint(seg, t).x < X) lo = t;
    else hi = t;
  }
  const lerp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
  const a = lerp(seg.p0, seg.c1, t);
  const b = lerp(seg.c1, seg.c2, t);
  const c = lerp(seg.c2, seg.p1, t);
  const d = lerp(a, b, t);
  const e = lerp(b, c, t);
  const f = lerp(d, e, t);
  return { t, left: { p0: seg.p0, c1: a, c2: d, p1: f }, right: { p0: f, c1: e, c2: c, p1: seg.p1 } };
}

function pushCubic(parts, seg, isFirst) {
  if (isFirst) parts.push(`M${round(seg.p0.x)} ${round(seg.p0.y)}`);
  parts.push(
    `C${round(seg.c1.x)} ${round(seg.c1.y)} ${round(seg.c2.x)} ${round(seg.c2.y)} ${round(
      seg.p1.x
    )} ${round(seg.p1.y)}`
  );
}

function pushHermite(parts, a, b) {
  const dx = b.x - a.x;
  parts.push(
    `C${round(a.x + dx / 3)} ${round(a.y + (a.slope * dx) / 3)} ${round(
      b.x - dx / 3
    )} ${round(b.y - (b.slope * dx) / 3)} ${round(b.x)} ${round(b.y)}`
  );
}

/* Separate seeded stream for the release behaviour, so zones 2 and 3 never
   disturb the zone-1 random-walk or colour streams. */
const releaseRandom = createSeededRandom(SEED ^ 0x85ebca6b);
const releaseRand = (min, max) => min + releaseRandom() * (max - min);

/* A second separate stream for the gather stagger and neck wobble, so the
   release draw order — and therefore the release shape — is left untouched. */
const collectRandom = createSeededRandom(SEED ^ 0xc2b2ae35);
const collectRand = (min, max) => min + collectRandom() * (max - min);

/* Per-thread release identity: its own direction bias, fan strength, wander
   rate/frequency/phase and eddy amplitude/frequency/phase, plus its pinned
   position inside the neck band. It also carries the gather stagger: where the
   thread's collection window begins and how fast it eases in. */
function buildReleaseParams(i) {
  const spreadT = THREAD_COUNT > 1 ? i / (THREAD_COUNT - 1) : 0.5;
  const release = {
    neckY: NECK_Y_CENTER + (spreadT - 0.5) * NECK_HEIGHT,
    bias: releaseRandom() * 2 - 1,
    fanRate: RELEASE_FAN_RATE * (0.7 + releaseRandom() * 0.6),
    turnRate: releaseRand(RELEASE_TURN_RATE_MIN, RELEASE_TURN_RATE_MAX),
    turnFreq: releaseRand(RELEASE_TURN_FREQ_MIN, RELEASE_TURN_FREQ_MAX),
    turnPhase: releaseRandom() * Math.PI * 2,
    eddyAmp: releaseRand(EDDY_AMPLITUDE_MIN, EDDY_AMPLITUDE_MAX),
    eddyFreq: releaseRand(EDDY_FREQUENCY_MIN, EDDY_FREQUENCY_MAX),
    eddyPhase: releaseRandom() * Math.PI * 2,
  };

  /* Staggered gather. A seeded jitter shifts where the thread starts turning,
     and the distance term uses its entry lane so far-away threads get a longer
     lead and nearby threads start later. Threads peel in one after another. */
  const distance = clamp(
    Math.abs(START_YS[i] - NECK_Y_CENTER) / (VIEWBOX_HEIGHT / 2),
    0,
    1
  );
  const startJitter = (collectRandom() * 2 - 1) * COLLECT_START_JITTER;
  const speedJitter = 1 + (collectRandom() * 2 - 1) * COLLECT_SPEED_JITTER;
  const collectStartPx = clamp(
    COLLECT_START_PX + (startJitter - COLLECT_DISTANCE_SCALE * distance) * VIEWBOX_WIDTH,
    VIEWBOX_WIDTH * 0.05,
    COLLECT_END_PX - RELEASE_SAMPLE_STEP
  );

  /* Per-thread wobble drawn from the same separate stream (after the stagger
     draws, so the stagger is unchanged). Adjacent threads get unrelated
     frequency and phase, so the neck break-up never pulses as one block. */
  const wobbleAmp = collectRand(WOBBLE_AMPLITUDE_MIN, WOBBLE_AMPLITUDE_MAX);
  const wobbleFreq = collectRand(WOBBLE_FREQUENCY_MIN, WOBBLE_FREQUENCY_MAX);
  const wobblePhase = collectRandom() * Math.PI * 2;

  return {
    ...release,
    collectStartPx,
    collectSpeed: speedJitter,
    wobbleAmp,
    wobbleFreq,
    wobblePhase,
  };
}

const RELEASE_PARAMS = Array.from({ length: THREAD_COUNT }, (_, i) => buildReleaseParams(i));

/* Heading of a released thread at (x, y). Individual wander and eddy dominate;
   the shared drift is weak and a gentle pull keeps threads near the centre band.
   Everything is eased in with smootherstep from the end of the pinch, so the
   spread starts from zero with no kink at the neck exit. */
function releaseSlope(x, y, rel, eddyPhaseShift) {
  const u = x - PINCH_END_PX;
  const r = smootherstep(u / (RELEASE_EASE_IN * VIEWBOX_WIDTH));
  const fan = rel.fanRate * rel.bias * (u / VIEWBOX_WIDTH);
  const wander =
    rel.turnRate * Math.sin((2 * Math.PI * rel.turnFreq * u) / VIEWBOX_WIDTH + rel.turnPhase);
  const eddy =
    rel.eddyAmp *
    Math.sin((2 * Math.PI * rel.eddyFreq * u) / VIEWBOX_WIDTH + rel.eddyPhase + eddyPhaseShift);
  const drift = FLOW_DRIFT;
  const flow = clamp(fan + wander + eddy + drift, -RELEASE_HEADING_DEG, RELEASE_HEADING_DEG);
  /* The centre pull is applied after the clamp so it can always ease a thread
     back in, even when its own walk has saturated the heading limit. */
  const pull = -RETURN_PULL * ((y - NECK_Y_CENTER) / (VIEWBOX_HEIGHT / 2));
  return Math.tan(deg2rad((flow + pull) * r));
}

/* Evaluate one point of an already-built cubic chain at a given x. x is
   monotonic along these paths, so the owning segment is found by range. */
function freeAtX(segs, X) {
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];
    const lo = Math.min(seg.p0.x, seg.p1.x);
    const hi = Math.max(seg.p0.x, seg.p1.x);
    if (X < lo - 1e-9 || X > hi + 1e-9) continue;
    let a = 0;
    let b = 1;
    let t = 0.5;
    for (let k = 0; k < 48; k++) {
      t = (a + b) / 2;
      if (cubicPoint(seg, t).x < X) a = t;
      else b = t;
    }
    const point = cubicPoint(seg, t);
    const tangent = cubicTangent(seg, t);
    return { y: point.y, slope: tangent.x === 0 ? 0 : tangent.y / tangent.x };
  }
  return { y: 0, slope: 0 };
}

/* Per-thread neck wobble as a vertical displacement and its slope. It is exactly
   zero (value and slope) at the funnel end x = COLLECT_END_PX and fades in with
   smootherstep over WOBBLE_EASE_IN, so it never disturbs the narrowest band but
   immediately breaks any parallel run through and after the pinch. It depends
   only on x and the thread's own seeded params — never on the pose — so the neck
   stays pinned while the field morphs. */
function neckWobble(x, rel) {
  if (x <= COLLECT_END_PX) return { y: 0, slope: 0 };
  const span = WOBBLE_EASE_IN * VIEWBOX_WIDTH;
  const u = (x - COLLECT_END_PX) / span;
  const s = smootherstep(u);
  const ds = smootherstepDeriv(u) / span;
  const phase =
    (2 * Math.PI * rel.wobbleFreq * (x - COLLECT_END_PX)) / VIEWBOX_WIDTH + rel.wobblePhase;
  const sinp = Math.sin(phase);
  const cosp = Math.cos(phase);
  const dphase = (2 * Math.PI * rel.wobbleFreq) / VIEWBOX_WIDTH;
  return {
    y: rel.wobbleAmp * s * sinp,
    slope: rel.wobbleAmp * (ds * sinp + s * cosp * dphase),
  };
}

/* Sample a thread's whole post-zone-1 path as {x, y, slope} points:
     - the gather blends the thread's own free path (evaluated, not straight-
       lined) into the neck with a smootherstep weight w, so it keeps its natural
       curve while easing in and has zero slope at both ends;
     - the pinch is a short pinned run at the neck, already gathering the wobble;
     - the release integrates the existing release walk from the pinch exit. */
function buildSamples(startY, startSlope, segs, rel, eddyPhaseShift) {
  const step = RELEASE_SAMPLE_STEP;
  const ws = rel.collectStartPx;
  const span = COLLECT_END_PX - ws;
  const easeLen = Math.min(span / rel.collectSpeed, span);

  const samples = [{ x: ws, y: startY, slope: startSlope }];

  for (let x = ws + step; x < COLLECT_END_PX; x += step) {
    if (x > ws + easeLen) {
      samples.push({ x, y: rel.neckY, slope: 0 });
      continue;
    }
    const free = freeAtX(segs, x);
    const t = (x - ws) / easeLen;
    const w = smootherstep(t);
    const dw = smootherstepDeriv(t) / easeLen;
    samples.push({
      x,
      y: free.y * (1 - w) + rel.neckY * w,
      slope: free.slope * (1 - w) + (rel.neckY - free.y) * dw,
    });
  }
  samples.push({ x: COLLECT_END_PX, y: rel.neckY, slope: 0 });

  for (let x = COLLECT_END_PX + step; x < PINCH_END_PX; x += step) {
    const wb = neckWobble(x, rel);
    samples.push({ x, y: rel.neckY + wb.y, slope: wb.slope });
  }
  const pinchEnd = neckWobble(PINCH_END_PX, rel);
  samples.push({ x: PINCH_END_PX, y: rel.neckY + pinchEnd.y, slope: pinchEnd.slope });

  let y = rel.neckY;
  let x = PINCH_END_PX;
  while (x < spanX) {
    const xNext = Math.min(x + step, spanX);
    const xm = (x + xNext) / 2;
    const ym = y + releaseSlope(x, y, rel, eddyPhaseShift) * (xm - x);
    y += releaseSlope(xm, ym, rel, eddyPhaseShift) * (xNext - x);
    x = xNext;
    const wb = neckWobble(x, rel);
    samples.push({ x, y: y + wb.y, slope: releaseSlope(x, y, rel, eddyPhaseShift) + wb.slope });
  }

  return samples;
}

/* Build one complete pose path. Zone 1 reuses the original Catmull-Rom cubics
   (the crossing segment is subdivided so the curve up to the thread's own
   staggered gather start is identical); the gather, pinch and release are
   appended as smooth Hermite cubics. The neck is pinned in both poses, so the
   morph never moves it. */
function buildPosePath(points, rel, eddyPhaseShift) {
  const segs = toCubics(points);
  const boundary = rel.collectStartPx;

  let crossing = segs.length - 1;
  for (let i = 0; i < segs.length; i++) {
    if (cubicPoint(segs[i], 1).x >= boundary) {
      crossing = i;
      break;
    }
  }

  const parts = [];
  for (let i = 0; i < crossing; i++) pushCubic(parts, segs[i], i === 0);
  const { left, t } = splitAtX(segs[crossing], boundary);
  pushCubic(parts, left, crossing === 0);

  const tangent = cubicTangent(segs[crossing], t);
  const endSlope = tangent.x === 0 ? 0 : tangent.y / tangent.x;

  const samples = buildSamples(left.p1.y, endSlope, segs, rel, eddyPhaseShift);
  for (let i = 0; i < samples.length - 1; i++) pushHermite(parts, samples[i], samples[i + 1]);

  return parts.join(" ");
}

/* First pass builds pose A exactly as before, so the static starting frame is
   unchanged and the seeded random stream stays in step. Tones are drawn from the
   separate colour stream; accent threads keep the brand teal. */
let prevTone = null;
let prevPrevTone = null;

const POSES = Array.from({ length: THREAD_COUNT }, (_, i) => {
  const startY = START_YS[i];
  const isAccent = i % ACCENT_EVERY === 0;
  const tier = TIERS[i];
  const isHero = tier === "hero";
  const points = buildWaypoints(startY);

  let tone;
  if (isAccent) tone = ACCENT_TONE;
  else if (!COLOR_ENABLED) tone = NEUTRAL_TONE;
  else tone = pickThreadColor(prevTone, prevPrevTone, isHero);
  prevPrevTone = prevTone;
  prevTone = tone;

  const isTinted = tone !== NEUTRAL_TONE && tone !== ACCENT_TONE;

  return {
    id: `thread-field-thread-${i + 1}`,
    points,
    color: isTinted ? tone : null,
    isAccent,
    isNeutral: tone === NEUTRAL_TONE,
    tier,
    isHero,
    glowing: GLOW_ENABLED && (tier === "hero" || tier === "bold"),
    opacity: isAccent
      ? ACCENT_OPACITY
      : round(
          OPACITY_MIN +
            random() * (isTinted ? COLORED_OPACITY_MAX - OPACITY_MIN : OPACITY_RANGE)
        ),
  };
});

/* Second pass draws pose B, the per-thread duration and the begin offsets from
   the same generator. Offsets are stratified across the field (plus a seeded
   jitter) so no two threads share a phase and the field never pulses as one
   block. An offset may exceed a thread's own duration; it simply starts the
   loop part-way through, which is exactly what a negative begin does. */
const accentTravel = ACCENT_DASH_LENGTH + ACCENT_PATH_LENGTH;
const THREADS = POSES.map((thread, i) => {
  const morphDuration = round(
    MORPH_DURATION_MIN + random() * (MORPH_DURATION_MAX - MORPH_DURATION_MIN)
  );
  const morphPhase = (i + random() * 0.8) / THREAD_COUNT;
  const accentPhase = (i + random() * 0.8) / THREAD_COUNT;
  const shifted = shiftWaypoints(thread.points);
  const rel = RELEASE_PARAMS[i];

  return {
    ...thread,
    d: buildPosePath(thread.points, rel, 0),
    dB: buildPosePath(shifted, rel, EDDY_PHASE_DRIFT),
    thickness: pickThickness(thread.tier),
    morphDuration,
    morphBegin: -round(morphPhase * MORPH_DURATION_MAX),
    accentBegin: -round(accentPhase * ACCENT_TRAVEL_DURATION),
  };
});

/* ---- Styling pass render helpers (derived, no geometry). ---- */

/* Tone class for a thread, so accent and neutral keep their CSS variable colour
   while tinted threads carry a flat hex on the stroke attribute. */
function toneClass(thread, base = "") {
  const tone = thread.isAccent
    ? "thread-field-thread--accent"
    : thread.isNeutral
    ? "thread-field-thread--neutral"
    : "";
  const merged = `${base} ${tone}`.trim();
  return merged || undefined;
}

/* Bold and hero draw first (behind); fine draws last (on top), so the hairline
   threads are never hidden. Stable sort keeps index order within a tier. */
const RENDER_THREADS = [...THREADS].sort((a, b) => b.thickness - a.thickness);

/* Underlays only exist for glowing threads (hero + bold). */
const GLOWING_THREADS = THREADS.filter((t) => t.glowing);

/* Neck brighten: a shared, userSpaceOnUse alpha ramp following the same
   smootherstep as the collection blend — zero at the funnel start, full at the
   pinch, easing back to zero after it. Used as a mask on the per-thread brighten
   overlay, so it can never introduce a step. */
const NECK_BRIGHTEN_START_PX = COLLECT_START_PX;
const NECK_BRIGHTEN_PEAK_PX = PINCH_END_PX;
const NECK_BRIGHTEN_END_PX = PINCH_END_PX + RELEASE_EASE_IN * VIEWBOX_WIDTH;

function neckBrightenAlpha(x) {
  if (x <= NECK_BRIGHTEN_START_PX) return 0;
  if (x <= COLLECT_END_PX) {
    return smootherstep(
      (x - NECK_BRIGHTEN_START_PX) / (COLLECT_END_PX - NECK_BRIGHTEN_START_PX)
    );
  }
  if (x <= NECK_BRIGHTEN_PEAK_PX) return 1;
  if (x >= NECK_BRIGHTEN_END_PX) return 0;
  return 1 - smootherstep(
    (x - NECK_BRIGHTEN_PEAK_PX) / (NECK_BRIGHTEN_END_PX - NECK_BRIGHTEN_PEAK_PX)
  );
}

const NECK_BRIGHTEN_STOPS = Array.from({ length: 25 }, (_, k) => {
  const offset = k / 24;
  const x =
    NECK_BRIGHTEN_START_PX +
    offset * (NECK_BRIGHTEN_END_PX - NECK_BRIGHTEN_START_PX);
  return { offset, alpha: neckBrightenAlpha(x) };
});

/* Soft band centred on the pinch. */
const NECK_GLOW_CX = (COLLECT_END_PX + PINCH_END_PX) / 2;
const NECK_GLOW_RX = (PINCH_END_PX - COLLECT_END_PX) / 2 + 0.055 * VIEWBOX_WIDTH;
const NECK_GLOW_RY = NECK_HEIGHT * 0.8;

/* Ease-in-out morph between the two poses. */
function MorphAnimate({ from, to, duration, begin }) {
  return (
    <animate
      attributeName="d"
      dur={`${duration}s`}
      begin={`${begin}s`}
      repeatCount="indefinite"
      calcMode="spline"
      keyTimes="0;0.5;1"
      keySplines="0.45 0 0.55 1;0.45 0 0.55 1"
      values={`${from};${to};${from}`}
    />
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function useIsNarrow() {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return narrow;
}

export default function ThreadField({ variant = "default" }) {
  const sectionRef = useRef(null);
  const svgRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const isNarrow = useIsNarrow();
  const motionOn = MOTION_ENABLED && !reducedMotion;
  const isBackground = variant === "background";

  useEffect(() => {
    if (!motionOn) return undefined;
    const section = sectionRef.current;
    const svg = svgRef.current;
    if (!section || !svg || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    let onScreen = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        if (entry.isIntersecting) svg.unpauseAnimations();
        else svg.pauseAnimations();
      },
      { threshold: 0 }
    );
    observer.observe(section);

    /* Also stop the SMIL clock while the tab is hidden, then resume only if the
       section is still on screen. */
    const onVisibility = () => {
      if (document.hidden) svg.pauseAnimations();
      else if (onScreen) svg.unpauseAnimations();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [motionOn]);

  const visibleThreads =
    isBackground && isNarrow ? RENDER_THREADS.slice(0, HERO_THREAD_COUNT_MOBILE) : RENDER_THREADS;

  return (
    <section
      className={`thread-field${isBackground ? " thread-field--background" : ""}`}
      ref={sectionRef}
      style={isBackground ? { "--tf-thread-opacity": HERO_THREAD_OPACITY } : undefined}
    >
      <svg
        ref={svgRef}
        className="thread-field-svg"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {GLOW_ENABLED && GLOW_BLUR > 0 && (
            <filter id="tf-glow-blur" x="-10%" y="-40%" width="120%" height="180%">
              <feGaussianBlur stdDeviation={GLOW_BLUR} />
            </filter>
          )}

          {GLOW_ENABLED && (
            <>
              {/* Alpha ramp along x, following the collection smootherstep. */}
              <linearGradient
                id="tf-neck-brighten"
                gradientUnits="userSpaceOnUse"
                x1={NECK_BRIGHTEN_START_PX}
                y1="0"
                x2={NECK_BRIGHTEN_END_PX}
                y2="0"
              >
                {NECK_BRIGHTEN_STOPS.map((stop, k) => (
                  <stop
                    key={k}
                    offset={`${(stop.offset * 100).toFixed(1)}%`}
                    stopColor="#FFFFFF"
                    stopOpacity={stop.alpha.toFixed(3)}
                  />
                ))}
              </linearGradient>
              <mask
                id="tf-neck-mask"
                maskUnits="userSpaceOnUse"
                x="0"
                y="0"
                width={VIEWBOX_WIDTH}
                height={VIEWBOX_HEIGHT}
              >
                <rect
                  x={NECK_BRIGHTEN_START_PX}
                  y="0"
                  width={NECK_BRIGHTEN_END_PX - NECK_BRIGHTEN_START_PX}
                  height={VIEWBOX_HEIGHT}
                  fill="url(#tf-neck-brighten)"
                />
              </mask>

              <radialGradient id="tf-neck-glow">
                <stop offset="0%" stopColor={NECK_GLOW_COLOR} stopOpacity={NECK_GLOW_OPACITY} />
                <stop
                  offset="55%"
                  stopColor={NECK_GLOW_COLOR}
                  stopOpacity={NECK_GLOW_OPACITY * 0.35}
                />
                <stop offset="100%" stopColor={NECK_GLOW_COLOR} stopOpacity="0" />
              </radialGradient>
            </>
          )}
        </defs>

        {/* Glow underlays — hero and bold only, drawn behind everything. A single
           group filter feathers them all at once; never one filter per path. */}
        {GLOW_ENABLED && (
          <g
            className="thread-field-glow"
            filter={GLOW_BLUR > 0 ? "url(#tf-glow-blur)" : undefined}
          >
            {GLOWING_THREADS.map((thread) => (
              <path
                key={`glow-${thread.id}`}
                className={toneClass(thread, "thread-field-glow-path")}
                d={thread.d}
                fill="none"
                stroke={thread.color || undefined}
                style={{ strokeWidth: thread.thickness * GLOW_WIDTH_MULTIPLIER }}
                strokeOpacity={Math.min(GLOW_OPACITY, GLOW_OPACITY_MAX)}
                strokeLinecap="round"
              >
                {motionOn && (
                  <MorphAnimate
                    from={thread.d}
                    to={thread.dB}
                    duration={thread.morphDuration}
                    begin={thread.morphBegin}
                  />
                )}
              </path>
            ))}
          </g>
        )}

        {/* Neck highlight — a soft band on the pinch, behind the threads so it
           never hides them. Static: the neck is pinned during the sway. */}
        {GLOW_ENABLED && (
          <ellipse
            className="thread-field-neck-glow"
            cx={NECK_GLOW_CX}
            cy={NECK_Y_CENTER}
            rx={NECK_GLOW_RX}
            ry={NECK_GLOW_RY}
            fill="url(#tf-neck-glow)"
          />
        )}

        {visibleThreads.map((thread) => (
          <g key={thread.id}>
            <path
              id={thread.id}
              className={toneClass(thread, "thread-field-thread")}
              d={thread.d}
              fill="none"
              stroke={thread.color || undefined}
              style={{ strokeWidth: thread.thickness }}
              strokeOpacity={thread.opacity}
              strokeLinecap="round"
            >
              {motionOn && (
                <MorphAnimate
                  from={thread.d}
                  to={thread.dB}
                  duration={thread.morphDuration}
                  begin={thread.morphBegin}
                />
              )}
            </path>

            {/* Brighten toward the neck: same geometry, masked by the shared
               smootherstep ramp so there is never a step at either end. */}
            {GLOW_ENABLED && thread.glowing && (
              <path
                className={toneClass(thread, "thread-field-brighten")}
                d={thread.d}
                fill="none"
                stroke={thread.color || undefined}
                style={{ strokeWidth: thread.thickness }}
                strokeOpacity={Math.min(thread.opacity * NECK_BRIGHTEN, GLOW_OPACITY_MAX)}
                strokeLinecap="round"
                mask="url(#tf-neck-mask)"
              >
                {motionOn && (
                  <MorphAnimate
                    from={thread.d}
                    to={thread.dB}
                    duration={thread.morphDuration}
                    begin={thread.morphBegin}
                  />
                )}
              </path>
            )}

            {thread.isAccent && motionOn && (
              <path
                className="thread-field-thread thread-field-thread--highlight"
                d={thread.d}
                fill="none"
                strokeWidth="1"
                strokeOpacity={ACCENT_HIGHLIGHT_OPACITY}
                strokeLinecap="round"
                pathLength={ACCENT_PATH_LENGTH}
                strokeDasharray={`${ACCENT_DASH_LENGTH} ${ACCENT_PATH_LENGTH}`}
              >
                <MorphAnimate
                  from={thread.d}
                  to={thread.dB}
                  duration={thread.morphDuration}
                  begin={thread.morphBegin}
                />
                <animate
                  attributeName="stroke-dashoffset"
                  from={accentTravel}
                  to="0"
                  dur={`${ACCENT_TRAVEL_DURATION}s`}
                  begin={`${thread.accentBegin}s`}
                  repeatCount="indefinite"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines="0.4 0 0.6 1"
                />
              </path>
            )}
          </g>
        ))}
      </svg>

      {/* Background variant: a left-hand veil keeps the hero copy legible while
         the right side stays open, and a bottom fade protects the principles
         row. Both share the field's own background colour, so they are invisible
         as shapes and only dim what is behind them. */}
      {isBackground && (
        <>
          <div
            className="thread-field-veil"
            aria-hidden="true"
            style={{
              background: `linear-gradient(90deg, rgba(${HERO_VEIL_COLOR}, ${HERO_VEIL_STRENGTH}) 0%, rgba(${HERO_VEIL_COLOR}, 0) ${HERO_VEIL_END_X * 100}%)`,
            }}
          />
          <div
            className="thread-field-fade"
            aria-hidden="true"
            style={{
              background: `linear-gradient(180deg, rgba(${HERO_VEIL_COLOR}, 0) ${(1 - HERO_FADE_BOTTOM) * 100}%, rgba(${HERO_VEIL_COLOR}, 0.95) 100%)`,
            }}
          />
        </>
      )}
    </section>
  );
}
