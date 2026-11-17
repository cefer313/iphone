"""Choreography: every pose, prop and camera as a pure function of the film frame (0..599)."""
import math
from mathutils import Vector as V
from lib import UP, clamp, kf, lagged, lerp, ramp, smoother, ease_inout
from gait import Step, plan_path, gait, fwd, right, ANKLE_H
from characters import solve, DIM
from world import DOOR

PI = math.pi
SHOTS = [('A', 0, 120), ('B', 120, 240), ('C1', 240, 264), ('C2', 264, 330), ('D1', 330, 390), ('D2', 390, 480), ('E', 480, 600)]
SACK_REST = V((0.42, -0.32, 0.0))
SACK_LEN = 0.44
KNOCK = (246, 256)
DOOR_OPEN = (333, 362)
PRAYER_AT = 495  # 16.5 s


def shot_of(f):
    for name, a, b in SHOTS:
        if a <= f < b:
            return name
    return SHOTS[-1][0]


# ------------------------------------------------------------------ the man's footfalls
def _steps_main():
    steps, init = plan_path([(-2.9, -1.0), (-0.15, -1.0)], start_land=4, step_frames=17, swing=14, first_foot='L',
                            final_together=False, step_len=0.55)
    # turn to face the door, feet coming together
    steps.append(Step('R', 76, 89, 0.2, -0.86, PI / 2 - 0.15))
    steps.append(Step('L', 92, 104, 0.0, -0.85, PI / 2))
    # after setting the sack down, two short steps to reach the door (to the left of the sack)
    steps.append(Step('R', 138, 150, 0.02, -0.47, PI / 2))
    steps.append(Step('L', 154, 166, -0.18, -0.45, PI / 2))
    # departure: turn toward the corner and walk around it
    dep, _ = plan_path([(-0.08, -0.48), (0.42, -0.62), (1.55, -0.62), (1.62, 0.7), (1.62, 2.4)], start_land=274, step_frames=14,
                       swing=11, first_foot='R', final_together=False, step_len=0.58)
    steps += dep
    return steps, init


MAIN_STEPS, MAIN_INIT = _steps_main()


def _steps_prayer():
    steps, init = plan_path([(1.65, 9.2), (1.8, 10.5), (1.85, 11.2)], start_land=478, step_frames=18, swing=14, first_foot='L',
                            final_together=True, step_len=0.5)
    return steps, init


PRAYER_STEPS, PRAYER_INIT = _steps_prayer()


def man_gait(f):
    if f >= 470:
        return gait(PRAYER_STEPS, PRAYER_INIT, f)
    return gait(MAIN_STEPS, MAIN_INIT, f)


def _base_pose(f):
    g = man_gait(f)
    p = dict(frame=f, pelvis=g['pelvis'], heading=g['heading'], roll=g['roll'], lean=0.04 + 0.03 * g['moving'],
             shoulderRoll=-g['roll'] * 0.55, headPitch=0.08,
             ankleL=g['L'][0], ankleR=g['R'][0], pitchL=g['L'][2], pitchR=g['R'][2], thL=g['L'][1], thR=g['R'][1])
    return p, g


def _swing_hand(J, side, arm, F, R):
    sgn = 1 if side == 'L' else -1
    sh = J['sh' + side]
    return sh + UP * -0.53 + F * (0.11 * arm * sgn + 0.03) + R * (0.04 if side == 'R' else -0.04)


def sack_on_back(J, f, lag):
    F, R = J['F'], J['R']
    sh = J['shR']
    hand = sh + UP * 0.05 + F * 0.11 - R * 0.03
    neck = hand + UP * 0.03 - F * 0.02
    ctrl = sh + UP * 0.12 - F * 0.06
    bottom = sh - F * 0.17 + UP * -0.4 - R * 0.06 + lag * 0.8 + V((0, 0, 0.006 * math.sin(f * PI / 17)))
    return hand, neck, ctrl, bottom


