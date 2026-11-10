// SWEEP — the cast, drawn as xieyi (写意) figures: one pale mass + a few loaded strokes, features in 3–5 strokes.
// The imp's broom tassel is the film's one vermilion. All functions draw into a layer set L ({wet, dry, col} contexts).
import { mk, draw, mass, blot } from './ink.js';
import { clamp, lerp, vnoise } from '/core/lib.js';

export const VERM = [176, 46, 34];
const P = (x, y, s, f) => (px, py) => [x + px * s * f, y + py * s];

// ---------------- the imp (Sweep) ----------------
// origin at his feet; s = px per unit (he is ~58 units tall, his broom ~100). o: { f (1 right, -1 left), t, bob, squash,
// broom (handle angle rad: 0 upright, + head forward), lift (bristles off the ground), look ([x,y] eye shift), blink (0..1),
// tilt (rad), arms ('broom' | 'up' | 'shy' | 'hold'), noBroom, step (gait phase, 0 = standing) }
const BODY = [[-15, -4], [-19, -22], [-16, -42], [-8, -54], [2, -57], [12, -50], [18, -34], [17, -14], [10, -3], [0, 0]];
export function imp(L, x, y, s, o = {}) {
  const f = o.f ?? 1, t = o.t ?? 0, sq = o.squash ?? 1, bob = (o.bob ?? 0), tl = o.tilt ?? 0;
  const ct = Math.cos(tl), st = Math.sin(tl);
  const T = (px, py) => { const qx = px * ct - py * st, qy = px * st + py * ct; return [x + qx * s * f, y + (qy * sq + bob) * s]; };
  const ink = L.ink || L;
  // feet: two short burnt strokes, stepping
  const ph = o.step ?? 0, stp = Math.sin(ph * Math.PI * 2);
  for (const [k, dx] of [[0, -6], [1, 6]]) {
    const lift = o.step ? Math.max(0, (k ? -stp : stp)) * 3 : 0;
    draw(ink, mk([[x + (dx - 1) * s * f, y - (2 + lift) * s], [x + (dx + 4 + (o.step ? (k ? -stp : stp) * 3 : 0)) * s * f, y - lift * s]], { w: 3.2 * s, tone: .9, dry: .35, wet: .2, prof: 'nail', seed: 30 + k }));
  }
  // body: one pale wet mass + two loaded strokes (back and belly), the dark side away from the light
  mass(ink.wet, BODY.map(p => T(...p)), .3, 1.2 * s, 11, [x, y - 58 * s, x, y, .8, 1.15]);
  draw(ink, mk([T(-14, -6), T(-18.5, -26), T(-13, -47), T(-2, -56.5)], { w: 7 * s, tone: .78, darkDir: [-f, 0], side: .85, dry: .38, wet: .55, prof: 'brush', seed: 21, brWet: true, body: .4 }));
  draw(ink, mk([T(5, -56.5), T(15, -47), T(18.5, -27), T(12, -5)], { w: 4.5 * s, tone: .68, darkDir: [f, 0], side: .7, dry: .4, wet: .5, prof: 'tip', seed: 22, brWet: true, body: .4 }));
  // the horn-tuft: one burnt flick
  draw(ink, mk([T(-1, -55), T(1, -66), T(7, -73)], { w: 3.4 * s, tone: .95, prof: 'nail', dry: .45, wet: .1, seed: 23 }));
  // eyes: two burnt dots (blink squashes them), a tiny mouth line when he speaks or smiles
  const lk = o.look || [0, 0], bl = 1 - clamp(o.blink ?? 0) * .85;
  for (const ex of [5, 12.5]) { const e = T(ex + lk[0], -40 + lk[1]); blot(ink.dry, e[0], e[1], 1.9 * s, .95, 0, bl, ex); }
  if (o.mouth) { const m0 = T(7 + lk[0] * .6, -32.5), m1 = T(12 + lk[0] * .6, -33 + (o.smile ?? 0) * 1.5); draw(ink, mk([m0, [lerp(m0[0], m1[0], .5), lerp(m0[1], m1[1], .5) + (o.smile ?? 0) * 1.6 * s], m1], { w: 1.4 * s, tone: .9, prof: 'tip', dry: .3, seed: 24 })); }
  if (o.noBroom) { arms(ink, T, s, f, o, null); return; }
  // the broom (taller than he is): handle in burnt ink, bristles a fan of dry strokes, the red tassel at the top
  const a = o.broom ?? .45, dir = [Math.sin(a) * f, Math.cos(a)];
  const grip = o.gripAt || T(17, -27);
  const reach = o.ground === false || dir[1] < .25 ? 58 * s : clamp((y - (o.lift ?? 0) * s - grip[1]) / dir[1], 30 * s, 90 * s);   // the bristles rest on the ground
  const top = [grip[0] - dir[0] * 40 * s, grip[1] - dir[1] * 40 * s], head = [grip[0] + dir[0] * reach, grip[1] + dir[1] * reach];
  draw(ink, mk([top, [lerp(top[0], head[0], .5) + (vnoise(t * .5) - .5) * s, lerp(top[1], head[1], .5)], head], { w: 2.6 * s, tone: .92, prof: 'even', dry: .3, wet: .1, seed: 40 }));
  broomHead(ink, head, dir, s, o.drag ?? 0, f);
  tassel(L, top, s, t, f);
  arms(ink, T, s, f, o, [grip, [lerp(grip[0], top[0], .45), lerp(grip[1], top[1], .45)]]);
  return { head, top, grip };
}
function arms(ink, T, s, f, o, grips) {
  const mode = o.arms || 'broom';
  let A, B;
  if (grips && mode === 'broom') { A = grips[0]; B = grips[1]; }
  else if (mode === 'up') { A = T(26, -58); B = T(-8, -62); }
  else if (mode === 'shy') { A = T(12, -22); B = T(8, -20); }
  else { A = T(21, -22); B = T(-15, -20); }
  draw(ink, mk([T(13, -30), [lerp(T(13, -30)[0], A[0], .5), lerp(T(13, -30)[1], A[1], .5) + 2 * s], A], { w: 2.6 * s, tone: .88, prof: 'tip', dry: .35, wet: .15, seed: 50 }));
  draw(ink, mk([T(-6, -32), [lerp(T(-6, -32)[0], B[0], .5), lerp(T(-6, -32)[1], B[1], .5) + 2 * s], B], { w: 2.4 * s, tone: .8, prof: 'tip', dry: .35, wet: .15, seed: 51 }));
}
// broom bristles: a fan of dry strokes; drag (0..1) bends them back along the ground
export function broomHead(ink, head, dir, s, drag = 0, f = 1, k = 1) {
  const base = Math.atan2(dir[1], dir[0]);
  for (let i = 0; i < 9; i++) {
    const u = i / 8 - .5, a = base + u * .75 - drag * .5 * f, len = (24 + 6 * Math.cos(u * 3)) * s * k;
    const b0 = [head[0] - dir[0] * 4 * s, head[1] - dir[1] * 4 * s], b1 = [head[0] + Math.cos(a) * len, head[1] + Math.sin(a) * len];
    draw(ink, mk([b0, [lerp(b0[0], b1[0], .55) - drag * 3 * s * f, lerp(b0[1], b1[1], .55)], b1], { w: 2.4 * s * k, tone: .8, prof: 'nail', dry: .62, wet: .15, seed: 60 + i }));
  }
  draw(ink, mk([[head[0] - dir[1] * 7 * s - dir[0] * 4 * s, head[1] + dir[0] * 7 * s - dir[1] * 4 * s], [head[0] + dir[1] * 7 * s - dir[0] * 4 * s, head[1] - dir[0] * 7 * s - dir[1] * 4 * s]], { w: 3.4 * s * k, tone: .95, prof: 'even', dry: .2, seed: 69 }));   // the binding
}
// the vermilion tassel: a knot + a few hanging threads that swing
export function tassel(L, p, s, t, f = 1, am = 1) {
  const c = L.ink ? L.ink.col : L.col; if (!c) return;
  const sw = Math.sin(t * 2.3) * 3 * s;
  blot(c, p[0], p[1], 3.2 * s, .95 * am, 0, 1, 7);
  for (let i = 0; i < 5; i++) draw({ col: c }, mk([[p[0] + (i - 2) * .9 * s, p[1] + 2 * s], [p[0] + (i - 2) * 1.4 * s + sw * .5, p[1] + 8 * s], [p[0] + (i - 2) * 1.6 * s + sw, p[1] + 14 * s]], { w: 1.4 * s, color: VERM, tone: .92 * am, prof: 'tip', dry: .2, seed: 70 + i }));
}

