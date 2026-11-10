"""SIT MEN — original score + sound design → out/mix.wav (48 kHz stereo). No voice.
The bell is the motif (three tolls, inharmonic partials, long tails); horror lives in a low drone and in silence;
the fight is drums + bamboo-flute breath; the stroke lands out of true silence. All times from events.json.
Run: .venv/bin/python films/sit-men/mix.py"""
import os, json, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve
D = os.path.dirname(os.path.abspath(__file__)); SR = 48000
E = json.load(open(os.path.join(D, 'events.json'))); DUR = E['dur']; EV = E['ev']; N = int(round(DUR * SR))
B = {e['id']: e['t'] for e in EV if e['type'] == 'beat'}; S = {e['id']: e['t'] for e in EV if e['type'] == 'shot'}
rng = np.random.default_rng(7)
def sos(k, f, o=2): return butter(o, f, k, fs=SR, output='sos')
def lp(x, f, o=2): return sosfilt(sos('low', f, o), x, axis=0)
def hp(x, f, o=2): return sosfilt(sos('high', f, o), x, axis=0)
def bp(x, a, b, o=2): return sosfilt(sos('band', [a, b], o), x, axis=0)
def ts(n): return np.arange(n) / SR
mus = np.zeros((N, 2)); sfx = np.zeros((N, 2)); amb = np.zeros((N, 2))
def put(buf, x, t, g=1., pan=0.):
    s = int(t * SR)
    if s >= N: return
    x = x[:N - s]; buf[s:s + len(x), 0] += x * g * np.sqrt(.5 * (1 - pan)); buf[s:s + len(x), 1] += x * g * np.sqrt(.5 * (1 + pan))
def fade(x, a=.01, r=.05):
    n = len(x); e = np.ones(n); A, R = int(a * SR), int(r * SR); e[:A] = np.linspace(0, 1, A); e[-R:] *= np.linspace(1, 0, R); return x * e

# ---------------- instruments ----------------
def bell(v=.7, f0=98., d=9.):        # a great temple bell: inharmonic partials, slow beating, long decay
    n = int(d * SR); t = ts(n); x = 0
    for r, a, dec in [(1, 1, .35), (2.0, .6, .5), (2.4, .5, .6), (3.0, .35, .8), (4.1, .25, 1.1), (5.4, .18, 1.5), (6.8, .1, 2)]:
        x = x + a * np.sin(2 * np.pi * f0 * r * t + .3 * np.sin(2 * np.pi * .7 * r * t)) * np.exp(-t * dec)
    strike = bp(rng.standard_normal(n), 300, 3000) * np.exp(-t * 40) * .5
    return (x + strike) * v * .25
def handbell(v=.4):
    n = int(3 * SR); t = ts(n); x = 0
    for r, a in [(1, 1), (2.76, .5), (5.4, .3), (8.9, .15)]: x = x + a * np.sin(2 * np.pi * 1180 * r * t) * np.exp(-t * (2 + r * .6))
    return x * v * .3
def drone(d, f=46., v=.2, rise=0.):
    n = int(d * SR); t = ts(n); fr = f * (1 + rise * t / d)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    x = np.sin(ph) + .5 * np.sin(2 * ph + .3) + .25 * np.sin(3.01 * ph) + .3 * lp(rng.standard_normal(n), 120)
    return fade(x * v, 1.5, 2)
def xiao(f, d, v=.15):              # a breathy end-blown flute
    n = int(d * SR); t = ts(n); vib = 1 + .006 * np.sin(2 * np.pi * 5 * t) * np.minimum(1, t / .6)
    x = np.sin(2 * np.pi * np.cumsum(np.full(n, f) * vib) / SR) * .8 + bp(rng.standard_normal(n), f * .8, f * 3) * .5
    return fade(x * v * np.minimum(1, t / .25), .1, .4)
def drum(v=.8, f=70.):
    n = int(1.2 * SR); t = ts(n); fr = f * (1 + 1.3 * np.exp(-t * 25))
    return (np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 4.5) + lp(rng.standard_normal(n), 900) * np.exp(-t * 30) * .5) * v
def stick(v=.3): n = int(.08 * SR); t = ts(n); return bp(rng.standard_normal(n), 1500, 5000) * np.exp(-t * 60) * v
def pluck(f, v=.25, d=2.5):         # a guqin-like plucked string (Karplus–Strong)
    P = int(SR / f); n = int(d * SR); y = np.zeros(n); y[:P] = rng.uniform(-1, 1, P)
    for i in range(P, n): y[i] = .996 * .5 * (y[i - P] + y[i - P - 1])
    return lp(y, 3000) * v
