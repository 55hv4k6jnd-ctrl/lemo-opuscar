// SWEEP — shots (80s Cel Anime). g = scene canvas (plates + cels), e = glow canvas (light), ov = subtitle layer.
// Characters on twos (12 fps), blinks and lip flaps on threes (8 fps); camera, light, rain on ones.
import { W, H, rgba, mix, TAU, rng, line, cel, path, poly } from './cel.js';
import { PAL } from './pal.js';
import * as B from './bg.js';
import { imp, king, demon, child, villager, lantern, broomHead, tassel } from './chars.js';
import { rain, speedLines, flare, lamp } from './fx.js';
import { SHOTS, DUR as D, VO, T, shotAt, T0 } from './story.js';

export const DUR = D;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const seg = (x, a, b) => clamp((x - a) / (b - a));
const tw = t => Math.floor(t * 12) / 12, t8 = t => Math.floor(t * 8) / 8;
const LIGHTNING = [113, 119, 131.5, 141, 152, 171, 196, 207, 213.5];

// when Sweep is sweeping: [t0, t1, period]; the picture and the foley share it
export const SWEEPS = [[2, 12, 2.2], [13, 30, 2.0], [64, 85, 2.4], [90, 102, 3.2], [146, 157, 2.6], [293, 296, 2.4]];
const sweepAt = t => { for (const [a, b, p] of SWEEPS) if (t >= a && t < b) return { a: .4 + .6 * Math.sin((t - a) / p * TAU), on: 1, ph: (t - a) / p }; return { a: .3, on: 0, ph: 0 }; };
// who is speaking now (for lip flaps on threes)
const speaking = (t, role) => VO.some(v => v.role === role && t >= v.t0 && t < v.t1);
const flap = t => [0, 1, 2, 1][Math.floor(t * 8) % 4];
const blinkAt = (t, seed = 0) => { const p = (t + seed * 1.7) % 4.3; return p < 1 / 8 ? 1 : 0; };

let A = {};
export async function init() {
  A.gate = { morning: B.gatePlate('morning'), dusk: B.gatePlate('dusk'), storm: B.gatePlate('storm'), dawn: B.gatePlate('dawn') };
  A.mtn = { morning: B.mountainPlate('morning'), dusk: B.mountainPlate('dusk'), storm: B.mountainPlate('storm') };
  A.pond = B.pondPlate(); A.pine = B.pinePlate(); A.village = B.villagePlate(); A.sky = B.skyPlate();
  A.strip = { morning: B.gatePlate('morning', 3800, 1300), storm: B.gatePlate('storm', 3800, 1300) };
}
// plate camera: draw a plate (and its emissive pair) so that plate point (fx, fy) lands on the screen centre at zoom z
function plate(g, e, P, z, fx, fy, eA = 1) {
  const dx = W / 2 - fx * z, dy = H / 2 - fy * z;
  g.drawImage(P.pc, dx, dy, P.W * z, P.H * z);
  if (eA > 0) { e.save(); e.globalAlpha = eA; e.drawImage(P.ec, dx, dy, P.W * z, P.H * z); e.restore(); }
  return p => [dx + p[0] * z, dy + p[1] * z];
}
// stamp cels black into the glow canvas so light never bleeds through them
function stamp(e, fn) { e.save(); e.globalCompositeOperation = 'source-over'; e.filter = 'brightness(0)'; fn(); e.restore(); }