def man_pose(f):
    """Returns (pose, sack_state)."""
    p, g = _base_pose(f)
    J = solve(dict(p, handL=p['pelvis'], handR=p['pelvis']))
    F, R = J['F'], J['R']
    lagpos = (lagged(lambda t: man_gait(t)['pelvis'], f, 2.5, 10) - g['pelvis']) * 0.35
    lagpos.z = 0
    sack = None
    p['curlL'] = p['curlR'] = 0.45
    p['thumbCurlL'] = p['thumbCurlR'] = 0.35
    # free arms swing by default
    p['handL'] = _swing_hand(J, 'L', g['arm'], F, R)
    p['handR'] = _swing_hand(J, 'R', g['arm'], F, R)
    p['palmL'], p['palmR'] = R, -R
    p['thumbL'] = p['thumbR'] = F
    if f < 125:
        hand, neck, ctrl, bottom = sack_on_back(J, f, lagpos)
        p['handR'] = hand
        p['poleR'] = -UP + R * 0.7 - F * 0.2
        p['curlR'], p['thumbCurlR'] = 1.1, 0.9
        p['palmR'], p['thumbR'] = -F, -R
        p['handDirR'] = (UP * 0.3 - F * 0.6 - R * 0.1).normalized()
        p['shoulderRoll'] -= 0.02
        sack = dict(neck=neck, ctrl=ctrl, bottom=bottom, squash=0.0, opened=0.0)
    elif f < 240:
        p, sack = _gift(f, p, J, lagpos)
    elif f < 264:
        p = _knock(f, p, J)
    elif f >= 470:
        p = _prayer(f, p, J)
    return p, sack, lagpos, g


def _gift(f, p, J, lag):
    """Slide the sack off the shoulder, squat, set it down beside the door, release, rise."""
    t = f - 120
    F, R = J['F'], J['R']
    pel0 = p['pelvis']
    squat = kf(t, [40, 70, 82, 104, 128], [0.0, 0.85, 1.0, 1.0, 0.0])
    p['pelvis'] = pel0 + UP * (-0.34 * squat) - F * (0.08 * squat)
    p['lean'] = 0.04 + 0.5 * squat
    p['headPitch'] = 0.1 + 0.25 * squat
    J = solve(dict(p, handL=p['pelvis'], handR=p['pelvis']))
    hand_b, neck_b, ctrl_b, bottom_b = sack_on_back(J, f, lag)
    off = smoother((t - 4) / 38)
    side = R * (0.26 * math.sin(PI * off))
    neck_f = J['shR'] + F * 0.32 + UP * -0.2 - R * 0.06
    rest_neck = SACK_REST + UP * SACK_LEN
    # lower toward the resting place while squatting
    lower = smoother((t - 44) / 38)
    neck_front = neck_f.lerp(rest_neck, lower)
    neck = neck_b.lerp(neck_front, off) + side * 0.4
    hang = neck + UP * -SACK_LEN
    bottom = bottom_b.lerp(hang, off) + side
    ctrl = ctrl_b.lerp((neck + bottom) / 2 + R * 0.02, off) + side * 0.6
    # contact: the bottom meets the ground at t~80, compresses, then the fingers let go
    squash = 0.0
    if bottom.z < 0.0:
        squash = clamp(-bottom.z / 0.025)
        bottom.z = 0.0
    settle = smoother((t - 80) / 12)
    neck = neck.lerp(rest_neck + UP * -0.02, settle)
    bottom = bottom.lerp(SACK_REST.copy(), settle)
    squash = max(squash, settle)
    ctrl = (neck + bottom) / 2 + R * 0.01
    release = smoother((t - 92) / 12)
    p['handR'] = (neck + UP * 0.03).lerp(neck + UP * 0.18 - F * 0.1 - R * 0.04, smoother((t - 100) / 16))
    p['handR'] = p['handR'].lerp(_swing_hand(solve(dict(p, handL=p['pelvis'], handR=p['pelvis'])), 'R', 0, F, R), smoother((t - 112) / 20))
    p['curlR'] = lerp(1.1, 0.35, release)
    p['thumbCurlR'] = lerp(0.9, 0.25, release)
    p['palmR'] = (-F * (1 - off) + (-R) * off).normalized()
    p['handDirR'] = ((UP * 0.3 - F * 0.6) * (1 - off) + (F * 0.6 - UP * 0.4) * off).normalized() if t < 100 else None
    p['thumbR'] = F
    # left hand comes to support the sack's side as it swings round, then lets go
    sup = smoother((t - 22) / 20) * (1 - smoother((t - 90) / 12))
    side_pt = neck.lerp(bottom, 0.55) - R * 0.15 - F * 0.02
    rest_L = _swing_hand(J, 'L', 0, F, R)
    p['handL'] = rest_L.lerp(side_pt, sup)
    p['palmL'] = (R * (1 - sup) + (R + F * 0.2) * sup).normalized()
    p['curlL'] = lerp(0.45, 0.25, sup)
    p['poleR'] = -UP + R * 0.6 - F * 0.3
    opened = smoother((t - 100) / 16) * 0.8
    return p, dict(neck=neck, ctrl=ctrl, bottom=bottom, squash=squash, opened=opened)


