// ROPE & STEAM — film assembly.
// shot paints a tonal 4:3 frame (+ the rope into a colour mask) → Redraw (ink, wash steps, boiling hatch) → iris
// → FilmPost (silver/sepia print, grain, flicker, weave, scratches, burn; the rope keeps its ochre) → dust/hair → tint
// → projected into the 4:3 gate between theatre curtains. Motion is hand-cranked (16 fps, 20 in the chase).
import { Redraw } from './engine/redraw.js';
import { FilmPost, damage } from './engine/film.js';
import { intertitle, iris, theatre } from './engine/cards.js';
import { setFrame, S as IS } from './engine/ink.js';
import { SEC, DUR as D, HIT, secAt } from './timeline.js';
import { CARDS, CARD_TEXT } from './cardspecs.js';
import * as SH from './shots.js';

export const DUR = D;
const W = 1920, H = 1080, FW = 1440, FH = 1080, GATE = { x: 240, y: 0, w: FW, h: FH };
const mk = () => { const c = document.createElement('canvas'); c.width = FW; c.height = FH; return c; };
const fc = mk(), fg = fc.getContext('2d'), mc = mk(), mg = mc.getContext('2d');
let RD = null, FP = null;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = x => { x = clamp(x); return x * x * (3 - 2 * x); };

// per-section print: damage, sepia, motion sampling, crank; tint = a period dye over the whole print
const BLUE = [150, 182, 228], ROSE = [255, 196, 178], AMBER = [255, 226, 170];
const LOOK = {
  OPEN: { str: .5, sepia: .3, fps: 16, tint: AMBER, tk: .35 }, TITLE: { str: .5, sepia: .24, fps: 16 },
  LESSON: { str: .42, sepia: .3, fps: 16, tint: AMBER, tk: .35 }, CARD1: { str: .5, sepia: .24, fps: 16 },
  GATE: { str: .5, sepia: .3, fps: 16, tint: AMBER, tk: .35 }, CARD2: { str: .8, sepia: .1, fps: 16, crank: 1.3 },
  CHASE: { str: .85, sepia: .08, fps: 20, crank: 1.35 }, BISON: { str: .6, sepia: .14, fps: 16 },
  CARD3: { str: .6, sepia: .1, fps: 16 }, BASIN: { str: .6, sepia: 0, fps: 16, tint: BLUE, tk: .55 },
  CRACK: { str: .78, sepia: 0, fps: 18, crank: 1.25, tint: BLUE, tk: .6 }, SIL: { str: .5, sepia: 0, fps: 16, tint: BLUE, tk: .55 },
  CARD4: { str: .4, sepia: .22, fps: 16 }, THROW: { str: .55, sepia: .05, fps: 16, tint: BLUE, tk: .3 },
  HOME: { str: .3, sepia: .34, fps: 16, tint: ROSE, tk: .5 }, FADE: { str: .35, sepia: .34, fps: 16, tint: ROSE, tk: .5 },
  END: { str: .4, sepia: .28, fps: 16 },
};
const SHOTS = { OPEN: SH.open, LESSON: SH.lesson, GATE: SH.gate, CHASE: SH.chase, BISON: SH.bison, BASIN: SH.basin, CRACK: SH.crack, SIL: SH.sil, THROW: SH.throwShot, HOME: SH.home, FADE: SH.fade };