const SH = {};
SH.open = (g, e, t) => {          // tape power-on → a multiplane crane down the golden morning to the gate and the tiny imp
  const P = PAL.morning, G = A.gate.morning, k = ss(seg(t, .6, 7)), z = lerp(1.0, 1.55, k), fy = lerp(380, G.gy - 160, k), fx = lerp(G.cx + 60, G.cx + 260, k);
  const S = plate(g, e, G, z, fx, fy);
  const sw = sweepAt(tw(t)), p = S([G.cx + 330, G.gy + 6]);
  const doImp = () => imp(g, e, p[0], p[1], 2.2 * z, P, { t: tw(t), broom: sw.a, drag: sw.a > .5 ? .6 : 0, blink: blinkAt(t) });
  doImp(); stamp(e, doImp);
  title(g, e, t);
  return { power: Math.min(1, t / .6) };
};
function title(g, e, t) {         // chrome title, flickering on at 12 fps on the brass hit, a light sweep and a star glint
  const a = t < 6.5 ? 0 : t > 11.4 ? 1 - seg(t, 11.4, 12) : (Math.floor(t * 12) % 3 === 0 && t < 7.1 ? .35 : 1);
  if (a <= 0) return;
  const x = W / 2, y = 330;
  g.save(); g.globalAlpha = a; g.font = 'italic 900 210px Kanit'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const gr = g.createLinearGradient(0, y - 100, 0, y + 100);
  gr.addColorStop(0, '#6ad0ff'); gr.addColorStop(.46, '#ffffff'); gr.addColorStop(.5, '#3a2a7a'); gr.addColorStop(.7, '#ff5ab0'); gr.addColorStop(1, '#ffd24a');
  g.lineJoin = 'round'; g.lineWidth = 22; g.strokeStyle = '#1a0e3a'; g.strokeText('SWEEP', x, y);
  g.lineWidth = 8; g.strokeStyle = '#ff4f36'; g.strokeText('SWEEP', x, y);
  g.fillStyle = gr; g.fillText('SWEEP', x, y);
  g.font = 'italic 800 46px Kanit'; g.lineWidth = 10; g.strokeStyle = '#1a0e3a'; g.strokeText('a tale from the mountain', x, y + 150); g.fillStyle = '#fff0a0'; g.fillText('a tale from the mountain', x, y + 150);
  g.restore();
  e.save(); e.globalAlpha = a * .8; e.font = 'italic 900 210px Kanit'; e.textAlign = 'center'; e.textBaseline = 'middle'; e.lineWidth = 14; e.strokeStyle = '#ff4f36'; e.strokeText('SWEEP', x, y); e.restore();
  const sw = seg(t, 7.3, 8.6); if (sw > 0 && sw < 1) { const sx = lerp(x - 520, x + 520, sw); e.save(); e.globalCompositeOperation = 'lighter'; const lg = e.createLinearGradient(sx - 80, 0, sx + 80, 0); lg.addColorStop(0, rgba('#ffffff', 0)); lg.addColorStop(.5, rgba('#ffffff', .8)); lg.addColorStop(1, rgba('#ffffff', 0)); e.fillStyle = lg; e.fillRect(sx - 80, y - 110, 160, 220); e.restore(); }
  if (t > 8.6 && t < 10) flare(e, x + 470, y - 70, .5 * Math.sin(seg(t, 8.6, 10) * Math.PI), '#bfe6ff', { ghosts: false, streak: 500 });
}
const LITTER = (g, kind, x0, x1, y, k, seed, P) => { if (k <= 0) return; const R = rng(seed);
  for (let i = 0; i < 24; i++) { if (i / 24 > k) { R(); R(); R(); continue; } const x = lerp(x0, x1, R()), yy = y + R() * 40, a = R() * TAU;
    if (kind === 'leaf') cel(g, path([[x, yy], [x + Math.cos(a) * 14, yy + Math.sin(a) * 5 - 4], [x + Math.cos(a) * 18, yy + Math.sin(a) * 6], [x + Math.cos(a) * 6, yy + Math.sin(a) * 2 + 4]]), { f: i % 2 ? '#e8902a' : '#d0502a', l: '#5a2a0a', lw: 1.6 });
    else if (kind === 'snow') { g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(x, yy, 26, 7, 0, 0, TAU); g.fill(); }
    else cel(g, path([[x - 14, yy - 2], [x + 14, yy - 2], [x + 18, yy + 2], [x - 18, yy + 2]]), { f: P.bone.f, l: P.bone.l, lw: 1.6 }); } };
