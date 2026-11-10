"""Mix: the photoplay score + the projector in the booth (the only room sound a silent film has) → out/mix.wav.
No foley on purpose: the piano plays every event. The projector is the ambience: it is already running at the cold open,
purrs under the reel, is the only sound in the nine-second silence before the catch, and flaps the film's tail at the end."""
import sys, os, json
import numpy as np, soundfile as sf
D = os.path.dirname(os.path.abspath(__file__)); LIB = os.environ.get('LIB') or os.path.abspath(os.path.join(D, '../..'))
sys.path.insert(0, LIB)
from core.audio.sfx import SR, bp, limit, t_, compress
rng = np.random.default_rng(1926)
TL = json.load(open(os.path.join(D, 'timeline.json'))); SEC, HIT, DUR = TL['SEC'], TL['HIT'], TL['DUR']
N = int(round(DUR * SR))
score, sr = sf.read(os.path.join(D, 'music/score.wav')); assert sr == SR
score = np.pad(score, ((0, max(0, N - len(score))), (0, 0)))[:N]
def claw(v=1.0):
    tt = t_(.05); x = bp(rng.standard_normal(len(tt)), 1200, 5200) * np.exp(-tt / .004) * .9
    return (x + np.sin(2 * np.pi * 190 * tt) * np.exp(-tt / .012) * .5) * v
end0 = HIT['curtainOut'] + 1.4
def fps(t):
    if t < .05: return 0
    if t < .5: return 18 * min(1, (t - .05) / .45) ** .6       # the lamp strikes, the motor is already near speed
    if t < end0: return 18
    return max(0, 18 * (1 - (t - end0) / 1.6))
proj = np.zeros(N); t = .05
while t < DUR - .05:
    f = fps(t)
    if f < 1: t += .02; continue
    c = claw(.8 + .2 * rng.random()); s = int(t * SR); e = min(N, s + len(c)); proj[s:e] += c[:e - s]
    t += 1 / f * (1 + (rng.random() - .5) * .04)
tt = np.arange(N) / SR; sp = np.interp(tt, tt[::480], np.array([fps(x) for x in tt[::480]])) / 18
proj = proj * .5 + (np.sin(2 * np.pi * 60 * tt) * .5 + np.sin(2 * np.pi * 120 * tt) * .3 + np.sin(2 * np.pi * 180 * tt) * .12) * sp * .05 + bp(rng.standard_normal(N), 300, 1800) * .25 * sp * .35
# the tail of the film flapping on the take-up reel
t = end0 + .1
while t < DUR - .1:
    f = max(4, 14 - (t - end0) * 5); x = bp(rng.standard_normal(int(.03 * SR)), 600, 4000) * np.exp(-t_(.03) / .006) * 1.2
    s = int(t * SR); e = min(N, s + len(x)); proj[s:e] += x[:e - s]; t += 1 / f
k = int(.02 * SR); proj[k:k + int(.03 * SR)] += bp(rng.standard_normal(int(.03 * SR)), 900, 6000) * np.exp(-t_(.03) / .004) * 2    # the lamp click
# level: low under the piano; forward at the start, in the silence (stop → catch) and in the runout
lev_pts = [(0, 1.0), (.8, .35), (HIT['stop'] + .2, .35), (HIT['stop'] + .7, 1.0), (HIT['catch'] - .05, 1.0), (HIT['catch'] + 1.2, .35), (HIT['curtainOut'], .35), (HIT['curtainOut'] + .8, 1.0), (DUR + 1, 1.0)]
lev = np.interp(tt, [p[0] for p in lev_pts], [p[1] for p in lev_pts])
proj = proj * lev * .13
pr = np.stack([proj * .9, proj * 1.0], 1)
sc = score * .9; lk = np.abs(sc).max(1); gk = compress(lk, thr=.18, ratio=3, att=.002, rel=.12) / np.maximum(lk, 1e-9)
mix = sc * gk[:, None] * 1.5 + pr
for c in (0, 1): mix[:, c] = limit(mix[:, c], .95)
os.makedirs(os.path.join(D, 'out'), exist_ok=True)
sf.write(os.path.join(D, 'out/mix.wav'), mix.astype(np.float32), SR, subtype='PCM_24')
print('out/mix.wav', round(len(mix) / SR, 2), 's  peak', round(float(np.abs(mix).max()), 3))
