// SIT MEN — the cast. Sit Men is a stick figure painted in burnt-ink strokes: a bald pale head with six ordination dots,
// a white headband (paper left blank) with one vermilion dot, two band tails in the wind, and a staff.
// Pose = joint positions in local units (height ≈ 100, origin at the feet, facing right, y up = negative).
import { mk, draw, mass, blot } from './ink.js';
import { clamp, lerp, vnoise } from '/core/lib.js';

export const VERM = [176, 46, 34];
const J = ['hip', 'neck', 'head', 'shF', 'elF', 'haF', 'shB', 'elB', 'haB', 'knF', 'ftF', 'knB', 'ftB'];
const P = o => o;
export const POSE = {
  stand: P({ hip: [0, -48], neck: [1, -80], head: [2, -92], shF: [1, -78], elF: [4, -62], haF: [6, -48], shB: [0, -78], elB: [-3, -62], haB: [-4, -48], knF: [2, -25], ftF: [4, 0], knB: [-2, -25], ftB: [-4, 0], staff: 'side' }),
  walk1: P({ hip: [0, -48], neck: [3, -80], head: [5, -92], shF: [3, -78], elF: [10, -64], haF: [12, -52], shB: [2, -78], elB: [-6, -63], haB: [-10, -52], knF: [8, -25], ftF: [12, 0], knB: [-5, -24], ftB: [-12, -1], staff: 'carry' }),
  walk2: P({ hip: [0, -49], neck: [3, -81], head: [5, -93], shF: [3, -79], elF: [-4, -63], haF: [-7, -51], shB: [2, -79], elB: [8, -64], haB: [10, -52], knF: [1, -25], ftF: [-2, -2], knB: [3, -26], ftB: [2, 0], staff: 'carry' }),
  run1: P({ hip: [0, -50], neck: [10, -80], head: [14, -91], shF: [10, -78], elF: [22, -70], haF: [26, -58], shB: [9, -78], elB: [-6, -70], haB: [-16, -62], knF: [18, -36], ftF: [24, -14], knB: [-12, -24], ftB: [-26, -10], staff: 'run' }),
  run2: P({ hip: [0, -52], neck: [10, -82], head: [14, -93], shF: [10, -80], elF: [-4, -72], haF: [-14, -64], shB: [9, -80], elB: [20, -72], haB: [26, -62], knF: [-8, -28], ftF: [-20, -12], knB: [16, -34], ftB: [22, -8], staff: 'run' }),
  sit: P({ hip: [0, -16], neck: [0, -48], head: [0, -60], shF: [1, -46], elF: [10, -30], haF: [3, -22], shB: [-1, -46], elB: [-10, -30], haB: [-3, -22], knF: [18, -8], ftF: [-6, -4], knB: [-18, -8], ftB: [6, -4], staff: 'lap' }),
  guard: P({ hip: [0, -42], neck: [4, -72], head: [6, -84], shF: [4, -70], elF: [16, -64], haF: [24, -70], shB: [3, -70], elB: [-6, -60], haB: [4, -56], knF: [14, -22], ftF: [22, 0], knB: [-10, -20], ftB: [-20, 0], staff: 'guard' }),
  windup: P({ hip: [0, -40], neck: [-6, -70], head: [-8, -82], shF: [-6, -68], elF: [-18, -76], haF: [-26, -88], shB: [-6, -68], elB: [-16, -62], haB: [-20, -74], knF: [14, -20], ftF: [22, 0], knB: [-12, -18], ftB: [-22, 0], staff: 'up' }),
  strike: P({ hip: [0, -40], neck: [10, -70], head: [14, -80], shF: [10, -68], elF: [26, -62], haF: [40, -58], shB: [9, -68], elB: [22, -60], haB: [32, -56], knF: [22, -18], ftF: [32, 0], knB: [-14, -16], ftB: [-26, 0], staff: 'sweep' }),
  kick: P({ hip: [0, -52], neck: [-8, -82], head: [-11, -93], shF: [-7, -80], elF: [6, -84], haF: [14, -90], shB: [-8, -80], elB: [-20, -72], haB: [-30, -76], knF: [18, -60], ftF: [38, -66], knB: [-2, -26], ftB: [-4, 0], staff: 'back' }),
  ring: P({ hip: [0, -48], neck: [2, -80], head: [3, -92], shF: [2, -78], elF: [12, -86], haF: [18, -100], shB: [1, -78], elB: [-4, -62], haB: [-6, -48], knF: [3, -25], ftF: [6, 0], knB: [-3, -25], ftB: [-6, 0], staff: 'side' }),
  bow: P({ hip: [0, -48], neck: [16, -74], head: [24, -82], shF: [15, -72], elF: [20, -60], haF: [22, -50], shB: [14, -72], elB: [10, -58], haB: [14, -50], knF: [2, -25], ftF: [4, 0], knB: [-2, -25], ftB: [-4, 0], staff: 'side' }),
  crouch: P({ hip: [0, -30], neck: [8, -58], head: [11, -70], shF: [8, -56], elF: [20, -46], haF: [28, -40], shB: [7, -56], elB: [-4, -46], haB: [6, -38], knF: [16, -18], ftF: [20, 0], knB: [-12, -12], ftB: [-18, 0], staff: 'guard' }),
};
export function mix(a, b, t) { const o = {}; for (const k of J) o[k] = [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)]; o.staff = t < .5 ? a.staff : b.staff; return o; }
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
export function poseAt(t, keys) {       // keys: [[t, poseName|pose], ...] eased
  const get = v => typeof v === 'string' ? POSE[v] : v;
  if (t <= keys[0][0]) return get(keys[0][1]);
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) return mix(get(keys[i - 1][1]), get(keys[i][1]), ease((t - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])));
  return get(keys[keys.length - 1][1]);
}
export const walkCycle = (ph, run = false) => mix(POSE[run ? 'run1' : 'walk1'], POSE[run ? 'run2' : 'walk2'], .5 - .5 * Math.cos(ph * Math.PI * 2));

