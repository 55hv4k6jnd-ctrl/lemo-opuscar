// ROPE & STEAM — shots. Each paints a TONAL 4:3 frame (1440×1080, grey values = print density) into ctx.g, and the
// rope's colour into ctx.m (same transform). b = beats since the section started (section tempo).
import * as S from './sets.js';
import { drawFigure, P0, runPose, runBob, walkPose, walkBob, mixPose } from './engine/figure.js';
import { form, stroke, grey, rectPts, ellipsePts, catmull } from './engine/ink.js';
import { JOSIE, AMOS, drawCalf, drawBison } from './chars.js';
import { pose, EXPR } from './poses.js';
import { rope, line, loop, twirl, coils, flight, figAt } from './rope.js';
import { SEC } from './timeline.js';

export const W = 1440, H = 1080;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const ei = x => Math.pow(clamp(x), 2);
const seg = (x, a, b) => clamp((x - a) / (b - a));
const lerp2 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const TRACK = {};          // screen points the film assembly needs (iris centre), in film coordinates

function windUp() { const p = pose('whirl'); p.lean = -.18; p.L = { hip: .4, abd: .12, knee: .55, ankle: .2 }; p.R = { hip: -.05, abd: .1, knee: .5, ankle: .2 }; return p; }
// keyframed poses / numbers (never switch poses in an `if`)
export function poseAt(b, keys, ease = ss) {
  const val = v => typeof v === 'function' ? v(b) : v;
  if (b <= keys[0][0]) return mixPose(val(keys[0][1]), val(keys[0][1]), 0);
  for (let i = 1; i < keys.length; i++) if (b < keys[i][0]) { const [b0, A] = keys[i - 1], [b1, B] = keys[i]; return mixPose(val(A), val(B), ease((b - b0) / (b1 - b0))); }
  const l = val(keys[keys.length - 1][1]); return mixPose(l, l, 0);
}
export function numAt(b, keys, ease = ss) {
  if (b <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (b < keys[i][0]) { const [b0, a] = keys[i - 1], [b1, c] = keys[i]; return lerp(a, c, ease((b - b0) / (b1 - b0))); }
  return keys[keys.length - 1][1];
}
const withExpr = (p, e) => { p.expr = { ...p.expr, ...e }; return p; };
// camera: zoom z about the film point (fx, fy), applied to both layers
function cam(ctx, z, fx, fy) { for (const c of [ctx.g, ctx.m]) { c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-fx, -fy); } }
function shake(ctx, amp, t) { if (amp <= 0) return; const dx = Math.sin(t * 61) * amp + Math.sin(t * 37) * amp * .6, dy = Math.cos(t * 53) * amp * .8; for (const c of [ctx.g, ctx.m]) c.translate(dx, dy); }
const toFilm = (g, p) => { const m = g.getTransform(); return [m.a * p[0] + m.c * p[1] + m.e, m.b * p[0] + m.d * p[1] + m.f]; };
function fig(ctx, ch, opt) { return drawFigure(ctx.g, ch, opt); }

// ---------------- shared sets ----------------
function ranchMorning(g, o = {}) {
  S.sky(g, W, 600, 3, .93, { clouds: 5 });
  S.range(g, -60, W + 60, o.rangeBase ?? 560, o.rangeH ?? 230, 2.1, .46, { n: 16 });
  S.hills(g, -40, W + 40, (o.rangeBase ?? 560) + 20, 40, 4, .58, { depth: 120 });
  S.forest(g, -40, W + 40, (o.rangeBase ?? 560) + 30, 46, .26, 5, .7);
}