def sting(v=1.):                    # the jump scare: a dissonant cluster + noise burst + sub hit
    n = int(1.8 * SR); t = ts(n); x = sum(np.sin(2 * np.pi * f * t) for f in [311, 330, 349, 370, 622, 659]) / 6
    return (x * np.exp(-t * 2.2) + bp(rng.standard_normal(n), 800, 8000) * np.exp(-t * 6) * .8 + np.sin(2 * np.pi * 38 * t) * np.exp(-t * 3) * 1.2) * v
def whoosh(v=.5, d=.35): n = int(d * SR); t = ts(n); return bp(rng.standard_normal(n), 400, 5000) * np.sin(np.pi * t / d) ** 2 * v
def splat(v=.5): n = int(.4 * SR); t = ts(n); return (lp(rng.standard_normal(n), 1400) * np.exp(-t * 14) + bp(rng.standard_normal(n), 2000, 6000) * (rng.random(n) < .01) * 2) * v
def thud(v=.6): n = int(.5 * SR); t = ts(n); return np.sin(2 * np.pi * 55 * t) * np.exp(-t * 12) * v
def step(v=.15): n = int(.12 * SR); t = ts(n); return bp(rng.standard_normal(n), 300, 3500) * np.exp(-t * 35) * v
def creak(d=6): n = int(d * SR); t = ts(n); f = 180 + 60 * np.sin(t * 1.3) + 30 * np.sin(t * 7); x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (np.sin(2 * np.pi * 14 * t) > .2); return fade(bp(x, 300, 2500) * .08, .5, .8)
def caw(v=.3): n = int(.45 * SR); t = ts(n); f = 900 - 300 * t / .45; return bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * t / .45), 600, 3000) * v
def groan(d, v=.2): n = int(d * SR); t = ts(n); f = 90 + 20 * np.sin(t * .9); x = np.sin(2 * np.pi * np.cumsum(f) / SR) + .5 * lp(rng.standard_normal(n), 400); return fade(bp(x, 80, 900) * v, .8, 1.5)
def wind(d, v=.1): n = int(d * SR); return fade(bp(rng.standard_normal(n), 200, 1500) * v * (1 + .4 * np.sin(ts(n) * .5)), 1, 1)
def bugs(d): n = int(d * SR); t = ts(n); return fade(np.sin(2 * np.pi * 5200 * t) * (np.sin(2 * np.pi * 22 * t) > .7) * (np.sin(2 * np.pi * .4 * t) > -.2) * .015, 1, 1)
def birds(d):
    x = np.zeros(int(d * SR))
    for k in range(int(d / 1.4)):
        t0 = rng.uniform(0, d - .4); n = int(.2 * SR); tt = ts(n); c = np.sin(2 * np.pi * (3200 + 800 * np.sin(2 * np.pi * 12 * tt)) * tt) * np.sin(np.pi * tt / .2) * .025
        s = int(t0 * SR); x[s:s + n] += c[:len(x) - s]
    return x

# ---------------- the cue sheet ----------------
for k in ('toll1', 'toll2', 'toll3'): put(mus, bell(.8), B[k])
put(mus, xiao(392, 5, .12), 6.5, 1, .2); put(mus, xiao(349, 4, .1), 11.5, 1, .2)
put(amb, wind(B['windStop'] - 1), 1, 1); put(mus, drone(B['windStop'] - 12, 55, .06), 12)
put(mus, xiao(294, 3, .08), 14, 1, -.1)
# the bamboo at night: drone, guqin harmonics, steps; the rustle → a fox (false alarm); the ghost has NO music cue
put(mus, drone(S['crows'] - S['bamboo'], 44, .12), S['bamboo']); put(amb, bugs(S['crows'] - S['bamboo']), S['bamboo'])
for i, f in enumerate([587, 0, 523, 0, 440, 0, 392]):
    if f: put(mus, pluck(f, .12), S['bamboo'] + 2 + i * 3.2, 1, .3)
put(sfx, bp(rng.standard_normal(int(.9 * SR)), 1500, 7000) * .25 * np.exp(-ts(int(.9 * SR)) * 3), B['rustle'], 1, -.4)
put(sfx, step(.25), B['fox'] + .1, 1, .2); put(sfx, step(.2), B['fox'] + .35, 1, -.2); put(sfx, step(.18), B['fox'] + .6, 1, -.5)
# the village gate: one caw, then nothing; the crows turn (a dry rustle of feathers)
put(sfx, caw(.35), S['crows'] + 1.5, 1, .4)
put(sfx, bp(rng.standard_normal(int(.5 * SR)), 2000, 8000) * .12 * np.exp(-ts(int(.5 * SR)) * 6), B['crowsTurn'], 1, 0)
put(mus, drone(S['scare'] - S['crows'], 33, .16, rise=.06), S['crows'])          # low-frequency dread, rising toward the door
put(sfx, creak(6.5), B['creak'])
# the jump scare
put(sfx, sting(1.2), B['scare'])
# the fight: drums, a fast guqin figure, whooshes + splats on every hit; the hand bell
for k in range(int((B['handbell'] - S['fight']) / .5)): put(mus, drum(.5 if k % 4 else .8, 80 if k % 2 else 62), S['fight'] + k * .5, 1, 0)
for k in range(int((B['handbell'] - S['fight']) / .25)):
    if k % 3 != 2: put(mus, stick(.12), S['fight'] + k * .25, 1, .3)
