"""Procedural characters: articulated bodies with per-frame cloth, hands and faces."""
import math
import bpy
from mathutils import Vector as V, Matrix
from lib import (UP, Tube, box, capsule, clamp, ellipsoid, ik, lagged, lerp, mat, place, place_at,
                 reach, ring_pts, basis, weave_mat, hexc, noise1)
from gait import fwd, right, ANKLE_H, TOE

# --------------------------------------------------------------------------- materials
def skin_mat(name, hexcol):
    return mat(name, hexc(hexcol), rough=0.48, sss=0.35, sss_radius=(1.0, 0.42, 0.22), noise=0.06, noise_scale=60,
               bump=0.04, bump_scale=300)


class Hand:
    """Palm + four 3-segment fingers + a 3-segment thumb, posed per frame."""
    LEN = [(0.044, 0.026, 0.02), (0.049, 0.03, 0.022), (0.046, 0.028, 0.021), (0.036, 0.022, 0.018)]
    RAD = [0.0092, 0.0095, 0.009, 0.0078]
    OFF = [0.031, 0.011, -0.009, -0.027]

    def __init__(self, name, skin, scale=1.0):
        self.k = scale
        k = scale
        self.palm = ellipsoid(name + '_palm', 0.046 * k, 0.017 * k, 0.052 * k, skin, segs=24, rings=12)
        self.heel = ellipsoid(name + '_heel', 0.04 * k, 0.019 * k, 0.03 * k, skin, segs=20, rings=10)
        self.fingers = []
        for i in range(4):
            segs = []
            for j, L in enumerate(self.LEN[i]):
                r = self.RAD[i] * k * (1 - 0.1 * j)
                segs.append(capsule(f'{name}_f{i}{j}', r, r * 0.95, L * k, skin, segs=14, rings=4))
            self.fingers.append(segs)
        self.thumb = [capsule(f'{name}_t{j}', r * k, r * k * 0.95, L * k, skin, segs=14, rings=4)
                      for j, (L, r) in enumerate(((0.038, 0.0125), (0.03, 0.0112), (0.024, 0.0102)))]

    def pose(self, wrist, D, N, T, curl=(0.4, 0.4, 0.4, 0.4), thumb=0.4, spread=0.0):
        """D: wrist->knuckles, N: palm normal (palm faces N), T: toward the thumb side."""
        k = self.k
        D, N, T = D.normalized(), N.normalized(), T.normalized()
        def frame(T, N, D):
            return Matrix((T, N, D)).transposed() if T.dot(N.cross(D)) > 0 else Matrix((T, -N, D)).transposed()
        place_at(self.palm, wrist + D * 0.05 * k, frame(T, N, D))
        place_at(self.heel, wrist + D * 0.018 * k + N * 0.004 * k, frame(T, N, D))
        for i in range(4):
            base = wrist + D * 0.093 * k + T * (self.OFF[i] * k) + N * (0.002 * k)
            D0 = (D + T * (spread * (1.5 - i) * 0.08)).normalized()
            p = base
            c = curl[i] if isinstance(curl, (list, tuple)) else curl
            A = 0.0
            for j, seg in enumerate(self.fingers[i]):
                A += c * (0.9, 1.25, 0.95)[j]
                d = (D0 * math.cos(A) + N * math.sin(A)).normalized()
                q = p + d * self.LEN[i][j] * k
                place(seg, p, q, T)
                p = q
        # thumb: from the base of the palm, opposes toward the palm centre as it curls
        p = wrist + D * 0.022 * k + T * 0.034 * k + N * 0.008 * k
        d = (D * 0.55 + T * 0.75 + N * 0.35).normalized()
        for j, seg in enumerate(self.thumb):
            a = thumb * (0.55, 0.75, 0.7)[j]
            toward = (D * 0.6 - T * 0.5 + N * 0.6).normalized()
            d = (d * math.cos(a) + toward * math.sin(a)).normalized()
            L = (0.038, 0.03, 0.024)[j] * k
            q = p + d * L
            place(seg, p, q, N)
            p = q

    def objects(self):
        return [self.palm, self.heel] + [s for f in self.fingers for s in f] + self.thumb

    def hide(self, h):
        for o in self.objects():
            o.hide_render = h


# --------------------------------------------------------------------------- adult
DIM = dict(hipW=0.1, thigh=0.46, shin=0.45, torso=0.52, shW=0.2, upper=0.3, fore=0.265, headR=0.105, neck=0.16)


