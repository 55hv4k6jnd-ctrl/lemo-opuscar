// SWEEP — the cast as 80s cels: flat fill, a hard shadow crescent, a hard highlight, a coloured line (never pure black),
// an optional neon rim. Origin at the feet; s = px per unit; f = 1 faces right, -1 left. P = colour model (pal.js).
import { cel, path, poly, line, ribbon, flutter, mix, rgba, TAU } from './cel.js';

const LIGHT = [-1, -.8];
const SO = k => [LIGHT[0] * k, LIGHT[1] * k], HO = k => [-LIGHT[0] * k, -LIGHT[1] * k];
const tf = (x, y, s, f) => (px, py) => [x + px * s * f, y + py * s];
const map = (T, pts) => pts.map(p => { const q = T(p[0], p[1]); if (p[2]) q.push(1); return q; });

// an almond eye: white, a tall layered iris, two highlights, a thick upper lash flicking outward; open 0..1, look [x,y]
function eye(g, e, cx, cy, w, h, P, o = {}) {
  const open = o.open ?? 1, f = o.f ?? 1;
  if (open < .15) { line(g, [[cx - w, cy], [cx, cy + h * .25], [cx + w, cy - h * .1]], P.eye.l, Math.max(1.6, w * .22)); return; }
  const top = cy - h * open, bot = cy + h * .55;
  const A = [[cx - w, cy + h * .1, 1], [cx - w * .3, top], [cx + w * .6, top + h * .1], [cx + w * 1.05, cy - h * .05, 1], [cx + w * .4, bot], [cx - w * .4, bot]];
  const E = path(A);
  g.save(); g.fillStyle = P.eye.f; g.fill(E); g.clip(E);
  const lx = (o.look?.[0] ?? 0) * w * .5 * f, ly = (o.look?.[1] ?? 0) * h * .4;
  const ix = cx + lx + w * .1 * f, iy = cy + ly + h * .05, ir = w * .58;
  g.fillStyle = P.iris.f; g.beginPath(); g.ellipse(ix, iy, ir * .8, ir * 1.15, 0, 0, TAU); g.fill();
  g.fillStyle = P.iris.s; g.fillRect(ix - ir, iy - ir * 1.3, ir * 2, ir * .7);
  g.fillStyle = P.iris.h; g.beginPath(); g.ellipse(ix, iy + ir * .55, ir * .55, ir * .3, 0, 0, TAU); g.fill();
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(ix - ir * .3 * f, iy - ir * .45, ir * .28, ir * .34, 0, 0, TAU); g.fill();
  g.beginPath(); g.arc(ix + ir * .3 * f, iy + ir * .3, ir * .12, 0, TAU); g.fill();
  if (o.glint && e) { e.fillStyle = rgba('#ffffff', .8); e.beginPath(); e.arc(ix - ir * .3 * f, iy - ir * .45, ir * .5, 0, TAU); e.fill(); }
  g.restore();
  line(g, [[cx - w * 1.05, cy + h * .15], [cx - w * .3, top - h * .05], [cx + w * .6, top + h * .05], [cx + w * 1.2, cy - h * .25]], P.eye.l, Math.max(2, w * .3));
  line(g, [[cx + w * .9, cy - h * .1], [cx + w * 1.35, cy - h * .45]], P.eye.l, Math.max(1.4, w * .16));   // the lash flick
}

