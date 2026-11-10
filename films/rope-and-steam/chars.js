// Cast of ROPE & STEAM (all original). Values are print densities (0 = black, 1 = white).
// Josie (a 5-head child in a too-big hat), Grandpa Amos (a tall, stooped rancher), Biscuit the calf, the bull bison.
import { form, stroke, ink, catmull, grey, pathOf, ellipsePts, hatch, shade } from './engine/ink.js';
import { torsoPoint } from './engine/figure.js';
import { PROFILE_ADULT, PROFILE_CHILD, FRONT_CHILD } from './engine/heads.js';

const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const loop = (pts, n = 5) => catmull(pts, true, n);
export function headShape(H, frontPts, profPts, backPts) {
  const w = ss(.35, .95, H.p);
  const base = H.front >= 0 ? frontPts : (backPts || frontPts);
  const fm = H.front >= 0 ? H.f : -H.f;
  return base.map((q, i) => { const r = profPts[i]; return [lerp(q[0] * fm, r[0] * H.f, w) * H.sc, lerp(q[1], r[1], w) * H.sc]; });
}

// ---------- the wide-brim western hat (k = size: Josie's is far too big for her) ----------
// ex.hatUp (head units, lifted off the head), ex.hatDown (slid down over the eyes), ex.hatTilt (rad)
function westernHat(g, H, o) {
  const k = o.k, up = (H.ex.hatUp ?? 0), down = (H.ex.hatDown ?? 0), tilt = (H.ex.hatTilt ?? 0) * H.f;
  const dy = (-up + down) * H.sc, crownH = o.crown;
  g.save(); g.translate(0, dy); g.rotate(tilt);
  const by = -.36 + (o.sit ?? 0);                    // brim height on the head
  const brimF = [[-.78, by + .04], [-.66, by - .06], [-.3, by - .1], [0, by - .1], [.3, by - .1], [.66, by - .06], [.78, by + .04], [.6, by + .06], [.3, by + .02], [0, by + .03], [-.3, by + .02], [-.6, by + .06]].map(([x, y]) => [x * k, y]);
  const brimP = [[-.72, by + .02], [-.62, by - .04], [-.3, by - .06], [0, by - .07], [.3, by - .06], [.62, by - .04], [.76, by + .05], [.6, by + .06], [.3, by + .04], [0, by + .04], [-.3, by + .04], [-.6, by + .05]].map(([x, y]) => [x * k, y]);
  const top = by - .08 - crownH;
  const crownF = [[-.36, by - .06], [-.36, by - .3], [-.3, top + .05], [-.12, top], [0, top + .06], [.12, top], [.3, top + .05], [.36, by - .3], [.36, by - .06], [0, by - .09]].map(([x, y]) => [x * k * .95, y]);
  const crownP = [[-.4, by - .06], [-.39, by - .3], [-.3, top + .04], [-.1, top + .02], [.06, top + .05], [.22, top + .01], [.36, top + .06], [.4, by - .3], [.41, by - .06], [0, by - .09]].map(([x, y]) => [x * k * .95, y]);
  const crown = loop(headShape(H, crownF, crownP), 4), brim = loop(headShape(H, brimF, brimP), 4);
  form(g, crown, { v: o.v, line: H.lw, grad: .22, seed: o.seed, shade: { off: H.sc * .08, a: .2, hatch: .3, seed: o.seed + 1 } });
  const band = headShape(H, [[-.36 * k * .95, by - .12], [0, by - .15], [.36 * k * .95, by - .12]], [[-.4 * k * .95, by - .12], [0, by - .15], [.41 * k * .95, by - .12]]);
  stroke(g, catmull(band, false, 4), H.lw * 2.2 * k, { color: grey(o.v - .3), seed: o.seed + 2 });
  form(g, brim, { v: o.v - .04, line: H.lw, grad: .2, seed: o.seed + 3, shade: { off: H.sc * .05, a: .18, hatch: 0 } });
  g.restore();
  // the brim's shadow across the brow (only when the hat sits on the head)
  if (up < .1 && down < .1) { const sh = headShape(H, [[-.34, -.3], [0, -.33], [.34, -.3], [.33, -.18], [0, -.2], [-.33, -.18]], [[-.3, -.24], [0, -.32], [.42, -.26], [.4, -.14], [0, -.18], [-.3, -.1]]); g.fillStyle = 'rgba(30,24,20,.26)'; pathOf(g, loop(sh, 3)); g.fill(); }
}