// ---------------- the Great King ----------------
// a huge wet mass of ink with burning eyes; s = px per unit (≈ 300 units tall). o: { f, t, roar (0..1), run (gait phase), arms ('down'|'up'|'point') }
export function king(L, x, y, s, o = {}) {
  const f = o.f ?? 1, t = o.t ?? 0, ink = L.ink || L, T = P(x, y, s, f), r = o.roar ?? 0, br = Math.sin(t * 1.3) * 2;
  const run = o.run;
  // legs
  for (const [k, dx] of [[0, -40], [1, 40]]) {
    const sw = run != null ? Math.sin((run + k * .5) * Math.PI * 2) * 30 : 0;
    draw(ink, mk([T(dx, -70), T(dx + sw * .5, -35), T(dx + sw, 0)], { w: 26 * s, tone: .85, darkDir: [-1, 0], side: .7, dry: .4, wet: .6, prof: 'press', brWet: true, body: .5, seed: 100 + k }));
  }
  // the body: a dark wet mass, heaving
  const body = [[-90, -60], [-110, -150], [-95, -230], [-50, -285], [10, -300 - br], [70, -280], [105, -220], [115, -140], [95, -60], [0, -45]];
  mass(ink.wet, body.map(p => T(...p)), .72, 6 * s, 101, [x, y - 300 * s, x, y, 1.1, .7]);
  draw(ink, mk([T(-85, -70), T(-108, -160), T(-80, -255), T(0, -298)], { w: 40 * s, tone: .9, darkDir: [-f, 0], side: .9, dry: .5, wet: .8, prof: 'brush', brWet: true, body: .3, seed: 102 }));
  // horns: two thick loaded strokes curling up and out
  for (const sg of [-1, 1]) draw(ink, mk([T(sg * 45, -275), T(sg * 85, -330), T(sg * 70, -385), T(sg * 40, -400)], { w: 18 * s, tone: .95, prof: 'nail', dry: .45, wet: .3, seed: 104 + sg }));
  // arms
  const am = o.arms || 'down';
  for (const sg of [-1, 1]) {
    const sh = T(sg * 90, -200), hand = am === 'up' ? T(sg * 150, -330) : am === 'point' && sg > 0 ? T(230, -220) : T(sg * 125, -90 + Math.sin(t * 2 + sg) * 4);
    draw(ink, mk([sh, [lerp(sh[0], hand[0], .5) + sg * 10 * s * f, lerp(sh[1], hand[1], .5)], hand], { w: 22 * s, tone: .88, prof: 'press', dry: .45, wet: .5, brWet: true, body: .5, seed: 108 + sg }));
    for (let k = 0; k < 3; k++) draw(ink, mk([hand, [hand[0] + (k - 1) * 9 * s + sg * 8 * s * f, hand[1] - (am === 'up' ? 22 : -6) * s]], { w: 5 * s, tone: .96, prof: 'nail', dry: .3, seed: 112 + k + sg * 3 }));
  }
  // eyes: paper left blank in the ink (holes), burnt pupils; the mouth a jagged burnt stroke that opens to show paper teeth
  const eyes = [T(-30, -215), T(30, -215)];
  for (const c of [ink.wet, ink.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; for (const e of eyes) { c.beginPath(); c.ellipse(e[0], e[1], 15 * s, (9 + r * 4) * s, 0, 0, 7); c.fill(); } const m = T(0, -160); c.beginPath(); c.ellipse(m[0], m[1], 42 * s, (4 + r * 20) * s, 0, 0, 7); c.fill(); c.restore(); }
  for (const e of eyes) blot(ink.dry, e[0] + 4 * s * f, e[1] + 1 * s, 5 * s, .96, 0, 1, 3);
  for (const sg of [-1, 1]) draw(ink, mk([T(sg * 52, -238 - r * 6), T(sg * 14, -228)], { w: 7 * s, tone: .96, prof: 'nail', dry: .3, seed: 120 + sg }));  // brows
  const m = T(0, -160), teeth = 6;
  for (let i = 0; i < teeth; i++) { const u = (i + .5) / teeth - .5; const p0 = [m[0] + u * 80 * s, m[1] - (4 + r * 20) * s]; draw(ink, mk([p0, [p0[0] + 4 * s, p0[1] + 8 * s]], { w: 3 * s, tone: .9, prof: 'nail', dry: .3, seed: 130 + i })); }
}

// ---------------- the demons (quick silhouettes) ----------------
// kind 0 tusks, 1 many eyes, 2 fangs, 3 long-neck. s = px per unit (≈ 90 units tall). ph = walk phase
export function demon(L, x, y, s, kind = 0, ph = 0, o = {}) {
  const f = o.f ?? 1, ink = L.ink || L, T = P(x, y, s, f), seed = 200 + kind * 17 + (o.seed ?? 0);
  const bob = Math.abs(Math.sin(ph * Math.PI * 2)) * 3;
  const Y = (px, py) => T(px, py - bob);
  for (const k of [0, 1]) { const sw = Math.sin((ph + k * .5) * Math.PI * 2) * 12; draw(ink, mk([Y(k ? 8 : -8, -30), T((k ? 8 : -8) + sw, 0)], { w: 5 * s, tone: .9, prof: 'tip', dry: .4, seed: seed + k })); }
  const shapes = [
    [[-24, -28], [-28, -60], [-14, -86], [10, -88], [26, -66], [24, -30]],
    [[-22, -28], [-30, -70], [-10, -96], [16, -94], [30, -64], [20, -28]],
    [[-26, -28], [-20, -78], [4, -92], [26, -78], [28, -30]],
    [[-18, -28], [-16, -60], [-4, -70], [0, -110], [14, -112], [12, -64], [20, -30]],
  ];
  mass(ink.wet, shapes[kind % 4].map(p => Y(...p)), .55 + (o.dark ?? 0), 2.5 * s, seed, [x, y - 100 * s, x, y, 1.1, .8]);
  draw(ink, mk(shapes[kind % 4].slice(0, 4).map(p => Y(p[0] - 2, p[1])), { w: 9 * s, tone: .85, darkDir: [-f, 0], side: .8, dry: .45, wet: .6, brWet: true, body: .3, prof: 'brush', seed: seed + 3 }));
  const hole = (pts, r) => { for (const c of [ink.wet, ink.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; for (const p of pts) { c.beginPath(); c.arc(p[0], p[1], r * s, 0, 7); c.fill(); } c.restore(); } };
  if (kind % 4 === 0) { for (const sg of [-1, 1]) { const a = Y(sg * 6 + 6, -40), b = Y(sg * 12 + 8, -56); for (const c of [ink.wet, ink.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.lineWidth = 4 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(b[0] + 6 * s * f, a[1], b[0], b[1]); c.stroke(); c.restore(); } } hole([Y(4, -66), Y(14, -66)], 3); }
  if (kind % 4 === 1) { const E = [Y(-6, -72), Y(4, -78), Y(14, -72), Y(-2, -62), Y(10, -62), Y(18, -80), Y(-12, -80)]; hole(E, 2.6); for (const e of E) blot(ink.dry, e[0], e[1], 1.2 * s, .9, 0, 1, e[0]); }
  if (kind % 4 === 2) { hole([Y(2, -70), Y(14, -70)], 3.4); const m = [Y(-6, -50), Y(0, -44), Y(6, -50), Y(12, -44), Y(18, -50)]; for (const c of [ink.wet, ink.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.lineWidth = 3 * s; c.beginPath(); m.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.restore(); } }
  if (kind % 4 === 3) { hole([Y(6, -100), Y(12, -100)], 2.4); }
}

// ---------------- the child ----------------
// origin at the feet; s = px per unit (≈ 62 units tall). o: { f, t, cry (0..1), arms ('down'|'hug'|'wave'|'hold'), step, look }
export function child(L, x, y, s, o = {}) {
  const f = o.f ?? 1, t = o.t ?? 0, ink = L.ink || L, cry = o.cry ?? 0;
  const shake = cry ? Math.sin(t * 18) * .8 * cry : 0;
  const T = (px, py) => [x + (px + (py < -20 ? shake : 0)) * s * f, y + py * s];
  const ph = o.step ?? 0, stp = Math.sin(ph * Math.PI * 2);
  for (const k of [0, 1]) { const sw = o.step ? (k ? -stp : stp) * 6 : 0; draw(ink, mk([T(k ? 4 : -4, -20), T((k ? 4 : -4) + sw * .5, -10), T((k ? 5 : -5) + sw, 0)], { w: 2.6 * s, tone: .9, prof: 'tip', dry: .35, seed: 300 + k })); }
  // a pale robe: one light mass + two loaded strokes
  const robe = [[-11, -18], [-13, -36], [-8, -44], [8, -44], [13, -36], [12, -18]];
  mass(ink.wet, robe.map(p => T(...p)), .14, 1.2 * s, 301, null);
  draw(ink, mk([T(-9, -43), T(-13, -32), T(-11, -18)], { w: 4.2 * s, tone: .7, darkDir: [-f, 0], side: .8, dry: .4, wet: .5, brWet: true, body: .3, prof: 'brush', seed: 302 }));
  draw(ink, mk([T(9, -43), T(12, -30), T(11, -18)], { w: 3.2 * s, tone: .6, prof: 'tip', dry: .45, wet: .4, seed: 303 }));
  // arms
  const am = o.arms || 'down';
  const hands = am === 'hug' ? [T(4, -32), T(-2, -31)] : am === 'wave' ? [T(16, -64 + Math.sin(t * 9) * 3), T(-12, -24)] : am === 'hold' ? [T(14, -34), T(10, -33)] : am === 'eyes' ? [T(5, -50), T(1, -50)] : [T(12, -22), T(-11, -22)];
  draw(ink, mk([T(8, -41), hands[0]], { w: 2.2 * s, tone: .8, prof: 'tip', dry: .35, seed: 304 }));
  draw(ink, mk([T(-7, -41), hands[1]], { w: 2.2 * s, tone: .72, prof: 'tip', dry: .35, seed: 305 }));
  // the head: a clear-ink oval; eyes as two small strokes (closed and curved when crying)
  mass(ink.wet, Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return T(Math.cos(a) * 7.5, -52 + Math.sin(a) * 7.5); }), .1, .6 * s, 306, null);
  const lk = o.look || [0, 0];
  for (const ex of [2, 6.5]) { const e = T(ex + lk[0], -52 + lk[1]); if (cry > .3) draw(ink, mk([[e[0] - 1.4 * s, e[1]], [e[0], e[1] + .8 * s], [e[0] + 1.4 * s, e[1]]], { w: .9 * s, tone: .9, prof: 'tip', dry: .2, seed: 307 + ex })); else blot(ink.dry, e[0], e[1], 1.1 * s, .9, 0, 1, ex); }
  // a straw hat: a wide pale cone mass + two dry ridge lines + a burnt brim line
  const hat = [[-17, -55], [-2, -68], [3, -69], [18, -55], [2, -57]];
  mass(ink.wet, hat.map(p => T(...p)), .32, 1 * s, 308, null);
  draw(ink, mk([T(-18, -55), T(0, -58), T(19, -55)], { w: 1.8 * s, tone: .95, prof: 'tip', dry: .3, seed: 309 }));
  draw(ink, mk([T(-6, -63), T(-14, -56)], { w: 1.2 * s, tone: .6, prof: 'tip', dry: .6, seed: 310 }));
  draw(ink, mk([T(8, -63), T(13, -57)], { w: 1.2 * s, tone: .6, prof: 'tip', dry: .6, seed: 311 }));
}
