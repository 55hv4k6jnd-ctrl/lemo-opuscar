"""Original photoplay score for ROPE & STEAM — a cinema upright piano playing to a cue sheet.
Scherzando (cold open) → Maestoso title (the Rope theme) → Pastorale → Sneaking → Agitato → Hurry → Misterioso (the bull)
→ whole-tone Basin → Agitato (the crack) → SILENCE (nine seconds: projector only) → the catch (rolled chord) →
Maestoso eruption → Tenderly waltz (the Rope theme in 3/4) → one held chord. The piano does every sound effect.
All timings come from ../timeline.json. Outputs: score.wav, score.json (sync keys), CREDITS_music.txt"""
import sys, os, json
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(HERE, '../../..'))
sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR

S.seed(1926)
TL = json.load(open(os.path.join(HERE, '../timeline.json')))
SEC, HIT, DUR = TL['SEC'], TL['HIT'], TL['DUR']
def at(name, b=0.0): return SEC[name]['t0'] + b * SEC[name]['beat']
def bt(name): return SEC[name]['beat']

EV, KEYS = [], {}
P = 'upright'
def n(t, p, d, v=.6, pan=0.): EV.append((t, P, p, d, v, pan))
def chord(t, ps, d, v=.6, pan=0., roll=0.):
    for i, p in enumerate(ps): n(t + i * roll, p, d, v * (1 - .04 * i), pan)