// ============ OPEN · cold open: Josie ropes herself (full shot) ============
export function open(ctx, b, t) {
  const g = ctx.g;
  { const k = ss(seg(b, 4, 6.5)) * (1 - ss(seg(b, 10.5, 13))); cam(ctx, lerp(1, 1.4, k), lerp(720, 640, k), lerp(540, 640, k)); }
  S.sky(g, W, 560, 7, .93, { clouds: 4 });
  S.range(g, -60, W + 60, 520, 170, 1.3, .48, { n: 12 });
  S.hills(g, -40, W + 40, 540, 30, 2, .6, { depth: 80 });
  S.forest(g, -40, W + 40, 560, 40, .28, 3, .8);
  S.ground(g, 0, W, 590, H, .64, 11, { tufts: 120 });
  S.barn(g, 80, 650, 220, 110, .55, 21);
  S.fence(g, -20, W + 20, 760, 120, 210, .38, 31);
  // Grandpa, deadpan, at the right
  const ap = poseAt(b, [[0, pose('amosStand')], [8, pose('amosStand')], [9, withExpr(mixPose(pose('amosStand'), pose('amosStand'), 0), { look: [0, .5] })]]);
  ap.nod = numAt(b, [[0, .08], [8, .08], [9, .3], [12, .3], [12.6, .3], [13.2, .3]]);
  ap.headTurn = numAt(b, [[0, 0], [11, 0], [11.5, .25], [12, -.25], [12.5, .2], [13, 0]]);          // a slow shake of the head
  fig(ctx, AMOS, { x: 1150, ground: 965, scale: 78, yaw: -62, pose: ap, t });
  // Josie: whirl too fast → loop flies straight up → drops over her → she sits down hard
  const jp = poseAt(b, [[0, pose('whirl')], [4.2, pose('whirl')], [4.5, pose('throw')], [5.0, pose('tangled')], [6.2, pose('tangled')], [6.9, pose('sit')]]);
  if (b > 5 && b < 6.4) jp.lean = Math.sin((b - 5) * 9) * .06 * (6.4 - b);           // the wobble before the sit
  const bounce = b > 7 && b < 7.9 ? Math.abs(Math.sin(seg(b, 7, 7.9) * Math.PI * 2)) * 22 * (1 - seg(b, 7, 7.9)) : 0;
  const opt = { x: 560, ground: 965 - bounce, scale: 92, yaw: 28, pose: jp, t };
  const F = figAt(JOSIE, opt), hand = F.hand('R'), hl = F.hand('L');
  const chest = lerp2(F.neck, F.hip, .45);
  let L = null;           // {c, rx, ry} when the loop is around her
  if (b >= 4.5) {
    const u = seg(b, 4.5, 5.6);
    const top = [hand[0] - 20, hand[1] - 230], c = u < .45 ? lerp2([hand[0], hand[1] - 60], top, eo(u / .45)) : lerp2(top, chest, ei((u - .45) / .55));
    L = { c, rx: lerp(130, 72, eo(u)), ry: lerp(36, 22, u) };
  }
  if (L) loop(ctx, L.c[0], L.c[1], L.rx, L.ry, 'back', 3.4);
  fig(ctx, JOSIE, opt);
  TRACK.josie = toFilm(g, F.head);
  if (!L) {
    const ph = t * 2.7;                                                                  // far too fast
    const tw = twirl(ctx, hand, 128, ph, { lift: 70, flat: .3, w: 3.4 });
    line(ctx, tw.honda, hl, 40, 3);
  } else {
    loop(ctx, L.c[0], L.c[1], L.rx, L.ry, 'front', 3.4);
    line(ctx, [L.c[0] + L.rx * .9, L.c[1] + 4], hl, 26, 3);
  }
  coils(ctx, hl, 22, 3, Math.sin(t * 3));
}

// ============ LESSON · Grandpa's lazy throw (locked extreme wide) ============
export function lesson(ctx, b, t) {
  const g = ctx.g;
  ranchMorning(g, { rangeBase: 520, rangeH: 250 });
  S.ground(g, 0, W, 570, H, .64, 12, { tufts: 200 });
  S.river(g, [[1000, 572], [1120, 600], [1260, 640], [1380, 700], [1480, 760]], 30, 120, .88, 4, t);
  S.barn(g, 60, 680, 230, 130, .52, 22);
  S.fence(g, 300, W + 30, 760, 70, 150, .38, 32);
  S.fence(g, -20, 300, 760, 70, 160, .38, 33);
  const post = [1040, 900], postH = 120;
  S.snubPost(g, post[0], post[1], postH);
  // Josie, small, perched on the fence at the left, watching
  const jp = withExpr(pose('perch'), { look: [0, 0] }); jp.aR = { fl: .2, abd: .3, el: .3, wr: 0, hand: 'grip' }; jp.aL = { fl: .2, abd: .3, el: .3, wr: 0, hand: 'grip' };
  jp.headTurn = numAt(b, [[0, -.6], [5, -.2], [10, .2], [12, .55], [20, .55]]);
  const jy = 760 - 70 * .94;
  fig(ctx, JOSIE, { x: 250, y: jy, scale: 27, yaw: 70, pose: jp, t });
  // Grandpa strolls in, twirls once, twice, lets it go
  const x = numAt(b, [[0, -80], [5.5, 640]], x => x);
  const walking = b < 5.5;
  const ap = walking ? pose('walk', b * .55) : poseAt(b, [[5.5, pose('amosStand')], [6.3, pose('amosTwirl')], [9.7, pose('amosTwirl')], [10.2, pose('amosThrow')], [12.6, pose('amosThrow')], [13.2, withExpr(pose('haul'), EXPR.calm)], [14.5, pose('amosStand')]]);
  if (b >= 12.6 && b < 14.5) ap.lean = numAt(b, [[12.6, .1], [13.2, -.12], [14.5, .08]]);
  const opt = { x, ground: 905, scale: 40, yaw: 90, pose: ap, t };
  const F = figAt(AMOS, opt), hand = F.hand('R'), hl = F.hand('L');
  fig(ctx, AMOS, opt);
  const top = [post[0], post[1] - postH];
  if (b >= 6 && b < 10) { const tw = twirl(ctx, hand, 52, (b - 6) * SEC.LESSON.beat * .9, { lift: 26, flat: .28, w: 2.4 }); line(ctx, tw.honda, hl, 14, 2.2); }
  else if (b >= 10 && b < 12) flight(ctx, [hand[0] + 30, hand[1] - 26], [top[0], top[1] - 6], ss(seg(b, 10, 12)) , 70, 52, 34, hand, { w: 2.4 });
  else if (b >= 12) {
    const k = seg(b, 12, 13.2), rx = lerp(34, 13, eo(k)), cy = lerp(top[1] + 2, top[1] + 22, eo(seg(b, 12, 12.5)));
    loop(ctx, top[0], cy, rx, rx * .3, 'all', 2.4);
    line(ctx, hand, [top[0] - rx, cy], lerp(46, 4, eo(k)), 2.2);
  }
  if (b >= 6) coils(ctx, hl, 9, 2);
}

