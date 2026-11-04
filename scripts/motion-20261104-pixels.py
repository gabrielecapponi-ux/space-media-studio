"""Native continuity plus sampled encode comparison for the 48fps Blender film."""
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
import hashlib,json,subprocess,sys
folder=Path(sys.argv[1]);film=Path(sys.argv[2]);paths=sorted((folder/'frames').glob('*.png'))
assert len(paths)==288,len(paths)
mean=lambda image:sum(ImageStat.Stat(image).mean)/3
first=None;previous=None;differences=[];means=[];digest=hashlib.sha256();size=None
for path in paths:
 with Image.open(path)as source:
  image=source.convert('RGB');digest.update(hashlib.sha256(path.read_bytes()).digest())
  if size is None:size=image.size
  assert image.size==size
  means.append(mean(image))
  if first is None:first=image.copy()
  if previous is not None:differences.append(mean(ImageChops.difference(previous,image)))
  previous=image
seam=mean(ImageChops.difference(previous,first));assert max(differences)<6 and seam<2 and min(means)>40,(max(differences),seam,min(means))
checks=folder/'encoded-check';checks.mkdir(exist_ok=True)
subprocess.run(['ffmpeg','-v','error','-y','-i',str(film),'-vf',r'select=eq(n\,0)+eq(n\,144)+eq(n\,287)','-fps_mode','vfr',str(checks/'%02d.png')],check=True)
samples=[]
for index,frame in enumerate([1,145,288],1):
 a=Image.open(folder/'frames'/f'{frame:04}.png').convert('RGB');b=Image.open(checks/f'{index:02}.png').convert('RGB');assert a.size==b.size
 mae=mean(ImageChops.difference(a,b));assert mae<3.5,(frame,mae);samples.append({'frame':frame,'decoded_vs_native_mean_absolute_rgb':mae})
report={'frames':len(paths),'native_dimensions':size,'sequence_sha256':digest.hexdigest(),'native_maximum_adjacent_mean_rgb':max(differences),'native_first_vs_last_mean_rgb':seam,'native_mean_rgb_range':[min(means),max(means)],'encoded_native_samples':samples,'passed':True}
(folder/'pixel-validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
