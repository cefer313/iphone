"""Geometry, materials and math helpers for the procedural 3D film (Blender bpy)."""
import math
import bpy
import bmesh
from mathutils import Vector, Matrix, Quaternion

V = Vector
UP = V((0, 0, 1))


def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def lerp(a, b, t):
    return a + (b - a) * t


def smoother(t):
    t = clamp(t)
    return t * t * t * (t * (t * 6 - 15) + 10)


def ramp(f, a, b):
    return smoother((f - a) / (b - a)) if b != a else (1.0 if f >= b else 0.0)


def ease_inout(t):
    t = clamp(t)
    return 0.5 - 0.5 * math.cos(math.pi * t)


def kf(f, frames, values):
    """Piecewise eased interpolation (scalars or Vectors); holds outside the range."""
    if f <= frames[0]:
        return values[0].copy() if isinstance(values[0], Vector) else values[0]
    if f >= frames[-1]:
        return values[-1].copy() if isinstance(values[-1], Vector) else values[-1]
    for i in range(len(frames) - 1):
        if frames[i] <= f <= frames[i + 1]:
            t = smoother((f - frames[i]) / (frames[i + 1] - frames[i]))
            a, b = values[i], values[i + 1]
            return a.lerp(b, t) if isinstance(a, Vector) else lerp(a, b, t)


def lagged(fn, f, tau, taps=16):
    """Critically damped follow (gamma kernel): delay without bounce."""
    acc = None
    ws = 0.0
    for i in range(taps):
        w = (i / tau) * math.exp(-i / tau) + (1e-4 if i == 0 else 0)
        v = fn(f - i)
        acc = v * w if acc is None else acc + v * w
        ws += w
    return acc / ws


def noise1(x, seed=1):
    i = math.floor(x)
    fr = x - i
    def h(n):
        s = math.sin((n + seed * 101.7) * 127.1) * 43758.5453
        return s - math.floor(s)
    u = fr * fr * (3 - 2 * fr)
    return lerp(h(i), h(i + 1), u) * 2 - 1


def ik(a, c, l1, l2, pole):
    """Two-bone IK: returns the middle joint, bending toward `pole`."""
    ac = c - a
    d = clamp(ac.length, abs(l1 - l2) + 1e-3, (l1 + l2) * 0.9995)
    u = ac.normalized()
    x = (l1 * l1 - l2 * l2 + d * d) / (2 * d)
    h = math.sqrt(max(0.0, l1 * l1 - x * x))
    p = pole - u * pole.dot(u)
    if p.length < 1e-6:
        p = u.orthogonal()
    return a + u * x + p.normalized() * h


def reach(a, c, mx):
    d = c - a
    return a + d * (mx / d.length) if d.length > mx else c


def basis(z_axis, hint):
    """Rotation matrix whose local Z points along z_axis, local X as close to hint as possible."""
    z = z_axis.normalized()
    x = hint - z * hint.dot(z)
    if x.length < 1e-6:
        x = z.orthogonal()
    x.normalize()
    y = z.cross(x)
    m = Matrix((x, y, z)).transposed()
    return m


def place(obj, a, b, hint=V((1, 0, 0))):
    """Place a segment modelled along local +Z from a to b."""
    rot = basis(b - a, hint).to_4x4()
    obj.matrix_world = Matrix.Translation(a) @ rot


def place_at(obj, pos, rot3=None, scale=1.0):
    m = Matrix.Translation(pos)
    if rot3 is not None:
        m = m @ rot3.to_4x4()
    obj.matrix_world = m @ Matrix.Scale(scale, 4)


def rot_z(a):
    return Matrix.Rotation(a, 3, 'Z')


# ----------------------------------------------------------------- meshes
def new_obj(name, me, mat=None, smooth=True, coll=None):
    ob = bpy.data.objects.new(name, me)
    (coll or bpy.context.scene.collection).objects.link(ob)
    if mat:
        me.materials.append(mat)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    return ob