// ============ GATE · the calf walks out behind her (locked full shot) ============
export function gate(ctx, b, t) {
  const g = ctx.g;
  S.sky(g, W, 520, 9, .93, { clouds: 3 });
  S.range(g, -60, W + 60, 470, 140, 3.3, .48, { n: 10 });
  S.forest(g, -40, W + 40, 500, 50, .28, 6, .8);
  S.ground(g, 0, W, 520, H, .64, 13, { tufts: 140 });
  S.fence(g, -20, W + 20, 700, 110, 200, .4, 34);                    // the back of the pen
  const hx = 330, gb = 930, gl = 570, gh = 250;
  // the pen fence to the right of the latch post (same plane as the gate)
  S.fence(g, 900, W + 40, gb, gh * .98, 180, .42, 35);
  form(g, rectPts(hx - 16, gb - gh - 40, 32, gh + 40), { v: .36, line: 2, grad: .15, seed: 36, shade: 6 });      // hinge post
  form(g, rectPts(888, gb - gh - 30, 30, gh + 30), { v: .36, line: 2, grad: .15, seed: 37, shade: 6 });          // latch post
  const open = numAt(b, [[0, 0], [6, 0], [9.5, 1.05], [10.3, .95], [11, 1]], ss);
  // the calf: grazing inside, then tiptoes out through the gap, toward us and off to the right
  const cu = seg(b, 8, 14.5);
  const cx = cu < .35 ? lerp(700, 905, cu / .35) : lerp(905, 1580, (cu - .35) / .65), cy = cu < .35 ? lerp(860, 940, cu / .35) : lerp(940, 975, (cu - .35) / .65);
  const cs = lerp(56, 70, clamp(cu * 2)), moving = b > 8 && b < 14.5;
  const calf = () => drawCalf(g, cx, cy, cs, (b - 8) * .5, moving ? 1 : 0, { f: 1, head: b < 8 ? -.5 : .15, tip: moving ? 1 : 0, ears: Math.sin(t * 3) * .1, t });
  if (cu < .3) calf();
  const L = S.gateLeaf(g, hx, gb, gl, gh, open, .48, 38);
  // Josie on the top rail (sulking, arms folded), riding the gate; hops off at beat 15, turns, double take
  const seat = L.P(.55, .9);
  const hop = seg(b, 15, 16);
  const groundX = seat[0] + 40;
  let jx = lerp(seat[0], groundX, hop), jyP = seat[1] - 6;
  const yawJ = numAt(b, [[0, 18], [15, 18], [16, 10], [16.4, 10], [16.7, 125], [17.0, 125], [17.3, 10], [17.6, 10], [17.75, 170], [18, 170], [18.08, 0]], x => x < 1 ? ss(x) : 1);
  const jp = poseAt(b, [[0, pose('perch')], [15, pose('perch')], [15.6, pose('take')], [16, pose('stand')], [17, pose('stand')], [18, pose('stand')], [18.08, pose('take')], [21, pose('take')]], x => clamp(x));
  const jump = b > 18 && b < 18.6 ? Math.sin(seg(b, 18, 18.6) * Math.PI) * 40 : 0;
  const opt = hop < 1 ? { x: jx, y: lerp(jyP, jyP - 60, Math.sin(hop * Math.PI)) + hop * 0, scale: 80, yaw: yawJ, pose: jp, t } : { x: jx, ground: 985 - jump, scale: 80, yaw: yawJ, pose: jp, t };
  if (hop >= .5 && hop < 1) { const F = figAt(JOSIE, { ...opt, ground: lerp(seat[1] + 170, 985, (hop - .5) * 2) }); opt.y = undefined; opt.ground = lerp(seat[1] + 190, 985, ss((hop - .5) * 2)); }
  if (b > 18) opt.pose.expr = { ...EXPR.alarm, hatUp: b < 18.5 ? .35 * Math.sin(seg(b, 18, 18.5) * Math.PI) : 0 };
  fig(ctx, JOSIE, opt);
  if (cu >= .3) calf();
  // the latch: a bar that slides out of its keeper at beat 6
  const lx = lerp(L.ex, L.ex - 30, seg(b, 5.6, 6));
  form(g, rectPts(lx - 6, gb - gh * .6 - 8, 44, 16), { v: .25, line: 1.6, seed: 39 });
}