// ---------------- JOSIE ----------------
const jHairF = [[-.4, .2], [-.42, -.1], [-.32, -.34], [0, -.4], [.32, -.34], [.42, -.1], [.4, .2], [.33, .05], [.3, -.14], [.1, -.22], [-.1, -.22], [-.3, -.14], [-.33, .05]];
const jHairP = [[-.3, .3], [-.46, .05], [-.4, -.3], [-.06, -.42], [.24, -.36], [.34, -.22], [.3, -.16], [.18, -.2], [.08, -.12], [0, 0], [-.06, .1], [-.14, .26], [-.22, .32]];
function braid(g, H, side) {
  // a plait from behind the ear down to the shoulder, swinging a little
  const sw = Math.sin((H.t ?? 0) * 6 + side) * .03;
  const a = headShape(H, [[side * .34, .1]], [[-.24, .12]])[0], b = headShape(H, [[side * .4 + sw, .78]], [[-.36 + sw, .78]])[0];
  const n = 6, w = H.sc * .07;
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n, p0 = [lerp(a[0], b[0], u0), lerp(a[1], b[1], u0)], p1 = [lerp(a[0], b[0], u1), lerp(a[1], b[1], u1)];
    const off = (i % 2 ? 1 : -1) * w * .25;
    form(g, ellipsePts((p0[0] + p1[0]) / 2 + off, (p0[1] + p1[1]) / 2, w * (1 - u0 * .3), H.sc * .075, .3 * (i % 2 ? 1 : -1), 12), { v: .2, line: H.lw * .7, grad: .1, seed: 340 + i });
  }
  const tie = [b[0], b[1] + H.sc * .03];
  form(g, ellipsePts(tie[0], tie[1], w * .7, w * .4, 0, 10), { v: .85, line: H.lw * .6, seed: 349 });
}
export const JOSIE = {
  name: 'Josie', body: 'child', line: .034,
  skin: { v: .82 }, handW: .36, neckW: .3,
  leg: { v: .26, w: [.4, .32, .28], folds: true },           // dark denim
  shoe: { v: .12 },                                            // boots
  arm: { v: .74, w: [.36, .32, .28], sleeve: 1 },
  torso: { v: .74, grad: .18 },
  torsoW: 1.06,
  torsoDetail(g, J, pr, s, lw) {                               // a checked shirt: a few broken check lines
    if (s < 18) return;
    const T = (xf, y, xs) => torsoPoint(J, pr, xf, y, xs);
    for (let i = 0; i < 4; i++) stroke(g, [T(-.5, .25 + i * .32, -.3), T(.5, .25 + i * .32, .38)], lw * .55, { color: grey(.5), seed: 360 + i, alpha: .7 });
    for (let i = 0; i < 3; i++) stroke(g, [T(-.32 + i * .32, 1.42, -.2 + i * .25), T(-.32 + i * .32, .1, -.2 + i * .25)], lw * .55, { color: grey(.5), seed: 370 + i, alpha: .6 });
    // belt
    stroke(g, [T(-.6, .06, -.34), T(.6, .06, .4)], s * .09, { color: grey(.16), seed: 379 });
  },
  collar(g, J, pr, s, lw) {                                    // neckerchief, knotted at the front
    const n = pr.P(J.neck);
    const pts = loop([[n[0] - s * .34, n[1] - s * .1], [n[0] + s * .34, n[1] - s * .1], [n[0] + s * .3, n[1] + s * .1], [n[0], n[1] + s * .34], [n[0] - s * .3, n[1] + s * .1]], 4);
    form(g, pts, { v: .22, line: lw * .8, hatch: .2, seed: 331 });
  },
  head: {
    skin: .82, jaw: .92, chinW: .5, brow: 1.3, lip: .45, profile: PROFILE_CHILD, front: FRONT_CHILD, eyeH: 1.3, makeup: .7, nose: .85,
    hairBack(g, H) { braid(g, H, -1); braid(g, H, 1); form(g, loop(headShape(H, jHairF, jHairP)), { v: .2, line: H.lw * .8, grad: .12, seed: 311 }); },
    hat(g, H) { westernHat(g, H, { k: 1.18, crown: .36, v: .58, seed: 321, sit: .02 }); },
  },
};

