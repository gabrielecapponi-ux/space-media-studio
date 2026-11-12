"""One unchanged portrait frame plus memory/disk measurements before continuation."""
import bpy,time,shutil,subprocess,json
from pathlib import Path
P=Path(__file__).resolve().parents[2];O=P/'outputs/luma-mechanics-20261112'
def memory():
 return {'free_disk_gib':round(shutil.disk_usage(P).free/1024**3,4),'swap':subprocess.check_output(['sysctl','vm.swapusage'],text=True).strip(),'vm_stat':subprocess.check_output(['vm_stat'],text=True).strip()}
before=memory();assert before['free_disk_gib']>2,'Portrait preflight needs2GiB before starting'
bpy.ops.wm.open_mainfile(filepath=str(O/'luma-mechanics-portrait.blend'));s=bpy.context.scene
prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
for d in prefs.devices:d.use=d.type=='METAL'
assert s.render.engine=='CYCLES' and s.cycles.samples==20 and s.cycles.max_bounces==7 and s.render.resolution_x==1080 and s.render.resolution_y==1350
s.cycles.device='GPU';s.frame_set(1);s.render.filepath=str(O/'portrait-preflight.png');tick=time.monotonic();bpy.ops.render.render(write_still=True)
after=memory();report={'before':before,'after':after,'render_seconds':round(time.monotonic()-tick,3),'master_unchanged':True,'frame':1,'quality_unchanged':True,'residual_margin_sufficient':after['free_disk_gib']>=1.5}
(O/'portrait-preflight.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));assert report['residual_margin_sufficient'],'Portrait frame consumed excessive disk/swap margin'
