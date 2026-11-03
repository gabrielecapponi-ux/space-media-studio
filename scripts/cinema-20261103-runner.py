"""Render and validate only owned original cinema scenes, sequentially on one GPU."""
import json,subprocess,sys,time
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
BLENDER=Path('/Applications/Blender.app/Contents/MacOS/Blender')
for scene in ['brand','funding']:
 for profile in ['desktop','mobile']:
  name=f'{scene}-{profile}'
  for mode in ['render','encode']:
   log=ROOT/'outputs/cinema-20261103'/f'{name}-{mode}-final.log'
   command=[str(BLENDER),'--background','--factory-startup','--python',str(ROOT/'scripts/cinema-20261103.py'),'--','--scene',scene,'--profile',profile,'--mode',mode,'--samples','48']
   started=time.monotonic()
   with log.open('w')as stream:result=subprocess.run(command,cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT)
   print(json.dumps({'job':name,'mode':mode,'returncode':result.returncode,'seconds':round(time.monotonic()-started,2),'log':str(log.relative_to(ROOT))}),flush=True)
   if result.returncode:sys.exit(result.returncode)