// ---------------- GRANDPA AMOS ----------------
export const AMOS = {
  name: 'Amos', body: 'adult', line: .028,
  skin: { v: .76 }, handW: .32, neckW: .38,
  leg: { v: .5, w: [.56, .46, .4], folds: true },              // canvas trousers
  shoe: { v: .1 },
  arm: { v: .2, w: [.46, .4, .34], sleeve: 1 },                // long dark coat
  torso: { v: .2, grad: .2 },
  torsoW: 1.02, torsoD: 1.15,
  skirt: { front: false, v: .19, top: 1.2, len: 3.0, wz: .78, fx: -.32, hemW: 1.25 },
  armBias: 0,
  torsoDetail(g, J, pr, s, lw) {
    if (s < 16 || pr.cy < -.3) return;
    const T = (xf, y, xs) => torsoPoint(J, pr, xf, y, xs);
    // open coat: a pale shirt + waistcoat strip down the front
    const v = [T(-.18, 2.34, .16), T(-.2, .7, .44), T(.2, .7, .5), T(.18, 2.34, .3)];
    form(g, loop(v, 3), { v: .7, line: lw * .7, grad: .1, seed: 431 });
    for (let i = 0; i < 4; i++) { const q = T(0, 1.9 - i * .32, .47); g.fillStyle = grey(.3); g.beginPath(); g.arc(q[0], q[1], s * .025, 0, 7); g.fill(); }
  },
  collar(g, J, pr, s, lw) {
    const T = (xf, y, xs) => torsoPoint(J, pr, xf, y, xs);
    if (pr.cy > -.3) form(g, loop([T(-.34, 2.3, -.2), T(0, 2.0, .3), T(.34, 2.3, .34), T(.3, 2.5, .2), T(-.3, 2.5, -.24)], 4), { v: .24, line: lw * .8, grad: .14, seed: 441 });
  },
  head: {
    skin: .76, jaw: 1.08, chinW: .5, brow: 2.4, lip: .44, profile: PROFILE_ADULT, nose: 1.15, age: 1,
    hairMass: { v: .86, top: -.18, nape: .2, temple: .3 },
    beard(g, H) {       // a white walrus moustache
      const pts = headShape(H, [[-.22, .22], [-.08, .18], [0, .19], [.08, .18], [.22, .22], [.25, .33], [.12, .29], [0, .27], [-.12, .29], [-.25, .33]],
        [[.1, .22], [.3, .17], [.4, .18], [.45, .2], [.47, .25], [.44, .33], [.38, .3], [.32, .28], [.2, .3], [.06, .32]]);
      form(g, loop(pts, 4), { v: .9, line: H.lw * .8, seed: 451 });
    },
    hat(g, H) { westernHat(g, H, { k: 1.0, crown: .46, v: .34, seed: 461 }); },
  },
};

