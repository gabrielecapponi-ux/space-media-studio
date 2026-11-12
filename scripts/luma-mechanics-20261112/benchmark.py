"""Controlled denoiser benchmark, same Cycles20 geometry/seed/lighting."""
import bpy,time,json,shutil
from pathlib import Path
P=Path(__file__).resolve().parents[2];O=P/'outputs/luma-mechanics-20261112';bpy.ops.wm.open_mainfile(filepath=str(O/'luma-mechanics-approved20.blend'));s=bpy.context.scene
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
s.render.engine='CYCLES';s.cycles.device='GPU';s.cycles.samples=20;s.cycles.seed=23;s.render.use_persistent_data=True
if hasattr(s.cycles,'use_animated_seed'):s.cycles.use_animated_seed=False
rows=[]
for gpu,f in [(False,301),(True,301),(True,302)]:
 assert shutil.disk_usage(P).free>500*1024**2
 s.cycles.denoising_use_gpu=gpu;s.frame_set(f);s.render.filepath=str(O/f'benchmark-denoise-{"gpu"if gpu else"cpu"}-{f}.png')
 start=time.monotonic();bpy.ops.render.render(write_still=False);render=time.monotonic()-start
 tick=time.monotonic();bpy.data.images['Render Result'].save_render(s.render.filepath,scene=s);save=time.monotonic()-tick
 row={'gpu_denoise':gpu,'frame':f,'render_seconds':round(render,3),'save_seconds':round(save,3),'samples':20,'bounces':s.cycles.max_bounces,'resolution':[s.render.resolution_x,s.render.resolution_y]};rows.append(row);print('DENOISE_BENCH',row,flush=True);(O/'denoise-benchmark.json').write_text(json.dumps(rows,indent=2))
