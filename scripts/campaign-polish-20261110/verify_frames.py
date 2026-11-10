"""Inspect encoded moving poses, then verify that historical deliveries are intact."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,subprocess,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'outputs/campaign-web-revision-20261110/campaign';r=json.loads((OUT/'delivery.json').read_text())
for profile,movie in [('desktop','cinematic-campaign-20261110.mp4'),('mobile','cinematic-campaign-20261110-mobile.mp4')]:
 folder=OUT/'encoded'/profile;folder.mkdir(parents=True,exist_ok=True);cell=(320,204) if profile=='desktop' else (180,249);sheet=Image.new('RGB',(cell[0]*4,cell[1]*2),(18,22,20));draw=ImageDraw.Draw(sheet)
 for i,t in enumerate([0,.75,2,3.5,5.5,7,8.5,9.96]):
  target=folder/f'{t}.png';subprocess.run(['ffmpeg','-nostdin','-v','error','-y','-ss',str(t),'-i',str(ROOT/'public/films'/movie),'-frames:v','1',str(target)],check=True);assert target.exists();im=Image.open(target);im.thumbnail((cell[0],cell[1]-24));x=(i%4)*cell[0];y=(i//4)*cell[1];sheet.paste(im,(x,y));draw.text((x+5,y+cell[1]-20),f'{t:.2f} s',fill=(235,236,223))
 sheet.save(OUT/f'{profile}-encoded-proof.jpg',quality=93)
unchanged={x['path']:hashlib.sha256((ROOT/x['path']).read_bytes()).hexdigest()==x['sha256'] for x in r['before']};assert all(unchanged.values());(OUT/'legacy-preserved.json').write_text(json.dumps(unchanged,indent=2)+'\n')
print([(x['path'],x['dimensions'],x['fps'],x['bytes'],round(x['loopMean8bit'],4),x['adjacentDuplicateFrames']) for x in r['films']]);print('Legacy:',len(unchanged),'unchanged')
