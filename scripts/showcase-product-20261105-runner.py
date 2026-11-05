"""Serial owned Blender render queue; never uses or stops the user's Blender GUI."""
from pathlib import Path
import subprocess,time,json,sys
ROOT=Path(__file__).resolve().parents[1];out=ROOT/'outputs/showcase-product-20261105';out.mkdir(parents=True,exist_ok=True)
if '--wait-brand' in sys.argv:
 deadline=time.monotonic()+3600
 while not(ROOT/'outputs/showcase-brand-20261105/gpu-complete').exists():
  if time.monotonic()>deadline:raise TimeoutError('Brand render queue did not complete; no camera batch started.')
  time.sleep(5)
if '--resume' not in sys.argv:
 for profile in['desktop','mobile']:
  log=out/f'{profile}-nativeproof.log'
  with log.open('w')as stream:
   subprocess.run(['/Applications/Blender.app/Contents/MacOS/Blender','--background','--factory-startup','--python',str(ROOT/'scripts/showcase-product-20261105.py'),'--','--profile',profile,'--mode','nativeproof'],cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT,check=True)
  print(json.dumps({'profile':profile,'nativeproof':'ready','log':str(log.relative_to(ROOT))}),flush=True)
print('Review native desktop and phone proofs, then create outputs/showcase-product-20261105/approved-to-render.',flush=True)
deadline=time.monotonic()+1800
while not(out/'approved-to-render').exists():
 if time.monotonic()>deadline:raise TimeoutError('Native proof awaiting review; no final batch started.')
 time.sleep(3)
for profile in['desktop','mobile']:
 log=out/f'{profile}-render.log';start=time.monotonic()
 with log.open('w')as stream:
  subprocess.run(['/Applications/Blender.app/Contents/MacOS/Blender','--background','--factory-startup','--python',str(ROOT/'scripts/showcase-product-20261105.py'),'--','--profile',profile,'--mode','render'],cwd=ROOT,stdout=stream,stderr=subprocess.STDOUT,check=True)
 print(json.dumps({'profile':profile,'render':'complete','seconds':round(time.monotonic()-start,2)}),flush=True)
subprocess.run(['python3',str(ROOT/'scripts/showcase-product-20261105-delivery.py')],cwd=ROOT,check=True)