def capsule(name, r0, r1, length, mat, segs=20, rings=6, squash=(1, 1), coll=None):
    """Tapered capsule along +Z from 0 to length (radii r0 at base, r1 at tip)."""
    bm = bmesh.new()
    verts = []
    prof = []
    for i in range(rings + 1):  # bottom cap
        a = -math.pi / 2 + (math.pi / 2) * i / rings
        prof.append((r0 * math.cos(a), r0 * math.sin(a)))
    for i in range(1, 6):
        t = i / 6
        prof.append((lerp(r0, r1, t), length * t))
    for i in range(rings + 1):  # top cap
        a = (math.pi / 2) * i / rings
        prof.append((r1 * math.cos(a), length + r1 * math.sin(a)))
    for (r, z) in prof:
        ring = []
        for j in range(segs):
            th = 2 * math.pi * j / segs
            ring.append(bm.verts.new((r * math.cos(th) * squash[0], r * math.sin(th) * squash[1], z)))
        verts.append(ring)
    for i in range(len(verts) - 1):
        for j in range(segs):
            a, b = verts[i][j], verts[i][(j + 1) % segs]
            c, d = verts[i + 1][(j + 1) % segs], verts[i + 1][j]
            try:
                bm.faces.new((a, b, c, d))
            except ValueError:
                pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return new_obj(name, me, mat, coll=coll)


def ellipsoid(name, rx, ry, rz, mat, segs=32, rings=16, coll=None):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=rings, radius=1.0)
    for v in bm.verts:
        v.co = V((v.co.x * rx, v.co.y * ry, v.co.z * rz))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return new_obj(name, me, mat, coll=coll)


def box(name, sx, sy, sz, mat, bevel=0.0, coll=None, center=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = V((v.co.x * sx + center[0], v.co.y * sy + center[1], v.co.z * sz + center[2]))
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=3, affect='EDGES')
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return new_obj(name, me, mat, smooth=bevel > 0, coll=coll)


class Tube:
    """A grid mesh (rings x segments) whose vertices are rewritten every frame (cloth)."""

    def __init__(self, name, rings, segs, mat, closed=True, cap_top=False, coll=None, subsurf=1):
        self.rings, self.segs, self.closed = rings, segs, closed
        me = bpy.data.meshes.new(name)
        verts = [(0, 0, 0)] * (rings * segs)
        faces = []
        ncols = segs if closed else segs - 1
        for i in range(rings - 1):
            for j in range(ncols):
                a = i * segs + j
                b = i * segs + (j + 1) % segs
                faces.append((a, b, b + segs, a + segs))
        me.from_pydata(verts, [], faces)
        self.ob = new_obj(name, me, mat, coll=coll)
        if subsurf:
            m = self.ob.modifiers.new('sub', 'SUBSURF')
            m.levels = subsurf
            m.render_levels = subsurf
        so = self.ob.modifiers.new('solid', 'SOLIDIFY')
        so.thickness = 0.008
        so.offset = 1

    def set(self, pts):
        flat = [c for p in pts for c in (p.x, p.y, p.z)]
        self.ob.data.vertices.foreach_set('co', flat)
        self.ob.data.update()


def ring_pts(c, u, w, ru, rw, n, phase=0.0, wob=None, open_front=None):
    out = []
    for j in range(n):
        if open_front is not None:
            # spread points over an arc that leaves the front open
            a0, a1 = open_front
            th = a0 + (a1 - a0) * j / (n - 1)
        else:
            th = 2 * math.pi * j / n + phase
        k = wob(j) if wob else 1.0
        out.append(c + u * (math.cos(th) * ru * k) + w * (math.sin(th) * rw * k))
    return out


