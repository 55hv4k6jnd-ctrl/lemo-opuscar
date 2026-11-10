"""SWEEP — original score + foley + voice mix → out/mix.wav (48 kHz stereo).
Score: a late-80s fantasy-OVA palette synthesised in numpy — FM electric piano, string pad, synth brass, FM bells,
slap-ish bass, drum machine with gated snare, big toms, an analog arpeggio; the imp's theme returns changed
(bright brass title → bell lullaby at the pond → full chorus with a semitone lift at the sweep → slow e-piano at the name).
One beat (here: one second) of true silence before the sweep. Voices: Kokoro (voices_fx/), ducked music ~9 dB.
Run: .venv/bin/python films/sweep/mix.py   (needs events.json from core/render/events.mjs)"""
import os, json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve
D = os.path.dirname(os.path.abspath(__file__))
SR = 48000
EV = json.load(open(os.path.join(D, 'events.json')))
DUR = EV['dur']; EVS = EV['ev']; N = int(round(DUR * SR))
rng = np.random.default_rng(1988)
BEAT = {e['id']: e['t'] for e in EVS if e['type'] == 'beat'}
SHOT = {e['id']: e['t'] for e in EVS if e['type'] == 'shot'}
def sos(kind, f, o=2): return butter(o, f, kind, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(sos('low', f, o), x, axis=0)
def hp(x, f, o=2): return sosfilt(sos('high', f, o), x, axis=0)
def bp(x, lo, hi, o=2): return sosfilt(sos('band', [lo, hi], o), x, axis=0)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)
NM = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
def m(p):
    n = NM[p[0]]; i = 1
    if p[i] in '#b': n += 1 if p[i] == '#' else -1; i += 1
    return n + 12 * (int(p[i:]) + 1)
def ts(n): return np.arange(n) / SR
mus = np.zeros((N, 2)); fol = np.zeros((N, 2)); amb = np.zeros((N, 2))
def put(buf, x, t, g=1., pan=0.):
    s = int(t * SR)
    if s >= N or s + len(x) <= 0: return
    if s < 0: x = x[-s:]; s = 0
    e = min(N, s + len(x)); x = x[:e - s]
    buf[s:e, 0] += x * g * np.sqrt(.5 * (1 - pan)); buf[s:e, 1] += x * g * np.sqrt(.5 * (1 + pan))
def env(n, a, r, sus=1.):
    t = ts(n); e = np.minimum(1, t / max(a, 1e-4)); tail = int(r * SR)
    if tail and n > tail: e[-tail:] *= np.linspace(1, 0, tail) ** 2
    return e * sus

# ---------------- instruments ----------------
def epiano(f, d, v=.5):           # FM electric piano: 1:1 carrier + a 14:1 bell transient
    n = int((d + 1.2) * SR); t = ts(n)
    i1 = 1.6 * np.exp(-t * 2.5); i2 = 3 * np.exp(-t * 18)
    x = np.sin(2 * np.pi * f * t + i1 * np.sin(2 * np.pi * f * t) + i2 * np.sin(2 * np.pi * f * 14 * t))
    return x * np.exp(-t * 1.6) * env(n, .003, .3) * v
def bell(f, d, v=.4):
    n = int((d + 2) * SR); t = ts(n)
    return np.sin(2 * np.pi * f * t + 2.2 * np.exp(-t * 3) * np.sin(2 * np.pi * f * 3.5 * t)) * np.exp(-t * 1.3) * v
def pad(f, d, v=.25, a=.8):
    n = int((d + 1.5) * SR); t = ts(n); x = 0
    for det in (-.08, 0, .07): x = x + np.sign(np.sin(2 * np.pi * f * (1 + det / 100) * t)) * .2 + np.sin(2 * np.pi * f * 2 * (1 + det / 120) * t) * .3
    x = lp(x, 2200); return x * env(n, a, 1.2) * v