// ============ CHASE · across the sage flats (tracking, undercranked) ============
export function chase(ctx, b, t) {
  const g = ctx.g, V = 520, x = (t - SEC.CHASE.t0) * V;          // camera travel (px of ground)
  S.sky(g, W, 560, 12, .92, { clouds: 5 });
  g.save(); g.translate(-x * .04, 0); S.range(g, -200, W + 1200, 500, 210, 4.2, .46, { n: 22 }); g.restore();
  g.save(); g.translate(-(x * .25) % 2400, 0); for (const o of [0, 2400]) S.hills(g, o - 100, o + 2500, 560, 50, 6, .6, { depth: 120 }); g.restore();
  g.save(); g.translate(-(x * .42) % 1600, 0); for (const o of [0, 1600]) S.forest(g, o - 40, o + 1640, 590, 60, .26, 7, .9); g.restore();
  S.ground(g, 0, W, 610, H, .64, 14, { tufts: 220, scroll: x });
  // sage bushes on the ground plane (move at ground speed); the one the calf hops sits at a fixed ground position
  const hopB = 19.6, hopG = 1020 + (SEC.CHASE.beat * hopB) * V;          // ground x where the calf jumps
  const bushes = [];
  for (let i = 0; i < 18; i++) bushes.push({ gx: i * 430 + S.rnd(i, 3) * 200, y: 700 + S.rnd(i, 4) * 60, r: 22 + S.rnd(i, 5) * 16 });
  bushes.push({ gx: hopG, y: 905, r: 58, big: true });
  bushes.sort((a, b2) => a.y - b2.y);
  for (const bu of bushes) { const sx = bu.gx - x; if (sx > -150 && sx < W + 150 && !bu.big) S.sage(g, sx, bu.y, bu.r, .5, Math.round(bu.gx)); }
  // the calf bounding ahead, Josie running with the rope
  const ph = (t - SEC.CHASE.t0) * 2.6;
  const hopU = seg(b, hopB - .6, hopB + .9);
  const calfX = 1020 + Math.sin(b * .3) * 30, calfLift = -Math.sin(hopU * Math.PI) * 120;
  const big = bushes.find(q => q.big), bigX = big.gx - x;
  drawCalf(g, calfX, 905, 56, ph, 2, { f: 1, head: .2, lift: calfLift, roll: hopU > 0 && hopU < 1 ? -.25 * Math.cos(hopU * Math.PI) : 0, t, ears: -.3 });
  if (bigX > -150 && bigX < W + 150) S.sage(g, bigX, big.y, big.r, .48, 999);
  // Josie: reaches the big bush ~1.2 beats later and stumbles through it
  const trip = seg(b, hopB + .9, hopB + 2.6);
  const jx = 470 + Math.sin(b * .4) * 25;
  let jp = pose('run', ph * .92);
  if (trip > 0 && trip < 1) { const k = Math.sin(trip * Math.PI); jp = mixPose(jp, withExpr(pose('take'), EXPR.alarm), k * .8); jp.lean = .2 + k * .6; }
  const opt = { x: jx, ground: 915 + runBob(ph * .92, 70) * 0, scale: 70, yaw: 90, pose: jp, t };
  const F = figAt(JOSIE, opt);
  fig(ctx, JOSIE, opt);
  const hand = F.hand('L');
  loop(ctx, hand[0] - 10, hand[1] + 46, 26, 46, 'all', 2.8, -.5 + Math.sin(t * 9) * .3);
  // foreground lodgepoles sweeping past (faster than the ground: they are nearer)
  for (let i = 0; i < 6; i++) { const sx = ((i * 1100 + 600 - x * 1.7) % 6600 + 6600) % 6600 - 300; if (sx > -200 && sx < W + 200) { form(g, [[sx, -20], [sx + 52, -20], [sx + 58, H + 20], [sx - 6, H + 20]], { v: .2, line: 2.4, grad: .25, seed: 140 + i, shade: 12 }); for (let k = 0; k < 9; k++) stroke(g, [[sx + 8 + (k % 3) * 14, 60 + k * 110], [sx + 12 + (k % 3) * 14, 120 + k * 110]], 2, { color: grey(.05), seed: 150 + k, alpha: .6 }); stroke(g, [[sx + 50, 300 + i * 40], [sx + 120, 260 + i * 40]], 6, { color: grey(.15), seed: 160 + i, taper: .7 }); } }
}

