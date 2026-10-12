"""Export genuine native 4K60 Blender frames; preserve original chronology and validate every encode."""
import argparse, hashlib, json, shutil, subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--scene',required=True,choices=['identity','web','cgi','campaigns']);p.add_argument('--clean',action='store_true');p.add_argument('--mobile-only',action='store_true',help='Re-export the mobile rendition from the verified existing native master.');a=p.parse_args()
OUT=ROOT/'outputs/four-services'/a.scene
MASTER=OUT/f'four-{a.scene}-4k60-master.mp4'
MOBILE_FILTER='scale=1920:1080:flags=lanczos,setsar=1'
MOBILE_LAYOUT='Full uncropped Full HD 1920x1080 rendition at 60fps; CRF24, 6M maximum rate, 12M buffer, no padding or subject cropping.'
colors=['-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-color_range','tv']

def sha(path):
 h=hashlib.sha256()
 with path.open('rb') as f:
  for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
 return h.hexdigest()

def run(args):subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*args],check=True)

def validate(path,dimensions):
 data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name,codec_type,width,height,pix_fmt,r_frame_rate,avg_frame_rate,nb_frames,color_range,color_space,color_transfer,color_primaries:format=duration','-of','json',str(path)]))
 v=next(x for x in data['streams'] if x['codec_type']=='video')
 assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p'
 assert [v['width'],v['height']]==list(dimensions)
 assert v['r_frame_rate']==v['avg_frame_rate']=='60/1' and int(v['nb_frames'])==120
 assert abs(float(data['format']['duration'])-2)<.001
 assert len(data['streams'])==1
 bits=path.read_bytes();assert 0<bits.find(b'moov')<bits.find(b'mdat')
 subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'],check=True)
 return {'file':str(path.relative_to(ROOT)),'bytes':path.stat().st_size,'sha256':sha(path),'probe':data,'full_decode':'passed','faststart':True}

if a.mobile_only:
 manifest_path=ROOT/'ASSET-FOUR-SERVICES.json'
 manifest=json.loads(manifest_path.read_text());item=manifest['services'][a.scene]
 assert sha(MASTER)==item['master']['sha256'],'Existing native master differs from the verified manifest'
 target=ROOT/f'public/films/four-{a.scene}-mobile.mp4'
 run(['-i',str(MASTER),'-vf',MOBILE_FILTER,'-an','-c:v','libx264','-preset','slow','-crf','24','-maxrate','6M','-bufsize','12M','-threads','1','-pix_fmt','yuv420p','-profile:v','high','-level:v','4.2','-g','60','-keyint_min','60','-sc_threshold','0',*colors,'-movflags','+faststart',str(target)])
 item['web']['mobile']=validate(target,(1920,1080))
 poster=ROOT/f'public/images/four-{a.scene}-mobile.jpg'
 run(['-i',str(target),'-vf','select=eq(n\\,0)','-frames:v','1','-q:v','2',str(poster)])
 item['posters']['mobile']={'file':str(poster.relative_to(ROOT)),'frame':1,'dimensions':[1920,1080],'bytes':poster.stat().st_size,'sha256':sha(poster)}
 item['mobile_layout']=MOBILE_LAYOUT
 item['mobile_export_script_sha256']=sha(ROOT/'scripts/export-four-services.py')
 manifest['reproduction_scripts']={'scripts/render-four-services.py':sha(ROOT/'scripts/render-four-services.py'),'scripts/export-four-services.py':sha(ROOT/'scripts/export-four-services.py')}
 manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
 print(json.dumps({'scene':a.scene,'mobile_bytes':item['web']['mobile']['bytes'],'dimensions':[1920,1080],'fps':60,'full_decode':'passed'},indent=2))
 raise SystemExit(0)

render=json.loads((OUT/'render-manifest.json').read_text())
assert render['resolution']==[3840,2160] and render['fps']==60 and not render['preview'] and not render['benchmark']
assert render['frames']==120 and render['native_render'] and not render['interpolation_or_upscale']
assert render['loop_error']<1e-7
frames=sorted((OUT/'frames').glob('frame_*.png'));assert len(frames)==120
assert frames[0].name=='frame_0001.png' and frames[-1].name=='frame_0120.png'
frame_hashes={f.name:sha(f) for f in frames};assert len(set(frame_hashes.values()))==120,'Frames must be independently rendered, not duplicated'
# The PNG IHDR includes width/height in fixed big-endian fields; validate every native raster.
for f in frames:
 head=f.open('rb').read(24)
 assert head[:8]==b'\x89PNG\r\n\x1a\n'
 assert [int.from_bytes(head[16:20],'big'),int.from_bytes(head[20:24],'big')]==[3840,2160]
