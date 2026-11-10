// Set pieces for the Yellowstone country (tonal painting in grey values; the Redraw pass inks and hatches them).
import { form, stroke, catmull, grey, pathOf, rectPts, ellipsePts, mottle, H as hash, VN } from './engine/ink.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const rnd = (i, s = 1) => hash(i * 12.9898 + s * 78.233);

// big pale western sky (orthochromatic stock prints skies almost white) with a few long washed clouds
export function sky(g, W, Hh, seed = 1, v = .93, o = {}) {
  const gr = g.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, grey(v - (o.top ?? .08))); gr.addColorStop(1, grey(v + .03));
  g.fillStyle = gr; g.fillRect(-400, -400, W + 800, Hh + 400);
  for (let i = 0; i < (o.clouds ?? 6); i++) {
    const x = rnd(i, seed) * W, y = 40 + rnd(i + 9, seed) * Hh * .45, r = 140 + rnd(i + 3, seed) * 200;
    const c = g.createRadialGradient(x, y, 0, x, y, r); c.addColorStop(0, grey(1, .55)); c.addColorStop(1, grey(1, 0));
    g.fillStyle = c; g.beginPath(); g.ellipse(x, y, r * 2.2, r * .35, 0, 0, 7); g.fill();
  }
}
// a sun low in the sky (for the sunset): a pale disc with a soft halo; halation in the print does the rest
export function sun(g, x, y, r, v = 1) {
  const c = g.createRadialGradient(x, y, r * .6, x, y, r * 5); c.addColorStop(0, grey(v, .7)); c.addColorStop(1, grey(v, 0));
  g.fillStyle = c; g.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
  g.fillStyle = grey(v); g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
}