SH.seasons = (g, e, t) => {       // locked: leaves → snow → bones; he sweeps each away (colour model stays morning; the snow lightens it)
  const P = PAL.morning, G = A.gate.morning, lt = t - T0.seasons, z = 1.5;
  const S = plate(g, e, G, z, G.cx + 200, G.gy - 140);
  const ph = lt < 6 ? 'leaf' : lt < 12 ? 'snow' : 'bone', pl = (lt % 6) / 6;
  if (ph === 'snow') { g.fillStyle = rgba('#ffffff', .25); g.fillRect(0, 0, W, H); }
  const q0 = S([G.cx - 120, G.gy + 4]), q1 = S([G.cx + 600, G.gy + 4]);
  LITTER(g, ph, q0[0], q1[0], q0[1], 1 - ss(seg(pl, .4, 1)), lt < 6 ? 2 : lt < 12 ? 3 : 4, P);
  const R = rng(Math.floor(t * 12));
  if (ph === 'leaf') for (let i = 0; i < 14; i++) { const x = ((i * 157 + t * 60) % 2100) - 90, y = ((i * 97 + t * 90) % 1200) - 60; cel(g, path([[x, y], [x + 12, y - 4], [x + 16, y], [x + 4, y + 4]]), { f: '#e8902a', l: '#5a2a0a', lw: 1.4 }); }
  if (ph === 'snow') for (let i = 0; i < 90; i++) { const x = ((i * 211 + t * 30) % 2000) - 40, y = ((i * 131 + t * 70) % 1150) - 40; g.fillStyle = rgba('#ffffff', .85); g.beginPath(); g.arc(x + Math.sin(t + i) * 10, y, 3 + i % 3, 0, TAU); g.fill(); }
  const sw = sweepAt(tw(t)), px = lerp(q0[0] + 80, q1[0] - 120, Math.sin(pl * Math.PI));
  const fn = () => imp(g, e, px, q0[1], 2.4 * z, P, { t: tw(t), broom: sw.a, f: pl < .5 ? 1 : -1, blink: blinkAt(t, 1), squash: ph === 'snow' ? .96 : 1 });
  fn(); stamp(e, fn);
};
const NAMES = [['IRON TUSK', 0], ['SEVEN EYES', 1], ['MISTER FANG', 2], ['OLD SMOKE', 3], ['LADY THORN', 0], ['THE TWINS', 1], ['GRUMBLE', 2], ['LONG NECK', 3], ['ASH', 0], ['HOOK', 2]];
SH.demons = (g, e, t) => {        // side tracking past a mock-credits line-up: each demon with a boxed name card; his card is empty
  const P = PAL.morning, lt = t - T0.demons, x = lerp(0, 2700, ss(seg(lt, 0, 19)));
  vgradSky(g, A.gate.morning);
  g.drawImage(A.strip.morning.pc, -x * .25 - 200, -220, 3800, 1300);
  g.fillStyle = mix('#b8a46a', '#000000', .1); g.fillRect(0, 860, W, 220);
  NAMES.forEach(([nm, k], i) => {
    const dx = 400 + i * 290 - x; if (dx < -200 || dx > W + 200) return;
    const fn = () => demon(g, e, dx, 870, 3, k, tw(t) * .5 + i * .2, P, { f: -1 }); fn(); stamp(e, fn);
    nameCard(g, e, dx - 90, 520 - (i % 2) * 40, nm, 1);
  });
  const ix = 400 + NAMES.length * 290 + 60 - x;
  if (ix < W + 200) { const fn = () => imp(g, e, ix, 870, 3.1, P, { t: tw(t), broom: .3, f: -1, look: [-1, -.4], blink: blinkAt(t, 2) }); fn(); stamp(e, fn); nameCard(g, e, ix - 90, 520, '', 1); }
};
function vgradSky(g, G) { g.drawImage(G.pc, 0, 0, G.W, 300, 0, 0, W, H * .6); }
function nameCard(g, e, x, y, text, a) {
  g.save(); g.globalAlpha = a; g.fillStyle = 'rgba(16,10,40,.82)'; g.beginPath(); g.roundRect(x, y, 200, 56, 6); g.fill();
  g.strokeStyle = '#ffd24a'; g.lineWidth = 3; g.stroke(); g.font = '600 32px "Barlow SC"'; g.fillStyle = '#fff0a0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text || '???', x + 100, y + 29);
  if (!text) { g.fillStyle = 'rgba(16,10,40,1)'; g.fillRect(x + 50, y + 12, 100, 34); }
  g.restore();
}
SH.king = (g, e, t) => {          // low angle: the King towers; a slow push; the shout = a tom hit, a shake and an impact-white frame
  const P = PAL.morning, lt = t - T0.king, sh = Math.max(0, 1 - Math.abs(t - T.kingShout - .3) / .8), z = lerp(1, 1.1, ss(seg(lt, 0, 12)));
  g.drawImage(A.gate.morning.pc, 0, 0, 2200, 700, 0, 0, W, 900);
  g.fillStyle = '#8a7a4a'; g.fillRect(0, 900, W, 180);
  const jx = Math.sin(t * 50) * 8 * sh, jy = Math.cos(t * 43) * 6 * sh;
  const fn = () => king(g, e, 1020 + jx, 1200 + jy, 2.6 * z, P, { t: tw(t), roar: clamp(sh * 1.4), arms: sh > .2 ? 'point' : 'down' });
  fn();
  const fi = () => imp(g, e, 300, 1010, 2.4, P, { t: tw(t), broom: .2, look: [1, -1], squash: 1 - sh * .1, blink: blinkAt(t, 3) }); fi(); stamp(e, fi);
  if (sh > .2) speedLines(g, Math.floor(t * 12), { type: 'radial', cx: 1050, cy: 520, a: .25 * sh, col: '#ffffff' });
};
SH.days = (g, e, t) => {          // high wide: the demons march down at dawn and back at dusk (morning → dusk colour model)
  const lt = t - T0.days, dusk = ss(seg(lt, 10, 13)), P = dusk > .5 ? PAL.dusk : PAL.morning;
  g.drawImage(A.mtn.morning.pc, 0, 0); if (dusk > 0) { g.save(); g.globalAlpha = dusk; g.drawImage(A.mtn.dusk.pc, 0, 0); g.restore(); }
  const PT = B.PATH, march = (u, dir) => { for (let i = 0; i < 9; i++) { const v = clamp(u - i * .04); if (v <= 0 || v >= 1) continue; const q = dir > 0 ? v : 1 - v, k = q * (PT.length - 1), j = Math.min(PT.length - 2, Math.floor(k)), f = k - j; const p = [lerp(PT[j][0], PT[j + 1][0], f), lerp(PT[j][1], PT[j + 1][1], f)]; demon(g, e, p[0], p[1], .5, i % 4, tw(t) * 2 + i, P, { f: PT[j + 1][0] > PT[j][0] ? 1 : -1 }); } };
  march(seg(lt, 0, 9), 1); march(seg(lt, 13, 23), -1);
  const sw = sweepAt(tw(t)); imp(g, e, 1150, 300, .9, P, { t: tw(t), broom: sw.a });
};
SH.pond = (g, e, t) => {          // night: he sweeps the moon's reflection off the pond; it comes back
  const P = PAL.night, lt = t - T0.pond;
  g.drawImage(A.pond.pc, 0, 0); e.drawImage(A.pond.ec, 0, 0);
  const brk = Math.max(0, Math.sin(seg(lt, 4, 10) * Math.PI)) * (lt < 10 ? 1 : 0) + Math.max(0, Math.sin(seg(lt, 11, 16) * Math.PI)) * .6;
  B.moonReflection(g, e, 1100, 790, t, brk);
  const sw = sweepAt(tw(t));
  const fn = () => imp(g, e, 760, 800, 3.2, P, { t: tw(t), broom: sw.on ? .9 + .35 * Math.sin(sw.ph * TAU) : .4, drag: .5, look: [1, .4], blink: blinkAt(t, 4), mouth: lt > 15 ? 'smile' : 0, rim: P.rim }); fn(); stamp(e, fn);
};
SH.bloom = (g, e, t) => {         // the gate repainted in the storm colour model: rain, lightning backlights the cliff
  const P = PAL.storm, G = A.gate.storm, lt = t - T0.bloom;
  const fl = LIGHTNING.reduce((m, l) => Math.max(m, t >= l && t < l + .25 ? 1 - (t - l) / .25 : 0), 0);
  plate(g, e, G, 1.2, G.cx + 60, G.gy - 260);
  if (fl > 0) { e.save(); e.globalAlpha = fl; e.fillStyle = '#9adfff'; e.fillRect(0, 0, W, 500); e.restore(); g.fillStyle = rgba('#e8f6ff', fl * .5); g.fillRect(0, 0, W, H); }
  rain(g, e, Math.floor(t * 24) % 3, { n: Math.round(260 * ss(seg(lt, 0, 6))), a: .45 });
  return { expo: 1 + fl * .3 };
};
SH.flee = (g, e, t) => {          // side tracking in the rain: the King and his demons run for it
  const P = PAL.storm, lt = t - T0.flee, x = lt * 320;
  g.drawImage(A.strip.storm.pc, -((x * .3) % 1600) - 200, -260, 3800, 1300);
  g.fillStyle = '#22262e'; g.fillRect(0, 880, W, 200);
  g.strokeStyle = rgba('#5a6070', .6); g.lineWidth = 4; for (let i = 0; i < 8; i++) { const gx = ((i * 330 - x) % 2640 + 2640) % 2640 - 200; g.beginPath(); g.moveTo(gx, 920 + (i % 3) * 30); g.lineTo(gx + 140, 920 + (i % 3) * 30); g.stroke(); }
  const fk = () => king(g, e, 1250 + Math.sin(lt * .7) * 60, 1000, 1.05, P, { t: tw(t), run: tw(t) * 2.4, arms: 'up', roar: .9, f: 1, rim: P.rim }); fk(); stamp(e, fk);
  for (let i = 0; i < 9; i++) { const fd = () => demon(g, e, 160 + i * 110 + Math.sin(i * 2 + lt) * 30, 930 + (i % 3) * 22, 1.5, i % 4, tw(t) * 3 + i * .3, P, { f: 1, rim: P.rim }); fd(); stamp(e, fd); }
  speedLines(g, Math.floor(t * 12), { type: 'h', a: .18, col: '#c8f4ff', n: 30 });
  rain(g, e, Math.floor(t * 24) % 3, { n: 260, a: .45, ang: .4 });
  return { track: t > T0.flee && t < T0.flee + .3 ? 1 - (t - T0.flee) / .3 : 0 };
};
SH.alone = (g, e, t) => {         // the storm gate again: alone, still sweeping; then he hears it and turns
  const P = PAL.storm, G = A.gate.storm, lt = t - T0.alone, z = 1.5;
  const S = plate(g, e, G, z, G.cx + 200, G.gy - 140), q = S([G.cx + 330, G.gy + 6]);
  const sw = sweepAt(tw(t)), heard = lt > 9;
  const fn = () => imp(g, e, q[0], q[1], 2.4 * z, P, { t: tw(t), broom: heard ? .2 : sw.a, f: heard ? -1 : 1, look: heard ? [-1, 0] : [0, 0], blink: blinkAt(t, 5), rim: P.rim, scarfWind: .9 }); fn(); stamp(e, fn);
  rain(g, e, Math.floor(t * 24) % 3, { n: 240, a: .42 });
};
SH.child = (g, e, t) => {         // under the old pine: the lost child; "Are you… a monster?" — "I… sweep."
  const P = PAL.storm, lt = t - T0.child, met = T.monster - T0.child, z = lerp(1, 1.2, ss(seg(lt, 22, 40)));
  plate(g, e, A.pine, z, 960, 640);
  const toS = (x, y) => [W / 2 + (x - 960) * z, H / 2 + (y - 640) * z];
  const c = toS(820, 925), cry = lt < met - 1 ? 1 : 0;
  const fc = () => child(g, e, c[0], c[1], 6.2 * z, P, { t: tw(t), cry, arms: cry ? 'eyes' : 'hug', look: [1, 0], mouth: speaking(t, 'C') ? flap(t) : 0, blink: blinkAt(t, 6) }); fc(); stamp(e, fc);
  const ix = lerp(1750, 1200, ss(seg(lt, 5, 13))), ip = toS(ix, 925), mov = lt > 5 && lt < 13;
  const fi = () => imp(g, e, ip[0], ip[1], 4 * z, P, { t: tw(t), f: -1, broom: .15, step: mov ? tw(t) * 1.6 : 0, look: [-1, 0], mouth: speaking(t, 'S') ? flap(t) : 0, blink: blinkAt(t, 7), brow: -.5, rim: P.rim }); fi(); stamp(e, fi);
  rain(g, e, Math.floor(t * 24) % 3, { n: 170, a: .35 });
};
SH.path = (g, e, t) => {          // high wide in the storm: the path gone under mud; water rising
  const P = PAL.storm, lt = t - T0.path;
  g.drawImage(A.mtn.storm.pc, 0, 0);
  mud(g, 1, 0);
  const wl = 1010 - ss(seg(lt, 0, 15)) * 80; g.fillStyle = rgba('#2a3a5a', .85); g.fillRect(0, wl, W, H - wl);
  g.strokeStyle = rgba('#a8c8f0', .5); g.lineWidth = 3; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(0, wl + 8 + i * 14); for (let x = 0; x <= W; x += 40) g.lineTo(x, wl + 8 + i * 14 + Math.sin(x * .02 + t * 2 + i) * 4); g.stroke(); }
  imp(g, e, 1150, 300, .9, P, { t: tw(t), broom: .3 }); child(g, e, 1100, 300, 1.1, P, { t: tw(t), arms: 'hug' });
  rain(g, e, Math.floor(t * 24) % 3, { n: 280, a: .45 });
};
function mud(g, k, cut) {
  const R = rng(33);
  g.save();
  for (let i = 0; i < 9; i++) { const y = 380 + i * 70, x = 700 + R() * 500, w = 240 + R() * 260; cel(g, path(Array.from({ length: 10 }, (_, j) => { const a = j / 10 * TAU; return [x + Math.cos(a) * w / 2 * (.8 + .3 * Math.sin(j * 2 + i)), y + Math.sin(a) * 34]; })), { f: '#3a2e2e', s: '#22181c', so: [-6, -6], l: '#120a0c', lw: 2.4 }); }
  for (let i = 0; i < 7; i++) { const x = 760 + R() * 420, y = 420 + R() * 500; line(g, [[x - 50, y], [x + 50, y - 20 + R() * 40]], '#2a1a12', 9); }
  g.restore();
  if (cut > 0) { g.save(); g.globalAlpha = cut; g.strokeStyle = '#ffe9a8'; g.lineCap = 'round'; g.lineWidth = 120; g.beginPath(); g.moveTo(1130, 320); g.bezierCurveTo(700, 520, 1300, 700, 880, 1080); g.stroke(); g.lineWidth = 60; g.strokeStyle = '#fffbe8'; g.stroke(); g.restore(); }
}
SH.silence = (g, e, t) => {       // extreme close-up on his eyes, rain on his face; they narrow. One beat of true silence.
  const P = PAL.storm, lt = t - T0.silence;
  g.fillStyle = '#1a2240'; g.fillRect(0, 0, W, H);
  const s = 26, z = lerp(1, 1.06, ss(seg(lt, 0, 7)));
  const fn = () => imp(g, e, 860, 1600, s * z, P, { t: tw(t), noBroom: true, look: [.3, 0], blink: lt > 6 ? .4 : blinkAt(t, 8) * (lt < 3 ? 1 : 0), brow: ss(seg(lt, 3, 5)), rim: P.rim }); fn();
  rain(g, e, Math.floor(t * 24) % 3, { n: 90, a: .3 });
  return { expo: .95 };
};
SH.sweep = (g, e, t) => {         // speed lines → impact frame → a band of gold light tears through the storm and opens the path
  const P = PAL.storm, p = ss(seg(t, T.sweep, T.sweepEnd)), after = seg(t, T.sweepEnd, T.sweepEnd + 4);
  if (t < T.sweep) { g.fillStyle = '#0a0e22'; g.fillRect(0, 0, W, H); speedLines(g, Math.floor(t * 12), { type: 'radial', cx: 960, cy: 540, a: .9, col: '#ffe9a8', n: 120 }); const fn = () => imp(g, e, 960, 820, 6, PAL.sil, { t: tw(t), broom: 1.3, drag: 1, rim: '#ffd27a' }); fn(); return { expo: 1.1 }; }
  if (t < T.sweep + 2 / 24) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, W, H); const fn = () => imp(g, e, 960, 820, 6, PAL.sil, { t: tw(t), broom: 1.4, drag: 1 }); fn(); return {}; }   // impact frame
  g.drawImage(A.mtn.storm.pc, 0, 0);
  if (after > 0) { g.save(); g.globalAlpha = ss(after); g.drawImage(A.mtn.morning.pc, 0, 0); g.restore(); }
  mud(g, 1, ss(seg(t, T.sweep, T.sweepEnd + 1)));
  // the band of light along the sweep (emissive)
  e.save(); e.globalCompositeOperation = 'lighter'; e.strokeStyle = rgba('#ffd27a', .9 * (1 - after * .6)); e.lineCap = 'round'; e.lineWidth = 180; e.beginPath(); e.moveTo(1130, 320); e.bezierCurveTo(700, 520, 1300, 700, 880, 1080); e.setLineDash([2400 * p, 3000]); e.stroke(); e.restore();
  if (p < 1) flare(e, lerp(1130, 880, p), lerp(320, 1080, p), .8, '#ffe0a0', {});
  const fi = () => imp(g, e, 1180, 300, 1.1, after > .3 ? PAL.morning : P, { t: tw(t), broom: p < 1 ? 1.4 : .5, drag: 1 }); fi();
  child(g, e, 1120, 300, 1.2, after > .3 ? PAL.morning : P, { t: tw(t), arms: 'hug' });
  if (after < .6) rain(g, e, Math.floor(t * 24) % 3, { n: Math.round(280 * (1 - after * 1.6)), a: .45 });
  return { flash: 0, expo: 1 + (1 - after) * .1 };
};
SH.dawn = (g, e, t) => {          // a slow pan across the painted dawn: down the cleared path to the village with its lanterns
  const P = PAL.dawn, lt = t - T0.dawn, x = lerp(0, 1480, ss(seg(lt, 0, 22)));
  g.drawImage(A.village.pc, -x, 0); e.drawImage(A.village.ec, -x, 0);
  for (let i = 0; i < 6; i++) { const fv = () => villager(g, e, 2330 + i * 95 - x, 912, 2, P, i, t); fv(); }
  const u = ss(seg(lt, 2, 20)), px = lerp(300, 2150, u), py = lerp(430, 905, Math.pow(u, 1.3));
  const fi = () => imp(g, e, px - x, py, 1.5, P, { t: tw(t), broom: .2, step: tw(t) * 1.6 }); fi(); stamp(e, fi);
  const fc = () => child(g, e, px - x - 70, py, 1.8, P, { t: tw(t), step: tw(t) * 1.6 }); fc(); stamp(e, fc);
};
SH.name = (g, e, t) => {          // two-shot at the village, lip flaps; then a held close-up on his face as he says his name
  const P = PAL.dawn, lt = t - T0.name, named = t > T.name + .4, hold = t > T.name + 1.2 && t < T.name + 7;
  g.drawImage(A.village.pc, -1400, -60, 3400 * 1.06, 1080 * 1.06); e.drawImage(A.village.ec, -1400, -60, 3400 * 1.06, 1080 * 1.06);
  if (hold) {                     // stillness as drama: a held close-up, only a slow push and the scarf moving
    const k = ss(seg(t, T.name + 1.2, T.name + 7));
    g.fillStyle = rgba('#ffd8c0', .35); g.fillRect(0, 0, W, H);
    const fn = () => imp(g, e, 980, 1330, 18 * (1 + k * .04), P, { t: tw(t), noBroom: true, look: [-.6, -.3], mouth: speaking(t, 'S') ? flap(t) : 'smile', blink: blinkAt(t, 9), brow: -.2, glint: k > .5 }); fn();
    return {};
  }
  for (let i = 0; i < 5; i++) villager(g, e, 220 + i * 120, 770, 2.6, P, i, t);
  const fc = () => child(g, e, 760, 960, 7, P, { t: tw(t), arms: t > T.name - 6 && t < T.name + 3 ? 'hold' : 'down', look: [1, -.5], mouth: speaking(t, 'C') ? flap(t) : 0, smile: !speaking(t, 'C'), blush: named, blink: blinkAt(t, 10) }); fc(); stamp(e, fc);
  const fi = () => imp(g, e, 1220, 960, 4.4, P, { t: tw(t), f: -1, broom: .15, look: [-1, named ? -1 : .5], mouth: speaking(t, 'S') ? flap(t) : named ? 'smile' : 0, blink: blinkAt(t, 11), brow: named ? .3 : -.6 }); fi(); stamp(e, fi);
};
SH.back = (g, e, t) => {          // the gate repainted at dawn: the King is back. "Broom thing!" — "Sweep, sir."
  const P = PAL.dawn, G = A.gate.dawn, lt = t - T0.back, z = 1.5, sh = Math.max(0, 1 - Math.abs(t - T.kingBack - .3) / .8);
  const S = plate(g, e, G, z, G.cx + 100, G.gy - 140);
  const kp = S([G.cx + 470, G.gy + 6]), ip = S([G.cx - 60, G.gy + 6]);
  const fk = () => king(g, e, kp[0], kp[1], 1.15, P, { t: tw(t), roar: sh, arms: sh > .2 ? 'point' : 'down', f: -1 }); fk(); stamp(e, fk);
  const sw = sweepAt(tw(t));
  const fi = () => imp(g, e, ip[0], ip[1], 3.4, P, { t: tw(t), broom: lt > 6 ? .1 : sw.a, f: 1, look: [1, -1], mouth: speaking(t, 'S') ? flap(t) : lt > 9 ? 'smile' : 0, brow: lt > 6 ? .5 : 0, blink: blinkAt(t, 12) }); fi(); stamp(e, fi);
};
SH.sign = (g, e, t) => {          // a slow pan up from the gate into the morning sky; far below a tiny figure waves; freeze-frame name card
  const P = PAL.dawn, lt = t - T0.sign, up = ss(seg(lt, 0, 9));
  const yoff = lerp(-1320, 0, up);
  g.drawImage(A.sky.pc, 0, yoff); e.drawImage(A.sky.ec, 0, yoff);
  const G = A.gate.dawn; g.drawImage(G.pc, 0, 0, G.W, G.H, -140, yoff + 1320 + 180 - 0, G.W * .95, G.H * .95);
  const fi = () => imp(g, e, 1240, yoff + 1320 + 180 + G.gy * .95, 2.2, P, { t: tw(t), broom: .3, f: -1, look: [-1, -1], mouth: 'smile' }); fi();
  if (t > T.wave) { child(g, e, 380, yoff + 2400, 1.2, P, { t: tw(t), arms: 'wave' }); }
  if (t > T.seal) {               // freeze-frame name card
    const k = ss(seg(t, T.seal, T.seal + .3));
    g.save(); g.globalAlpha = k; g.font = 'italic 900 150px Kanit'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const gr = g.createLinearGradient(0, 300, 0, 460); gr.addColorStop(0, '#6ad0ff'); gr.addColorStop(.46, '#ffffff'); gr.addColorStop(.5, '#3a2a7a'); gr.addColorStop(.7, '#ff5ab0'); gr.addColorStop(1, '#ffd24a');
    g.lineJoin = 'round'; g.lineWidth = 18; g.strokeStyle = '#1a0e3a'; g.strokeText('SWEEP', W / 2, 380); g.lineWidth = 6; g.strokeStyle = '#ff4f36'; g.strokeText('SWEEP', W / 2, 380); g.fillStyle = gr; g.fillText('SWEEP', W / 2, 380);
    g.font = 'italic 800 40px Kanit'; g.lineWidth = 9; g.strokeStyle = '#1a0e3a'; g.strokeText('— that is my name —', W / 2, 500); g.fillStyle = '#fff0a0'; g.fillText('— that is my name —', W / 2, 500); g.restore();
    e.save(); e.globalAlpha = k * .7; e.font = 'italic 900 150px Kanit'; e.textAlign = 'center'; e.textBaseline = 'middle'; e.lineWidth = 10; e.strokeStyle = '#ff4f36'; e.strokeText('SWEEP', W / 2, 380); e.restore();
  }
  return { fade: ss(seg(t, T.end - 1.4, T.end)) * .9, expo: 1 - ss(seg(t, T.end - 1.2, T.end)) * .9 };
};

