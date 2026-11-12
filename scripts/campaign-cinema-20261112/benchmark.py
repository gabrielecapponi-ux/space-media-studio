"""Render native QHD proof without modifying the accepted master."""
from pathlib import Path
import bpy,json,time,hashlib
P=Path(__file__).resolve().parents[2];O=P/'outputs/campaign-cinema-20261112';master=O/'campaign-cinema-desktop.blend';before=hashlib.sha256(master.read_bytes()).hexdigest();bpy.ops.wm.open_mainfile(filepath=str(master));s=bpy.context.scene
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
s.cycles.device='GPU';s.render.use_persistent_data=True;s.render.resolution_x=2560;s.render.resolution_y=1440;s.render.resolution_percentage=100
rows=[]
for frame in [161,162]:
 s.frame_set(frame);s.render.filepath=str(O/f'benchmark-{frame:04d}.png');tick=time.monotonic();bpy.ops.render.render(write_still=True);rows.append({'frame':frame,'seconds':time.monotonic()-tick})
assert hashlib.sha256(master.read_bytes()).hexdigest()==before
(O/'benchmark.json').write_text(json.dumps({'native':[2560,1440],'samples':s.cycles.samples,'master_sha256':before,'frames':rows},indent=2)+'\n');print('BENCHMARK',rows,flush=True)
