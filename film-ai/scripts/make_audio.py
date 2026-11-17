"""Soundscape for the AI-animated short: night breeze, sandal steps (on the animation's own
landing frames), cloth, the sack set down, two knocks, a door creak and one spoken line.
Run with the bpy-enabled python:  python3 scripts/make_audio.py"""
import json, os, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EDL = json.load(open(os.path.join(ROOT, 'src', 'edl.json')))['cues']



FPS, FRAMES, SR = 30, 600, 48000
N = FRAMES * SR // FPS
rng = np.random.default_rng(7)
mix = np.zeros((N, 2))
f2s = lambda f: int(round(f / FPS * SR))


def band(sig, lo, hi, slope=2):
    spec = np.fft.rfft(sig)
    fr = np.fft.rfftfreq(len(sig), 1 / SR)
    g = np.ones_like(fr)
    if lo > 0:
        g *= 1 / (1 + (lo / np.maximum(fr, 1)) ** (2 * slope))
    if hi:
        g *= 1 / (1 + (fr / hi) ** (2 * slope))
    return np.fft.irfft(spec * g, len(sig))


def env(n, a, d):
    t = np.arange(n) / SR
    return np.clip(t / max(a, 1e-4), 0, 1) * np.exp(-np.maximum(t - a, 0) / d)


def add(sig, start, gain, pan=0.0):
    s, e = max(0, start), min(N, start + len(sig))
    if e <= s:
        return
    seg = sig[s - start:e - start] * gain
    mix[s:e, 0] += seg * np.cos((pan + 1) * np.pi / 4) * 1.414
    mix[s:e, 1] += seg * np.sin((pan + 1) * np.pi / 4) * 1.414


# night breeze, two slow bands, quieter indoors (shot D1)
t = np.arange(N) / SR
for ch in range(2):
    lo = band(rng.standard_normal(N), 60, 450, 1)
    hi = band(rng.standard_normal(N), 800, 2800, 1)
    l1 = 0.6 + 0.4 * np.sin(2 * np.pi * t / 7.3 + ch) * np.sin(2 * np.pi * t / 3.1 + 1)
    l2 = 0.5 + 0.5 * np.sin(2 * np.pi * t / 5.2 + 2 + ch)
    mix[:, ch] += lo / np.abs(lo).max() * 0.05 * l1 + hi / np.abs(hi).max() * 0.011 * l2 ** 2
duck = np.ones(N)
a, b, r = f2s(330), f2s(390), f2s(6)
duck[a:b] = 0.55
duck[a - r:a] = np.linspace(1, 0.55, r)
duck[b:b + r] = np.linspace(0.55, 1, r)
mix *= duck[:, None]


def footstep(seed):
    q = np.random.default_rng(seed)
    n = int(0.22 * SR)
    out = np.zeros(n)
    for off, g in ((0.0, 1.0), (0.045 + q.uniform(-0.008, 0.008), 0.6)):
        o = int(off * SR); m = n - o
        thud = band(q.standard_normal(m), 40, 220) * env(m, 0.002, 0.03) * 0.9
        grit = band(q.standard_normal(m), 1400, 5200) * env(m, 0.003, 0.045) * 0.5
        crk = np.zeros(m); idx = q.integers(0, int(0.07 * SR), 12); crk[idx] = q.uniform(-1, 1, 12)
        out[o:] += g * (thud + grit + band(crk, 2500, 8000, 1) * 0.7)
    return out / np.abs(out).max()


cues = []
for f, g in zip(EDL['steps'], EDL['stepGain']):
    cues.append(('step', f))
    add(footstep(100 + f), f2s(f) - int(0.004 * SR), g, 0.05)