// ---------------- dispatcher + subtitles on the tape ----------------
const SPANS = VO.map((v, i) => ({ ...v, a: v.t0 - .05, b: Math.min(v.t0 + Math.max(v.t1 - v.t0 + .6, 1.9), VO[i + 1] ? VO[i + 1].t0 - .05 : 1e9) }));
export function frame(g, e, ov, t) {
  const sh = shotAt(t);
  const o = SH[sh.id](g, e, t) || {};
  const v = SPANS.find(s => t >= s.a && t < s.b);
  if (v && t < T.seal) {
    const y = H - 96, dlg = v.role !== 'N';
    ov.save(); ov.font = '600 52px "Barlow SC"'; ov.textAlign = 'center'; ov.textBaseline = 'middle'; ov.lineJoin = 'round';
    ov.shadowColor = 'rgba(0,0,0,.55)'; ov.shadowBlur = 10; ov.shadowOffsetY = 3; ov.strokeStyle = '#120a1e'; ov.lineWidth = 9; ov.strokeText(v.text, W / 2, y);
    ov.shadowColor = 'transparent'; ov.fillStyle = dlg ? '#b8f0ff' : '#fff0a0'; ov.fillText(v.text, W / 2, y); ov.restore();
  }
  return o;
}
export function texts(t) { const v = SPANS.find(s => t >= s.a + .05 && t < s.b); return v && t < T.seal ? [{ id: 'vo' + v.id, text: v.text, x0: 200, y0: H - 130, x1: W - 200, y1: H - 60 }] : []; }
export function events() {
  const ev = [];
  for (const [id, t0] of SHOTS) ev.push({ t: t0, type: 'shot', id });
  for (const v of VO) ev.push({ t: +v.t0.toFixed(3), type: 'vo', id: v.id, role: v.role, dur: +(v.t1 - v.t0).toFixed(3) });
  for (const [a, b, p] of SWEEPS) for (let t = a + p * .25; t < b; t += p / 2) ev.push({ t: +t.toFixed(3), type: 'sweep' });
  for (const l of LIGHTNING) ev.push({ t: l, type: 'thunder' });
  for (const k in T) ev.push({ t: T[k], type: 'beat', id: k });
  return ev.sort((a, b) => a.t - b.t);
}
