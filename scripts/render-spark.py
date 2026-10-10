#!/usr/bin/env python3
"""Render the original Space Media sculpture with deterministic physical lighting.

Run with Blender, not system Python:
  blender --background --python scripts/render-spark.py -- --preview --frame 240
  blender --background --python scripts/render-spark.py -- --output outputs/spark-render

The mesh source and motion equations are the website's own src/scene.js. No
models, textures, accounts, network requests, or external asset licenses needed.
Frames are numbered 1..264 and sample the same 11 second timeline at 24 fps.
"""

import argparse
import hashlib
import json
import math
import shutil
import subprocess
import sys
from pathlib import Path

import bmesh
import bpy
from mathutils import Matrix, Vector


ROOT = Path(__file__).resolve().parent.parent
FPS = 24
DURATION = 11
FRAME_COUNT = FPS * DURATION


def arguments():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default=str(ROOT / "outputs" / "spark-render"))
    parser.add_argument("--frame", type=int, help="Render only this frame, numbered 1..264")
    parser.add_argument("--start-frame", type=int, default=1, help="Start animation at this frame, retaining the absolute timeline")
    parser.add_argument("--resume", action="store_true", help="Skip frame PNGs that already exist")
    parser.add_argument("--preview", action="store_true", help="Render one inexpensive 640x360 still")
    parser.add_argument("--engine", choices=("CYCLES", "BLENDER_EEVEE_NEXT"), default="CYCLES")
    parser.add_argument("--samples", type=int, default=None)
    parser.add_argument("--size", default=None, help="Output size, e.g. 1600x900")
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    args = parser.parse_args(argv)
    args.samples = args.samples if args.samples is not None else (16 if args.preview else 40)
    args.size = args.size or ("640x360" if args.preview else "1600x900")
    try:
        args.width, args.height = map(int, args.size.lower().split("x"))
    except ValueError:
        parser.error("--size must be WIDTHxHEIGHT")
    if min(args.width, args.height, args.samples) < 1:
        parser.error("Size and samples must be positive")
    if args.frame is not None and not 1 <= args.frame <= FRAME_COUNT:
        parser.error("--frame must be within 1..264")
    if not 1 <= args.start_frame <= FRAME_COUNT:
        parser.error("--start-frame must be within 1..264")
    if args.preview and args.frame is None:
        args.frame = 240
    return args


def srgb(value):
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def color(hex_value):
    return tuple(srgb(int(hex_value[i:i + 2], 16) / 255) for i in (0, 2, 4)) + (1,)


def smooth(value):
    t = min(1.0, max(0.0, value))
    return t * t * t * (t * (t * 6 - 15) + 10)


def mix(a, b, t):
    return a + (b - a) * t


def exact_geometry():
    """Use the audited local Three constructors; preserve the actual web mesh."""
    node = shutil.which("node")
    if not node:
        raise RuntimeError("Node.js is required to read the project's existing Three.js geometry")
    source = r'''
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { readFileSync } from 'node:fs';
const source = readFileSync('src/scene.js', 'utf8');
const start = source.indexOf('function makePetalGeometry(compact) {');
const end = source.indexOf('export function createScene', start);
if (start < 0 || end < 0) throw new Error('Sculpture geometry definitions not found');
const factories = new Function('THREE', 'toCreasedNormals',
  source.slice(start, end) + '; return { makePetalGeometry, makeChassisGeometry };'
)(THREE, toCreasedNormals);
const pack = geometry => ({
  vertices: Array.from(geometry.getAttribute('position').array),
  indices: geometry.index ? Array.from(geometry.index.array) :
    Array.from({length: geometry.getAttribute('position').count}, (_, index) => index),
});
console.log(JSON.stringify({
  petal: pack(factories.makePetalGeometry(false)),
  chassis: pack(factories.makeChassisGeometry(false)),
  core: pack(new RoundedBoxGeometry(0.24, 0.24, 0.32, 4, 0.075)),
  inset: pack(new THREE.SphereGeometry(0.085, 28, 16)),
  pin: pack(new THREE.CylinderGeometry(0.055, 0.055, 0.07, 20).rotateX(Math.PI / 2)),
  pinSlot: pack(new THREE.BoxGeometry(0.068, 0.014, 0.006)),
}));
'''
    result = subprocess.run([node, "--input-type=module", "--eval", source],
                            cwd=ROOT, text=True, capture_output=True, check=False)
    if result.returncode:
        raise RuntimeError(f"Three.js mesh export failed: {result.stderr}")
    return json.loads(result.stdout)