run(['-framerate','60','-start_number','1','-i',str(OUT/'frames/frame_%04d.png'),'-frames:v','120','-an','-c:v','libx264','-preset','medium','-crf','14','-threads','4','-vf','scale=out_color_matrix=bt709:out_range=tv','-pix_fmt','yuv420p','-profile:v','high','-level:v','5.2',*colors,'-movflags','+faststart',str(MASTER)])
master=validate(MASTER,(3840,2160))
exports={};posters={}
for variant,dimensions in [('desktop',(1920,1080)),('mobile',(1920,1080)),('4k',(3840,2160))]:
 target=ROOT/f'public/films/four-{a.scene}-{variant}.mp4';target.parent.mkdir(exist_ok=True)
 bg='0xf2f0eb' if a.scene in ['identity','cgi'] else '0x0a0c10'
 filt='scale=1920:1080:flags=lanczos' if variant=='desktop' else ('null' if variant=='4k' else MOBILE_FILTER.format(background=bg))
 run(['-i',str(MASTER),'-vf',filt,'-an','-c:v','libx264','-preset','slow','-crf','19' if variant=='desktop' else ('20' if variant=='4k' else '24'),*(['-maxrate','6M','-bufsize','12M'] if variant=='mobile' else []),'-threads','1' if variant=='mobile' else '4','-pix_fmt','yuv420p','-profile:v','high','-level:v','5.2' if variant=='4k' else '4.2','-g','60','-keyint_min','60','-sc_threshold','0',*colors,'-movflags','+faststart',str(target)])
 exports[variant]=validate(target,dimensions)
 if variant=='4k':continue
 poster=ROOT/f'public/images/four-{a.scene}-{variant}.jpg';poster.parent.mkdir(exist_ok=True)
 run(['-i',str(target),'-vf','select=eq(n\\,0)','-frames:v','1','-q:v','2',str(poster)])
 posters[variant]={'file':str(poster.relative_to(ROOT)),'frame':1,'dimensions':dimensions,'bytes':poster.stat().st_size,'sha256':sha(poster)}
manifest_path=ROOT/'ASSET-FOUR-SERVICES.json'
manifest=json.loads(manifest_path.read_text()) if manifest_path.exists() else {'title':'Space / Four service films','status':'in progress','tools':['Local Blender 5.2.1','Local FFmpeg'],'provenance':'Original authored geometry, typography, PBR materials, studio lights and periodic camera / product animation. System Arial fonts rasterized into rendered frames; no font file distributed with public media.','external_stock':False,'ai_generation':False,'model_weights_downloaded':False,'paid_apis':False,'higgsfield':False,'frame_interpolation':False,'upscale':False,'services':{}}
manifest['services'][a.scene]={'render':render,'render_script_sha256_at_export':sha(ROOT/'scripts/render-four-services.py'),'export_script_sha256_at_export':sha(ROOT/'scripts/export-four-services.py'),'blend':{'file':str((OUT/f'{a.scene}.blend').relative_to(ROOT)),'sha256':sha(OUT/f'{a.scene}.blend')},'native_source_frame_hashes':frame_hashes,'native_source_frame_count':120,'all_source_rasters_verified_3840x2160':True,'all_source_frames_unique':True,'master':master,'web':exports,'posters':posters,'mobile_layout':MOBILE_LAYOUT,'loop':'2-second periodic authored motion. Frames1–120 at60fps exported in chronological order; pose121 equals pose1.','validation':'Every video fully decoded; dimensions, average/nominal FPS, frame count, duration, pixel format, no audio and faststart checked.'}
manifest['reproduction_scripts']={'scripts/render-four-services.py':sha(ROOT/'scripts/render-four-services.py'),'scripts/export-four-services.py':sha(ROOT/'scripts/export-four-services.py')}
for item in manifest['services'].values():
 for key in ['render_script_sha256','export_script_sha256']:
  if key in item:item[key+'_at_export']=item.pop(key)
manifest['status']='complete' if len(manifest['services'])==4 else 'in progress'
manifest['ffmpeg']=subprocess.check_output(['ffmpeg','-version'],text=True).splitlines()[0]
manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
if a.clean:
 shutil.rmtree(OUT/'frames')
 manifest['services'][a.scene]['source_rasters_retained']=False
 manifest['services'][a.scene]['source_raster_cleanup']='Deleted only this production’s intermediate PNG frames after master and all three public renditions passed full decode and hash verification. Blend, master, previews and per-frame hashes retained.'
 manifest_path.write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'scene':a.scene,'master_bytes':master['bytes'],'exports':{k:v['bytes'] for k,v in exports.items()},'status':manifest['status']},indent=2))
