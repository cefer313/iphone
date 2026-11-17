"""Environment: a modest night street, the household's wall and door, the lit interior,
an alley around the corner and a secluded spot beyond it. All geometry in metres."""
import math
import bpy
from mathutils import Vector as V, Matrix
from lib import box, capsule, ellipsoid, mat, hexc, place_at, place, rot_z, weave_mat, noise1
import bmesh

DOOR = dict(x0=-0.45, x1=0.45, h=1.9, hinge_y=0.05)
WALL_T = 0.35
ALLEY = (1.0, 2.25)  # x range of the alley that turns off the street


def plaster(name, col, col2, scale=6.0):
    m = mat(name, hexc(col), rough=0.92, noise=0.35, noise_scale=scale, bump=0.35, bump_scale=18, color2=hexc(col2))
    # extra fine grit
    nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    return m


class World:
    def __init__(self):
        self.mats = dict(
            wall=plaster('plaster', '#b39a7c', '#8d755a'),
            wall_in=plaster('plaster_in', '#c6a782', '#9b7c5a'),
            ground=mat('earth', hexc('#8a7458'), rough=0.97, noise=0.4, noise_scale=3.0, bump=0.5, bump_scale=30, color2=hexc('#5f4e3b')),
            floor=mat('floor', hexc('#7b5f43'), rough=0.95, noise=0.3, noise_scale=4, bump=0.3, bump_scale=25),
            wood=self._wood('wood', '#5b4330', '#3a2a1d'),
            wood_dark=self._wood('wood_dark', '#3d2c1f', '#251a12'),
            stone=mat('stone', hexc('#8d8578'), rough=0.85, noise=0.3, noise_scale=12, bump=0.4, bump_scale=40),
            pot=mat('pottery', hexc('#9a6a48'), rough=0.75, noise=0.25, noise_scale=10, bump=0.15),
            mat=weave_mat('reedmat', hexc('#a88c5c'), hexc('#7a6340'), scale=60, rough=0.9),
            flame=mat('flame', (1, 0.55, 0.2), rough=1, emission=(1.0, 0.58, 0.22), strength=40),
            glowline=mat('glowline', (0, 0, 0), rough=1, emission=(1.0, 0.6, 0.28), strength=6),
            palm=mat('palm', hexc('#3e3a2a'), rough=0.9, noise=0.3),
            frond=mat('frond', hexc('#3c4a2e'), rough=0.8),
        )
        self.build()

    def _wood(self, name, a, b):
        m = mat(name, hexc(a), rough=0.8, bump=0.3, bump_scale=8)
        nt = m.node_tree
        bsdf = nt.nodes.get('Principled BSDF')
        tc = nt.nodes.new('ShaderNodeTexCoord')
        wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.bands_direction = 'X'
        wv.inputs['Scale'].default_value = 7; wv.inputs['Distortion'].default_value = 7; wv.inputs['Detail'].default_value = 4
        nt.links.new(tc.outputs['Object'], wv.inputs['Vector'])
        cr = nt.nodes.new('ShaderNodeValToRGB')
        cr.color_ramp.elements[0].color = (*hexc(b), 1); cr.color_ramp.elements[1].color = (*hexc(a), 1)
        nt.links.new(wv.outputs['Fac'], cr.inputs['Fac'])
        nt.links.new(cr.outputs['Color'], bsdf.inputs['Base Color'])
        return m

    def wall(self, name, x0, x1, y0, y1, h, m='wall'):
        b = box(name, x1 - x0, y1 - y0, h, self.mats[m], bevel=0.03, center=((x0 + x1) / 2, (y0 + y1) / 2, h / 2))
        # gently irregular, hand-plastered surface
        for v in b.data.vertices:
            v.co.x += noise1(v.co.y * 3 + v.co.z * 2, 7) * 0.012
            v.co.y += noise1(v.co.x * 3 + v.co.z * 2, 9) * 0.012
        return b

    def build(self):
        M = self.mats
        D = DOOR
        # ground
        g = box('ground', 60, 60, 0.2, M['ground'], center=(0, 0, -0.1))
        # scattered pebbles
        import random
        rnd = random.Random(4)
        for i in range(70):
            x, y = rnd.uniform(-6, 5), rnd.uniform(-3.3, -0.2)
            s = rnd.uniform(0.01, 0.035)
            p = ellipsoid(f'peb{i}', s, s * 0.8, s * 0.45, M['stone'], segs=8, rings=5)
            p.location = (x, y, s * 0.15)
            p.rotation_euler = (0, 0, rnd.uniform(0, 3))
        # house front wall (exterior face at y=0), with the doorway
        h = 3.0
        self.wall('wall_left', -12, D['x0'] - 0.1, 0, WALL_T, h)
        self.wall('wall_right', D['x1'] + 0.1, ALLEY[0], 0, WALL_T, h)
        self.wall('wall_lintel', D['x0'] - 0.1, D['x1'] + 0.1, 0, WALL_T, h - D['h'] - 0.16, 'wall').location.z = D['h'] + 0.16
        # door frame and lintel beam
        box('jambL', 0.1, WALL_T + 0.04, D['h'], M['wood_dark'], bevel=0.01, center=(D['x0'] - 0.05, WALL_T / 2, D['h'] / 2))
        box('jambR', 0.1, WALL_T + 0.04, D['h'], M['wood_dark'], bevel=0.01, center=(D['x1'] + 0.05, WALL_T / 2, D['h'] / 2))
        box('lintel', 1.35, WALL_T + 0.16, 0.16, M['wood_dark'], bevel=0.015, center=(0, WALL_T / 2 - 0.06, D['h'] + 0.08))
        box('threshold', 1.05, WALL_T + 0.16, 0.06, M['stone'], bevel=0.012, center=(0, WALL_T / 2 - 0.08, 0.03))
        # door panel (pivot at the hinge, left jamb, inner side) -- swings into the house
        self.door = bpy.data.objects.new('door_pivot', None)
        bpy.context.scene.collection.objects.link(self.door)
        self.door.location = (D['x0'], D['hinge_y'], 0)
        planks = []
        for i in range(4):
            w = 0.9 / 4
            pl = box(f'plank{i}', w - 0.006, 0.045, D['h'] - 0.09, M['wood'], bevel=0.006,
                     center=(w * (i + 0.5), 0, 0.075 + (D['h'] - 0.09) / 2))
            pl.parent = self.door
            planks.append(pl)
        for zc in (0.35, 1.5):
            bar = box(f'bar{zc}', 0.84, 0.03, 0.09, M['wood_dark'], bevel=0.006, center=(0.45, 0.035, zc))
            bar.parent = self.door
        ring = ellipsoid('handle', 0.025, 0.012, 0.025, mat('iron', hexc('#2c2622'), rough=0.5), segs=12, rings=8)
        ring.location = (0.8, 0.06, 1.0); ring.parent = self.door
        # thin amber line of light under the door (someone is awake inside)
        self.glow = box('glowline', 0.86, 0.02, 0.01, M['glowline'], center=(0, 0.07, 0.065))
        # interior room
        self.wall('in_back', -2.2, 2.2, 3.6, 3.9, 2.7, 'wall_in')
        self.wall('in_left', -2.2, -1.9, WALL_T, 3.6, 2.7, 'wall_in')
        self.wall('in_right', 1.9, 2.2, WALL_T, 3.6, 2.7, 'wall_in')
        box('in_floor', 4.0, 3.3, 0.02, M['floor'], center=(0, 1.95, 0.0))
        box('in_ceiling', 4.4, 3.6, 0.1, M['wood_dark'], center=(0, 1.95, 2.75))
        for i in range(6):
            b = capsule(f'beam{i}', 0.06, 0.06, 3.6, M['wood_dark'], segs=10)
            b.matrix_world = Matrix.Translation(V((-1.75 + i * 0.7, WALL_T, 2.62))) @ Matrix.Rotation(-math.pi / 2, 4, 'X')
        box('in_mat', 1.8, 1.2, 0.012, M['mat'], center=(0.1, 2.3, 0.01))
        box('in_bedroll', 1.0, 0.35, 0.16, weave_mat('blanket', hexc('#7d5a44'), hexc('#5a3e2e'), scale=90), bevel=0.06,
            center=(1.0, 3.2, 0.09))
        # niche with the oil lamp
        box('niche', 0.5, 0.18, 0.4, mat('niche', hexc('#5a4130'), rough=0.95), center=(-1.0, 3.55, 1.15))
        lamp = ellipsoid('lamp', 0.07, 0.045, 0.028, M['pot'], segs=20, rings=10)
        lamp.location = (-1.0, 3.5, 1.0)
        spout = capsule('spout', 0.015, 0.01, 0.06, M['pot'], segs=10)
        spout.matrix_world = Matrix.Translation(V((-0.96, 3.5, 1.01))) @ Matrix.Rotation(math.radians(70), 4, 'Y')
        self.flame = ellipsoid('flame', 0.009, 0.009, 0.024, M['flame'], segs=12, rings=8)
        self.flame.location = (-0.905, 3.5, 1.045)
        L = bpy.data.lights.new('lamp_light', 'POINT')
        L.energy = 9.0
        L.color = (1.0, 0.62, 0.3)
        L.shadow_soft_size = 0.03
        self.lamp_light = bpy.data.objects.new('lamp_light', L)
        bpy.context.scene.collection.objects.link(self.lamp_light)
        self.lamp_light.location = (-0.905, 3.42, 1.06)
        # warm bounce fill inside the room (stands in for light bouncing off plaster)
        F2 = bpy.data.lights.new('room_fill', 'AREA'); F2.energy = 14; F2.color = (1.0, 0.66, 0.38); F2.size = 2.0
        self.room_fill = bpy.data.objects.new('room_fill', F2)
        bpy.context.scene.collection.objects.link(self.room_fill)
        self.room_fill.location = (0.2, 2.6, 2.4)
        self.room_fill.rotation_euler = (0.3, 0, 0)
        for i, (x, y, s) in enumerate(((1.6, 3.35, 1.0), (1.35, 3.4, 0.7), (-1.6, 1.0, 0.85))):
            self.jar(f'injar{i}', V((x, y, 0)), s)
        # opposite side of the street
        self.wall('opp', -12, 10, -3.75, -3.4, 3.2)
        for i, x in enumerate((-4.5, 2.8)):
            box(f'oppdoor{i}', 0.9, 0.05, 1.85, M['wood_dark'], bevel=0.008, center=(x, -3.39, 0.93))
        for i in range(24):
            c = capsule(f'viga{i}', 0.045, 0.045, 0.22, M['wood_dark'], segs=8)
            c.matrix_world = Matrix.Translation(V((-11 + i * 0.9, -3.4, 2.9))) @ Matrix.Rotation(-math.pi / 2, 4, 'X')
        for i in range(14):
            c = capsule(f'viga_h{i}', 0.045, 0.045, 0.22, M['wood_dark'], segs=8)
            c.matrix_world = Matrix.Translation(V((-11 + i * 0.9, 0.0, 2.7))) @ Matrix.Rotation(math.pi / 2, 4, 'X')
        # next block and the alley
        self.wall('next_front', ALLEY[1], 12, 0, WALL_T, 3.1)
        self.wall('alley_w', ALLEY[0] - WALL_T, ALLEY[0], WALL_T, 9.0, 3.0)
        self.wall('alley_e', ALLEY[1], ALLEY[1] + WALL_T, WALL_T, 9.0, 3.1)
        # secluded courtyard beyond the alley
        self.wall('court_back', -1.5, 7.5, 13.5, 13.85, 2.4)
        self.wall('court_w', -1.85, -1.5, 9.0, 13.5, 1.6)
        self.wall('court_e', 7.5, 7.85, 9.0, 13.5, 1.6)
        self.wall('court_wl', -1.5, ALLEY[0] - WALL_T, 8.65, 9.0, 1.7)
        self.wall('court_el', ALLEY[1] + WALL_T, 7.5, 8.65, 9.0, 1.7)
        self.palm(V((4.6, 12.2, 0)))
        self.palm(V((0.4, 12.9, 0)), h=4.6, lean=-0.12)
        for i, (x, y, s) in enumerate(((-1.0, -0.15, 1.0), (-1.35, -0.18, 0.75), (5.5, -0.2, 0.9), (2.0, 12.9, 1.0))):
            self.jar(f'jar{i}', V((x, y, 0)), s)
        # moon, sky and fill
        world = bpy.context.scene.world or bpy.data.worlds.new('w')
        bpy.context.scene.world = world
        world.use_nodes = True
        bg = world.node_tree.nodes['Background']
        bg.inputs['Color'].default_value = (*hexc('#1c2744'), 1)
        bg.inputs['Strength'].default_value = 1.6
        sun = bpy.data.lights.new('moon', 'SUN')
        sun.energy = 1.6
        sun.color = (0.7, 0.8, 1.0)
        sun.angle = math.radians(2.5)
        self.moon = bpy.data.objects.new('moon', sun)
        bpy.context.scene.collection.objects.link(self.moon)
        self.moon.rotation_euler = V((0.42, 0.72, -0.55)).normalized().to_track_quat('-Z', 'Y').to_euler()
        # stars on a distant dome
        smat = mat('star', (0, 0, 0), emission=(0.8, 0.85, 1.0), strength=6)
        r = random.Random(11)
        for i in range(90):
            a, e = r.uniform(0, 2 * math.pi), r.uniform(0.35, 1.3)
            d = 120
            s = ellipsoid(f'star{i}', 0.12, 0.12, 0.12, smat, segs=6, rings=4)
            s.location = (math.cos(a) * math.cos(e) * d, math.sin(a) * math.cos(e) * d, math.sin(e) * d)

    def jar(self, name, pos, s=1.0):
        bm = bmesh.new()
        prof = [(0.0, 0.0), (0.09, 0.0), (0.15, 0.08), (0.17, 0.2), (0.15, 0.32), (0.09, 0.4), (0.07, 0.44), (0.085, 0.47), (0.0, 0.47)]
        segs = 24
        rings = []
        for (r, z) in prof:
            rings.append([bm.verts.new((r * s * math.cos(2 * math.pi * j / segs), r * s * math.sin(2 * math.pi * j / segs), z * s)) for j in range(segs)])
        for i in range(len(rings) - 1):
            for j in range(segs):
                bm.faces.new((rings[i][j], rings[i][(j + 1) % segs], rings[i + 1][(j + 1) % segs], rings[i + 1][j]))
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        me = bpy.data.meshes.new(name)
        bm.to_mesh(me)
        bm.free()
        from lib import new_obj
        ob = new_obj(name, me, self.mats['pot'])
        ob.location = pos
        return ob

    def palm(self, base, h=5.2, lean=0.1):
        M = self.mats
        prev = base
        for i in range(10):
            t = (i + 1) / 10
            p = base + V((lean * t * t * h * 0.3, 0, h * t))
            c = capsule(f'trunk{base.x}_{i}', 0.15 - 0.04 * t, 0.15 - 0.045 * t, (p - prev).length, M['palm'], segs=12)
            place(c, prev, p)
            prev = p
        for k in range(11):
            a = 2 * math.pi * k / 11
            d = V((math.cos(a), math.sin(a), 0.25))
            pts = [prev]
            for j in range(1, 6):
                t = j / 5
                pts.append(prev + d * (1.7 * t) + V((0, 0, -0.9 * t * t)))
            for j in range(5):
                c = capsule(f'frond{base.x}_{k}_{j}', 0.07 * (1 - j / 6), 0.06 * (1 - (j + 1) / 6), (pts[j + 1] - pts[j]).length, M['frond'], segs=6,
                            squash=(2.4, 0.25))
                place(c, pts[j], pts[j + 1], V((0, 0, 1)))

    def set_door(self, angle):
        self.door.rotation_euler = (0, 0, angle)

    def set_frame(self, f):
        flick = 1 + 0.07 * noise1(f * 0.23, 3) + 0.04 * noise1(f * 0.71, 8)
        self.lamp_light.data.energy = 9.0 * flick
        self.flame.scale = (1, 1, 0.9 + 0.2 * flick)