def material(name, hex_value, roughness, metallic=0.0, coat=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = color(hex_value)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["IOR"].default_value = 1.48
    shader.inputs["Coat Weight"].default_value = coat
    shader.inputs["Coat Roughness"].default_value = 0.19
    # Tiny manufacturing variation breaks the perfectly synthetic highlight.
    # These details stay below silhouette scale and remain stable over time.
    noise = mat.node_tree.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 180
    noise.inputs["Detail"].default_value = 2
    noise.inputs["Roughness"].default_value = 0.55
    variation = mat.node_tree.nodes.new("ShaderNodeMapRange")
    variation.inputs["From Min"].default_value = 0
    variation.inputs["From Max"].default_value = 1
    variation.inputs["To Min"].default_value = roughness - 0.025
    variation.inputs["To Max"].default_value = roughness + 0.025
    mat.node_tree.links.new(noise.outputs["Fac"], variation.inputs["Value"])
    mat.node_tree.links.new(variation.outputs["Result"], shader.inputs["Roughness"])
    bump = mat.node_tree.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.08
    bump.inputs["Distance"].default_value = 0.003
    mat.node_tree.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    mat.node_tree.links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    anisotropy = shader.inputs.get("Anisotropic IOR Level")
    if anisotropy and metallic > 0.9:
        anisotropy.default_value = 0.35
    return mat


def mesh_data(name, data, planar_caps=False):
    flat = data["vertices"]
    vertices = [tuple(flat[i:i + 3]) for i in range(0, len(flat), 3)]
    indices = data["indices"]
    faces = [tuple(indices[i:i + 3]) for i in range(0, len(indices), 3)]
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=0.000001)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    for polygon in mesh.polygons:
        polygon.use_smooth = not (planar_caps and abs(polygon.normal.z) > 0.9999)
    # Closed caps remain flat while the actual rounded rim catches a clean band.
    mesh.set_sharp_from_angle(angle=math.pi / 3)
    return mesh


def empty(name, parent=None):
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.parent = parent
    return obj


def instance(name, data, mat, parent=None):
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    # Each petal gets a copied mesh only for its material slot; shared topology.
    obj.data = data.copy()
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    obj.parent = parent
    return obj


def three_rotation(obj, x, y, z):
    # Three Euler XYZ is Rx @ Ry @ Rz. Use a quaternion instead of relying on
    # Blender's differently ordered Euler composition.
    rotation = Matrix.Rotation(x, 4, "X") @ Matrix.Rotation(y, 4, "Y") @ Matrix.Rotation(z, 4, "Z")
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = rotation.to_quaternion()


def look_at(obj, point=(0, 0, 0)):
    obj.rotation_euler = (Vector(point) - obj.location).to_track_quat("-Z", "Y").to_euler()


def softbox(name, at, energy, size, color_value=(1.0, 1.0, 1.0)):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.shape = "RECTANGLE"
    data.size, data.size_y = size
    data.color = color_value
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = at
    look_at(obj)
    return obj


def set_keyframe(obj, frame, location=False, rotation=False, scale=False):
    if location:
        obj.keyframe_insert(data_path="location", frame=frame)
    if rotation:
        obj.keyframe_insert(data_path="rotation_quaternion", frame=frame)
    if scale:
        obj.keyframe_insert(data_path="scale", frame=frame)