def key(name, t=None): KEYS[name] = round(HIT[name] if t is None else t, 4)
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
def m2n(m): return NAMES[m % 12] + str(m // 12 - 1)
def midi(p): return int(round(S.midi(p)))
WHITE = [0, 2, 4, 5, 7, 9, 11]
def gliss(t, p0, p1, d, v0=.5, v1=.7):
    a, b = midi(p0), midi(p1); step = 1 if b > a else -1
    ns = [m for m in range(a, b + step, step) if m % 12 in WHITE]
    for i, m in enumerate(ns): u = i / max(1, len(ns) - 1); n(t + u * d, m2n(m), .25, v0 + (v1 - v0) * u, (u - .5) * .4)
def trem(t, ps, d, rate=14, v=.5, cres=0.):
    k, tt = 0, t
    while tt < t + d - 1e-6:
        for p in ps[k % 2]: n(tt, p, 1.2 / rate, v + cres * (tt - t) / d, 0)
        tt += 1 / rate; k += 1
def stride(name, b0, b1, bass, chords, v=.45):
    B, b = bt(name), b0
    while b < b1 - 1e-6:
        i = int(round(b - b0)); n(at(name, b), bass[i % len(bass)], B * .45, v, -.25); chord(at(name, b + .5), chords[i % len(chords)], B * .35, v * .7, -.1); b += 1
def mel(name, b0, notes, v=.55, pan=.15, oct=False):
    for b, p, l in notes:
        n(at(name, b0 + b), p, l * bt(name) * .95, v, pan)
        if oct: n(at(name, b0 + b), m2n(midi(p) - 12), l * bt(name) * .95, v * .7, pan)
def twirlfig(t0, t1, rate, notes, v=.42):
    """the rope going round: a circling arpeggio"""
    tt, k = t0, 0
    while tt < t1 - 1e-6: n(tt, notes[k % len(notes)], 1.4 / rate, v + .08 * (k % len(notes) == 0), .2); tt += 1 / rate; k += 1

# the Rope theme (G major): a rising sixth (the loop going out), a turn, a settle — original
ROPE = [(0, 'D4', .5), (.5, 'B4', 1), (1.5, 'A4', .5), (2, 'G4', .5), (2.5, 'A4', .5), (3, 'B4', 1), (4, 'D5', 1.5), (5.5, 'C5', .5), (6, 'B4', .5), (6.5, 'A4', .5), (7, 'G4', 1)]

# ---------------- OPEN · Scherzando: far too fast ----------------
key('open'); B = bt('OPEN')
twirlfig(at('OPEN', .3), at('OPEN', 4.3), 11, ['G4', 'B4', 'D5', 'G5', 'D5', 'B4'], .4)
stride('OPEN', 0, 4, ['G2', 'D2'], [['B3', 'D4', 'G4']], .4)
gliss(at('OPEN', 4.3), 'G4', 'G6', B * .5, .45, .65)                       # the loop flies straight up…
key('loopDrop'); gliss(at('OPEN', 4.8), 'G6', 'G4', B * .25, .65, .5); chord(at('OPEN', 5), ['G2', 'Ab2', 'A2', 'Bb2'], .4, .7, -.2); chord(at('OPEN', 5), ['Db5', 'G5'], .3, .62, .2)   # …and drops on her
trem(at('OPEN', 5.2), [['F#4', 'C5'], ['A4', 'Eb5']], B * 1.6, 15, .32)     # the wobble
key('sitDown'); chord(at('OPEN', 7), ['G1', 'D2'], .3, .8, -.3); n(at('OPEN', 7.3), 'G2', .2, .45, -.2)      # a low 'boing'
# sulky little stride in G minor; Grandpa shakes his head (two grace notes, 'tsk tsk')
stride('OPEN', 8, 16, ['G2', 'D2', 'Eb2', 'D2'], [['Bb3', 'D4', 'G4'], ['Bb3', 'D4', 'G4'], ['C4', 'Eb4', 'G4'], ['A3', 'C4', 'F#4']], .32)
mel('OPEN', 8, [(0, 'D5', 1), (1, 'Bb4', .5), (1.5, 'A4', .5), (2, 'G4', 2)], .4)
for k, b in enumerate([11.5, 12.5]): n(at('OPEN', b) - .05, 'F#6', .08, .32, .3); n(at('OPEN', b), 'G6', .3, .38, .3)
n(at('OPEN', 14), 'D4', .4, .4, .1)                                          # pickup into the title

# ---------------- TITLE · Maestoso ----------------
key('title'); B = bt('TITLE')
mel('TITLE', 0, ROPE, .66, .15, oct=True)
for b, ch, bs in [(0, ['B3', 'D4', 'G4'], 'G1'), (2, ['C4', 'E4', 'G4'], 'C2'), (4, ['B3', 'D4', 'G4'], 'G1'), (5.5, ['A3', 'D4', 'F#4'], 'D2'), (7, ['B3', 'D4', 'G4'], 'G1')]:
    chord(at('TITLE', b), ch, B * 1.6, .5, -.1, roll=.015); chord(at('TITLE', b), [bs, m2n(midi(bs) + 12)], B * 1.8, .6, -.3)

# ---------------- LESSON · Pastorale ----------------
key('lesson'); B = bt('LESSON')
stride('LESSON', 0, 10, ['G2', 'D2', 'C2', 'D2'], [['B3', 'D4', 'G4'], ['B3', 'D4', 'G4'], ['C4', 'E4', 'G4'], ['A3', 'C4', 'F#4']], .36)
mel('LESSON', 1, ROPE, .44)
# the lazy twirl: a slow circling arpeggio, then the throw: an unhurried rising run, the post: a rolled chord
twirlfig(at('LESSON', 6), at('LESSON', 10), 4, ['G5', 'B5', 'D6', 'B5'], .3)
key('gThrow'); gliss(at('LESSON', 10), 'D4', 'D6', B * 2 - .05, .35, .55)
key('gLand'); chord(at('LESSON', 12), ['G2', 'D3', 'B3', 'G4', 'D5', 'G5'], B * 3, .55, 0, roll=.03)
key('gTug'); n(at('LESSON', 13) - .05, 'F#6', .08, .4, .3); n(at('LESSON', 13), 'G6', .4, .45, .3)
stride('LESSON', 14, 20, ['G2', 'D2', 'C2', 'D2', 'G2', 'D2'], [['B3', 'D4', 'G4'], ['B3', 'D4', 'G4'], ['C4', 'E4', 'G4'], ['A3', 'C4', 'F#4'], ['B3', 'D4', 'G4'], ['A3', 'C4', 'F#4']], .32)
mel('LESSON', 14, [(0, 'B4', 1), (1, 'A4', 1), (2, 'G4', 2), (4, 'A4', 1), (5, 'D5', 1)], .38)

# ---------------- CARD1 · narration: the theme, soft ----------------
key('card1'); B = bt('CARD1')
for b, ch, bs in [(0, ['B3', 'D4', 'G4'], 'G2'), (3, ['C4', 'E4', 'A4'], 'A2'), (6, ['A3', 'C4', 'D4', 'F#4'], 'D2')]:
    chord(at('CARD1', b), ch, B * 3, .3, -.1, roll=.04); n(at('CARD1', b), bs, B * 3, .34, -.3)
mel('CARD1', 0, [(0, 'D5', 1.5), (1.5, 'B4', .5), (2, 'G4', 1), (3, 'E5', 1.5), (4.5, 'C5', .5), (5, 'A4', 1), (6, 'F#4', 1.5), (7.5, 'A4', .5), (8, 'D4', 1)], .36)

# ---------------- GATE · Sneaking ----------------
key('gate'); B = bt('GATE')
for b in range(0, 6): n(at('GATE', b), ['G2', 'D2'][b % 2], B * .4, .3, -.25); chord(at('GATE', b + .5), ['Bb3', 'D4', 'G4'], B * .3, .22, -.1)   # sulking
mel('GATE', 0, [(0, 'G4', 2), (2, 'F#4', 1), (3, 'G4', 3)], .3)
key('latch'); n(at('GATE', 6), 'B5', .5, .45, .3); n(at('GATE', 6), 'C6', .5, .45, .3)                    # the latch: a creaking minor second
gliss(at('GATE', 6.3), 'C6', 'E5', B * 2.5, .3, .35)                                                   # the slow swing
key('calfOut')
for i in range(12): m = midi('E2') + i; n(at('GATE', 8 + i * .5), m2n(m), B * .3, .38, -.25); n(at('GATE', 8 + i * .5 + .25), m2n(m + 24), B * .15, .28, .25)   # chromatic creep, tiptoe
key('hopOff'); chord(at('GATE', 15), ['D2', 'D3'], .25, .5, -.2)
key('turn'); tt = at('GATE', 17)
while tt < at('GATE', 18) - .03: n(tt, 'C5', .1, .35, .2); n(tt + .06, 'Db5', .1, .35, .2); tt += .12        # nervous trill
key('take'); chord(at('GATE', 18), ['C#2', 'G2'], 1.0, .85, -.3); chord(at('GATE', 18), ['A#4', 'C#5', 'E5', 'G5'], .2, .85, .2)
trem(at('GATE', 18.3), [['A#4', 'E5'], ['C#5', 'G5']], at('GATE', 22) - at('GATE', 18.3), 14, .35, .15)

# ---------------- CARD2 · the shout ----------------
key('card2'); B = bt('CARD2')
trem(at('CARD2'), [['E4', 'A#4', 'E5'], ['G4', 'C#5', 'G5']], SEC['CARD2']['dur'] * .95, 16, .55, .1)
for i in range(7): n(at('CARD2', i), 'E1' if i % 2 == 0 else 'E2', .2, .62, -.3)

# ---------------- CHASE · Hurry (E minor, 152) ----------------
key('chase'); B = bt('CHASE')
RUN = ['E5', 'F#5', 'G5', 'A5', 'B5', 'A5', 'G5', 'F#5', 'G5', 'A5', 'B5', 'C6', 'B5', 'A5', 'G5', 'F#5']
BASS = ['E2', 'B1', 'E2', 'B1', 'C2', 'G1', 'B1', 'F#1']; CHS = [['E3', 'G3', 'B3'], ['E3', 'G3', 'B3'], ['E3', 'G3', 'C4'], ['D#3', 'F#3', 'B3']]
def hurry(b0, b1, v=.48):
    b, i = b0, 0
    while b < b1 - 1e-6:
        bi = int(b); n(at('CHASE', b), BASS[bi % 8], B * .4, v, -.3); chord(at('CHASE', b + .5), CHS[(bi // 2) % 4], B * .3, v * .7, -.1)
        for q in range(4):
            p = RUN[(i + q) % 16]; n(at('CHASE', b + q * .25), p, B * .24, v * (.82 + .18 * (q == 0)), .2)
            if (bi // 8) % 2: n(at('CHASE', b + q * .25), m2n(midi(p) - 12), B * .22, v * .5, .25)
        i += 4; b += 1
hurry(0, 18.6)
key('hop'); gliss(at('CHASE', 18.8), 'E4', 'E6', at('CHASE', 20) - at('CHASE', 18.8), .45, .7); chord(at('CHASE', 20), ['B5', 'E6'], .2, .6, .2)
# the stumble: a cluster as she crashes through the bush, then the Hurry picks up again
chord(at('CHASE', 21), ['E1', 'F1', 'F#1', 'G1', 'E2'], .5, .85, -.3); gliss(at('CHASE', 21.1), 'C6', 'C4', B * .8, .55, .4)
hurry(23, 40, .5)

# ---------------- BISON · Misterioso → comic ----------------
key('bison'); B = bt('BISON')
trem(at('BISON', 0), [['E1', 'B1'], ['G1', 'C2']], B * 7.8, 12, .3, .1)                                   # the herd: low rumbling tremolo
for b in range(0, 8, 2): n(at('BISON', b), 'E3', B * 1.5, .3, .1)
key('bump'); chord(at('BISON', 8), ['C1', 'C#1', 'D1', 'D#1', 'E1', 'C2'], .8, .9, -.3); chord(at('BISON', 8), ['F5', 'F#5', 'G5'], .2, .7, .25)
key('headTurn')
for i in range(8): n(at('BISON', 10 + i * .25), m2n(midi('E1') + i), B * .4, .42, -.3)                   # the slow turn: chromatic creep up
key('hatLift'); n(at('BISON', 13), 'E6', .25, .5, .2); n(at('BISON', 14), 'C6', .5, .42, .2)                # 'plink … plonk' (politely)
key('snort'); chord(at('BISON', 16), ['E1', 'F1', 'B1'], .6, .85, -.3); gliss(at('BISON', 16.1), 'B5', 'B3', B * .7, .55, .4)
for i, p in enumerate(['E2', 'B1', 'C2', 'B1', 'E2', 'B1', 'C2', 'B1', 'E2', 'B1']): n(at('BISON', 17 + i * .5), p, .3, .45, -.3)   # the bull plods on
key('look'); n(at('BISON', 22) - .06, 'D7', .1, .32, .3); n(at('BISON', 22), 'E7', .5, .4, .3)              # the look: a grace-note wink
trem(at('BISON', 22.6), [['E4', 'G4'], ['F#4', 'A4']], B * 1.8, 10, .2)
twirlfig(at('BISON', 24.6), at('BISON', 26), 9, ['E5', 'G5', 'B5', 'E6'], .35)

# ---------------- CARD3 / BASIN · whole-tone steam ----------------
key('card3'); B = bt('CARD3')
WT = ['C4', 'D4', 'E4', 'F#4', 'G#4', 'A#4', 'C5']
n(at('CARD3'), 'C2', SEC['CARD3']['dur'] + SEC['BASIN']['dur'], .3, -.3)
for i in range(12): n(at('CARD3', i * .5), WT[i % 7], B, .26, .1)
key('basin'); B = bt('BASIN')
for i in range(26): p = WT[(i * 3) % 7]; n(at('BASIN', i * .5), m2n(midi(p) + (12 if i % 4 == 3 else 0)), B * 1.2, .24 + .02 * (i % 3), .15)
for b in (0, 4, 8): chord(at('BASIN', b), ['C3', 'E3', 'G#3'], B * 4, .22, -.15, roll=.05)
key('arrive'); chord(at('BASIN', 8), ['F#3', 'A#3', 'C4', 'E4'], B * 4, .32, 0, roll=.06)

# ---------------- CRACK · Agitato, then a dead stop ----------------
key('crack'); B = bt('CRACK')
chord(at('CRACK', 1), ['E5', 'F5'], .12, .75, .3); chord(at('CRACK', 1), ['C1', 'C2'], .6, .7, -.3)
trem(at('CRACK', 1.3), [['C2', 'F#2'], ['A1', 'D#2']], at('CRACK', 8) - at('CRACK', 1.3), 16, .3, .35)
trem(at('CRACK', 1.3), [['C4', 'F#4'], ['D#4', 'A4']], at('CRACK', 8) - at('CRACK', 1.3), 16, .22, .32)
key('whirl'); twirlfig(at('CRACK', 3), at('CRACK', 8), 12, ['C5', 'D#5', 'F#5', 'A5', 'F#5', 'D#5'], .38)
key('stop'); chord(at('CRACK', 8), ['C1', 'F#1', 'C2'], .3, .8, -.3); chord(at('CRACK', 8), ['A#4', 'C5', 'F#5'], .18, .7, .2)
# SIL, CARD4 and the first beats of THROW: true silence — the projector alone
# (no sync keys here: nothing plays)

# ---------------- THROW · the catch, the eruption ----------------
B = bt('THROW')
key('catch'); chord(at('THROW', 5.5), ['G1', 'D2', 'G2', 'B2', 'D3', 'G3', 'B3', 'D4', 'G4'], B * 2.5, .62, 0, roll=.035)
key('haul'); trem(at('THROW', 6.5), [['G1', 'D2'], ['A1', 'E2']], at('THROW', 8) - at('THROW', 6.5), 14, .35, .3)
key('erupt'); gliss(at('THROW', 8), 'G2', 'G6', B * 2 - .05, .5, .78); chord(at('THROW', 8), ['G1', 'G2'], B * 2, .7, -.3)
key('column')
mel('THROW', 10, [(0, 'B4', 1), (1, 'A4', .5), (1.5, 'G4', .5), (2, 'A4', .5), (2.5, 'B4', .5), (3, 'D5', 1.5), (4.5, 'C5', .5), (5, 'B4', .5), (5.5, 'A4', .5), (6, 'G4', 2)], .7, .15, oct=True)
for b, ch, bs in [(10, ['B3', 'D4', 'G4'], 'G1'), (12, ['C4', 'E4', 'G4'], 'C2'), (13, ['B3', 'D4', 'G4'], 'G1'), (14.5, ['A3', 'D4', 'F#4'], 'D2'), (16, ['B3', 'D4', 'G4'], 'G1')]:
    chord(at('THROW', b), ch, B * 1.5, .52, -.1, roll=.012); chord(at('THROW', b), [bs, m2n(midi(bs) + 12)], B * 1.8, .62, -.3)

# ---------------- HOME · Tenderly (3/4 waltz: the Rope theme, slow) ----------------
key('home'); B = bt('HOME')
WAL = [(0, ['G2'], ['B3', 'D4']), (3, ['C2'], ['C4', 'E4']), (6, ['G2'], ['B3', 'D4']), (9, ['D2'], ['A3', 'C4', 'F#4']), (12, ['G2'], ['B3', 'D4']), (15, ['C2'], ['C4', 'E4'])]
for b0, bs, ch in WAL:
    n(at('HOME', b0), bs[0], B * .9, .32, -.25); chord(at('HOME', b0 + 1), ch, B * .5, .22, -.1); chord(at('HOME', b0 + 2), ch, B * .5, .2, -.1)
mel('HOME', 0, [(0, 'D4', 1), (1, 'B4', 2), (3, 'A4', 1), (4, 'G4', 1), (5, 'A4', 1), (6, 'B4', 3)], .4)
key('postThrow'); gliss(at('HOME', 9), 'G4', 'G5', B * 1.4, .3, .45)
key('postLand'); chord(at('HOME', 10.5), ['G3', 'B3', 'D4', 'G4', 'B4'], B * 1.8, .42, 0, roll=.04)
key('gHat'); n(at('HOME', 12) - .06, 'F#5', .1, .3, .2); n(at('HOME', 12), 'G5', .6, .38, .2)
key('jHat'); n(at('HOME', 14) - .06, 'F#6', .1, .3, .3); n(at('HOME', 14), 'G6', .6, .36, .3)
key('hatFall'); n(at('HOME', 15.5), 'C6', .15, .4, .3); n(at('HOME', 15.5), 'Db6', .15, .4, .3)
for i, p in enumerate(['G5', 'D5', 'B4']): n(at('HOME', 15.8 + i * .35), p, .4, .34 - i * .04, .2)
chord(at('HOME', 17), ['G2', 'D3', 'B3', 'G4'], B * 1.2, .3, 0, roll=.05)

# ---------------- FADE / END · one held chord, then the runout ----------------
key('fade'); chord(at('FADE', 0), ['G1', 'G2', 'D3', 'B3', 'D4', 'G4', 'B4'], SEC['FADE']['dur'] + .5, .42, 0, roll=.05)
key('end'); chord(at('END', 0), ['G2', 'D3', 'G3'], 3.5, .28, -.1); chord(at('END', 0), ['B4', 'D5', 'G5'], 3.5, .26, .2, roll=.04)

mix = S.render(EV, dur=DUR + 2)
mix = S.room(mix, size=.28, mix=.14)            # a small picture house
mix = mix[:int(round(DUR * SR))]
# the chord at 'stop' is cut short so the silence is real
tt = np.arange(len(mix)) / SR
pts = [(0, 0), (HIT['stop'] + .25, 0), (HIT['stop'] + .7, -60), (HIT['catch'] - .02, -60), (HIT['catch'], 0), (DUR + 1, 0)]
gdb = np.interp(tt, [p[0] for p in pts], [p[1] for p in pts])
mix = (mix * (10 ** (gdb / 20))[:, None]).astype(np.float32)
sf.write(os.path.join(HERE, 'score.wav'), mix, SR)
json.dump({'keys': KEYS}, open(os.path.join(HERE, 'score.json'), 'w'), indent=1)
open(os.path.join(HERE, 'CREDITS_music.txt'), 'w').write('\n'.join(S.credits([P])) + '\n')
print('score.wav', round(len(mix) / SR, 2), 's, events', len(EV), 'peak', round(float(np.abs(mix).max()), 3))