# cloth movement
for a_, b_, g in EDL['cloth']:
    n = f2s(b_) - f2s(a_)
    q = np.random.default_rng(a_)
    tt = np.linspace(0, 1, n)
    e = np.sin(np.pi * tt) ** 2 * (0.7 + 0.3 * np.sin(2 * np.pi * tt * 3.1 + q.uniform(0, 6)))
    nz = band(q.standard_normal(n), 900, 4800, 1)
    add(nz / np.abs(nz).max() * e, f2s(a_), 0.05 * g, -0.05)
    cues.append(('cloth', a_))

# the sack meets the ground (contact at frame 200), a soft settle
n = int(0.45 * SR)
q = np.random.default_rng(5)
th = band(q.standard_normal(n), 30, 170) * env(n, 0.015, 0.1)
rs = band(q.standard_normal(n), 1800, 6000, 1) * env(n, 0.02, 0.14)
s_ = th / np.abs(th).max() + rs / np.abs(rs).max() * 0.25
add(s_, f2s(EDL['sack']) - int(0.01 * SR), 0.24, 0.1)
cues.append(('sack', EDL['sack']))

# two soft wooden knocks
for f in EDL['knocks']:
    n = int(0.3 * SR)
    tt = np.arange(n) / SR
    q = np.random.default_rng(f)
    body = sum(a * np.sin(2 * np.pi * fr * tt + q.uniform(0, 6)) * np.exp(-tt / d)
               for fr, a, d in ((168, 1.0, 0.07), (390, 0.6, 0.045), (735, 0.35, 0.03), (1250, 0.16, 0.018)))
    click = band(q.standard_normal(n), 1800, 4500) * np.exp(-tt / 0.004) * 0.5
    k = (body + click) * np.clip(tt / 0.0015, 0, 1)
    add(k / np.abs(k).max(), f2s(f), 0.3, 0.1)
    cues.append(('knock', f))

# restrained hinge creak while the door opens
a_, b_ = EDL['creak']
n = f2s(b_) - f2s(a_)
tt = np.arange(n) / SR
rate = 34 + 22 * np.sin(np.pi * tt / tt[-1]) + 5 * np.sin(2 * np.pi * 3.0 * tt)
ph = np.cumsum(rate / SR)
imp = np.zeros(n)
ticks = np.nonzero(np.diff(np.floor(ph)) > 0)[0]
imp[ticks] = np.random.default_rng(9).uniform(0.5, 1, len(ticks))
res = sum(band(imp, fr * 0.85, fr * 1.15, 3) * g for fr, g in ((600, 1.0), (1150, 0.55), (2250, 0.22)))
cr = res * np.sin(np.pi * np.clip(tt / tt[-1], 0, 1)) ** 1.5
add(cr / np.abs(cr).max(), f2s(a_), 0.06, 0.15)
cues.append(('creak', a_))

# ambience level, then the single spoken line on top (kept clearly intelligible)
amb_peak = np.abs(mix).max()
mix *= 0.25 / amb_peak
with wave.open(os.path.join(ROOT, 'audio_src', 'prayer.wav')) as w:
    v = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(float) / 32768
    assert w.getframerate() == SR
v = v / np.abs(v).max() * 0.42
add(v, f2s(EDL['prayer']), 1.0 / 1.414, 0.0)
cues.append(('prayer', EDL['prayer']))

fi = f2s(6)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fo0 = f2s(582)
mix[fo0:] *= (np.cos(np.linspace(0, np.pi, N - fo0)) * 0.5 + 0.5)[:, None]
mix = np.tanh(mix * 1.2) / 1.2
mix *= (10 ** (-3 / 20)) / np.abs(mix).max()
os.makedirs(os.path.join(ROOT, 'public', 'audio'), exist_ok=True)
with wave.open(os.path.join(ROOT, 'public', 'audio', 'soundscape.wav'), 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
json.dump(sorted(cues, key=lambda c: c[1]), open(os.path.join(ROOT, 'audio_src', 'cues.json'), 'w'))
print('soundscape', N / SR, 's;', len(cues), 'cues; prayer at', EDL['prayer'] / FPS, 's')