// ---------------- Sweep ----------------
// o: { t, f, broom (handle angle: 0 upright, + head forward), blink, look, mouth (0 closed, 1 talk, 2 open, 'smile'),
//      brow (−1 sad … 1 determined), squash, bob, step, arms ('broom'|'up'|'shy'), noBroom, rim, scarfWind }
const BODY = [[-17, -2], [-21, -22], [-18, -42], [-9, -54], [2, -57], [13, -50], [19, -33], [18, -14], [11, -2], [0, 0]];
export function imp(g, e, x, y, s, P, o = {}) {
  const f = o.f ?? 1, t = o.t ?? 0, sq = o.squash ?? 1, bob = o.bob ?? 0, lw = Math.max(1.6, s * .7);
  const T = (px, py) => [x + px * s * f, y + (py * sq + bob) * s];
  const rim = o.rim ? { c: o.rim, d: [f * s * .8, -s * .3] } : null;
  const st = o.step ? Math.sin(o.step * TAU) : 0;
  // feet
  for (const [k, dx] of [[0, -7], [1, 7]]) { const lift = o.step ? Math.max(0, k ? -st : st) * 3 : 0, sw = o.step ? (k ? -st : st) * 3 : 0;
    cel(g, map(T, [[dx - 5 + sw, -lift], [dx - 4 + sw, -5 - lift], [dx + 5 + sw, -5 - lift], [dx + 7 + sw, -lift]]), { f: P.imp.s, l: P.imp.l, lw }); }
  // the broom behind his near arm: handle + straw head + vermilion tassel
  let bh = null;
  if (!o.noBroom) {
    const a = o.broom ?? .45, dir = [Math.sin(a) * f, Math.cos(a)], grip = o.gripAt || T(17, -16);
    const reach = dir[1] < .25 ? 58 * s : Math.max(30 * s, Math.min(90 * s, (y - grip[1]) / dir[1]));
    const top = [grip[0] - dir[0] * 40 * s, grip[1] - dir[1] * 40 * s], head = [grip[0] + dir[0] * reach, grip[1] + dir[1] * reach];
    bh = { head, top, grip, dir };
    const nx = -dir[1], ny = dir[0];
    cel(g, poly([[top[0] + nx * 1.4 * s, top[1] + ny * 1.4 * s], [head[0] + nx * 1.4 * s, head[1] + ny * 1.4 * s], [head[0] - nx * 1.4 * s, head[1] - ny * 1.4 * s], [top[0] - nx * 1.4 * s, top[1] - ny * 1.4 * s]]), { f: P.wood.f, s: P.wood.s, so: [nx * 1.2 * s, ny * 1.2 * s], l: P.wood.l, lw });
    broomHead(g, head, dir, s, P, o.drag ?? 0, f);
    tassel(g, top, s, t, P, f);
  }
  // body
  const B = map(T, BODY);
  cel(g, B, { f: P.imp.f, s: P.imp.s, so: SO(4 * s), h: P.imp.h, ho: HO(2.2 * s), l: P.imp.l, lw: lw * 1.1, rim });
  cel(g, map(T, [[2, -5], [-1, -14], [3, -22], [12, -23], [16, -14], [14, -5]]), { f: P.belly.f, s: P.belly.s, so: SO(2.5 * s), l: P.belly.l, lw: lw * .8 });
  // horn: one curl
  cel(g, map(T, [[-4, -54], [-6, -66], [0, -75], [8, -74, 1], [3, -70], [1, -62], [3, -55]]), { f: P.horn.f, s: P.horn.s, so: SO(1.6 * s), l: P.horn.l, lw });
  // scarf (the accent): a band at the neck + a tail fluttering behind
  const wind = o.scarfWind ?? .3;
  cel(g, map(T, [[-20, -30], [-6, -26], [10, -26], [20, -30], [19, -24], [8, -21], [-6, -21], [-20, -24]]), { f: P.accent.f, s: P.accent.s, so: SO(1.5 * s), l: P.accent.l, lw });
  const tail = flutter(...T(-16, -26), f > 0 ? Math.PI + .9 - wind * .5 : -.9 + wind * .5, 14 * s * (.7 + wind), 8, 2 * s * (.5 + wind), 1.2, t * 8, 5 * s * (1 - wind));
  cel(g, ribbon(tail, u => (1 - u * .6) * 5 * s), { f: P.accent.f, s: P.accent.s, so: SO(1.2 * s), l: P.accent.l, lw });
  // face: almond eyes, brows, mouth
  const lk = o.look || [0, 0], open = 1 - (o.blink ?? 0);
  const brow = o.brow ?? 0;
  for (const [ex, k] of [[3, .8], [13, 1]]) {
    const c = T(ex, -40);
    eye(g, e, c[0], c[1], 4.6 * s * k, 5 * s, P, { open, look: lk, f, glint: o.glint });
    line(g, [[c[0] - 4.5 * s * f, c[1] - 8 * s + brow * .8 * s], [c[0] + 4 * s * f, c[1] - 8.6 * s - brow * 1.6 * s]], P.imp.l, Math.max(1.3, s * .6));
  }
  const m = o.mouth ?? 0, mc = T(9, -32);
  if (m === 'smile') line(g, [[mc[0] - 3 * s, mc[1] - .6 * s], [mc[0], mc[1] + 1.2 * s], [mc[0] + 3 * s, mc[1] - .6 * s]], P.imp.l, Math.max(1.3, s * .5));
  else if (m) { g.fillStyle = P.mouth || '#7a2a3a'; g.beginPath(); g.ellipse(mc[0], mc[1] + s * .3, 2.2 * s, (m === 2 ? 2 : 1) * s, 0, 0, TAU); g.fill(); g.strokeStyle = P.imp.l; g.lineWidth = Math.max(1.2, s * .4); g.stroke(); }
  else line(g, [[mc[0] - 2 * s, mc[1]], [mc[0] + 2 * s, mc[1] + .2 * s]], P.imp.l, Math.max(1.2, s * .45));
  // arms
  const am = o.arms || 'broom';
  const hands = am === 'broom' && bh ? [bh.grip, [bh.grip[0] - bh.dir[0] * 16 * s, bh.grip[1] - bh.dir[1] * 16 * s]] : am === 'up' ? [T(26, -60), T(-14, -62)] : am === 'shy' ? [T(12, -20), T(6, -18)] : [T(22, -20), T(-20, -20)];
  for (const [i, sh] of [[0, T(15, -19)], [1, T(-12, -20)]]) {
    const hd = hands[i], sp = [sh, [(sh[0] + hd[0]) / 2, (sh[1] + hd[1]) / 2 + 2 * s], hd];
    cel(g, ribbon(sp, u => (3.4 - u * .8) * s), { f: i ? P.imp.s : P.imp.f, l: P.imp.l, lw });
    g.fillStyle = i ? P.imp.s : P.imp.f; g.beginPath(); g.arc(hd[0], hd[1], 2.4 * s, 0, TAU); g.fill(); g.strokeStyle = P.imp.l; g.lineWidth = lw; g.stroke();
  }
  return bh;
}
export function broomHead(g, head, dir, s, P, drag = 0, f = 1, k = 1) {
  const a = Math.atan2(dir[1], dir[0]), nx = -dir[1], ny = dir[0];
  const L = 26 * s * k, Wd = 12 * s * k, bend = drag * 6 * s * -f;
  const tip = (u) => [head[0] + dir[0] * L + nx * (u * Wd) + bend, head[1] + dir[1] * L + ny * (u * Wd)];
  const shape = [[head[0] + nx * 3 * s * k, head[1] + ny * 3 * s * k, 1], tip(1), tip(.5), tip(0), tip(-.5), tip(-1), [head[0] - nx * 3 * s * k, head[1] - ny * 3 * s * k, 1]];
  cel(g, path(shape), { f: P.straw.f, s: P.straw.s, so: [nx * 3 * s, ny * 3 * s], h: P.straw.h, ho: [-nx * 1.5 * s, -ny * 1.5 * s], l: P.straw.l, lw: Math.max(1.4, s * .55) });
  for (let i = -3; i <= 3; i++) { const b = tip(i / 3.4); line(g, [[head[0] + dir[0] * 8 * s * k + nx * i * s * k, head[1] + dir[1] * 8 * s * k + ny * i * s * k], b], P.straw.l, Math.max(.9, s * .3)); }
  line(g, [[head[0] + nx * 4.5 * s * k + dir[0] * 4 * s, head[1] + ny * 4.5 * s * k + dir[1] * 4 * s], [head[0] - nx * 4.5 * s * k + dir[0] * 4 * s, head[1] - ny * 4.5 * s * k + dir[1] * 4 * s]], P.accent.s, Math.max(2, s * 1.4));   // the binding
}
export function tassel(g, p, s, t, P, f = 1) {
  const sw = Math.sin(t * 2.6) * 3 * s;
  cel(g, path([[p[0] - 3 * s, p[1] + 2 * s], [p[0] + sw * .3, p[1] - 2.5 * s], [p[0] + 3 * s, p[1] + 2 * s], [p[0] + 3.5 * s + sw, p[1] + 14 * s], [p[0] - 3.5 * s + sw, p[1] + 14 * s]]), { f: P.accent.f, s: P.accent.s, so: SO(1.4 * s), h: P.accent.h, ho: HO(.8 * s), l: P.accent.l, lw: Math.max(1.2, s * .45) });
}