def _knock(f, p, J):
    F, R = J['F'], J['R']
    door_y = DOOR['hinge_y'] - 0.024
    pre = V((-0.12, door_y - 0.19, 1.24))
    hit = V((-0.12, door_y - 0.112, 1.24))
    a, b = KNOCK
    wr = kf(f, [240, a - 4, a, a + 5, b - 4, b, b + 5, 263], [pre - F * 0.04, pre, hit, pre, pre, hit, pre, pre])
    p['handR'] = wr
    p['handDirR'] = (F * 0.85 + UP * 0.15).normalized()
    p['palmR'] = -R
    p['thumbR'] = UP
    p['curlR'], p['thumbCurlR'] = 1.45, 1.0
    p['poleR'] = -UP + R * 0.8
    return p


def _prayer(f, p, J):
    F, R = J['F'], J['R']
    bow = smoother((f - 503) / 22)
    p['headPitch'] = 0.08 + 0.26 * bow
    p['lean'] = 0.04 + 0.05 * bow
    rise = smoother((f - 508) / 26)
    chest = J['neck'] + F * 0.2 - UP * 0.24 + R * 0.06
    p['handR'] = p['handR'].lerp(chest, rise)
    p['handDirR'] = (UP * 0.85 + F * 0.3 - R * 0.1).normalized() if rise > 0.05 else None
    p['palmR'] = (-R * (1 - rise) + (F * 0.2 + UP * 0.1 - R * 0.9) * rise).normalized()
    p['thumbR'] = -F if rise > 0.5 else F
    p['curlR'] = lerp(0.45, 0.18, rise)
    p['thumbCurlR'] = lerp(0.35, 0.15, rise)
    p['poleR'] = -UP + R * 0.6 - F * 0.2
    return p


def man_lag(f):
    g = man_gait(f)
    lp = (lagged(lambda t: man_gait(t)['pelvis'], f, 2.5, 10) - g['pelvis']) * 0.45
    lp.z = 0
    lt = lagged(lambda t: man_gait(t)['heading'], f, 4, 14) - g['heading']
    return dict(pos=lp, turn=lt)


# ------------------------------------------------------------------ door
def door_angle(f):
    return kf(f, [DOOR_OPEN[0], DOOR_OPEN[1]], [0.0, math.radians(96)])


# ------------------------------------------------------------------ children
SIS_K, BOY_K = 0.92, 0.7


def sister_pose(f):
    th = -PI / 2  # facing out toward the street (-y)
    F, R = fwd(th), right(th)
    base = V((0.06, 0.78, 0))
    fwd_step = smoother((f - 364) / 22) * 0.4
    pos = base + F * fwd_step
    kneel = smoother((f - 452) / 22)
    pel = pos + UP * (0.71 - 0.3 * kneel) + F * (0.05 * kneel)
    p = dict(frame=f, heading=th, pelvis=pel, lean=0.03 + 0.25 * kneel,
             ankleL=pos - R * 0.075 + UP * 0.055, ankleR=pos + R * 0.075 + UP * 0.055)
    # kneel on the right knee: right foot slides back, toes tucked
    p['ankleR'] = p['ankleR'].lerp(pos + R * 0.08 - F * 0.36 + UP * 0.07, kneel)
    p['pitchR'] = 1.0 * kneel
    p['ankleL'] = p['ankleL'] + F * (0.12 * kneel)
    # head: look down at the sack, scan the street both ways, back to the sack
    yaw = kf(f, [392, 402, 418, 424, 440, 448, 470], [0.0, 0.0, 0.85, 0.85, -0.85, -0.85, 0.15])
    pitch = kf(f, [330, 362, 375, 400, 410, 446, 458], [0.0, 0.0, 0.38, 0.4, 0.05, 0.05, 0.45])
    p['headYaw'], p['headPitch'] = yaw, pitch
    hf = (F * math.cos(yaw) - R * math.sin(yaw))
    gaze_down = smoother(clamp(pitch / 0.4))
    p['gaze'] = (hf * math.cos(pitch * 1.25) - UP * math.sin(pitch * 1.25)).normalized()
    p['lid'] = 0.12 + 0.18 * gaze_down + 0.85 * _blink(f, (384, 432, 474))
    p['brow'] = kf(f, [395, 405, 455, 465, 480], [0.0, 0.55, 0.45, 0.15, 0.0])
    p['smile'] = kf(f, [462, 478], [0.0, 0.5])
    # hands: right hand pulls the door open by its edge, then rests; left reaches to touch the sack
    J0 = DOOR['x0']
    ang = door_angle(f)
    handle = V((J0 + 0.8 * math.cos(ang), DOOR['hinge_y'] + 0.8 * math.sin(ang) + 0.04, 0.95))
    hold = 1 - smoother((f - 356) / 10)
    restR = pel + UP * 0.02 + R * 0.19 + F * 0.03
    restL = pel + UP * 0.02 - R * 0.19 + F * 0.03
    p['handR'] = restR.lerp(handle, smoother((f - 328) / 6) * hold)
    p['curlR'] = 0.9 * hold + 0.4 * (1 - hold)
    touch = smoother((f - 462) / 14)
    sack_top = SACK_REST + UP * 0.36 + V((-0.04, 0.05, 0))
    p['handL'] = restL.lerp(sack_top, touch)
    p['palmL'] = (-UP * touch + R * (1 - touch)).normalized()
    p['handDirL'] = (F * 0.8 - UP * 0.3).normalized() if touch > 0.05 else None
    p['curlL'] = lerp(0.5, 0.3, touch)
    p['hem'] = 0.86
    return p