// a jagged snowy range: dark lower slopes, snow fields on the upper third, a few couloirs
export function range(g, x0, x1, base, h, seed = 1, v = .62, o = {}) {
  const n = o.n ?? 14, pts = [[x0 - 40, base]];
  const peak = i => { const u = i / n; return base - h * (.35 + .65 * Math.pow(Math.sin(u * Math.PI * (o.lobes ?? 1.6) + seed), 2) * (.55 + .45 * rnd(i, seed))); };
  for (let i = 0; i <= n; i++) pts.push([lerp(x0, x1, i / n) + (rnd(i + 40, seed) - .5) * (x1 - x0) / n * .6, peak(i)]);
  pts.push([x1 + 40, base]);
  const ridge = catmull(pts.slice(1, -1), false, 3);
  form(g, [[x0 - 40, base], ...ridge, [x1 + 40, base]], { v, line: 1.8, grad: .1, seed: seed + 3, shade: 0 });
  // snow: the upper part of the ridge, lighter, with ragged lower edge
  g.save(); pathOf(g, [[x0 - 40, base], ...ridge, [x1 + 40, base]]); g.clip();
  const snow = [];
  for (const [x, y] of ridge) snow.push([x, y - 2]);
  for (let i = ridge.length - 1; i >= 0; i--) { const [x, y] = ridge[i]; snow.push([x, y + h * (.06 + .14 * VN(x * .02 + seed))]); }
  g.fillStyle = grey(Math.min(.95, v + .38)); pathOf(g, snow); g.fill();
  // couloirs: dark streaks running down from the snow
  g.strokeStyle = grey(v - .15, .55); g.lineWidth = 2.2;
  for (let i = 0; i < (o.couloirs ?? 9); i++) { const x = lerp(x0, x1, rnd(i + 70, seed)), y = base - h * (.35 + rnd(i + 80, seed) * .4); g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd(i, seed) - .5) * 30, y + h * .25); g.stroke(); }
  g.restore();
}
// rolling hills / benchland
export function hills(g, x0, x1, base, amp, seed = 1, v = .7, o = {}) {
  const pts = [], n = 10;
  for (let i = 0; i <= n; i++) { const u = i / n; pts.push([lerp(x0, x1, u), base - amp * (.5 + .5 * Math.sin(u * Math.PI * (o.waves ?? 2.3) + seed * 1.7)) * (.7 + .3 * rnd(i, seed))]); }
  const ridge = catmull(pts, false, 6);
  form(g, [[x0, base + (o.depth ?? 400)], ...ridge, [x1, base + (o.depth ?? 400)]], { v, line: 1.6, grad: .12, seed: seed + 9, shade: 0 });
  if (o.tex !== false) mottle(g, x0, base - amp, x1 - x0, amp + 300, .12, seed);
}
// a lodgepole pine: straight trunk, short drooping boughs in layers, narrow spire
export function pine(g, x, base, h, v = .2, seed = 1) {
  const w = h * .16;
  stroke(g, [[x, base], [x, base - h * .9]], Math.max(1.4, h * .03), { color: grey(v - .05), seed });
  const tiers = Math.max(4, Math.round(h / 22));
  for (let i = 0; i < tiers; i++) {
    const u = i / tiers, y = base - h * (.18 + .8 * u), ww = w * (1 - u * .85) * (.8 + .4 * rnd(i, seed));
    const pts = [[x - ww, y + h * .05], [x - ww * .3, y - h * .06], [x, y - h * .1], [x + ww * .3, y - h * .06], [x + ww, y + h * .05], [x + ww * .2, y + h * .02], [x - ww * .2, y + h * .02]];
    form(g, catmull(pts, true, 3), { v: v + rnd(i + 3, seed) * .08, line: Math.max(.8, h * .008), grad: .1, seed: seed + i });
  }
}
export function forest(g, x0, x1, base, h, v = .25, seed = 1, density = 1) {
  const n = Math.round((x1 - x0) / (h * .16) * density);
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, (i + rnd(i, seed) * .8) / n), hh = h * (.6 + rnd(i + 5, seed) * .55); pine(g, x, base + rnd(i + 9, seed) * h * .12, hh, v + rnd(i + 2, seed) * .06, seed * 31 + i); }
}
// the river: a pale ribbon with dark ripple dashes; pts = centre line (far → near), w0 → w1 widths
export function river(g, pts, w0, w1, v = .86, seed = 1, t = 0) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) { const u = i / (pts.length - 1), w = lerp(w0, w1, u) / 2; const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; L.push([pts[i][0] - dy / l * w, pts[i][1] + dx / l * w]); R.push([pts[i][0] + dy / l * w, pts[i][1] - dx / l * w]); }
  const poly = [...catmull(L, false, 6), ...catmull(R.reverse(), false, 6)];
  form(g, poly, { v, line: 1.6, grad: .08, seed });
  g.save(); pathOf(g, poly); g.clip(); g.strokeStyle = grey(v - .3, .55); g.lineCap = 'round';
  for (let i = 0; i < 40; i++) { const u = rnd(i, seed), k = Math.floor(u * (pts.length - 1)), f = u * (pts.length - 1) - k; const p = [lerp(pts[k][0], pts[k + 1][0], f), lerp(pts[k][1], pts[k + 1][1], f)]; const w = lerp(w0, w1, u); const off = (rnd(i + 7, seed) - .5) * w * .8; const d = ((t * 30 + rnd(i + 3, seed) * 100) % 60) - 30;
    g.lineWidth = .8 + u * 1.6; g.beginPath(); g.moveTo(p[0] + off + d * u * .3, p[1] + off * .2); g.lineTo(p[0] + off + d * u * .3 + w * .12, p[1] + off * .2); g.stroke(); }
  g.restore();
}
// meadow / range ground: a flat wash with grass tufts
export function ground(g, x0, x1, y0, y1, v = .74, seed = 1, o = {}) {
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, grey(v + .04)); gr.addColorStop(1, grey(v - .06));
  g.fillStyle = gr; g.fillRect(x0, y0, x1 - x0, y1 - y0);
  mottle(g, x0, y0, x1 - x0, y1 - y0, .16, seed);
  if (o.tufts !== false) {
    g.strokeStyle = grey(v - .3, .6); g.lineCap = 'round';
    const n = o.tufts ?? 160, off = o.scroll ?? 0;
    for (let i = 0; i < n; i++) {
      const yy = lerp(y0 + 8, y1, Math.pow(rnd(i + 3, seed), .7)), k = (yy - y0) / (y1 - y0 + 1), span = x1 - x0 + 200;
      const xx = x0 - 100 + ((rnd(i, seed) * span - off * (.3 + k * .9)) % span + span) % span, hgt = 3 + k * 14;
      g.lineWidth = .8 + k * 1.4; g.beginPath();
      for (let j = -1; j <= 1; j++) { g.moveTo(xx + j * hgt * .3, yy); g.lineTo(xx + j * hgt * .6, yy - hgt); }
      g.stroke();
    }
  }
}
// sagebrush clump
export function sage(g, x, y, r, v = .5, seed = 1, o = {}) {
  const pts = []; const n = 11;
  for (let i = 0; i < n; i++) { const a = Math.PI + i / (n - 1) * Math.PI, k = .75 + rnd(i, seed) * .4; pts.push([x + Math.cos(a) * r * 1.3 * k, y + Math.sin(a) * r * k * (o.flat ?? .75)]); }
  pts.push([x + r * 1.2, y + r * .1], [x - r * 1.2, y + r * .1]);
  form(g, catmull(pts, true, 3), { v, line: Math.max(1, r * .04), grad: .14, seed, shade: r * .12 });
  g.strokeStyle = grey(v - .25, .7); g.lineWidth = Math.max(1, r * .03);
  for (let i = 0; i < 5; i++) { const xx = x + (i - 2) * r * .3; g.beginPath(); g.moveTo(xx, y + r * .08); g.lineTo(xx + (rnd(i + 4, seed) - .5) * r * .4, y - r * .35); g.stroke(); }
}