for h in ('hit1', 'hit2', 'hit3', 'hit4', 'hit5', 'hit6'): put(sfx, whoosh(.55), B[h] - .12, 1, .2); put(sfx, splat(.6), B[h] + .05, 1, -.1); put(sfx, thud(.5), B[h] + .05)
put(sfx, handbell(.8), B['handbell'], 1, .1); put(sfx, handbell(.4), B['handbell'] + 1.4, 1, .1)
put(mus, drone(S['reveal'] - B['handbell'], 49, .1), B['handbell'])
# the reveal + the climb: a groaning tide, drums building, the great bell ×3
put(amb, groan(S['eyes'] - S['reveal'], .22), S['reveal'])
put(mus, drone(8, 41, .14, rise=.1), S['reveal'])
for k in range(int((S['break'] - S['climb']) / .4)): put(mus, drum(.35 + .3 * k / 40, 70), S['climb'] + k * .4)
for e in EV:
    if e['type'] == 'run': put(sfx, step(.2), e['t'], 1, .1)
for k in ('gtoll1', 'gtoll2', 'gtoll3'): put(mus, bell(1., 82), B[k])
# the rule breaks: a foot steps through the sound; the tide resumes; then silence
put(sfx, thud(.7), B['step']); put(amb, groan(B['silence'] - B['step'], .3), B['step'])
put(mus, drone(B['silence'] - B['step'], 36, .18, rise=.15), B['step'])
# SILENCE: one drip; then the rise, the stroke, the collapse
put(sfx, (np.sin(2 * np.pi * 1600 * ts(int(.25 * SR))) * np.exp(-ts(int(.25 * SR)) * 30) * .25), B['drip'])
put(sfx, whoosh(.8, 1.1), B['stroke'] - .9, 1, -.2)
put(sfx, drum(1.4, 48), B['stroke'] + .1); put(sfx, whoosh(1., .5), B['stroke'], 1, .3)
for k in range(12): put(sfx, splat(.35), B['strokeEnd'] + .1 + k * .12, 1, (k % 3 - 1) * .5)
put(mus, xiao(392, 6, .14), B['strokeEnd'] + 1.5, 1, .2)
# dawn: birds, a gentle guqin theme; the bow; then the shadow — silence, and three tolls in the black
put(amb, birds(S['shadow'] - S['dawn']), S['dawn'])
for i, f in enumerate([392, 440, 523, 587, 523, 440, 392, 330, 392]): put(mus, pluck(f, .16, 3), S['dawn'] + 1 + i * 1.4, 1, .2)
put(mus, xiao(330, 5, .09), S['bow'] + 1, 1, .1)
for k in ('endToll1', 'endToll2', 'endToll3'): put(mus, bell(.7, 92, 4), B[k])
# true silence windows: the music + ambience are zeroed (with short fades) in the eyes shot and before the scare
def hush(a, b, keep_sfx=True):
    s0, s1 = int(a * SR), int(b * SR); f = int(.06 * SR)
    for buf in (mus, amb) if keep_sfx else (mus, amb, sfx):
        buf[s0 - f:s0] *= np.linspace(1, 0, f)[:, None]; buf[s0:s1] = 0; buf[s1:s1 + f] *= np.linspace(0, 1, f)[:, None]
hush(B['silence'], B['stroke'] - .9); hush(B['scare'] - .9, B['scare'])
hush(S['shadow'] + 1, B['endToll1'] - .05)
room = rng.standard_normal((int(2.5 * SR), 2)) * np.exp(-ts(int(2.5 * SR)) * 2.2)[:, None] * .015
wet = np.stack([fftconvolve(mus[:, c], room[:, c])[:N] for c in (0, 1)], 1)
mix = mus * .8 + wet * .5 + sfx * .9 + amb * .7
# section gains (dB): lift the quiet opening and the dawn so the dynamics stay readable; the silences stay silent
tt = ts(N); pts = [(0, 5), (S['crows'], 3), (S['scare'] - .1, 0), (S['dawn'], 6), (S['shadow'], 4), (DUR + 1, 4)]
mix = mix * (10 ** (np.interp(tt, [p[0] for p in pts], [p[1] for p in pts]) / 20))[:, None]
mix = mix / max(1e-9, np.abs(mix).max()) * .9
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out/mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24'); print('out/mix.wav', round(N / SR, 1), 's')
