// SWEEP — painted background plates (airbrushed gradients, lit cloud undersides, painted light) — each with a matching
// emissive plate. Painted once at load; shots only slide them.
import { canvas, vgrad, airbrush, rgba, mix, rng, TAU, path } from './cel.js';

// sky, clouds, mountains, the cliff with the cave and the gate, a crooked pine: one composition, repainted per colour model
export const SKY = {
  morning: { sky: [[0, '#6fa8e8'], [.45, '#a8cdf0'], [.75, '#ffe0a8'], [1, '#ffd08a']], cloud: '#ffffff', under: '#f0b890', far: ['#9ab4d4', '#b8c8dc'], cliff: ['#8a9a72', '#5e6e4e', '#3e4a34'], ground: ['#b8a46a', '#8a7a4a'], pine: '#3e5a3a', mouth: '#1a1424' },
  dusk: { sky: [[0, '#3a2a6a'], [.4, '#8a4a8a'], [.7, '#f07a6a'], [1, '#ffb070']], cloud: '#f0a0a0', under: '#7a3a6a', far: ['#6a4a7a', '#8a5a7a'], cliff: ['#7a5a6a', '#4e3a52', '#2e223a'], ground: ['#7a5a5a', '#4e3a44'], pine: '#2e2a3e', mouth: '#120a1a' },
  storm: { sky: [[0, '#141a34'], [.5, '#28345a'], [1, '#3a4a6a']], cloud: '#5a6a8a', under: '#1a2240', far: ['#2a3450', '#34405a'], cliff: ['#3a4a5a', '#28323e', '#161c26'], ground: ['#3a4048', '#22262e'], pine: '#121a22', mouth: '#06060c' },
  dawn: { sky: [[0, '#7a8ad8'], [.4, '#d8a0d0'], [.72, '#ffc0a8'], [1, '#ffe2b0']], cloud: '#fff0f0', under: '#e89aa8', far: ['#a890c0', '#c8a8c8'], cliff: ['#9a8a92', '#6e5e72', '#463a52'], ground: ['#c8a088', '#9a7a6a'], pine: '#4a3e5a', mouth: '#1a1222' },
  night: { sky: [[0, '#0a0c28'], [.6, '#1a2450'], [1, '#2a3a6a']], cloud: '#3a4a7a', under: '#141a3a', far: ['#1e2a4a', '#28365a'], cliff: ['#2a3450', '#1c2238', '#101428'], ground: ['#1e2840', '#121a2e'], pine: '#0c1224', mouth: '#04040a' },
};
function clouds(g, w, h, c, seed, n = 7, y0 = .1, y1 = .45) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) { const x = R() * w, y = h * (y0 + R() * (y1 - y0)), rx = 180 + R() * 260;
    for (let k = 0; k < 6; k++) airbrush(g, x + (R() - .5) * rx * 1.4, y + (R() - .5) * 40, rx * (.4 + R() * .4), 50 + R() * 40, c.cloud, .75, .5);
    for (let k = 0; k < 4; k++) airbrush(g, x + (R() - .5) * rx, y + 34, rx * .5, 22, c.under, .55, .6); }
}
function ridge(g, w, base, h, col, seed, sharp = 1.6) {
  const R = rng(seed), pk = Array.from({ length: 6 }, () => [R() * w, h * (.5 + R() * .5), 160 + R() * 240]);
  const y = x => { let m = 0; for (const [px, ph, pw] of pk) m = Math.max(m, ph * Math.exp(-Math.pow(Math.abs(x - px) / pw, sharp))); return base - m; };
  const gr = g.createLinearGradient(0, base - h, 0, base); gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, base + 400); for (let x = 0; x <= w; x += 8) g.lineTo(x, y(x)); g.lineTo(w, base + 400); g.fill();
  return y;
}
// the cave gate, painted (W×H plate + emissive); cx = centre of the mouth, gy = ground line
export function gatePlate(model, W = 2200, H = 1300) {
  const c = SKY[model], [pc, g] = canvas(W, H), [ec, e] = canvas(W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  vgrad(g, 0, 0, W, H, c.sky);
  if (model === 'night') { const R = rng(4); for (let i = 0; i < 160; i++) { g.fillStyle = rgba('#ffffff', .3 + R() * .6); g.fillRect(R() * W, R() * H * .5, 2, 2); } }
  clouds(g, W, H, c, model.length * 7 + 3, model === 'storm' ? 12 : 6, .05, model === 'storm' ? .5 : .35);
  ridge(g, W, H * .62, 300, c.far, 11);
  const cx = W * .52, gy = H * .76;
  // the cliff with the cave
  const cl = [[cx - 640, gy + 40], [cx - 600, gy - 300], [cx - 500, gy - 560], [cx - 240, gy - 720], [cx + 140, gy - 760], [cx + 470, gy - 600], [cx + 640, gy - 320], [cx + 700, gy + 40]];
  const gr = g.createLinearGradient(cx - 600, gy - 700, cx + 600, gy); gr.addColorStop(0, c.cliff[0]); gr.addColorStop(.55, c.cliff[1]); gr.addColorStop(1, c.cliff[2]);
  g.fillStyle = gr; g.fill(path(cl)); g.strokeStyle = mix(c.cliff[2], '#000000', .4); g.lineWidth = 3; g.stroke(path(cl));
  const R = rng(21); g.strokeStyle = rgba(mix(c.cliff[2], '#000000', .3), .5); g.lineWidth = 3;
  for (let i = 0; i < 18; i++) { const x = cx - 520 + R() * 1100, y = gy - 80 - R() * 560; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 40, y + 60 + R() * 80); g.stroke(); }
  for (let i = 0; i < 10; i++) airbrush(g, cx - 500 + R() * 1000, gy - 600 + R() * 500, 120, 80, c.cliff[0], .25, .8);
  // mouth + gate stones + lintel
  const mouth = []; for (let i = 0; i <= 20; i++) { const a = Math.PI + i / 20 * Math.PI; mouth.push([cx + Math.cos(a) * 150, gy - 40 + Math.sin(a) * 220]); }
  mouth.push([cx + 150, gy], [cx - 150, gy]);
  g.fillStyle = c.mouth; g.fill(path(mouth.map(p => [p[0], p[1], 1])));
  for (const sg of [-1, 1]) { const x = cx + sg * 200; vgradRect(g, x - 34, gy - 250, 68, 250, [mix(c.cliff[0], '#ffffff', .15), c.cliff[2]]); g.strokeStyle = mix(c.cliff[2], '#000', .5); g.lineWidth = 3; g.strokeRect(x - 34, gy - 250, 68, 250); }
  vgradRect(g, cx - 260, gy - 290, 520, 46, [mix(c.cliff[0], '#ffffff', .2), c.cliff[1]]); g.strokeRect(cx - 260, gy - 290, 520, 46);
  // ground + steps
  vgradRect(g, 0, gy, W, H - gy, c.ground);
  g.strokeStyle = rgba(mix(c.ground[1], '#000', .4), .6); g.lineWidth = 3;
  for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(cx - 280 - i * 60, gy + 16 + i * 28); g.lineTo(cx + 280 + i * 60, gy + 16 + i * 28); g.stroke(); }
  // a crooked pine at the left
  pinePaint(g, cx - 560, gy + 10, 1.4, c.pine, c.cliff[2]);
  // painted light: morning sun glow / dusk rim / storm: nothing until lightning / dawn glow
  if (model === 'morning') { airbrush(g, W * .85, H * .3, 400, 260, '#fff4c0', .55, 1); airbrush(e, W * .85, H * .3, 300, 200, '#ffe8a0', .35, 1); }
  if (model === 'dawn') { airbrush(g, W * .2, H * .55, 520, 240, '#ffe0c0', .6, 1); airbrush(e, W * .2, H * .55, 380, 160, '#ffc090', .3, 1); }
  if (model === 'dusk') { airbrush(g, W * .5, H * .6, 900, 220, '#ffb070', .35, 1); }
  return { pc, ec, cx, gy, W, H };
}
function vgradRect(g, x, y, w, h, [a, b]) { const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, a); gr.addColorStop(1, b); g.fillStyle = gr; g.fillRect(x, y, w, h); }
export function pinePaint(g, x, y, s, col, dark) {
  g.strokeStyle = mix(col, '#000', .3); g.lineCap = 'round';
  g.lineWidth = 26 * s; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x - 30 * s, y - 120 * s, x + 40 * s, y - 220 * s, x + 10 * s, y - 330 * s); g.stroke();
  g.lineWidth = 10 * s; for (const [a, b, c2, d] of [[0, -150, -120, -190], [10, -230, 130, -260], [12, -310, -90, -350], [10, -330, 90, -380]]) { g.beginPath(); g.moveTo(x + a * s, y + b * s); g.quadraticCurveTo(x + (a + c2) / 2 * s, y + (b - 30) * s, x + c2 * s, y + d * s); g.stroke(); }
  for (const [cx, cy, r] of [[-120, -200, 90], [130, -270, 100], [-90, -360, 80], [90, -390, 90], [10, -420, 70]]) {
    g.fillStyle = col; g.beginPath(); g.ellipse(x + cx * s, y + cy * s, r * s, r * .42 * s, 0, 0, TAU); g.fill();
    g.fillStyle = mix(col, '#ffffff', .18); g.beginPath(); g.ellipse(x + cx * s - r * .2 * s, y + cy * s - r * .12 * s, r * .7 * s, r * .22 * s, 0, 0, TAU); g.fill();
  }
}
// the whole mountain (high wide): the zig-zag path, the tiny cave at the top
export const PATH = [[1090, 300], [880, 420], [1170, 560], [840, 700], [1140, 850], [900, 1020]];
export function mountainPlate(model, W = 1920, H = 1080) {
  const c = SKY[model], [pc, g] = canvas(W, H), [ec, e] = canvas(W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  vgrad(g, 0, 0, W, H, c.sky); clouds(g, W, H, c, 31 + model.length, model === 'storm' ? 12 : 6, .02, .3);
  ridge(g, W, H * .6, 260, c.far, 12);
  const gr = g.createLinearGradient(0, 220, 0, H); gr.addColorStop(0, c.cliff[0]); gr.addColorStop(.6, c.cliff[1]); gr.addColorStop(1, c.cliff[2]);
  g.fillStyle = gr; g.beginPath(); g.moveTo(-50, H); g.bezierCurveTo(300, 760, 700, 300, 1060, 250); g.bezierCurveTo(1380, 280, 1650, 700, 1980, H); g.fill();
  const R = rng(5); for (let i = 0; i < 30; i++) { const x = 600 + R() * 900, y = 400 + R() * 600; g.fillStyle = rgba(c.pine, .9); g.beginPath(); g.moveTo(x, y - 34); g.lineTo(x - 13, y); g.lineTo(x + 13, y); g.fill(); }
  g.strokeStyle = rgba(c.ground[0], .9); g.lineWidth = 14; g.lineJoin = 'round'; g.beginPath(); PATH.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke();
  g.fillStyle = c.mouth; g.beginPath(); g.ellipse(1090, 290, 34, 26, 0, Math.PI, TAU); g.fill();
  return { pc, ec, W, H };
}
// the pond at night: the moon above, its reflection below, reeds, fireflies on the emissive plate
export function pondPlate(W = 1920, H = 1080) {
  const c = SKY.night, [pc, g] = canvas(W, H), [ec, e] = canvas(W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  vgrad(g, 0, 0, W, H, c.sky);
  const R = rng(8); for (let i = 0; i < 200; i++) { g.fillStyle = rgba('#ffffff', .3 + R() * .6); g.fillRect(R() * W, R() * H * .5, 2, 2); }
  ridge(g, W, 560, 220, c.far, 13);
  g.fillStyle = '#f4f8ff'; g.beginPath(); g.arc(1460, 220, 70, 0, TAU); g.fill(); airbrush(e, 1460, 220, 220, 220, '#9ad8ff', .6, 1);
  vgradRect(g, 0, 600, W, 480, ['#141c3a', '#0a1028']);
  vgradRect(g, 0, 640, W, 300, ['#1e2a54', '#101838']);           // the pond
  for (let i = 0; i < 14; i++) { const x = 250 + i * 34 + R() * 10; g.strokeStyle = '#0a1226'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, 900); g.quadraticCurveTo(x + 10, 780, x + 20 * (R() - .3), 660 + R() * 60); g.stroke(); }
  for (let i = 0; i < 26; i++) { const x = R() * W, y = 300 + R() * 500; airbrush(e, x, y, 12, 12, '#d8ff7a', .8, 1); g.fillStyle = '#f0ffb0'; g.fillRect(x - 1.5, y - 1.5, 3, 3); }
  return { pc, ec, W, H };
}
// the moon's reflection on the pond (drawn live: it breaks into ripples when swept); k = broken 0..1
export function moonReflection(g, e, x, y, t, k) {
  const pieces = k > .02 ? 7 : 1;
  for (let i = 0; i < pieces; i++) { const off = (i - 3) * 40 * k, w = 64 * (pieces > 1 ? .4 : 1) * (1 + k * .3), yy = y + Math.sin(i * 2.1 + t * 3) * 10 * k;
    g.fillStyle = rgba('#e8f4ff', .9 - k * .3); g.beginPath(); g.ellipse(x + off, yy, w, 14 * (1 - k * .4), 0, 0, TAU); g.fill();
    e.fillStyle = rgba('#8ad0ff', .35); e.beginPath(); e.ellipse(x + off, yy, w * 1.6, 30, 0, 0, TAU); e.fill(); }
  g.strokeStyle = rgba('#a8c8ff', .5); g.lineWidth = 2;
  for (let i = 0; i < 3; i++) { const r = ((t * .5 + i / 3) % 1); g.beginPath(); g.ellipse(x, y, 90 + r * 260, 12 + r * 30, 0, 0, TAU); g.globalAlpha = (1 - r) * (.3 + k * .6); g.stroke(); }
  g.globalAlpha = 1;
}
// under the old pine in the storm (medium)
export function pinePlate(W = 1920, H = 1080) {
  const c = SKY.storm, [pc, g] = canvas(W, H), [ec, e] = canvas(W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  vgrad(g, 0, 0, W, H, c.sky); clouds(g, W, H, c, 77, 12, 0, .4);
  ridge(g, W, 700, 260, c.far, 14);
  vgradRect(g, 0, 860, W, 220, c.ground);
  pinePaint(g, 480, 900, 2.2, c.pine, c.cliff[2]);
  return { pc, ec, W, H };
}
// the village at dawn, a long plate for the pan, lanterns on the emissive plate
export function villagePlate(W = 3400, H = 1080) {
  const c = SKY.dawn, [pc, g] = canvas(W, H), [ec, e] = canvas(W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  vgrad(g, 0, 0, W, H, c.sky); clouds(g, W, H, c, 55, 10, .05, .3);
  airbrush(g, 2700, 650, 700, 260, '#fff0c8', .6, 1); airbrush(e, 2700, 650, 500, 180, '#ffc890', .25, 1);
  ridge(g, W, 640, 300, c.far, 15);
  const gr = g.createLinearGradient(0, 400, 0, H); gr.addColorStop(0, c.cliff[0]); gr.addColorStop(1, c.cliff[2]);
  g.fillStyle = gr; g.beginPath(); g.moveTo(-20, 360); g.bezierCurveTo(600, 420, 1300, 800, 2100, 880); g.lineTo(W + 20, 900); g.lineTo(W + 20, H); g.lineTo(-20, H); g.fill();
  g.strokeStyle = rgba(c.ground[0], .9); g.lineWidth = 22; g.beginPath(); g.moveTo(100, 400); g.bezierCurveTo(800, 500, 1500, 820, 2300, 900); g.lineTo(W, 920); g.stroke();
  const houses = []; const R = rng(9);
  for (let i = 0; i < 7; i++) { const hx = 2280 + i * 150 + R() * 30, hy = 905 + R() * 12, w = 120 + R() * 40; houses.push([hx, hy]);
    vgradRect(g, hx - w / 2, hy - 70, w, 70, ['#e8d0c0', '#b89a92']); g.strokeStyle = '#5a3e46'; g.lineWidth = 3; g.strokeRect(hx - w / 2, hy - 70, w, 70);
    g.fillStyle = '#6a4a5a'; g.beginPath(); g.moveTo(hx - w * .65, hy - 62); g.lineTo(hx, hy - 118); g.lineTo(hx + w * .65, hy - 62); g.fill(); g.stroke();
    g.fillStyle = '#ffd88a'; g.fillRect(hx - 12, hy - 50, 24, 22); airbrush(e, hx, hy - 40, 40, 30, '#ffc060', .8, 1); }
  return { pc, ec, W, H, houses };
}
// the sky above the mountain at morning, a tall plate for the closing pan up
export function skyPlate(W = 1920, H = 2400) {
  const c = SKY.dawn, [pc, g] = canvas(W, H), [ec, e] = canvas(W, H);
  e.fillStyle = '#000'; e.fillRect(0, 0, W, H);
  vgrad(g, 0, 0, W, H, [[0, '#4a6ad8'], [.35, '#8aa8f0'], [.65, '#ffc0b0'], [1, '#ffe0b8']]);
  clouds(g, W, H, { cloud: '#ffffff', under: '#f0b0b8' }, 66, 12, .1, .7);
  airbrush(g, 1380, 1500, 260, 260, '#fff8e0', .9, .6); airbrush(e, 1380, 1500, 260, 260, '#ffe0a0', .55, 1);
  return { pc, ec, W, H };
}
