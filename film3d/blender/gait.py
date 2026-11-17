"""Planted-foot walking on the ground plane with turning (footfalls carry a heading)."""
import math
from mathutils import Vector as V
from lib import clamp, lerp, smoother

ANKLE_H = 0.075
TOE = 0.17
HEEL_OFF = 8
HEEL_PITCH = 0.45
LIFT = 0.07


def fwd(th):
    return V((math.cos(th), math.sin(th), 0))


def right(th):
    return V((math.sin(th), -math.cos(th), 0))


def ang_lerp(a, b, t):
    d = (b - a + math.pi) % (2 * math.pi) - math.pi
    return a + d * t


class Step:
    def __init__(self, foot, lift, land, x, y, th):
        self.foot, self.lift, self.land = foot, lift, land
        self.p = V((x, y, 0))
        self.th = th


def plan_path(points, start_land, step_frames, swing, first_foot, half_w=0.1, start_heading=None,
              final_together=True, step_len=0.55):
    """Sample a polyline into alternating footfalls. Returns list[Step] and the initial stance."""
    # resample path by arc length
    segs = []
    total = 0.0
    pts3 = [V((q[0], q[1], 0.0)) for q in points]
    for a, b in zip(pts3[:-1], pts3[1:]):
        L = (b - a).length
        segs.append((a, b, total, L))
        total += L
    def at(s):
        for a, b, s0, L in segs:
            if s <= s0 + L or (a, b) == (segs[-1][0], segs[-1][1]):
                t = clamp((s - s0) / L) if L > 0 else 0
                d = (b - a).normalized()
                return a.lerp(b, t), math.atan2(d.y, d.x)
    n = max(1, round(total / step_len))
    steps = []
    foot = first_foot
    for k in range(1, n + 1):
        s = total * k / n
        c, th = at(s)
        side = -1 if foot == 'L' else 1
        p = c + right(th) * (half_w * side)
        land = start_land + (k - 1) * step_frames
        steps.append(Step(foot, land - swing, land, p.x, p.y, th))
        foot = 'R' if foot == 'L' else 'L'
    if final_together:
        c, th = at(total)
        side = -1 if foot == 'L' else 1
        p = c + right(th) * (half_w * side)
        land = start_land + n * step_frames - 2
        steps.append(Step(foot, land - swing + 2, land, p.x, p.y, th))
    c0, th0 = at(0.0)
    if start_heading is not None:
        th0 = start_heading
    init = {
        'L': (c0 + right(th0) * -half_w - fwd(th0) * (step_len / 2 if first_foot == 'L' else 0), th0),
        'R': (c0 + right(th0) * half_w - fwd(th0) * (step_len / 2 if first_foot == 'R' else 0), th0),
    }
    return steps, init


def heel_off(p, th, pitch):
    """Ankle while the heel peels off, pivoting about the planted toe."""
    f = fwd(th)
    toe = p + f * TOE
    y = ANKLE_H * math.cos(pitch) + TOE * math.sin(pitch)
    back = ANKLE_H * math.sin(pitch) - TOE * math.cos(pitch)
    a = toe + f * back
    a.z = y
    return a


def foot_state(steps, init, foot, f):
    mine = [s for s in steps if s.foot == foot]
    p, th = init[foot]
    p = V(p)
    for s in mine:
        if f < s.lift - HEEL_OFF:
            break
        if f < s.lift:
            pt = HEEL_PITCH * smoother((f - (s.lift - HEEL_OFF)) / HEEL_OFF)
            return heel_off(p, th, pt), th, pt, 0.0
        if f < s.land:
            t = (f - s.lift) / (s.land - s.lift)
            a0 = heel_off(p, th, HEEL_PITCH)
            e = smoother(t)
            a1 = V((s.p.x, s.p.y, ANKLE_H))
            a = a0.lerp(a1, e)
            a.z = lerp(a0.z, ANKLE_H, smoother(t)) + LIFT * math.sin(math.pi * t) * (1 - 0.3 * t)
            pitch = lerp(HEEL_PITCH, -0.22, smoother(t / 0.78)) if t < 0.78 else lerp(-0.22, 0, smoother((t - 0.78) / 0.22))
            return a, ang_lerp(th, s.th, e), pitch, math.sin(math.pi * t)
        p, th = V(s.p), s.th
    return V((p.x, p.y, ANKLE_H)), th, 0.0, 0.0


def hermite(keys, f):
    if f <= keys[0][0]:
        return keys[0][1]
    if f >= keys[-1][0]:
        return keys[-1][1]
    n = len(keys)
    i = 0
    while keys[i + 1][0] < f:
        i += 1
    t0, v0 = keys[i]
    t1, v1 = keys[i + 1]
    def slope(j):
        a = keys[max(0, j - 1)]; b = keys[min(n - 1, j + 1)]
        return 0 if b[0] == a[0] else (b[1] - a[1]) / (b[0] - a[0])
    h = t1 - t0
    u = (f - t0) / h
    m0 = (0 if i == 0 else slope(i)) * h
    m1 = (0 if i + 1 == n - 1 else slope(i + 1)) * h
    u2, u3 = u * u, u * u * u
    return (2 * u3 - 3 * u2 + 1) * v0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * v1 + (u3 - u2) * m1


def gait(steps, init, f, stand_h=0.94):
    L = foot_state(steps, init, 'L', f)
    R = foot_state(steps, init, 'R', f)
    last = {k: (V(init[k][0]), init[k][1]) for k in 'LR'}
    first = min(s.lift for s in steps)
    def mid():
        return (last['L'][0] + last['R'][0]) / 2, ang_lerp(last['L'][1], last['R'][1], 0.5)
    c, th = mid()
    kx, ky, kt = [(first - 18, c.x)], [(first - 18, c.y)], [(first - 18, th)]
    for s in sorted(steps, key=lambda s: s.land):
        last[s.foot] = (V(s.p), s.th)
        c, th = mid()
        kx.append((s.land, c.x)); ky.append((s.land, c.y))
        # unwrap heading for interpolation
        prev = kt[-1][1]
        th = prev + ((th - prev + math.pi) % (2 * math.pi) - math.pi)
        kt.append((s.land, th))
    end = max(s.land for s in steps)
    kx.append((end + 14, kx[-1][1])); ky.append((end + 14, ky[-1][1])); kt.append((end + 14, kt[-1][1]))
    px, py, pth = hermite(kx, f), hermite(ky, f), hermite(kt, f)
    swingL, swingR = L[3], R[3]
    pel = V((px, py, 0))
    # lateral weight shift over the stance foot
    for sw, other in ((swingL, R[0]), (swingR, L[0])):
        if sw > 0:
            d = V((other.x - px, other.y - py, 0))
            d = right(pth) * d.dot(right(pth))
            if d.length > 1e-6:
                pel += d.normalized() * 0.026 * sw
    moving = clamp(1 - (f - end) / 14) * clamp((f - first + 18) / 14)
    single = max(swingL, swingR)
    pel.z = lerp(stand_h, stand_h - 0.016 + 0.017 * single, moving)
    roll = 0.045 * (swingL - swingR)
    # arm swing: positive -> left arm forward (right leg forward)
    rel = (R[0] - L[0]).dot(fwd(pth)) / 0.55
    return {
        'pelvis': pel, 'heading': pth, 'roll': roll, 'moving': moving,
        'L': L, 'R': R, 'arm': clamp(rel, -1, 1) * moving, 'end': end,
    }
