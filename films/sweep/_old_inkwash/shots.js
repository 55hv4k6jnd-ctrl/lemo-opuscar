// SWEEP — shots. Every shot paints ink into a layer set (wet / dry / col) in world px; comp.js turns it into rice paper.
// Figures are sampled on twos (12 fps); camera, blooms and ripples move on ones.
import { mk, draw, mass, blot } from './ink.js';
import { pine, reed, ripple } from './land.js';
import * as S from './sets.js';
import { imp, king, demon, child, tassel, broomHead, VERM } from './chars.js';
import { seal } from './seal.js';
import { subtitle } from './subs.js';
import { SHOTS, DUR as D, VO, T, shotAt, T0 } from './story.js';
import { clamp, lerp, mulberry } from '/core/lib.js';

export const DUR = D;
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const seg = (x, a, b) => clamp((x - a) / (b - a));
const tw = t => Math.floor(t * 12) / 12;                     // on twos
function cam(L, z, fx, fy) { L.xf(z, 960 - fx * z, 540 - fy * z); }
const scr = (z, fx, fy, p) => [960 + (p[0] - fx) * z, 540 + (p[1] - fy) * z];

// when the imp is sweeping: [t0, t1, period s]; the picture and the foley share it
export const SWEEPS = [[0, 12, 2.2], [13, 30, 2.0], [62, 85, 2.4], [90, 102, 3.2], [146, 157, 2.6], [293, 296, 2.4]];
const sweepAt = t => { for (const [a, b, p] of SWEEPS) if (t >= a && t < b) return { a: .45 + .55 * Math.sin((t - a) / p * Math.PI * 2), on: 1, ph: (t - a) / p }; return { a: .35, on: 0, ph: 0 }; };
const NIGHT = [.8, .79, .76], STORM = [.86, .85, .82], DAY = [.95, .925, .87];