// ---------------- the Great King ----------------
// ≈ 300 units tall. o: { t, f, roar (0..1), run (gait phase), arms ('down'|'up'|'point'), rim }
export function king(g, e, x, y, s, P, o = {}) {
  const f = o.f ?? 1, t = o.t ?? 0, r = o.roar ?? 0, T = tf(x, y, s, f), lw = Math.max(2, s * 2.4), br = Math.sin(t * 1.4) * 3;
  const rim = o.rim ? { c: o.rim, d: [f * 4 * s, -2 * s] } : null;
  for (const [k, dx] of [[0, -45], [1, 45]]) { const sw = o.run != null ? Math.sin((o.run + k * .5) * TAU) * 30 : 0;
    cel(g, map(T, [[dx - 22, -80], [dx + 22, -80], [dx + 20 + sw, -6], [dx + 34 + sw, 0], [dx - 26 + sw, 0], [dx - 22 + sw * .5, -40]]), { f: P.king.s, s: mix(P.king.s, '#000000', .3), so: SO(4 * s), l: P.king.l, lw }); }
  const body = [[-95, -60], [-118, -150], [-100, -232], [-52, -286], [10, -302 - br], [72, -282], [108, -222], [120, -142], [98, -60], [0, -48]];
  cel(g, map(T, body), { f: P.king.f, s: P.king.s, so: SO(14 * s), h: P.king.h, ho: HO(6 * s), l: P.king.l, lw: lw * 1.2, rim });
  // fur collar
  const col = []; for (let i = 0; i <= 14; i++) { const u = i / 14, a = Math.PI * (1.05 + .9 * u); col.push([Math.cos(a) * 118, -170 + Math.sin(a) * -40 + (i % 2 ? 12 : -6), i % 2 ? 0 : 1]); }
  cel(g, map(T, [...col, [100, -150], [0, -130], [-100, -150]]), { f: P.fur.f, s: P.fur.s, so: SO(6 * s), h: P.fur.h, ho: HO(3 * s), l: P.fur.l, lw });
  // horns
  for (const sg of [-1, 1]) cel(g, map(T, [[sg * 30, -270], [sg * 58, -275], [sg * 96, -330], [sg * 82, -392], [sg * 48, -410, 1], [sg * 70, -372], [sg * 64, -330]]), { f: P.bone.f, s: P.bone.s, so: SO(5 * s), l: P.bone.l, lw });
  // arms
  const am = o.arms || 'down';
  for (const sg of [-1, 1]) {
    const sh = T(sg * 92, -205), hand = am === 'up' ? T(sg * 160, -340) : am === 'point' && sg > 0 ? T(240, -230) : T(sg * 130, -92 + Math.sin(t * 2 + sg) * 4);
    cel(g, ribbon([sh, [(sh[0] + hand[0]) / 2 + sg * 12 * s * f, (sh[1] + hand[1]) / 2], hand], u => (30 - u * 10) * s), { f: P.king.f, s: P.king.s, so: SO(5 * s), l: P.king.l, lw });
    for (let k = 0; k < 3; k++) cel(g, map(T, []).concat([[hand[0] + (k - 1) * 9 * s, hand[1]], [hand[0] + (k - 1) * 11 * s + 3 * s, hand[1] + (am === 'up' ? -18 : 14) * s], [hand[0] + (k - 1) * 9 * s + 6 * s, hand[1]]]), { f: P.bone.f, l: P.bone.l, lw: lw * .7 });
  }
  // face: gold eyes that glow, heavy brows, a mouth that opens on teeth
  for (const sg of [-1, 1]) {
    const c = T(sg * 32, -222);
    cel(g, path([[c[0] - 16 * s, c[1] + 2 * s, 1], [c[0], c[1] - (8 + r * 4) * s], [c[0] + 16 * s, c[1] - 2 * s, 1], [c[0], c[1] + 8 * s]]), { f: P.gold.f, s: P.gold.s, so: SO(2 * s), l: P.king.l, lw });
    g.fillStyle = P.king.l; g.beginPath(); g.ellipse(c[0] + 3 * s * f, c[1], 3.5 * s, 6 * s, 0, 0, TAU); g.fill();
    if (e) { const gr = e.createRadialGradient(c[0], c[1], 0, c[0], c[1], 40 * s); gr.addColorStop(0, rgba('#ffc040', .7)); gr.addColorStop(1, rgba('#ff8020', 0)); e.fillStyle = gr; e.beginPath(); e.arc(c[0], c[1], 40 * s, 0, TAU); e.fill(); }
    line(g, [T(sg * 60, -246 - r * 6), T(sg * 12, -236)], P.king.l, 9 * s);
  }
  const mo = T(0, -165), mh = (5 + r * 26) * s;
  cel(g, path([[mo[0] - 48 * s, mo[1] - 4 * s, 1], [mo[0], mo[1] - mh * .4], [mo[0] + 48 * s, mo[1] - 4 * s, 1], [mo[0], mo[1] + mh]]), { f: '#3a0e1e', l: P.king.l, lw });
  for (let i = 0; i < 5; i++) { const u = (i + .5) / 5 - .5; cel(g, poly([[mo[0] + u * 80 * s - 6 * s, mo[1] - 4 * s], [mo[0] + u * 80 * s + 6 * s, mo[1] - 4 * s], [mo[0] + u * 80 * s, mo[1] + (6 + r * 6) * s]]), { f: P.bone.f, l: P.bone.l, lw: lw * .6 }); }
}

