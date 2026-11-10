// SIT MEN — shots + timeline (single source of truth for picture and sound). World px per shot; figures on twos.
import { mk, draw, mass, blot } from './ink.js';
import * as S from './sets.js';
import { sitmen, dead, deadFace, POSE, poseAt, walkCycle, mix, VERM } from './hero.js';
import { seal } from './seal.js';
import { subtitle } from './subs.js';
import { clamp, lerp, mulberry } from '/core/lib.js';

export const SHOTS = [['open', 0], ['bell', 12], ['bamboo', 24], ['crows', 50], ['door', 62], ['scare', 78], ['fight', 80], ['reveal', 104], ['climb', 112], ['break', 130], ['eyes', 140], ['stroke', 150], ['dawn', 158], ['bow', 168], ['shadow', 176]];
export const DUR = 183;
export const T = { drop: .4, toll1: 2.5, toll2: 5, toll3: 7.5, title: 8, windStop: 20, rustle: 32.5, fox: 34, ghost: 38, ghostGone: 44.5, crowsTurn: 58.5, creak: 70, scare: 78, hit1: 82, hit2: 84, hit3: 86.2, hit4: 88.5, hit5: 91, hit6: 93.2, handbell: 96, gtoll1: 125.5, gtoll2: 127, gtoll3: 128.5, step: 132.5, silence: 138, drip: 146, rise: 150.4, stroke: 151.6, strokeEnd: 151.9, dawn: 158, shadowTurn: 179.2, black: 180.6, endToll1: 180.9, endToll2: 181.6, endToll3: 182.3 };
export const INSCR = [[13.5, 19.5, 'The dead fear the bell.'], [170, 175.5, 'Some of them listen.']];
const shotAt = t => { let s = SHOTS[0], i = 0; SHOTS.forEach((x, k) => { if (t >= x[1]) { s = x; i = k; } }); return { id: s[0], t0: s[1], t1: i + 1 < SHOTS.length ? SHOTS[i + 1][1] : DUR }; };
const T0 = Object.fromEntries(SHOTS);
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };
const eo = x => 1 - Math.pow(1 - clamp(x), 3);
const seg = (x, a, b) => clamp((x - a) / (b - a));
const tw = t => Math.floor(t * 12) / 12;
function cam(L, z, fx, fy) { L.xf(z, 960 - fx * z, 540 - fy * z); }
const DAY = [.95, .925, .87], NIGHT = [.62, .62, .64], DUSK = [.86, .84, .8];
// darkness with a hole of light (the lantern): a wet wash over the frame, cut away in a soft circle
function dark(L, a, holes = []) {
  const c = L.cw; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = `rgba(0,0,0,${a})`; c.fillRect(0, 0, 1920, 1080);
  c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.globalAlpha = 1;
  for (const [x, y, r] of holes) { const g = c.createRadialGradient(x, y, r * .35, x, y, r); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  c.restore();
}
const scr = (z, fx, fy, p) => [960 + (p[0] - fx) * z, 540 + (p[1] - fy) * z];

const SH = {};
SH.open = (L, t) => {             // an ink drop blooms into the red dot; pull back: Sit Men meditating on a needle peak above a sea of mist
  const k = ss(seg(t, 2.2, 10.5)), z = Math.exp(lerp(Math.log(16), Math.log(1), k));
  const head = [964, 632 - 60 * 1.3 + 6], dot = [head[0] + 4.5 * 1.3, head[1] - 1.1 * 1.3];
  cam(L, z, lerp(dot[0], 960, k), lerp(dot[1], 560, k));
  S.range(L, 'far1', { peaks: [[300, 330, 220], [1500, 380, 260], [1800, 300, 200]], base: 760, tone: .1, depth: 260, seed: 3 }, .9);
  S.needle(L, 960, 640, 520, 260, 4);
  S.mist(L, 780, t, 1.2, 5);
  sitmen(L, POSE.sit, 960, 640, 1.3, { t: tw(t), wind: .5 });
  if (t < 2.2) { const r = 6 + 70 * eo(seg(t, T.drop, 2)); L.cc.save(); L.cc.setTransform(1, 0, 0, 1, 0, 0); L.cc.fillStyle = `rgba(${VERM.join(',')},.95)`; L.cc.beginPath(); L.cc.arc(960, 540, r, 0, 7); L.cc.fill(); L.cc.restore(); L.cw.save(); L.cw.setTransform(1, 0, 0, 1, 0, 0); L.cw.fillStyle = 'rgba(255,255,255,0)'; L.cw.restore(); }
  title(L, t);
  return { paperCol: DAY };
};
function title(L, t) {
  const a = seg(t, T.title, T.title + 1) * (1 - seg(t, 11, 12)); if (a <= 0) return;
  const c = L.cd; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(1600, 190); c.rotate(Math.PI / 2);
  c.globalAlpha = .92 * a; c.fillStyle = '#000'; c.font = '600 104px CormorantSC'; c.letterSpacing = '34px'; c.fillText('SIT MEN', 0, 0); c.restore();
  L.cc.save(); L.cc.setTransform(1, 0, 0, 1, 0, 0); seal(L.cc, 1536, 830, 70, .95 * a, 7); L.cc.restore();
}
SH.bell = (L, t) => {             // handscroll pan along the ridge: the great bell in its pavilion; far below, the village; the wind stops
  const lt = t - T0.bell, x = lerp(700, 1500, ss(seg(lt, 0, 12)));
  cam(L, 1, x, 540);
  S.range(L, 'ridge', { W: 2600, peaks: [[400, 260, 300], [1300, 340, 380], [2200, 260, 300]], base: 900, tone: .2, depth: 420, seed: 8, cun: 1.1 }, .95);
  S.pavilion(L, 1250, 690, .9, Math.sin(t * .8) * .02, t);
  S.houses(L, 1900, 1030, .35, 21);
  S.pine(L.ink, 620, 720, 1.4, 9, t, lt < 8 ? .7 : 0, 1);
  if (lt < 8) S.mist(L, 950, t, 1, 6);
  sitmen(L, POSE.stand, 1060, 690, 1.25, { t: tw(t), wind: lt < 8 ? .6 : 0, f: 1 });
  return { paperCol: DAY };
};
SH.bamboo = (L, t) => {           // night in the bamboo, seen only in the lantern's circle; a fox (false alarm); a figure that isn't there twice
  const lt = t - T0.bamboo, x = lt * 90;
  cam(L, 1, 960 + x, 540);
  S.bamboo(L, -400 + x * .4, 3400, 1000, 900, 31, .5, -x * .6 + x);        // far layer (parallax)
  const ghost = t > T.ghost && t < T.ghost + 3.4;
  if (ghost) dead(L, 1500 + x * .4 + 300, 960, 1.6, 0, { f: -1, k: 2 });     // the figure standing between the stalks (no music cue)
  S.bamboo(L, -400 + x, 3800, 1040, 1000, 33, .85);
  const fox = seg(t, T.fox, T.fox + 1.2); if (fox > 0 && fox < 1) { const fx = lerp(1300, 200, fox) + x, fy = 1000; mass(L.cw, [[fx - 40, fy], [fx - 20, fy - 34], [fx + 30, fy - 30], [fx + 50, fy - 10], [fx + 20, fy]], .7, 2, 61, null); draw(L.ink, mk([[fx + 40, fy - 20], [fx + 90, fy - 40]], { w: 14, tone: .7, prof: 'lens', dry: .4, wet: .5, seed: 62 })); }
  const ph = tw(t) * .9, look = t > T.rustle && t < T.fox + 1.5;
  const pose = look ? POSE.guard : walkCycle(ph);
  const px = 860 + x;
  sitmen(L, pose, px, 1000, 2.6, { t: tw(t), wind: .2, f: look ? -1 : 1 });
  // the lantern on the staff tip: a pale paper globe; the darkness has a hole around it
  const lp = [px + (look ? -30 : 30) * 2.6, 1000 - 108 * 2.6];
  draw(L.ink, mk([[lp[0] - 18, lp[1]], [lp[0], lp[1] - 24], [lp[0] + 18, lp[1]], [lp[0], lp[1] + 26], [lp[0] - 18, lp[1]]], { w: 3, tone: .8, prof: 'even', dry: .3, seed: 63 }));
  const sl = scr(1, 960 + x, 540, lp);
  dark(L, .78, [[sl[0], sl[1] + 120, 520 + Math.sin(t * 7) * 12]]);
  return { paperCol: NIGHT, vig: .55 };
};
SH.crows = (L, t) => {            // low angle at the village gate: crows on every branch, none of them moving — then all turn at once
  const lt = t - T0.crows, z = lerp(1, 1.08, ss(seg(lt, 0, 12)));
  cam(L, z, 960, 560);
  S.range(L, 'vil', { peaks: [[500, 200, 300], [1400, 240, 300]], base: 860, tone: .14, depth: 220, seed: 12 }, .8);
  for (const sg of [-1, 1]) draw(L.ink, mk([[960 + sg * 420, 1100], [960 + sg * 420, 360]], { w: 34, tone: .88, prof: 'even', dry: .45, wet: .3, seed: 70 + sg }));
  draw(L.ink, mk([[440, 380], [960, 350], [1480, 380]], { w: 46, tone: .92, prof: 'press', dry: .5, wet: .5, brWet: true, body: .5, seed: 72 }));
  S.crows(L, 300, 240, 9, 1.3, 13, t > T.crowsTurn ? 1 : 0); S.crows(L, 1100, 560, 6, 1, 14, t > T.crowsTurn + .15 ? 1 : 0);
  sitmen(L, POSE.stand, 960, 1040, 3.2, { t: tw(t), wind: 0, f: 1 });
  return { paperCol: DUSK, vig: .45 };
};
SH.door = (L, t) => {             // a slow push-in on a dark doorway; the door creaks open by itself… held
  const lt = t - T0.door, z = lerp(1, 1.9, ss(seg(lt, 0, 16)));
  cam(L, z, 1000, 520);
  S.doorway(L, 1000, 520, 240, 420, ss(seg(t, T.creak, T.creak + 6)) * .9);
  sitmen(L, POSE.guard, 520, 1000, 3.6, { t: tw(t), wind: 0, f: 1 });
  return { paperCol: DUSK, vig: .55 };
};
SH.scare = (L, t) => {            // JUMP SCARE: a dead face bursts out of the dark to fill the frame
  const lt = t - T0.scare, k = eo(seg(lt, .08, .35));
  cam(L, 1, 960, 540);
  deadFace(L, 960 + Math.sin(t * 80) * 10, 560, lerp(300, 640, k), 1);
  return { paperCol: DUSK, flash: lt < .09 ? .9 : 0, shake: [Math.sin(t * 90) * 14 * (1 - lt / 2), Math.cos(t * 77) * 10 * (1 - lt / 2)] };
};
// the street fight: who is where, who has been hit (by time)
const FOES = [{ x: 1320, hit: T.hit1 }, { x: 640, hit: T.hit2 }, { x: 1480, hit: T.hit3 }, { x: 520, hit: T.hit4 }, { x: 1380, hit: T.hit5 }, { x: 600, hit: T.hit6 }, { x: 1560, hit: 1e9 }, { x: 420, hit: 1e9 }, { x: 1680, hit: 1e9 }];
SH.fight = (L, t) => {            // wide → punch-ins on every hit; staff sweeps; the dead split into ink; the hand bell freezes the rest
  const lt = t - T0.fight;
  const hits = [T.hit1, T.hit2, T.hit3, T.hit4, T.hit5, T.hit6];
  let punch = 0; for (const h of hits) punch = Math.max(punch, Math.exp(-Math.pow((t - h - .05) / .22, 2)));
  const frozen = t > T.handbell;
  const z = lerp(1, 1.32, punch) * lerp(1, 1.15, ss(seg(t, T.handbell, T.handbell + 3)));
  cam(L, z, 960, 700);
  S.houses(L, 260, 860, .9, 22);
  draw(L.ink, mk([[0, 1000], [1920, 1010]], { w: 4, tone: .5, prof: 'tip', dry: .7, seed: 80 }));
  // the dead close in from both sides, one by one
  FOES.forEach((F, i) => {
    const appear = T0.fight + i * 1.3, gone = F.hit;
    if (t < appear) return;
    const dir = F.x > 960 ? -1 : 1, near = clamp((t - appear) / 6), xx = lerp(F.x, 960 - dir * 150, near * .5);
    if (t < gone) dead(L, xx, 1000, 2.2, frozen ? .1 + Math.sin(t * 30) * .02 : tw(t) * .7 + i * .3, { f: dir, k: i });
    else { const u = seg(t, gone, gone + 1.4); if (u < 1) { const R = mulberry(i + 90); for (let k = 0; k < 14; k++) { const a = R() * 6.28, d = 40 + u * 260 * R(); blot(L.cw, xx + Math.cos(a) * d, 900 + Math.sin(a) * d * .6 + u * u * 120, (14 + R() * 20) * (1 - u * .6), .8 * (1 - u), R() * 3, .6, i * 20 + k); }
      mass(L.cw, [[xx - 30, 1000], [xx - 40, 930 - u * 60], [xx + 10, 880 - u * 120], [xx + 40, 940], [xx + 30, 1000]], .5 * (1 - u), 6, i + 95, null); } }
  });
  // Sit Men's choreography (keyed poses; the staff strokes are flying white)
  const keys = [[80, 'guard'], [81.3, 'windup'], [82, 'strike'], [83, 'guard'], [83.6, 'crouch'], [84, 'kick'], [85, 'guard'], [85.7, 'windup'], [86.2, 'strike'], [87.5, 'guard'], [88, 'windup'], [88.5, 'strike'], [89.6, 'guard'], [90.5, 'crouch'], [91, 'kick'], [92, 'guard'], [92.7, 'windup'], [93.2, 'strike'], [94.5, 'guard'], [95.6, 'stand'], [96, 'ring'], [99, 'ring'], [100.5, 'guard']];
  const face = t < T.hit2 - .4 ? 1 : t < T.hit3 - .4 ? -1 : t < T.hit4 - .4 ? 1 : t < T.hit5 - .4 ? -1 : t < T.hit6 - .4 ? 1 : -1;
  const pose = poseAt(tw(t), keys);
  sitmen(L, pose, 960, 1000, 2.6, { t: tw(t), wind: .8, f: face });
  for (const h of hits) { const u = seg(t, h - .08, h + .12); if (u > 0 && u < 1.0 || (t > h && t < h + .8)) { const sd = Math.round(h * 10), dirX = (h === T.hit1 || h === T.hit3 || h === T.hit5) ? 1 : -1;
    draw(L.ink, mk([[960 - dirX * 60, 860], [960 + dirX * 160, 800], [960 + dirX * 420, 880]], { w: 90, tone: .8, prof: 'brush', dry: .8, wet: .15, nb: 40, seed: sd }), clamp(u * 1.3), 1 - seg(t, h + .2, h + .8)); } }
  if (frozen) { const r = (t - T.handbell) * 600; for (let k = 0; k < 3; k++) S.ripple(L.ink, 960, 740, (r + k * 160) % 1400, .4 * (1 - ((r + k * 160) % 1400) / 1400), 90 + k, .4, 3); }
  return { paperCol: DUSK, shake: punch > .5 ? [Math.sin(t * 70) * 8 * punch, Math.cos(t * 60) * 6 * punch] : [0, 0] };
};
SH.reveal = (L, t) => {           // crane up / pull back: the whole valley floor is walking toward the mountain
  const lt = t - T0.reveal, k = ss(seg(lt, 0, 6.5)), z = lerp(1.8, .5, k);
  cam(L, z, lerp(960, 960, k), lerp(820, 300, k));
  S.range(L, 'valley', { W: 3840, H: 2160, peaks: [[700, 900, 500], [3200, 1000, 600]], base: 1300, tone: .16, depth: 600, seed: 15 }, .9, -960, -540);
  S.houses(L, 260, 860, .9, 22);
  for (let r = 0; r < 9; r++) S.tide(L, -960, 2880, 1040 + r * 115 - lt * 25, 150, t + r, 40 + r, .95 - r * .06);
  sitmen(L, POSE.guard, 960, 1000, 2.6, { t: tw(t), wind: .4, f: -1 });
  return { paperCol: DUSK };
};
SH.climb = (L, t) => {            // tracking up the stair as the tide climbs behind; he strikes the great bell three times — it halts
  const lt = t - T0.climb, run = t < 123.6, u = ss(seg(lt, 0, 11.6));
  const px = lerp(500, 1250, u), py = lerp(1500, 690, u);
  cam(L, lerp(1.4, 1, ss(seg(lt, 9, 12))), run ? px + 120 : lerp(px + 120, 1150, ss(seg(lt, 11.6, 13))), run ? py - 160 : lerp(py - 160, 520, ss(seg(lt, 11.6, 13))));
  S.range(L, 'ridgeC', { W: 2600, H: 2000, peaks: [[1300, 900, 500]], base: 1900, tone: .2, depth: 900, seed: 18, cun: .8 }, .95, -100, -300);
  for (let k = 0; k < 34; k++) { const u = k / 33, sx = lerp(470, 1230, u), sy = lerp(1520, 700, u); draw(L.ink, mk([[sx - 70 * (1 - u * .4), sy + 6], [sx + 70 * (1 - u * .4), sy]], { w: 4, tone: .7, prof: 'tip', dry: .5, seed: 900 + k })); }
  S.pavilion(L, 1250, 690, .9, (t > T.gtoll1 ? Math.sin((t - T.gtoll1) * 3) * .15 * Math.exp(-(t - T.gtoll1) * .3) : 0), t);
  const tideY = run ? py + 330 - Math.sin(lt * 1.3) * 30 : lerp(1020, 900, ss(seg(lt, 11.6, 13.5)));
  S.tide(L, -200, 2400, tideY, 700, t, 51, .95);
  const pose = run ? walkCycle(tw(t) * 1.5, true) : poseAt(tw(t), [[123.6, 'stand'], [125, 'windup'], [125.5, 'strike'], [126.4, 'windup'], [127, 'strike'], [127.9, 'windup'], [128.5, 'strike'], [129.5, 'guard']]);
  sitmen(L, pose, run ? px : 1060, run ? py : 690, 1.6, { t: tw(t), wind: run ? 1 : .3, f: 1 });
  for (const g of [T.gtoll1, T.gtoll2, T.gtoll3]) if (t > g && t < g + 3) S.ripple(L.ink, 1250, 560, (t - g) * 500, .5 * (1 - (t - g) / 3), Math.round(g), .5, 4);
  return { paperCol: DUSK };
};
SH.break = (L, t) => {            // low angle at the pavilion's edge: one dead foot steps through the sound; then all of them
  const lt = t - T0.break, z = lerp(1, 1.18, ss(seg(lt, 0, 10)));
  cam(L, z, 960, 600);
  S.pavilion(L, 1400, 700, 1.1, 0, t);
  sitmen(L, POSE.guard, 1100, 700, 2.4, { t: tw(t), wind: .2, f: -1 });
  draw(L.ink, mk([[0, 720], [1920, 700]], { w: 6, tone: .7, prof: 'tip', dry: .6, seed: 110 }));
  const go = seg(t, T.step + .6, T0.break + 8);
  S.tide(L, -200, 2200, lerp(1150, 760, ss(go)), 600, t, 52, 1);
  if (t > T.step - .2) { const k = seg(t, T.step - .2, T.step + .5); dead(L, lerp(260, 420, k), 740, 3, k, { f: 1, k: 4 }); }
  return { paperCol: lerp(1, 0, 0) ? DUSK : [.8, .78, .76], vig: .5 };
};
SH.eyes = (L, t) => {             // extreme close-up: his eyes close; he sits. True silence — one drip.
  const lt = t - T0.eyes, z = lerp(1, 1.08, ss(seg(lt, 0, 10)));
  cam(L, z, 960, 560);
  const s = 34, x = 900, y = 560 + 92 * s - 40;
  sitmen(L, POSE.stand, x, y, s, { t: tw(t), wind: .1, noStaff: true });
  // closed eyes: two short burnt strokes, then held
  const hc = [x + 2 * s, y - 92 * s];
  for (const ex of [-1.5, 4.5]) draw(L.ink, mk([[hc[0] + (ex - 1.6) * s, hc[1] + 2 * s], [hc[0] + ex * s, hc[1] + (lt > 2 ? 2.6 : 1.6) * s], [hc[0] + (ex + 1.6) * s, hc[1] + 2 * s]], { w: .9 * s, tone: .95, prof: 'tip', dry: .3, seed: 120 + ex }));
  if (t > T.drip && t < T.drip + 1.6) { const k = seg(t, T.drip, T.drip + 1.6); S.ripple(L.ink, 960, 1000, 40 + k * 500, .5 * (1 - k), 130, .25, 4); }
  return { paperCol: [.84, .82, .78], vig: .6 };
};
SH.stroke = (L, t) => {           // he rises; one flying-white stroke of the staff crosses the whole frame; the tide splits into ink
  const lt = t - T0.stroke, p = ss(seg(t, T.stroke, T.strokeEnd)), after = seg(t, T.strokeEnd, T.strokeEnd + 4);
  cam(L, lerp(1.25, 1, ss(seg(lt, 0, 1.6))), 960, 600);
  S.pavilion(L, 1400, 700, 1.1, 0, t);
  draw(L.ink, mk([[0, 720], [1920, 700]], { w: 6, tone: .7, prof: 'tip', dry: .6, seed: 110 }));
  // the tide: whole until the stroke, then the upper half rises and fades, the lower slumps
  if (after <= 0) S.tide(L, -200, 2200, 760, 600, t, 52, 1);
  else { L.cw.save(); L.cw.translate(0, -after * 260); L.cw.globalAlpha = 1 - after; S.tide(L, -200, 2200, 760, 120, t, 52, 1); L.cw.restore();
    L.cw.save(); L.cw.translate(0, after * 120); L.cw.globalAlpha = 1 - after * .9; S.tide(L, -200, 2200, 900, 500, t, 53, .8); L.cw.restore();
    const R = mulberry(140); for (let k = 0; k < 40; k++) { const x = R() * 1920, d = after * (100 + R() * 400); blot(L.cw, x + d * (R() - .2), 860 - d * .8 + after * after * 400, 6 + R() * 16, .8 * (1 - after), R() * 3, .6, k); } }
  const pose = poseAt(tw(t), [[150, 'sit'], [T.rise, 'crouch'], [T.stroke - .3, 'windup'], [T.stroke, 'strike'], [T.stroke + 2, 'strike'], [T.stroke + 3.5, 'guard']]);
  sitmen(L, pose, 1100, 700, 2.4, { t: tw(t), wind: 1, f: -1 });
  draw(L.ink, mk([[1900, 830, .8], [1300, 780, 1.1], [600, 820, 1], [-40, 880, .6]], { w: 230, tone: .92, prof: 'brush', dry: .84, wet: .12, nb: 56, seed: 150 }), p, 1 - after * .4);
  return { paperCol: [lerp(.8, .95, after), lerp(.78, .925, after), lerp(.76, .87, after)], shake: p > 0 && p < 1 ? [Math.sin(t * 90) * 12, Math.cos(t * 80) * 8] : [0, 0] };
};
SH.dawn = (L, t) => {             // pull back over the valley: clean paper again; ink rings drying; the sun
  const lt = t - T0.dawn, z = lerp(1.3, .62, ss(seg(lt, 0, 10)));
  cam(L, z, 960, 520);
  S.range(L, 'valley', { W: 3840, H: 2160, peaks: [[700, 900, 500], [3200, 1000, 600]], base: 1300, tone: .16, depth: 600, seed: 15 }, .8, -960, -540);
  S.mist(L, 900, t, 1.2, 7);
  const R = mulberry(160); for (let k = 0; k < 9; k++) S.ripple(L.ink, 200 + R() * 1500, 1000 + R() * 300, 40 + ((lt * 30 + k * 50) % 300), .35, 160 + k, .3, 3);
  S.needle(L, 1500, 500, 600, 240, 5);
  sitmen(L, POSE.stand, 1500, 500, .9, { t: tw(t), wind: .4, f: -1 });
  return { paperCol: DAY };
};
SH.bow = (L, t) => {              // medium: he bows to the bell
  const lt = t - T0.bow;
  cam(L, lerp(1, 1.08, ss(seg(lt, 0, 8))), 1000, 560);
  S.pavilion(L, 1350, 820, 1.2, Math.sin(t * .5) * .02, t);
  sitmen(L, poseAt(tw(t), [[168, 'stand'], [169.5, 'bow'], [173, 'bow'], [174.5, 'stand']]), 760, 820, 3.2, { t: tw(t), wind: .3, f: 1 });
  draw(L.ink, mk([[0, 830], [1920, 820]], { w: 5, tone: .55, prof: 'tip', dry: .6, seed: 170 }));
  return { paperCol: DAY };
};
SH.shadow = (L, t) => {           // locked on the stone: his shadow turns its head toward us, a beat late. Cut to black.
  cam(L, 1, 960, 540);
  draw(L.ink, mk([[0, 700], [1920, 690]], { w: 5, tone: .55, prof: 'tip', dry: .6, seed: 180 }));
  const turned = t > 177.6, pose = POSE.stand;
  sitmen(L, pose, 700, 700, 3.4, { t: tw(t), wind: .3, f: turned ? -1 : 1 });
  // the shadow: the same figure cast across the stone (sheared, flattened), in a dark wash
  const M = [1, 0, -1.05, -.55], c = L.cw; c.save(); c.translate(700, 700); c.transform(M[0], M[1], M[2], M[3], 0, 0); c.translate(-700, -700); c.globalAlpha = .7;
  const dummy = document.createElement('canvas').getContext('2d');
  sitmen({ ink: { wet: c, dry: c, col: dummy } }, pose, 700, 700, 3.4, { t: tw(t), wind: .3, f: 1, noStaff: true });
  c.restore();
  if (t > T.shadowTurn) { const k = seg(t, T.shadowTurn, T.shadowTurn + .5), dx = 2 * 3.4, dy = -92 * 3.4; const sx = 700 + dx + M[2] * dy, sy = 700 + M[3] * dy;
    for (const c2 of [L.cw, L.cd]) { c2.save(); c2.globalCompositeOperation = 'destination-out'; c2.fillStyle = '#000'; c2.globalAlpha = 1; for (const ex of [-9, 9]) { c2.beginPath(); c2.ellipse(sx + ex, sy, 6 * k, 4 * k, 0, 0, 7); c2.fill(); } c2.restore(); } }
  return { paperCol: DAY, fade: t > T.black ? 1 : 0 };
};

// ---------------- dispatcher: shots, ink-bloom transitions, inscriptions ----------------
const TRANS = { bell: 'bloom', bamboo: 'bloom', crows: 'bloom', door: 'cut', scare: 'cut', fight: 'cut', reveal: 'cut', climb: 'bloom', break: 'cut', eyes: 'cut', stroke: 'cut', dawn: 'bloom', bow: 'bloom', shadow: 'cut' };
const TR = 1.2;
export async function init() {}
export function frame(t, A, B) {
  const sh = shotAt(t), id = sh.id, lt = t - sh.t0, i = SHOTS.findIndex(s => s[0] === id);
  let o;
  if (i > 0 && TRANS[id] === 'bloom' && lt < TR) { const oa = SH[SHOTS[i - 1][0]](A, t) || {}; const ob = SH[id](B, t) || {}; o = { ...oa, paperCol: ob.paperCol || oa.paperCol, trans: [960, 560, ss(lt / TR) * 2600, 1] }; }
  else o = SH[id](A, t) || {};
  for (const [a, b, text] of INSCR) { if (t < a || t > b) continue; const k = Math.min(clamp((t - a) / .4), clamp((b - t) / .5)); subtitle(o.trans ? B : A, text, a < 100 ? 140 : 1150, a < 100 ? 170 : 200, k, { size: 48 }); }
  if (t > T.black + .6) { A.cc.save(); A.cc.setTransform(1, 0, 0, 1, 0, 0); seal(A.cc, 920, 480, 80, .95, 7); A.cc.restore(); o.fade = .97; }
  return o;
}
export function texts(t) { return INSCR.filter(([a, b]) => t >= a + .4 && t <= b - .5).map(([a, b, text]) => ({ id: text, text, x0: 100, y0: 100, x1: 1900, y1: 300 })); }
export function events() {
  const ev = [];
  for (const [id, t0] of SHOTS) ev.push({ t: t0, type: 'shot', id });
  for (const k in T) ev.push({ t: T[k], type: 'beat', id: k });
  for (const t0 of [24, 50, 62]) { const t1 = { 24: 50, 50: 58, 62: 66 }[t0]; for (let t = t0 + .4; t < t1; t += .75) if (!(t > 32.3 && t < 36)) ev.push({ t: +t.toFixed(3), type: 'step' }); }
  for (let t = 112.2; t < 123.6; t += .33) ev.push({ t: +t.toFixed(3), type: 'run' });
  return ev.sort((a, b) => a.t - b.t);
}
