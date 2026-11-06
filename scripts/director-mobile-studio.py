"""Film the original assembled SPACE studio for the portrait hero (Blender 5)."""
import math
import shutil
import subprocess
from pathlib import Path

import bpy
from mathutils import Vector

root = Path(__file__).resolve().parents[1]
out = root / 'outputs/director-20261106/entry'
out.mkdir(parents=True, exist_ok=True)
master = root / 'outputs/studio-blender-20261105/space-studio-master.blend'
bpy.ops.wm.open_mainfile(filepath=str(master))
scene = bpy.context.scene
camera = scene.camera
camera.animation_data_clear()
scene.render.engine = 'BLENDER_EEVEE'
scene.render.resolution_x, scene.render.resolution_y = 576, 720
scene.render.resolution_percentage = 100
scene.eevee.taa_render_samples = 16
scene.render.image_settings.file_format = 'JPEG'
scene.render.image_settings.quality = 94
scene.render.film_transparent = False
scene.view_settings.view_transform = 'Standard'
scene.world.node_tree.nodes['Background'].inputs['Color'].default_value = (.004, .005, .006, 1)
scene.world.node_tree.nodes['Background'].inputs['Strength'].default_value = .52
for light in bpy.data.lights:
    light.energy *= .53
bpy.data.lights['Large warm key'].color = (1, .91, .78)
bpy.data.lights['Cool edge softbox'].color = (.67, .81, 1)
bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.38))
floor = bpy.data.materials.new('Charcoal photographic sweep')
floor.use_nodes = True
bsdf = floor.node_tree.nodes['Principled BSDF']
bsdf.inputs['Base Color'].default_value = (.015, .018, .017, 1)
bsdf.inputs['Roughness'].default_value = .43
bpy.context.object.data.materials.append(floor)
# Encode frame zero into the display's UVs. The final camera sees the central
# 1.2 × 1.5 units of the widescreen monitor, exactly the portrait water frame.
display = bpy.data.objects['Screen_Hero']
material = bpy.data.materials.new('Water photographic display')
material.use_nodes = True
nodes = material.node_tree.nodes
emitter = nodes.new('ShaderNodeEmission')
picture = nodes.new('ShaderNodeTexImage')
picture.image = bpy.data.images.load(str(root / 'public/images/flagship-water-entry-mobile.jpg'))
picture.extension = 'EXTEND'
material.node_tree.links.new(picture.outputs['Color'], emitter.inputs['Color'])
material.node_tree.links.new(emitter.outputs[0], nodes['Material Output'].inputs['Surface'])
display.data.materials[0] = material
for corner in display.data.uv_layers.active.data:
    corner.uv.x = .5 + (corner.uv.x - .5) * 2.66 / 1.20

# A working second monitor grounds the reveal in the same portfolio as the page.
screen_two = bpy.data.objects['Screen_Secondary']
secondary = material.copy()
secondary.node_tree.nodes[picture.name].image = bpy.data.images.load(str(root / 'public/images/flagship-campaign.jpg'))
secondary.node_tree.nodes[emitter.name].inputs['Strength'].default_value = .65
screen_two.data.materials[0] = secondary

def smooth(n):
    t = min(1, max(0, n))
    return t * t * (3 - 2 * t)

def xyz(x, y, z):
    return Vector((x, -z, y))

focus = xyz(.1, 1.56, .0)
scene.frame_set(104)
screen = display.matrix_world.translation.copy()
start_direction = xyz(.77, .67, 1.6).normalized()
end_direction = xyz(0, 0, 1)
end_distance = 1.50 / (2 * math.tan(math.radians(39 / 2)))
frame_count = 84
for frame in range(frame_count):
    # Start with a lit plinth in shot, complete the architecture while pushing
    # in, then resolve the product camera against the physical display plane.
    scene.frame_set(round(26 + 79 * smooth(frame / 38)))
    dolly = smooth((frame - 16) / 66)
    aim = focus.lerp(screen, smooth((frame - 10) / 62))
    direction = start_direction.lerp(end_direction, dolly).normalized()
    distance = 22 * (end_distance / 22) ** dolly
    camera.location = aim + direction * distance
    camera.rotation_euler = (-direction).to_track_quat('-Z', 'Y').to_euler()
    scene.render.filepath = str(out / f'frame-{frame:03d}.jpg')
    bpy.ops.render.render(write_still=True)
shutil.copyfile(out / 'frame-000.jpg', root / 'public/images/director-studio-mobile.jpg')
subprocess.run(['ffmpeg','-loglevel','error','-y','-framerate','30','-i',str(out/'frame-%03d.jpg'),
                '-an','-vf','scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p',
                '-c:v','libx264','-crf','21','-preset','slow','-threads','2','-g','30','-colorspace','bt709',
                '-color_trc','bt709','-color_primaries','bt709','-movflags','+faststart',
                str(root/'public/films/director-studio-mobile.mp4')], check=True)