def brass(f, d, v=.4):
    n = int((d + .3) * SR); t = ts(n); ph = np.cumsum(np.full(n, f) * (1 + .004 * np.sin(2 * np.pi * 5.5 * t))) / SR
    x = (2 * (ph % 1) - 1) + .6 * (2 * ((ph * 1.005) % 1) - 1)
    cut = 600 + 3800 * np.minimum(1, t / .06) * np.exp(-t * 1.5)
    y = np.zeros(n); seg = 2400
    for i in range(0, n, seg): y[i:i + seg] = lp(x[i:i + seg], float(min(15000, cut[i])))
    return y * env(n, .02, .15) * v
def bass(f, d, v=.5):
    n = int((d + .2) * SR); t = ts(n)
    x = np.sin(2 * np.pi * f * t) + .5 * np.sin(4 * np.pi * f * t) * np.exp(-t * 8) + .3 * np.sign(np.sin(2 * np.pi * f * t)) * np.exp(-t * 20)
    return x * np.exp(-t * 2.2) * env(n, .004, .08) * v
def kick(v=.8):
    n = int(.35 * SR); t = ts(n); f = 50 + 120 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * v
def snare(v=.5):                  # gated-reverb snare
    n = int(.32 * SR); t = ts(n); x = bp(rng.standard_normal(n), 900, 6000) * (np.exp(-t * 14) + .35 * (t < .22)) + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    return x * env(n, .001, .02) * v
def hat(v=.15): n = int(.06 * SR); t = ts(n); return hp(rng.standard_normal(n), 7000) * np.exp(-t * 60) * v
def tom(f=110, v=.7): n = int(.6 * SR); t = ts(n); fr = f * (1 + .6 * np.exp(-t * 18)); return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 5) * v

THEME = [('D5', 1), ('F#5', .5), ('A5', .5), ('B5', 1), ('A5', .5), ('F#5', .5), ('E5', 1), ('D5', 1), ('B4', .5), ('D5', .5), ('E5', 1), ('F#5', .5), ('E5', .5), ('D5', 2)]
PROG = [['G3', 'B3', 'D4', 'F#4'], ['A3', 'C#4', 'E4', 'G4'], ['F#3', 'A3', 'C#4', 'E4'], ['B3', 'D4', 'F#4', 'A4']]   # IVM7 V7 iii7 vi7
BASSN = ['G2', 'A2', 'F#2', 'B1']
def theme(t0, bpm, inst, v, shift=0, oct=0, pan=.15):
    b = 60 / bpm; tt = t0
    for p, l in THEME: mus_add(inst(mtof(m(p) + shift + 12 * oct), l * b * .95, v), tt, pan); tt += l * b
    return tt
def mus_add(x, t, pan=0., g=1.): put(mus, x, t, g, pan)
def chords(t0, t1, bpm, v=.22, shift=0, inst=None, perbar=1):
    b = 60 / bpm; bar = 4 * b; i = 0; tt = t0
    while tt < t1 - .05:
        ch = PROG[i % 4]; d = min(bar, t1 - tt)
        for k, p in enumerate(ch): mus_add((inst or pad)(mtof(m(p) + shift), d, v), tt + k * .004, (k - 1.5) * .25)
        i += 1; tt += bar
def groove(t0, t1, bpm, v=1., shift=0, drums=True, bassline=True, ep=True):
    b = 60 / bpm; bar = 4 * b; i = 0; tt = t0
    while tt < t1 - .05:
        ch = PROG[i % 4]
        if bassline:
            for k, off in enumerate([0, 1.5, 2, 3, 3.5]):
                if tt + off * b < t1: mus_add(bass(mtof(m(BASSN[i % 4]) + shift + (12 if k == 2 else 0)), b * .45, .42 * v), tt + off * b, -.1)
        if ep:
            for off in (.5, 1.5, 2.5, 3.5):
                if tt + off * b < t1:
                    for k, p in enumerate(ch): mus_add(epiano(mtof(m(p) + shift), b * .4, .09 * v), tt + off * b + k * .006, (k - 1.5) * .3)
        if drums:
            for k in range(4):
                if tt + k * b >= t1: break
                if k % 2 == 0: mus_add(kick(.55 * v), tt + k * b)
                else: mus_add(snare(.32 * v), tt + k * b, .05)
                for h in (0, .5): mus_add(hat(.1 * v), tt + (k + h) * b, .3)
        i += 1; tt += bar
