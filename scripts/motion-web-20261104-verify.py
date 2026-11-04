"""Check the native web reel and write factual production provenance."""
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
import hashlib, json, struct, subprocess
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'outputs/motion-web-20261104'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def probe(p):
 d=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
 d['format']['filename']=str(p.relative_to(ROOT));return d
def faststart(p):
 atoms=[]
 with p.open('rb')as f:
  while True:
   b=f.read(8)
   if len(b)<8:break
   n,k=struct.unpack('>I4s',b);head=8
   if n==1:n=struct.unpack('>Q',f.read(8))[0];head=16
   atoms.append(k.decode('ascii'))
   if n<head:break
   f.seek(n-head,1)
 assert atoms.index('moov')<atoms.index('mdat');return atoms
sources=[]
for ref in ['src/web-reel-motion.js','scripts/motion-web-20261104.mjs','scripts/motion-web-20261104-stage.html','scripts/motion-web-20261104-verify.py']:
 p=ROOT/ref;sources.append({'path':ref,'bytes':p.stat().st_size,'sha256':sha(p)})
assets=[];checks={};masters=[]
for variant,size in [('desktop',(1920,1080)),('mobile',(720,900))]:
 name='motion-web'+('-mobile'if variant=='mobile'else'');film=ROOT/'public/films'/f'{name}.mp4';poster=ROOT/'public/images'/f'{name}.jpg'
 data=probe(film);s=data['streams'][0]
 assert(s['width'],s['height'])==size and s['avg_frame_rate']=='60/1'and s['nb_frames']=='600'
 assert float(data['format']['duration'])==10 and s['codec_name']=='h264'and s['pix_fmt']=='yuv420p'
 assert not any(t['codec_type']=='audio'for t in data['streams'])
 assert s['level']==(42 if variant=='desktop' else 41)
 subprocess.run(['ffmpeg','-v','error','-i',str(film),'-f','null','-'],check=True)
 frames=OUT/'frames'/variant;assert len(list(frames.glob('*.jpg')))==600
 digest=hashlib.sha256();means=[];adjacent=[];first=None;previous=None
 for f in range(600):
  p=frames/f'{f:04d}.jpg';digest.update(p.read_bytes())
  with Image.open(p)as image:
   assert image.size==size;a=image.convert('RGB')
   means.append(sum(ImageStat.Stat(a).mean)/3)
   if first is None:first=a.copy()
   if previous is not None:adjacent.append(sum(ImageStat.Stat(ImageChops.difference(previous,a)).mean)/3)
   previous=a
 assert min(means)>12
 seam=ImageStat.Stat(ImageChops.difference(first,previous)).mean;assert max(seam)<3
 samples=[]
 for f in [0,102,120,300,599]:
  target=OUT/f'encoded-{variant}-{f:04d}.png'
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(film),'-vf',f'select=eq(n\\,{f})','-frames:v','1',str(target)],check=True)
  a=Image.open(frames/f'{f:04d}.jpg').convert('RGB');b=Image.open(target).convert('RGB');diff=ImageStat.Stat(ImageChops.difference(a,b)).mean
  assert max(diff)<5.5;samples.append({'frame':f,'encoded_native_mean_absolute_rgb':diff})
 for p in [film,poster]:assets.append({'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':sha(p),'native_dimensions':size})
 for scene in ['shift','vela','nude','basilico','oltre']:
  p=ROOT/'outputs/web-reel/screens'/variant/f'{scene}.jpg';masters.append({'path':str(p.relative_to(ROOT)),'sha256':sha(p),'native_dimensions':size})
 checks[variant]={'probe':data,'full_decode':'passed','native_frame_count':600,'native_sequence_sha256':digest.hexdigest(),'native_mean_rgb_range':[min(means),max(means)],'maximum_adjacent_pixel_mean':max(adjacent),'first_last_mean_absolute_rgb':seam,'encoded_sample_checks':samples,'mp4_atoms':faststart(film)}
d={'schema_version':1,'id':'motion-web-20261104','method':'Five original website interface screenshots on authored CSS perspective planes, deterministic native60fps rendering, quintic continuous easing. Not AI video, not live product meshes.','timeline':{'fps':60,'frames':600,'seconds':10,'scene_seconds':2,'transition_seconds':.6,'easing':'Quintic smootherstep, zero velocity/acceleration at transition endpoints','periodic':'Frame600 equalsframe0; no duplicated endpoint appended'},'sources':sources,'original_screenshot_masters':masters,'assets':assets,'checks':checks,'upscaled_output':False,'optical_frame_interpolation':False,'reverse_playback':False,'audio':False,'commercial_status':'Original fictional possible website demonstrations, not acquired clients or completed commissions.','source_capture':'Original frozen native browser captures from ASSET-WEB-SHOWREEL.json. Recreate with scripts/render-web-showreel.mjs --mode=screens; keep those original still masters before rendering this new sequence.','reproduce':['npm run dev -- --port 5184','node scripts/motion-web-20261104.mjs --mode=open','node scripts/motion-web-20261104.mjs --mode=frames','node scripts/motion-web-20261104.mjs --mode=encode','python3 scripts/motion-web-20261104-verify.py','node scripts/motion-web-20261104.mjs --mode=close']}
(ROOT/'ASSET-MOTION-WEB-20261104.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'manifest':'ASSET-MOTION-WEB-20261104.json','profiles':2,'native_frames':1200,'public_bytes':sum(a['bytes']for a in assets),'checks':'passed'}))
