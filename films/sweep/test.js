// ?test=model — the cast in two colour models (morning, night) through the real tape + CRT pass
import { vgrad } from './cel.js';
import { PAL } from './pal.js';
import { imp, king, demon, child, villager } from './chars.js';
export function test(g, e, t) {
  vgrad(g, 0, 0, 1920, 1080, [[0, '#f6d9a0'], [.55, '#f0c890'], [.551, '#cbb98a'], [1, '#a89a70']]);
  const P = PAL.morning, N = PAL.night;
  imp(g, e, 170, 500, 4, P, { t, broom: .4, glint: 1 }); imp(g, e, 420, 500, 4, P, { t, f: -1, broom: .1, mouth: 'smile', look: [-1, 0] });
  imp(g, e, 650, 500, 4, P, { t, noBroom: true, arms: 'shy', mouth: 1, blink: 0 }); imp(g, e, 880, 500, 4, N, { t, broom: 1.1, drag: .8, rim: N.rim, brow: 1 });
  child(g, e, 1120, 500, 5.5, P, { t }); child(g, e, 1330, 500, 5.5, P, { t, cry: 1, arms: 'eyes' }); child(g, e, 1540, 500, 5.5, P, { t, smile: 1, blush: 1, arms: 'wave', f: -1 });
  villager(g, e, 1760, 500, 5, N, 0, t);
  king(g, e, 330, 1060, 1.4, P, { t, roar: .8, arms: 'up' });
  for (let k = 0; k < 4; k++) demon(g, e, 800 + k * 230, 1020, 2.8, k, k * .25, P, {});
  return {};
}
