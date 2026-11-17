"""Build the scene and render frames.  Usage:
   python3 blender/render.py --frames 0-599 --out public/frames [--samples 20] [--scale 100]
   python3 blender/render.py --frames 10,150,300 --out /tmp/stills
"""
import argparse
import math
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bpy
from mathutils import Vector as V

from lib import ramp, smoother, clamp
from world import World
from characters import Man, Sack, Child
import shots

ap = argparse.ArgumentParser()
ap.add_argument('--frames', default='0-599')
ap.add_argument('--out', default='public/frames')
ap.add_argument('--samples', type=int, default=20)
ap.add_argument('--scale', type=int, default=100)
ap.add_argument('--skip-existing', action='store_true')
args = ap.parse_args()


def parse_frames(s):
    out = []
    for part in s.split(','):
        if '-' in part:
            a, b = part.split('-')
            out += list(range(int(a), int(b) + 1))
        else:
            out.append(int(part))
    return out


bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = args.samples
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.04
scene.cycles.use_denoising = True
scene.cycles.denoiser = 'OPENIMAGEDENOISE'
scene.cycles.max_bounces = 5
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 2
scene.cycles.transmission_bounces = 2
scene.cycles.transparent_max_bounces = 4
scene.cycles.sample_clamp_indirect = 3.0
scene.cycles.blur_glossy = 1.0
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False
scene.render.resolution_x = 720
scene.render.resolution_y = 1280
scene.render.resolution_percentage = args.scale
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
scene.view_settings.view_transform = 'AgX'
try:
    scene.view_settings.look = 'AgX - Punchy'
except Exception:
    pass

world = World()
man = Man()
sack = Sack()
sister = Child('sister', shots.SIS_K, '#b98262', '#55687a', '#3c4b59', scarf=('#a8916b', '#857053'), iris='#3a2214')
boy = Child('boy', shots.BOY_K, '#c08b68', '#9a8a68', '#776a4f', hair='#2a1d16', iris='#40271a')

cam_data = bpy.data.cameras.new('cam')
cam = bpy.data.objects.new('cam', cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam_data.sensor_fit = 'VERTICAL'
cam_data.sensor_height = 24.0
cam_data.dof.use_dof = True

# soft fill for faces on the street side of the doorway (stands in for moonlight bounce)
fill = bpy.data.objects.new('face_fill', bpy.data.lights.new('face_fill', 'AREA'))
scene.collection.objects.link(fill)
fill.data.size = 1.2
fill.data.color = (0.68, 0.76, 1.0)

man_objs = None
child_objs = {}


def collect(prefixes):
    return [o for o in bpy.data.objects if any(o.name.startswith(p) for p in prefixes)]


MAN_PREFIX = ('shin', 'foot', 'sole', 'strap', 'neck', 'head', 'cap', 'wrap', 'headtail', 'handL', 'handR', 'robe', 'cloak',
              'sleeve', 'sash')
man_objs = collect(MAN_PREFIX)
sister_objs = collect(('sister',))
boy_objs = collect(('boy',))
sack_objs = collect(('sack', 'cord', 'bread', 'datepouch', 'date'))
print('objects: man', len(man_objs), 'sister', len(sister_objs), 'boy', len(boy_objs))


def set_hidden(objs, h):
    for o in objs:
        o.hide_render = h


def look_at(obj, loc, tgt):
    obj.location = loc
    d = (tgt - loc)
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def apply_frame(f):
    s = shots.shot_of(f)
    world.set_frame(f)
    world.set_door(shots.door_angle(f))
    # the man
    man_visible = s in ('A', 'B', 'C1', 'C2', 'E')
    set_hidden(man_objs, not man_visible)
    sk = None
    if man_visible:
        pose, sk, lagpos, g = shots.man_pose(f)
        man.apply(pose, shots.man_lag(f))
    # the sack: carried, set down, then resting beside the door
    if sk is None:
        _, sk120, _, _ = shots.man_pose(239) if f >= 240 else (None, None, None, None)
        sk = sk120
    if sk is not None:
        set_hidden(sack_objs, False)
        sack.apply(sk['neck'], sk['ctrl'], sk['bottom'], sk['squash'], sk['opened'])
        if s == 'E':
            set_hidden(sack_objs, True)
    # the children (only inside the house)
    kids = s in ('D1', 'D2')
    set_hidden(sister_objs, not kids)
    set_hidden(boy_objs, not kids)
    if kids:
        sister.apply(shots.sister_pose(f))
        boy.apply(shots.boy_pose(f))
    # glow line only while the door is shut
    world.glow.hide_render = shots.door_angle(f) > 0.05
    # camera and per-shot light balance
    loc, tgt, lens, fstop = shots.camera(f)
    look_at(cam, loc, tgt)
    cam_data.lens = lens
    cam_data.dof.focus_distance = (tgt - loc).length
    cam_data.dof.aperture_fstop = fstop
    fill.hide_render = s not in ('D2', 'B', 'C1')
    if s == 'D2':
        fill.location = loc + V((0.2, -0.4, 0.5))
        fill.data.energy = 9
        fill.rotation_euler = (tgt - fill.location).to_track_quat('-Z', 'Y').to_euler()
    elif s in ('B', 'C1'):
        fill.location = loc + V((0.4, -0.3, 0.7))
        fill.data.energy = 5
        fill.rotation_euler = (tgt - fill.location).to_track_quat('-Z', 'Y').to_euler()
    scene.view_settings.exposure = {'A': 1.6, 'B': 1.6, 'C1': 1.5, 'C2': 1.6, 'D1': 1.1, 'D2': 0.9, 'E': 1.7}[s]


os.makedirs(args.out, exist_ok=True)
t0 = time.time()
frames = parse_frames(args.frames)
for i, f in enumerate(frames):
    path = os.path.join(args.out, f'f{f:04d}.png')
    if args.skip_existing and os.path.exists(path):
        continue
    apply_frame(f)
    scene.render.filepath = path
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print(f'frame {f} {time.time() - t:.1f}s  ({i + 1}/{len(frames)})', flush=True)
print('total', round(time.time() - t0, 1))