def solve(p):
    """Joint positions from a pose dict (adult proportions)."""
    th = p['heading']
    F, R = fwd(th), right(th)
    pel = p['pelvis']
    roll = p.get('roll', 0.0)
    hipL = pel - R * DIM['hipW'] + UP * (-roll * DIM['hipW'])
    hipR = pel + R * DIM['hipW'] + UP * (roll * DIM['hipW'])
    lean = p.get('lean', 0.04)
    spine = (UP * math.cos(lean) + F * math.sin(lean) + R * p.get('side', 0.0)).normalized()
    neck = pel + spine * DIM['torso']
    sr = p.get('shoulderRoll', 0.0)
    shL = neck - R * DIM['shW'] - spine * 0.04 + UP * (-sr * DIM['shW'])
    shR = neck + R * DIM['shW'] - spine * 0.04 + UP * (sr * DIM['shW'])
    hp = p.get('headPitch', 0.06)
    hdir = (spine * math.cos(hp) + F * math.sin(hp)).normalized()
    head = neck + hdir * DIM['neck']
    legL = DIM['thigh'] + DIM['shin']
    ankL = reach(hipL, p['ankleL'], legL * 0.999)
    ankR = reach(hipR, p['ankleR'], legL * 0.999)
    kneeL = ik(hipL, ankL, DIM['thigh'], DIM['shin'], F - R * 0.1)
    kneeR = ik(hipR, ankR, DIM['thigh'], DIM['shin'], F + R * 0.1)
    armL = DIM['upper'] + DIM['fore']
    wrL = reach(shL, p['handL'], armL * 0.999)
    wrR = reach(shR, p['handR'], armL * 0.999)
    elL = ik(shL, wrL, DIM['upper'], DIM['fore'], p.get('poleL', -F * 0.5 - UP * 0.8 - R * 0.45))
    elR = ik(shR, wrR, DIM['upper'], DIM['fore'], p.get('poleR', -F * 0.5 - UP * 0.8 + R * 0.45))
    return dict(F=F, R=R, spine=spine, pelvis=pel, neck=neck, head=head, hdir=hdir, hipL=hipL, hipR=hipR,
                kneeL=kneeL, kneeR=kneeR, ankL=ankL, ankR=ankR, shL=shL, shR=shR, elL=elL, elR=elR, wrL=wrL, wrR=wrR,
                pitchL=p.get('pitchL', 0.0), pitchR=p.get('pitchR', 0.0), thL=p.get('thL', th), thR=p.get('thR', th))


def leg_point(hip, knee, ank, k):
    """Point at fraction k (0 hip .. 1 ankle) along the leg."""
    lt = (knee - hip).length
    ls = (ank - knee).length
    s = k * (lt + ls)
    return hip.lerp(knee, s / lt) if s <= lt else knee.lerp(ank, (s - lt) / ls)


def leg_dir(hip, knee, ank, k):
    lt = (knee - hip).length
    ls = (ank - knee).length
    return (knee - hip).normalized() if k * (lt + ls) <= lt else (ank - knee).normalized()


