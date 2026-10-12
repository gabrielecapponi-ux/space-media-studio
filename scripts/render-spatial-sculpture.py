"""Original SPACE eight-part soft asterisk; native Blender 4K/60 cinematic loop.

No AI generation, external meshes, stock footage or service credits are used.
Run with Blender --background --factory-startup --python this-file -- --preview.
"""
import argparse
import json
import math
import sys
import time
from pathlib import Path

import bpy
from mathutils import Euler, Quaternion, Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
parser = argparse.ArgumentParser()
parser.add_argument('--preview', action='store_true')
parser.add_argument('--benchmark', action='store_true')
parser.add_argument('--frames', default='1:240')
parser.add_argument('--samples', type=int, default=24)
parser.add_argument('--resume', action='store_true')
args = parser.parse_args(argv)
root = Path(__file__).resolve().parents[1]
out = root / 'outputs/spatial-rebuild'
out.mkdir(parents=True, exist_ok=True)

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = args.samples
scene.eevee.use_raytracing = True
scene.eevee.ray_tracing_options.resolution_scale = '2'
scene.eevee.shadow_pool_size = '1024'
scene.render.resolution_x = 1280 if args.preview else 3840
scene.render.resolution_y = 720 if args.preview else 2160
scene.render.resolution_percentage = 100
scene.render.fps = 60
scene.frame_start = 1
scene.frame_end = 240
scene.render.use_persistent_data = True
scene.render.use_motion_blur = True
scene.render.motion_blur_shutter = .32
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.image_settings.color_depth = '8'
scene.render.image_settings.compression = 25
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
scene.view_settings.exposure = 0
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.48, .47, .43, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .6


def material(name, color, metal=0, roughness=.25, coat=.2):
    value = bpy.data.materials.new(name)
    value.use_nodes = True
    bsdf = value.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Metallic'].default_value = metal
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Coat Weight'].default_value = coat
    bsdf.inputs['Coat Roughness'].default_value = .12
    return value


chrome = material('SPACE / soft polished platinum', (.72, .77, .81), 1, .16, .2)
yellow = material('SPACE / vivid yellow ceramic', (.45, .68, .001), .03, .25, .35)
graphite = material('SPACE / deep graphite lacquer', (.018, .024, .029), .35, .22, .4)
stage = material('SPACE / warm ivory photographic cyclorama', (.83, .81, .75), 0, .54, .05)
# An evenly illuminated studio sweep retains geometry-driven ambient occlusion
# without the dark distant-floor falloff of a small physical set.
floor_nodes = stage.node_tree.nodes
floor_links = stage.node_tree.links
floor_nodes.clear()
floor_output = floor_nodes.new('ShaderNodeOutputMaterial')
floor_emission = floor_nodes.new('ShaderNodeEmission')
floor_emission.inputs['Strength'].default_value = 3.5
floor_occlusion = floor_nodes.new('ShaderNodeAmbientOcclusion')
floor_occlusion.inputs['Distance'].default_value = 3.0
floor_occlusion.samples = 16
floor_ramp = floor_nodes.new('ShaderNodeValToRGB')
floor_ramp.color_ramp.elements[0].position = .25
floor_ramp.color_ramp.elements[0].color = (.35, .34, .31, 1)
floor_ramp.color_ramp.elements[1].position = 1
floor_ramp.color_ramp.elements[1].color = (.95, .86, .7, 1)
floor_links.new(floor_occlusion.outputs['AO'], floor_ramp.inputs['Fac'])
floor_links.new(floor_ramp.outputs['Color'], floor_emission.inputs['Color'])
floor_links.new(floor_emission.outputs[0], floor_output.inputs['Surface'])


def signed_power(value, power):
    return math.copysign(abs(value) ** power, value)


# Eight long inflated convex modules: smooth full volumes, not hollow rings.
bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=40, radius=.5)
template = bpy.context.object
for vertex in template.data.vertices:
    vertex.co = Vector(tuple(.5 * signed_power(axis * 2, .72) for axis in vertex.co))
for face in template.data.polygons:
    face.use_smooth = True
template.data.update()
parts = [template]
for index in range(1, 8):
    obj = template.copy()
    obj.data = template.data
    scene.collection.objects.link(obj)
    parts.append(obj)
for index, obj in enumerate(parts):
    obj.name = f'SPACE / soft asterisk spoke {index + 1:02d}'
    # Separate mesh material slots permit individually coloured linked geometry.
    obj.data = obj.data.copy()
    obj.data.materials.clear()
    obj.data.materials.append(yellow if index in (0, 3, 5) else graphite if index == 6 else chrome)
    obj.rotation_mode = 'QUATERNION'

bpy.ops.mesh.primitive_plane_add(size=2000, location=(0, 0, -.09))
bpy.context.object.name = 'SPACE / continuous grounded studio stage'
bpy.context.object.data.materials.append(stage)


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat('-Z', 'Y').to_euler()


def softbox(name, location, energy, width, height, target=(0, 0, 2.5), color=(1, 1, 1)):
    light = bpy.data.lights.new(name, 'AREA')
    light.energy = energy
    light.shape = 'RECTANGLE'
    light.size = width
    light.size_y = height
    light.color = color
    obj = bpy.data.objects.new(name, light)
    scene.collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)


softbox('SPACE / 5m silk key', (-5, -4, 8), 900, 5, 7, color=(1, .97, .9))
softbox('SPACE / long vertical reflection', (5, -1, 5), 700, 1.8, 6, color=(.91, .96, 1))
softbox('SPACE / upper rim strip', (0, 4, 7), 800, 5, 1.4)
softbox('SPACE / frontal soft fill', (0, -7, 3.5), 200, 5, 2)

