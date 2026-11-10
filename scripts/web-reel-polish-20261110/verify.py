"""Build the delivery/provenance receipt from verified encodes and exact sources."""
from pathlib import Path
from PIL import Image, ImageChops, ImageStat
from io import BytesIO
import subprocess,json,hashlib
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'outputs/campaign-web-revision-20261110/web'
def receipt(path):
 data=path.read_bytes();return {'file':str(path.relative_to(ROOT)),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
rows=[]
for suffix in ['', '-hd', '-compact', '-mobile']:
 record=json.loads((OUT/f'cinematic-web-20261110{suffix}.json').read_text());path=ROOT/record['file'];actual=receipt(path);assert actual['sha256']==record['sha256'];assert record['decoded'] and record['duplicateAdjacent']==0
 pts=sorted(float(x) for x in subprocess.check_output(['ffprobe','-v','error','-select_streams','v:0','-show_entries','frame=pts_time','-of','csv=p=0',str(path)],text=True).replace(',','').split() if x)
 deltas=[b-a for a,b in zip(pts,pts[1:])];error=max(abs(x-1/record['fps']) for x in deltas);assert error<.000002
 record['maxTimestampCadenceErrorSeconds']=error;rows.append(record)
posters=[]
for suffix in ['', '-mobile']:
 video=ROOT/f'public/films/cinematic-web-20261110{suffix}.mp4';poster=ROOT/f'public/images/cinematic-web-20261110{suffix}.webp'
 frame=Image.open(BytesIO(subprocess.check_output(['ffmpeg','-v','error','-i',str(video),'-frames:v','1','-f','image2pipe','-vcodec','png','-']))).convert('RGB');still=Image.open(poster).convert('RGB');assert frame.size==still.size
 delta=sum(ImageStat.Stat(ImageChops.difference(frame,still)).mean)/3;assert delta<6
 posters.append({**receipt(poster),'firstFrameMeanAbsoluteRGBDifference':delta})
posters.append(receipt(ROOT/'public/images/cinematic-web-20261110-thumb.webp'))
base=json.loads((OUT/'before/assets.json').read_text());preserved={row['path']:hashlib.sha256((ROOT/row['path']).read_bytes()).hexdigest()==row['sha256'] for row in base};assert all(preserved.values())
capture=json.loads((OUT/'captures/manifest.json').read_text())
for item in capture['records']:assert receipt(ROOT/item['file'])['sha256']==item['sha256']
for item in capture['code']:assert receipt(ROOT/item['file'])['sha256']==item['sha256'],f"Demo changed after production capture: {item['file']}"
sources=[ROOT/'scripts/web-reel-polish-20261110'/s for s in ['capture.cjs','render.py','verify.py','README.md']]+[ROOT/'scripts/director-shift'/s for s in ['render.py','plates.py']]+[ROOT/'outputs/flagship-20261106/shift/phase-hero.png',ROOT/'outputs/director-20261106/shift/jog-negative-3200-crop.png']
report={'description':'Five real Space Media demo destinations, 2x-density HTML captures with a perspective graphite camera rail and original Blender/Cycles SHIFT macro. No new mesh claim.','nativeMaster':[2560,1440,60],'seconds':10,'chapters':['SHIFT PHASE 01','CACAO ATELIER','LUMA','BASILICO','OLTRE'],'routeKeys':['shift','vela','nude','basilico','oltre'],'chapterSwitchSeconds':[1.7,3.7,5.7,7.7,9.7],'method':'Quintic camera motion, independent edge replication, dark physical hull, no white perimeter trim, true portrait poses, no generated temporal interpolation.','sources':[receipt(p) for p in sources],'capture':capture,'films':rows,'posters':posters,'previousAssetsPreserved':preserved,'publication':'Not attested by this asset report; integration and online checks belong to root.'}
(OUT/'delivery.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'films':len(rows),'posters':len(posters),'previousAssetsPreserved':all(preserved.values()),'bytes':sum(x['bytes'] for x in rows)},indent=2))