def configure_renderer(scene, args):
    scene.render.engine = args.engine
    scene.render.resolution_x = args.width
    scene.render.resolution_y = args.height
    scene.render.resolution_percentage = 100
    scene.render.fps = FPS
    scene.frame_start = args.start_frame
    scene.frame_end = FRAME_COUNT
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.image_settings.compression = 25
    scene.render.film_transparent = False
    scene.render.use_motion_blur = True
    scene.render.motion_blur_shutter = 0.24
    # Retain compiled shaders, mesh data and BVHs between animation frames.
    # Geometry/topology is static: only the existing transforms and key move.
    scene.render.use_persistent_data = True
    scene.render.use_overwrite = not args.resume
    scene.render.use_placeholder = False
    # Match Three.js NeutralToneMapping: highlights roll off rather than clip,
    # while the saturated enamel keeps its hue across the film/live handoff.
    scene.view_settings.view_transform = "Khronos PBR Neutral"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.0
    if args.engine == "CYCLES":
        scene.cycles.samples = args.samples
        scene.cycles.use_adaptive_sampling = True
        scene.cycles.adaptive_threshold = 0.04 if args.preview else 0.025
        scene.cycles.use_denoising = True
        scene.cycles.denoiser = "OPENIMAGEDENOISE"
        scene.cycles.denoising_use_gpu = True
        scene.cycles.denoising_quality = "HIGH"
        scene.cycles.denoising_prefilter = "ACCURATE"
        scene.cycles.max_bounces = 6
        scene.cycles.diffuse_bounces = 2
        scene.cycles.glossy_bounces = 4
        scene.cycles.transmission_bounces = 2
        scene.cycles.transparent_max_bounces = 2
        scene.cycles.seed = 61739
        scene.cycles.use_animated_seed = False
        scene.cycles.sample_clamp_indirect = 4.0
        prefs = bpy.context.preferences.addons["cycles"].preferences
        try:
            prefs.compute_device_type = "METAL"
            prefs.get_devices()
            found = False
            for device in prefs.devices:
                device.use = device.type == "METAL"
                found = found or device.use
            scene.cycles.device = "GPU" if found else "CPU"
            print("SPARK_CYCLES_DEVICE", scene.cycles.device, [(d.name, d.type, d.use) for d in prefs.devices])
        except Exception as exc:
            scene.cycles.device = "CPU"
            print("SPARK_CYCLES_CPU_FALLBACK", str(exc))
    else:
        # Eevee is an explicit faster alternative; it is never called path traced.
        if hasattr(scene, "eevee") and hasattr(scene.eevee, "taa_render_samples"):
            scene.eevee.taa_render_samples = args.samples