class Man:
    def __init__(self):
        self.skin = skin_mat('man_skin', '#a9765a')
        self.robe_m = weave_mat('robe', hexc('#d6cbb2'), hexc('#b7aa8f'), scale=240)
        self.cloak_m = weave_mat('cloak', hexc('#6e4b2e'), hexc('#4d321d'), scale=160, sheen=0.5)
        self.head_m = weave_mat('headcloth', hexc('#b9ad93'), hexc('#978a70'), scale=260)
        self.sash_m = weave_mat('sash', hexc('#8a7656'), hexc('#6c5a40'), scale=200)
        self.sandal_m = mat('sandal', hexc('#4a3322'), rough=0.7, noise=0.3, noise_scale=30, bump=0.2)
        sk = self.skin
        self.shin = {s: capsule('shin' + s, 0.046, 0.034, DIM['shin'], sk) for s in 'LR'}
        self.foot = {s: ellipsoid('foot' + s, 0.045, 0.125, 0.032, sk) for s in 'LR'}
        self.sole = {s: box('sole' + s, 0.1, 0.27, 0.018, self.sandal_m, bevel=0.006) for s in 'LR'}
        self.strap = {s: capsule('strap' + s, 0.009, 0.009, 0.1, self.sandal_m, segs=10) for s in 'LR'}
        self.strap2 = {s: capsule('strapb' + s, 0.008, 0.008, 0.09, self.sandal_m, segs=10) for s in 'LR'}
        self.neckm = capsule('neck', 0.055, 0.05, DIM['neck'], sk)
        self.headm = ellipsoid('head', 0.098, 0.108, 0.118, sk)
        self.cap = ellipsoid('cap', 0.108, 0.118, 0.1, self.head_m, segs=40, rings=20)
        self.wrap1 = ellipsoid('wrap1', 0.124, 0.132, 0.05, self.head_m, segs=40, rings=12)
        self.wrap2 = ellipsoid('wrap2', 0.116, 0.125, 0.03, self.head_m, segs=40, rings=12)
        self.tail = Tube('headtail', 6, 12, self.head_m, closed=False)
        self.hand = {'L': Hand('handL', sk), 'R': Hand('handR', sk)}
        self.robe = Tube('robe', 13, 28, self.robe_m)
        self.cloak = Tube('cloak', 10, 22, self.cloak_m, closed=False)
        self.sleeve = {s: Tube('sleeve' + s, 5, 16, self.robe_m) for s in 'LR'}
        self.sash = Tube('sash', 3, 28, self.sash_m)

    # ----------------------------------------------------------------- per frame
    def apply(self, p, lag):
        """p: pose dict; lag: dict(pos=V, turn=float) cloth lag relative to the body."""
        J = solve(p)
        F, R, S = J['F'], J['R'], J['spine']
        t = p.get('frame', 0)
        # legs and sandals
        for s in 'LR':
            knee, ank = J['knee' + s], J['ank' + s]
            place(self.shin[s], knee, ank, F)
            th = J['th' + s]
            pitch = J['pitch' + s]
            fd = (fwd(th) * math.cos(pitch) + UP * -math.sin(pitch)).normalized()
            fu = (fwd(th) * math.sin(pitch) + UP * math.cos(pitch)).normalized()
            side = right(th)
            rot = Matrix((side, fd, fu)).transposed()
            place_at(self.foot[s], ank + fd * 0.06 - fu * 0.03, rot)
            place_at(self.sole[s], ank + fd * 0.06 - fu * (ANKLE_H - 0.009), rot)
            place(self.strap[s], ank + fd * 0.11 - fu * 0.035 - side * 0.05, ank + fd * 0.11 - fu * 0.035 + side * 0.05, fu)
            place(self.strap2[s], ank - fd * 0.03 - fu * 0.03 - side * 0.045, ank - fd * 0.03 - fu * 0.03 + side * 0.045, fu)
        # head with plain covering (face is never modelled or shown)
        hd = J['hdir']
        place(self.neckm, J['neck'] - S * 0.03, J['head'], F)
        hrot = Matrix((R, F, hd)).transposed()
        place_at(self.headm, J['head'] + hd * 0.02, hrot)
        place_at(self.cap, J['head'] + hd * 0.045 - F * 0.006, hrot)
        place_at(self.wrap1, J['head'] + hd * 0.005 - F * 0.006, hrot @ Matrix.Rotation(-0.12, 3, 'X'))
        place_at(self.wrap2, J['head'] + hd * 0.052 - F * 0.006, hrot @ Matrix.Rotation(0.1, 3, 'X'))
        tail = []
        for i in range(6):
            k = i / 5
            c = J['head'] - F * (0.075 + 0.03 * k) - hd * (0.03 + 0.1 * k) + lag['pos'] * (0.3 * k)
            w = 0.07 + 0.02 * k
            tail.extend(ring_pts(c, R, F, w, 0.06 + 0.03 * k, 12, open_front=(math.radians(205), math.radians(335)),
                                 wob=lambda j, k=k: 1 + 0.06 * k * math.sin(j * 2.1)))
        self.tail.set(tail)
        self.tail.ob.hide_render = True
        # hands
        for s in 'LR':
            el, wr = J['el' + s], J['wr' + s]
            D = p.get('handDir' + s) or (wr - el).normalized()
            N = p.get('palm' + s) or (-R if s == 'R' else R)
            T = p.get('thumb' + s) or (F if (s == 'R') else F)
            Nn = (N - D * N.dot(D)).normalized()
            Tn = (T - D * T.dot(D) - Nn * T.dot(Nn))
            Tn = Tn.normalized() if Tn.length > 1e-4 else D.cross(Nn)
            self.hand[s].pose(wr, D, Nn, Tn, p.get('curl' + s, 0.45), p.get('thumbCurl' + s, 0.4))
        # sleeves
        for s in 'LR':
            sh, el, wr = J['sh' + s], J['el' + s], J['wr' + s]
            pts = []
            for (a, b, k, r) in ((sh, el, 0.0, 0.08), (sh, el, 0.5, 0.074), (el, wr, 0.0, 0.07), (el, wr, 0.6, 0.068), (el, wr, 0.97, 0.072)):
                c = a.lerp(b, k)
                ax = (b - a).normalized()
                u = (UP - ax * UP.dot(ax))
                u = u.normalized() if u.length > 1e-4 else ax.orthogonal().normalized()
                w = ax.cross(u)
                pts.extend(ring_pts(c, u, w, r, r, 16))
            self.sleeve[s].set(pts)
        # robe rings: torso, then along both legs down to the hem
        P = J['pelvis']
        def torso_ring(c, ru, rw, n):
            return ring_pts(c, R, F, ru, rw, n)
        rings = [
            torso_ring(J['neck'] + S * 0.005, 0.075, 0.07, 28),
            torso_ring(J['neck'] - S * 0.07, 0.215, 0.12, 28),
            torso_ring(P + S * 0.3, 0.19, 0.13, 28),
            torso_ring(P + S * 0.1, 0.178, 0.13, 28),
            torso_ring(P - S * 0.03, 0.19, 0.145, 28),
        ]
        ks = [0.12, 0.26, 0.4, 0.54, 0.67, 0.78, 0.86, 0.91]
        for i, k in enumerate(ks):
            a = leg_point(J['hipL'], J['kneeL'], J['ankL'], k)
            b = leg_point(J['hipR'], J['kneeR'], J['ankR'], k)
            c = (a + b) / 2
            d = (leg_dir(J['hipL'], J['kneeL'], J['ankL'], k) + leg_dir(J['hipR'], J['kneeR'], J['ankR'], k)).normalized()
            down = -d
            u = (R - down * R.dot(down)).normalized()
            w = down.cross(u) * -1
            spread_u = abs((a - b).dot(u)) / 2
            spread_w = abs((a - b).dot(w)) / 2
            wk = (i + 1) / len(ks)
            c = c + lag['pos'] * wk * 1.0
            ru = max(0.19 + 0.02 * wk, spread_u + 0.13)
            rw = max(0.15 + 0.02 * wk, spread_w + 0.12)
            turn = lag['turn'] * wk * 0.6
            uu = u * math.cos(turn) + w * math.sin(turn)
            ww = w * math.cos(turn) - u * math.sin(turn)
            rings.append(ring_pts(c, uu, ww, ru, rw, 28, wob=lambda j, wk=wk: 1 + 0.045 * wk * math.sin(j * 2.35) + 0.02 * wk * math.sin(j * 1.3 + t * 0.12)))
        # keep the hem off the ground
        flat = [pt for r in rings for pt in r]
        for pt in flat:
            if pt.z < 0.03:
                pt.z = 0.03
        self.robe.set(flat)
        # sash
        sash = []
        for dz in (-0.03, 0.0, 0.03):
            sash.extend(ring_pts(P + S * (0.12 + dz), R, F, 0.188, 0.142, 28))
        self.sash.set(sash)
        # cloak: open in front, hangs from the shoulders, trails motion and turns late
        crings = []
        cdefs = [(J['neck'] + S * 0.02, 0.1, 0.09, 0.0, 150), (J['neck'] - S * 0.05, 0.235, 0.15, 0.05, 145),
                 (P + S * 0.32, 0.215, 0.18, 0.15, 140), (P + S * 0.12, 0.2, 0.19, 0.3, 135), (P - S * 0.05, 0.215, 0.2, 0.42, 128)]
        for c, ru, rw, wk, gap in cdefs:
            turn = lag['turn'] * wk
            uu = R * math.cos(turn) + F * math.sin(turn)
            ww = F * math.cos(turn) - R * math.sin(turn)
            arc = (math.radians(gap), math.radians(540 - gap))
            crings.append(ring_pts(c + lag['pos'] * wk * 1.4, uu, ww, ru, rw, 22, open_front=arc,
                                   wob=lambda j, wk=wk: 1 + 0.1 * wk * math.sin(j * 2.2) + 0.04 * wk * math.sin(j * 3.7)))
        for i, k in enumerate((0.2, 0.38, 0.55, 0.68, 0.76)):
            a = leg_point(J['hipL'], J['kneeL'], J['ankL'], k)
            b = leg_point(J['hipR'], J['kneeR'], J['ankR'], k)
            c = (a + b) / 2 - F * 0.02
            wk = 0.5 + 0.1 * i
            turn = lag['turn'] * wk
            uu = R * math.cos(turn) + F * math.sin(turn)
            ww = F * math.cos(turn) - R * math.sin(turn)
            spread = abs((a - b).dot(R)) / 2
            gap = 122 - 6 * i
            arc = (math.radians(gap), math.radians(540 - gap))
            ring = ring_pts(c + lag['pos'] * wk * 1.6, uu, ww, max(0.23, spread + 0.15), 0.22 + 0.02 * i, 22,
                            open_front=arc, wob=lambda j, i=i: 1 + 0.12 * math.sin(j * 2.2) + 0.05 * math.sin(j * 3.7 + i) + 0.03 * math.sin(j * 1.1 + t * 0.1 + i))
            if i == 4:
                # curved hemline: the open edges hang a little lower than the back
                ring = [q + UP * (0.05 * math.cos(math.pi * j / 21) ** 2) for j, q in enumerate(ring)]
            crings.append(ring)
        flat = [pt for r in crings for pt in r]
        for pt in flat:
            if pt.z < 0.04:
                pt.z = 0.04
        self.cloak.set(flat)
        return J