// a ranch barn: gable end facing us, board siding, a big dark door, a hay hood
export function barn(g, x, base, w, h, v = .55, seed = 1) {
  const ridge = h * 1.45;
  form(g, [[x, base], [x, base - h], [x + w / 2, base - ridge], [x + w, base - h], [x + w, base]], { v, line: 2.2, grad: .14, seed });
  g.strokeStyle = grey(v - .2, .5); g.lineWidth = 1;
  for (let xx = x + w / 12; xx < x + w - 2; xx += w / 12) { const top = base - h - (1 - Math.abs((xx - x) / w - .5) * 2) * (ridge - h); g.beginPath(); g.moveTo(xx, top + 4); g.lineTo(xx, base); g.stroke(); }
  form(g, [[x - w * .06, base - h + 6], [x + w / 2, base - ridge - 10], [x + w * 1.06, base - h + 6], [x + w * 1.0, base - h + 14], [x + w / 2, base - ridge + 2], [x, base - h + 14]], { v: .22, line: 2, seed: seed + 1 });
  form(g, rectPts(x + w * .3, base - h * .72, w * .4, h * .72), { v: .1, line: 2, grad: .1, seed: seed + 2 });
  stroke(g, [[x + w * .3, base - h * .72], [x + w * .7, base]], 2.2, { color: grey(.45), seed: seed + 3 });
  stroke(g, [[x + w * .7, base - h * .72], [x + w * .3, base]], 2.2, { color: grey(.45), seed: seed + 4 });
  form(g, rectPts(x + w * .42, base - h * 1.18, w * .16, h * .22), { v: .12, line: 1.8, seed: seed + 5 });
}
// post-and-rail fence along a line (x0..x1 at ground y), posts every `gap` px, h tall, 2 or 3 rails
export function fence(g, x0, x1, y, h, gap = 120, v = .4, seed = 1, o = {}) {
  const rails = o.rails ?? 3, pw = Math.max(4, h * .09);
  for (let r = 0; r < rails; r++) { const yy = y - h * (.3 + .32 * r); form(g, rectPts(x0, yy - h * .04, x1 - x0, h * .08), { v: v + .12, line: 1.4, grad: .12, seed: seed + r, shade: 2 }); }
  for (let x = x0; x <= x1 + 1; x += gap) form(g, rectPts(x - pw / 2, y - h * 1.05, pw, h * 1.05), { v, line: 1.6, grad: .14, seed: seed + 9 + x, shade: pw * .25 });
}
// the snubbing post: a thick weathered post in the middle of the corral (Grandpa's target)
export function snubPost(g, x, base, h, v = .38, seed = 5) {
  const w = h * .16;
  form(g, [[x - w / 2, base], [x - w / 2 + 2, base - h], [x + w / 2 - 2, base - h - 4], [x + w / 2, base]], { v, line: 2, grad: .2, seed, shade: w * .25 });
  g.strokeStyle = grey(v - .18, .6); g.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(x - w * .3 + i * w * .2, base - h * .9); g.lineTo(x - w * .32 + i * w * .2, base - h * .1); g.stroke(); }
}
// the corral gate: a frame of rails hinged at hx; open = 0 (closed, along +x) … 1 (swung toward camera, ~80°)
export function gateLeaf(g, hx, base, len, h, open, v = .5, seed = 7) {
  const a = open * 1.4, cw = Math.cos(a), dz = Math.sin(a);       // projected length, how far it swung toward us
  const ex = hx + len * cw, grow = 1 + dz * .18, eb = base + dz * 26;
  const P = (u, k) => [lerp(hx, ex, u), lerp(base, eb, u) - h * k * lerp(1, grow, u)];
  for (const k of [.22, .55, .88]) form(g, [P(0, k + .04), P(1, k + .04), P(1, k - .04), P(0, k - .04)], { v: v + .1, line: 1.6, grad: .1, seed: seed + k * 10, shade: 2 });
  stroke(g, [P(0, .22), P(1, .88)], h * .05, { color: grey(v), seed: seed + 3 });          // brace
  form(g, [P(1, 1.0), [P(1, 1)[0] + 9 * grow, P(1, 1)[1]], [P(1, 0)[0] + 9 * grow, P(1, 0)[1]], P(1, 0)], { v: v - .1, line: 1.6, seed: seed + 4 });
  return { P, ex, eb, grow };
}