def arp(t0, t1, rate, notes, v=.12, pan=.2):
    tt, k = t0, 0
    while tt < t1: mus_add(lp(brass(mtof(m(notes[k % len(notes)])), .9 / rate, v), 2600), tt, pan * (1 if k % 2 else -1)); tt += 1 / rate; k += 1

S, Bt = SHOT, BEAT
# intro + title
chords(.6, 6.5, 80, .16, shift=-5, perbar=1)
for i, p in enumerate(['D5', 'F#5', 'A5', 'D6', 'A5', 'F#5', 'E5', 'A5']): mus_add(bell(mtof(m(p)), .6, .16), 1.2 + i * .62, .3)
for p in ['D3', 'A3', 'D4', 'F#4', 'A4']: mus_add(brass(mtof(m(p)), .9, .22), Bt['title'], 0)       # the title hit
mus_add(tom(90, .7), Bt['title'] - .25); mus_add(tom(70, .7), Bt['title'] - .12)
theme(Bt['title'] + .9, 132, brass, .2)
# gate routine (morning groove), the King's shout, the days
groove(12, Bt['kingShout'] - .2, 104, .9); theme(13.5, 104, bell, .14, oct=0); theme(31, 104, epiano, .16)
for p in ['D2', 'D3', 'Ab3', 'D4']: mus_add(brass(mtof(m(p)), .7, .3), Bt['kingShout'], 0)
mus_add(tom(60, .9), Bt['kingShout']); chords(Bt['kingShout'] + .6, S['days'], 70, .12, shift=-7)
groove(S['days'], S['pond'] - .5, 100, .7)
# the pond: a bell lullaby on the theme
chords(S['pond'], S['bloom'], 60, .14, shift=-2)
theme(S['pond'] + 2, 66, bell, .17)
# the storm: dark pad, toms at the thunder, a fast minor arpeggio for the flight
STORM = ['B3', 'D4', 'F#4', 'A4']
for t0 in np.arange(S['bloom'], S['alone'], 4.0): mus_add(pad(mtof(m('B2')), 4, .14), t0, -.2); mus_add(pad(mtof(m('F#3')), 4, .1), t0, .2)
for e in EVS:
    if e['type'] == 'thunder' and e['t'] < S['silence']: mus_add(tom(55, .5), e['t'] + .05); mus_add(tom(45, .45), e['t'] + .25)
arp(S['flee'], S['alone'], 8, ['B4', 'D5', 'F#5', 'B5', 'A5', 'F#5', 'D5', 'F#5'], .1)
for k in range(int((S['alone'] - S['flee']) / .577)): mus_add(kick(.45), S['flee'] + k * .577)
# alone + the child: e-piano alone, maj7 chords, soft
b = 60 / 64
for i, t0 in enumerate(np.arange(S['alone'], S['path'], 4 * b)):
    for k, p in enumerate(PROG[i % 4]): mus_add(epiano(mtof(m(p)), 3.6 * b, .11), t0 + k * .05, (k - 1.5) * .3)
