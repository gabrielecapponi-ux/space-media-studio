"""SPACE — original Blender architectural intro, with a small native web model.

All geometry, grain and materials are authored here. Coordinates in the helpers
use the website's Y-up space; Blender receives the equivalent Z-up coordinates.
No downloaded assets. Build/export and a separate fresh-scene GLB reimport gate.
"""
import argparse
import hashlib
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'outputs/studio-blender-20261105'
GLB = ROOT / 'public/models/studio-space-20261105.glb'
p = argparse.ArgumentParser()
p.add_argument('--mode', choices=['build', 'validate'], default='build')
a = p.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
OUT.mkdir(parents=True, exist_ok=True)
GLB.parent.mkdir(parents=True, exist_ok=True)


def xyz(v):
    return (v[0], -v[2], v[1])


def color(h):
    values = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return tuple(v / 12.92 if v <= .04045 else ((v + .055) / 1.055) ** 2.4 for v in values) + (1,)


def validate():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(GLB))
    objects = list(bpy.context.scene.objects)
    names = {o.name for o in objects}
    expected = {'SPACE_Studio', 'Assembly_Floor', 'Assembly_BackWall', 'Assembly_LeftWall',
                'Assembly_MainMonitor', 'Screen_Hero', 'Screen_Secondary', 'Assembly_Wordmark'}
    assert expected.issubset(names), f'Missing nodes: {expected - names}'
    tracks = [o for o in objects if 'entryFrom' in o]
    assert len(tracks) >= 14, f'Only {len(tracks)} assembly groups'
    meshes = [o for o in objects if o.type == 'MESH']
    tris = sum(sum(len(face.vertices) - 2 for face in o.data.polygons) for o in meshes)
    assert 1000 < tris < 150000, tris
    assert GLB.stat().st_size < 8_000_000
    assert bpy.data.objects['Screen_Hero'].data.uv_layers
    points = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    bounds = {'min': [min(v[i] for v in points) for i in range(3)],
              'max': [max(v[i] for v in points) for i in range(3)]}
    report = {'blender': bpy.app.version_string, 'reimport': 'passed', 'meshCount': len(meshes),
              'assemblyGroups': len(tracks), 'triangles': tris, 'bytes': GLB.stat().st_size,
              'sha256': hashlib.sha256(GLB.read_bytes()).hexdigest(), 'blenderBounds': bounds,
              'geometry': 'Original authored Blender mesh; no downloaded models or textures',
              'materialTexture': 'Original mathematical walnut grain, embedded in GLB',
              'browserScreen': 'Replaced by responsive CanvasTexture in studio-blender-room.js'}
    (OUT / 'validation.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report))


if a.mode == 'validate':
    validate()
    sys.exit(0)

bpy.ops.wm.read_factory_settings(use_empty=True)
s = bpy.context.scene
s.render.engine = 'BLENDER_EEVEE'
s.render.resolution_x = 1440
s.render.resolution_y = 900
s.render.resolution_percentage = 100
s.render.fps = 30
s.frame_start = 1
s.frame_end = 145
s.view_settings.view_transform = 'AgX'
s.world = bpy.data.worlds.new('SPACE warm studio ambience')
s.world.use_nodes = True
s.world.node_tree.nodes['Background'].inputs['Color'].default_value = color('#c9d0ce')
s.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .32


def material(name, tint, rough=.5, metal=0, emission=0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color(tint)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emission:
        b.inputs['Emission Color'].default_value = color(tint)
        b.inputs['Emission Strength'].default_value = emission
    return m


paper = material('Warm mineral plaster', '#dedbd0', .87)
resin = material('Poured ivory resin', '#cbc9bf', .51)
stone = material('Charcoal cut stone plinth', '#313633', .65)
graphite = material('Graphite acoustic felt', '#242a28', .93)
fabric = material('Oat wool upholstery', '#aaa89b', .9)
black = material('Soft touch carbon', '#111716', .48)
metal = material('Brushed recycled aluminium', '#b9c0bd', .29, .88)
lime = material('SPACE enamel lime', '#dfff00', .29, .10)
light = material('Warm architectural light', '#fff3d0', .28, 0, 1.3)
signal = material('Lime edge light', '#dfff00', .36, 0, .8)
display = material('Display placeholder', '#0b1617', .28)
wood = material('Walnut veneer original grain', '#6e4632', .43)
# A tiny deterministic image gives the GLB a real portable walnut surface.
image = bpy.data.images.new('SPACE authored walnut grain', width=256, height=256)
pixels = []
for y in range(256):
    for x in range(256):
        grain = math.sin(x * .19 + math.sin(y * .021) * 1.8)
        grain += .35 * math.sin(x * .83 + math.sin(y * .06))
        grain += .13 * math.sin(x * 2.53 + y * .015)
        tone = 1 + grain * .115
        pixels.extend((.31 * tone, .155 * tone, .077 * tone, 1))
image.pixels.foreach_set(pixels)
image.pack()
tex = wood.node_tree.nodes.new('ShaderNodeTexImage')
tex.image = image
wood.node_tree.links.new(tex.outputs['Color'], wood.node_tree.nodes['Principled BSDF'].inputs['Base Color'])


def group(name, pos=(0, 0, 0), parent=None, start=None, end=None, offset=(0, .5, 0), scale=None):
    o = bpy.data.objects.new(name, None)
    s.collection.objects.link(o)
    o.location = xyz(pos)
    o.parent = parent
    if start is not None:
        o['entryFrom'] = start
        o['entryTo'] = end
        o['entryOffset'] = list(offset)
        if scale:
            o['entryScaleAxis'] = scale
    return o


def box(name, dims, pos, mat, parent, bevel=.025):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.object
    o.name = name
    o.dimensions = (dims[0], dims[2], dims[1])
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if bevel:
        b = o.modifiers.new('Soft manufactured edges', 'BEVEL')
        b.width = min(bevel, min(dims) * .35)
        b.segments = 2
        bpy.ops.object.modifier_apply(modifier=b.name)
        for f in o.data.polygons:
            f.use_smooth = True
        b = o.modifiers.new('Weighted surface normals', 'WEIGHTED_NORMAL')
        bpy.ops.object.modifier_apply(modifier=b.name)
    o.data.materials.append(mat)
    o.parent = parent
    o.location = xyz(pos)
    return o


def cylinder(name, radius, height, pos, mat, parent, vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=height)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    o.parent = parent
    o.location = xyz(pos)
    for f in o.data.polygons:
        f.use_smooth = len(f.vertices) == 4
    return o


def screen(name, width, height, pos, parent):
    # Front normal +Z in web space; explicit UVs, suitable for CanvasTexture.
    coords = [(-width / 2, -height / 2, 0), (width / 2, -height / 2, 0),
              (width / 2, height / 2, 0), (-width / 2, height / 2, 0)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([xyz(v) for v in coords], [], [(0, 1, 2, 3)])
    mesh.update()
    uv = mesh.uv_layers.new(name='ScreenUV')
    for i, v in enumerate([(0, 0), (1, 0), (1, 1), (0, 1)]):
        uv.data[i].uv = v
    o = bpy.data.objects.new(name, mesh)
    s.collection.objects.link(o)
    o.parent = parent
    o.location = xyz(pos)
    mesh.materials.append(display)
    o['entryScreen'] = name
    return o


root = group('SPACE_Studio')
root['source'] = 'Original Blender scene, Space Media Studio, 2026-11-05'
root['screenCenter'] = [1.78, 2.13, -.477]
floor = group('Assembly_Floor', parent=root, start=0., end=.18, offset=(0, -.45, 0), scale='y')
box('Floating architectural plinth', (9.7, .28, 6.6), (0, -.18, 0), stone, floor, .09)
box('Ivory resin floor', (9.35, .085, 6.25), (0, .003, 0), resin, floor, .025)
box('Front lime reveal', (9.13, .018, .025), (0, -.075, 3.288), signal, floor, .005)
box('Right lime reveal', (.025, .018, 5.95), (4.843, -.075, 0), signal, floor, .005)
for x in [-2.34, 0, 2.34]:
    box('Resin expansion joint', (.008, .002, 6.15), (x, .047, 0), stone, floor, 0)

back = group('Assembly_BackWall', (0, .05, -3.02), root, .12, .36, (0, 0, 0), 'y')
box('Mineral back wall', (9.35, 3.9, .16), (0, 1.95, 0), paper, back, .022)
box('Back crown', (9.4, .09, .22), (0, 3.91, 0), paper, back, .02)
left = group('Assembly_LeftWall', (-4.60, .05, -.08), root, .16, .39, (0, 0, 0), 'y')
box('Mineral side wall', (.16, 3.9, 5.9), (0, 1.95, 0), paper, left, .022)

panel = group('Assembly_AcousticWall', parent=root, start=.25, end=.49, offset=(0, .2, -.16))
box('Acoustic backplane', (6.82, 3.16, .07), (.66, 2.10, -2.902), graphite, panel)
for i in range(15):
    box('Walnut acoustic fin', (.065, 3.18, .12), (-4.27 + i * .10, 2.09, -2.84), wood, panel, .009)
for i in range(29):
    box('Side wall walnut fin', (.10, 2.82, .067), (-4.485, 2.1, -2.64 + i * .174), wood, panel, .009)


def desk(x, z, width, delay, main):
    name = 'Main' if main else 'Second'
    supports = group(f'Assembly_{name}DeskLegs', (x, 0, z), root, .32 + delay, .50 + delay, (0, -.5, 0))
    for side in [-1, 1]:
        box('Sculpted aluminium trestle', (.085, 1.12, 1.20), (side * width * .37, .61, 0), metal, supports, .028)
        box('Low aluminium foot', (.16, .045, 1.40), (side * width * .37, .072, 0), black, supports)
    box('Dark connecting beam', (width * .76, .10, .14), (0, .98, -.4), black, supports)
    top = group(f'Assembly_{name}Desktop', (x, 1.18, z), root, .39 + delay, .60 + delay, (0, .8, 0))
    box('Solid walnut floating desktop', (width, .13, 1.60), (0, 0, 0), wood, top, .055)
    box('Recessed aluminium underside', (width - .22, .022, 1.40), (0, -.07, 0), metal, top, .008)
    mon = group(f'Assembly_{name}Monitor', (x, 0, z - .34), root, .53 + delay, .75 + delay, (0, .6, -.24))
    w, h, cy = (2.66, 1.50, 2.13) if main else (2.32, 1.45, 2.09)
    box('Machined monitor base', (.78, .045, .53), (0, 1.282, .01), metal, mon, .025)
    box('Monitor stem', (.15, .45, .105), (0, 1.49, -.025), metal, mon, .02)
    box('Aluminium display enclosure', (w + .12, h + .12, .105), (0, cy, .01), metal, mon, .04)
    box('Black screen bezel', (w + .06, h + .06, .025), (0, cy, .075), black, mon, .02)
    screen('Screen_Hero' if main else 'Screen_Secondary', w, h, (0, cy, .093), mon)
    inputs = group(f'Assembly_{name}Inputs', (x, 1.275, z + .42), root, .65 + delay, .81 + delay, (0, .25, .15))
    box('Felt desk mat', (1.95, .007, .66), (0, -.023, .02), graphite, inputs, .02)
    box('Aluminium keyboard', (1.31, .035, .45), (-.10, 0, 0), metal, inputs, .015)
    for row in range(4):
        for key in range(15):
            box('Graphite keycap', (.065, .014, .071), (-.65 + key * .078, .024, -.14 + row * .095), black, inputs, 0)
    box('Single lime return key', (.13, .017, .07), (.48, .025, .145), lime, inputs, .004)
    box('Sculpted mouse', (.21, .066, .32), (.81, .015, .03), paper, inputs, .028)
    chair = group(f'Assembly_{name}Chair', (x + (.52 if main else -.2), 0, z + 1.65), root,
                  .59 + delay, .80 + delay, (.35 if main else -.35, 0, .7))
    cylinder('Chair lift', .055, .59, (0, .38, 0), metal, chair)
    for i in range(5):
        angle = i * math.tau / 5
        o = box('Chair radial foot', (.065, .045, .50), (math.sin(angle) * .21, .10, math.cos(angle) * .21), metal, chair, .015)
        o.rotation_euler.z = -angle
        cylinder('Rubber castor', .055, .06, (math.sin(angle) * .43, .06, math.cos(angle) * .43), black, chair, 12)
    box('Soft upholstered seat', (.78, .16, .72), (0, .78, 0), fabric, chair, .065)
    box('Curved oat backrest', (.76, .88, .14), (0, 1.27, .33), fabric, chair, .06)
    for side in [-1, 1]:
        box('Arm support', (.045, .36, .10), (side * .43, .94, .08), metal, chair)
        box('Walnut armrest', (.115, .055, .43), (side * .43, 1.14, .05), wood, chair)


desk(1.78, -.23, 3.44, 0, True)
desk(-1.98, -.43, 2.95, .035, False)

objects = group('Assembly_StudioObjects', parent=root, start=.69, end=.88, offset=(0, .25, 0))
box('Desktop book graphite', (.52, .065, .63), (3.10, 1.295, -.45), graphite, objects)
box('Desktop book lime', (.46, .045, .57), (3.10, 1.352, -.45), lime, objects)
box('Desktop notebook', (.43, .026, .54), (-3.02, 1.279, -.25), paper, objects)
cylinder('Walnut pen cup', .075, .19, (3.12, 1.36, -.76), wood, objects)
for i in range(3):
    cylinder('Technical pencil', .008, .29, (3.08 + i * .03, 1.46, -.76), black, objects, 8)
cylinder('Desk light foot', .17, .025, (-3.08, 1.27, -.94), metal, objects)
cylinder('Desk light upright', .018, .74, (-3.08, 1.65, -.94), metal, objects, 12)
box('Horizontal desk luminaire', (.56, .04, .10), (-2.85, 2.02, -.94), black, objects)
box('Desk luminaire diffuser', (.48, .012, .08), (-2.85, 1.993, -.94), light, objects, .003)

lighting = group('Assembly_Lighting', parent=root, start=.71, end=.91, offset=(0, 0, 0))
box('Back wall linear wash', (8.94, .035, .038), (0, 3.83, -2.901), light, lighting, .009)
box('Side wall linear wash', (.035, .035, 5.55), (-4.475, 3.83, -.1), light, lighting, .009)
box('Back lime skirting reveal', (8.98, .025, .026), (0, .14, -2.912), signal, lighting, .007)

mark = group('Assembly_Wordmark', (.57, 3.02, -2.845), root, .79, .97, (0, .12, 0))


def lettering(body, name, size, pos, mat):
    c = bpy.data.curves.new(name, 'FONT')
    c.body = body
    c.align_x = 'CENTER'
    c.size = size
    c.space_character = 1.12
    c.extrude = .009
    c.bevel_depth = .0015
    c.bevel_resolution = 1
    c.resolution_u = 5
    o = bpy.data.objects.new(name, c)
    s.collection.objects.link(o)
    o.parent = mark
    o.location = xyz(pos)
    o.rotation_euler.x = math.pi / 2
    c.materials.append(mat)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    bpy.ops.object.convert(target='MESH')
    o.select_set(False)


bpy.ops.object.select_all(action='DESELECT')
lettering('SPACE', 'SPACE dimensional wordmark', .73, (0, 0, 0), lime)
lettering('MEDIA STUDIO', 'Studio dimensional descriptor', .135, (0, -.23, 0), paper)

# Join static pieces within each animated group. Hero/secondary displays remain
# named independent meshes so the browser can supply the real responsive page.
for g in [o for o in list(s.objects) if o.type == 'EMPTY']:
    pieces = [o for o in g.children if o.type == 'MESH' and not o.name.startswith('Screen_')]
    if len(pieces) > 1:
        bpy.ops.object.select_all(action='DESELECT')
        for o in pieces:
            o.select_set(True)
        bpy.context.view_layer.objects.active = pieces[0]
        bpy.ops.object.join()
        pieces[0].name = g.name + '_Mesh'

# Browser GLB: static assembled pose plus exported metadata, original geometry.
# Native Blender master: additionally contains a scrub-friendly assembly and dolly.
bpy.ops.object.select_all(action='DESELECT')
for o in [root] + list(root.children_recursive):
    o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(GLB), export_format='GLB', use_selection=True,
                          export_yup=True, export_extras=True, export_animations=False,
                          export_materials='EXPORT', export_cameras=False, export_lights=False)


def aim(o, target):
    o.rotation_euler = (Vector(xyz(target)) - o.location).to_track_quat('-Z', 'Y').to_euler()


for name, pos, energy, size, target in [
        ('Large warm key', (-3.8, 8, 7.5), 2200, 7, (0, 1, 0)),
        ('Cool edge softbox', (5, 5, -1), 1300, 5, (0, 1.4, 0)),
        ('Front bounce', (0, 4, 8), 800, 6, (0, 1, 0))]:
    d = bpy.data.lights.new(name, 'AREA')
    d.energy, d.size = energy, size
    o = bpy.data.objects.new(name, d)
    s.collection.objects.link(o)
    o.location = xyz(pos)
    aim(o, target)

camera_data = bpy.data.cameras.new('SPACE 39 degree camera')
camera_data.sensor_fit = 'VERTICAL'
camera_data.sensor_height = 32
camera_data.lens = 32 / (2 * math.tan(math.radians(39 / 2)))
camera = bpy.data.objects.new('SPACE assembly and entry camera', camera_data)
s.collection.objects.link(camera)
s.camera = camera


def ease(value):
    t = max(0, min(1, value))
    return t * t * (3 - 2 * t)


# The native master samples exactly the same Y-up camera and assembly curves
# as the browser at 30 fps. No independent automatic animation is exported.
target = Vector((0, 1.55, -.1))
direction = Vector((.91, .73, 1.52)).normalized()
right = Vector((0, 1, 0)).cross(direction).normalized()
up = direction.cross(right).normalized()
aspect = s.render.resolution_x / s.render.resolution_y
tan = math.tan(math.radians(39 / 2))
distance = 0
for x in [-4.95, 4.95]:
    for y in [-.35, 4.05]:
        for z in [-3.2, 3.4]:
            corner = Vector((x, y, z)) - target
            depth = corner.dot(direction)
            distance = max(distance, abs(corner.dot(right)) / (tan * aspect) + depth,
                           abs(corner.dot(up)) / tan + depth)
start_camera = target + direction * distance * 1.10
screen_center = Vector((1.78, 2.13, -.477))
end_camera = screen_center + Vector((0, 0, min(1.50 / (2 * tan), 2.66 / (2 * tan * aspect)) * .975))
groups = [(o, o.location.copy()) for o in s.objects if 'entryFrom' in o]
for frame in range(1, 146):
    progress = min(1, (frame - 1) / 99)
    for g, base in groups:
        t = ease((progress - g['entryFrom']) / (g['entryTo'] - g['entryFrom']))
        g.location = base + Vector(xyz(g['entryOffset'])) * (1 - t)
        g.scale = (1, 1, 1)
        if t <= .0001:
            g.scale = (.0001, .0001, .0001)
        elif g.get('entryScaleAxis'):
            g.scale[{'x': 0, 'y': 2, 'z': 1}[g['entryScaleAxis']]] = max(.001, t)
        g.keyframe_insert('location', frame=frame)
        g.keyframe_insert('scale', frame=frame)
    t = ease((frame - 106) / 36)
    location = start_camera.lerp(end_camera, t)
    location.y += math.sin(t * math.pi) * .22
    camera.location = xyz(location)
    aim(camera, target.lerp(screen_center, ease(min(1, t * 1.55))))
    camera.keyframe_insert('location', frame=frame)
    camera.keyframe_insert('rotation_euler', frame=frame)
s.frame_set(103)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT / 'space-studio-master.blend'))
validate()
