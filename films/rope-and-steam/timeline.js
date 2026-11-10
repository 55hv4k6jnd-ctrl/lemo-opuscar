// ROPE & STEAM — tempo grid: the single source of truth for picture, score, mix and cue check.
// Photoplay cue-sheet sections; each starts where the previous one ends; beats are in that section's tempo.
export const FPS = 24;

// [name, bpm, beats, cue-sheet mood]
const SECS = [
  ['OPEN',   104, 16,  'cold open: Scherzando (Josie ropes herself)'],
  ['TITLE',   72, 8,   'Maestoso: the Rope theme'],
  ['LESSON',  96, 20,  'Pastorale: Grandpa\'s lazy throw'],
  ['CARD1',   96, 9,   'narration card: "Slow hands"'],
  ['GATE',   104, 22,  'Sneaking: the calf walks out'],
  ['CARD2',  152, 7,   'shout card: tremolo'],
  ['CHASE',  152, 40,  'Hurry / galop'],
  ['BISON',   84, 26,  'Misterioso → comic: the bull'],
  ['CARD3',   66, 6,   'narration card: the basin'],
  ['BASIN',   66, 13,  'Misterioso: whole-tone steam'],
  ['CRACK',   96, 10,  'Agitato: the crust cracks'],
  ['SIL',     60, 2,   'SILENCE (projector only)'],
  ['CARD4',   60, 2.5, 'tender card "Slow hands." (still silent)'],
  ['THROW',   72, 18,  'Maestoso: the catch and the eruption'],
  ['HOME',    63, 18,  'Tenderly (3/4): sunset at the ranch'],
  ['FADE',    63, 6,   'fade to black on the wide; one held chord'],
  ['END',     63, 6,   'The End; curtains close, film runs out'],
];

export const SEC = {};
let t = 0;
for (const [name, bpm, beats, mood] of SECS) {
  const beat = 60 / bpm, dur = beat * beats;
  SEC[name] = { name, bpm, beats, beat, t0: t, t1: t + dur, dur, mood };
  t += dur;
}
export const DUR = +t.toFixed(4);
export const at = (name, b = 0) => SEC[name].t0 + b * SEC[name].beat;
export const secAt = tt => { for (const k in SEC) if (tt < SEC[k].t1) return SEC[k]; return SEC.END; };

// Named hits: the picture lands on these, the score writes to them (cuecheck compares them).
export const HIT = {
  open:       at('OPEN', 0),
  loopDrop:   at('OPEN', 5),        // her own loop drops over her hat and arms
  sitDown:    at('OPEN', 7),        // she sits down hard
  title:      at('TITLE', 0),
  lesson:     at('LESSON', 0),
  gThrow:     at('LESSON', 10),     // Grandpa lets the loop go
  gLand:      at('LESSON', 12),     // it settles over the fence post
  gTug:       at('LESSON', 13),
  card1:      at('CARD1', 0),
  gate:       at('GATE', 0),
  latch:      at('GATE', 6),        // the latch slips, the gate swings with her on it
  calfOut:    at('GATE', 8),        // Biscuit tiptoes out behind her
  hopOff:     at('GATE', 15),
  turn:       at('GATE', 17),
  take:       at('GATE', 18),       // double take
  card2:      at('CARD2', 0),
  chase:      at('CHASE', 0),
  hop:        at('CHASE', 20),      // the calf bounds over a sage bush; she stumbles through it
  bison:      at('BISON', 0),
  bump:       at('BISON', 8),       // she runs smack into the bull's flank
  headTurn:   at('BISON', 10),
  hatLift:    at('BISON', 13),      // polite hat lift
  snort:      at('BISON', 16),
  look:       at('BISON', 22),      // half iris: she glances at us
  card3:      at('CARD3', 0),
  basin:      at('BASIN', 0),
  arrive:     at('BASIN', 8),
  crack:      at('CRACK', 1),       // the crust cracks under the calf
  whirl:      at('CRACK', 3),       // she starts to whirl fast…
  stop:       at('CRACK', 8),       // …and stops herself
  silence:    at('SIL', 0),
  card4:      at('CARD4', 0),
  throw:      at('THROW', 0),
  release:    at('THROW', 4),       // one slow twirl, then she lets it go (still silent)
  catch:      at('THROW', 5.5),     // the loop lands round the calf: first sound after the silence
  haul:       at('THROW', 6.5),
  erupt:      at('THROW', 8),       // the geyser goes
  column:     at('THROW', 10),
  home:       at('HOME', 0),
  postThrow:  at('HOME', 9),        // she ropes the fence post, slow and sure
  postLand:   at('HOME', 10.5),
  gHat:       at('HOME', 12),       // Grandpa tips his hat to her
  jHat:       at('HOME', 14),       // she tips hers back…
  hatFall:    at('HOME', 15.5),     // …and it slides over her eyes
  fade:       at('FADE', 0),
  end:        at('END', 0),
  curtainOut: at('END', 3),
};