// draw Sit Men. L = layer set; x, y = feet; s = px per unit; o: { f, t, wind, staffA (override angle), noStaff, glowDot }
export function sitmen(L, pose, x, y, s, o = {}) {
  const f = o.f ?? 1, t = o.t ?? 0, ink = L.ink || L;
  const T = p => [x + p[0] * s * f, y + p[1] * s];
  const st = (pts, w, tone = .92, seed = 1, prof = 'tip', dry = .35) => draw(ink, mk(pts.map(T), { w: w * s, tone, prof, dry, wet: .2, seed }));
  // legs (back first), torso, arms — burnt ink, tapered
  st([pose.hip, pose.knB, pose.ftB], 3.8, .82, 11); st([pose.hip, pose.knF, pose.ftF], 4.2, .95, 12);
  st([pose.hip, [lerp(pose.hip[0], pose.neck[0], .5) - 1, lerp(pose.hip[1], pose.neck[1], .5)], pose.neck], 4.4, .95, 13, 'press', .3);
  // the staff: a long burnt line held in the hands
  if (!o.noStaff) {
    const h1 = pose.haF, h2 = pose.haB, mode = pose.staff;
    let a = o.staffA ?? { side: -1.45, carry: -.55, run: -.25, lap: 0, guard: -.15, up: -2.3, sweep: .1, back: -2.7 }[mode] ?? -1;
    const c = mode === 'side' || mode === 'lap' ? h1 : [(h1[0] + h2[0]) / 2, (h1[1] + h2[1]) / 2], L2 = 62;
    const d = [Math.cos(a), Math.sin(a)], A = [c[0] - d[0] * L2 * .45, c[1] - d[1] * L2 * .45], B = [c[0] + d[0] * L2 * .55, c[1] + d[1] * L2 * .55];
    draw(ink, mk([T(A), T(B)], { w: 2.6 * s, tone: .9, prof: 'even', dry: .3, seed: 14 }));
  }
  st([pose.shB, pose.elB, pose.haB], 2.6, .78, 15); st([pose.shF, pose.elF, pose.haF], 2.9, .92, 16);
  // head: a pale wash + one loaded contour stroke; six ordination dots on the crown
  const hc = T(pose.head), r = 9 * s, tilt = Math.atan2(pose.head[0] - pose.neck[0], -(pose.head[1] - pose.neck[1])) * f;
  const circ = n => Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2; return [hc[0] + Math.cos(a) * r, hc[1] + Math.sin(a) * r * 1.05]; });
  mass(ink.wet, circ(20), .12, .6 * s, 21, null);
  draw(ink, mk([...circ(18), circ(18)[0], circ(18)[1]].map((p, i) => [...p, i < 10 ? 1.1 : .7]), { w: 2.2 * s, tone: .9, prof: 'brush', dry: .3, wet: .2, seed: 22 }));
  const R = (px, py) => { const c = Math.cos(tilt), sn = Math.sin(tilt); return [hc[0] + (px * c - py * sn) * s * f, hc[1] + (px * sn + py * c) * s]; };
  for (let i = 0; i < 6; i++) { const q = R(-3.2 + (i % 3) * 3.2, -7.3 + Math.floor(i / 3) * 2.4); blot(ink.dry, q[0], q[1], .75 * s, .92, 0, 1, i); }
  // the white headband: paper knocked out of the head, two thin ink edges, two tails flying back
  const b0 = R(-9.4, -2.6), b1 = R(9.4, -2.6), b2 = R(9.4, .4), b3 = R(-9.4, .4);
  for (const c of [ink.wet, ink.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.globalAlpha = 1; c.beginPath(); c.moveTo(...b0); c.lineTo(...b1); c.lineTo(...b2); c.lineTo(...b3); c.closePath(); c.fill(); c.restore(); }
  draw(ink, mk([b0, R(0, -3.2), b1], { w: .9 * s, tone: .85, prof: 'tip', dry: .2, seed: 23 })); draw(ink, mk([b3, R(0, 1), b2], { w: .9 * s, tone: .85, prof: 'tip', dry: .2, seed: 24 }));
  const wind = o.wind ?? .4, knot = R(-9, -1);
  for (let k = 0; k < 2; k++) {
    const pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6, wav = Math.sin(t * 9 + u * 5 + k) * (1.4 + wind * 2) * u; pts.push([knot[0] - f * u * (14 + wind * 10) * s, knot[1] + (u * (3 + k * 3) * (1 - wind) + wav + k * u * 2) * s]); }
    draw(ink, mk(pts, { w: 1.6 * s, tone: .7, prof: 'tip', dry: .45, seed: 25 + k }));
  }
  // the one vermilion: the dot on the band (it finds him in every wide shot)
  const dot = R(4.5, -1.1);
  L.ink.col.save(); L.ink.col.fillStyle = `rgba(${VERM.join(',')},.96)`; L.ink.col.beginPath(); L.ink.col.arc(dot[0], dot[1], Math.max(1.6, 1.45 * s), 0, 7); L.ink.col.fill(); L.ink.col.restore();
  return { head: hc, dot };
}

