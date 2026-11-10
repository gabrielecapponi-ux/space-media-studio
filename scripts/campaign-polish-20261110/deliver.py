"""Render new campaign streams, validate, then install only campaign assets."""
from pathlib import Path
import importlib.util,subprocess,hashlib,json,shutil,time,sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'outputs/campaign-web-revision-20261110/campaign'
spec=importlib.util.spec_from_file_location('campaign_polish',Path(__file__).with_name('render.py'));m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
PREFIX='cinematic-campaign-20261110'
FILMS=[('elegant-campaign.mp4',(2560,1440),60),('elegant-campaign-hd.mp4',(1920,1080),60),('elegant-campaign-compact.mp4',(1280,720),30),('director-campaign-mobile.mp4',(720,900),30)]
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def run(args):return subprocess.check_output(args)
def render(profile):
 scene=m.Campaign(profile);w,h=scene.size;fps=30 if profile=='mobile' else 60;count=fps*10;path=OUT/('director-campaign-mobile.mp4' if profile=='mobile' else 'elegant-campaign.mp4')
 cmd=['ffmpeg','-nostdin','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{w}x{h}','-r',str(fps),'-i','pipe:0','-an','-filter_threads','2','-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p','-c:v','libx264','-threads','3','-preset','medium','-crf','18' if profile=='desktop' else '19','-maxrate','5800k' if profile=='desktop' else '2800k','-bufsize','8M' if profile=='desktop' else '3M','-profile:v','high','-level:v','5.1' if profile=='desktop' else '3.1','-g',str(fps),'-keyint_min',str(fps),'-sc_threshold','0','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',str(path)]
 encoder=subprocess.Popen(cmd,stdin=subprocess.PIPE);start=time.monotonic()
 try:
  for i in range(count):
   frame=scene.frame(i*60//fps);encoder.stdin.write(frame.tobytes())
   if i%(fps*2)==0:print(profile,i,count,round(time.monotonic()-start,2),flush=True)
 finally:encoder.stdin.close()
 assert encoder.wait()==0
 assert scene.frame(0).tobytes()==scene.frame(600).tobytes()
 return path

def transcode(name,size,fps):
 args=['ffmpeg','-nostdin','-v','error','-y','-threads','2','-i',str(OUT/'elegant-campaign.mp4'),'-an','-filter_threads','2','-vf',f'fps={fps},scale={size[0]}:{size[1]}:flags=lanczos','-c:v','libx264','-threads','3','-preset','medium']
 args+=['-b:v','950k','-maxrate','1100k','-bufsize','220k'] if fps==30 else ['-crf','19','-maxrate','3400k','-bufsize','4M']
 args+=['-profile:v','high','-level:v','3.1' if fps==30 else '4.2','-g',str(fps),'-keyint_min',str(fps),'-sc_threshold','0','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',str(OUT/name)];run(args)

def validate(name,size,fps):
 p=OUT/name;d=json.loads(run(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]));s=d['streams'][0]
 assert len(d['streams'])==1 and (s['width'],s['height'],s['avg_frame_rate'],s['nb_frames'],s['pix_fmt'])==(*size,f'{fps}/1',str(fps*10),'yuv420p');assert s['profile']=='High';raw=p.read_bytes();assert raw.index(b'moov')<raw.index(b'mdat')
 pixels=run(['ffmpeg','-nostdin','-v','error','-threads','2','-i',str(p),'-vf','scale=128:72,format=gray','-threads','1','-f','rawvideo','-']);frames=[pixels[i:i+9216] for i in range(0,len(pixels),9216)];assert len(frames)==fps*10;dup=sum(a==b for a,b in zip(frames,frames[1:]));assert dup==0
 loop=sum(abs(a-b) for a,b in zip(frames[-1],frames[0]))/9216;assert loop<1.7,(name,loop)
 packets=json.loads(run(['ffprobe','-v','error','-show_packets','-show_entries','packet=pts_time,size','-of','json',str(p)]))['packets'];ordered=sorted((float(a['pts_time']),int(a['size'])) for a in packets);start=0;window=0;peak=0
 for stamp,count in ordered:
  window+=count
  while ordered[start][0]<=stamp-1:window-=ordered[start][1];start+=1
  peak=max(peak,window*8)
 if 'compact' in name:assert peak<=1400000
 return {'path':'public/films/'+name,'dimensions':size,'fps':fps,'frames':fps*10,'bytes':p.stat().st_size,'sha256':digest(p),'fullDecode':True,'adjacentDuplicateFrames':dup,'loopMean8bit':loop,'faststart':True,'peakBitrateOneSecond':peak,'bitrate':s.get('bit_rate')}

