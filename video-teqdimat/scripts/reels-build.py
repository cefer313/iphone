"""
Reels üçün vaxt cədvəlini və musiqini yaradır.

1) public/reels/voice/v1.mp3 … v10.mp3 uzunluqlarını ölçür
2) hər səhnənin uzunluğunu diktora görə təyin edir → src/reels/timeline.json
3) gərgin → ümidli fon musiqisi və bildiriş səsi sintez edir → public/reels/audio/

İstifadə:  python3 scripts/reels-build.py
"""
import json
import os
import subprocess
import wave

import numpy as np

ROOT = os.path.join(os.path.dirname(__file__), '..')
PUB = os.path.join(ROOT, 'public')
FPS = 30
SR = 48000
N = 10
rng = np.random.default_rng(11)


def dur(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path], capture_output=True, text=True)
    return float(out.stdout.strip())


# ─── 1-2. Vaxt cədvəli ───────────────────────────────────────
LEAD, TAIL = 5, 6  # kadr: səsdən əvvəl və sonra
CLIP_SEC = 5.0
EXTRA = {'s1': 6, 's6': 10, 's10': 75}  # sual səhnəsində fasilə, sonda CTA üçün əlavə vaxt

scenes, t = [], 0
for i in range(1, N + 1):
    sid = f's{i}'
    v = f'reels/voice/v{i}.mp3'
    vl = dur(os.path.join(PUB, v))
    d = max(84, LEAD + round(vl * FPS) + TAIL + EXTRA.get(sid, 0))
    rate = min(1.0, CLIP_SEC * FPS / d)  # klip qısadırsa yüngül yavaşladılır
    scenes.append({'id': sid, 'from': t, 'duration': d, 'voice': v, 'voiceOffset': LEAD, 'clipRate': round(max(rate, 0.5), 4), 'voiceSec': round(vl, 2)})
    t += d
total = t
turn = scenes[6]['from'] / FPS  # Səhnə 7 — "dönüş" anı

# Səs effektləri (kadr)
sfx = []
def add(file, at, vol):
    sfx.append({'file': f'reels/audio/{file}.wav', 'at': int(at), 'volume': vol})

S = {s['id']: s for s in scenes}
add('whoosh', 0, 0.35)
for sid, cnt in (('s3', 2), ('s4', 2), ('s5', 3)):
    spacing = round(S[sid]['duration'] * (0.26 if cnt == 3 else 0.42))
    for k in range(cnt):
        add('ping', S[sid]['from'] + 8 + k * spacing, 0.55)
add('riser', S['s7']['from'] - 45, 0.5)
add('impact', S['s7']['from'], 0.6)
for k in range(6):
    add('pop', S['s8']['from'] + 4 + k * 9, 0.35)
add('chime', S['s10']['from'] + round(S['s10']['duration'] * 0.38), 0.5)

json.dump({'fps': FPS, 'total': total, 'scenes': scenes, 'music': 'reels/audio/music.wav', 'sfx': sfx},
          open(os.path.join(ROOT, 'src', 'reels', 'timeline.json'), 'w'), ensure_ascii=False, indent=2)
print(f'Ümumi: {total} kadr = {total / FPS:.1f} san; dönüş {turn:.1f} san')
for s in scenes:
    print(f"  {s['id']:4s} {s['from'] / FPS:5.1f}s  {s['duration'] / FPS:4.1f}s  səs {s['voiceSec']}s  klip sürəti {s['clipRate']}")


# ─── 3. Musiqi və effektlər ──────────────────────────────────
def note(n):
    names = {'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4, 'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2}
    return 440.0 * 2 ** ((names[n[:-1]] + (int(n[-1]) - 4) * 12) / 12)


def lowpass(x, hi, lo=None):
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(x.shape[0], 1 / SR)
    g = 1 / np.sqrt(1 + (f / hi) ** 4)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / np.maximum(f, 1e-3)) ** 4)
    return np.fft.irfft(X * (g[:, None] if x.ndim == 2 else g), n=x.shape[0], axis=0)


def reverb(x, sec=1.8, mix=0.25):
    n = int(sec * SR)
    env = np.exp(-np.arange(n) / SR * 6.9 / sec)
    ir = np.stack([rng.standard_normal(n) * env, rng.standard_normal(n) * env], 1)
    ir = lowpass(ir, 6000, 200)
    ir /= np.sqrt((ir ** 2).sum(0, keepdims=True))
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    size = 1 << int(np.ceil(np.log2(x.shape[0] + n)))
    wet = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], size) * np.fft.rfft(ir[:, c], size), size)[: x.shape[0]] for c in range(2)], 1)
    return x * (1 - mix) + wet * mix


def save(name, x, peak_db=-1.0):
    os.makedirs(os.path.join(PUB, 'reels', 'audio'), exist_ok=True)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
    with wave.open(os.path.join(PUB, 'reels', 'audio', name), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype('<i2').tobytes())


