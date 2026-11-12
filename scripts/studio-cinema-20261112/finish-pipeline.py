"""Serial Blackbox native production; run only after reserving the shared GPU."""
from pathlib import Path
import subprocess,json,time
P=Path(__file__).resolve().parents[2];O=P/'outputs/studio-cinema-20261112';B='/Applications/Blender.app/Contents/MacOS/Blender';start=time.monotonic()
def status(stage,**kw):(O/'pipeline-status.json').write_text(json.dumps({'stage':stage,'elapsed_seconds':round(time.monotonic()-start,1),**kw},indent=2));print(stage,flush=True)
def run(stage,args):
 status(stage)
 with(O/f'pipeline-{stage}.log').open('w')as log:subprocess.run(args,cwd=P,stdout=log,stderr=subprocess.STDOUT,check=True)
try:
 run('geometry',[B,'--background','-t','3','--python-exit-code','1','--python','scripts/studio-cinema-20261112/validate.py'])
 for profile,width in [('desktop','2560'),('portrait','1080')]:run(profile,[B,'--background','-t','3','--python-exit-code','1','--python','scripts/studio-cinema-20261112/render-master.py','--','--profile',profile,'--engine','CYCLES','--samples','24','--width',width])
 run('exports',['python3','scripts/studio-cinema-20261112/export.py']);status('ready-for-visual-review')
except Exception as error:status('failed',error=str(error));raise