// ================= animals (side view, drawn directly; facing f = +1 right, -1 left) =================
// leg: hip → knee → hoof, two segments, gait phase ph (cycles). Returns the outline.
function legPts(hx, hy, len, ph, stride, lift, w, rear) {
  const a = ph * Math.PI * 2, sw = Math.sin(a), up = Math.max(0, Math.cos(a));
  const fx = hx + sw * stride, fy = hy + len - up * lift;
  const kx = lerp(hx, fx, .5) + (rear ? -1 : 1) * len * .08 * (1 + up), ky = hy + len * .5 - up * lift * .3;
  return { pts: [[hx, hy], [kx, ky], [fx, fy]], w: [w, w * .62, w * .42] };
}
function limb(g, P, v, lw, seed, f) {
  const [a, b, c] = P.pts, [w0, w1, w2] = P.w;
  const n = (p, q) => { const dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; };
  const n0 = n(a, b), n1 = n(b, c);
  const L = [[a[0] + n0[0] * w0, a[1] + n0[1] * w0], [b[0] + (n0[0] + n1[0]) / 2 * w1, b[1] + (n0[1] + n1[1]) / 2 * w1], [c[0] + n1[0] * w2, c[1] + n1[1] * w2]];
  const R = [[a[0] - n0[0] * w0, a[1] - n0[1] * w0], [b[0] - (n0[0] + n1[0]) / 2 * w1, b[1] - (n0[1] + n1[1]) / 2 * w1], [c[0] - n1[0] * w2, c[1] - n1[1] * w2]];
  form(g, catmull([...L, ...R.reverse()], true, 4), { v, line: lw, grad: .12, seed });
  // hoof
  form(g, [[c[0] - w2 * 1.2, c[1] - w2 * .4], [c[0] + w2 * 1.5 * f, c[1] - w2 * .2], [c[0] + w2 * 1.6 * f, c[1] + w2 * .8], [c[0] - w2 * 1.1, c[1] + w2 * .8]], { v: .1, line: lw * .8, seed: seed + 1 });
}

// Biscuit the calf. x = body centre, ground y, s = scale (px ≈ body length / 2), ph = gait phase, gait: 0 stand, 1 trot, 2 bound
// o: { f, head (rad: + = up), tail, ears, crouch (0..1), tip (tiptoe 0..1), legLift, roll (rad, whole body tilt) }
export function drawCalf(g, x, gy, s, ph = 0, gait = 0, o = {}) {
  const f = o.f ?? 1, lw = Math.max(1.2, s * .03);
  const legLen = s * .78 * (1 - (o.crouch ?? 0) * .35), bob = gait ? -Math.abs(Math.sin(ph * Math.PI * 2)) * s * (gait === 2 ? .35 : .08) : 0;
  const by = gy - legLen - s * .36 + bob + (o.lift ?? 0);
  g.save(); g.translate(x, by); if (o.roll) g.rotate(o.roll * f); g.scale(f, 1);
  const stride = gait ? s * (gait === 2 ? .42 : .26) : 0, lift = gait ? s * (gait === 2 ? .3 : .16) : (o.tip ?? 0) * s * .06;
  const legsAt = (far) => {
    const v = far ? .14 : .2;
    const phs = gait === 2 ? [ph, ph + .08, ph + .5, ph + .58] : [ph, ph + .5, ph + .5, ph];
    const ids = far ? [1, 3] : [0, 2];
    for (const i of ids) {
      const rear = i >= 2, hx = rear ? -s * .55 : s * .5, P = legPts(hx, s * .25, legLen + s * .1, phs[i] + (far ? .25 : 0) * (gait === 1 ? 0 : 1), stride, lift, s * .13, rear);
      if (!gait && o.tip) P.pts[2][1] -= s * .02;
      limb(g, P, v, lw, 800 + i, 1);
    }
  };
  legsAt(true);
  // tail
  const tw = Math.sin((o.t ?? 0) * 9) * .25 + (o.tail ?? 0);
  stroke(g, catmull([[-s * .9, -s * .1], [-s * 1.05, s * .15 + tw * s * .2], [-s * 1.08 - tw * s * .1, s * .5]], false, 5), lw * 1.6, { seed: 820 });
  form(g, ellipsePts(-s * 1.08 - tw * s * .1, s * .55, s * .05, s * .1, 0, 10), { v: .1, line: lw * .6, seed: 821 });
  // body: a dark barrel with a pale belly patch
  const body = loop([[-s * .95, -s * .25], [-s * .6, -s * .42], [0, -s * .4], [s * .55, -s * .45], [s * .82, -s * .2], [s * .78, s * .2], [s * .4, s * .38], [-s * .3, s * .4], [-s * .85, s * .3], [-s * 1.0, s * .05]], 5);
  form(g, body, { v: .2, line: lw, grad: .16, seed: 830, shade: s * .1 });
  form(g, loop([[-s * .4, s * .18], [s * .2, s * .2], [s * .4, s * .32], [0, s * .4], [-s * .4, s * .36]], 4), { v: .82, line: lw * .6, seed: 831 });
  legsAt(false);
  // head: pale face on a dark poll, oversized ears
  const ha = o.head ?? 0;
  g.save(); g.translate(s * .78, -s * .25); g.rotate(-ha);
  form(g, loop([[-s * .05, -s * .18], [s * .1, s * .02], [-s * .02, s * .22], [-s * .15, s * .05]], 4), { v: .2, line: lw, seed: 839 });   // neck
  const ear = (dx, v, rot) => form(g, ellipsePts(s * (.22 + dx), -s * .28, s * .2, s * .07, rot + (o.ears ?? 0), 14), { v, line: lw * .8, seed: 840 + dx * 10 });
  ear(-.08, .16, -.5);
  const head = loop([[s * .05, -s * .3], [s * .3, -s * .32], [s * .5, -s * .12], [s * .6, s * .05], [s * .55, s * .16], [s * .38, s * .14], [s * .12, s * .02], [s * .0, -s * .15]], 5);
  form(g, head, { v: .88, line: lw, grad: .14, seed: 845 });
  form(g, loop([[s * .02, -s * .28], [s * .2, -s * .32], [s * .16, -s * .18], [s * .04, -s * .1]], 3), { v: .2, line: lw * .6, seed: 846 });  // dark poll patch
  ear(.06, .2, -.2);
  g.fillStyle = grey(.08); g.beginPath(); g.arc(s * .3, -s * .14, s * .04, 0, 7); g.fill();                  // eye (big, round, deadpan)
  g.fillStyle = grey(.95); g.beginPath(); g.arc(s * .31, -s * .155, s * .012, 0, 7); g.fill();
  g.fillStyle = grey(.35); g.beginPath(); g.ellipse(s * .56, s * .08, s * .05, s * .035, .4, 0, 7); g.fill();   // nostril / muzzle
  g.restore();
  g.restore();
}