# the path: a build with toms to the cut
for k in range(14): mus_add(tom(80 + k * 4, .25 + k * .03), S['path'] + 1 + k * (S['silence'] - S['path'] - 1.5) / 14)
for t0 in np.arange(S['path'], S['silence'] - 1, 3.0): mus_add(pad(mtof(m('B2')), 3, .12 + (t0 - S['path']) * .01), t0)
# SILENCE until the sweep; then the full theme, a semitone up
groove(Bt['sweep'], S['dawn'], 120, 1.15, shift=1)
for p in ['D#3', 'A#3', 'D#4', 'G4', 'A#4']: mus_add(brass(mtof(m(p)), 1.2, .32), Bt['sweep'], 0)
mus_add(kick(1), Bt['sweep']); mus_add(snare(.7), Bt['sweep'])
theme(Bt['sweep'] + .5, 120, brass, .22, shift=1); theme(Bt['sweep'] + .5, 120, bell, .1, shift=1, oct=1)
# dawn + the name: string pad, a breathy synth lead on the theme; then e-piano, slow
chords(S['dawn'], S['name'], 72, .16)
theme(S['dawn'] + 4, 72, lambda f, d, v: lp(brass(f, d, v), 1800), .16)
for i, t0 in enumerate(np.arange(S['name'], S['back'], 4 * 60 / 58)):
    for k, p in enumerate(PROG[i % 4]): mus_add(epiano(mtof(m(p)), 3.8, .1), t0 + k * .05, (k - 1.5) * .3)
for i, p in enumerate(['A5', 'D6', 'F#6', 'A6']): mus_add(bell(mtof(m(p)), 1, .14), Bt['name'] + .2 + i * .12, .3)   # "Sweep" — a sparkle
theme(S['name'] + 22, 58, epiano, .14)
# back at the gate (playful) → the end chorus, the freeze-frame hit, the last chord
groove(S['back'], S['sign'], 104, .75)
for p in ['D2', 'D3', 'Ab3']: mus_add(brass(mtof(m(p)), .5, .26), Bt['kingBack'], 0)
groove(S['sign'], Bt['seal'], 112, 1.0, shift=1); theme(S['sign'] + .3, 112, brass, .2, shift=1)
for p in ['D#3', 'A#3', 'D#4', 'G4', 'A#4', 'D#5']: mus_add(brass(mtof(m(p)), 3, .26), Bt['seal'], 0); mus_add(pad(mtof(m(p)), 6, .08), Bt['seal'])
mus_add(kick(.9), Bt['seal']); mus_add(snare(.6), Bt['seal'])
for i, p in enumerate(['D#5', 'G5', 'A#5', 'D#6', 'G6']): mus_add(bell(mtof(m(p)), 1, .12), Bt['seal'] + .4 + i * .15, .3)
# true silence: nothing from the music bus between the end of the path build and the sweep
s0, s1 = int((S['silence']) * SR), int(Bt['sweep'] * SR); mus[s0:s1] = 0

# ---------------- foley + ambience ----------------
def swish(v=.4): n = int(.35 * SR); t = ts(n); return bp(rng.standard_normal(n), 1500, 6500) * np.sin(np.pi * np.minimum(1, t / .35)) ** 2 * v
def rainbed(d): n = int(d * SR); return bp(rng.standard_normal(n), 400, 7000) * .12
def thunder(v=.8): n = int(3 * SR); t = ts(n); return lp(rng.standard_normal(n), 220) * (np.exp(-t * 1.2) * (1 + .5 * np.sin(t * 9))) * v * 3
def crickets(d): n = int(d * SR); t = ts(n); return np.sin(2 * np.pi * 4300 * t) * (np.sin(2 * np.pi * 18 * t) > .6) * (np.sin(2 * np.pi * .7 * t) > 0) * .02
def birds(d):
    x = np.zeros(int(d * SR))
    for k in range(int(d / 1.7)):
        t0 = rng.uniform(0, d - .5); n = int(.18 * SR); tt = ts(n); f = rng.uniform(2800, 4200)
        c = np.sin(2 * np.pi * (f + 900 * np.sin(2 * np.pi * 14 * tt)) * tt) * np.sin(np.pi * tt / .18) * .03
        s = int(t0 * SR); x[s:s + n] += c[:len(x) - s]
    return x
