"""Seeded, tileable textures for the film (hand-painted plaster, earth, cloth, grain)."""
import os, zlib, struct
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "tex")
os.makedirs(OUT, exist_ok=True)


def png(path, arr):
    """Minimal RGBA PNG writer (uint8 HxWx4)."""
    h, w, _ = arr.shape
    raw = b"".join(b"\x00" + arr[y].tobytes() for y in range(h))
    def chunk(t, d):
        return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    data += chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    open(path, "wb").write(data)


def fbm(rng, h, w, beta, lo=1.0):
    """Periodic 1/f^beta noise via FFT, normalised to 0..1."""
    n = rng.standard_normal((h, w))
    fy = np.fft.fftfreq(h)[:, None]; fx = np.fft.fftfreq(w)[None, :]
    f = np.sqrt(fx * fx + fy * fy); f[0, 0] = 1
    spec = np.fft.fft2(n) / (f ** beta)
    spec[f < lo / max(h, w)] = 0
    out = np.real(np.fft.ifft2(spec))
    out -= out.min(); out /= out.max()
    return out


def gray_rgba(v, alpha=255):
    v = np.clip(v, 0, 1)
    g = (v * 255).astype(np.uint8)
    a = np.full_like(g, alpha) if np.isscalar(alpha) else (np.clip(alpha, 0, 1) * 255).astype(np.uint8)
    return np.dstack([g, g, g, a])


rng = np.random.default_rng(1447)

# Plaster: broad trowel mottling + fine grit + a few hairline cracks.
S = 512
broad = fbm(rng, S, S, 1.6)
mid = fbm(rng, S, S, 1.1)
grit = rng.random((S, S))
plaster = 0.55 * broad + 0.3 * mid + 0.15 * grit
cracks = fbm(rng, S, S, 1.8)
ridge = 1 - np.abs(cracks - 0.5) * 2
plaster -= 0.22 * np.clip((ridge - 0.985) * 60, 0, 1)
pits = rng.random((S, S)) > 0.9975
plaster[pits] -= 0.35
png(os.path.join(OUT, "plaster.png"), gray_rgba(0.25 + 0.6 * plaster))

# Earth: packed dust with pebbles and wheel-less foot-worn streaks.
earth = 0.5 * fbm(rng, S, S, 1.4) + 0.35 * fbm(rng, S, S, 0.8) + 0.15 * rng.random((S, S))
peb = fbm(rng, S, S, 0.3)
earth += 0.25 * np.clip((peb - 0.82) * 8, 0, 1)
png(os.path.join(OUT, "earth.png"), gray_rgba(0.2 + 0.65 * earth))

# Cloth weave: fine warp/weft with slub irregularity (for robe, sack, mat).
W = 256
y, x = np.mgrid[0:W, 0:W]
slub = fbm(rng, W, W, 1.2)
warp = 0.5 + 0.5 * np.sin(x * 2 * np.pi / 4 + slub * 2.5)
weft = 0.5 + 0.5 * np.sin(y * 2 * np.pi / 4 + slub * 2.0)
weave = 0.45 * warp * weft + 0.35 * slub + 0.2 * rng.random((W, W))
png(os.path.join(OUT, "weave.png"), gray_rgba(0.2 + 0.7 * weave))

# Coarse burlap for the sack.
burlap_slub = fbm(rng, W, W, 1.0)
bw = 0.5 + 0.5 * np.sin(x * 2 * np.pi / 8 + burlap_slub * 3)
bf = 0.5 + 0.5 * np.sin(y * 2 * np.pi / 8 + burlap_slub * 3)
burlap = 0.55 * np.maximum(bw, bf) + 0.3 * burlap_slub + 0.15 * rng.random((W, W))
png(os.path.join(OUT, "burlap.png"), gray_rgba(0.15 + 0.75 * burlap))

# Woven reed mat: wide alternating bands.
mat = (((x // 16) + (y // 16)) % 2).astype(float)
reeds = np.where(mat > 0, 0.5 + 0.5 * np.sin(y * np.pi / 4), 0.5 + 0.5 * np.sin(x * np.pi / 4))
matv = 0.55 * reeds + 0.25 * fbm(rng, W, W, 1.0) + 0.2 * mat
png(os.path.join(OUT, "mat.png"), gray_rgba(0.25 + 0.6 * matv))

# Painterly wash: large soft brush mottling, used once per frame at low opacity.
wash = fbm(rng, 512, 288, 2.2)
png(os.path.join(OUT, "wash.png"), gray_rgba(wash))

# Film grain: 8 seeded frames, mid-grey centred so `overlay` leaves tone intact.
for i in range(8):
    g = rng.normal(0.5, 0.13, (960, 540))
    g = np.clip(g, 0, 1)
    png(os.path.join(OUT, f"grain{i}.png"), gray_rgba(g))
print("textures written to", OUT)
