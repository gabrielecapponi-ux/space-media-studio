"""Build a fresh two-axis tabletop rail; project each native pose through the original still."""
import bpy, json, math, os, numpy as np
from pathlib import Path
from mathutils import Vector, Matrix
RECIPE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = RECIPE_DIR.parents[1]
WORK_DIR = PROJECT_ROOT / 'outputs/director-20261106/craft'
LUMA_ROOT = PROJECT_ROOT / 'outputs/flagship-20261106/luma'
bpy.ops.wm.open_mainfile(filepath=str(LUMA_ROOT / 'luma-optical-bench.blend'))
sc = bpy.context.scene
dep = bpy.context.evaluated_depsgraph_get()
asset_dir = WORK_DIR / 'product'
asset_dir.mkdir(exist_ok=True)

def link(dest, src):
    if dest.is_symlink():
        if dest.resolve() == src.resolve():
            return
        dest.unlink()
    if not dest.exists():
        dest.symlink_to(os.path.relpath(src, start=dest.parent))
link(asset_dir / 'bench.geometry', LUMA_ROOT / 'bench.geometry')
for profile in ['desktop', 'mobile']:
    profile_dir = asset_dir / profile
    profile_dir.mkdir(exist_ok=True)
    pl = json.loads((LUMA_ROOT / profile / 'camera.json').read_text())
    w, h = (pl['width'], pl['height'])
    link(profile_dir / 'floor', LUMA_ROOT / profile / 'floor')
    link(profile_dir / 'plates', LUMA_ROOT / profile / 'plates')
    for shot in pl['shots']:
        name = shot['shot']
        cam = sc.objects[profile + ' ' + name + ' plate camera']
        base = cam.matrix_world.copy()
        lens = cam.data.lens
        target = Vector(cam['target_model']) * 0.035
        offset = cam.location - target
        frames = len(shot['poses'])
        for i in range(frames):
            s = i / (frames - 1) * 2 - 1
            p = s + 0.38 * math.sin(math.pi * s) / math.pi
            a = math.radians({'hero': 3.8, 'optic': 1.9, 'dial': 2.65}[name]) * p
            tilt = math.sin((s + 1) * math.pi * 0.5)
            orb = Matrix.Rotation(a, 3, 'Z') @ offset
            cam.location = target + orb * (1 - {'hero': 0.05, 'optic': 0.043, 'dial': 0.034}[name] * p)
            cam.location.z += 0.035 * tilt * {'hero': 0.15, 'optic': 0.045, 'dial': 0.08}[name]
            aim = target + Vector(({'hero': 0.077, 'optic': 0.024, 'dial': 0.033}[name] * p, 0, 0.034 * p + 0.04 * tilt if name == 'hero' else 0.015 * p)) * 0.035
            cam.rotation_euler = (aim - cam.location).to_track_quat('-Z', 'Y').to_euler()
            cam.data.lens = lens * ({'hero': 1.38, 'optic': 1.17, 'dial': 1.12}[name] if profile == 'mobile' else 1.085 if name != 'optic' else 1.105)
            bpy.context.view_layer.update()
            proj = cam.calc_matrix_camera(dep, x=w, y=h, scale_x=1, scale_y=1)
            shot['poses'][i] = list(np.array(proj @ cam.matrix_world.inverted()).T.flatten().astype(float))
        cam.data.lens = lens
        cam.matrix_world = base
        bpy.context.view_layer.update()
    (profile_dir / 'camera.json').write_text(json.dumps(pl, separators=(',', ':')))
