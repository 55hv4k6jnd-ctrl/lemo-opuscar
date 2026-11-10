// SWEEP — colour models (色指定): every cel colour is defined once in daylight and derived per time of day.
// Lit areas × lit, shadows × shade, lines × line; skin gets its own hand-picked colour in every set.
import { hex } from './cel.js';

export const BASE = {
  imp: { f: '#8a5cb4', s: '#5e3a8a', h: '#b896e0', l: '#2e1846' },          // plum-violet body
  belly: { f: '#f6e6c6', s: '#d8bf98', h: '#fffaf0', l: '#6a4a3a' },
  horn: { f: '#f1e2c0', s: '#c6ad84', h: '#ffffff', l: '#5a4630' },
  eye: { f: '#ffffff', s: '#d8d0ea', l: '#2a1440' }, iris: { f: '#3a2066', s: '#1c0e38', h: '#9a7ae0' },
  accent: { f: '#ff4f36', s: '#c4282a', h: '#ff9a7a', l: '#5e1010' },     // vermilion: scarf + tassel (pops in every set)
  wood: { f: '#9a6a3c', s: '#6a4422', h: '#c8925a', l: '#2e1a0a' },
  straw: { f: '#e8c46a', s: '#b88e3a', h: '#fff0b0', l: '#5a3e10' },
  king: { f: '#33306a', s: '#1e1a46', h: '#5a56a0', l: '#0c0a22' },
  fur: { f: '#6a5a92', s: '#463a6a', h: '#9a8ac4', l: '#1e1636' },
  gold: { f: '#ffd24a', s: '#d8961e', h: '#fff6c0', l: '#5a3a06' },
  bone: { f: '#efe4cc', s: '#bfae8c', h: '#ffffff', l: '#4a3a26' },
  d1: { f: '#2f9a8c', s: '#1e6a62', h: '#6ad0c2', l: '#0a2e2a' }, d2: { f: '#d0a43a', s: '#946e1e', h: '#f6d478', l: '#3e2a06' },
  d3: { f: '#b85a3a', s: '#843a22', h: '#e89474', l: '#3a120a' }, d4: { f: '#7a8a3a', s: '#525e22', h: '#b0c06a', l: '#22280a' },
  hat: { f: '#e6c27a', s: '#b48c46', h: '#fff0c0', l: '#5a3e14' },
  jacket: { f: '#4f79b8', s: '#33528a', h: '#8ab0e8', l: '#142446' },
  pants: { f: '#5a5470', s: '#3a3650', h: '#8a84a4', l: '#16142a' },
  hair: { f: '#a04a2e', s: '#6e2e1a', h: '#d8805a', l: '#3a120a' },
  skin: { f: '#ffd9c4', s: '#e2a395', h: '#fff1e8', l: '#5a2e2e' }, blush: '#ff9a9a', mouth: '#9a3b4a',
  lantern: { f: '#ffd88a', s: '#e8a040', h: '#fff8d8', l: '#7a3e10' },
  villager: { f: '#7a6a8a', s: '#54486a', h: '#a898b8', l: '#221a30' },
};
const mul = (c, m) => { const v = hex(c); return '#' + v.map((x, i) => Math.max(0, Math.min(255, Math.round(x * m[i]))).toString(16).padStart(2, '0')).join(''); };
export const LIGHTS = {
  morning: { lit: [1.04, 1.0, .92], shade: [1, .95, .98], line: [1, 1, 1], skin: { f: '#ffdcc2', s: '#e6a48e', h: '#fff4e4' }, rim: '#fff2b0' },
  dusk: { lit: [.98, .78, .82], shade: [.74, .56, .82], line: [.9, .7, .9], skin: { f: '#f6c0b0', s: '#b0789a', h: '#ffe0d0' }, rim: '#ffb060' },
  night: { lit: [.7, .74, 1.0], shade: [.5, .5, .86], line: [.8, .7, 1.1], skin: { f: '#dcc8d0', s: '#8a78a8', h: '#f4eef8' }, rim: '#8ff0ff' },
  storm: { lit: [.62, .7, .9], shade: [.42, .46, .7], line: [.7, .7, .9], skin: { f: '#c8c4d4', s: '#7a7898', h: '#ecf0ff' }, rim: '#c8f4ff' },
  dawn: { lit: [1.06, .9, .88], shade: [.88, .68, .82], line: [1, .8, .85], skin: { f: '#ffd0c0', s: '#d8909c', h: '#fff0ea' }, rim: '#ffd0a0' },
  sil: { lit: [.24, .2, .34], shade: [.16, .12, .26], line: [.3, .2, .5], skin: { f: '#3a2e48', s: '#2a2036', h: '#5a4a6a' }, rim: '#ffd27a' },
};
export function palette(name) {
  const L = LIGHTS[name], out = { name, rim: L.rim };
  for (const [k, v] of Object.entries(BASE)) {
    if (typeof v === 'string') { out[k] = mul(v, L.lit); continue; }
    out[k] = {}; for (const [kk, c] of Object.entries(v)) out[k][kk] = mul(c, kk === 's' ? L.shade : kk === 'l' ? L.line : L.lit);
  }
  Object.assign(out.skin, L.skin);
  // the accent keeps its saturation in every set (it must pop)
  out.accent = { ...BASE.accent, f: name === 'sil' ? '#ff6a3a' : name === 'night' || name === 'storm' ? '#ff5a44' : BASE.accent.f };
  return out;
}
export const PAL = Object.fromEntries(Object.keys(LIGHTS).map(k => [k, palette(k)]));
