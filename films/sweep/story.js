// SWEEP — the timeline (single source of truth): shots, voice lines (placed from the real TTS durations), music cues.
import DURS from './voices_fx/dur.json' with { type: 'json' };
import LINES from './lines.json' with { type: 'json' };

// shots: [id, start s]; each runs until the next one starts
export const SHOTS = [
  ['open', 0], ['seasons', 12], ['demons', 30], ['king', 50], ['days', 62], ['pond', 86], ['bloom', 106], ['flee', 124],
  ['alone', 145], ['child', 160], ['path', 201], ['silence', 216], ['sweep', 223], ['dawn', 236], ['name', 259], ['back', 292], ['sign', 306],
];
export const DUR = 322;
export const shotAt = t => { let s = SHOTS[0]; for (const x of SHOTS) if (t >= x[1]) s = x; const i = SHOTS.indexOf(s); return { id: s[0], t0: s[1], t1: i + 1 < SHOTS.length ? SHOTS[i + 1][1] : DUR }; };
export const T0 = Object.fromEntries(SHOTS);

// earliest start of each line (the picture's beat); a line never starts before the previous one has ended + gap
const AT = {
  '01': 4, '02': 13.5, '03': 31, '04': 36, '05': 44.5, '06': 52.5, '07': 57, '08': 63.5, '09': 70.5, '10': 78, '11': 88, '12': 96.5,
  '13': 108.5, '14': 126, '15': 131, '16': 138.5, '17': 147, '18': 154, '19': 161.5, '20': 167, '21': 174, '22': 177.5, '23': 185, '24': 190.5,
  '25': 202, '26': 210, '27': 238, '28': 244, '29': 260, '30': 264, '31': 268.5, '32': 272, '33': 277, '34': 280.5, '35': 283.5, '36': 288,
  '37': 293, '38': 297, '39': 299.5, '40': 311,
};
export const VO = [];
{ let end = 0; for (const l of LINES) { const t0 = Math.max(AT[l.id], end + .45), d = DURS[l.id]; VO.push({ id: l.id, role: l.role, text: l.text, t0, t1: t0 + d, sub: [t0 - .1, t0 + Math.max(1.8, d + .6)] }); end = t0 + d; } }

// story beats the picture and the sound both use
export const T = {
  stroke: 1.0, title: 6.5, kingShout: VO.find(v => v.id === '06').t0, storm: 107, thunder1: 113, kingRun: 127,
  childCry: 155, monster: VO.find(v => v.id === '23').t0, decide: VO.find(v => v.id === '26').t1, silence0: 216, grip: 219.5,
  sweep: 223.4, sweepEnd: 224.1, dawn: 236, name: VO.find(v => v.id === '33').t0, kingBack: VO.find(v => v.id === '38').t0,
  sign0: 307, sign1: 312.5, seal: 314, wave: 316, end: 322,
};
