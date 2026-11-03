"""Actual native-pixel continuity gate for the Blender sequence, no interpolation."""
import hashlib,json,sys,subprocess
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
folder=Path(sys.argv[1])
if len(sys.argv)>2:
 film=Path(sys.argv[2]);checks=folder/'encoded-check';checks.mkdir(exist_ok=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(film),'-vf',r'select=eq(n\,0)+eq(n\,60)+eq(n\,119)','-fps_mode','vfr',str(checks/'%02d.png')],check=True)
 samples=[]
 for index,frame in enumerate([1,61,120],1):
  a=Image.open(folder/'frames'/f'{frame:04}.png').convert('RGB');b=Image.open(checks/f'{index:02}.png').convert('RGB');assert a.size==b.size
  mean=ImageStat.Stat(ImageChops.difference(a,b)).mean;samples.append({'native_frame':frame,'mean_absolute_rgb':mean,'mean':sum(mean)/3})
 result={'method':'Encoded H264 frames decoded back to PNG and compared with actual native Blender PNGs','samples':samples,'threshold_mean':3.5,'passed':max(v['mean']for v in samples)<3.5}
 (folder/'encoded-pixel-check.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result));sys.exit(0 if result['passed']else 2)
paths=sorted((folder/'frames').glob('*.png'))
assert len(paths)==120,len(paths)
first=None;previous=None;diffs=[];means=[];sequence=hashlib.sha256();size=None
for i,path in enumerate(paths):
 with Image.open(path)as source:
  frame=source.convert('RGB')
  if size is None:size=frame.size
  assert frame.size==size,(path,frame.size,size)
  sequence.update(hashlib.sha256(path.read_bytes()).digest())
  means.append(sum(ImageStat.Stat(frame).mean)/3)
  if first is None:first=frame.copy()
  if previous is not None:diffs.append(sum(ImageStat.Stat(ImageChops.difference(previous,frame)).mean)/3)
  previous=frame
seam=sum(ImageStat.Stat(ImageChops.difference(previous,first)).mean)/3
result={'method':'Native full-resolution PNG pixels, mean absolute RGB on0–255scale','frames':len(paths),'size':size,'maximum_adjacent_mean_absolute_rgb':max(diffs),'first_last_mean_absolute_rgb':seam,'frame_luma_mean_min':min(means),'frame_luma_mean_max':max(means),'ordered_frames_sha256':sequence.hexdigest(),'threshold_maximum_adjacent':6,'threshold_loop_seam':2,'passed':max(diffs)<6 and seam<2 and min(means)>40}
(folder/'pixel-continuity.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result))
if not result['passed']:sys.exit(2)
