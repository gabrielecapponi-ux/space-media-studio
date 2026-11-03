"""Verify actual campaign output and write a reproducible production manifest."""
from pathlib import Path
import hashlib,json,subprocess,struct
from PIL import Image,ImageChops,ImageStat

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'outputs/cinema-campaign'
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def probe(path):
 data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
 data['format']['filename']=str(path.relative_to(ROOT))
 return data
def faststart(path):
 atoms=[]
 with path.open('rb') as f:
  while True:
   head=f.read(8)
   if len(head)<8:break
   n,kind=struct.unpack('>I4s',head)
   if n==1:n=struct.unpack('>Q',f.read(8))[0];skip=16
   else:skip=8
   atoms.append(kind.decode('ascii',errors='replace'))
   if n<skip:break
   f.seek(n-skip,1)
 return {'atoms':atoms,'moov_before_mdat':atoms.index('moov')<atoms.index('mdat')}
manifest={
 'schema_version':1,'id':'cinema-campaign-20261103','project':'Space Media Studio',
 'concept':'SHIFT / One campaign in three formats',
 'commercial_status':'Original fictional campaign concept. Not a registered brand, actual client, paid commission, or commercial result. No registered-trademark symbol is used.',
 'runtime':{'capture':'PlaywrightCLI0.1.23, isolated ephemeral Chromium session, local file URL, native viewport screenshots','encoding':subprocess.check_output(['ffmpeg','-version'],text=True).splitlines()[0],'reproduce':['node scripts/cinema-campaign-render.mjs --mode=prepare','node scripts/cinema-campaign-render.mjs --mode=open','node scripts/cinema-campaign-render.mjs --mode=frames --motion','node scripts/cinema-campaign-render.mjs --mode=encode','python3 scripts/cinema-campaign-verify.py','node scripts/cinema-campaign-render.mjs --mode=close']},
 'method':'Original HTML typography and campaign artwork on CSS3D perspective planes, native deterministic Chromium captures, then H.264 encoding. These are composited screen planes, not live product meshes or Blender geometry.',
 'timeline':{'fps':30,'frames':180,'duration_seconds':6,'pose':'Absolute periodic trigonometric placement, scale and perspective; frame180 equals frame0. No wall-clock autoplay capture.','motion_source':'Paused Higgsfield video, absolute seek f/30 with seeked and two compositor frame gates. Closing18frames dissolve to the first source frame; no reverse playback or synthetic frame interpolation.'},
 'sources':[],'assets':[],'checks':{},
 'fonts':'Project-local Space Grotesk variable WOFF2 rendered to movie pixels; no extra font binaries added.',
 'display_profiles':'Separate native desktop1920x1080 and portrait720x900 compositions. No final resolution upscale. Existing1536x1024 original AI raster sneaker is resampled into smaller perspective graphic planes.',
 'audio':False,'synthetic_frame_interpolation':False,'reverse_playback':False,
 'source_plugin_job_id':'81af6305-30fb-4ff1-88dc-7e1b26635568',
}
for file in ['scripts/cinema-campaign-stage.html','scripts/cinema-campaign-render.mjs','scripts/cinema-campaign-verify.py','public/images/reel-sneaker.jpg','public/fonts/SpaceGrotesk-Variable.woff2']:
 p=ROOT/file;manifest['sources'].append({'path':file,'bytes':p.stat().st_size,'sha256':sha(p)})
source=OUT/'source/higgsfield-shift.mp4'
if source.exists():
 manifest['higgsfield_source']={'local_master':str(source.relative_to(ROOT)),'bytes':source.stat().st_size,'sha256':sha(source),'probe':probe(source),'generation_model':'Seedance2.5 via Higgsfield','input_raster':'public/images/reel-sneaker.jpg','native_fps':24,'composition_sampling':'Native24fps source is sampled/held at30fps composition times; no optical-flow or invented motion frames','quoted_credits':128,'prepared_h264':{'path':'outputs/cinema-campaign/source/motion-source.mp4','sha256':sha(OUT/'source/motion-source.mp4'),'probe':probe(OUT/'source/motion-source.mp4')},'first_frame':{'path':'outputs/cinema-campaign/source/higgsfield-shift-first.jpg','sha256':sha(OUT/'source/higgsfield-shift-first.jpg')}}
else:raise RuntimeError('Higgsfield source missing; do not claim integrated motion')
checks={}
for variant,expected in [('desktop',(1920,1080)),('mobile',(720,900))]:
 name='cinema-campaign'+('-mobile' if variant=='mobile' else '')
 film=ROOT/'public/films'/f'{name}.mp4';poster=ROOT/'public/images'/f'{name}.jpg';frames=OUT/'frames'/variant
 data=probe(film);stream=next(s for s in data['streams'] if s['codec_type']=='video')
 assert (stream['width'],stream['height'])==expected
 assert stream['avg_frame_rate']=='30/1' and stream['nb_frames']=='180'
 assert float(data['format']['duration'])==6.0
 assert stream['codec_name']=='h264' and stream['pix_fmt']=='yuv420p'
 assert not any(s['codec_type']=='audio' for s in data['streams'])
 atoms=faststart(film);assert atoms['moov_before_mdat']
 subprocess.run(['ffmpeg','-v','error','-i',str(film),'-f','null','-'],check=True)
 sequence=hashlib.sha256();means=[]
 for f in range(180):
  path=frames/f'{f:04d}.jpg';sequence.update(path.read_bytes())
  with Image.open(path) as image:
   assert image.size==expected
   means.append(sum(ImageStat.Stat(image.convert('RGB')).mean)/3)
 assert min(means)>12,('Possible black frame',variant,min(means))
 native_first=Image.open(frames/'0000.jpg').convert('RGB');native_last=Image.open(frames/'0179.jpg').convert('RGB')
 diff=ImageStat.Stat(ImageChops.difference(native_first,native_last)).mean
 probes=[]
 for f in [0,55,90,179]:
  decoded=OUT/f'{variant}-encoded-{f:04d}.png'
  subprocess.run(['ffmpeg','-v','error','-i',str(film),'-vf',f'select=eq(n\\,{f})','-frames:v','1','-y',str(decoded)],check=True)
  a=Image.open(frames/f'{f:04d}.jpg').convert('RGB');b=Image.open(decoded).convert('RGB')
  mae=ImageStat.Stat(ImageChops.difference(a,b)).mean
  assert max(mae)<5,(variant,f,mae)
  probes.append({'frame':f,'encoded_vs_native_mean_abs_rgb':mae})
 for path,role in [(film,'Original campaign composition with integrated Higgsfield product film'),(poster,'Native authored frame55 poster')]:
  manifest['assets'].append({'path':str(path.relative_to(ROOT)),'role':role,'variant':variant,'bytes':path.stat().st_size,'sha256':sha(path),'native_dimensions':list(expected)})
 checks[variant]={'full_decode':'passed','native_frames':180,'native_frame_sequence_sha256':sequence.hexdigest(),'all_native_frame_mean_rgb_range':[min(means),max(means)],'loop_first_vs_last_mean_abs_rgb':diff,'encoded_sample_checks':probes,'container':atoms,'probe':data}
manifest['checks']=checks
(ROOT/'ASSET-CINEMA-CAMPAIGN.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'manifest':'ASSET-CINEMA-CAMPAIGN.json','profiles':{k:{'frames':v['native_frames'],'mean_rgb_range':v['all_native_frame_mean_rgb_range'],'loop_mae':v['loop_first_vs_last_mean_abs_rgb']} for k,v in checks.items()}},indent=2))