// ---------------- shots ----------------
const SH = {};
SH.open = (L, t) => {           // in motion: the broom's stroke fills the frame, lifts, and the gate appears around the imp
  const k = ss(seg(t, 0, 6.2)), z = lerp(5.2, 1, k), fx = lerp(1480, 960, k), fy = lerp(930, 600, k);
  cam(L, z, fx, fy);
  gateWorld(L, t, { reveal: k });
  const sw = sweepAt(tw(t));
  imp(L, 1330, 845, 2.6, { t: tw(t), broom: sw.a, drag: sw.a > .5 ? .6 : 0 });
  sweptArc(L, 1330, 845, 2.6, t, 0);
  title(L, t);
  return { paperCol: DAY };
};
function gateWorld(L, t, o = {}) {
  S.blitRange(L, 'far', { peaks: [[300, 260, 260], [900, 330, 300], [1600, 280, 280]], base: 520, tone: .12, depth: 200, seed: 3 }, .8 * (o.reveal ?? 1));
  S.caveGate(L, 1060, 830, 1, t, { wind: o.wind ?? .4 });
  S.groundLine(L, 200, 1900, 850, 5);
}
function sweptArc(L, x, y, s, t, seed) {    // the broom leaves faint dry strokes on the ground as it sweeps
  const sw = sweepAt(tw(t)); if (!sw.on) return;
  for (let k = 0; k < 3; k++) { const age = (sw.ph - k * .5) % 3; if (age < 0) continue; const am = clamp(.5 - age * .16); if (am <= 0) continue;
    const cx = x + 120 * s + k * 14; draw(L.ink, mk([[cx - 80 * s, y + 4], [cx, y + 12], [cx + 80 * s, y + 6]], { w: 22 * s, tone: .4, prof: 'tip', dry: .82, seed: 500 + k + seed }), 1, am); }
}
function title(L, t) {             // "SWEEP" written in a vertical column in the empty paper, with the seal; fades as the story begins
  const a = seg(t, 6.5, 7.4) * (1 - seg(t, 10.6, 11.8)); if (a <= 0) return;
  const c = L.cd; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(1640, 170); c.rotate(Math.PI / 2);
  c.globalAlpha = .92 * a; c.fillStyle = '#000'; c.font = '600 96px CormorantSC'; c.letterSpacing = '30px'; c.fillText('SWEEP', 0, 0);
  c.font = 'italic 500 34px Cormorant'; c.letterSpacing = '4px'; c.globalAlpha = .7 * a; c.fillText('a tale from the mountain', 6, 70); c.restore();
  L.cc.save(); L.cc.setTransform(1, 0, 0, 1, 0, 0); seal(L.cc, 1590, 720, 70, .95 * a, 5); L.cc.restore();
}
SH.seasons = (L, t) => {        // locked frame: autumn leaves → winter snow → bones; the imp sweeps each away
  cam(L, 1.25, 1000, 680);
  gateWorld(L, t);
  const lt = t - T0.seasons, phase = lt < 6 ? 'leaf' : lt < 12 ? 'snow' : 'bone', pl = (lt % 6) / 6;
  if (phase === 'leaf') S.falling(L, 'leaf', t, 26, 3, 1 - pl * .8);
  if (phase === 'snow') S.falling(L, 'snow', t, 90, 5, 1);
  S.litter(L, phase === 'snow' ? 'leaf' : phase, 760, 1500, 840, 1 - ss(seg(pl, .45, 1)), lt < 6 ? 2 : 3, t);
  const sw = sweepAt(tw(t));
  imp(L, lerp(900, 1300, Math.sin(pl * Math.PI)), 845, 2.4, { t: tw(t), broom: sw.a, f: pl < .5 ? 1 : -1, squash: phase === 'snow' ? .96 : 1 });
  return { paperCol: phase === 'snow' ? [.97, .96, .93] : DAY };
};
const NAMES = [['Iron Tusk', 0], ['Seven Eyes', 1], ['Mister Fang', 2], ['Old Smoke', 3], ['Lady Thorn', 0], ['the Twins', 1], ['Grumble', 2], ['Long Neck', 3], ['Ash', 0], ['Hook', 2]];
SH.demons = (L, t) => {         // handscroll pan right → left along a line of demons, each with its name inscribed; the imp at the end, none
  const lt = t - T0.demons, x = lerp(300, 2950, ss(seg(lt, 0, 19)));
  cam(L, 1, x, 540);
  S.blitRange(L, 'line', { W: 3600, peaks: [[400, 200, 300], [1300, 260, 340], [2300, 220, 300], [3200, 240, 300]], base: 560, tone: .1, depth: 200, seed: 7 }, .8);
  S.groundLine(L, -200, 3600, 860, 9);
  NAMES.forEach(([nm, k], i) => {
    const dx = 400 + i * 260; demon(L, dx, 860, 2.4 + (i % 3) * .2, k, 0, { seed: i, f: -1 });
    const c = L.cd; c.save(); c.globalAlpha = .82; c.fillStyle = '#000'; c.font = 'italic 500 34px Cormorant'; c.fillText(nm, dx - 55, 600 - (i % 2) * 40); c.restore();
    L.cc.save(); L.cc.globalAlpha = .9; L.cc.fillStyle = `rgb(${VERM})`; L.cc.fillRect(dx - 75, 588 - (i % 2) * 40, 10, 10); L.cc.restore();
  });
  imp(L, 3080, 860, 2.4, { t: tw(t), broom: .3, f: -1, look: [-1, -1] });
  return { paperCol: DAY };
};
SH.king = (L, t) => {           // low angle: the King towers; push-in; the shout shakes the frame
  const lt = t - T0.king, z = lerp(1, 1.12, ss(seg(lt, 0, 12))), sh = Math.max(0, 1 - Math.abs(t - T.kingShout - .4) / .9);
  cam(L, z, 960 + Math.sin(t * 50) * 6 * sh, 560 + Math.cos(t * 43) * 5 * sh);
  S.blitRange(L, 'lowsky', { peaks: [[400, 120, 300], [1500, 150, 300]], base: 900, tone: .1, depth: 160, seed: 11 }, .7);
  king(L, 1000, 1180, 2.6, { t: tw(t), roar: clamp(sh * 1.4), arms: sh > .2 ? 'point' : 'down' });
  imp(L, 330, 1000, 2.2, { t: tw(t), broom: .2, look: [2, -2], squash: 1 - sh * .08 });
  return { paperCol: DAY, shake: [Math.sin(t * 61) * 4 * sh, Math.cos(t * 47) * 3 * sh] };
};
SH.days = (L, t) => {           // high wide: demons march down at dawn, back at dusk; the tiny imp sweeps at the gate
  cam(L, 1, 960, 540);
  const lt = t - T0.days, dusk = ss(seg(lt, 11, 15));
  S.blitRange(L, 'mtn', { peaks: [[700, 520, 360], [1400, 420, 300]], base: 980, tone: .24, depth: 420, seed: 13, cun: 1.2 }, .9);
  S.blitRange(L, 'farmtn', { peaks: [[200, 260, 260], [1700, 300, 280]], base: 600, tone: .1, depth: 220, seed: 14 }, .7);
  // the path zig-zagging down
  const path = [[1080, 330], [900, 440], [1150, 560], [860, 700], [1120, 840], [900, 1000]];
  draw(L.ink, mk(path, { w: 8, tone: .5, prof: 'even', dry: .75, seed: 600 }));
  mass(L.cw, [[1040, 330], [1120, 330], [1120, 290], [1040, 290]], .7, 2, 601, null);       // the cave mouth, tiny
  const march = (u, dir) => { for (let i = 0; i < 9; i++) { const v = clamp(u - i * .04); if (v <= 0 || v >= 1) continue; const q = dir > 0 ? v : 1 - v, k = q * (path.length - 1), j = Math.min(path.length - 2, Math.floor(k)), f = k - j, p = [lerp(path[j][0], path[j + 1][0], f), lerp(path[j][1], path[j + 1][1], f)]; demon(L, p[0], p[1], .28, i % 4, t * 2 + i, { f: path[j + 1][0] > path[j][0] ? 1 : -1 }); } };
  march(seg(lt, 0, 10), 1); march(seg(lt, 13, 23), -1);
  const sw = sweepAt(tw(t)); imp(L, 1150, 330, .45, { t: tw(t), broom: sw.a });
  return { paperCol: [lerp(.95, .84, dusk), lerp(.925, .82, dusk), lerp(.87, .78, dusk)] };
};
SH.pond = (L, t) => {           // night: he sweeps the moon's reflection off the pond; it rings back
  cam(L, 1, 960, 540);
  const lt = t - T0.pond;
  S.moon(L, 1460, 230, 64);
  S.blitRange(L, 'night', { peaks: [[300, 200, 300], [1200, 240, 320]], base: 560, tone: .14, depth: 220, seed: 15 }, .8);
  const brk = Math.max(0, Math.sin(seg(lt, 4, 10) * Math.PI)) * (lt < 10 ? 1 : 0) + Math.max(0, Math.sin(seg(lt, 11, 16) * Math.PI)) * .6;
  S.pond(L, 1020, 800, 520, 120, t, brk);
  const sw = sweepAt(tw(t)); imp(L, 760, 790, 2.1, { t: tw(t), broom: sw.on ? .9 + .35 * Math.sin(sw.ph * 6.28) : .4, drag: .5, look: [2, 1], blink: lt > 16 && lt < 16.3 ? 1 : 0, mouth: lt > 15, smile: 1 });
  return { paperCol: NIGHT, vig: .4 };
};
SH.bloom = (L, t) => {          // the summer of the great rain: dark clouds bloom, rain, thunder flashes
  cam(L, 1, 960, 540);
  const lt = t - T0.bloom;
  S.stormClouds(L, t, ss(seg(lt, 0, 5)));
  S.blitRange(L, 'mtn', { peaks: [[700, 520, 360], [1400, 420, 300]], base: 980, tone: .24, depth: 420, seed: 13, cun: 1.2 }, .9);
  S.rain(L, t, ss(seg(lt, 2, 8)));
  const fl = Math.max(0, 1 - Math.abs(t - T.thunder1) / .15) + Math.max(0, 1 - Math.abs(t - T.thunder1 - 6) / .12) * .7;
  return { paperCol: STORM, flash: fl * .6 };
};
SH.flee = (L, t) => {           // lateral tracking: the King and his demons run for it; the frame shakes
  const lt = t - T0.flee, x = lt * 300;
  L.xf(1, 0, 0);
  for (const k of [0, 1]) S.blitRange(L, 'run', { peaks: [[500, 240, 300], [1400, 280, 300]], base: 640, tone: .14, depth: 260, seed: 17 }, .8, k * 1920 - (x * .3) % 1920);
  L.xf(1, -x, 0); S.groundLine(L, x - 200, x + 2200, 900, 18 + Math.floor(x / 2000));
  for (let i = 0; i < 6; i++) { const gx = Math.floor(x / 700) * 700 + i * 700 - 700; draw(L.ink, mk([[gx, 905], [gx + 160, 910]], { w: 5, tone: .6, prof: 'tip', dry: .7, seed: 860 + Math.floor(gx / 700) % 50 })); }
  king(L, x + 1180 + Math.sin(lt * .7) * 60, 1010, 1.0, { t: tw(t), run: tw(t) * 2.4, arms: 'up', roar: .9, f: 1 });
  for (let i = 0; i < 9; i++) demon(L, x + 200 + i * 105 + Math.sin(i * 2 + lt) * 30, 940 + (i % 3) * 18, 1.25, i % 4, tw(t) * 3 + i * .3, { f: 1, seed: i });
  L.xf(1, 0, 0); S.rain(L, t, 1, 4, .35);
  return { paperCol: STORM, shake: [Math.sin(t * 37) * 5, Math.cos(t * 29) * 4] };
};
SH.alone = (L, t) => {          // the gate framing again (the rhyme begins): alone in the rain, still sweeping; then he hears it
  cam(L, 1.25, 1000, 680);
  gateWorld(L, t, { wind: 1.2 });
  const lt = t - T0.alone, sw = sweepAt(tw(t));
  imp(L, 1330, 845, 2.4, { t: tw(t), broom: sw.a, f: lt > 9 ? -1 : 1, look: lt > 9 ? [-2, -1] : [0, 0] });
  L.xf(1, 0, 0); S.rain(L, t, .9);
  return { paperCol: STORM };
};
SH.child = (L, t) => {          // medium, under the old pine: the lost child; "Are you a monster?" — "I… sweep."
  const lt = t - T0.child, z = lerp(1, 1.18, ss(seg(lt, 22, 40)));
  cam(L, z, 960, 620);
  pine(L.ink, 520, 920, 2.6, 21, t, 1.4, 1);
  S.groundLine(L, 0, 1920, 930, 22);
  const met = T.monster - T0.child;
  child(L, 820, 925, 5.2, { t: tw(t), cry: lt < met - 1 ? 1 : 0, arms: lt < met - 1 ? 'eyes' : 'hug', look: [1.5, 0] });
  const ix = lerp(1700, 1180, ss(seg(lt, 5, 13)));
  imp(L, ix, 925, 3.4, { t: tw(t), f: -1, broom: .15, step: lt > 5 && lt < 13 ? tw(t) * 1.6 : 0, look: [-1, 0], arms: lt > met + 4 ? 'broom' : 'broom', tilt: lt > met + 3 && lt < met + 7 ? -.12 : 0, mouth: lt > met + 4.5 && lt < met + 7 });
  L.xf(1, 0, 0); S.rain(L, t, .55);
  return { paperCol: STORM };
};
SH.path = (L, t) => {           // high wide: the path down the mountain gone under mud and broken trees; water rising
  cam(L, 1, 960, 540);
  const lt = t - T0.path;
  S.stormClouds(L, t, 1, 8);
  S.blitRange(L, 'mtn', { peaks: [[700, 520, 360], [1400, 420, 300]], base: 980, tone: .24, depth: 420, seed: 13, cun: 1.2 }, .9);
  mudmass(L, 1, t);
  const wl = 1010 - ss(seg(lt, 0, 15)) * 70;
  for (let i = 0; i < 6; i++) draw(L.ink, mk([[0, wl + i * 14], [1920, wl + i * 14 + Math.sin(t + i) * 4]], { w: 3, tone: .55 - i * .06, prof: 'tip', dry: .6, seed: 700 + i }));
  imp(L, 1150, 330, .9, { t: tw(t), broom: .3 }); child(L, 1100, 330, 1.0, { t: tw(t), arms: 'hug' });
  L.xf(1, 0, 0); S.rain(L, t, 1);
  return { paperCol: STORM };
};
function mudmass(L, k, t, cut = 0) {   // dark wet mud across the slope; cut (0..1) = how much of the swept path is cleared
  const R = mulberry(33);
  for (let i = 0; i < 9; i++) { const y = 380 + i * 70, x = 700 + R() * 500, w = 260 + R() * 260;
    for (let j = 0; j < 6; j++) blot(L.cw, x + (R() - .5) * w, y + (R() - .5) * 30, 50 + R() * 70, (.18 + R() * .14) * k, R() * .4 - .2, .35 + R() * .2, 340 + i * 9 + j);
    draw(L.ink, mk([[x - w * .45, y + 10], [x, y + (R() - .5) * 20], [x + w * .45, y + 6]], { w: 26, tone: .7 * k, darkDir: [0, 1], side: .7, brWet: true, body: .3, dry: .6, wet: .8, prof: 'brush', seed: 360 + i }), 1, .8); }
  for (let i = 0; i < 6; i++) { const x = 760 + R() * 420, y = 420 + R() * 500; draw(L.ink, mk([[x - 50, y], [x + 50, y - 20 + R() * 40]], { w: 7, tone: .9, prof: 'nail', dry: .4, seed: 720 + i })); }   // broken trees
  if (cut > 0) for (const c of [L.cw, L.cd]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.lineCap = 'round'; c.lineWidth = 130; c.globalAlpha = cut; c.beginPath(); c.moveTo(1130, 330); c.bezierCurveTo(700, 520, 1300, 700, 880, 1080); c.stroke(); c.restore(); }
}
SH.silence = (L, t) => {        // hard cut, extreme close-up: the bristles and his grip; stillness, a slow push-in
  const lt = t - T0.silence, z = lerp(1, 1.06, ss(seg(lt, 0, 7)));
  cam(L, z, 960, 540);
  const g = [760, 420], dir = [.5, .86];
  draw(L.ink, mk([[g[0] - dir[0] * 700, g[1] - dir[1] * 700], g, [g[0] + dir[0] * 360, g[1] + dir[1] * 360]], { w: 40, tone: .92, prof: 'even', dry: .35, wet: .1, seed: 40 }));
  broomHead(L.ink, [g[0] + dir[0] * 360, g[1] + dir[1] * 360], dir, 14, 0, 1, 1);
  const grip = lt > T.grip - T0.silence ? 1 : 0;
  for (let i = 0; i < 4; i++) draw(L.ink, mk([[g[0] - 70 + i * 6, g[1] - 60 + i * 34 - grip * 6], [g[0] + 70, g[1] - 40 + i * 34]], { w: 20, tone: .78, prof: 'tip', dry: .35, wet: .4, seed: 760 + i }));   // little fingers
  tassel(L, [g[0] - dir[0] * 520, g[1] - dir[1] * 520], 9, 0, 1);
  return { paperCol: STORM, vig: .45 };
};
SH.sweep = (L, t) => {          // the great sweep: one flying-white stroke crosses the whole frame; the mud parts; a path of paper
  cam(L, 1, 960, 540);
  const lt = t - T0.sweep, p = ss(seg(t, T.sweep, T.sweepEnd)), after = seg(t, T.sweepEnd, T.sweepEnd + 4);
  S.stormClouds(L, t, 1 - after * .7, 8);
  S.blitRange(L, 'mtn', { peaks: [[700, 520, 360], [1400, 420, 300]], base: 980, tone: .24, depth: 420, seed: 13, cun: 1.2 }, .9);
  mudmass(L, 1, t, ss(seg(t, T.sweepEnd - .1, T.sweepEnd + 1.2)));
  // the stroke itself (flying white): starts at the cave, sweeps down the mountain
  draw(L.ink, mk([[1180, 280, .9], [760, 520, 1.1], [1320, 720, 1], [820, 1100, .7]], { w: 170, tone: .9, prof: 'brush', dry: .82, wet: .15, nb: 48, seed: 800 }), p, 1 - after * .55);
  if (p > 0 && p < 1) { const s = mk([[1180, 280], [760, 520], [1320, 720], [820, 1100]], { w: 10, tone: 0, seed: 801 }); }
  imp(L, 1180, 300, .9, { t: tw(t), broom: p > 0 && p < 1 ? 1.4 : .5, drag: 1 }); child(L, 1120, 300, 1.0, { t: tw(t), arms: 'hug' });
  L.xf(1, 0, 0); S.rain(L, t, 1 - ss(after * 1.5));
  return { paperCol: [lerp(.86, .95, after), lerp(.85, .925, after), lerp(.82, .87, after)], shake: p > 0 && p < 1 ? [Math.sin(t * 80) * 6, Math.cos(t * 70) * 4] : [0, 0] };
};
SH.dawn = (L, t) => {           // handscroll pan, dawn: down the cleared path; the village waits with lanterns
  const lt = t - T0.dawn, x = lerp(500, 2400, ss(seg(lt, 0, 22)));
  cam(L, 1, x, 540);
  S.blitRange(L, 'dawnm', { W: 3200, peaks: [[300, 420, 360], [1300, 260, 340], [2600, 160, 300]], base: 900, tone: .14, depth: 300, seed: 19, cun: .6 }, .85);
  draw(L.ink, mk([[200, 420], [800, 640], [1500, 760], [2300, 860], [3000, 900]], { w: 26, tone: .3, prof: 'even', dry: .8, seed: 820 }));
  S.village(L, 2300, 900, 1, t);
  for (let i = 0; i < 6; i++) S.villager(L, 2350 + i * 90, 905, 1.6, 900 + i * 5, t);
  const u = ss(seg(lt, 2, 20)), px = lerp(500, 2150, u), py = lerp(560, 880, u);
  imp(L, px, py, 1.3, { t: tw(t), broom: .2, step: tw(t) * 1.6 }); child(L, px - 60, py, 1.4, { t: tw(t), step: tw(t) * 1.6 });
  return { paperCol: DAY };
};
SH.name = (L, t) => {           // medium two-shot at the village: "What's your name?" … "I'll call you Sweep."
  const lt = t - T0.name, z = lerp(1, 1.12, ss(seg(t, T.name - 4, T.name + 2)));
  cam(L, z, 960, 600);
  S.village(L, 300, 760, .9, t, 1);
  for (let i = 0; i < 5; i++) S.villager(L, 300 + i * 120, 770, 2.2, 950 + i * 5, t);
  S.groundLine(L, 0, 1920, 930, 23);
  const named = t > T.name + 1.2;
  child(L, 820, 925, 5.4, { t: tw(t), arms: t > T.name - 6 && t < T.name + 3 ? 'hold' : 'down', look: [1.5, -1] });
  imp(L, 1180, 925, 3.6, { t: tw(t), f: -1, broom: .15, look: [-1, named ? -1 : 1], tilt: named ? .06 : -.08, mouth: named, smile: named ? 1 : 0, squash: named ? 1.03 : 1 });
  return { paperCol: DAY };
};
SH.back = (L, t) => {           // the gate framing returns: the King is back. "Broom thing!" — "Sweep, sir."
  cam(L, 1.25, 1000, 680);
  gateWorld(L, t);
  const lt = t - T0.back, sh = Math.max(0, 1 - Math.abs(t - T.kingBack - .3) / .8);
  king(L, 1480, 880, .8, { t: tw(t), roar: sh, arms: sh > .2 ? 'point' : 'down', f: -1 });
  const sw = sweepAt(tw(t));
  imp(L, 760, 845, 2.4, { t: tw(t), broom: sw.a, f: 1, look: [2, -2], tilt: lt > 7 ? -.06 : 0, mouth: lt > 7.3 && lt < 10, smile: .6 });
  return { paperCol: DAY, shake: [Math.sin(t * 61) * 4 * sh, Math.cos(t * 47) * 3 * sh] };
};
// "Sweep" in a cursive hand (centre lines, written with the broom)
const NAME = [
  [[70, 40], [30, 26], [12, 56], [52, 92], [86, 128], [62, 166], [16, 152]],
  [[110, 92], [124, 152], [146, 102], [166, 152], [186, 92], [200, 128], [232, 118], [226, 98], [204, 104], [200, 136], [228, 152], [256, 128], [290, 118], [284, 98], [262, 104], [258, 136], [286, 152], [316, 132]],
  [[332, 96], [330, 210]], [[330, 112], [358, 94], [376, 116], [360, 142], [332, 136]],
];
SH.sign = (L, t) => {           // he signs his name with the broom; the vermilion seal lands; pull back: far below, someone waves
  const lt = t - T0.sign, pull = ss(seg(t, T.seal + .6, T.end - 1.5)), z = lerp(1, .55, pull);
  cam(L, z, lerp(960, 980, pull), lerp(470, 560, pull));
  const p = seg(t, T.sign0, T.sign1), ox = 560, oy = 260, k = 2.6;
  const strokes = NAME.map((s, i) => mk(s.map(([x, y]) => [ox + x * k, oy + y * k]), { w: 22, tone: .92, prof: i === 2 ? 'nail' : 'brush', dry: .45, wet: .3, seed: 840 + i }));
  const tot = strokes.reduce((a, s) => a + s.len, 0); let acc = 0, tip = null;
  for (const s of strokes) { const q = clamp((p * tot - acc) / s.len); draw(L.ink, s, q); if (q > 0 && q < 1) { const j = Math.floor(q * (s.n - 1)); tip = s.P[j]; } acc += s.len; }
  if (tip) { broomHead(L.ink, tip, [.5, .86], 2.2, .4, 1, 1); draw(L.ink, mk([[tip[0] - 120, tip[1] - 210], [tip[0] - 4, tip[1] - 6]], { w: 6, tone: .92, prof: 'even', dry: .3, seed: 870 }), 1); tassel(L, [tip[0] - 120, tip[1] - 210], 2.2, t, 1); }
  else if (t > T.sign1) imp(L, ox + 1060, oy + 560, 2.2, { t: tw(t), broom: .3, f: -1, look: [-2, -2], mouth: 1, smile: 1 });
  if (t > T.seal) { const a = ss(seg(t, T.seal, T.seal + .15)); L.cc.save(); seal(L.cc, ox + 1000, oy + 120, 110 * (1 + (1 - a) * .15), .95 * a, 5); L.cc.restore(); }
  // far below (seen as the camera pulls back): the mountain, the village, one tiny figure waving
  if (pull > 0) { S.blitRange(L, 'farbelow', { W: 3600, H: 2200, peaks: [[1800, 700, 900]], base: 1900, tone: .12, depth: 600, seed: 23 }, pull * .8, -800, -400); child(L, 1500, 1460, 1.2, { t: tw(t), arms: 'wave' }); S.village(L, 1200, 1480, .5, t); }
  return { paperCol: DAY, fade: ss(seg(t, T.end - 1.2, T.end)) };
};