// ---------------- the demons ----------------
const DSH = [
  [[-26, -28], [-30, -62], [-16, -88], [10, -90], [28, -66], [26, -28]],
  [[-24, -28], [-32, -72], [-12, -98], [18, -96], [32, -64], [22, -28]],
  [[-28, -28], [-22, -80], [4, -94], [28, -80], [30, -28]],
  [[-20, -28], [-18, -62], [-6, -72], [-2, -112], [14, -114], [14, -66], [22, -28]],
];
export function demon(g, e, x, y, s, kind, ph, P, o = {}) {
  const f = o.f ?? 1, k = kind % 4, C = P['d' + (k + 1)], bob = Math.abs(Math.sin(ph * TAU)) * 3, lw = Math.max(1.4, s * .9);
  const T = (px, py) => [x + px * s * f, y + (py - (py < -20 ? bob : 0)) * s];
  for (const kk of [0, 1]) { const sw = Math.sin((ph + kk * .5) * TAU) * 10; cel(g, poly([T((kk ? 6 : -10), -30), T((kk ? 12 : -4), -30), T((kk ? 12 : -4) + sw, 0), T((kk ? 4 : -12) + sw, 0)]), { f: C.s, l: C.l, lw }); }
  cel(g, map(T, DSH[k]), { f: C.f, s: C.s, so: SO(5 * s), h: C.h, ho: HO(2.5 * s), l: C.l, lw, rim: o.rim ? { c: o.rim, d: [f * 2 * s, -s] } : null });
  const dot = (px, py, r, c) => { const q = T(px, py); g.fillStyle = c; g.beginPath(); g.arc(q[0], q[1], r * s, 0, TAU); g.fill(); };
  if (k === 0) { dot(4, -68, 3.4, '#fff'); dot(14, -68, 3.4, '#fff'); dot(5, -68, 1.6, C.l); dot(15, -68, 1.6, C.l); for (const sg of [-1, 1]) cel(g, map(T, [[sg * 6 + 8, -44], [sg * 8 + 10, -44], [sg * 14 + 10, -60]]), { f: P.bone.f, l: P.bone.l, lw: lw * .7 }); }
  if (k === 1) for (const [px, py] of [[-6, -74], [4, -80], [14, -74], [-2, -64], [10, -64], [20, -82], [-12, -82]]) { dot(px, py, 2.8, '#fff'); dot(px + .6, py, 1.3, C.l); }
  if (k === 2) { dot(2, -72, 3.6, '#fff'); dot(14, -72, 3.6, '#fff'); dot(3, -72, 1.7, C.l); dot(15, -72, 1.7, C.l); line(g, map(T, [[-6, -52], [0, -46], [6, -52], [12, -46], [18, -52]]), '#fff', 2.6 * s); }
  if (k === 3) { dot(6, -102, 2.8, '#fff'); dot(12, -102, 2.8, '#fff'); dot(6.6, -102, 1.3, C.l); dot(12.6, -102, 1.3, C.l); }
}