def music(total_sec, turn_sec):
    n = int(total_sec * SR)
    out = np.zeros((n, 2))
    bpm = 104
    beat = 60 / bpm
    # Hissə A — gərgin: A minor, səkkizlik pulsasiya, saat tıqqıltısı
    a_chords = [['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['D3', 'F3', 'A3'], ['E2', 'B2', 'G#3']]
    # Hissə B — ümidli: C major
    b_chords = [['C3', 'G3', 'E4'], ['G2', 'D3', 'B3'], ['A2', 'E3', 'C4'], ['F2', 'C3', 'A3']]
    bar = beat * 4
    t8 = np.arange(int(beat / 2 * SR)) / SR
    t = 0.0
    k = 0
    while t < total_sec - 0.01:
        part_b = t >= turn_sec
        ch = (b_chords if part_b else a_chords)[int(t // bar) % 4]
        a = int(t * SR)
        # pulsasiya sintezatoru (bas + akkord)
        f0 = note(ch[0])
        env = np.exp(-t8 * (7 if not part_b else 4))
        pulse = np.sin(2 * np.pi * f0 * t8) + 0.4 * np.sin(2 * np.pi * 2 * f0 * t8)
        vel = 0.16 if not part_b else 0.12
        b = min(n, a + len(t8))
        out[a:b] += (pulse * env * vel)[: b - a, None]
        if part_b:
            # parlaq piano-pluk arpeccio
            nm = ch[(k % 3)]
            fp = note(nm) * 4
            pl = (np.sin(2 * np.pi * fp * t8) + 0.3 * np.sin(2 * np.pi * 2 * fp * t8)) * np.exp(-t8 * 5)
            out[a:b, 0] += pl[: b - a] * 0.07
            out[a:b, 1] += pl[: b - a] * 0.07
        else:
            # saat tıqqıltısı
            tk = rng.standard_normal(len(t8)) * np.exp(-t8 * 300) * (0.06 if k % 2 == 0 else 0.03)
            out[a:b] += tk[: b - a, None]
        # nağara: hissə B-də yumşaq kik hər vuruşda
        if part_b and k % 2 == 0:
            kt = np.arange(int(0.25 * SR)) / SR
            kick = np.sin(2 * np.pi * (50 + 70 * np.exp(-kt * 30)) * kt) * np.exp(-kt * 14)
            bb = min(n, a + len(kt))
            out[a:bb] += (kick * 0.35)[: bb - a, None]
        t += beat / 2
        k += 1
    # pad
    tt = np.arange(n) / SR
    for i in range(int(np.ceil(total_sec / bar))):
        s0 = i * bar
        part_b = s0 >= turn_sec
        ch = (b_chords if part_b else a_chords)[i % 4]
        a = int(s0 * SR)
        L = min(n - a, int((bar + 0.6) * SR))
        if L <= 0:
            break
        tl = np.arange(L) / SR
        env = np.minimum(1, tl / 0.5) * np.clip((bar + 0.6 - tl) / 0.6, 0, 1)
        sig = sum(np.sin(2 * np.pi * note(nm) * 2 * tl) for nm in ch) / 3
        out[a:a + L] += (sig * env * (0.10 if part_b else 0.07))[:, None]
    # dönüşdən əvvəl qısa sükut (sual anı)
    gap = (tt > turn_sec - 1.1) & (tt < turn_sec)
    out[gap] *= np.linspace(1, 0.15, gap.sum())[:, None]
    out = lowpass(out, 7000, 40)
    out = reverb(out, 2.0, 0.22)
    fade = np.minimum(1, tt / 0.8) * np.clip((total_sec - tt) / 2.0, 0, 1)
    save('music.wav', out * fade[:, None], -3)


def ping():
    t = np.arange(int(0.6 * SR)) / SR
    x = (np.sin(2 * np.pi * 1568 * t) + 0.5 * np.sin(2 * np.pi * 2093 * t)) * np.exp(-t * 9) * np.minimum(1, t / 0.003)
    save('ping.wav', reverb(x, 0.8, 0.2), -4)


def riser():
    d = 1.5
    t = np.arange(int(d * SR)) / SR
    noise = rng.standard_normal((len(t), 2))
    x = lowpass(noise, 4000, 300) * (t / d)[:, None] ** 2
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 800 * (t / d) ** 2) / SR) * (t / d) ** 2 * 0.3
    save('riser.wav', x + sweep[:, None], -4)


def impact():
    t = np.arange(int(1.6 * SR)) / SR
    boom = np.sin(2 * np.pi * (45 + 60 * np.exp(-t * 20)) * t) * np.exp(-t * 4)
    shimmer = sum(np.sin(2 * np.pi * note(n) * 4 * t) for n in ('C4', 'E4', 'G4')) * np.exp(-t * 2.2) * 0.15
    save('impact.wav', reverb(boom + shimmer, 2.2, 0.3), -3)


if __name__ == '__main__':
    music(total / FPS, turn)
    ping()
    riser()
    impact()
    for f in ('pop', 'chime', 'whoosh'):
        src = os.path.join(PUB, 'audio', f + '.wav')
        dst = os.path.join(PUB, 'reels', 'audio', f + '.wav')
        if not os.path.exists(dst):
            import shutil
            shutil.copy(src, dst)
    print('Səslər hazırdır → public/reels/audio/')
