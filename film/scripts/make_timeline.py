"""Writes src/data/timeline.json: footstep plans and sound cues.

Everything is deterministic. Frames inside a shot are local to that shot's
<Sequence>; `offset` converts them to absolute film frames for the audio mix.
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

STEP = 20      # frames between consecutive foot landings (slow, unhurried pace)
SWING = 15     # frames a foot is in the air
STEP_LEN = 0.52
HALF_W = 0.105 # lateral distance of each foot from the walking line


def walk(first_land, n, z0, first_foot, x0=0.0):
    """Constant-cadence walk. Step k lands at first_land + k*STEP."""
    steps = []
    foot = first_foot
    for k in range(n):
        land = first_land + k * STEP
        steps.append({
            "foot": foot,
            "lift": land - SWING,
            "land": land,
            "x": x0 + (-HALF_W if foot == "L" else HALF_W),
            "z": round(z0 + k * STEP_LEN, 4),
        })
        foot = "R" if foot == "L" else "L"
    return steps


# Shot 1 (frames 0-119): already walking when the film opens.
shot1 = walk(first_land=-54, n=11, z0=0.65, first_foot="L")

# Shot 3 (frames 240-389): two last steps, then the trailing foot closes beside
# the leading one and the body settles before the knock.
shot3 = [
    {"foot": "L", "lift": -16, "land": -1, "x": -0.055, "z": 1.06, "fromZ": 0.04},
    {"foot": "R", "lift": 4, "land": 21, "x": 0.155, "z": 1.4, "fromZ": 0.54},
    {"foot": "L", "lift": 28, "land": 46, "x": -0.055, "z": 1.42},
]

# Shot 6 (frames 750-899): leaving the lit doorway, walking into the street.
shot6 = walk(first_land=-12, n=10, z0=1.25, first_foot="R", x0=0.25)

data = {
    "fps": 30,
    "frames": 900,
    "gait": {"step": STEP, "swing": SWING, "stepLen": STEP_LEN, "halfW": HALF_W},
    "shots": {
        "s1": {"from": 0, "dur": 120},
        "s2": {"from": 120, "dur": 120},
        "s3": {"from": 240, "dur": 150},
        "s4": {"from": 390, "dur": 210},
        "s5": {"from": 600, "dur": 150},
        "s6": {"from": 750, "dur": 150},
    },
    "steps": {"s1": shot1, "s3": shot3, "s6": shot6},
    # Shot 3 action beats (local frames)
    "s3": {"raiseStart": 52, "knock1": 72, "knock2": 86, "lowerStart": 94,
           "lowerEnd": 118, "doorStart": 122, "doorEnd": 149},
    # Shot 4 action beats (local frames)
    "s4": {"kneelStart": 6, "kneelEnd": 74, "lowerStart": 52, "contact": 104,
           "release": 116, "openStart": 128, "openEnd": 166,
           "childStepStart": 160, "childStepEnd": 186, "softenStart": 168,
           "softenEnd": 206},
    # Shot 5 action beats (local frames)
    "s5": {"reachStart": 26, "touch": 58, "bothEnd": 80, "releaseEnd": 92,
           "withdrawEnd": 116, "drawEnd": 118},
    # Shot 2 action beats (local frames)
    "s2": {"tightenStart": 18, "tightenEnd": 42, "liftStart": 44,
           "liftPeak": 62, "settleEnd": 100},
    # Closing title (absolute frames)
    "title": {"in": 795, "full": 826, "fadeOutStart": 888},
}

# Sound cues in absolute frames ----------------------------------------------
cues = []
for key, off in (("s1", 0), ("s3", 240), ("s6", 750)):
    for st in data["steps"][key]:
        f = st["land"] + off
        s = data["shots"][key]
        if s["from"] <= f < s["from"] + s["dur"]:
            cues.append({"type": "step", "frame": f, "shot": key, "z": st["z"]})
cues += [
    {"type": "knock", "frame": 240 + data["s3"]["knock1"]},
    {"type": "knock", "frame": 240 + data["s3"]["knock2"]},
    {"type": "creak", "frame": 240 + data["s3"]["doorStart"], "len": 30},
    {"type": "sack", "frame": 390 + data["s4"]["contact"]},
]
for a, b, g in [(160, 196, 0.8), (290, 316, 0.5), (334, 358, 0.4),
                (396, 466, 0.7), (442, 500, 0.6), (518, 558, 0.55),
                (600, 626, 0.45), (676, 706, 0.4), (742, 760, 0.35)]:
    cues.append({"type": "cloth", "frame": a, "end": b, "gain": g})
data["cues"] = sorted(cues, key=lambda c: c["frame"])

with open(os.path.join(ROOT, "src", "data", "timeline.json"), "w") as f:
    json.dump(data, f, indent=1)
print("timeline:", len(data["cues"]), "cues")