// ---------------- the child ----------------
// ≈ 64 units tall. o: { t, f, cry (0..1), arms ('down'|'hug'|'eyes'|'hold'|'wave'), mouth, look, step, blink, smile }
export function child(g, e, x, y, s, P, o = {}) {
  const f = o.f ?? 1, t = o.t ?? 0, cry = o.cry ?? 0, sh = cry ? Math.sin(t * 16) * .7 * cry : 0, lw = Math.max(1.3, s * .5);
  const T = (px, py) => [x + (px + (py < -22 ? sh : 0)) * s * f, y + py * s];
  const st = o.step ? Math.sin(o.step * TAU) : 0;
  for (const k of [0, 1]) { const sw = o.step ? (k ? -st : st) * 5 : 0; cel(g, poly([T(k ? 1 : -6, -22), T(k ? 6 : -1, -22), T((k ? 6 : -1) + sw, -3), T((k ? 8 : 1) + sw, 0), T((k ? 0 : -7) + sw, 0), T((k ? 1 : -6) + sw * .5, -3)]), { f: P.pants.f, s: P.pants.s, so: SO(1.5 * s), l: P.pants.l, lw }); }
  cel(g, map(T, [[-10, -20], [-10, -38], [-6, -44.5], [6, -44.5], [10, -38], [10, -20]]), { f: P.jacket.f, s: P.jacket.s, so: SO(2.4 * s), h: P.jacket.h, ho: HO(1.2 * s), l: P.jacket.l, lw });
  const am = o.arms || 'down';
  const hands = am === 'hug' ? [T(5, -32), T(-3, -31)] : am === 'eyes' ? [T(5, -51), T(0, -51)] : am === 'hold' ? [T(15, -35), T(11, -34)] : am === 'wave' ? [T(16, -64 + Math.sin(t * 9) * 3), T(-13, -24)] : [T(13, -23), T(-12, -23)];
  for (const [i, shp] of [[0, T(9, -42)], [1, T(-8, -42)]]) { cel(g, ribbon([shp, [(shp[0] + hands[i][0]) / 2, (shp[1] + hands[i][1]) / 2 + 1.5 * s], hands[i]], u => (3.2 - u * .6) * s), { f: i ? P.jacket.s : P.jacket.f, l: P.jacket.l, lw }); g.fillStyle = P.skin.f; g.beginPath(); g.arc(hands[i][0], hands[i][1], 1.8 * s, 0, TAU); g.fill(); g.strokeStyle = P.skin.l; g.lineWidth = lw * .8; g.stroke(); }
  // head: a long egg, hair at the sides under the hat, almond eyes, a small nose stroke, a mouth
  cel(g, map(T, [[-8, -50], [-8, -58], [0, -61], [8, -58], [8.5, -50], [4, -44.5], [-3, -44.5]]), { f: P.skin.f, s: P.skin.s, so: SO(1.6 * s), l: P.skin.l, lw: lw * .8 });
  for (const sg of [-1, 1]) cel(g, map(T, [[sg * 7, -60], [sg * 10, -52], [sg * 9, -45], [sg * 7, -50]]), { f: P.hair.f, s: P.hair.s, so: SO(1 * s), l: P.hair.l, lw: lw * .7 });
  const lk = o.look || [0, 0], open = cry > .3 ? 0 : 1 - (o.blink ?? 0);
  for (const [ex, k] of [[-3.2, .85], [4, 1]]) { const c = T(ex, -53); eye(g, e, c[0], c[1], 1.9 * s * k, 2.2 * s, P, { open, look: lk, f });
    if (cry > .3) { g.fillStyle = rgba('#bfefff', .9); g.beginPath(); g.ellipse(c[0], c[1] + (2.5 + (t * 2 % 1) * 3) * s, .7 * s, 1.1 * s, 0, 0, TAU); g.fill(); } }
  line(g, [T(1, -50), T(1.8, -49)], P.skin.l, lw * .8);
  const mc = T(1, -47.2);
  if (o.mouth) { g.fillStyle = P.mouth; g.beginPath(); g.ellipse(mc[0], mc[1], 1.2 * s, (o.mouth === 2 ? 1.2 : .6) * s, 0, 0, TAU); g.fill(); }
  else line(g, o.smile ? [[mc[0] - 1.4 * s, mc[1] - .3 * s], [mc[0], mc[1] + .6 * s], [mc[0] + 1.4 * s, mc[1] - .3 * s]] : cry > .3 ? [[mc[0] - 1.2 * s, mc[1] + .4 * s], [mc[0], mc[1] - .2 * s], [mc[0] + 1.2 * s, mc[1] + .4 * s]] : [[mc[0] - 1 * s, mc[1]], [mc[0] + 1 * s, mc[1]]], P.skin.l, lw * .8);
  if (o.blush) { g.fillStyle = rgba(P.blush, .45); for (const ex of [-3.5, 5]) { const c = T(ex, -49.5); g.beginPath(); g.ellipse(c[0], c[1], 1.6 * s, .7 * s, 0, 0, TAU); g.fill(); } }
  // the straw hat: a wide shallow cone
  cel(g, map(T, [[-19, -58, 1], [-3, -70], [3, -71], [19, -58, 1], [0, -60]]), { f: P.hat.f, s: P.hat.s, so: SO(2 * s), h: P.hat.h, ho: HO(1 * s), l: P.hat.l, lw });
  line(g, [T(-12, -61), T(12, -61)], P.hat.s, lw * .9);
}