def main():
    args = arguments()
    output = Path(args.output).expanduser().resolve()
    output.mkdir(parents=True, exist_ok=True)
    frames_dir = output / "frames"
    frames_dir.mkdir(exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    configure_renderer(scene, args)

    # Camera rays see the site's exact black; reflective rays get a dim neutral
    # studio fill. The large area lights supply the actual physical reflections.
    world = bpy.data.worlds.new("Space / black photographic studio")
    world.use_nodes = True
    nodes, links = world.node_tree.nodes, world.node_tree.links
    nodes.clear()
    out = nodes.new("ShaderNodeOutputWorld")
    paths = nodes.new("ShaderNodeLightPath")
    blend = nodes.new("ShaderNodeMixShader")
    environment = nodes.new("ShaderNodeBackground")
    environment.inputs["Color"].default_value = color("404754")
    environment.inputs["Strength"].default_value = 0.35
    backdrop = nodes.new("ShaderNodeBackground")
    # Invert Neutral's dark offset for camera rays only. This renders the exact
    # CSS #090b10 backdrop after the view transform, without a visible rectangle.
    background = color("090b10")
    offset = math.sqrt(min(background[:3]) / 6.25) - min(background[:3])
    backdrop.inputs["Color"].default_value = tuple(v + offset for v in background[:3]) + (1,)
    backdrop.inputs["Strength"].default_value = 1
    links.new(paths.outputs["Is Camera Ray"], blend.inputs[0])
    links.new(environment.outputs[0], blend.inputs[1])
    links.new(backdrop.outputs[0], blend.inputs[2])
    links.new(blend.outputs[0], out.inputs["Surface"])
    scene.world = world

    geometry = exact_geometry()
    petal = mesh_data("Exact web petal / closed continuous profile", geometry["petal"])
    chassis = mesh_data("Exact web chrome chassis / flat cap", geometry["chassis"], planar_caps=True)
    housing = mesh_data("Exact web core housing", geometry["core"])
    inset = mesh_data("Exact web orange inset", geometry["inset"])
    pin = mesh_data("Precision assembly pin", geometry["pin"])
    pin_slot = mesh_data("Recessed screw slot", geometry["pinSlot"], planar_caps=True)
    cobalt = material("Cobalt enamel #2536ff", "2536ff", 0.3, metallic=0.18, coat=0.7)
    pink = material("Pink enamel #ff48b6", "ff48b6", 0.28, metallic=0.18, coat=0.7)
    chrome = material("Brushed silver #f0f2f6", "f0f2f6", 0.3, metallic=1)
    orange = material("Warm ignition #ff6138", "ff6138", 0.25, metallic=0.1, coat=0.7)
    graphite = material("Graphite screw slots #202735", "202735", 0.4, metallic=0.65)
    rig = empty("SPACE / kinetic identity")
    components = []
    for index in range(4):
        pivot = empty(f"Axis {index + 1}", rig)
        three_rotation(pivot, 0, 0, -index * math.pi / 2)
        component = empty(f"Module {index + 1}", pivot)
        instance(f"Petal {index + 1}", petal, pink if index % 2 else cobalt, component)
        instance(f"Chassis {index + 1}", chassis, chrome, component)
        assembly_pin = instance(f"Assembly pin {index + 1}", pin, chrome, component)
        assembly_pin.location = (0, 0.33, 0.11)
        slot = instance(f"Screw slot {index + 1}", pin_slot, graphite, component)
        slot.location = (0, 0.33, 0.147)
        components.append(component)
    core = empty("Ignition core", rig)
    core_shell = instance("Chrome core housing", housing, chrome, core)
    three_rotation(core_shell, 0, 0, math.pi / 4)
    core_inset = instance("Orange core inset", inset, orange, core)
    core_inset.scale.z = 0.58
    core_inset.location.z = 0.195

    camera_data = bpy.data.cameras.new("Centered crop-safe portrait of identity")
    camera_data.type = "PERSP"
    camera_data.lens_unit = "FOV"
    # Blender camera angle is horizontal. Three's 34 degrees is vertical.
    camera_data.angle = 2 * math.atan(math.tan(math.radians(34) / 2) * args.width / args.height)
    camera_data.clip_start, camera_data.clip_end = 0.1, 100
    camera = bpy.data.objects.new("Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0, 0, 12.8)
    camera.rotation_euler = (0, 0, 0)
    scene.camera = camera

    key = softbox("Key / tall softbox", (-4.2, 6.2, 8), 750, (3.0, 4.5), (1.0, 0.97, 0.93))
    softbox("Fill / cool strip", (5, 0.5, 4), 320, (0.8, 4.0), (0.83, 0.89, 1.0))
    softbox("Edge / silver outline", (2, 5, -4), 900, (1.0, 5.0))
    softbox("Left strip / definition", (-5, 0, 2), 260, (0.55, 5.0))

    # Every frame stores absolute state. Random access, reverse playback, and
    # rerenders reproduce the same pose without simulation or accumulated deltas.
    for frame in range(1, FRAME_COUNT + 1):
        t = (frame - 1) / FPS
        explore = smooth((t - 1.5) / 2.3)
        connect = smooth((t - 5.1) / 3.5)
        opened = explore * (1 - connect)
        unfurled = max(explore, connect)
        for index, component in enumerate(components):
            explored = smooth((explore - index * 0.035) / 0.895)
            assembled = smooth((connect - index * 0.025) / 0.925)
            separated = explored * (1 - assembled)
            unfolded = max(explored, assembled)
            radius = mix(0.52, 0.015, unfolded) + separated * 0.82
            component.location = (0, radius, separated * (-0.10 if index % 2 else 0.20))
            three_rotation(component, (1 - unfolded) * 0.92 + separated * 0.11,
                           separated * (-0.13 if index % 2 else 0.13), 0)
            set_keyframe(component, frame, location=True, rotation=True)
        core.scale = (mix(3.4, 1, smooth(unfurled)),) * 3
        three_rotation(core, 0, opened * 0.3, 0)
        set_keyframe(core, frame, rotation=True, scale=True)
        rig.scale = (1.04 - opened * 0.08 + connect * 0.22,) * 3
        three_rotation(rig, -0.22 + connect * 0.09,
                       -0.67 + opened * 0.36 + connect * 0.16,
                       -0.28 + opened * 0.22 + connect * 0.21)
        set_keyframe(rig, frame, rotation=True, scale=True)
        # The 2.8 unit framing allowance preserves the same camera travel while
        # keeping exploded parts within the central square of the 16:9 master.
        camera.location.z = 12.8 + opened * 0.3 - connect * 0.16
        set_keyframe(camera, frame, location=True)
        sweep = smooth((t - 8.6) / 2.4)
        key.location.x = -4.2 + sweep * 1.2
        look_at(key)
        key.keyframe_insert(data_path="location", frame=frame)
        key.keyframe_insert(data_path="rotation_euler", frame=frame)

    scene.render.filepath = str(frames_dir / "spark_")
    scene.frame_set(args.frame or 1)
    scene["source"] = "Original Space Media Studio website geometry and deterministic motion"
    scene["timeline_seconds"] = DURATION
    scene["mesh_source_sha256"] = hashlib.sha256((ROOT / "src" / "scene.js").read_bytes()).hexdigest()
    scene["frame_time_formula"] = "t = (frame - 1) / 24; absolute 11 second pose"
    scene["framing_camera_allowance"] = 2.8
    blend_path = output / "spark.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path))
    manifest = {
        "generator": "scripts/render-spark.py", "blender": bpy.app.version_string,
        "engine": args.engine, "samples": args.samples,
        "device": scene.cycles.device if args.engine == "CYCLES" else "GPU rasterization",
        "width": args.width, "height": args.height, "fps": FPS,
        "duration": DURATION, "frames": FRAME_COUNT, "seed": 61739,
        "start_frame": args.start_frame, "resume_existing_frames": args.resume,
        "persistent_data": scene.render.use_persistent_data,
        "denoising_gpu": scene.cycles.denoising_use_gpu if args.engine == "CYCLES" else None,
        "denoising_quality": scene.cycles.denoising_quality if args.engine == "CYCLES" else None,
        "motion_blur_shutter": scene.render.motion_blur_shutter,
        "view_transform": scene.view_settings.view_transform,
        "mesh_source_sha256": scene["mesh_source_sha256"],
        "mesh_objects": len([obj for obj in scene.objects if obj.type == "MESH"]),
        "triangles": sum(len(obj.data.polygons) for obj in scene.objects if obj.type == "MESH"),
        "blend": str(blend_path), "frames_pattern": str(frames_dir / "spark_%04d.png"),
    }
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("SPARK_MANIFEST", json.dumps(manifest))
    if args.frame is not None:
        scene.render.filepath = str(output / f"preview-{args.frame:04d}.png")
        bpy.ops.render.render(write_still=True)
    else:
        bpy.ops.render.render(animation=True)


if __name__ == "__main__":
    main()