def impact(): n = int(1.6 * SR); t = ts(n); return (lp(rng.standard_normal(n), 300) * 3 * np.exp(-t * 3) + np.sin(2 * np.pi * 45 * t) * np.exp(-t * 2.5)) * .6
def power_on(): n = int(.7 * SR); t = ts(n); return (np.sin(2 * np.pi * 15734 * t) * .02 + lp(rng.standard_normal(n), 120) * np.exp(-t * 12) * .8) * np.exp(-t * 2)
put(fol, power_on(), 0)
for e in EVS:
    if e['type'] == 'sweep': put(fol, swish(.28), e['t'], 1, .2)
    if e['type'] == 'thunder' and e['t'] < S['silence']: put(amb, thunder(.6), e['t'] + .15)
put(fol, impact(), Bt['sweep'])
put(fol, bp(rng.standard_normal(int(1.2 * SR)), 300, 4000) * np.linspace(0, 1, int(1.2 * SR)) ** 2 * .4, Bt['sweep'] - 1.2)   # the riser into the stroke
put(amb, birds(S['king'] - 1), 1); put(amb, birds(S['pond'] - S['days']), S['days']); put(amb, birds(S['back'] - S['dawn']), S['dawn']); put(amb, birds(DUR - S['back']), S['back'])
put(amb, crickets(S['bloom'] - S['pond']), S['pond'])
rb = rainbed(S['silence'] - S['bloom'] + 1); rb *= np.minimum(1, ts(len(rb)) / 4)[:] ; rb[-int(.8 * SR):] *= np.linspace(1, 0, int(.8 * SR))
put(amb, rb, S['bloom'])
rs = rainbed(Bt['sweep'] - 1 - S['silence']) * .5; rs[-int(.3 * SR):] *= np.linspace(1, 0, int(.3 * SR)); put(amb, rs, S['silence'])   # rain thins in the close-up
s0, s1 = int((Bt['sweep'] - 1) * SR), int(Bt['sweep'] * SR); amb[s0:s1] = 0   # one second of true silence before the stroke (only the riser)

# ---------------- voices ----------------
voc = np.zeros((N, 2)); duck = np.zeros(N)
for e in EVS:
    if e['type'] != 'vo': continue
    x, sr = sf.read(os.path.join(D, 'voices_fx', e['id'] + '.wav'))
    if x.ndim > 1: x = x.mean(1)
    if sr != SR:
        import soxr; x = soxr.resample(x, sr, SR)
    x = x / (np.sqrt(np.mean(x ** 2)) + 1e-9) * .1                        # balance by RMS
    pk = np.abs(x); g = np.minimum(1, .32 / np.maximum(pk, 1e-9)) ** .5; x = x * g   # gentle peak tame
    put(voc, x, e['t'], 1, 0)
    s = int(e['t'] * SR); duck[max(0, s - int(.15 * SR)):min(N, s + len(x) + int(.3 * SR))] = 1
from scipy.ndimage import uniform_filter1d
duck = uniform_filter1d(duck, int(.25 * SR))
mg = 10 ** (-14 * duck / 20); ag = 10 ** (-10 * duck / 20)   # music −14 dB, rain and ambience −10 dB under every line
room = np.random.default_rng(3).standard_normal((int(1.4 * SR), 2)) * np.exp(-ts(int(1.4 * SR)) * 4.2)[:, None] * .02
musr = mus + np.stack([fftconvolve(mus[:, c], room[:, c])[:N] for c in (0, 1)], 1) * .6
mix = musr * .55 * mg[:, None] + fol * .9 * ag[:, None] + amb * .8 * ag[:, None] + voc * 2.0
mix = mix / max(1e-9, np.abs(mix).max()) * .9
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out/mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print('out/mix.wav', round(N / SR, 2), 's')