// ============ BISON · the bull (locked wide, then a half iris on Josie) ============
export function bison(ctx, b, t) {
  const g = ctx.g;
  { const k = ss(seg(b, 9, 11.5)) * (1 - ss(seg(b, 17, 19.5))); cam(ctx, lerp(1, 1.5, k), lerp(720, 720, k), lerp(540, 640, k)); }
  S.sky(g, W, 560, 15, .93, { clouds: 4 });
  S.range(g, -60, W + 60, 520, 200, 5.7, .46, { n: 14 });
  S.hills(g, -40, W + 40, 540, 50, 8, .6, { depth: 100 });
  S.ground(g, 0, W, 580, H, .64, 15, { tufts: 200 });
  S.river(g, [[-40, 600], [300, 610], [700, 604], [1100, 616], [1500, 612]], 22, 30, .88, 6, t);
  // the herd grazing and drifting right in the middle distance
  for (let i = 0; i < 9; i++) {
    const d = S.rnd(i, 21), s = 26 + d * 26, y = 650 + d * 80, x0 = ((i * 190 + S.rnd(i, 22) * 120 + t * 8 * (1 + d)) % 1700) - 120;
    drawBison(g, x0, y, s, t * .4 + i, .6, { f: 1, head: .1 + S.rnd(i, 23) * .3, t: t + i });
  }
  // the calf darts across, vanishing behind the bull
  const cu = seg(b, 0, 6.5); drawCalf(g, lerp(-120, 1600, cu), 905, 46, (t - SEC.BISON.t0) * 2.6, 2, { f: 1, head: .2, t });
  // the bull: grazing; turns its head; snorts; plods on
  const bx = numAt(b, [[0, 780], [17, 780], [22, 1380]], x => clamp(x));
  const walking = b > 17 && b < 22 ? 1 : 0;
  const turn = numAt(b, [[0, 0], [10, 0], [11.2, 1], [16.5, 1], [17.5, 0]]), head = numAt(b, [[0, .15], [10, .15], [11, .55], [16.5, .55], [17.5, .3]]);
  const snort = b >= 16 && b < 17.6 ? seg(b, 16, 17.6) : 0;
  // Josie runs in, bumps into the bull's flank, freezes, lifts her hat; turns to us under the iris; then runs on
  const bump = 8, runIn = b < bump;
  const ph = (t - SEC.BISON.t0) * 2.6;
  const jx = runIn ? lerp(-120, 500, seg(b, 2, bump)) : b < 24.5 ? numAt(b, [[bump, 500], [bump + .4, 455], [9, 450]], eo) : lerp(450, 1600, seg(b, 24.5, 27));
  let jp;
  if (runIn) jp = pose('run', ph);
  else jp = poseAt(b, [[bump, withExpr(pose('take'), EXPR.wide)], [bump + .6, pose('freeze')], [12.5, pose('freeze')], [13.3, pose('hatTip')], [15.2, pose('hatTip')], [16, pose('freeze')], [17.5, pose('freeze')], [21.5, withExpr(pose('stand'), EXPR.deadpan)], [24.5, withExpr(pose('stand'), EXPR.deadpan)], [24.8, pose('run', 0)]]);
  if (b > 24.8) jp = pose('run', ph);
  if (b >= 16 && b < 17.6) jp.expr = { ...jp.expr, hatUp: .15 * Math.sin(seg(b, 16, 17.6) * Math.PI) };     // the snort lifts her hat brim
  const yawJ = numAt(b, [[0, 90], [21.6, 90], [22.2, 10], [24.4, 10], [24.8, 90]]);
  const opt = { x: jx, ground: 950, scale: 74, yaw: yawJ, pose: jp, t };
  const F = figAt(JOSIE, opt);
  drawBison(g, bx, 948, 150, (t - SEC.BISON.t0) * .5, walking, { f: 1, head, turn, snort, t });
  fig(ctx, JOSIE, opt);
  TRACK.josie = toFilm(g, F.head);
  const hand = F.hand('L');
  loop(ctx, hand[0] - 6, hand[1] + 42, 24, 40, 'all', 2.8, -.3 + Math.sin(t * 5) * .2);
}