def boy_pose(f):
    th = -PI / 2 + 0.15
    F, R = fwd(th), right(th)
    base = V((0.52, 1.05, 0))
    step = smoother((f - 368) / 24) * 0.42
    pos = base + V((0, -1, 0)) * step
    pel = pos + UP * 0.545
    p = dict(frame=f, heading=th, pelvis=pel, lean=0.02,
             ankleL=pos - R * 0.06 + UP * 0.045, ankleR=pos + R * 0.06 + UP * 0.045)
    # a small stepping lift while he comes forward
    lift = math.sin(PI * clamp((f - 370) / 18)) * 0.04
    p['ankleL'] = p['ankleL'] + UP * lift
    notice = smoother((f - 418) / 16)
    relief = smoother((f - 432) / 26)
    p['headYaw'] = kf(f, [390, 410, 420], [-0.35, -0.35, 0.05])
    p['headPitch'] = kf(f, [380, 418, 430], [0.05, 0.05, 0.42])
    hf = (F * math.cos(p['headYaw']) - R * math.sin(p['headYaw']))
    p['gaze'] = (hf * math.cos(p['headPitch'] * 1.3) - UP * math.sin(p['headPitch'] * 1.3)).normalized()
    p['lid'] = lerp(0.48, 0.12, notice) + 0.85 * _blink(f, (400, 446))
    p['brow'] = 0.35 * notice - 0.1 * relief
    p['smile'] = 0.55 * relief
    p['handL'] = pel + UP * 0.0 - R * 0.15 + F * 0.05
    p['handR'] = pel + UP * 0.12 + R * 0.08 + F * 0.12  # holding the hem of his sister's sleeve, sleepy
    p['handR'] = p['handR'].lerp(pel + UP * 0.0 + R * 0.15 + F * 0.05, relief)
    p['hem'] = 0.8
    return p


def _blink(f, at):
    v = 0.0
    for a in at:
        v = max(v, max(0.0, 1 - abs(f - a) / 3.0))
    return v


# ------------------------------------------------------------------ cameras
def camera(f):
    """Returns (location, target, lens_mm, fstop)."""
    s = shot_of(f)
    if s == 'A':
        g = man_gait(f)
        c = lagged(lambda t: man_gait(t)['pelvis'], f, 6, 18)
        loc = V((c.x - 3.1, c.y - 2.0, 1.55))
        tgt = V((c.x + 0.6, c.y + 0.25, 0.95))
        return loc, tgt, 30, 5.6
    if s == 'B':
        P = man_gait(f)['pelvis']
        loc = V((1.45, -2.45, 1.0))
        tgt = V((0.25, -0.62, 0.72))
        return loc, tgt, 32, 4.0
    if s == 'C1':
        loc = V((0.42, -0.62, 1.31))
        tgt = V((-0.12, 0.0, 1.24))
        return loc, tgt, 75, 2.2
    if s == 'C2':
        k = (f - 264) / 66
        loc = V((-1.65, -2.2, 1.5)) + V((0.25, 0, 0)) * k
        tgt = V((0.7, -0.4, 1.0)) + V((0.35, 0.0, 0)) * k
        return loc, tgt, 32, 5.6
    if s == 'D1':
        loc = V((-0.32, 2.75, 1.3))
        tgt = V((0.25, -0.6, 0.8))
        return loc, tgt, 30, 4.0
    if s == 'D2':
        k = (f - 390) / 90
        loc = V((0.16, -1.75, 0.8)) + V((0.02, 0.12, 0)) * k
        tgt = V((0.26, 0.4, 0.74))
        return loc, tgt, 30, 4.0
    # E: prayer
    k = (f - 480) / 120
    loc = V((1.95, 6.9, 1.6)) + V((0.0, 0.35, 0)) * smoother(k)
    tgt = V((1.8, 11.0, 1.05))
    return loc, tgt, 26, 5.6
