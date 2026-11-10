// The lasso — the film's one colour. Every rope path is drawn twice: in grey into the tonal frame (so the Redraw pass
// inks it like everything else) and in ochre into the colour mask (FilmPost keeps that hue through the print).
import { ink, catmull, grey, ellipsePts } from './engine/ink.js';
import { solve, projector, BODY } from './engine/figure.js';

export const ROPE = '#c99a2e';
const lerp = (a, b, t) => a + (b - a) * t;

// where a figure will be drawn (same placement as drawFigure), without drawing it
export function figAt(ch, opt) {
  const B = BODY[ch.body || 'adult'], J = solve(opt.pose, B), s = opt.scale;
  let py = opt.y;
  if (opt.ground != null) { const low = Math.min(J.legs.L.sole[1], J.legs.R.sole[1], J.legs.L.toe[1], J.legs.R.toe[1], J.legs.L.heel[1], J.legs.R.heel[1]); py = opt.ground + low * s; }
  const pr = projector(opt.x, py, s, opt.yaw ?? 90);
  const P = p => pr.P(p);
  return { J, pr, hand: side => P(J.arms[side].hand), head: P(J.head), neck: P(J.neck), chest: P(J.spine[1].c), hip: P([0, 0, 0]), s };
}

// a rope path in both layers. closed: a loop. w in px.
export function rope(ctx, pts, w = 3, o = {}) {
  if (!pts || pts.length < 2) return;
  const opt = { w, closed: !!o.closed, taper: o.closed ? 0 : .05, light: 0, seed: o.seed ?? 77, boil: .3 };
  ink(ctx.g, pts, { ...opt, color: grey(o.v ?? .32) });
  if (ctx.m) ink(ctx.m, pts, { ...opt, w: w * 1.05, color: ROPE });
}
// a sagging line from a to b (sag px downward at the middle)
export function line(ctx, a, b, sag = 20, w = 3, o = {}) {
  const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) + Math.sin(u * Math.PI) * sag + (o.wave ? Math.sin(u * 9 + o.wave) * o.waveAmp : 0)]); }
  rope(ctx, pts, w, o);
}
// half of an ellipse loop: which = 'back' (top half, behind the subject) | 'front' | 'all'
export function loop(ctx, cx, cy, rx, ry, which = 'all', w = 3, rot = 0, o = {}) {
  const n = 40, pts = ellipsePts(cx, cy, rx, ry, rot, n);
  if (which === 'all') { rope(ctx, pts, w, { ...o, closed: true }); return pts; }
  const half = which === 'back' ? pts.slice(n / 2, n).concat([pts[0]]) : pts.slice(0, n / 2 + 1);
  rope(ctx, half, w, o); return pts;
}
// the twirling loop above a hand: ph in turns. Returns the loop's honda point (where the spoke joins it).
export function twirl(ctx, hand, r, ph, o = {}) {
  const flat = o.flat ?? .3, lift = o.lift ?? r * .35, a = ph * Math.PI * 2;
  const cx = hand[0] + Math.cos(a) * r * .35, cy = hand[1] - lift + Math.sin(a) * r * .05;
  const pts = ellipsePts(cx, cy, r, r * flat, o.tilt ?? 0, 40);
  rope(ctx, pts, o.w ?? 3, { closed: true });
  const k = Math.round(((a / (Math.PI * 2)) % 1 + 1) % 1 * 40) % 40, honda = pts[k];
  rope(ctx, [hand, [lerp(hand[0], honda[0], .5), lerp(hand[1], honda[1], .5) + 4], honda], o.w ?? 3);
  return { c: [cx, cy], honda };
}
// coils hanging from a hand
export function coils(ctx, hand, r, w = 2.6, sway = 0) {
  for (let i = 0; i < 3; i++) rope(ctx, ellipsePts(hand[0] + sway * 4 + i * 2, hand[1] + r * .9 + i * 3, r * .55, r * (.95 - i * .08), .12 + i * .05, 22), w, { closed: true, seed: 80 + i });
}
// a loop in flight from start to end: u 0..1, arc height, radius r0 → r1. returns its centre.
export function flight(ctx, from, to, u, arc, r0, r1, hand, o = {}) {
  const c = [lerp(from[0], to[0], u), lerp(from[1], to[1], u) - Math.sin(u * Math.PI) * arc], r = lerp(r0, r1, u);
  loop(ctx, c[0], c[1], r, r * (o.flat ?? .32), 'all', o.w ?? 3, o.rot ?? 0);
  if (hand) line(ctx, hand, [c[0] - r * .9 * Math.sign(to[0] - from[0] || 1), c[1]], 30 * (1 - u) + 10, o.w ?? 3, { wave: u * 8, waveAmp: 6 * (1 - u) });
  return c;
}