// ============ BASIN / CRACK / SIL / THROW · the geyser basin ============
const CONE = [1080, 690], ISLE = [860, 770];
function basinSet(g, t, o = {}) {
  S.sky(g, W, 470, 18, o.skyV ?? .74, { clouds: 0, top: .1 });
  S.hills(g, -40, W + 40, 430, 60, 9, .55, { depth: 100, tex: false });
  S.forest(g, -40, W + 40, 470, 70, .16, 10, 1.3);
  S.ground(g, 0, W, 500, H, .7, 16, { tufts: 30 });
  S.terraces(g, -40, W + 40, 560, 4, 34, 3, .78);
  S.pool(g, 330, 650, 120, 26, 41, t);
  S.pool(g, 1260, 820, 150, 36, 42, t + 1);
  // the moat of boiling water round the crust island, and the island itself
  S.pool(g, ISLE[0], ISLE[1] + 10, 210, 52, 43, t * 1.6);
  form(g, ellipsePts(ISLE[0] + (o.isleDx ?? 0), ISLE[1] + 2, 110, 26, o.isleTilt ?? 0, 28), { v: .88, line: 2.4, grad: .14, seed: 44, shade: 6 });
  S.cracks(g, ISLE[0], ISLE[1], 120, o.crack ?? 0);
  S.cone(g, CONE[0], CONE[1], 230, 140);
  // steam from the vents and the pools
  const st = o.steam ?? 1;
  S.steam(g, 330, 640, 90, t, 1, { a: .9 * st, size: 1.2 });
  S.steam(g, 1260, 810, 110, t + 3, 2, { a: .85 * st, size: 1.2 });
  S.steam(g, ISLE[0] - 170, ISLE[1] + 10, 70, t + 5, 3, { a: .8 * st, n: 7 });
  S.steam(g, ISLE[0] + 190, ISLE[1] + 14, 60, t + 8, 5, { a: .75 * st, n: 6 });
  S.steam(g, CONE[0], CONE[1] - 130, 75 * (o.coneSteam ?? 1), t * (o.rumble ? 1.6 : 1), 4, { a: .95, rise: 1 + (o.rumble ?? 0), size: 1.2 });
}
export function basin(ctx, b, t) {
  const g = ctx.g;
  cam(ctx, lerp(1, 1.22, ss(seg(b, 0, 13))), lerp(720, 760, ss(seg(b, 0, 13))), lerp(540, 640, ss(seg(b, 0, 13))));
  basinSet(g, t);
  drawCalf(g, ISLE[0], ISLE[1], 38, 0, 0, { f: -1, head: -.2, ears: Math.sin(t * 2.3) * .2, t, tip: .5 });
  const jx = numAt(b, [[0, -100], [4, -100], [8, 420]], x => clamp(x)), walking = b > 4 && b < 8;
  const jp = walking ? pose('run', (t - SEC.BASIN.t0) * 1.6) : withExpr(pose('stand'), EXPR.wide);
  const opt = { x: jx, ground: 905, scale: 62, yaw: 90, pose: jp, t };
  const F = figAt(JOSIE, opt);
  fig(ctx, JOSIE, opt);
  const hand = F.hand('L'); loop(ctx, hand[0] - 6, hand[1] + 40, 24, 40, 'all', 2.6, -.3 + Math.sin(t * 4) * .2);
}
export function crack(ctx, b, t, sec = 'CRACK') {
  const g = ctx.g, sil = sec === 'SIL';
  { const z = sil ? lerp(1.22, 1.75, ss(seg(b, 0, 2))) : 1.22; cam(ctx, z, sil ? lerp(760, 470, ss(seg(b, 0, 2))) : 760, sil ? lerp(640, 690, ss(seg(b, 0, 2))) : 640); }
  const k = sil ? 1 : seg(b, 1, 2.5), rumble = sil ? .3 : seg(b, 1, 3) * .8;
  basinSet(g, t, { crack: k, isleTilt: k * .05, rumble, coneSteam: 1 + rumble });
  if (!sil) for (let i = 0; i < 3; i++) S.steam(g, CONE[0] + (i - 1) * 30, CONE[1] - 130, 50 + 30 * rumble, t * 1.8 + i * .7, 60 + i, { a: .9 * rumble, rise: 1.6, n: 5 });
  const tremble = Math.sin(t * 40) * 2 * (k > 0 ? 1 : 0);
  drawCalf(g, ISLE[0] + tremble, ISLE[1] + k * 4, 38, 0, 0, { f: -1, head: -.35, ears: -.4, t, crouch: .4 * k, roll: k * .05 });
  const jb = sil ? 99 : b;
  const jp = sil ? poseAt(b, [[0, pose('breathe')], [2, pose('breathe')]]) : poseAt(b, [[0, withExpr(pose('stand'), EXPR.wide)], [1, withExpr(pose('stand'), EXPR.alarm)], [3, pose('whirl')], [7.4, pose('whirl')], [8.4, pose('breathe')]]);
  const opt = { x: 420, ground: 905, scale: 62, yaw: 90, pose: jp, t };
  const F = figAt(JOSIE, opt), hand = F.hand('R'), hl = F.hand('L');
  fig(ctx, JOSIE, opt);
  if (!sil && b >= 3 && b < 7.6) { const tw = twirl(ctx, hand, 90, t * 2.9, { lift: 50, flat: .3, w: 3 }); line(ctx, tw.honda, hl, 30, 2.6); }
  else loop(ctx, hand[0] + 4, hand[1] + 46, 28, 46, 'all', 2.8, -.2);
  coils(ctx, hl, 15, 2.6);
}
export const sil = (ctx, b, t) => crack(ctx, b, t, 'SIL');

