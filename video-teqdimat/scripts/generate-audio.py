"""
Videonun fon musiqisini və səs effektlərini sıfırdan sintez edir (numpy).
Heç bir kənar səs faylı istifadə olunmur — bütün səslər bu skriptlə yaradılır,
ona görə lisenziya məhdudiyyəti yoxdur.

İstifadə:  python3 scripts/generate-audio.py
Nəticə:    public/audio/*.wav
"""
import os
import wave

import numpy as np

SR = 48000
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'audio')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)  # sabit toxum: hər dəfə eyni səs


# ─── köməkçi funksiyalar ──────────────────────────────────────
def t_axis(sec):
    return np.arange(int(sec * SR)) / SR


def note(name):
    names = {'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4, 'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2}
    n, octv = name[:-1], int(name[-1])
    return 440.0 * 2 ** ((names[n] + (octv - 4) * 12) / 12)


def spectral_filter(x, lo=None, hi=None, slope=1.0):
    """FFT ilə yumşaq alçaq/yüksək tezlik filtri."""
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(x.shape[0], 1 / SR)
    g = np.ones_like(f)
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** (4 * slope))
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** (4 * slope))
    if x.ndim == 2:
        g = g[:, None]
    return np.fft.irfft(X * g, n=x.shape[0], axis=0)


def reverb(x, seconds=2.4, mix=0.3, predelay=0.02):
    """Eksponensial sönən səs-küy impuls cavabı ilə sadə stereo reverb."""
    n = int(seconds * SR)
    tt = np.arange(n) / SR
    env = np.exp(-tt * 6.9 / seconds)
    ir = np.stack([rng.standard_normal(n) * env, rng.standard_normal(n) * env], axis=1)
    ir = spectral_filter(ir, lo=200, hi=6000)
    ir[: int(predelay * SR)] = 0
    ir /= np.sqrt((ir ** 2).sum(axis=0, keepdims=True))
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    L = x.shape[0] + n
    size = 1 << int(np.ceil(np.log2(L)))
    wet = np.stack(
        [np.fft.irfft(np.fft.rfft(x[:, c], size) * np.fft.rfft(ir[:, c], size), size)[: x.shape[0]] for c in range(2)],
        axis=1,
    )
    return x * (1 - mix) + wet * mix


def save(name, x, peak_db=-1.0):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    x = x - x.mean(axis=0)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    data = (np.clip(x, -1, 1) * 32767).astype('<i2')
    with wave.open(os.path.join(OUT, name), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f'  {name:16s} {x.shape[0] / SR:6.2f} san')


