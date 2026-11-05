"""Factual CACAO provenance assembled only after both actual movie profiles pass."""
from pathlib import Path
import hashlib,json
from PIL import Image,ImageChops,ImageStat
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'outputs/showcase-brand-20261105'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
profiles=[]
for name in['desktop','mobile']:
 folder=OUT/name;data=json.loads((folder/'validation.json').read_text());assert data['full_decode']=='passed'and data['preflight']['passed']and data['pixel_validation']['passed'];assert data['fps']==48 and data['frames']==288 and data['duration_seconds']==6
 for asset in data['assets']:
  f=ROOT/asset['path'];assert f.stat().st_size==asset['bytes']and sha(f)==asset['sha256']
 proofs=[]
 for frame in[1,145,288]:
  native=folder/'frames'/f'{frame:04}.png';frozen=folder/'native-proof'/f'{frame:04}.png';a=Image.open(native).convert('RGB');b=Image.open(frozen).convert('RGB');assert a.size==b.size;error=sum(ImageStat.Stat(ImageChops.difference(a,b)).mean)/3;assert error<.15,(name,frame,error)
  proofs.append({'frame':frame,'frozen_proof':str(frozen.relative_to(ROOT)),'native_proof_mean_absolute_rgb':error})
 data['native_frame_directory']=str((folder/'frames').relative_to(ROOT));data['frozen_native_proofs']=proofs;profiles.append(data)
manifest={
 'schema_version':1,'id':'showcase-brand-20261105','project':'Space Media Studio',
 'commercial_status':'CACAO / ATELIER is an original fictional non-commissioned chocolate brand demonstration. No real client, commissioned work, sales result or third-party brand identity is claimed.',
 'method':'Actual original Blender geometry, rigid package structure, six physically separated four-section chocolate tablets, leaf embossing, foil text, photographic materials and area lights. Authored native-frame camera and hinge choreography; no downloaded models or AI video.',
 'replaces':'FORMA cylindrical coffee-tin branding demonstration. Original films remain archived and are not overwritten.',
 'visible_objects':'Charcoal rigid rectangular base with separate bottom and walls, citron covered hinged lid and interior liner, moulded six-cell tray, six dark/milk/blond tablets, foil wordmark and embossed cacao leaf. No paper sheet, perfume or cylindrical box.',
 'timeline':{'fps':48,'native_frames_per_profile':288,'duration_seconds':6,'easing':'Piecewise quintic minimum jerk; zero velocity and acceleration at settled endpoints','sequence':'Closed brand hold; actual rear-hinged lid opens; front-centre chocolate tablet rises and gently tilts; readable hold; tablet returns; lid closes; camera and softbox settle.','loop':'Masterframe289 equals frame1; delivery contains chronological frames1..288. No endpoint copy appended, reverse clip, optical flow, resolution upscale or artificially manufactured 60fps.'},
 'profiles':profiles,
 'sources':[{'path':str(f.relative_to(ROOT)),'bytes':f.stat().st_size,'sha256':sha(f)}for f in[ROOT/'scripts/showcase-brand-20261105.py',ROOT/'scripts/showcase-brand-20261105-runner.py',ROOT/'scripts/showcase-brand-20261105-pixels.py',ROOT/'scripts/showcase-brand-20261105-manifest.py']],
 'renderer':'Blender5.2.1LTS EEVEE48samples with half-resolution indirect ray reconstruction; geometry and output images rendered at actual stated native delivery sizes.',
 'colour':'AgX Medium High Contrast exposure-0.15 to PNG8; H264High/yuv420p BT709 primaries/matrix with sRGB transfer, silent and faststart. DesktopHigh4.2,portraitHigh4.1.',
 'fonts':'System Arial Regular/Bold rasterized into movie pixels. No font binaries redistributed; editable local Blender masters keep local system references.',
 'external_assets':False,'models_downloaded':False,'ai_video_generation':False,'paid_api':False,'synthetic_frame_interpolation':False,'resolution_upscale':False,'audio':False,
 'validation':'All289masterposes tested for positive camera margins, exact loop transform closure, actual grounded base, oriented-box separation of lid/walls and independent tablets. Full native sequence no-black/continuity tests, frozen-native comparisons, full MP4 decode, sampled native-vs-encoded pixels and faststart atom order. Browser runtime/mobile playback checks belong to integration task, not certified here.',
 'master_policy':'Editable blend files, native PNG frames, native proof stills and detailed validations remain in ignored outputs/showcase-brand-20261105. Public delivery includes only compressed movies/posters, authored source scripts and factual provenance.',
 'reproduction':'Render native proofs using scripts/showcase-brand-20261105.py --mode nativeproof for each profile, visually review, then python3 scripts/showcase-brand-20261105-runner.py and python3 scripts/showcase-brand-20261105-manifest.py. Requires Blender, FFmpeg/ffprobe and Pillow.'
}
(ROOT/'ASSET-SHOWCASE-BRAND-20261105.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');print(json.dumps({'manifest':'ASSET-SHOWCASE-BRAND-20261105.json','profiles':len(profiles),'public_bytes':sum(a['bytes']for p in profiles for a in p['assets'])}))