// ---------------- geyser country ----------------
// sinter terraces: pale layered ledges with scalloped edges, stepping down toward us
export function terraces(g, x0, x1, y0, steps, stepH, seed = 1, v = .84) {
  for (let s = 0; s < steps; s++) {
    const y = y0 + s * stepH, pts = [[x0 - 60, y + stepH * 3]];
    const n = 16;
    for (let i = 0; i <= n; i++) { const x = lerp(x0, x1, i / n); pts.push([x, y + Math.sin(i * 1.7 + s * 2 + seed) * stepH * .18 + (i % 2 ? stepH * .12 : 0)]); }
    pts.push([x1 + 60, y + stepH * 3]);
    form(g, catmull(pts, true, 3), { v: v - s * .03, line: 1.4, grad: .08, seed: seed + s });
    // the wet scalloped lip
    g.strokeStyle = grey(v - .35, .6); g.lineWidth = 1.4;
    for (let i = 0; i < n; i++) { const x = lerp(x0, x1, (i + .5) / n), yy = y + stepH * .2 + Math.sin(i * 1.7 + s * 2 + seed) * stepH * .18; g.beginPath(); g.arc(x, yy, (x1 - x0) / n * .45, .2, Math.PI - .2); g.stroke(); }
  }
}
// a hot pool: a dark eye of water with a pale crusted rim
const blob = (x, y, rx, ry, seed, n = 14) => catmull(Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, k = .82 + .3 * rnd(i, seed); return [x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]; }), true, 4);
export function pool(g, x, y, rx, ry, seed = 1, t = 0) {
  form(g, blob(x, y, rx * 1.2, ry * 1.3, seed + 7), { v: .9, line: 1.2, grad: .06, seed });
  form(g, blob(x, y, rx, ry, seed + 9), { v: .64, line: 1.6, grad: -.12, seed: seed + 1 });
  const c = g.createRadialGradient(x, y, 0, x, y, rx); c.addColorStop(0, grey(.46, .6)); c.addColorStop(1, grey(.64, 0));
  g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fillStyle = c; g.beginPath(); g.arc(x, y, rx * .8, 0, 7); g.fill(); g.restore();
  // boiling: small bubbles that swell and pop
  g.fillStyle = grey(.85, .8);
  for (let i = 0; i < 6; i++) { const k = (t * 1.3 + rnd(i, seed)) % 1, a = rnd(i + 3, seed) * 6.28, d = rnd(i + 5, seed) * .6; g.beginPath(); g.arc(x + Math.cos(a) * rx * d, y + Math.sin(a) * ry * d, 2 + k * 5, 0, 7); g.globalAlpha = 1 - k; g.fill(); }
  g.globalAlpha = 1;
}
// the geyser cone: a knobbly mound of sinter with a dark vent mouth
export function cone(g, x, base, w, h, seed = 3) {
  const pts = [[x - w / 2, base]];
  for (let i = 0; i <= 10; i++) { const u = i / 10, xx = lerp(x - w / 2, x + w / 2, u), top = Math.sin(u * Math.PI); pts.push([xx, base - h * Math.pow(top, .55) * (.9 + .15 * rnd(i, seed)) + (u > .38 && u < .62 ? h * .12 : 0)]); }
  pts.push([x + w / 2, base]);
  form(g, catmull(pts, true, 3), { v: .7, line: 2, grad: .22, seed, shade: w * .05 });
  g.strokeStyle = grey(.45, .6); g.lineWidth = 1.3;
  for (let i = 0; i < 9; i++) { const yy = base - h * (.1 + i * .09), ww = w * .5 * Math.sqrt(1 - (i * .09 + .1) / 1.05); g.beginPath(); g.ellipse(x, yy, ww, h * .03, 0, .1, Math.PI - .1); g.stroke(); }
  form(g, ellipsePts(x, base - h * .9, w * .1, h * .05, 0, 16), { v: .1, line: 1.4, seed: seed + 1 });
}
// steam: soft rising billows (drawn as pale radial blobs; the Redraw pass gives them a soft contour)
export function steam(g, x, y, scale, t, seed = 1, o = {}) {
  const n = o.n ?? 9, rise = o.rise ?? 1, drift = o.drift ?? .35, a = o.a ?? .8;
  for (let i = 0; i < n; i++) {
    const life = ((t * .22 * rise + i / n + rnd(i, seed) * .1) % 1), k = life;
    const px = x + Math.sin(i * 2.3 + t * .6 + seed) * scale * .25 + k * scale * drift * 2.2, py = y - k * scale * 2.6 * rise;
    const r = scale * (.25 + k * .75) * (o.size ?? 1);
    const c = g.createRadialGradient(px, py, 0, px, py, r);
    const A = a * Math.sin(Math.PI * Math.min(1, k * 1.4)) * (o.dense ?? 1);
    c.addColorStop(0, grey(.99, A)); c.addColorStop(.62, grey(.96, A * .9)); c.addColorStop(.85, grey(.74, A * .45)); c.addColorStop(1, grey(.7, 0));
    g.fillStyle = c; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill();
  }
}
// the eruption: a column of white water and steam (k = 0..1 height reached, t = time for the billows)
export function eruption(g, x, base, H, k, t, seed = 9) {
  if (k <= 0) return;
  const top = base - H * k;
  // water column: a tapering bright core with ragged edges
  const L = [], R = [];
  for (let i = 0; i <= 14; i++) { const u = i / 14, y = lerp(base, top, u), w = (18 + u * 60) * (1 + .25 * Math.sin(t * 13 + i * 1.9)); L.push([x - w + Math.sin(t * 7 + i) * 6, y]); R.push([x + w + Math.sin(t * 9 + i * 1.3) * 6, y]); }
  form(g, catmull([...L, ...R.reverse()], true, 3), { v: .95, line: 2.4, grad: .12, seed, cyl: Math.PI / 2, cylK: .3 });
  g.strokeStyle = grey(.7, .7); g.lineWidth = 2; for (let i = 0; i < 7; i++) { const xx = x + (i - 3) * 22, ph = (t * 1.5 + i * .3) % 1; g.beginPath(); g.moveTo(xx, base - H * k * ph); g.lineTo(xx + Math.sin(i) * 8, base - H * k * Math.min(1, ph + .18)); g.stroke(); }
  // billowing steam around and above the column: each billow a grey shadow underneath, a white crown above
  const bill = [];
  for (let i = 0; i < 30; i++) {
    const u = rnd(i, seed), y = lerp(base - 40, top - H * .1, Math.pow(u, .8)), sway = Math.sin(t * .7 + i) * 24 + (rnd(i + 2, seed) - .5) * (90 + u * 240) * k;
    bill.push({ x: x + sway + u * 120 * k, y: y + Math.sin(t * 1.3 + i) * 10, r: (70 + u * 230) * (.5 + .5 * k) * (.85 + .3 * rnd(i + 4, seed)) });
  }
  for (const q of bill) { const c = g.createRadialGradient(q.x + q.r * .18, q.y + q.r * .22, 0, q.x + q.r * .18, q.y + q.r * .22, q.r); c.addColorStop(0, grey(.64, .95)); c.addColorStop(.86, grey(.6, .9)); c.addColorStop(.95, grey(.58, .5)); c.addColorStop(1, grey(.58, 0)); g.fillStyle = c; g.beginPath(); g.arc(q.x + q.r * .18, q.y + q.r * .22, q.r, 0, 7); g.fill(); }
  for (const q of bill) { const c = g.createRadialGradient(q.x - q.r * .1, q.y - q.r * .14, 0, q.x - q.r * .1, q.y - q.r * .14, q.r * .86); c.addColorStop(0, grey(1, 1)); c.addColorStop(.84, grey(.97, 1)); c.addColorStop(.94, grey(.9, .6)); c.addColorStop(1, grey(.9, 0)); g.fillStyle = c; g.beginPath(); g.arc(q.x - q.r * .1, q.y - q.r * .14, q.r * .86, 0, 7); g.fill(); }
  // falling spray: dashes curving out and down
  g.strokeStyle = grey(.85, .7); g.lineCap = 'round';
  for (let i = 0; i < 40; i++) { const side = i % 2 ? 1 : -1, ph = (t * .8 + rnd(i, seed)) % 1, sx = x + side * (40 + ph * 260 * (.5 + rnd(i + 3, seed))), sy = top + H * k * .15 + ph * ph * H * .7 * k; g.lineWidth = 1.5 + rnd(i + 5, seed) * 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + side * 6, sy + 16); g.stroke(); }
}
// cracks spreading in the crust: k 0..1
export function cracks(g, x, y, r, k, seed = 4) {
  if (k <= 0) return;
  for (let i = 0; i < 7; i++) {
    const a = rnd(i, seed) * Math.PI * 2, len = r * (.5 + rnd(i + 3, seed) * .6) * Math.min(1, k * 1.3 - i * .05);
    if (len <= 0) continue;
    const pts = [[x, y]]; let px = x, py = y;
    for (let j = 1; j <= 4; j++) { px += Math.cos(a + (rnd(i * 7 + j, seed) - .5)) * len / 4; py += Math.sin(a + (rnd(i * 7 + j, seed) - .5)) * len / 4 * .35; pts.push([px, py]); }
    stroke(g, pts, 2.2, { color: grey(.08), seed: seed + i, taper: .5 });
  }
}
