"""Native-frame render streamed in resumable one-second H.264 chunks.
Only retain review frames, not duplicate PNG sequences. Publish file atomically.
"""
import bpy,argparse,sys,subprocess,time,json,hashlib,shutil
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--profile',choices=['desktop','portrait'],required=True);p.add_argument('--engine',default='CYCLES');p.add_argument('--samples',type=int,default=24);p.add_argument('--width',type=int,required=True);a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
P=Path(__file__).resolve().parents[2];O=P/'outputs/studio-cinema-20261112';master=O/f'studio-cinema-{a.profile}.blend';bpy.ops.wm.open_mainfile(filepath=str(master));s=bpy.context.scene
s.render.engine=a.engine;s.render.use_persistent_data=True
if a.engine=='BLENDER_EEVEE':s.eevee.taa_render_samples=a.samples
else:
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
 for d in prefs.devices:d.use=d.type=='METAL'
 s.cycles.device='GPU';s.cycles.samples=a.samples;s.cycles.seed=19
 if hasattr(s.cycles,'use_animated_seed'):s.cycles.use_animated_seed=False
s.render.resolution_x=a.width;s.render.resolution_y=round(a.width*9/16) if a.profile=='desktop' else round(a.width*16/9);s.render.resolution_percentage=100
W,H=s.render.resolution_x,s.render.resolution_y;fps=s.render.fps;frames=s.frame_end
initial_gib=3 if a.profile=='desktop' else 2
assert shutil.disk_usage(P).free>initial_gib*1024**3,f'Need{initial_gib}GiB free before native render'
out=P/'public/films'/f'studio-cinema-20261112-{a.profile}.mp4';out.parent.mkdir(exist_ok=True);staging=O/f'{a.profile}-incomplete.mp4'
temp=O/f'{a.profile}-render.png';review=O/f'review-{a.profile}';review.mkdir(exist_ok=True)
chunks=O/f'chunks-{a.profile}';chunks.mkdir(exist_ok=True)
sig={'master_sha256':hashlib.sha256(master.read_bytes()).hexdigest(),'width':W,'height':H,'fps':fps,'samples':a.samples,'engine':a.engine,'bounces':s.cycles.max_bounces,'transmission':s.cycles.transmission_bounces,'seed':19}
sigfile=chunks/'signature.json'
if sigfile.exists():assert json.loads(sigfile.read_text())==sig,'Different master/settings: do not silently mix production chunks'
else:sigfile.write_text(json.dumps(sig,indent=2))
times=[];start=time.monotonic()
report={'profile':a.profile,'master':str(master.relative_to(P)),'file':str(out.relative_to(P)),'resolution':[W,H],'fps':fps,'frames':frames,'native':True,'interpolated':False,'engine':a.engine,'samples':a.samples,'signature':sig,'timings':times,'encoding':'H264 High,CRF17,one-second resumable chunks'}
completed=[]
for chunk_index in range((frames+fps-1)//fps):
 first=chunk_index*fps+1;last=min(first+fps-1,frames);chunk=chunks/f'{chunk_index:02d}.mp4'
 if chunk.exists():
  probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-of','json',str(chunk)]));v=probe['streams'][0];assert int(v['nb_frames'])==last-first+1 and int(v['width'])==W and int(v['height'])==H;completed.append(chunk);print('CHUNK_RESUME',chunk_index,flush=True);continue
 pending=chunks/f'{chunk_index:02d}-incomplete.mp4'
 command=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',str(fps),'-vcodec','png','-i','pipe:0','-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-threads','3','-preset','slow','-crf','17','-profile:v','high','-level:v','5.1'if W>1920 else '4.2','-g',str(fps),'-keyint_min',str(fps),'-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-movflags','+faststart','-an',str(pending)]
 proc=subprocess.Popen(command,stdin=subprocess.PIPE)
 try:
  for f in range(first,last+1):
   if shutil.disk_usage(P).free<1024**3:raise RuntimeError('Production paused: less than1GiB available; completed chunks are resumable')
   s.frame_set(f);s.render.filepath=str(temp);tick=time.monotonic();bpy.ops.render.render(write_still=True);proc.stdin.write(temp.read_bytes())
   if (f-1)%(fps//2)==0 or f==frames:shutil.copy2(temp,review/f'{f:04d}.png')
   times.append(round(time.monotonic()-tick,3))
   if f%10==0:
    report['completed']=f;report['elapsed']=round(time.monotonic()-start,2);(O/f'progress-{a.profile}.json').write_text(json.dumps(report,indent=2));print('NATIVE_FRAME',a.profile,f,round(sum(times[-10:])/10,3),flush=True)
 finally:
  proc.stdin.close();code=proc.wait()
 assert code==0;pending.replace(chunk);completed.append(chunk);print('CHUNK_COMPLETE',chunk_index,flush=True)
concat=chunks/'concat.txt';concat.write_text(''.join("file '"+f.name+"'\n"for f in completed))
subprocess.run(['ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(concat),'-c','copy','-movflags','+faststart',str(staging)],check=True)
subprocess.run(['ffmpeg','-v','error','-i',str(staging),'-f','null','-'],check=True)
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(staging)]));v=probe['streams'][0]
assert (int(v['width']),int(v['height']),int(v['nb_frames']))==(W,H,frames)
staging.replace(out)
report['sha256']=hashlib.sha256(out.read_bytes()).hexdigest();report['bytes']=out.stat().st_size;report['seconds']=round(time.monotonic()-start,2);report['decode']='pass';report['probe']=probe
(O/f'production-{a.profile}.json').write_text(json.dumps(report,indent=2));temp.unlink(missing_ok=True);print('PRODUCTION_COMPLETE',str(out),flush=True)