# --------------------------------------------------------------------------- sack
class Sack:
    PROF = [(-0.13, 0.012), (-0.1, 0.03), (-0.05, 0.035), (0.0, 0.028), (0.06, 0.05), (0.16, 0.115), (0.3, 0.15),
            (0.46, 0.165), (0.62, 0.162), (0.78, 0.14), (0.9, 0.1), (0.97, 0.05), (1.0, 0.0)]

    def __init__(self):
        self.m = weave_mat('burlap', hexc('#9c8458'), hexc('#6f5a3a'), scale=70, rough=0.95, sheen=0.3)
        self.tube = Tube('sack', len(self.PROF), 20, self.m, subsurf=2)
        self.cord = Tube('cord', 3, 16, mat('cord', hexc('#3e3122'), rough=0.8))
        bread = mat('bread', hexc('#c99a5c'), rough=0.7, noise=0.35, noise_scale=25, bump=0.3, bump_scale=40,
                    color2=hexc('#8f5e2c'))
        self.bread = [ellipsoid(f'bread{i}', 0.085, 0.085, 0.014, bread) for i in range(2)]
        self.dates = ellipsoid('datepouch', 0.045, 0.04, 0.035, mat('pouch', hexc('#6b4a2e'), rough=0.85, noise=0.3))
        dmat = mat('dates', hexc('#4a2414'), rough=0.3, noise=0.2)
        self.date = [ellipsoid(f'date{i}', 0.009, 0.014, 0.009, dmat) for i in range(3)]

    def apply(self, neck, ctrl, bottom, squash=0.0, opened=0.0, ground=0.0):
        """Centre line is a quadratic bezier neck->ctrl->bottom (lets it drape over a shoulder)."""
        def bez(t):
            return neck * (1 - t) ** 2 + ctrl * (2 * t * (1 - t)) + bottom * t * t
        def tan(t):
            return (2 * (1 - t) * (ctrl - neck) + 2 * t * (bottom - ctrl)).normalized()
        pts = []
        u_prev = None
        for (t, r) in self.PROF:
            if t < 0:
                ax = tan(0.0)
                c = neck + ax * (t * 0.55)
                r = r * (1 + opened * 2.4)
            else:
                ax = tan(t)
                c = bez(t * (1 - 0.08 * squash))
                if t < 0.12:
                    r = r * (1 + opened * 1.7)
            r = r * (1 + 0.12 * squash * t)
            if u_prev is None:
                u = V((1, 0, 0)) - ax * ax.x
                u = u.normalized() if u.length > 1e-4 else ax.orthogonal().normalized()
            else:
                u = (u_prev - ax * u_prev.dot(ax)).normalized()
            u_prev = u
            w = ax.cross(u)
            lump = (lambda j, t=t: 1 + 0.07 * math.sin(j * 1.9 + t * 9) + 0.05 * math.sin(j * 3.3 + t * 5)) if 0.1 < t < 0.95 else None
            ring = ring_pts(c, u, w, r, r * (1 - 0.1 * squash), 20, wob=lump)
            if t < 0 and opened > 0:
                ring = [q - ax * (opened * 0.05) for q in ring]
            pts.extend(ring)
        for q in pts:
            if q.z < ground + 0.004:
                q.z = ground + 0.004
        self.tube.set(pts)
        ax0 = tan(0.0)
        u = V((1, 0, 0)) - ax0 * ax0.x
        u = u.normalized() if u.length > 1e-4 else ax0.orthogonal().normalized()
        w = ax0.cross(u)
        cord = []
        for dt in (0.0, 0.015, 0.03):
            cord.extend(ring_pts(neck + ax0 * dt, u, w, 0.034, 0.034, 16))
        self.cord.set(cord)
        self.cord.ob.hide_render = opened > 0.3
        show = opened > 0.05
        for b in self.bread + self.dates_list():
            b.hide_render = not show
        if show:
            top = neck - ax0 * 0.01
            bm = Matrix((u, w, ax0)).transposed()
            place_at(self.bread[0], top - ax0 * 0.01 + u * 0.015, bm)
            place_at(self.bread[1], top - ax0 * 0.026 - u * 0.02 + w * 0.01, bm @ Matrix.Rotation(0.2, 3, 'X'))
            place_at(self.dates, top - ax0 * 0.0 + w * 0.05 - u * 0.03, bm)
            for i, d in enumerate(self.date):
                place_at(d, top + ax0 * 0.02 + w * (0.03 + 0.012 * i) - u * (0.05 - 0.01 * i), bm)

    def dates_list(self):
        return [self.dates] + self.date