// the dead: hunched wet-ink figures, arms reaching, eyes left blank. ph = shamble phase, s = px per unit, o: { f, k (variety) }
export function dead(L, x, y, s, ph = 0, o = {}) {
  const f = o.f ?? 1, k = o.k ?? 0, ink = L.ink || L, sw = Math.sin(ph * Math.PI * 2), T = (px, py) => [x + px * s * f, y + py * s];
  const lean = 10 + (k % 3) * 4;
  draw(ink, mk([T(0, -44), T(4 + sw * 6, -22), T(2 + sw * 10, 0)], { w: 4 * s, tone: .85, prof: 'tip', dry: .5, wet: .4, seed: 300 + k }));
  draw(ink, mk([T(-2, -44), T(-6 - sw * 5, -22), T(-8 - sw * 8, 0)], { w: 3.6 * s, tone: .75, prof: 'tip', dry: .55, wet: .4, seed: 301 + k }));
  mass(ink.wet, [T(-12, -42), T(-10 + lean * .3, -70), T(lean * .6, -82), T(lean + 8, -76), T(lean + 10, -56), T(8, -40)], .55, 2.5 * s, 302 + k, [x, y - 84 * s, x, y - 40 * s, 1.2, .8]);
  draw(ink, mk([T(-10, -44), T(-8 + lean * .3, -70), T(lean * .6, -80)], { w: 9 * s, tone: .9, darkDir: [-f, 0], side: .8, brWet: true, body: .3, dry: .5, wet: .7, prof: 'brush', seed: 303 + k }));
  const hc = T(lean + 6, -88 + Math.sin(ph * 6.28 + 1) * 1.5);
  mass(ink.wet, Array.from({ length: 12 }, (_, i) => { const a = i / 12 * 6.28; return [hc[0] + Math.cos(a) * 8 * s, hc[1] + Math.sin(a) * 9 * s]; }), .62, 1.2 * s, 304 + k, null);
  for (const c of [ink.wet, ink.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.globalAlpha = 1; for (const ex of [-2.4, 3]) { c.beginPath(); c.ellipse(hc[0] + ex * s * f, hc[1] - 1 * s, 1.9 * s, 1.3 * s, 0, 0, 7); c.fill(); } c.restore(); }
  for (const [ay, dx] of [[-74, 0], [-70, -4]]) draw(ink, mk([T(lean * .7 + dx, ay), T(lean + 18 + dx, ay + 4 + sw * 3), T(lean + 30 + dx, ay + 8 + sw * 4)], { w: 3 * s, tone: .85, prof: 'tip', dry: .45, wet: .3, seed: 306 + k + dx }));
}
// a dead face filling the frame (the jump scare): one huge wet mass, blank eyes, a torn mouth
export function deadFace(L, cx, cy, r, k = 1) {
  const ink = L.ink;
  const rim = Array.from({ length: 26 }, (_, i) => { const a = i / 26 * 6.28, j = .88 + .2 * vnoise(i * 1.7); return [cx + Math.cos(a) * r * .82 * j, cy + Math.sin(a) * r * 1.08 * j]; });
  mass(ink.wet, rim, .95 * k, r * .04, 401, [cx, cy - r, cx, cy + r, 1.1, .85]);
  draw(ink, mk([...rim, rim[0]], { w: r * .07, tone: .97, prof: 'brush', dry: .55, wet: .3, seed: 402 }));
  for (let i = 0; i < 5; i++) draw(ink, mk([[cx - r * (.6 - i * .3), cy - r * 1.05], [cx - r * (.66 - i * .3), cy - r * .6]], { w: r * .05, tone: .9, prof: 'nail', dry: .6, seed: 403 + i }));   // hair strands
  // blank eyes (paper) with burnt rims, a torn mouth of paper teeth
  for (const c of [ink.wet, ink.dry]) { c.save(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.globalAlpha = 1;
    for (const ex of [-.32, .3]) { c.beginPath(); c.ellipse(cx + ex * r, cy - r * .12, r * .16, r * .2, ex * .5, 0, 7); c.fill(); }
    c.beginPath(); c.ellipse(cx, cy + r * .5, r * .34, r * .2, 0, 0, 7); c.fill(); c.restore(); }
  for (const ex of [-.32, .3]) draw(ink, mk(Array.from({ length: 14 }, (_, i) => { const a = i / 13 * 6.6; return [cx + ex * r + Math.cos(a) * r * .18, cy - r * .12 + Math.sin(a) * r * .22]; }), { w: r * .035, tone: .97, prof: 'brush', dry: .4, seed: 410 + ex * 10 }));
  for (const ex of [-.32, .3]) blot(ink.dry, cx + ex * r + r * .02, cy - r * .1, r * .035, .95, 0, 1, 7);
  for (let i = 0; i < 8; i++) { const u = (i + .5) / 8 - .5; draw(ink, mk([[cx + u * r * .62, cy + r * .32], [cx + u * r * .62 + r * .02, cy + r * (.44 + (i % 2) * .08)]], { w: r * .035, tone: .95, prof: 'nail', dry: .3, seed: 420 + i })); draw(ink, mk([[cx + u * r * .58, cy + r * .69], [cx + u * r * .58 - r * .02, cy + r * (.58 - (i % 2) * .06)]], { w: r * .03, tone: .95, prof: 'nail', dry: .3, seed: 430 + i })); }
}