export function throwShot(ctx, b, t) {
  const g = ctx.g;
  cam(ctx, 1.0, 720, 540);
  const pre = seg(b, 6.5, 8), erupt = eo(seg(b, 8, 9.1));
  shake(ctx, (pre * 3 + (b >= 8 ? 9 * (1 - seg(b, 8, 12)) : 0)), t);
  basinSet(g, t, { crack: 1, isleTilt: .05, rumble: .4 + pre + erupt, coneSteam: 1.5 + pre * 1.5 + erupt * 2, skyV: .6 });
  // the calf hauled across the crust toward her
  const hk = ss(seg(b, 6.5, 9.6));
  const calfX = lerp(ISLE[0], 520, hk), calfY = lerp(ISLE[1], 905, hk);
  const jp = poseAt(b, [[0, pose('whirl')], [3.2, pose('whirl')], [3.75, windUp()], [4.3, pose('throw')], [6.2, pose('throw')], [6.8, pose('haul')], [9.8, pose('haul')], [11, withExpr(pose('stand'), EXPR.glad)]]);
  const opt = { x: 330, ground: 910, scale: 70, yaw: 90, pose: jp, t };
  const F = figAt(JOSIE, opt), hand = F.hand('R'), hl = F.hand('L');
  // eruption behind everything near
  S.eruption(g, CONE[0], CONE[1] - 125, 1150, erupt, t, 9, 1 + 1.2 * seg(b, 9, 16));
  const neck = [calfX - 38 * .75, calfY - 38 * 1.55];
  if (b >= 5.5) { const r = lerp(30, 17, eo(seg(b, 5.5, 6.3))); loop(ctx, neck[0], neck[1], r * .5, r, 'back', 2.8, .3); }
  drawCalf(g, calfX, calfY, 38, hk > 0 && hk < 1 ? b * .8 : 0, 0, { f: -1, tail: b > 10 ? Math.sin(t * 14) * .5 : 0, head: hk > 0 && hk < 1 ? -.1 : b > 10 ? .25 + Math.sin(t * 3) * .15 : -.3, crouch: hk > 0 && hk < 1 ? .3 : 0, roll: hk > 0 && hk < 1 ? -.12 : 0, t, ears: -.3 });
  fig(ctx, JOSIE, opt);
  if (b < 4) { const tw = twirl(ctx, hand, 78, (b * SEC.THROW.beat) * .62, { lift: 44, flat: .3, w: 3 }); line(ctx, tw.honda, hl, 26, 2.6); }   // slow and even
  else if (b < 5.5) flight(ctx, [hand[0] + 40, hand[1] - 40], neck, ss(seg(b, 4, 5.5)), 160, 78, 30, hand, { w: 3 });
  else { const r = lerp(30, 17, eo(seg(b, 5.5, 6.3))); loop(ctx, neck[0], neck[1], r * .5, r, 'front', 2.8, .3); line(ctx, hand, [neck[0], neck[1] + 4], lerp(30, 3, eo(seg(b, 5.5, 6.6))), 3); }
  coils(ctx, hl, 15, 2.6);
}

