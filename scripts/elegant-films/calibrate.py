"""Author the 10-second LUMA rail from the original Blender camera and geometry."""
import json
import math
import os
from pathlib import Path

import bpy
import numpy as np
from mathutils import Vector, Matrix

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs/reentry-20261109/films/product'
SOURCE = ROOT / 'outputs/flagship-20261106/luma'
DIRECTOR = ROOT / 'outputs/director-20261106/craft/product'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(SOURCE / 'luma-optical-bench.blend'))
scene = bpy.context.scene
depsgraph = bpy.context.evaluated_depsgraph_get()


def link(target, source):
    if not target.exists():
        target.symlink_to(os.path.relpath(source, target.parent))


link(OUT / 'bench.geometry', SOURCE / 'bench.geometry')
profile = OUT / 'desktop'
profile.mkdir(exist_ok=True)
link(profile / 'floor', SOURCE / 'desktop/floor')
link(profile / 'plates', SOURCE / 'desktop/plates')
link(profile / 'optic-alt.png', DIRECTOR / 'desktop/optic-alt.png')
plan = json.loads((SOURCE / 'desktop/camera.json').read_text())
plan.update(width=2560, height=1440, order=[[0, 120, 270], [1, 0, 165], [2, 0, 165], [0, 0, 120]])
for shot in plan['shots']:
    name = shot['shot']
    camera = scene.objects['desktop ' + name + ' plate camera']
    matrix = camera.matrix_world.copy()
    lens = camera.data.lens
    target = Vector(camera['target_model']) * .035
    offset = camera.location - target
    count = 270 if name == 'hero' else 165
    shot['poses'] = []
    for frame in range(count):
        # The dolly eases into each optical field; its speed is continuous within
        # the shot and settles before the editorial cut to the next material.
        phase = frame / (count - 1)
        p = math.sin((phase - .5) * math.pi)
        arc = math.sin(math.pi * phase)
        angle = math.radians({'hero': 3.1, 'optic': 1.55, 'dial': 2.1}[name]) * p
        camera.location = target + (Matrix.Rotation(angle, 3, 'Z') @ offset) * (1 - {'hero': .042, 'optic': .034, 'dial': .027}[name] * p)
        camera.location.z += .035 * arc * {'hero': .11, 'optic': .036, 'dial': .055}[name]
        aim = target + Vector(({'hero': .060, 'optic': .018, 'dial': .024}[name] * p, 0, .022 * p + .025 * arc if name == 'hero' else .01 * p)) * .035
        camera.rotation_euler = (aim - camera.location).to_track_quat('-Z', 'Y').to_euler()
        camera.data.lens = lens * (1.072 if name != 'optic' else 1.085)
        bpy.context.view_layer.update()
        projection = camera.calc_matrix_camera(depsgraph, x=2560, y=1440, scale_x=1, scale_y=1)
        shot['poses'].append(list(np.array(projection @ camera.matrix_world.inverted()).T.flatten().astype(float)))
    camera.data.lens = lens
    camera.matrix_world = matrix
    bpy.context.view_layer.update()
(profile / 'camera.json').write_text(json.dumps(plan, separators=(',', ':')))
print('LUMA calibrated: 2560 x 1440; 600 native poses; 314906-triangle Blender subject')