# ─── FON MUSİQİSİ (90 san, D major, sakit ambient) ───────────
def music():
    total = 90.0
    n = int(total * SR)
    out = np.zeros((n, 2))
    tt = t_axis(total)

    # Akkord ardıcıllığı: Dmaj9 – Bm7 – Gmaj7 – Asus4, hər biri 6 san
    chords = [
        ['D3', 'A3', 'C#4', 'E4', 'F#4'],
        ['B2', 'F#3', 'A3', 'D4', 'F#4'],
        ['G2', 'D3', 'F#3', 'B3', 'D4'],
        ['A2', 'E3', 'G3', 'D4', 'E4'],
    ]
    seg = 6.0
    starts = np.arange(0, total, seg)

    # Pad: yavaş açılan, bir-birinə keçən akkordlar
    for i, s in enumerate(starts):
        ch = chords[i % 4] if s < 84 else chords[0]  # sonda əsas akkorda qayıdış
        dur = min(seg + 2.0, total - s)
        t = np.arange(int(dur * SR)) / SR
        env = np.minimum(1, t / 1.8) * np.minimum(1, (dur - t) / 2.0)
        env = np.clip(env, 0, 1) ** 1.5
        seg_sig = np.zeros((len(t), 2))
        for k, nm in enumerate(ch):
            f = note(nm)
            for side, det in ((0, -0.0018), (1, 0.0018)):
                ff = f * (1 + det * (1 if k % 2 else -1))
                tone = np.sin(2 * np.pi * ff * t) + 0.35 * np.sin(2 * np.pi * 2 * ff * t + 0.4) + 0.12 * np.sin(2 * np.pi * 3 * ff * t)
                seg_sig[:, side] += tone * (0.9 if k == 0 else 0.55)
        a = int(s * SR)
        out[a : a + len(t)] += seg_sig * env[:, None] * 0.11

    # Alt bas: akkordun kökü, çox yumşaq
    for i, s in enumerate(starts):
        root = (chords[i % 4] if s < 84 else chords[0])[0]
        f = note(root) / 2
        dur = min(seg + 1.0, total - s)
        t = np.arange(int(dur * SR)) / SR
        env = np.minimum(1, t / 1.0) * np.clip((dur - t) / 1.2, 0, 1)
        a = int(s * SR)
        out[a : a + len(t)] += (np.sin(2 * np.pi * f * t) * env * 0.16)[:, None]

    # Arpeccio: 7-ci saniyədən (Səhnə 2) başlayır, zərif zəng tonu
    step = 0.75  # 80 BPM, səkkizlik
    pattern = [0, 2, 3, 4, 3, 2, 1, 2]
    t_note = np.arange(int(1.6 * SR)) / SR
    pluck_env = np.exp(-t_note * 3.2) * np.minimum(1, t_note / 0.006)
    for j, s in enumerate(np.arange(7.0, 84.0, step)):
        ch = chords[int(s // seg) % 4]
        nm = ch[pattern[j % len(pattern)]]
        f = note(nm) * 2
        tone = (np.sin(2 * np.pi * f * t_note) + 0.25 * np.sin(2 * np.pi * 2 * f * t_note)) * pluck_env
        vel = 0.05 * (0.85 + 0.15 * np.sin(j * 0.7))
        a = int(s * SR)
        b = min(n, a + len(t_note))
        pan = 0.5 + 0.3 * np.sin(j * 1.3)
        out[a:b, 0] += tone[: b - a] * vel * (1 - pan) * 2
        out[a:b, 1] += tone[: b - a] * vel * pan * 2

    # Sonluq: əsas akkord zəng kimi
    for k, nm in enumerate(['D4', 'F#4', 'A4', 'D5']):
        a = int((84.6 + k * 0.18) * SR)
        t = np.arange(n - a) / SR
        tone = (np.sin(2 * np.pi * note(nm) * t) + 0.2 * np.sin(2 * np.pi * 2 * note(nm) * t)) * np.exp(-t * 0.9) * np.minimum(1, t / 0.01)
        out[a:, :] += (tone * 0.07)[:, None]

    out = spectral_filter(out, lo=35, hi=5500)
    out = reverb(out, seconds=3.2, mix=0.35)
    fade = np.minimum(1, tt / 2.5) * np.clip((total - tt) / 3.0, 0, 1)
    out *= fade[:, None]
    save('music.wav', out, peak_db=-3)


# ─── SƏS EFFEKTLƏRİ ──────────────────────────────────────────
def whoosh():
    d = 1.1
    t = t_axis(d)
    noise = rng.standard_normal((len(t), 2))
    lowband = spectral_filter(noise, lo=150, hi=900)
    highband = spectral_filter(noise, lo=900, hi=5000)
    sweep = np.clip(t / d, 0, 1)[:, None]
    x = lowband * (1 - sweep) + highband * sweep * 0.6
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2.2
    save('whoosh.wav', reverb(x * env[:, None], 1.2, 0.25), peak_db=-4)


def tick():
    t = t_axis(0.35)
    body = np.sin(2 * np.pi * 1760 * t) * np.exp(-t * 55) + 0.6 * np.sin(2 * np.pi * 880 * t) * np.exp(-t * 35)
    click = rng.standard_normal(len(t)) * np.exp(-t * 400) * 0.25
    save('tick.wav', reverb(spectral_filter(body + click, lo=300, hi=8000), 0.8, 0.2), peak_db=-6)


def pop():
    """Kart açılışı: isti, yumşaq "tap"."""
    t = t_axis(0.6)
    f = 380 + 260 * (1 - np.exp(-t * 30))
    phase = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(phase) * np.exp(-t * 14) * np.minimum(1, t / 0.004)
    x += 0.3 * np.sin(2 * phase) * np.exp(-t * 22)
    save('pop.wav', reverb(x, 1.0, 0.25), peak_db=-5)


def chime(name, notes, spacing=0.0, decay=1.4, dur=3.0):
    t = t_axis(dur)
    x = np.zeros(len(t))
    for k, nm in enumerate(notes):
        f = note(nm)
        off = int(k * spacing * SR)
        tt = t[: len(t) - off]
        partials = [(1, 1.0), (2.0, 0.35), (2.76, 0.18), (5.4, 0.06)]
        tone = sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt * decay * (1 + r * 0.4)) for r, a in partials)
        x[off:] += tone * np.minimum(1, tt / 0.003)
    save(name, reverb(x, 2.4, 0.35), peak_db=-4)


def shutter():
    """Kamera çəkilişi: iki mexaniki klik."""
    t = t_axis(0.5)
    x = np.zeros(len(t))
    for off, amp in ((0.0, 1.0), (0.11, 0.7)):
        a = int(off * SR)
        tt = t[: len(t) - a]
        burst = rng.standard_normal(len(tt)) * np.exp(-tt * 180) + 0.5 * np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 90)
        x[a:] += burst * amp
    save('shutter.wav', reverb(spectral_filter(x, lo=600, hi=9000), 0.6, 0.15), peak_db=-6)


def clock_tick():
    t = t_axis(0.12)
    x = (np.sin(2 * np.pi * 3200 * t) * 0.6 + np.sin(2 * np.pi * 1250 * t)) * np.exp(-t * 120)
    x += rng.standard_normal(len(t)) * np.exp(-t * 600) * 0.2
    save('clock.wav', spectral_filter(x, lo=500), peak_db=-8)


if __name__ == '__main__':
    print('Səslər yaradılır →', os.path.abspath(OUT))
    music()
    whoosh()
    tick()
    pop()
    shutter()
    clock_tick()
    chime('chime.wav', ['A5', 'D6'], spacing=0.07, decay=1.6)
    chime('chime-final.wav', ['D5', 'F#5', 'A5', 'D6'], spacing=0.12, decay=0.9, dur=5.0)