export function renderFilm(g, t) {
  RD = RD || new Redraw(FW, FH); FP = FP || new FilmPost(FW, FH);
  const sec = secAt(t), look = LOOK[sec.name], frame = Math.floor(t * 24 + 1e-6);
  const ta = Math.floor(t * look.fps + 1e-6) / look.fps;            // hand-cranked motion sampling
  const lt = Math.max(0, ta - sec.t0), b = lt / sec.beat;
  for (const c of [fg, mg]) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; }
  mg.clearRect(0, 0, FW, FH);
  let src = fc, exposure = 1, useMask = false, halation = 1;
  const card = CARDS[sec.name];
  if (card) intertitle(fg, FW, FH, card, t - sec.t0);
  else {
    setFrame(ta, { boil: 1 }); IS.sepLine = .5;
    fg.fillStyle = '#fff'; fg.fillRect(0, 0, FW, FH);
    fg.save(); mg.save(); SHOTS[sec.name]({ g: fg, m: mg }, b, ta); fg.restore(); mg.restore();
    src = RD.render(fc, { frame });
    useMask = true;
  }
  if (sec.name === 'OPEN') exposure = .15 + .85 * ss(t / .45);                      // the lamp strikes: the film is already running
  if (sec.name === 'THROW') { const k = ss((t - HIT.erupt) / 2.2); exposure = 1 + .06 * k; halation = 1 + .7 * k; }   // the column blooms white
  if (sec.name === 'FADE') exposure = 1 - ss((t - SEC.FADE.t0) / SEC.FADE.dur * 1.05);
  if (card) halation = 1.4;
  // iris (in the camera, so it is printed with the frame)
  const ir = irisAt(t);
  if (ir) {
    if (src !== fc) { fg.setTransform(1, 0, 0, 1, 0, 0); fg.drawImage(src, 0, 0); src = fc; }
    iris(fg, FW, FH, ir.x, ir.y, ir.r, 4);
    mg.save(); mg.globalCompositeOperation = 'destination-in'; mg.fillStyle = '#000'; mg.beginPath(); mg.arc(ir.x, ir.y, Math.max(.5, ir.r), 0, 7); mg.fill(); mg.restore();
  }
  const fp = { frame, strength: look.str, sepia: look.sepia, crank: look.crank ?? 1, exposure, halation };
  const dev = FP.render(src, fp, useMask ? mc : null);
  const curtain = t < HIT.curtainOut ? 1 : 1 - ss((t - HIT.curtainOut) / 1.4);
  theatre(g, W, H, GATE, Math.max(.3, FP.mean * exposure), curtain);
  g.save(); g.beginPath(); g.roundRect(GATE.x, GATE.y, GATE.w, GATE.h, 22); g.clip();
  g.drawImage(dev, GATE.x, GATE.y);
  if (look.tint) { g.globalCompositeOperation = 'multiply'; const [r, gg, bb] = look.tint, k = look.tk ?? .5; g.fillStyle = `rgb(${Math.round(255 - (255 - r) * k)},${Math.round(255 - (255 - gg) * k)},${Math.round(255 - (255 - bb) * k)})`; g.fillRect(GATE.x, 0, FW, FH); g.globalCompositeOperation = 'source-over'; }
  damage(g, GATE.x, GATE.y, FW, FH, frame, look.str);
  const e = g.createLinearGradient(GATE.x, 0, GATE.x + 18, 0); e.addColorStop(0, 'rgba(0,0,0,.85)'); e.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = e; g.fillRect(GATE.x, 0, 18, H);
  const e2 = g.createLinearGradient(GATE.x + FW, 0, GATE.x + FW - 18, 0); e2.addColorStop(0, 'rgba(0,0,0,.85)'); e2.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = e2; g.fillRect(GATE.x + FW - 18, 0, 18, H);
  g.restore();
  if (curtain < 1) curtainsOver(g, curtain, .55);
}

function curtainsOver(g, open, spill) {
  const cover = (1 - open) * (W / 2 + 10);
  if (cover < 1) return;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  theatre(x, W, H, { x: W / 2, y: 0, w: 0, h: H }, spill, 1);
  g.save();
  g.drawImage(c, 0, 0, W / 2, H, cover - W / 2, 0, W / 2, H);
  g.drawImage(c, W / 2, 0, W / 2, H, W - cover, 0, W / 2, H);
  g.save(); g.beginPath(); g.rect(0, 0, cover, H); g.rect(W - cover, 0, cover, H); g.clip();
  g.globalCompositeOperation = 'screen';
  const fl = g.createRadialGradient(W / 2, H + 120, 60, W / 2, H + 120, 1250);
  fl.addColorStop(0, 'rgba(255,170,110,.42)'); fl.addColorStop(.55, 'rgba(170,70,50,.16)'); fl.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = fl; g.fillRect(0, 0, W, H); g.restore();
  for (const [x0, dir] of [[cover, -1], [W - cover, 1]]) { const gr = g.createLinearGradient(x0, 0, x0 + dir * 60, 0); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(Math.min(x0, x0 + dir * 60), 0, 60, H); }
  g.restore();
}

// the half iris on Josie in the bison shot: closes to her face, holds while she looks at us, then shuts
function irisAt(t) {
  const full = 1900;
  if (t >= HIT.look - SEC.BISON.beat * 1.2 && t < SEC.BISON.t1) {
    const b = (t - SEC.BISON.t0) / SEC.BISON.beat, c = SH.TRACK.josie || [720, 500];
    let r;
    if (b < 22) r = full - (full - 230) * ss((b - 20.8) / 1.2);
    else if (b < 24.6) r = 230;
    else r = 230 * (1 - ss((b - 24.6) / 1.2));
    return { x: c[0], y: c[1] + 30, r: Math.max(.5, r) };
  }
  return null;
}

export function events() {
  const ev = [];
  for (const k in SEC) ev.push({ t: SEC[k].t0, type: 'section', name: k });
  for (const k in HIT) ev.push({ t: HIT[k], type: 'hit', name: k });
  return ev.sort((a, b) => a.t - b.t);
}
// every text on screen (for readcheck): the intertitles
export function texts(t) {
  const sec = secAt(t);
  return CARD_TEXT[sec.name] ? [{ id: sec.name, text: CARD_TEXT[sec.name], x0: 300, y0: 200, x1: 1620, y1: 880 }] : [];
}
