// Review sheets (not in the film): ?scene=sheets.model — the cast through the full pipeline (Redraw + print).
import { drawFigure, P0, runPose, walkPose } from './engine/figure.js';
import { setFrame, S as IS, grey } from './engine/ink.js';
import { Redraw } from './engine/redraw.js';
import { FilmPost, damage } from './engine/film.js';
import { JOSIE, AMOS, drawCalf, drawBison } from './chars.js';
import { pose, EXPR } from './poses.js';
import { gate } from './stage.js';
const FW = 1440, FH = 1080;
const mk = () => Object.assign(document.createElement('canvas'), { width: FW, height: FH });
let RD, FP;
export function model(g, t) {
  RD = RD || new Redraw(FW, FH); FP = FP || new FilmPost(FW, FH);
  const c = mk(), x = c.getContext('2d'); setFrame(0); IS.sepLine = .5;
  x.fillStyle = grey(.9); x.fillRect(0, 0, FW, FH);
  x.fillStyle = grey(.78); x.fillRect(0, 760, FW, 320);
  // Josie turnaround + poses (top row), Amos (bottom row), animals
  const yaws = [0, 45, 90, 180];
  yaws.forEach((y, i) => drawFigure(x, JOSIE, { x: 110 + i * 150, ground: 480, scale: 62, yaw: y, pose: { ...P0(), expr: EXPR.deadpan }, t: 0 }));
  drawFigure(x, JOSIE, { x: 760, ground: 480, scale: 62, yaw: 90, pose: runPose(.15), t: 0 });
  drawFigure(x, JOSIE, { x: 920, ground: 480, scale: 62, yaw: 30, pose: pose('whirl', 0), t: 0 });
  drawFigure(x, JOSIE, { x: 1080, ground: 480, scale: 62, yaw: 20, pose: pose('hatTip'), t: 0 });
  drawFigure(x, JOSIE, { x: 1260, ground: 480, scale: 62, yaw: 60, pose: pose('sit'), t: 0 });
  [0, 60, 90].forEach((y, i) => drawFigure(x, AMOS, { x: 120 + i * 170, ground: 1010, scale: 54, yaw: y, pose: pose('amosStand'), t: 0 }));
  drawFigure(x, AMOS, { x: 640, ground: 1010, scale: 54, yaw: 70, pose: pose('amosTwirl', 0), t: 0 });
  drawCalf(x, 900, 1010, 70, 0, 0, { f: 1 });
  drawCalf(x, 1100, 900, 50, .3, 2, { f: -1 });
  drawBison(x, 1240, 1010, 110, 0, 0, { f: -1, head: .3, turn: 1 });
  const rd = RD.render(c, { frame: 0 });
  const dev = FP.render(rd, { frame: 3, strength: .45, sepia: .24 });
  gate(g, dev, .5, 1);
}
