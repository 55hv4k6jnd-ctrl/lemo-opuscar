// SIT MEN — page entry. window.render(t) draws frame t through the rice-paper compositor.
import { makeComp, layerSet } from './comp.js';
const comp = makeComp(document.getElementById('c'));
const A = layerSet(), B = layerSet();
await document.fonts.load('600 40px CormorantSC'); await document.fonts.load('italic 500 40px Cormorant');
const S = await import('./shots.js');
await S.init();
window.DUR = S.DUR; window.EV = S.events(); window.TEXTS = S.texts;
window.render = t => { A.clear(); B.clear(); const o = S.frame(t, A, B) || {}; comp(A, B, o); };
window.READY = true;
