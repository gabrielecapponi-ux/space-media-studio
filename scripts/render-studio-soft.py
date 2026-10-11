"""Original Space soft volumes: local Blender geometry and periodic motion."""
import bpy
import json
import math
import sys
from pathlib import Path
from mathutils import Euler, Quaternion, Vector

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
out = Path(args[0] if args else "outputs/studio-soft").resolve()
out.mkdir(parents=True, exist_ok=True)
preview = "--preview" in args
check_only = "--check" in args
frame_range = next((item.split("=", 1)[1] for item in args if item.startswith("--frames=")), None)
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 24 if preview else 32
scene.cycles.use_denoising = True
scene.cycles.denoiser = "OPENIMAGEDENOISE"
scene.cycles.denoising_use_gpu = True
scene.cycles.denoising_quality = "HIGH"
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = .045
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 2
scene.cycles.glossy_bounces = 4
scene.cycles.transmission_bounces = 0
scene.render.use_persistent_data = True
prefs = bpy.context.preferences.addons["cycles"].preferences
try:
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for device in prefs.devices:
        device.use = device.type == "METAL"
    scene.cycles.device = "GPU"
except Exception:
    scene.cycles.device = "CPU"
scene.render.resolution_x = 960 if preview else 1920
scene.render.resolution_y = 540 if preview else 1080
scene.render.resolution_percentage = 100
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 144
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.film_transparent = False
scene.render.use_motion_blur = True
scene.render.motion_blur_shutter = .22
scene.view_settings.view_transform = "Khronos PBR Neutral"
scene.view_settings.exposure = -.25
scene.world.use_nodes = True
background = scene.world.node_tree.nodes["Background"]
background.inputs["Color"].default_value = (.009, .012, .018, 1)
background.inputs["Strength"].default_value = .28


def material(name, color, metallic=0, roughness=.25, coat=.22):
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    principled = result.node_tree.nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = (*color, 1)
    principled.inputs["Metallic"].default_value = metallic
    principled.inputs["Roughness"].default_value = roughness
    principled.inputs["Coat Weight"].default_value = coat
    principled.inputs["Coat Roughness"].default_value = .2
    return result


chrome = material("Soft platinum", (.62, .69, .77), 1, .2, .12)
lime = material("Space lime enamel", (.58, .83, .001), .05, .28, .3)
graphite = material("Soft graphite lacquer", (.009, .014, .022), .4, .22, .4)
stage_material = material("Obsidian matte stage", (.006, .008, .012), .05, .5, 0)


def look_at(obj, point):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()


def area(name, location, energy, color, width, height, target=(0, 0, 2)):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.color = color
    data.shape = "RECTANGLE"
    data.size = width
    data.size_y = height
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)


area("Large left silk", (-5, -3, 6.5), 1350, (1, .98, .94), 5, 7)
area("Right vertical strip", (4, -.5, 4.3), 1000, (.85, .92, 1), 1.3, 5)
area("Top softbox", (0, 1.5, 7), 1600, (1, 1, 1), 4, 3)
area("Back rim", (0, 4, 3.8), 800, (.94, 1, .8), 3.5, 4)
area("Low front silk", (-.5, -7, 2), 350, (1, 1, 1), 5, .8)


def signed_power(value, power):
    return math.copysign(abs(value) ** power, value)


# Full convex modules. The superellipsoid is the same authored language as
# src/soft-sculpture.js: sphere coordinates raised to exponent .64, no holes.
bpy.ops.mesh.primitive_uv_sphere_add(segments=80, ring_count=56, radius=.5)
template = bpy.context.object
template.name = "Soft module 00"
for vertex in template.data.vertices:
    vertex.co = Vector(tuple(.5 * signed_power(axis * 2, .64) for axis in vertex.co))
for polygon in template.data.polygons:
    polygon.use_smooth = True
template.data.update()
parts = [template]
for index in range(1, 8):
    obj = template.copy()
    obj.data = template.data.copy()
    obj.name = f"Soft module {index:02d}"
    scene.collection.objects.link(obj)
    parts.append(obj)
for index, obj in enumerate(parts):
    obj.data.materials.clear()
    obj.data.materials.append(lime if index in (1, 2, 6) else chrome if index in (0, 3, 5) else graphite)
    obj.rotation_mode = "QUATERNION"

bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -.11))
stage = bpy.context.object
stage.name = "Soft shadow stage"
stage.data.materials.append(stage_material)
camera_data = bpy.data.cameras.new("Soft motion cinema lens")
camera = bpy.data.objects.new("Soft motion cinema lens", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera_data.lens = 48
camera_data.dof.use_dof = True
camera_data.dof.aperture_fstop = 7.1
focus = bpy.data.objects.new("Sculpture focus", None)
scene.collection.objects.link(focus)
focus.location = (0, 0, 1.95)
camera_data.dof.focus_object = focus


def smooth(value):
    value = max(0, min(1, value))
    return value ** 3 * (value * (value * 6 - 15) + 10)


def coordinates(position):
    # Three.js Y-up coordinates mapped into Blender Z-up.
    return Vector((position[0], -position[2], position[1]))


def authored_pose(index, form):
    x = 1 if index & 1 else -1
    y = 1 if index & 2 else -1
    z = 1 if index & 4 else -1
    row = (2 if index & 2 else 0) + (1 if index & 4 else 0)
    offset = 1 if row % 2 else -1
    if form == "compact":
        return coordinates((x * .64, y * .64, z * .64)), Quaternion(), Vector((1.23,) * 3)
    if form == "spread":
        rotation = Euler((y * .21, -x * y * .13, x * .3)).to_quaternion()
        return coordinates((x * (1.37 + (.08 if z > 0 else 0)), y * 1.32, z * .84)), rotation, Vector((1.02,) * 3)
    return (coordinates((x * .59 + offset * .13, -1.20 + row * .8, offset * .12)),
            Euler((0, 0, offset * .12)).to_quaternion(), Vector((1.1, 1.25, .73)))


def choreography(seconds):
    if seconds < .55:
        return "compact", "compact", 0
    if seconds < 1.65:
        return "compact", "spread", (seconds - .55) / 1.1
    if seconds < 2.7:
        return "spread", "stack", (seconds - 1.65) / 1.05
    if seconds < 3.35:
        return "stack", "stack", 0
    if seconds < 4.45:
        return "stack", "spread", (seconds - 3.35) / 1.1
    return "spread", "compact", (seconds - 4.45) / 1.55


loop_start = []
for frame in range(1, 146):
    seconds = ((frame - 1) / 24) % 6
    angle = seconds / 6 * math.tau
    source, destination, progress = choreography(seconds)
    root_rotation = Euler((math.radians(7), math.radians(-9), -.15 + math.sin(angle) * .13)).to_quaternion()
    center = Vector((0, 0, 1.98 + math.sin(angle) * .035))
    for index, obj in enumerate(parts):
        start_position, start_rotation, start_scale = authored_pose(index, source)
        end_position, end_rotation, end_scale = authored_pose(index, destination)
        amount = smooth(progress)
        position = start_position.lerp(end_position, amount)
        vertical_amount = amount
        # Separate each front/back pair vertically before closing the depth gap.
        # The reverse transition opens the depth first, then aligns the rows.
        if destination == "stack":
            vertical_amount = smooth(amount / .7)
            position.z = start_position.z + (end_position.z - start_position.z) * vertical_amount
            position.y = start_position.y + (end_position.y - start_position.y) * smooth((amount - .3) / .7)
        elif source == "stack":
            vertical_amount = smooth((amount - .3) / .7)
            position.y = start_position.y + (end_position.y - start_position.y) * smooth(amount / .7)
            position.z = start_position.z + (end_position.z - start_position.z) * vertical_amount
        obj.location = center + root_rotation @ position
        obj.rotation_quaternion = root_rotation @ start_rotation.slerp(end_rotation, amount)
        obj.scale = start_scale.lerp(end_scale, amount)
        obj.scale.z = start_scale.z + (end_scale.z - start_scale.z) * vertical_amount
        for path in ("location", "rotation_quaternion", "scale"):
            obj.keyframe_insert(data_path=path, frame=frame)
    camera.location = (7.2 + math.sin(angle) * .17, -10.4, 6 + math.sin(angle) * .09)
    look_at(camera, (0, 0, 1.95))
    camera.keyframe_insert(data_path="location", frame=frame)
    camera.keyframe_insert(data_path="rotation_euler", frame=frame)
    if frame in (1, 145):
        loop_start.append([[*obj.location, *obj.rotation_quaternion, *obj.scale] for obj in parts])

loop_error = max(abs(a - b) for first, final in zip(*loop_start) for a, b in zip(first, final))
assert loop_error < 1e-7, loop_error
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(out / "studio-soft.blend"))
manifest = {
    "title": "Space / Soft motion study",
    "source": "Original procedural superellipsoid geometry, materials, studio lighting and periodic camera choreography",
    "blender": bpy.app.version_string,
    "engine": "CYCLES",
    "samples": scene.cycles.samples,
    "device": scene.cycles.device,
    "fps": 24,
    "frames": 144,
    "width": scene.render.resolution_x,
    "height": scene.render.resolution_y,
    "preview": preview,
    "render_range": [int(value) for value in frame_range.split(":")] if frame_range else [1, 144],
    "mesh_count": 9,
    "sculpture_modules": 8,
    "module_vertices": len(template.data.vertices),
    "loop_boundary_max_transform_error": loop_error,
    "loop": "Absolute periodic poses; compact, separated, stacked, separated, compact. Frames1–144 in chronological order; frame145 matches frame1.",
    "paid_api_used": False,
    "external_assets_used": False,
    "ai_model_weights_used": False,
}
(out / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
if check_only:
    from mathutils.bvhtree import BVHTree
    faces = [[tuple(face.vertices) for face in obj.data.polygons] for obj in parts]
    collisions = []
    for frame in range(1, 145):
        scene.frame_set(frame)
        trees = [BVHTree.FromPolygons([obj.matrix_world @ vertex.co for vertex in obj.data.vertices], indices)
                 for obj, indices in zip(parts, faces)]
        for first in range(8):
            for second in range(first + 1, 8):
                overlaps = trees[first].overlap(trees[second])
                if overlaps:
                    collisions.append({"frame": frame, "pair": [first, second], "triangles": len(overlaps)})
    report = {"frames_checked": 144, "pairs_per_frame": 28, "surface_intersections": collisions}
    (out / "collision-check.json").write_text(json.dumps(report, indent=2) + "\n")
    print("COLLISION_CHECK", json.dumps(report))
    assert not collisions, f"Intersecting volumes: {len(collisions)}"
elif preview:
    for frame in (1, 57, 73, 97):
        scene.frame_set(frame)
        scene.render.filepath = str(out / f"preview-{frame:03d}.png")
        bpy.ops.render.render(write_still=True)
else:
    (out / "frames").mkdir(exist_ok=True)
    if frame_range:
        scene.frame_start, scene.frame_end = (int(value) for value in frame_range.split(":"))
    scene.render.filepath = str(out / "frames" / "soft_")
    bpy.ops.render.render(animation=True)
print("STUDIO_SOFT", json.dumps(manifest))
