"""Compose factual asset provenance only after every profile passed validation."""
import hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'outputs/cinema-20261103'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assets=[]
for scene in ['brand','funding']:
 for profile in ['desktop','mobile']:
  folder=OUT/scene/profile;data=json.loads((folder/'validation.json').read_text())
  data['ffprobe']['format']['filename']=data['assets'][0]['path']
  assert data['full_decode']=='passed'and data['master_reimport']=='passed'and data['native_pixel_continuity']['passed']and data['faststart_verified']and data['encoded_native_pixel_checks']['passed']
  assert all((ROOT/a['path']).stat().st_size==a['bytes']and sha(ROOT/a['path'])==a['sha256']for a in data['assets'])
  freeze=folder/'frozen-look-match.json'
  if freeze.exists():
   data['frozen_look_match']=json.loads(freeze.read_text());assert data['frozen_look_match']['passed']
  data['profile']=profile;data['source_scene']=scene;data['native_frames_directory']=str((folder/'frames').relative_to(ROOT));data['master_sha256']=sha(ROOT/data['master']);assets.append(data)
manifest={
 'schema_version':1,'id':'cinema-blender-20261103','project':'Space Media Studio',
 'scope':'Original refined identity/packaging and project-design demonstration films, plus independently framed native portrait versions. They replace historical service-brand and service-funding in the current homepage.',
 'commercial_status':'Original fictional, non-commissioned concepts. No existing client, commission, grant approval or business result is claimed.',
 'method':'Authored Blender geometry, curved and flat typography, materials, light, perspective camera and periodic deterministic pose animation. Offline EEVEE renders; these are actual 3D film pixels, not live interactive GLBs and not AI generated video.',
 'scenes':{
  'brand':{'concept':'FORMA / Coffee roasters identity','authored_geometry':'Hollow double-wall coffee tin with actual visible interior and metal rolled rim, independent removable spun lid with concentric rings, custom curved physical type, dimensional f. signature and cotton identity card stock. Lid and identity card assemble in a continuous original four-second loop.'},
  'funding':{'concept':'Dall’idea al progetto / Space Progetti','authored_geometry':'Citron-backed folio, eighteen bound sheet edges, three independently animated printed planning pages and connected AZIENDE/APS/ASD section tabs. Graphite cover presents original IDEA/PIANO/IMPATTO planning diagram. A project-design concept, not an announcement of an open call.'}
 },
 'source_scripts':[{'path':str(p.relative_to(ROOT)),'sha256':sha(p)}for p in [ROOT/'scripts/cinema-20261103.py',ROOT/'scripts/cinema-20261103-runner.py',ROOT/'scripts/cinema-20261103-pixels.py',ROOT/'scripts/cinema-20261103-manifest.py']],
 'master_policy':'Editable .blend files and original native PNG frame sequences retained in ignored outputs/cinema-20261103. Only compressed movies, first-frame posters, authored scripts and this provenance receipt are published.',
 'fonts':'System Arial Regular/Bold and Times New Roman, rendered into final film pixels; no font binaries distributed. Editable masters reference system-installed font files.',
 'colour':'AgX Medium High Contrast, exposure-0.3, native PNG8 display masters; H.264 BT709 primaries/matrix with sRGB transfer. Ray-traced indirect-light effects use EEVEE half-resolution reconstruction; final scene and output rasters use stated native resolutions.',
 'mobile':'Separate native 720×900 Blender camera/profile; brand objects are rearranged for portrait, with the secondary citron signature card hidden to preserve physical separation and a clean phone composition. Not an automatic crop of desktop or final resolution upscale.',
 'source_media_external':False,'models_downloaded':False,'ai_images_or_video':False,'paid_apis':False,'synthetic_frame_interpolation':False,'reverse_playback':False,'audio':False,
 'loop':'120 successive chronological frames at 30 fps. Master frame 121 equals frame 1. No duplicate endpoint appended and no reversed or interpolated tail. Every native adjacent pair and seam independently pixel-gated.',
 'verification':'All four masters reimported; periodic transforms, actual ground-anchor contact and all 120 pose frustum bounds checked. Near-edge circular bounds refined against actual evaluated mesh vertices. Visible identity cards are also checked for physical clearance against the tin at all 120 poses. Native pixel-continuity gate plus full FFmpeg decode, codec probe and actual moov-before-mdat atom verification passed.',
 'assets':assets
}
(ROOT/'ASSET-CINEMA-BLENDER.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
print(json.dumps({'written':'ASSET-CINEMA-BLENDER.json','profiles':len(assets),'public_bytes':sum(a['bytes']for s in assets for a in s['assets'])}))
