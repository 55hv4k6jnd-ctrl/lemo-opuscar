// SWEEP — sets: the mountain, the cave gate, the pond, the storm, the path, the village. All ink, painted per frame
// except the per-pixel mountain masses, which are cached once per shot.
import { mk, draw, mass, blot } from './ink.js';
import { mountainLayer, ridgeFn, cun, pine, reed, ripple } from './land.js';
import { mulberry, lerp, clamp, vnoise } from '/core/lib.js';

const CACHE = {};
// a cached mountain range (canvas in world px); drawn with the current transform into the wet layer
export function range(key, o) {
  if (!CACHE[key]) { const ridge = ridgeFn(o.peaks, o.base, o.seed ?? 1, o.rough ?? 18); CACHE[key] = { cv: mountainLayer({ W: o.W ?? 1920, H: o.H ?? 1080, ridge, depth: o.depth ?? 260, tone: o.tone ?? .16, rim: o.rim ?? .7, rimW: o.rimW ?? 16, mist: o.mist ?? .9, seed: o.seed ?? 1, xmask: o.xmask }), ridge }; }
  return CACHE[key];
}
export function blitRange(L, key, o, am = 1, dx = 0, dy = 0) {
  const r = range(key, o); L.cw.save(); L.cw.globalAlpha = am; L.cw.drawImage(r.cv, dx, dy); L.cw.restore();
  if (o.cun) cun(L.ink, { x0: dx + 40, x1: dx + (o.W ?? 1920) - 40, ridge: x => r.ridge(x - dx) + dy, tone: o.tone, seed: o.seed ?? 1, cun: o.cun, moss: o.moss ?? 1 });
  return r;
}