// ---------------- dispatcher: shots, ink-bloom transitions, subtitles ----------------
const TRANS = { seasons: 'cut', demons: 'bloom', king: 'bloom', days: 'bloom', pond: 'bloom', bloom: 'bloom', flee: 'bloom', alone: 'bloom', child: 'bloom', path: 'bloom', silence: 'cut', sweep: 'cut', dawn: 'bloom', name: 'bloom', back: 'bloom', sign: 'bloom' };
const TR = 1.3;
export async function init() {}
export function frame(t, A, B) {
  const sh = shotAt(t), id = sh.id;
  const lt = t - sh.t0, i = SHOTS.findIndex(s => s[0] === id);
  let o;
  if (i > 0 && TRANS[id] === 'bloom' && lt < TR) {
    const prev = SHOTS[i - 1][0];
    const oa = SH[prev](A, t) || {}; const ob = SH[id](B, t) || {};
    o = { ...oa, paperCol: ob.paperCol || oa.paperCol, trans: [960, 560, ss(lt / TR) * 2600, 1] };
  } else o = SH[id](A, t) || {};
  // inscriptions (subtitles): placed in the shot's empty paper
  for (const v of VO) {
    const [a, b] = v.sub; if (t < a || t > b) continue;
    const k = Math.min(clamp((t - a) / .35), clamp((b - t) / .4));
    const [x, y] = subPos(shotAt(t).id);
    subtitle(o.trans ? B : A, v.text, x, y, k, { size: 44 });
  }
  return o;
}
const SUBPOS = { open: [120, 160], seasons: [120, 150], demons: [120, 1000], king: [1200, 140], days: [120, 140], pond: [120, 150], bloom: [120, 980], flee: [120, 140], alone: [120, 150], child: [1000, 150], path: [120, 150], silence: [1100, 950], sweep: [120, 150], dawn: [120, 150], name: [1080, 160], back: [120, 150], sign: [120, 990] };
export const subPos = id => SUBPOS[id] || [120, 150];
// on-screen text for the reading-time check: the inscriptions + the title
export function texts(t) {
  const out = []; for (const v of VO) { const [a, b] = v.sub; if (t >= a + .35 && t <= b - .4) { const [x, y] = subPos(shotAt(t).id); out.push({ id: 'vo' + v.id, text: v.text, x0: x, y0: y - 40, x1: Math.min(1900, x + v.text.length * 20), y1: y + 10 }); } }
  return out;
}
export function events() {
  const ev = [];
  for (const [id, t0] of SHOTS) ev.push({ t: t0, type: 'shot', id, trans: TRANS[id] || 'none' });
  for (const v of VO) ev.push({ t: v.t0, type: 'vo', id: v.id, role: v.role, dur: +(v.t1 - v.t0).toFixed(3) });
  for (const [a, b, p] of SWEEPS) for (let t = a + p * .25; t < b; t += p / 2) ev.push({ t: +t.toFixed(3), type: 'sweep' });
  for (const k in T) ev.push({ t: T[k], type: 'beat', id: k });
  return ev.sort((a, b) => a.t - b.t);
}
