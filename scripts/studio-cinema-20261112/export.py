"""Blackbox delivery exports: native QHD60 and 1080x1920/30; HD derived, no interpolation."""
from pathlib import Path
import subprocess,json,hashlib,argparse
p=argparse.ArgumentParser();p.add_argument('--verify-only',action='store_true');a=p.parse_args()
P=Path(__file__).resolve().parents[2];O=P/'outputs/studio-cinema-20261112';F=P/'public/films';I=P/'public/images';prefix='studio-cinema-20261112'
def run(cmd):subprocess.run(cmd,check=True)
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
if not a.verify_only:
 run(['ffmpeg','-v','error','-y','-i',str(F/f'{prefix}-desktop.mp4'),'-vf','scale=1920:1080:flags=lanczos,format=yuv420p','-c:v','libx264','-threads','3','-preset','slow','-crf','18','-profile:v','high','-level:v','4.2','-g','60','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-movflags','+faststart','-an',str(F/f'{prefix}-hd.mp4')])
 for profile in ['desktop','portrait']:run(['cwebp','-quiet','-q','88','-m','6',str(O/f'review-{profile}/0001.png'),'-o',str(I/f'{prefix}-{profile}.webp')])
assets=[]
for profile,w,h,fps,frames in [('desktop',2560,1440,60,288),('hd',1920,1080,60,288),('portrait',1080,1920,30,144)]:
 f=F/f'{prefix}-{profile}.mp4';run(['ffmpeg','-v','error','-i',str(f),'-f','null','-']);probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(f)]));v=probe['streams'][0]
 assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(w,h,f'{fps}/1',frames)
 hashes=subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-f','framemd5','-'],text=True);(O/f'frames-{profile}.md5').write_text(hashes);values=[x.rsplit(',',1)[-1].strip()for x in hashes.splitlines()if x and not x.startswith('#')]
 assert len(set(values))==len(values)==frames,'Duplicated frames';data=f.read_bytes();assert data.find(b'moov')<data.find(b'mdat')
 assets.append({'file':str(f.relative_to(P)),'sha256':sha(f),'bytes':f.stat().st_size,'resolution':[w,h],'fps':fps,'frames':frames,'unique_frames':len(set(values)),'seconds':4.8,'native_render':profile!='hd','interpolation':False,'upscaled':False,'faststart':True,'decode':'pass','probe':probe})
for profile in ['desktop','portrait']:
 f=I/f'{prefix}-{profile}.webp';assets.append({'file':str(f.relative_to(P)),'sha256':sha(f),'bytes':f.stat().st_size,'origin':f'outputs/{prefix}/review-{profile}/0001.png'})
f=P/'public/models/studio-blackbox-20261112.glb';assets.append({'file':str(f.relative_to(P)),'sha256':sha(f),'bytes':f.stat().st_size,'role':'live fallback with named assembly groups and metadata'})
masters=[O/f'studio-cinema-{profile}.blend'for profile in ['desktop','portrait']];recipes=sorted((P/'scripts/studio-cinema-20261112').glob('*.py'));source=P/'outputs/studio-blender-20261105/space-studio-master.blend'
manifest={'title':'SPACE Blackbox — cinematic studio construction','date':'2026-11-12','source':{'file':str(source.relative_to(P)),'sha256':sha(source)},'origin':'Original Space architecture, emblem and production props. Native Blender Cycles; existing original water and LUMA artwork packed into monitors. No stock or AI film.','masters':[{'file':str(f.relative_to(P)),'sha256':sha(f),'bytes':f.stat().st_size}for f in masters],'recipes':[{'file':str(f.relative_to(P)),'sha256':sha(f)}for f in recipes],'geometry_validation':json.loads((O/'geometry-validation.json').read_text()),'assets':assets,'publication':'Local production; website release recorded separately.'}
(O/'asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');(P/'scripts/studio-cinema-20261112/asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps({'assets':[{k:v for k,v in x.items()if k!='probe'}for x in assets]},indent=2))