// a villager holding up a lantern (small, flat)
export function villager(g, e, x, y, s, P, k = 0, t = 0) {
  const lw = Math.max(1, s * .5), T = (px, py) => [x + px * s, y + py * s];
  cel(g, poly([T(-9, 0), T(-10, -34), T(-5, -40), T(6, -40), T(10, -34), T(9, 0)]), { f: P.villager.f, s: P.villager.s, so: SO(2 * s), l: P.villager.l, lw });
  cel(g, path([T(-6, -40), T(-6, -47), T(0, -50), T(6, -47), T(6, -40)]), { f: P.skin.f, s: P.skin.s, so: SO(1 * s), l: P.skin.l, lw });
  cel(g, poly([T(-14, -46), T(0, -55), T(14, -46)]), { f: P.hat.f, s: P.hat.s, so: SO(1 * s), l: P.hat.l, lw });
  line(g, [T(6, -30), T(14, -58)], P.villager.l, 1.6 * s);
  lantern(g, e, ...T(15, -60 + Math.sin(t * 1.6 + k) * 1.5), 6 * s, P);
}
export function lantern(g, e, x, y, r, P) {
  cel(g, path([[x - r * .9, y - r * .6], [x, y - r * 1.1], [x + r * .9, y - r * .6], [x + r, y + r * .5], [x, y + r * 1.1], [x - r, y + r * .5]]), { f: P.lantern.f, s: P.lantern.s, so: [-r * .25, 0], h: P.lantern.h, ho: [r * .15, -r * .1], l: P.lantern.l, lw: Math.max(1, r * .12) });
  if (e) { const gr = e.createRadialGradient(x, y, 0, x, y, r * 5); gr.addColorStop(0, rgba('#ffd27a', .9)); gr.addColorStop(.25, rgba('#ffa040', .45)); gr.addColorStop(1, rgba('#ff6020', 0)); e.fillStyle = gr; e.beginPath(); e.arc(x, y, r * 5, 0, TAU); e.fill(); }
}
