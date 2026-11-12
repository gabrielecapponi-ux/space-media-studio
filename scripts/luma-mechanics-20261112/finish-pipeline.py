"""Continue the approved asset production serially after the active desktop render."""
from pathlib import Path
import subprocess,time,json,hashlib,shutil
P=Path(__file__).resolve().parents[2];O=P/'outputs/luma-mechanics-20261112';B='/Applications/Blender.app/Contents/MacOS/Blender';start=time.monotonic();state=O/'pipeline-status.json'
def status(stage,**kw):state.write_text(json.dumps({'stage':stage,'elapsed_seconds':round(time.monotonic()-start,1),**kw},indent=2));print(stage,flush=True)
def run(stage,args):
 status(stage)
 with (O/f'pipeline-{stage}.log').open('w')as f:subprocess.run(args,cwd=P,stdout=f,stderr=subprocess.STDOUT,check=True)
try:
 status('waiting-for-native-desktop')
 while not (O/'production-desktop.json').exists():
  log=O/'production-desktop.log'
  if log.exists()and 'Traceback'in log.read_text()[-8000:]:raise RuntimeError('Desktop render failed; completed chunks remain resumable')
  if time.monotonic()-start>3*3600:raise RuntimeError('Desktop completion timeout; inspect its log before resuming')
  time.sleep(10)
 report=json.loads((O/'production-desktop.json').read_text());file=P/report['file'];assert report['decode']=='pass'and hashlib.sha256(file.read_bytes()).hexdigest()==report['sha256']
 status('desktop-complete-cooling-down')
 time.sleep(30)
 disk_wait=time.monotonic()
 while shutil.disk_usage(P).free<2*1024**3:
  status('waiting-for-portrait-disk-margin',free_gib=round(shutil.disk_usage(P).free/1024**3,3))
  if time.monotonic()-disk_wait>600:raise RuntimeError('Portrait awaits2GiB disk margin; desktop and chunks are safe')
  time.sleep(15)
 run('portrait-preflight',[B,'--background','--python','scripts/luma-mechanics-20261112/portrait-preflight.py'])
 run('portrait',[B,'--background','--python','scripts/luma-mechanics-20261112/render-master.py','--','--profile','portrait','--engine','CYCLES','--samples','20','--width','1080'])
 run('geometry',[B,'--background','--python','scripts/luma-mechanics-20261112/validate-master.py'])
 run('exports',['python3','scripts/luma-mechanics-20261112/export.py'])
 run('temporal',['python3','scripts/luma-mechanics-20261112/temporal-qa.py'])
 status('ready-for-final-visual-review',manifest='outputs/luma-mechanics-20261112/asset-manifest.json')
except Exception as e:
 status('failed',error=str(e));raise
