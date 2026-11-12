"""Run the two approved native profiles serially, then export and validate.
Invoke only when the parent has assigned the GPU to this production.
"""
from pathlib import Path
import subprocess,json,time,sys,os
P=Path(__file__).resolve().parents[2];O=P/'outputs/campaign-cinema-20261112';B=os.environ.get('BLENDER_BIN','/Applications/Blender.app/Contents/MacOS/Blender');start=time.monotonic()
def status(stage,**extra):
 (O/'pipeline-status.json').write_text(json.dumps({'stage':stage,'elapsed':round(time.monotonic()-start,2),**extra},indent=2)+'\n')
def run(stage,cmd):
 status(stage)
 with (O/f'pipeline-{stage}.log').open('w')as log:subprocess.run(cmd,cwd=P,stdout=log,stderr=subprocess.STDOUT,check=True)
try:
 for profile,width in [('desktop',2560),('portrait',1080)]:run(profile,[B,'-b','-t','3','--python-exit-code','1','-P','scripts/campaign-cinema-20261112/render-master.py','--','--profile',profile,'--width',str(width),'--samples','20'])
 run('geometry',[B,'-b','-t','2','--python-exit-code','1','-P','scripts/campaign-cinema-20261112/validate-master.py'])
 for stage,script in [('exports','export.py'),('temporal','temporal-qa.py'),('contacts','contact-sheets.py')]:run(stage,[sys.executable,'scripts/campaign-cinema-20261112/'+script])
 status('ready-for-visual-review',nativeFrames=720,exportedFrames=1440,assets=7)
except Exception as e:
 status('failed',error=str(e));raise