# --------------------------------------------------------------------------- children
class Child:
    """Stylised child with an expressive face. Units in metres; `k` scales the body."""

    def __init__(self, name, k, skin_hex, tunic, tunic2, scarf=None, hair=None, iris='#3b2416'):
        self.name, self.k = name, k
        self.skin = skin_mat(name + '_skin', skin_hex)
        self.tunic_m = weave_mat(name + '_tunic', hexc(tunic), hexc(tunic2), scale=220)
        self.dim = dict(hipW=0.075 * k, thigh=0.36 * k, shin=0.35 * k, torso=0.4 * k, shW=0.15 * k, upper=0.23 * k,
                        fore=0.2 * k, headR=0.105 * (0.9 + 0.1 * k), neck=0.11 * k)
        r = self.dim['headR']
        self.r = r
        sk = self.skin
        self.headm = ellipsoid(name + '_head', r * 0.96, r * 1.0, r * 1.06, sk, segs=48, rings=24)
        self.jaw = ellipsoid(name + '_jaw', r * 0.7, r * 0.72, r * 0.6, sk, segs=32, rings=16)
        self.neckm = capsule(name + '_neck', 0.04 * k, 0.038 * k, self.dim['neck'], sk)
        white = mat(name + '_sclera', (0.85, 0.83, 0.8), rough=0.08, sss=0.2)
        irm = mat(name + '_iris', hexc(iris), rough=0.1, noise=0.4, noise_scale=200)
        pup = mat(name + '_pupil', (0.01, 0.01, 0.01), rough=0.05)
        lip = skin_mat(name + '_lip', '#9c5a4a')
        brow = mat(name + '_brow', hexc('#2a1c14'), rough=0.9)
        self.eR = r * 0.235
        self.eye, self.iris, self.pupil, self.lid, self.lowlid, self.brow = {}, {}, {}, {}, {}, {}
        for s in 'LR':
            self.eye[s] = ellipsoid(f'{name}_eye{s}', self.eR, self.eR, self.eR, white, segs=32, rings=16)
            self.iris[s] = ellipsoid(f'{name}_iris{s}', self.eR * 0.62, self.eR * 0.62, self.eR * 0.12, irm, segs=32, rings=8)
            self.pupil[s] = ellipsoid(f'{name}_pupil{s}', self.eR * 0.3, self.eR * 0.3, self.eR * 0.06, pup, segs=24, rings=8)
            self.lid[s] = self._lid(f'{name}_lid{s}', self.eR * 1.1, sk)
            self.lowlid[s] = self._lid(f'{name}_low{s}', self.eR * 1.06, sk)
            self.brow[s] = capsule(f'{name}_brow{s}', r * 0.035, r * 0.022, r * 0.42, brow, segs=10)
        self.nose = ellipsoid(name + '_nose', r * 0.12, r * 0.1, r * 0.12, sk)
        self.mouth = [capsule(f'{name}_m{i}', r * 0.022, r * 0.022, r * 0.13, lip, segs=10) for i in range(3)]
        self.ear = {s: ellipsoid(f'{name}_ear{s}', r * 0.06, r * 0.11, r * 0.15, sk) for s in 'LR'}
        self.tunic = Tube(name + '_tunicm', 9, 24, self.tunic_m)
        self.sleeve = {s: Tube(f'{name}_sl{s}', 4, 14, self.tunic_m) for s in 'LR'}
        self.hand = {s: Hand(f'{name}_hand{s}', sk, scale=0.62 + 0.25 * k) for s in 'LR'}
        self.shin = {s: capsule(f'{name}_shin{s}', 0.036 * k, 0.028 * k, self.dim['shin'], sk) for s in 'LR'}
        self.foot = {s: ellipsoid(f'{name}_foot{s}', 0.036 * k, 0.095 * k, 0.026 * k, sk) for s in 'LR'}
        self.scarf = None
        self.hair = []
        if scarf:
            self.scarf_m = weave_mat(name + '_scarf', hexc(scarf[0]), hexc(scarf[1]), scale=230)
            self.scarf = Tube(name + '_scarf', 9, 26, self.scarf_m, closed=False)
        if hair:
            hm = mat(name + '_hair', hexc(hair), rough=0.45, noise=0.5, noise_scale=90, bump=0.6, bump_scale=120)
            cap = ellipsoid(name + '_haircap', r * 1.03, r * 1.06, r * 1.08, hm, segs=48, rings=24)
            # carve the face: pull front-lower vertices inside the head
            for v in cap.data.vertices:
                if v.co.y > r * 0.35 and v.co.z < r * 0.62:
                    v.co *= 0.9
                v.co.z += noise1(v.co.x * 90, 3) * 0.004 + noise1(v.co.y * 80, 5) * 0.004
            self.hair.append(cap)
            self.locks = [capsule(f'{name}_lock{i}', r * 0.07, r * 0.03, r * 0.32, hm, segs=12) for i in range(5)]
            self.hair += self.locks
        else:
            self.locks = []

    def _lid(self, name, rad, m):
        import bmesh
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=rad)
        # keep the upper hemisphere: a shell that rotates down over the eye
        for v in [v for v in bm.verts if v.co.z < -rad * 0.05]:
            bm.verts.remove(v)
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        from lib import new_obj
        ob = new_obj(name, me, m)
        so = ob.modifiers.new('s', 'SOLIDIFY'); so.thickness = rad * 0.08
        return ob

    def solve(self, p):
        d = self.dim
        th = p['heading']
        F, R = fwd(th), right(th)
        pel = p['pelvis']
        lean = p.get('lean', 0.02)
        spine = (UP * math.cos(lean) + F * math.sin(lean)).normalized()
        neck = pel + spine * d['torso']
        sr = p.get('shoulderDrop', 0.0)
        shL = neck - R * d['shW'] - spine * (0.03 + sr) * self.k
        shR = neck + R * d['shW'] - spine * (0.03 + sr) * self.k
        hipL, hipR = pel - R * d['hipW'], pel + R * d['hipW']
        ll = d['thigh'] + d['shin']
        ankL = reach(hipL, p['ankleL'], ll * 0.999)
        ankR = reach(hipR, p['ankleR'], ll * 0.999)
        kneeL = ik(hipL, ankL, d['thigh'], d['shin'], F - R * 0.1)
        kneeR = ik(hipR, ankR, d['thigh'], d['shin'], F + R * 0.1)
        al = d['upper'] + d['fore']
        wrL = reach(shL, p['handL'], al * 0.999)
        wrR = reach(shR, p['handR'], al * 0.999)
        elL = ik(shL, wrL, d['upper'], d['fore'], p.get('poleL', -F * 0.4 - UP * 0.8 - R * 0.5))
        elR = ik(shR, wrR, d['upper'], d['fore'], p.get('poleR', -F * 0.4 - UP * 0.8 + R * 0.5))
        # head orientation: yaw (turn), pitch (nod down +), roll
        yaw, pitch, rl = p.get('headYaw', 0.0), p.get('headPitch', 0.0), p.get('headRoll', 0.0)
        hf = (F * math.cos(yaw) - R * math.sin(yaw))
        hr = (R * math.cos(yaw) + F * math.sin(yaw))
        hu = spine.copy()
        hf2 = (hf * math.cos(pitch) - hu * math.sin(pitch)).normalized()
        hu2 = (hu * math.cos(pitch) + hf * math.sin(pitch)).normalized()
        hr2 = (hr * math.cos(rl) + hu2 * math.sin(rl)).normalized()
        hu3 = hf2.cross(hr2).normalized() * -1
        head = neck + spine * d['neck'] + hu3 * self.r * 0.9
        return dict(F=F, R=R, spine=spine, pelvis=pel, neck=neck, head=head, hf=hf2, hr=hr2, hu=hu3,
                    hipL=hipL, hipR=hipR, kneeL=kneeL, kneeR=kneeR, ankL=ankL, ankR=ankR,
                    shL=shL, shR=shR, elL=elL, elR=elR, wrL=wrL, wrR=wrR)

    def apply(self, p):
        J = self.solve(p)
        r = self.r
        F, R, S = J['F'], J['R'], J['spine']
        hf, hr, hu = J['hf'], J['hr'], J['hu']
        H = J['head']
        hrot = Matrix((hr, hf, hu)).transposed()
        place_at(self.headm, H, hrot)
        place_at(self.jaw, H + hf * r * 0.22 - hu * r * 0.42, hrot)
        place(self.neckm, J['neck'] - S * 0.02, H - hu * r * 0.6, hf)
        gaze = p.get('gaze') or hf
        lid = p.get('lid', 0.15)  # 0 wide open .. 1 closed
        browUp = p.get('brow', 0.0)
        smile = p.get('smile', 0.0)
        for s, side in (('L', -1), ('R', 1)):
            c = H + hf * r * 0.74 + hr * (side * r * 0.36) + hu * r * 0.02
            place_at(self.eye[s], c, hrot)
            g = gaze.normalized()
            grot = basis(g, hu)
            place_at(self.iris[s], c + g * self.eR * 0.93, grot)
            place_at(self.pupil[s], c + g * self.eR * 0.99, grot)
            # upper lid shell rotates about the eye's horizontal axis
            ang = lerp(-1.05, 0.35, clamp(lid))
            lrot = Matrix((hr, hf, hu)).transposed() @ Matrix.Rotation(-math.pi / 2 + ang, 3, 'X')
            place_at(self.lid[s], c, lrot)
            lrot2 = Matrix((hr, hf, hu)).transposed() @ Matrix.Rotation(math.pi / 2 + 0.95, 3, 'X')
            place_at(self.lowlid[s], c, lrot2)
            by = r * (0.38 + 0.07 * browUp)
            inner = c + hu * by + hf * r * 0.16 - hr * side * r * 0.12 + hu * r * 0.04 * browUp
            outer = c + hu * (by - r * 0.04 + r * 0.02 * browUp) + hf * r * 0.06 + hr * side * r * 0.22
            place(self.brow[s], inner, outer, hf)
            place_at(self.ear[s], H + hr * side * r * 0.95 - hu * r * 0.12, hrot)
        place_at(self.nose, H + hf * r * 0.98 - hu * r * 0.2, hrot)
        mc = H + hf * r * 0.86 - hu * r * 0.5
        lift = r * (0.02 + 0.06 * smile)
        pts = [mc - hr * r * 0.2 + hu * lift - hf * r * 0.04, mc - hr * r * 0.07, mc + hr * r * 0.07, mc + hr * r * 0.2 + hu * lift - hf * r * 0.04]
        for i, seg in enumerate(self.mouth):
            place(seg, pts[i], pts[i + 1], hf)
        for i, lk in enumerate(self.locks):
            a = H + hu * r * 0.85 + hf * r * 0.55 + hr * (i - 2) * r * 0.2
            b = a + hf * r * 0.18 - hu * r * 0.28 + hr * (i - 2) * r * 0.05
            place(lk, a, b, hf)
        for h in self.hair[:1]:
            place_at(h, H + hu * r * 0.04 - hf * r * 0.04, hrot)
        # legs
        for s in 'LR':
            place(self.shin[s], J['knee' + s], J['ank' + s], F)
            fd = fwd(p.get('th' + s, p['heading']))
            pitch = p.get('pitch' + s, 0.0)
            fd2 = (fd * math.cos(pitch) + UP * -math.sin(pitch)).normalized()
            fu = (fd * math.sin(pitch) + UP * math.cos(pitch)).normalized()
            place_at(self.foot[s], J['ank' + s] + fd2 * 0.05 * self.k - fu * 0.035 * self.k, Matrix((right(p.get('th' + s, p['heading'])), fd2, fu)).transposed())
        # hands and sleeves
        for s in 'LR':
            el, wr = J['el' + s], J['wr' + s]
            D = p.get('handDir' + s) or (wr - el).normalized()
            N = p.get('palm' + s) or (-R if s == 'R' else R)
            T = p.get('thumb' + s) or F
            Nn = (N - D * N.dot(D)).normalized()
            Tn = (T - D * T.dot(D) - Nn * T.dot(Nn))
            Tn = Tn.normalized() if Tn.length > 1e-4 else D.cross(Nn)
            self.hand[s].pose(wr, D, Nn, Tn, p.get('curl' + s, 0.5), p.get('thumbCurl' + s, 0.4))
            sh = J['sh' + s]
            pts = []
            for (a, b, kk, rr) in ((sh, el, 0.0, 0.06), (sh, el, 0.7, 0.052), (el, wr, 0.3, 0.048), (el, wr, 0.95, 0.045)):
                c = a.lerp(b, kk)
                ax = (b - a).normalized()
                u = (UP - ax * UP.dot(ax))
                u = u.normalized() if u.length > 1e-4 else ax.orthogonal().normalized()
                pts.extend(ring_pts(c, u, ax.cross(u), rr * self.k, rr * self.k, 14))
            self.sleeve[s].set(pts)
        # tunic
        P = J['pelvis']
        k = self.k
        rings = [ring_pts(c0, R, F, ru, rw, 24) for (c0, ru, rw) in (
            (J['neck'], 0.055 * k, 0.05 * k), (J['neck'] - S * 0.05 * k, 0.165 * k, 0.095 * k),
            (P + S * 0.22 * k, 0.15 * k, 0.1 * k), (P + S * 0.05 * k, 0.15 * k, 0.11 * k))]
        hem = p.get('hem', 0.8)
        for i, kk in enumerate([0.15, 0.32, 0.5, 0.66, hem]):
            a = leg_point(J['hipL'], J['kneeL'], J['ankL'], kk)
            b = leg_point(J['hipR'], J['kneeR'], J['ankR'], kk)
            c = (a + b) / 2
            dd = (leg_dir(J['hipL'], J['kneeL'], J['ankL'], kk) + leg_dir(J['hipR'], J['kneeR'], J['ankR'], kk)).normalized()
            u = (R + dd * R.dot(dd) * -1).normalized()
            w = (-dd).cross(u) * -1
            su = abs((a - b).dot(u)) / 2
            sw_ = abs((a - b).dot(w)) / 2
            rings.append(ring_pts(c, u, w, max(0.16 * k, su + 0.1 * k), max(0.12 * k, sw_ + 0.09 * k), 24))
        flat = [q for r_ in rings for q in r_]
        for q in flat:
            q.z = max(q.z, 0.02)
        self.tunic.set(flat)
        if self.scarf:
            pts = []
            defs = [(0.32, 0.0, 1.12, 0.0), (0.78, 0.0, 0.95, 0.0), (1.06, 0.0, 0.62, 0.1), (1.12, 0.0, 0.25, 0.27),
                    (1.13, 0.0, -0.12, 0.33), (1.1, 0.02, -0.5, 0.28), (1.02, 0.0, -0.9, 0.12), (1.55, -0.1, -1.35, 0.02),
                    (2.0, -0.05, -1.95, 0.0)]
            for (sc, fo, up, opening) in defs:
                c = H + hu * r * up + hf * r * fo
                a0 = math.pi / 2 + opening * math.pi
                a1 = math.pi / 2 - opening * math.pi + 2 * math.pi
                if opening < 0.03:
                    a0, a1 = math.pi / 2 + 0.06, math.pi / 2 + 2 * math.pi - 0.06
                ru = r * sc * (1.0 if up > -0.8 else 1.15)
                pts.extend(ring_pts(c, hr, hf, ru, r * sc * (1.05 if up > -0.8 else 0.8), 26, open_front=(a0, a1)))
            self.scarf.set(pts)
        return J
