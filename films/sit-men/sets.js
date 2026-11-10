// SIT MEN — sets in ink: needle peaks over a sea of mist, the bell pavilion, bamboo at night, the drowned village,
// crows, the mountain stair, the walking tide. Mountain masses are per-pixel and cached.
import { mk, draw, mass, blot } from './ink.js';
import { mountainLayer, ridgeFn, cun, pine, reed, ripple } from './land.js';
import { mulberry, lerp, clamp, vnoise } from '/core/lib.js';

const CACHE = {};
export function range(L, key, o, am = 1, dx = 0, dy = 0) {
  if (!CACHE[key]) { const ridge = ridgeFn(o.peaks, o.base, o.seed ?? 1, o.rough ?? 18); CACHE[key] = { cv: mountainLayer({ W: o.W ?? 1920, H: o.H ?? 1080, ridge, depth: o.depth ?? 260, tone: o.tone ?? .16, rim: o.rim ?? .7, rimW: o.rimW ?? 16, mist: o.mist ?? .9, seed: o.seed ?? 1 }), ridge }; }
  const r = CACHE[key]; L.cw.save(); L.cw.globalAlpha *= am; L.cw.drawImage(r.cv, dx, dy); L.cw.restore();
  if (o.cun) cun(L.ink, { x0: dx + 40, x1: dx + (o.W ?? 1920) - 40, ridge: x => r.ridge(x - dx) + dy, tone: o.tone, seed: o.seed ?? 1, cun: o.cun, moss: o.moss ?? 1 });
  return r;
}
// a needle peak (a tall loaded rock spire) with a flat top where he sits
export function needle(L, x, top, h, w, seed = 3) {
  const ink = L.ink, R = mulberry(seed);
  mass(ink.wet, [[x - w * .5, top + h], [x - w * .32, top + h * .4], [x - w * .18, top + 6], [x + w * .2, top], [x + w * .34, top + h * .45], [x + w * .55, top + h]], .3, 6, seed, [x, top, x, top + h, 1.2, .1]);
  for (let i = 0; i < 4; i++) draw(ink, mk([[x - w * .2 + i * w * .14, top + 8], [x - w * .25 + i * w * .16 + (R() - .5) * 10, top + h * .45], [x - w * .3 + i * w * .2, top + h * .9]], { w: 24 - i * 3, tone: .55, darkDir: [-1, 0], side: .8, brWet: true, body: .3, dry: .6, wet: .85, prof: 'rise', seed: seed * 10 + i }), 1, .9);
  draw(ink, mk([[x - w * .22, top + 4], [x, top - 2], [x + w * .22, top + 2]], { w: 4, tone: .9, prof: 'brush', dry: .5, seed: seed * 20 }));
  for (let i = 0; i < 5; i++) blot(ink.wet, x - w * .18 + R() * w * .36, top + R() * 4, 2 + R() * 2, .85, R() * 3, .6, seed + i);
}
// mist bands: wide pale wet strokes
export function mist(L, y, t, am = 1, seed = 5) {
  const R = mulberry(seed);
  for (let i = 0; i < 5; i++) { const x0 = -200 + R() * 400 + Math.sin(t * .1 + i) * 40, yy = y + i * 26; draw(L.ink, mk([[x0, yy], [x0 + 1200, yy + (R() - .5) * 20], [x0 + 2400, yy]], { w: 30 + R() * 30, tone: .08 * am, prof: 'even', dry: .1, wet: 1, seed: seed * 10 + i }), 1, 1); }
}
// the bell pavilion: a heavy roof in loaded strokes, two posts, the great bronze bell (dark wet mass), a striking log
export function pavilion(L, x, y, s = 1, swing = 0, t = 0) {
  const ink = L.ink;
  draw(ink, mk([[x - 210 * s, y - 300 * s], [x - 120 * s, y - 360 * s], [x + 120 * s, y - 360 * s], [x + 210 * s, y - 300 * s]], { w: 40 * s, tone: .9, prof: 'press', dry: .5, wet: .6, brWet: true, body: .5, seed: 50 }));
  for (const sg of [-1, 1]) draw(ink, mk([[x + sg * 150 * s, y - 320 * s], [x + sg * 150 * s, y]], { w: 12 * s, tone: .85, prof: 'even', dry: .45, seed: 51 + sg }));
  const bx = x + Math.sin(swing) * 8 * s;
  mass(ink.wet, [[bx - 44 * s, y - 80 * s], [bx - 50 * s, y - 70 * s], [bx - 40 * s, y - 230 * s], [bx, y - 262 * s], [bx + 40 * s, y - 230 * s], [bx + 50 * s, y - 70 * s], [bx + 44 * s, y - 80 * s]], .7, 2 * s, 53, [bx - 50 * s, 0, bx + 50 * s, 0, 1.1, .6]);
  for (let i = 0; i < 3; i++) draw(ink, mk([[bx - 42 * s, y - (110 + i * 40) * s], [bx + 42 * s, y - (110 + i * 40) * s]], { w: 3 * s, tone: .95, prof: 'even', dry: .3, seed: 54 + i }));
  draw(ink, mk([[bx, y - 262 * s], [x, y - 330 * s]], { w: 4 * s, tone: .9, prof: 'even', dry: .3, seed: 57 }));
  draw(ink, mk([[x - 190 * s + swing * 40 * s, y - 170 * s], [x - 70 * s + swing * 40 * s, y - 165 * s]], { w: 14 * s, tone: .8, prof: 'even', dry: .4, seed: 58 }));   // the striking log
}
// bamboo stalks: tall segmented strokes with leaf clusters; ox = scroll offset (parallax)
export function bamboo(L, x0, x1, y, h, seed = 7, tone = .8, ox = 0) {
  const ink = L.ink, R = mulberry(seed), n = Math.round((x1 - x0) / 70);
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, (i + R() * .6) / n) - ox, hh = h * (.8 + R() * .4), lean = (R() - .5) * 40;
    for (let k = 0; k < 6; k++) { const a = [x + lean * k / 6, y - hh * k / 6], b = [x + lean * (k + 1) / 6, y - hh * (k + 1) / 6 + 4]; draw(ink, mk([a, b], { w: 9 + R() * 4, tone: tone * (.7 + R() * .3), prof: 'press', dry: .45, wet: .3, seed: seed * 100 + i * 7 + k })); }
    for (let k = 0; k < 4; k++) { const by = y - hh * (.45 + R() * .5), bx = x + lean * (y - by) / hh, d = R() < .5 ? -1 : 1; draw(ink, mk([[bx, by], [bx + d * 26, by + 6], [bx + d * 54, by + 18]], { w: 10, tone: tone * .9, prof: 'lens', dry: .35, wet: .5, seed: seed * 1000 + i * 9 + k })); }
  }
}
// village houses (dark roofs, pale walls), one doorway
export function houses(L, x, y, s = 1, seed = 9) {
  const ink = L.ink, R = mulberry(seed);
  for (let i = 0; i < 6; i++) { const hx = x + i * 230 * s, w = (170 + R() * 40) * s, h = (110 + R() * 30) * s;
    mass(ink.wet, [[hx - w / 2, y], [hx - w / 2, y - h], [hx + w / 2, y - h], [hx + w / 2, y]], .1, 2, seed + i, null);
    draw(ink, mk([[hx - w * .65, y - h + 8 * s], [hx - w * .2, y - h - 46 * s], [hx + w * .2, y - h - 46 * s], [hx + w * .65, y - h + 8 * s]], { w: 26 * s, tone: .88, prof: 'press', dry: .5, wet: .5, brWet: true, body: .45, seed: seed * 10 + i }));
    mass(ink.wet, [[hx - 18 * s, y], [hx - 18 * s, y - 60 * s], [hx + 18 * s, y - 60 * s], [hx + 18 * s, y]], .75, 1, seed * 20 + i, null);
  }
}
// a doorway seen close: dark interior; open = 0 (shut) … 1 (wide), the leaf swings
export function doorway(L, cx, cy, w, h, open, seed = 11) {
  const ink = L.ink;
  mass(ink.wet, [[cx - w * .9, cy + h * .6], [cx - w * .9, cy - h * .7], [cx + w * .9, cy - h * .7], [cx + w * .9, cy + h * .6]], .1, 4, seed, null);
  mass(ink.wet, [[cx - w / 2, cy + h / 2], [cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2]], .92, 3, seed + 1, null);
  const lw = w * (1 - open * .85);
  mass(ink.wet, [[cx - w / 2, cy + h / 2], [cx - w / 2, cy - h / 2], [cx - w / 2 + lw, cy - h / 2 - open * 10], [cx - w / 2 + lw, cy + h / 2 + open * 10]], .32, 2, seed + 2, null);
  draw(ink, mk([[cx - w / 2 + lw, cy - h / 2 - open * 10], [cx - w / 2 + lw, cy + h / 2 + open * 10]], { w: 6, tone: .9, prof: 'even', dry: .4, seed: seed + 3 }));
  draw(ink, mk([[cx - w * .62, cy - h * .58], [cx, cy - h * .66], [cx + w * .62, cy - h * .58]], { w: 18, tone: .9, prof: 'press', dry: .5, wet: .4, seed: seed + 4 }));
}
// crows on a dead branch: dark blots with beaks; none of them move
export function crows(L, x, y, n, s = 1, seed = 13, look = 0) {
  const ink = L.ink, R = mulberry(seed);
  draw(ink, mk([[x - 40, y + 20], [x + 300 * s, y], [x + 620 * s, y + 30]], { w: 12 * s, tone: .85, prof: 'brush', dry: .55, wet: .3, seed }));
  for (let i = 0; i < n; i++) { const cx = x + (20 + i * 560 / n) * s, cy = y + (i % 2 ? -4 : 6) * s - 18 * s;
    mass(ink.wet, [[cx - 10 * s, cy + 14 * s], [cx - 12 * s, cy - 4 * s], [cx - 2 * s, cy - 14 * s], [cx + 8 * s, cy - 6 * s], [cx + 10 * s, cy + 14 * s]], .85, 1, seed + i, null);
    const d = (look ? -1 : (i % 2 ? 1 : -1)); draw(ink, mk([[cx + d * 2 * s, cy - 10 * s], [cx + d * 14 * s, cy - 8 * s]], { w: 3 * s, tone: .95, prof: 'nail', dry: .2, seed: seed * 10 + i })); }
}
// the walking tide: a dark wet mass with a ragged front of heads and reaching arms; k = how far it has come (0..1)
export function tide(L, x0, x1, yFront, depth, t, seed = 17, am = 1) {
  const ink = L.ink, R = mulberry(seed), front = [];
  for (let x = x0; x <= x1; x += 18) front.push([x, yFront + Math.sin(x * .03 + t * 2) * 6 + (vnoise(x * .02 + seed) - .5) * 30]);
  mass(ink.wet, [...front, [x1, yFront + depth], [x0, yFront + depth]], .6 * am, 8, seed, [x0, yFront - 20, x0, yFront + depth, 1.2, .9]);
  for (let i = 0; i < front.length; i += 2) { const [hx, hy] = front[i], b = Math.sin(t * 4 + i) * 2; blot(ink.wet, hx, hy - 10 + b, 7 + R() * 4, .8 * am, 0, 1.1, i);
    if (R() < .5) draw(ink, mk([[hx, hy], [hx - 6, hy - 22 - R() * 14 + b]], { w: 3, tone: .9 * am, prof: 'tip', dry: .5, seed: seed * 100 + i })); }
}
// stairs up the mountain: short horizontal strokes in perspective
export function stairs(L, x, y0, y1, w, seed = 19) {
  const ink = L.ink; let k = 0;
  for (let y = y0; y > y1; y -= 26) { const u = (y0 - y) / (y0 - y1), ww = w * (1 - u * .6), xx = x + Math.sin(u * 4) * 120; draw(ink, mk([[xx - ww / 2, y], [xx + ww / 2, y]], { w: 4, tone: .7, prof: 'tip', dry: .5, seed: seed * 10 + k++ })); }
}
export { pine, reed, ripple };
