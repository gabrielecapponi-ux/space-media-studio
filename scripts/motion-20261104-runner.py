"""Render only the owned brand movie, one GPU job at a time."""
from pathlib import Path
import json,subprocess,time,sys
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'outputs/motion-20261104';out.mkdir(exist_ok=True)
for profile in ['desktop','mobile']:
 for mode in ['render','encode']:
  log=out/f'{profile}-{mode}.log';started=time.monotonic()
  command=['/Applications/Blender.app/Contents/MacOS/Blender','--background','--factory-startup','--python',str(ROOT/'scripts/motion-20261104-brand.py'),'--','--profile',profile,'--mode',mode,'--samples','48']
  with log.open('w')as stream:result=subprocess.run(command,cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT)
  print(json.dumps({'profile':profile,'mode':mode,'seconds':round(time.monotonic()-started,2),'returncode':result.returncode,'log':str(log.relative_to(ROOT))}),flush=True)
  if result.returncode:sys.exit(result.returncode)