// The bull bison: a huge dark hump of hatched fur, shaggy cape, beard, short black horns.
// o: { f, head (0 = down grazing, 1 = up), turn (0..1: head turned toward camera), snort (0..1), t }
export function drawBison(g, x, gy, s, ph = 0, walking = 0, o = {}) {
  const f = o.f ?? 1, lw = Math.max(1.4, s * .025), t = o.t ?? 0;
  g.save(); g.translate(x, gy); g.scale(f, 1);
  const legLen = s * .7, by = -legLen - s * .55;
  const stride = walking * s * .18, lift = walking * s * .08;
  const leg = (i, far) => {
    const rear = i >= 2, hx = rear ? -s * .75 : s * .45;
    const P = legPts(hx, by + s * .45, legLen + s * .1, ph + [0, .5, .5, 0][i] + (far ? .5 : 0), stride, lift, s * .14, rear);
    limb(g, P, far ? .1 : .14, lw, 900 + i, 1);
  };
  leg(1, true); leg(3, true);
  const tw = Math.sin(t * 4) * .1;
  stroke(g, [[-s * 1.0, by + s * .05], [-s * 1.1, by + s * .4 + tw * s], [-s * 1.12, by + s * .7]], lw * 1.6, { seed: 910 });
  // hindquarters (shorter, smoother fur, a little lighter) and the great hump
  const hind = loop([[-s * 1.05, by - s * .05], [-s * .7, by - s * .3], [-s * .1, by - s * .35], [s * .1, by + s * .2], [-s * .2, by + s * .55], [-s * .8, by + s * .5], [-s * 1.08, by + s * .25]], 5);
  form(g, hind, { v: .3, line: lw, grad: .2, seed: 920, shade: s * .1 });
  const hump = loop([[-s * .3, by - s * .25], [s * .05, by - s * .78], [s * .4, by - s * .88], [s * .7, by - s * .6], [s * .9, by - s * .1], [s * .85, by + s * .45], [s * .5, by + s * .65], [s * .05, by + s * .55], [-s * .25, by + s * .3]], 5);
  form(g, hump, { v: .14, line: lw, grad: .2, seed: 921, shade: s * .12 });
  // shaggy fur tufts along the cape
  for (let i = 0; i < 9; i++) { const u = i / 8, px = lerp(-s * .15, s * .85, u), py = by - s * (.3 + .55 * Math.sin(u * Math.PI)) + s * .08; stroke(g, [[px, py], [px - s * .06, py + s * .18]], lw * 1.2, { color: grey(.38), seed: 930 + i, alpha: .8 }); }
  leg(0, false); leg(2, false);
  // head: hangs low in front of the hump — a long, nearly vertical face with a shaggy forelock, beard and short hooked horns
  const hu = o.head ?? .5, tn = o.turn ?? 0;
  const HX = s * .8, HY = by + s * (.05 - hu * .2);
  g.save(); g.translate(HX, HY); g.rotate(.35 - hu * .55);
  const hw = 1 - tn * .3;
  const face = loop([[-s * .05, -s * .32], [s * .22 * hw, -s * .3], [s * .36 * hw, -s * .05], [s * .42 * hw, s * .32], [s * .36 * hw, s * .48], [s * .18 * hw, s * .5], [s * .02, s * .32], [-s * .12, s * .05]], 5);
  form(g, face, { v: .16, line: lw, grad: .16, seed: 940, shade: s * .05 });
  form(g, loop([[-s * .1, -s * .36], [s * .2 * hw, -s * .4], [s * .32 * hw, -s * .16], [s * .1, -s * .08], [-s * .12, -s * .1]], 4), { v: .08, line: lw * .8, seed: 942 });   // forelock
  form(g, loop([[s * .02, s * .34], [s * .3 * hw, s * .46], [s * .24 * hw, s * .82], [s * .1, s * .78], [-s * .02, s * .55]], 4), { v: .08, line: lw * .8, seed: 941 });   // beard
  const horn = (dx, sgn) => stroke(g, catmull([[s * dx, -s * .26], [s * (dx - .12 * sgn), -s * .36], [s * (dx - .08 * sgn), -s * .52]], false, 4), s * .06, { color: grey(.04), seed: 950 + dx * 10, taper: .7 });
  horn(-.02, 1); if (tn > .3) horn(.3 * hw, -1);
  const ex = s * (.22 + tn * .02) * hw, ey = -s * .02;
  g.fillStyle = grey(.62); g.beginPath(); g.arc(ex, ey, s * (.03 + tn * .025), 0, 7); g.fill();
  g.fillStyle = grey(.04); g.beginPath(); g.arc(ex + s * .004, ey, s * (.018 + tn * .014), 0, 7); g.fill();
  if (tn > .3) { g.fillStyle = grey(.62); g.beginPath(); g.arc(ex - s * .17, ey, s * .05, 0, 7); g.fill(); g.fillStyle = grey(.04); g.beginPath(); g.arc(ex - s * .17, ey, s * .03, 0, 7); g.fill(); }
  g.fillStyle = grey(.4); g.beginPath(); g.ellipse(s * .38 * hw, s * .4, s * .035, s * .025, 0, 0, 7); g.fill();
  g.restore();
  // snort: two puffs of breath from the nose
  const sn = o.snort ?? 0;
  if (sn > 0 && sn < 1) {
    const nx = s * 1.18, ny = by + s * (.05 - hu * .2) + s * .45;
    for (let k = 0; k < 3; k++) { const u = sn, r = s * (.06 + u * .22) * (1 - k * .2); const c = g.createRadialGradient(nx + s * u * (.5 + k * .2), ny + k * s * .05, 0, nx + s * u * (.5 + k * .2), ny + k * s * .05, r);
      c.addColorStop(0, `rgba(250,250,250,${.75 * (1 - u)})`); c.addColorStop(1, 'rgba(250,250,250,0)'); g.fillStyle = c; g.beginPath(); g.arc(nx + s * u * (.5 + k * .2), ny + k * s * .05, r, 0, 7); g.fill(); }
  }
  g.restore();
}
