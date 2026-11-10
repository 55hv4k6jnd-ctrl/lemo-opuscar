// Key poses and expressions for ROPE & STEAM (built on engine/figure.js P0()). The right arm (aR) is the rope arm:
// with the figure facing screen-right (yaw 90) it is the near arm.
import { P0, runPose, walkPose, mixPose } from './engine/figure.js';

export const EXPR = {
  deadpan: { open: .8, brow: 0, look: [0, 0] },
  intent: { open: .7, brow: .5, browA: .25, look: [0, -.1] },
  sulk: { open: .55, brow: .6, browA: .5, smile: -.35, look: [0, .3] },
  alarm: { open: 1.35, brow: 1.3, browA: -.6, mouthOpen: .5, mouthW: .7 },
  wide: { open: 1.25, brow: 1.0, browA: -.4, mouthOpen: .15 },
  calm: { open: .5, brow: .2, browA: 0, smile: .1, look: [0, .1] },
  glad: { open: .62, brow: .45, browA: -.7, smile: .75, look: [0, -.1] },
  wink: { open: .9, brow: .3, smile: .55, wink: 1, winkAmt: 1 },
};
const ROPE_UP = (k = 1) => ({ fl: 2.55 * k + .1 * (1 - k), abd: .55 * k, el: .45, wr: .2, hand: 'grip' });   // rope hand overhead
export function pose(name, k = 1) {
  const p = P0();
  switch (name) {
    case 'stand': p.expr = EXPR.deadpan; break;
    case 'whirl': {        // rope arm up, circling (k = phase handled by the shot: small wrist circles)
      Object.assign(p, { lean: -.04, nod: -.18 });
      p.aR = ROPE_UP(); p.aL = { fl: .5, abd: .25, el: 1.2, wr: .2, hand: 'grip' };     // coils in the other hand
      p.L = { hip: .25, abd: .12, knee: .2, ankle: 0 }; p.R = { hip: -.2, abd: .1, knee: .1, ankle: 0 };
      p.expr = EXPR.intent; break;
    }
    case 'throw': {        // follow-through: rope arm forward, body leaning in
      Object.assign(p, { lean: .22, nod: .02 });
      p.aR = { fl: 1.55, abd: .1, el: .1, wr: .1, hand: 'open' }; p.aL = { fl: .5, abd: .2, el: 1.1, wr: .2, hand: 'grip' };
      p.L = { hip: .45, abd: .1, knee: .35, ankle: 0 }; p.R = { hip: -.35, abd: .08, knee: .1, ankle: .2 };
      p.expr = EXPR.intent; break;
    }
    case 'haul': {         // leaning back, both hands on the rope in front
      Object.assign(p, { lean: -.32, nod: .1 });
      p.aR = { fl: 1.2, abd: .05, el: .55, wr: .1, hand: 'grip' }; p.aL = { fl: 1.15, abd: .08, el: .6, wr: .1, hand: 'grip' };
      p.L = { hip: .55, abd: .1, knee: .3, ankle: .3 }; p.R = { hip: -.15, abd: .08, knee: .45, ankle: .1 };
      p.expr = EXPR.intent; break;
    }
    case 'tangled': {      // her own loop pins her arms to her sides
      Object.assign(p, { lean: .02, nod: .05 });
      p.aR = { fl: .05, abd: .02, el: .15, wr: .1, hand: 'open' }; p.aL = { fl: .05, abd: .02, el: .15, wr: .1, hand: 'open' };
      p.expr = EXPR.deadpan; break;
    }
    case 'sit': {          // sitting on the ground, legs out in front
      Object.assign(p, { lean: -.05, nod: .1 });
      p.L = { hip: 1.45, abd: .15, knee: .25, ankle: .2 }; p.R = { hip: 1.4, abd: .1, knee: .45, ankle: .2 };
      p.aR = { fl: .05, abd: .05, el: .15, wr: .1, hand: 'open' }; p.aL = { fl: .05, abd: .05, el: .15, wr: .1, hand: 'open' };
      p.expr = EXPR.deadpan; break;
    }
    case 'perch': {        // sitting on the gate rail, arms folded, sulking
      Object.assign(p, { lean: .08, nod: .22 });
      p.L = { hip: 1.5, abd: .1, knee: 1.5, ankle: .1 }; p.R = { hip: 1.45, abd: .08, knee: 1.4, ankle: .1 };
      p.aR = { fl: .75, abd: .1, el: 1.85, wr: .1, hand: 'fist' }; p.aL = { fl: .8, abd: .1, el: 1.9, wr: .1, hand: 'fist' };
      p.expr = EXPR.sulk; break;
    }
    case 'take': {         // the double take: a little jump, arms out
      Object.assign(p, { lean: -.1, nod: -.15 });
      p.aR = { fl: .5, abd: .7, el: .6, wr: -.2, hand: 'open' }; p.aL = { fl: .5, abd: .7, el: .6, wr: -.2, hand: 'open' };
      p.L = { hip: .15, abd: .12, knee: .3, ankle: -.3 }; p.R = { hip: -.1, abd: .1, knee: .2, ankle: -.3 };
      p.expr = EXPR.alarm; break;
    }
    case 'freeze': {       // face to face with the bull: rigid, on her toes
      Object.assign(p, { lean: -.08, nod: -.05 });
      p.aR = { fl: .1, abd: .12, el: .1, wr: 0, hand: 'open' }; p.aL = { fl: .1, abd: .12, el: .1, wr: 0, hand: 'open' };
      p.L = { hip: .05, abd: .06, knee: 0, ankle: -.2 }; p.R = { hip: -.05, abd: .06, knee: 0, ankle: -.2 };
      p.expr = EXPR.wide; break;
    }
    case 'hatTip': {       // two fingers to the brim, hat lifted a little (with expr.hatUp)
      Object.assign(p, { lean: .04, nod: .12 });
      p.aR = { fl: 2.2, abd: .75, el: 1.9, wr: .3, hand: 'grip' };
      p.expr = { ...EXPR.calm, hatUp: .22, hatTilt: -.15 }; break;
    }
    case 'breathe': {      // the turn: rope lowered, shoulders down, eyes closed a moment
      Object.assign(p, { lean: .02, nod: .14 });
      p.aR = { fl: .35, abd: .15, el: .6, wr: .1, hand: 'grip' }; p.aL = { fl: .45, abd: .2, el: 1.0, wr: .2, hand: 'grip' };
      p.expr = { open: .05, brow: .1, look: [0, .2] }; break;
    }
    case 'lead': {         // walking, rope hand back over the shoulder
      const w = walkPose(k); w.aR = { fl: -.35, abd: .2, el: .9, wr: .1, hand: 'grip' }; w.expr = EXPR.glad; return w;
    }
    case 'run': { const r = runPose(k); r.expr = EXPR.intent; r.aR.hand = 'grip'; return r; }
    // ---- Amos ----
    case 'amosStand': {    // a slight stoop, thumbs in the belt
      Object.assign(p, { lean: .1, nod: .08 });
      p.aR = { fl: -.05, abd: .12, el: .35, wr: .1, hand: 'relax' }; p.aL = { fl: -.05, abd: .12, el: .35, wr: .1, hand: 'relax' };
      p.expr = EXPR.deadpan; break;
    }
    case 'amosTwirl': {    // one lazy loop at shoulder height, barely moving
      Object.assign(p, { lean: .06, nod: -.04 });
      p.aR = { fl: 2.1, abd: .6, el: .65, wr: .2, hand: 'grip' }; p.aL = { fl: .4, abd: .2, el: 1.0, wr: .2, hand: 'grip' };
      p.expr = EXPR.calm; break;
    }
    case 'amosThrow': {
      Object.assign(p, { lean: .12, nod: 0 });
      p.aR = { fl: 1.45, abd: .1, el: .15, wr: .1, hand: 'open' }; p.aL = { fl: .4, abd: .2, el: 1.0, wr: .2, hand: 'grip' };
      p.L = { hip: .3, abd: .1, knee: .2, ankle: 0 }; p.R = { hip: -.2, abd: .08, knee: .1, ankle: .1 };
      p.expr = EXPR.calm; break;
    }
    case 'amosTip': {
      Object.assign(p, { lean: .1, nod: .16 });
      p.aR = { fl: 2.25, abd: .7, el: 1.85, wr: .3, hand: 'grip' }; p.aL = { fl: -.05, abd: .12, el: .35, wr: .1, hand: 'relax' };
      p.expr = { ...EXPR.calm, smile: .35, hatUp: .2, hatTilt: -.2 }; break;
    }
    case 'walk': { const w = walkPose(k); w.expr = EXPR.deadpan; return w; }
    default: break;
  }
  return p;
}
export { mixPose };
