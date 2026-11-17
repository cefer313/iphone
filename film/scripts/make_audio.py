"""Synthesises the film's soundscape from seeded noise. No music, no voice.

Reads src/data/timeline.json so every footstep, knock and creak lands on the
same frame the animation shows. Output: public/soundscape.wav (48 kHz, stereo).
"""
import json, os, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
T = json.load(open(os.path.join(ROOT, "src", "data", "timeline.json")))
SR = 48000
FPS = T["fps"]
N = int(T["frames"] / FPS * SR)          # exactly 30.000 s
rng = np.random.default_rng(20240613)
mix = np.zeros((N, 2))


def f2s(frame):
    return int(round(frame / FPS * SR))


def band(sig, lo, hi, slope=2):
    """Zero-phase band filter in the frequency domain (soft skirts)."""
    n = len(sig)
    spec = np.fft.rfft(sig)
    fr = np.fft.rfftfreq(n, 1 / SR)
    g = np.ones_like(fr)
    if lo > 0:
        g *= 1 / (1 + (lo / np.maximum(fr, 1)) ** (2 * slope))
    if hi:
        g *= 1 / (1 + (fr / hi) ** (2 * slope))
    return np.fft.irfft(spec * g, n)


def add(sig, start, gain=1.0, pan=0.0):
    s = max(0, start); e = min(N, start + len(sig))
    if e <= s:
        return
    seg = sig[s - start:e - start] * gain
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    mix[s:e, 0] += seg * l * 1.414
    mix[s:e, 1] += seg * r * 1.414


def env(n, attack, decay):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(t - attack, 0) / decay)


# --- Night wind: two slowly breathing noise bands, decorrelated per channel ---
t = np.arange(N) / SR
for ch in range(2):
    low = band(rng.standard_normal(N), 60, 420, 1)
    air = band(rng.standard_normal(N), 700, 2600, 1)
    lfo1 = 0.6 + 0.4 * np.sin(2 * np.pi * t / 9.5 + ch * 0.8) * np.sin(2 * np.pi * t / 4.1 + 1.3)
    lfo2 = 0.5 + 0.5 * np.sin(2 * np.pi * t / 6.7 + 2.1 + ch)
    w = low / np.abs(low).max() * 0.055 * lfo1 + air / np.abs(air).max() * 0.012 * lfo2 ** 2
    mix[:, ch] += w

# Indoors is a little more sheltered: dip the wind while we are at the threshold.
duck = np.ones(N)
a, b = f2s(392), f2s(748)
ramp = f2s(12)
duck[a:b] = 0.62
duck[a - ramp:a] = np.linspace(1, 0.62, ramp)
duck[b:b + ramp] = np.linspace(0.62, 1, ramp)
mix *= duck[:, None]


def footstep(seed):
    r = np.random.default_rng(seed)
    n = int(0.22 * SR)
    out = np.zeros(n)
    # heel, then the sole rolls onto the ground ~45 ms later
    for k, (off, g) in enumerate(((0.0, 1.0), (0.045 + r.uniform(-0.008, 0.008), 0.65))):
        o = int(off * SR); m = n - o
        thud = band(r.standard_normal(m), 40, 220, 2) * env(m, 0.002, 0.03) * 0.9
        grit = band(r.standard_normal(m), 1400, 5200, 2) * env(m, 0.003, 0.045) * 0.55
        crk = np.zeros(m)
        idx = r.integers(0, int(0.07 * SR), 14)
        crk[idx] = r.uniform(-1, 1, 14)
        crk = band(crk, 2500, 8000, 1) * 0.8
        out[o:] += g * (thud + grit + crk)
    return out / np.abs(out).max()


for c in T["cues"]:
    f = c["frame"]
    if c["type"] == "step":
        if c["shot"] == "s1":
            dist = max(1.6, c["z"] - 0.03 * f)
        elif c["shot"] == "s6":
            dist = max(1.6, c["z"] - 0.3)
        else:
            dist = 1.25
        g = 0.17 * min(1.0, 2.0 / dist)
        add(footstep(1000 + f), f2s(f) - int(0.004 * SR), g, pan=0.05)
    elif c["type"] == "knock":
        n = int(0.32 * SR)
        tt = np.arange(n) / SR
        r = np.random.default_rng(f)
        body = sum(a * np.sin(2 * np.pi * fr * tt + r.uniform(0, 6)) * np.exp(-tt / d)
                   for fr, a, d in ((172, 1.0, 0.07), (395, 0.6, 0.045), (742, 0.35, 0.03), (1260, 0.18, 0.018)))
        click = band(r.standard_normal(n), 1800, 4500) * np.exp(-tt / 0.004) * 0.6
        k = (body + click) * np.clip(tt / 0.0015, 0, 1)
        add(k / np.abs(k).max(), f2s(f), 0.30, pan=0.15)
    elif c["type"] == "creak":
        n = int(c["len"] / FPS * SR)
        tt = np.arange(n) / SR
        r = np.random.default_rng(77)
        rate = 38 + 26 * np.sin(np.pi * tt / tt[-1]) + 6 * np.sin(2 * np.pi * 3.1 * tt)
        phase = np.cumsum(rate / SR)
        imp = np.zeros(n)
        ticks = np.nonzero(np.diff(np.floor(phase)) > 0)[0]
        imp[ticks] = r.uniform(0.5, 1.0, len(ticks))
        res = sum(band(imp, fr * 0.85, fr * 1.15, 3) * g for fr, g in ((620, 1.0), (1180, 0.6), (2300, 0.25)))
        e = np.sin(np.pi * np.clip(tt / tt[-1], 0, 1)) ** 1.5
        cr = res * e
        add(cr / np.abs(cr).max(), f2s(f), 0.11, pan=0.18)
    elif c["type"] == "sack":
        n = int(0.4 * SR)
        r = np.random.default_rng(5)
        th = band(r.standard_normal(n), 30, 170, 2) * env(n, 0.012, 0.09)
        rs = band(r.standard_normal(n), 1800, 6000, 1) * env(n, 0.02, 0.12) * 0.25
        s = th / np.abs(th).max() + rs / np.abs(rs).max() * 0.22
        add(s, f2s(f) - int(0.01 * SR), 0.22, pan=0.1)
    elif c["type"] == "cloth":
        n = f2s(c["end"]) - f2s(f)
        r = np.random.default_rng(f * 3 + 1)
        tt = np.linspace(0, 1, n)
        e = np.sin(np.pi * tt) ** 2 * (0.7 + 0.3 * np.sin(2 * np.pi * tt * 3.3 + r.uniform(0, 6)))
        nz = band(r.standard_normal(n), 900, 4800, 1)
        s = nz / np.abs(nz).max() * e
        add(s, f2s(f), 0.045 * c["gain"], pan=-0.05)

# Gentle edges: 0.25 s fade-in, 2 s natural fade-out ending at the last frame.
fi = f2s(7)
mix[:fi] *= np.linspace(0, 1, fi)[:, None]
fo_start = f2s(840)
fo = N - fo_start
mix[fo_start:] *= (np.cos(np.linspace(0, np.pi, fo)) * 0.5 + 0.5)[:, None]

# Soft limiter, then target a calm -6 dBFS peak.
mix = np.tanh(mix * 1.4) / 1.4
peak = np.abs(mix).max()
mix *= (10 ** (-6 / 20)) / peak
pcm = (mix * 32767).astype("<i2")
with wave.open(os.path.join(ROOT, "public", "soundscape.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("soundscape.wav", N / SR, "s, peak -6 dBFS")
