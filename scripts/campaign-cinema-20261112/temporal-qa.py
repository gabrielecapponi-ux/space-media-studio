"""Inspect all decoded frames and compare the loop seam with adjacent frame motion."""
import subprocess,json,statistics
from pathlib import Path
P=Path(__file__).resolve().parents[2];O=P/'outputs/campaign-cinema-20261112';results=[]
for name,fps in [('desktop',60),('hd',60),('compact',30),('portrait',30)]:
 file=P/'public/films'/f'campaign-cinema-20261112-{name}.mp4'
 raw=subprocess.check_output(['ffmpeg','-v','error','-threads','2','-i',str(file),'-vf','scale=160:90:flags=area','-pix_fmt','rgb24','-f','rawvideo','-'])
 size=160*90*3;assert len(raw)==size*fps*8
 frames=[memoryview(raw)[i:i+size]for i in range(0,len(raw),size)]
 def mad(x,y):return sum(abs(a-b)for a,b in zip(x,y))/size
 adjacent=[mad(frames[i],frames[i+1])for i in range(len(frames)-1)];seam=mad(frames[-1],frames[0]);edge=statistics.mean(adjacent[:3]+adjacent[-3:]);ratio=seam/edge
 assert min(adjacent)>0,'Repeated or frozen frames';assert ratio<1.8,('Unexpected loop seam',name,ratio)
 results.append({'profile':name,'decoded_frames':len(frames),'loop_mean_absolute_rgb_delta':seam,'nearby_mean_delta':edge,'loop_vs_nearby_ratio':ratio,'adjacent_delta_min':min(adjacent),'adjacent_delta_max':max(adjacent),'adjacent_delta_median':statistics.median(adjacent),'loop':'pass','freeze':'pass','method':'All frames decoded at160×90; absolute channel-value difference; seam compared with first/last3 frame intervals. This checks continuity, not real-device playback performance.'})
(O/'temporal-validation.json').write_text(json.dumps(results,indent=2));print(json.dumps(results,indent=2))
