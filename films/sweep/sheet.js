// ?test=sheet — the cast through the real compositor (model sheet)
import { imp, king, demon, child } from './chars.js';
import { seal } from './seal.js';
export function render(t, A, B, comp) {
  A.clear();
  imp(A, 200, 520, 3.2, { t, broom: .4 }); imp(A, 480, 520, 3.2, { t, broom: -.2, f: -1, look: [-2, 0] });
  imp(A, 720, 520, 3.2, { t, arms: 'shy', noBroom: true, tilt: .12, mouth: 1, smile: .5 });
  imp(A, 950, 520, 3.2, { t, broom: 1.2, drag: .8, squash: .92 });
  child(A, 1220, 520, 4.4, { t }); child(A, 1420, 520, 4.4, { t, cry: 1, arms: 'eyes' }); child(A, 1620, 520, 4.4, { t, arms: 'wave', f: -1 });
  king(A, 330, 1060, 1.35, { t, roar: .8, arms: 'up' });
  for (let k = 0; k < 4; k++) demon(A, 820 + k * 210, 1020, 2.6, k, k * .25);
  seal(A.cc, 1800, 960, 80, .95, 5);
  comp(A, null, {});
}
