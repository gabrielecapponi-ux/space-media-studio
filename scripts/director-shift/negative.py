"""New oversampled exposure of the exact shop camera. Only the physical macro area is rendered."""
import bpy
from pathlib import Path
root=Path(__file__).resolve().parents[2]
out=root/'outputs/director-20261106/shift'
out.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root/'outputs/flagship-20261106/shift/phase-01.blend'))
scene=bpy.context.scene
scene.camera.data.lens=47
scene.cycles.device='CPU'
scene.cycles.samples=24
scene.cycles.use_denoising=True
scene.render.threads_mode='FIXED'
scene.render.threads=3
scene.render.resolution_percentage=100
scene.render.resolution_x=3200
scene.render.resolution_y=2400
scene.render.use_border=True
scene.render.use_crop_to_border=True
scene.render.border_min_x=.25
scene.render.border_max_x=.975
scene.render.border_min_y=.05
scene.render.border_max_y=.85
scene.render.filepath=str(out/'jog-negative-3200-crop.png')
bpy.ops.render.render(write_still=True)
print('Native 3200x2400 field, crop x800..3120 y360..2280 top-left coordinates, original 47mm lens.')