camera_data = bpy.data.cameras.new('SPACE / 65mm cinema lens')
camera = bpy.data.objects.new('SPACE / controlled parallax camera', camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.lens = 43
camera_data.dof.use_dof = True
camera_data.dof.aperture_fstop = 8
focus = bpy.data.objects.new('SPACE / exact sculpture focal plane', None)
scene.collection.objects.link(focus)
focus.location = (0, 0, 2.45)
camera_data.dof.focus_object = focus


def smooth(value):
    t = max(0, min(1, value))
    return t * t * t * (t * (t * 6 - 15) + 10)


def separation(seconds):
    # Opening and closing holds make the mark readable; every move has a destination.
    if seconds < .55:
        return 0
    if seconds < 1.65:
        return smooth((seconds - .55) / 1.1)
    if seconds < 2.25:
        return 1
    if seconds < 3.55:
        return 1 - smooth((seconds - 2.25) / 1.3)
    return 0


boundary = []
for frame in range(1, 242):
    seconds = ((frame - 1) / 60) % 4
    phase = seconds / 4 * math.tau
    amount = separation(seconds)
    overall_rotation = Euler((math.radians(-5), math.radians(-13) + math.sin(phase) * .08, math.radians(3))).to_quaternion()
    center = Vector((0, 0, 2.45 + math.sin(phase) * .055))
    for index, obj in enumerate(parts):
        angle = index / 8 * math.tau + math.pi / 8
        # The eight generous spokes form a crisp asterisk with a deliberately small centre.
        radius = 1.18 + amount * .73
        # Alternate front/back layers clear each other before the radial gaps close.
        # This adds depth only near the assembled state and avoids intersecting skins.
        closing_clearance = .22 * (1 - smooth(amount / .3))
        location = Vector((math.cos(angle) * radius,
                           (-1 if index % 2 else 1) * (.11 + amount * .6 + closing_clearance),
                           math.sin(angle) * radius))
        obj.location = center + overall_rotation @ location
        spoke_orientation = Quaternion((0, 1, 0), -angle)
        peel = Euler((amount * .30 * (-1 if index % 2 else 1),
                      amount * .10 * math.sin(angle),
                      amount * .20 * math.cos(angle))).to_quaternion()
        obj.rotation_quaternion = overall_rotation @ spoke_orientation @ peel
        obj.scale = (1.63 - amount * .18, .79, .72)
        for data_path in ('location', 'rotation_quaternion', 'scale'):
            obj.keyframe_insert(data_path=data_path, frame=frame)
    camera.location = (6.2 + math.sin(phase) * .24, -12.3, 6.1 + math.sin(phase) * .10)
    look_at(camera, (0, 0, 2.35))
    camera.keyframe_insert(data_path='location', frame=frame)
    camera.keyframe_insert(data_path='rotation_euler', frame=frame)
    if frame in (1, 241):
        boundary.append([[*obj.location, *obj.rotation_quaternion, *obj.scale] for obj in parts])

for obj in parts + [camera]:
    if obj.animation_data and obj.animation_data.action:
        for layer in obj.animation_data.action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    for fcurve in bag.fcurves:
                        for key in fcurve.keyframe_points:
                            key.interpolation = 'LINEAR'

loop_error = max(abs(a - b) for start, end in zip(*boundary) for a, b in zip(start, end))
assert loop_error < 1e-7, loop_error
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(out / 'spatial-sculpture.blend'))
manifest = {
    'title': 'SPACE / Eight-part soft asterisk',
    'source': 'Original authored Blender geometry, PBR materials, area lights, camera and periodic absolute poses',
    'blender': bpy.app.version_string,
    'engine': scene.render.engine,
    'samples': args.samples,
    'width': scene.render.resolution_x,
    'height': scene.render.resolution_y,
    'fps': 60,
    'frames': 240,
    'duration': 4,
    'preview': args.preview,
    'native_render': True,
    'ai_generation': False,
    'external_assets': False,
    'model_weights': False,
    'paid_apis': False,
    'higgsfield': False,
    'frame_interpolation_or_upscale': False,
    'loop_boundary_max_transform_error': loop_error,
    'motion': 'Assembled soft asterisk; radial and depth separation; controlled peel; perfect reassembly. Four seconds, chronological poses, no reversed footage.'
}
start = time.monotonic()
if args.preview:
    frames = [1, 61, 121, 181]
elif args.benchmark:
    frames = [1]
else:
    first, last = map(int, args.frames.split(':'))
    frames = list(range(first, last + 1))
    (out / 'frames').mkdir(exist_ok=True)
for frame in frames:
    target = out / (f'preview-{frame:04d}.png' if args.preview else f'frames/spatial_{frame:04d}.png')
    if args.resume and target.exists():
        continue
    scene.frame_set(frame)
    scene.render.filepath = str(target)
    bpy.ops.render.render(write_still=True)
    (out / 'progress.json').write_text(json.dumps({'frame': frame, 'last': frames[-1], 'elapsed_seconds': time.monotonic() - start}, indent=2))
manifest['elapsed_seconds'] = time.monotonic() - start
manifest['rendered_range'] = [frames[0], frames[-1]]
(out / ('preview-manifest.json' if args.preview else 'render-manifest.json')).write_text(json.dumps(manifest, indent=2) + '\n')
print('SPATIAL_SCULPTURE', json.dumps(manifest), flush=True)