def main():
 OUT.mkdir(parents=True,exist_ok=True);m.authoring();before=OUT/'before';before.mkdir(exist_ok=True)
 originals=[ROOT/'public/films'/name for name,_,_ in FILMS]+[ROOT/'public/images'/name for name in ['elegant-campaign.jpg','elegant-campaign.webp','elegant-campaign-thumb.webp','director-campaign-mobile.jpg']]
 old=[]
 for p in originals:
  if p.exists():old.append({'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':digest(p)});shutil.copy2(p,before/p.name)
 (OUT/'before-manifest.json').write_text(json.dumps(old,indent=2)+'\n')
 for profile in ['desktop','mobile']:render(profile)
 for name,size,fps in FILMS[1:3]:transcode(name,size,fps)
 records=[validate(*f) for f in FILMS]
 for record in records:
  oldname=Path(record['path']).name;newname=oldname.replace('elegant-campaign',PREFIX).replace('director-campaign-mobile',PREFIX+'-mobile');record['path']='public/films/'+newname;shutil.copy2(OUT/oldname,ROOT/record['path'])
 stills=[]
 for movie,name in [('elegant-campaign.mp4','elegant-campaign.jpg'),('director-campaign-mobile.mp4','director-campaign-mobile.jpg')]:
  name=name.replace('elegant-campaign',PREFIX).replace('director-campaign-mobile',PREFIX+'-mobile');p=ROOT/'public/images'/name;run(['ffmpeg','-nostdin','-v','error','-y','-i',str(OUT/movie),'-frames:v','1','-q:v','2',str(p)]);stills.append(p)
 p=ROOT/'public/images'/(PREFIX+'.jpg');im=Image.open(p);webp=p.with_suffix('.webp');im.save(webp,quality=87,method=6);stills.append(webp)
 source=OUT/'thumb.png';run(['ffmpeg','-nostdin','-v','error','-y','-ss','8.5','-i',str(OUT/'elegant-campaign.mp4'),'-frames:v','1',str(source)]);thumb=ROOT/'public/images'/(PREFIX+'-thumb.webp');Image.open(source).resize((320,180),Image.Resampling.LANCZOS).save(thumb,quality=87,method=6);stills.append(thumb)
 receipt={'source':'Original SHIFT Cycles photographs, native 2048px poster artwork, calibrated perspective scene. No new product generation.','recipe':'python3 scripts/campaign-polish-20261110/deliver.py','master':'outputs/campaign-web-revision-20261110/campaign/campaign-staging.blend','nativeScene':'outputs/campaign-web-revision-20261110/campaign/scene.json','seconds':10,'loopAuthoredFirstLastEqual':True,'edgeRgb':m.EDGE,'backRgb':m.BACK,'before':old,'films':records,'stills':[{'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':digest(p)} for p in stills]}
 receipt['masters']=[{'path':str(p.relative_to(ROOT)),'sha256':digest(p)} for p in [OUT/'campaign-staging.blend',OUT/'campaign-staging-mobile.blend',OUT/'scene.json'] if p.exists()]
 receipt['sources']=[{'path':str(p.relative_to(ROOT)),'sha256':digest(p)} for p in [ROOT/'outputs/flagship-20261106/shift'/('phase-'+name+'.png') for name in ['hero','overhead','detail']]]
 (OUT/'delivery.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt,indent=2),flush=True)
if __name__=='__main__':main()
