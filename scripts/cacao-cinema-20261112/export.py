"""Downscale approved native masters; export posters; verify codecs, unique frames and SHA provenance."""
from pathlib import Path
import subprocess,json,hashlib,argparse
parser=argparse.ArgumentParser();parser.add_argument('--verify-only',action='store_true');args=parser.parse_args()
P=Path(__file__).resolve().parents[2];O=P/'outputs/cacao-cinema-20261112';F=P/'public/films';I=P/'public/images';prefix='cacao-cinema-20261112'
def run(cmd):subprocess.run(cmd,check=True)
def digest(p):return hashlib.sha256(p.read_bytes()).hexdigest()
if not args.verify_only:
 for suffix,w,h,fps,crf in [('hd',1920,1080,60,18),('compact',1280,720,30,18)]:
  source=F/f'{prefix}-desktop.mp4';out=F/f'{prefix}-{suffix}.mp4'
  run(['ffmpeg','-v','error','-y','-i',str(source),'-vf',f'scale={w}:{h}:flags=lanczos,fps={fps},format=yuv420p','-c:v','libx264','-threads','3','-preset','slow','-crf',str(crf),'-profile:v','high','-level:v','4.2'if fps==60 else '4.0','-g',str(fps*2),'-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-movflags','+faststart','-an',str(out)])
 for profile in ['desktop','portrait']:
  run(['cwebp','-quiet','-q','88','-m','6',str(O/f'review-{profile}'/'0001.png'),'-o',str(I/f'{prefix}-{profile}.webp')])
 run(['cwebp','-quiet','-q','86','-m','6','-resize','320','180',str(O/'review-desktop'/'0241.png'),'-o',str(I/f'{prefix}-thumb.webp')])
assets=[]
for suffix,w,h,fps in [('desktop',2560,1440,60),('hd',1920,1080,60),('compact',1280,720,30),('portrait',1080,1350,30)]:
 file=F/f'{prefix}-{suffix}.mp4';run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'])
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(file)]));v=probe['streams'][0]
 assert(v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(w,h,f'{fps}/1',fps*8),probe
 hashes=subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-f','framemd5','-'],text=True)
 (O/f'frames-{suffix}.md5').write_text(hashes)
 values=[line.rsplit(',',1)[-1].strip()for line in hashes.splitlines()if line and not line.startswith('#')]
 assert len(values)==fps*8 and len(set(values))==len(values),'Duplicate rendered frames'
 data=file.read_bytes();assert data.find(b'moov')<data.find(b'mdat'),'Missing progressive faststart'
 assets.append({'file':str(file.relative_to(P)),'sha256':digest(file),'bytes':file.stat().st_size,'resolution':[w,h],'fps':fps,'frames':len(values),'unique_frames':len(set(values)),'seconds':8,'codec':v['codec_name'],'profile':v['profile'],'level':v['level'],'decode':'pass','faststart':True,'native_render':suffix in ['desktop','portrait'],'derived_from':None if suffix in ['desktop','portrait']else f'public/films/{prefix}-desktop.mp4','interpolation':False,'upscaled':False,'probe':probe})
for profile in ['desktop','portrait']:
 file=I/f'{prefix}-{profile}.webp';assets.append({'file':str(file.relative_to(P)),'sha256':digest(file),'bytes':file.stat().st_size,'origin':f'outputs/cacao-cinema-20261112/review-{profile}/0001.png'})
file=I/f'{prefix}-thumb.webp';assets.append({'file':str(file.relative_to(P)),'sha256':digest(file),'bytes':file.stat().st_size,'resolution':[320,180],'origin':'outputs/cacao-cinema-20261112/review-desktop/0241.png'})
masterfiles=[O/f'cacao-cinema-{p}.blend'for p in ['desktop','portrait']]
recipefiles=sorted((P/'scripts/cacao-cinema-20261112').glob('*.py'))
source=P/'outputs/flagship-20261106/brand/desktop/brand-macro-desktop.blend'
master_validation=json.loads((O/'geometry-validation.json').read_text())
font_dependencies=list({(d['name'],d.get('packed_sha256')):d for v in master_validation for d in v['dependencies'] if d['type']=='font'}.values())
manifest={'encoders':{'ffmpeg':subprocess.check_output(['ffmpeg','-version'],text=True).splitlines()[0],'cwebp':subprocess.check_output(['cwebp','-version'],text=True).strip()},'title':'CACAO Cinema','font_dependencies':font_dependencies,'validation_report':'outputs/cacao-cinema-20261112/geometry-validation.json','date':'2026-11-12','origin':'Original Space Media CACAO geometry, procedural chocolate/paper/foil materials and native Cycles motion; no external imagery or AI video','source':{'file':str(source.relative_to(P)),'sha256':digest(source)},'master':[{'file':str(f.relative_to(P)),'sha256':digest(f),'bytes':f.stat().st_size}for f in masterfiles],'recipes':[{'file':str(f.relative_to(P)),'sha256':digest(f)}for f in recipefiles],'mechanisms':['physical rear lid hinge','six independent chocolate tablets','whole package turn','macro camera dolly','travelling studio light'],'assets':assets,'publication':'Not published by asset subtask; integration and website manifest are separate responsibilities'}
(O/'asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(P/'scripts/cacao-cinema-20261112/asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'assets':[{k:v for k,v in a.items()if k!='probe'}for a in assets]},indent=2))
