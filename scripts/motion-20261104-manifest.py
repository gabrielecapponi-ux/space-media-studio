"""Publish factual provenance only after both actual brand profiles pass."""
from pathlib import Path
import hashlib,json
from PIL import Image,ImageChops,ImageStat
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'outputs/motion-20261104'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
profiles=[]
for name in ['desktop','mobile']:
 p=OUT/'brand'/name;d=json.loads((p/'validation.json').read_text())
 assert d['full_decode']=='passed' and d['preflight']['passed'] and d['pixels']['passed']
 assert d['frames']==288 and d['fps']==48 and d['duration']==6
 for asset in d['assets']:
  f=ROOT/asset['path'];assert f.stat().st_size==asset['bytes'] and sha(f)==asset['sha256']
 frozen=[]
 for frame in [1,145,288]:
  a=Image.open(p/'frames'/f'{frame:04}.png').convert('RGB');b=Image.open(p/'native-proof'/f'{frame:04}.png').convert('RGB');difference=sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/3
  assert difference<.1,(name,frame,difference);frozen.append({'frame':frame,'mean_absolute_rgb':difference})
 d['render_vs_frozen_native_proofs']=frozen
 d['native_frame_directory']=str((p/'frames').relative_to(ROOT));d['proofs']=[str((p/'native-proof'/f'{n:04}.png').relative_to(ROOT))for n in[1,145,288]]
 profiles.append(d)
manifest={
 'schema_version':1,'id':'motion-brand-20261104','project':'Space Media Studio',
 'commercial_status':'Original fictional non-commissioned FORMA coffee-roaster identity demonstration; no acquired client or campaign result is claimed.',
 'method':'Actual original Blender geometry, printed curved typography, materials, photographic softboxes, native rendered motion and deliberate camera choreography. Not stock video, generated image-to-video, an optical interpolation or a freely rotatable live mesh.',
 'refinement':'Existing correct coffee packaging and identity are retained and refined. Curved microcopy has actual word spacing, cards rest on physically aligned paper stock, and the lid/monogram reveal is sequenced rather than repeatedly bobbing. Slow camera arc, moving softbox reflection and controlled photographic focus support the brand.',
 'timeline':{'fps':48,'native_frames_per_profile':288,'duration_seconds':6,'easing':'Piecewise quintic minimum-jerk reveal/settle with zero velocity and acceleration at boundaries','sequence':'Assembled hold; lid reveal; monogram card reveal; monogram settles; lid assembles; camera and key settle; assembled hold','loop':'Master frame289 equals frame1. Output contains chronological frames1..288 including intentional held poses. No duplicated endpoint appended, reverse clip, resolution upscale or optical-flow frames.'},
 'profiles':profiles,
 'source_scripts':[{'path':str(p.relative_to(ROOT)),'bytes':p.stat().st_size,'sha256':sha(p)}for p in [ROOT/'scripts/motion-20261104-brand.py',ROOT/'scripts/motion-20261104-pixels.py',ROOT/'scripts/motion-20261104-runner.py',ROOT/'scripts/motion-20261104-manifest.py']],
 'renderer':'Blender5.2.1LTS EEVEE48samples with half-resolution indirect-light reconstruction. Output surfaces and final PNG rasters have the stated native dimensions.',
 'colour':'AgX Medium High Contrast exposure-0.3 to display PNG8; encoded BT709 primaries/matrix and sRGB transfer, H264 High/yuv420p, silent faststart. Level4.2desktop for1080p48; level4.1portrait.',
 'assets_external':False,'models_downloaded':False,'paid_apis':False,'ai_video_generation':False,'synthetic_frame_interpolation':False,'resolution_upscale':False,'audio':False,
 'fonts':'System Arial Regular/Bold and Times New Roman rasterized in the movie pixels. Font binaries are not published; editable local masters retain system font references.',
 'master_policy':'Editable .blend masters, full native PNG sequences, frozen native first/mid/end proofs and detailed validations are retained in ignored outputs/motion-20261104. Only compressed movies/posters, authored scripts and this manifest are source-controlled.',
 'reproduction':'python3 scripts/motion-20261104-runner.py then python3 scripts/motion-20261104-manifest.py; requires Blender at the inspected local path, FFmpeg/ffprobe and Pillow. Render batch only after native proof and full-pose preflight.',
 'browser_validation':'Owned by parent integration task; render-file gates do not certify physical device frame presentation.'
}
(ROOT/'ASSET-MOTION-BLENDER-20261104.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'profiles':len(profiles),'public_bytes':sum(a['bytes']for p in profiles for a in p['assets']),'manifest':'ASSET-MOTION-BLENDER-20261104.json'}))
