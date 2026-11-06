"""Re-photograph the approved editable subjects. No baked graphics over the lens."""
import bpy, json, math, sys, time
from mathutils import Vector
from pathlib import Path
RECIPE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = RECIPE_DIR.parents[1]
WORK_DIR = PROJECT_ROOT / 'outputs/director-20261106/craft'
FLAGSHIP_ROOT = PROJECT_ROOT / 'outputs/flagship-20261106'
mode, profile = sys.argv[sys.argv.index('--') + 1:]
asset_dir = WORK_DIR / mode / profile
asset_dir.mkdir(parents=True, exist_ok=True)
source = FLAGSHIP_ROOT / 'luma/luma-optical-bench.blend' if mode == 'product' else FLAGSHIP_ROOT / mode / profile / f'{mode}-macro-{profile}.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
sc = bpy.context.scene

def aim(ob, point):
    ob.rotation_euler = (Vector(point) - ob.location).to_track_quat('-Z', 'Y').to_euler()

def silk(name, pos, target, w, h, power, color, unit=1):
    data = bpy.data.lights.new(name, 'AREA')
    data.shape = 'RECTANGLE'
    data.size = w * unit
    data.size_y = h * unit
    data.energy = power * unit * unit
    data.color = color
    ob = bpy.data.objects.new(name, data)
    sc.collection.objects.link(ob)
    ob.location = Vector(pos) * unit
    aim(ob, Vector(target) * unit)
    return ob
if mode == 'product':
    # Suppress the old broad horizontal cards. A grazing white vertical strip and a
    # muted petrol rim now reflect in both the front coating AND the internal elements.
    sc.camera = sc.objects[profile + ' optic plate camera']
    for n, s in [('Narrow lens softbox', 0.06), ('Broad violet coating card', 0.07), ('Frontal white fill', 0.36), ('Large overhead silk', 0.75), ('Warm optical bounce', 0.22)]:
        sc.objects[n].data.energy *= s
    silk('Vertical tracing silk', (0.9, -4.65, 2.3), (-0.23, -1.5, 1.1), 0.2, 2.2, 450, (0.65, 0.91, 1), 0.035)
    silk('Petrol rim silk', (1.75, -4.8, 1.8), (-0.23, -1.5, 1.1), 0.47, 1.36, 135, (0.34, 0.56, 0.66), 0.035)
    silk('Amber lens witness', (-2.1, -3.2, 1.55), (-0.23, -1.5, 1.1), 0.1, 1.25, 140, (1, 0.6, 0.28), 0.035)
    sc.render.resolution_x, sc.render.resolution_y = (2560, 1440) if profile == 'desktop' else (1152, 1440)
    target = asset_dir / 'optic-alt.png'
elif mode == 'brand':
    # Cross-polarised fill dims; two large strip lamps catch the raised foil and cocoa ridges.
    for n, s in [('Large linen key', 0.31), ('Warm foil strip', 0.1), ('Upper chocolate edge', 0.55), ('Camera-side bounce', 0.7)]:
        sc.objects[n].data.energy *= s
    silk('Left grazing booklight', (-3.7, -3.25, 1.12), (0, -0.75, 0.62), 0.56, 3.25, 820, (1, 0.8, 0.58))
    silk('Softbox on folded board', (3.7, 0.45, 4.3), (0, -0.3, 0.8), 1.05, 3.7, 560, (0.85, 0.9, 1))
    silk('Letterform glint', (-0.6, -4.4, 3.4), (0, -1.15, 0.72), 0.24, 2.75, 220, (1, 0.88, 0.72))
    target = asset_dir / 'rake.png'
else:
    # View-dependent hidden-line illustration is drawn from the actual mesh with
    # visible silhouettes, hard edges and borders. Omit the clear glazing to see the interior.
    for ob in sc.objects:
        if ob.type == 'MESH' and any((s.material and 'glazing' in s.material.name.lower() for s in ob.material_slots)):
            ob.hide_render = True
    paper = bpy.data.materials.new('Warm drafting paper')
    paper.use_nodes = True
    nt = paper.node_tree
    nt.nodes.clear()
    e = nt.nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = (0.82, 0.79, 0.68, 1)
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    nt.links.new(e.outputs[0], out.inputs['Surface'])
    for layer in sc.view_layers:
        layer.material_override = paper
        layer.use_freestyle = True
        fs = layer.freestyle_settings
        fs.crease_angle = math.radians(125)
        ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new('Visible drawing edges')
        ls.select_by_visibility = True
        ls.visibility = 'VISIBLE'
        ls.select_silhouette = True
        ls.select_border = True
        ls.select_crease = True
        ls.select_contour = True
        ls.select_external_contour = True
        ls.select_material_boundary = False
        if ls.linestyle is None:
            ls.linestyle = bpy.data.linestyles.new('Graphite technical pencil')
        ls.linestyle.color = (0.16, 0.19, 0.17)
        ls.linestyle.thickness = 1.65 if profile == 'desktop' else 1.05
    sc.camera.data.dof.use_dof = False
    sc.render.use_freestyle = True
    sc.render.line_thickness_mode = 'ABSOLUTE'
    bg = sc.world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value = (0.82, 0.79, 0.68, 1)
    bg.inputs['Strength'].default_value = 1
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'Standard'
    sc.view_settings.look = 'None'
    sc.view_settings.exposure = 0
    target = asset_dir / 'working-drawing.png'
sc.render.engine = 'CYCLES'
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for dev in prefs.devices:
    dev.use = dev.type == 'METAL'
assert any((d.type == 'METAL' and d.use for d in prefs.devices))
sc.cycles.device = 'GPU'
sc.cycles.samples = 1 if mode == 'funding' else 26
sc.cycles.use_denoising = mode != 'funding'
sc.cycles.use_adaptive_sampling = mode != 'funding'
sc.cycles.adaptive_threshold = 0.045
if mode == 'funding':
    sc.cycles.max_bounces = 1
if hasattr(sc.cycles, 'denoising_use_gpu'):
    sc.cycles.denoising_use_gpu = False
sc.render.resolution_percentage = 100
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGB'
sc.render.image_settings.color_depth = '8'
sc.render.filepath = str(target)
start = time.monotonic()
bpy.ops.render.render(write_still=True)
receipt = {'profile': profile, 'asset': mode, 'master': str(source.relative_to(FLAGSHIP_ROOT.parent.parent)), 'plate': target.name, 'dims': [sc.render.resolution_x, sc.render.resolution_y], 'sec': round(time.monotonic() - start, 2), 'renderer': 'Cycles Metal + Freestyle' if mode == 'funding' else 'Cycles Metal', 'samples': sc.cycles.samples}
(asset_dir / 'photograph.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(receipt)