// ============ HOME · sunset at the ranch (locked wide) ============
export function home(ctx, b, t) {
  const g = ctx.g;
  S.sky(g, W, 600, 30, .9, { clouds: 6, top: .18 });
  { const k = ss(seg(b, 12.5, 15)); cam(ctx, lerp(1, 1.55, k), lerp(720, 760, k), lerp(540, 640, k)); }
  S.sun(g, 1060, 470, 34);
  S.range(g, -60, W + 60, 540, 210, 2.6, .5, { n: 14 });
  S.hills(g, -40, W + 40, 560, 34, 4, .45, { depth: 120 });
  S.forest(g, -40, W + 40, 580, 44, .2, 5, .8);
  S.ground(g, 0, W, 600, H, .66, 17, { tufts: 160 });
  S.barn(g, 70, 720, 240, 140, .45, 23);
  S.fence(g, -20, W + 20, 800, 90, 190, .34, 36);
  const post = [1200, 925], postH = 130;
  S.snubPost(g, post[0], post[1], postH, .32);
  // long evening shadows
  g.fillStyle = 'rgba(40,30,25,.18)'; g.beginPath(); g.ellipse(post[0] - 110, post[1] + 4, 120, 10, 0, 0, 7); g.fill();
  // Grandpa by the post
  const ap = poseAt(b, [[0, pose('amosStand')], [12, pose('amosStand')], [12.6, pose('amosTip')], [13.6, pose('amosTip')], [14.2, pose('amosStand')]]);
  if (b < 10.5) ap.headTurn = .1;
  if (b >= 14.2) ap.nod = .08 + .12 * Math.sin(seg(b, 14.2, 15) * Math.PI);                       // a slow nod
  if (b >= 15.8) { ap.lean = .1 + Math.sin(t * 22) * .025 * (1 - seg(b, 15.8, 17.5)); ap.expr = { ...ap.expr, smile: .7, open: .4 }; }   // a silent chuckle
  fig(ctx, AMOS, { x: 1070, ground: 930, scale: 60, yaw: -70, pose: ap, t });
  // Josie leads Biscuit in, ropes the post (slow, sure), tips her hat; it slides over her eyes
  const jx = numAt(b, [[0, -80], [6, 560]], x => clamp(x));
  const walking = b < 6;
  const jp = walking ? pose('lead', b * .5) : poseAt(b, [[6, pose('stand')], [7.2, pose('whirl')], [8.8, pose('whirl')], [9.3, pose('throw')], [11, pose('throw')], [11.8, withExpr(pose('stand'), EXPR.calm)], [14, withExpr(pose('stand'), EXPR.calm)], [14.6, pose('hatTip')], [15.4, pose('hatTip')], [15.9, withExpr(pose('stand'), EXPR.deadpan)]]);
  if (b >= 15.5) jp.expr = { ...EXPR.deadpan, hatDown: .34 * eo(seg(b, 15.5, 16.1)), hatTilt: .05 };
  const opt = { x: jx, ground: 935, scale: 64, yaw: 90, pose: jp, t };
  const F = figAt(JOSIE, opt), hand = F.hand('R'), hl = F.hand('L');
  const calfX = numAt(b, [[0, -260], [6.4, 330]], x => clamp(x));
  drawCalf(g, calfX + (b > 7 ? 40 * ss(seg(b, 7, 9)) : 0), 925, 40, b * .5, b < 6.4 ? 1 : 0, { f: 1, head: b < 6.4 ? 0 : b > 9 ? .3 + Math.sin(t * 3) * .12 : -.4, tail: Math.sin(t * 9) * .4, t, ears: Math.sin(t * 2) * .2 });
  fig(ctx, JOSIE, opt);
  const top = [post[0], post[1] - postH];
  if (b < 6.4) line(ctx, hand, [calfX + 40 * .55, 925 - 40 * 1.5], 30, 2.6);           // the lead rope to the calf's neck
  else if (b < 9) { const tw = twirl(ctx, hand, 70, (b - 6.4) * SEC.HOME.beat * .6, { lift: 40, flat: .3, w: 2.8 }); line(ctx, tw.honda, hl, 22, 2.4); }
  else if (b < 10.5) flight(ctx, [hand[0] + 30, hand[1] - 30], [top[0], top[1] - 6], ss(seg(b, 9, 10.5)), 110, 70, 34, hand, { w: 2.8 });
  else { const k = seg(b, 10.5, 11.6), rx = lerp(34, 14, eo(k)), cy = lerp(top[1] + 2, top[1] + 22, eo(seg(b, 10.5, 11))); loop(ctx, top[0], cy, rx, rx * .3, 'all', 2.8); line(ctx, hand, [top[0] - rx, cy], lerp(50, 8, eo(k)), 2.6); }
  if (b >= 6.4) coils(ctx, hl, 14, 2.4);
}

// ============ FADE · dusk over the ranch, a distant geyser puffs (locked extreme wide) ============
export function fade(ctx, b, t) {
  const g = ctx.g;
  S.sky(g, W, 700, 33, .92, { clouds: 5, top: .1 });
  S.sun(g, 760, 600, 26, .98);
  S.range(g, -60, W + 60, 610, 230, 2.6, .2, { n: 16, couloirs: 0 });
  S.steam(g, 1180, 560, 50, t, 7, { a: .9, rise: .6, size: 1.2 });                // the far geyser's breath on the hills
  form(g, [[-20, 640], [W + 20, 630], [W + 20, H + 20], [-20, H + 20]], { v: .14, line: 1.6, grad: .05, seed: 51 });
  S.barn(g, 260, 760, 170, 100, .1, 24);
  S.fence(g, 430, 1100, 780, 46, 90, .1, 37);
  const P = (x) => [x, 780];
  drawFigure(g, AMOS, { x: 820, ground: 782, scale: 15, yaw: -80, pose: pose('amosStand'), t });
  drawFigure(g, JOSIE, { x: 780, ground: 782, scale: 15, yaw: 80, pose: pose('stand'), t });
  drawCalf(g, 740, 780, 12, 0, 0, { f: 1, t });
}
