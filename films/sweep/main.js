// SWEEP — page entry. window.render(t) draws frame t; ?test=sheet draws the model sheet.
import { makeComp, layerSet } from './comp.js';
const q = new URLSearchParams(location.search);
const comp = makeComp(document.getElementById('c'));
const A = layerSet(), B = layerSet(), TMP = layerSet();
await document.fonts.load('600 40px CormorantSC'); await document.fonts.load('italic 500 40px Cormorant'); await document.fonts.load('500 40px Cormorant');
const mode = q.get('test');
if (mode) {
  const m = await import('./' + mode + '.js');
  window.DUR = 1; window.render = t => m.render(t, A, B, comp);
} else {
  const S = await import('./shots.js');
  await S.init();
  window.DUR = S.DUR; window.EV = S.events(); window.TEXTS = S.texts;
  window.render = t => { A.clear(); B.clear(); const o = S.frame(t, A, B, TMP) || {}; comp(A, B, o); };
}
window.READY = true;
