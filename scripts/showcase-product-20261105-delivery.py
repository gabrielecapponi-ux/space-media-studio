"""Encode/check both native LUMA renders and record factual provenance."""
from pathlib import Path
from PIL import Image,ImageChops,ImageStat
import subprocess,json,hashlib,struct
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'outputs/showcase-product-20261105';FPS=48;N=288
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
mean=lambda im:sum(ImageStat.Stat(im).mean)/3
reports=[]
for profile,size in [('desktop',(1920,1080)),('mobile',(720,900))]:
 folder=OUT/profile;frames=sorted((folder/'frames').glob('*.png'));assert len(frames)==N,len(frames)
 first=prev=None;diffs=[];means=[];digest=hashlib.sha256()
 for p in frames:
  with Image.open(p)as raw:
   im=raw.convert('RGB');assert im.size==size;means.append(mean(im));digest.update(hashlib.sha256(p.read_bytes()).digest())
   if first is None:first=im.copy()
   if prev is not None:diffs.append(mean(ImageChops.difference(prev,im)))
   prev=im
 seam=mean(ImageChops.difference(prev,first));assert max(diffs)<7 and seam<2 and min(means)>35,(profile,max(diffs),seam,min(means))
 name='showcase-product'+('-mobile'if profile=='mobile'else'');film=ROOT/'public/films'/f'{name}.mp4';poster=ROOT/'public/images'/f'{name}.jpg'
 subprocess.run(['ffmpeg','-v','error','-y','-framerate',str(FPS),'-i',str(folder/'frames/%04d.png'),'-frames:v',str(N),'-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-threads','4','-preset','slow','-crf','18','-profile:v','high','-level','4.2'if profile=='desktop'else'4.1','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-g','96','-movflags','+faststart','-an',str(film)],check=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(folder/'frames/0145.png'),'-frames:v','1','-q:v','2',str(poster)],check=True)
 subprocess.run(['ffmpeg','-v','error','-i',str(film),'-f','null','-'],check=True)
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(film)],text=True));v=probe['streams'][0];assert(v['width'],v['height'])==size and v['r_frame_rate']=='48/1' and int(v['nb_frames'])==N and float(probe['format']['duration'])==6
 check=folder/'decoded';check.mkdir(exist_ok=True);subprocess.run(['ffmpeg','-v','error','-y','-i',str(film),'-vf',r'select=eq(n\,0)+eq(n\,144)+eq(n\,287)','-fps_mode','vfr',str(check/'%02d.png')],check=True)
 proof_samples=[]
 for f in[1,145,288]:
  aa=Image.open(folder/'native-proof'/f'{f:04}.png').convert('RGB');bb=Image.open(folder/'frames'/f'{f:04}.png').convert('RGB');assert aa.size==size and bb.size==size;mae=mean(ImageChops.difference(aa,bb));assert mae<2;proof_samples.append({'frame':f,'proof_vs_batch_mae':mae})
 samples=[]
 for i,f in enumerate([1,145,288],1):
  aa=Image.open(folder/'frames'/f'{f:04}.png').convert('RGB');bb=Image.open(check/f'{i:02}.png').convert('RGB');assert aa.size==bb.size;mae=mean(ImageChops.difference(aa,bb));assert mae<4; samples.append({'native_frame':f,'encoded_mae':mae})
 data=film.read_bytes();pos=0;atoms={}
 while pos+8<=len(data):
  n,t=struct.unpack('>I4s',data[pos:pos+8]);atoms[t.decode(errors='replace')]=pos
  if n==1:n=struct.unpack('>Q',data[pos+8:pos+16])[0]
  if n<8:break
  pos+=n
 assert atoms['moov']<atoms['mdat']
 # Reopen the authored master, without requiring a user's Blender GUI.
 master=folder/'showcase-product.blend';roundtrip=folder/'reimport.json'
 expression="import bpy,json;from pathlib import Path;s=bpy.context.scene;assert s.render.fps==48 and len(s.objects)>300;Path("+repr(str(roundtrip))+").write_text(json.dumps({'objects':len(s.objects),'fps':s.render.fps,'dimensions':[s.render.resolution_x,s.render.resolution_y],'passed':True}))"
 subprocess.run(['/Applications/Blender.app/Contents/MacOS/Blender','--background',str(master),'--python-expr',expression],stdout=subprocess.DEVNULL,check=True)
 report={'profile':profile,'native':size,'fps':FPS,'frames':N,'duration':6,'engine':'Blender EEVEE','samples':48,'upscaled':False,'optical_interpolation':False,'silent':True,'faststart':True,'all_frames_decoded':True,'native_sequence_sha256':digest.hexdigest(),'native_max_adjacent_rgb_difference':max(diffs),'native_seam_rgb_difference':seam,'native_proof_samples':proof_samples,'encoded_samples':samples,'scene_check':json.loads((folder/'scene-check.json').read_text()),'reimport':json.loads(roundtrip.read_text()),'master':{'path':str(master.relative_to(ROOT)),'sha256':sha(master)},'assets':[{'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':sha(p)}for p in[film,poster]]}
 (folder/'validation.json').write_text(json.dumps(report,indent=2)+'\n');reports.append(report);print(json.dumps({'profile':profile,'passed':True,'assets':report['assets']}),flush=True)
manifest={'title':'LUMA / Original design-camera CGI concept','created':'2026-11-05','status':'active original non-commissioned concept','provenance':'Original authored Blender geometry, procedural materials and native piecewise minimum-jerk optical-axis assembly. No downloaded models, no external textures, no AI generation. Original fictional brand; no manufacturer/client claim.','motion':'Three nonintersecting hollow lens groups separate along the optical axis, hold, then return; grounded camera body, camera arc and travelling reflection. No speed change, reverse footage, optical interpolation or resolution upscale.','rights':'Original project geometry/materials. System Arial rasterized lettering only; no font binaries redistributed.','sources':[{'path':str(p.relative_to(ROOT)),'sha256':sha(p)}for p in[ROOT/'scripts/showcase-product-20261105.py',ROOT/'scripts/showcase-product-20261105-runner.py',Path(__file__)]],'delivery':reports,'limitations':['CGI product design study, not a manufactured camera.','H.264 native48fps, not4K60.','No physical-iPhone or Safari device test is implied by asset validation.']}
(ROOT/'ASSET-SHOWCASE-PRODUCT-20261105.json').write_text(json.dumps(manifest,indent=2)+'\n')