// the cave of the Great King: a cliff with a dark arched mouth, two rough gate stones, three steps, a gnarled pine
// g = ground y at the gate; cx = centre of the mouth; s = scale
export function caveGate(L, cx, g, s = 1, t = 0, o = {}) {
  const ink = L.ink;
  const R = mulberry(77);
  // the cliff: a pale wet mass rising out of the frame, loaded strokes along its faces
  mass(ink.wet, [[cx - 520 * s, g + 10], [cx - 470 * s, g - 260 * s], [cx - 380 * s, g - 470 * s], [cx - 140 * s, g - 620 * s], [cx + 180 * s, g - 640 * s], [cx + 420 * s, g - 500 * s], [cx + 540 * s, g - 280 * s], [cx + 580 * s, g + 10]], .2, 10 * s, 78, [cx, g - 640 * s, cx, g, 1.2, .3]);
  for (let i = 0; i < 5; i++) { const x0 = cx + (-440 + i * 210) * s; draw(ink, mk([[x0, g - (420 + R() * 160) * s], [x0 + (R() - .5) * 60 * s, g - 240 * s], [x0 + (R() - .5) * 40 * s, g - 30 * s]], { w: (30 + R() * 20) * s, tone: .4, darkDir: [-1, 0], side: .8, brWet: true, body: .25, dry: .6, wet: .85, prof: 'rise', seed: 79 + i }), 1, .8); }
  // the mouth: dark arch
  const mouth = []; for (let i = 0; i <= 16; i++) { const a = Math.PI + i / 16 * Math.PI; mouth.push([cx + Math.cos(a) * 130 * s, g - 30 * s + Math.sin(a) * 190 * s]); }
  mouth.push([cx + 130 * s, g], [cx - 130 * s, g]);
  mass(ink.wet, mouth, .86, 4 * s, 80, [cx, g - 220 * s, cx, g, 1, .85]);
  draw(ink, mk(mouth.slice(0, 17).map(p => [p[0], p[1] - 6 * s]), { w: 12 * s, tone: .95, prof: 'even', dry: .55, wet: .4, seed: 81 }));
  // the gate stones and a lintel
  for (const sg of [-1, 1]) { const x = cx + sg * 175 * s; mass(ink.wet, [[x - 26 * s, g], [x - 30 * s, g - 210 * s], [x + 28 * s, g - 222 * s], [x + 30 * s, g]], .42, 3 * s, 82 + sg, [x, g - 220 * s, x, g, 1.1, .7]); draw(ink, mk([[x - 28 * s, g - 214 * s], [x - 26 * s, g]], { w: 8 * s, tone: .9, prof: 'brush', dry: .5, wet: .3, seed: 84 + sg })); }
  draw(ink, mk([[cx - 225 * s, g - 228 * s], [cx, g - 244 * s], [cx + 225 * s, g - 228 * s]], { w: 30 * s, tone: .85, prof: 'press', dry: .5, wet: .55, brWet: true, body: .5, seed: 86 }));
  // steps
  for (let i = 0; i < 3; i++) draw(ink, mk([[cx - (240 + i * 50) * s, g + (8 + i * 22) * s], [cx + (240 + i * 50) * s, g + (8 + i * 22) * s]], { w: 3 * s, tone: .7, prof: 'tip', dry: .6, seed: 87 + i }));
  if (o.pine !== false) pine(ink, cx - 430 * s, g + 6, 1.35 * s, 9, t, o.wind ?? .4, 1);
}
// the ground: a few dry horizontal strokes (the rest is blank paper)
export function groundLine(L, x0, x1, y, seed = 5, tone = .55) {
  const R = mulberry(seed);
  for (let i = 0; i < 5; i++) { const a = lerp(x0, x1, R() * .7), b = a + 200 + R() * 500; draw(L.ink, mk([[a, y + R() * 30], [b, y + R() * 30]], { w: 3 + R() * 3, tone, prof: 'tip', dry: .7, seed: seed * 10 + i }), 1, .8); }
}
// leaves, snow, bones (things to be swept): positions are fixed per seed; k = how much is left (0 swept … 1 all there)
export function litter(L, kind, x0, x1, y, k, seed = 1, t = 0) {
  if (k <= 0) return; const R = mulberry(seed), n = 26;
  for (let i = 0; i < n; i++) {
    if (i / n > k) continue;
    const x = lerp(x0, x1, R()), yy = y + R() * 60, a = R() * 6.28;
    if (kind === 'leaf') draw(L.ink, mk([[x, yy], [x + Math.cos(a) * 14, yy + Math.sin(a) * 5]], { w: 7, tone: .75, prof: 'lens', dry: .35, wet: .5, seed: seed * 100 + i }));
    else if (kind === 'snow') blot(L.cw, x, yy - R() * 300 * (1 - k), 0, 0);
    else if (kind === 'bone') { draw(L.ink, mk([[x, yy], [x + Math.cos(a) * 22, yy + Math.sin(a) * 6]], { w: 4, tone: .85, prof: 'even', dry: .3, seed: seed * 100 + i })); blot(L.cd, x, yy, 4, .85, 0, 1, i); blot(L.cd, x + Math.cos(a) * 22, yy + Math.sin(a) * 6, 4, .85, 0, 1, i + 50); }
  }
}
// falling leaves / snow in the air
export function falling(L, kind, t, n = 30, seed = 3, am = 1) {
  const R = mulberry(seed);
  for (let i = 0; i < n; i++) {
    const x0 = R() * 1920, sp = 50 + R() * 60, ph = R() * 20, y = ((t + ph) * sp) % 1180 - 60, x = x0 + Math.sin((t + ph) * 1.3) * 40;
    if (kind === 'leaf') draw(L.ink, mk([[x, y], [x + 12, y + 4 * Math.sin(t * 3 + i)]], { w: 6, tone: .7 * am, prof: 'lens', dry: .35, wet: .5, seed: seed * 100 + i }));
    else blot(L.cd, x, y, 2 + R() * 2.5, .25 * am, 0, 1, i);
  }
}
// rain: slanted dry strokes; k = intensity
export function rain(L, t, k = 1, seed = 4, slant = .25) {
  if (k <= 0) return; const R = mulberry(seed), n = Math.round(140 * k);
  const c = L.cd; c.save(); c.strokeStyle = '#000'; c.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x0 = R() * 2300 - 200, sp = 1400 + R() * 600, len = 30 + R() * 50, y = ((t * sp + R() * 2000) % 1300) - 100, x = x0 + y * slant; c.globalAlpha = (.12 + R() * .22) * k; c.lineWidth = .8 + R() * 1.4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + len * slant, y + len); c.stroke(); }
  c.restore();
}
// storm clouds: big wet masses across the top, drifting
export function stormClouds(L, t, k = 1, seed = 6) {
  if (k <= 0) return; const R = mulberry(seed);
  for (let i = 0; i < 10; i++) { const x = R() * 2300 - 200 + Math.sin(t * .15 + i) * 40, y = R() * 240 - 30, w = 260 + R() * 420;
    for (let j = 0; j < 7; j++) blot(L.cw, x + (R() - .5) * w, y + (R() - .5) * 90, 70 + R() * 110, (.12 + R() * .12) * k, R() * 3, .55 + R() * .25, seed * 50 + i * 7 + j); }
}
// a pond at night: blank paper water, a few dry streaks at the banks; the moon's reflection (an open ink ring) that breaks when swept
export function pond(L, cx, cy, rx, ry, t, broken = 0, seed = 8) {
  const ink = L.ink, R = mulberry(seed);
  for (let i = 0; i < 6; i++) { const a = R() * Math.PI * 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; draw(ink, mk([[x - 60, y], [x + 60, y + (R() - .5) * 6]], { w: 4, tone: .6, prof: 'tip', dry: .65, seed: seed * 10 + i })); }
  for (let i = 0; i < 7; i++) reed(ink, cx - rx - 30 + i * 22, cy + ry * .2 + R() * 10, 90 + R() * 70, 1, seed * 30 + i, Math.sin(t * .8 + i) * .15, .75);
  // the reflection: one open ring; broken = scattered into ripples
  if (broken < .98) { const r = 46, n = 5, sc = 1 + broken * 1.2; for (let k = 0; k < (broken > .02 ? n : 1); k++) { const off = broken * (k - 2) * 26; ripple(ink, cx + 60 + off, cy - 4 + Math.sin(k * 2) * broken * 8, r * (k ? .5 + k * .1 : 1) * sc * (broken > .02 ? .6 : 1), (1 - broken * .7) * .9, seed + k, .32, 3); } }
}
export function moon(L, x, y, r = 70) {
  const pts = []; for (let i = 0; i <= 30; i++) { const a = -1.2 + i / 30 * Math.PI * 1.9; pts.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); }
  draw(L.ink, mk(pts, { w: 4, tone: .55, prof: 'brush', dry: .5, wet: .4, seed: 91 }));
}
// a village at the foot of the mountain: roofs as loaded strokes, lantern shapes left as blank paper with an ink ring
export function village(L, x, y, s = 1, t = 0, lanterns = 1) {
  const ink = L.ink, R = mulberry(12);
  for (let i = 0; i < 6; i++) {
    const hx = x + i * 170 * s + R() * 40 * s, hy = y + R() * 30 * s, w = (110 + R() * 50) * s;
    mass(ink.wet, [[hx - w / 2, hy], [hx - w / 2, hy - 60 * s], [hx + w / 2, hy - 60 * s], [hx + w / 2, hy]], .12, 3 * s, 120 + i, null);
    draw(ink, mk([[hx - w * .62, hy - 52 * s], [hx - w * .2, hy - 92 * s], [hx + w * .2, hy - 92 * s], [hx + w * .62, hy - 52 * s]], { w: 16 * s, tone: .85, prof: 'press', dry: .5, wet: .5, brWet: true, body: .4, seed: 130 + i }));
    mass(ink.wet, [[hx - 12 * s, hy], [hx - 12 * s, hy - 34 * s], [hx + 12 * s, hy - 34 * s], [hx + 12 * s, hy]], .6, 1, 140 + i, null);
  }
  // lanterns on poles, swaying (paper-white bodies with an ink outline)
  for (let i = 0; i < 7 * lanterns; i++) {
    const lx = x - 40 * s + i * 150 * s, ly = y - 110 * s + Math.sin(t * 1.5 + i) * 3 * s;
    draw(ink, mk([[lx, ly - 30 * s], [lx, y + 20 * s]], { w: 2.4 * s, tone: .8, prof: 'even', dry: .4, seed: 150 + i }));
    const pts = []; for (let k = 0; k <= 20; k++) { const a = k / 20 * Math.PI * 2; pts.push([lx + 18 * s + Math.cos(a) * 14 * s, ly + Math.sin(a) * 18 * s]); }
    draw(ink, mk(pts, { w: 2.4 * s, tone: .75, prof: 'even', dry: .3, seed: 160 + i }));
    blot(L.cw, lx + 18 * s, ly, 40 * s, .05, 0, 1, i);
  }
}
// villagers: small figures (pale masses with hats), holding lanterns up
export function villager(L, x, y, s, seed = 1, t = 0) {
  const ink = L.ink;
  mass(ink.wet, [[x - 9 * s, y], [x - 10 * s, y - 34 * s], [x - 5 * s, y - 40 * s], [x + 6 * s, y - 40 * s], [x + 10 * s, y - 34 * s], [x + 9 * s, y]], .2, 1, seed, null);
  draw(ink, mk([[x - 14 * s, y - 44 * s], [x, y - 54 * s], [x + 14 * s, y - 44 * s]], { w: 3 * s, tone: .9, prof: 'tip', dry: .3, seed: seed + 1 }));
  draw(ink, mk([[x + 6 * s, y - 32 * s], [x + 16 * s, y - 58 * s]], { w: 2 * s, tone: .8, prof: 'tip', dry: .3, seed: seed + 2 }));
}