# ----------------------------------------------------------------- materials
def mat(name, color, rough=0.6, sss=0.0, sss_radius=(1.0, 0.45, 0.25), sheen=0.0, noise=0.0,
        noise_scale=40.0, bump=0.0, bump_scale=60.0, emission=None, strength=0.0, color2=None):
    m = bpy.data.materials.new(name)
    nt = m.node_tree if m.node_tree else None
    if nt is None:
        m.use_nodes = True
        nt = m.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = rough
    if sss > 0:
        bsdf.inputs['Subsurface Weight'].default_value = sss
        bsdf.inputs['Subsurface Radius'].default_value = sss_radius
        bsdf.inputs['Subsurface Scale'].default_value = 0.05
    if sheen > 0:
        bsdf.inputs['Sheen Weight'].default_value = sheen
        bsdf.inputs['Sheen Roughness'].default_value = 0.6
    links = nt.links
    if noise > 0 or color2 is not None:
        tc = nt.nodes.new('ShaderNodeTexCoord')
        nz = nt.nodes.new('ShaderNodeTexNoise')
        nz.inputs['Scale'].default_value = noise_scale
        nz.inputs['Detail'].default_value = 6
        links.new(tc.outputs['Object'], nz.inputs['Vector'])
        ramp_ = nt.nodes.new('ShaderNodeValToRGB')
        ramp_.color_ramp.elements[0].position = 0.3
        ramp_.color_ramp.elements[1].position = 0.75
        c2 = color2 or tuple(max(0, c * (1 - noise)) for c in color)
        ramp_.color_ramp.elements[0].color = (*c2, 1)
        ramp_.color_ramp.elements[1].color = (*color, 1)
        links.new(nz.outputs['Fac'], ramp_.inputs['Fac'])
        links.new(ramp_.outputs['Color'], bsdf.inputs['Base Color'])
    if bump > 0:
        tc2 = nt.nodes.new('ShaderNodeTexCoord')
        nb = nt.nodes.new('ShaderNodeTexNoise')
        nb.inputs['Scale'].default_value = bump_scale
        nb.inputs['Detail'].default_value = 8
        links.new(tc2.outputs['Object'], nb.inputs['Vector'])
        bp = nt.nodes.new('ShaderNodeBump')
        bp.inputs['Strength'].default_value = bump
        links.new(nb.outputs['Fac'], bp.inputs['Height'])
        links.new(bp.outputs['Normal'], bsdf.inputs['Normal'])
    if emission is not None:
        bsdf.inputs['Emission Color'].default_value = (*emission, 1)
        bsdf.inputs['Emission Strength'].default_value = strength
    return m


def weave_mat(name, color, color2, scale=180.0, rough=0.85, sheen=0.4):
    """Woven fabric: wave-texture warp/weft modulating colour and bump."""
    m = mat(name, color, rough=rough, sheen=sheen)
    nt = m.node_tree
    L = nt.links
    bsdf = nt.nodes.get('Principled BSDF')
    tc = nt.nodes.new('ShaderNodeTexCoord')
    w1 = nt.nodes.new('ShaderNodeTexWave'); w1.wave_type = 'BANDS'; w1.bands_direction = 'X'
    w2 = nt.nodes.new('ShaderNodeTexWave'); w2.wave_type = 'BANDS'; w2.bands_direction = 'Z'
    for w in (w1, w2):
        w.inputs['Scale'].default_value = scale
        w.inputs['Distortion'].default_value = 1.5
        L.new(tc.outputs['Object'], w.inputs['Vector'])
    mx = nt.nodes.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'
    L.new(w1.outputs['Fac'], mx.inputs[0]); L.new(w2.outputs['Fac'], mx.inputs[1])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 12
    L.new(tc.outputs['Object'], nz.inputs['Vector'])
    mix = nt.nodes.new('ShaderNodeMath'); mix.operation = 'MULTIPLY_ADD'
    L.new(mx.outputs[0], mix.inputs[0]); mix.inputs[1].default_value = 0.5
    L.new(nz.outputs['Fac'], mix.inputs[2])
    cr = nt.nodes.new('ShaderNodeValToRGB')
    cr.color_ramp.elements[0].color = (*color2, 1)
    cr.color_ramp.elements[1].color = (*color, 1)
    cr.color_ramp.elements[0].position = 0.35
    cr.color_ramp.elements[1].position = 0.85
    L.new(mix.outputs[0], cr.inputs['Fac'])
    L.new(cr.outputs['Color'], bsdf.inputs['Base Color'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.35
    bp.inputs['Distance'].default_value = 0.002
    L.new(mx.outputs[0], bp.inputs['Height'])
    L.new(bp.outputs['Normal'], bsdf.inputs['Normal'])
    return m


def hexc(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x ** 2.2 for x in c)  # sRGB -> linear
