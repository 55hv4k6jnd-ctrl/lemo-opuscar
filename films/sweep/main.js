// SWEEP — page entry (80s Cel Anime). Each frame: scene canvas (plates + cels) + glow canvas (light emitters) + subtitles
// → post.js (tape + CRT). ?test=model draws the model sheet; ?raw=1 skips the CRT pass.
import { canvas, W, H } from './cel.js';
import { makePost } from './post.js';
const qs = new URLSearchParams(location.search);
const [sc, g] = canvas(W, H), [gc, e] = canvas(W, H), [ovc, ov] = canvas(W, H);
const post = makePost(document.getElementById('gl'));
await document.fonts.load('italic 900 120px Kanit'); await document.fonts.load('italic 800 56px Kanit'); await document.fonts.load('600 52px "Barlow SC"');
const RAW = { bloom: 0, halo: 0, soft: 0, flick: 0, lift: 0, contrast: 0, fade: 0, sat: 1, tint: [1, 1, 1], scan: 0, grille: 0, bleed: 1, rshift: 0, glow: 0, corner: 0, noiseA: 0, power: 1, track: 0, expo: 1 };
const TEST = qs.get('test');
const mod = TEST ? await import('./test.js') : await import('./shots.js');
if (!TEST) await mod.init();
window.render = t => {
  for (const x of [g, e, ov]) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; }
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H); e.fillStyle = '#000'; e.fillRect(0, 0, W, H); ov.clearRect(0, 0, W, H);
  const over = (TEST ? mod.test(g, e, t, TEST) : mod.frame(g, e, ov, t)) || {};
  post.render(sc, gc, Math.round(t * 24), ovc, qs.get('raw') ? RAW : over);
};
window.DUR = TEST ? 1 : mod.DUR; window.EV = TEST ? [] : mod.events(); window.TEXTS = TEST ? (() => []) : mod.texts;
window.READY = true;
