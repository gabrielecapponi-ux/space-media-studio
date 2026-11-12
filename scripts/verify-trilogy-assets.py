"""Verify the three completed productions and record only the installed agency assets."""
from pathlib import Path
import json,hashlib
P=Path(__file__).resolve().parents[1];allowed=set(json.loads((P/'config/agency-assets.json').read_text())['files']);assets=[];sources=[]
for prefix,count in [('studio',6),('cacao',7),('campaign',7)]:
 path=P/f'scripts/{prefix}-cinema-20261112/asset-manifest.json';m=json.loads(path.read_text());assert len(m['assets'])==count
 for item in m['assets']:
  file=P/item['file'];assert file.is_file()and hashlib.sha256(file.read_bytes()).hexdigest()==item['sha256'],file
  assert item['file'].removeprefix('public/')in allowed,file
  if file.suffix=='.mp4':assert item['decode']=='pass'and item['faststart']and not item['upscaled']and not item['interpolation']
  assets.append({k:v for k,v in item.items()if k!='probe'})
 sources.append({'manifest':str(path.relative_to(P)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'source':m['source'],'masters':m.get('masters',m.get('master'))})
assert len(assets)==20 and len({x['file']for x in assets})==20
assert 'images/director-brand.jpg'in allowed,'Demo CACAO still uses its historical artwork'
report={'edition':'SPACE Blackbox, CACAO Atelier and SHIFT campaign cinema','date':'2026-11-12','origin':'Original editable Blender geometry and previously authored artwork; no new external model or generated film.','baseline_source_commit':'9936a48f568f5c0bb2abd06c142a13758837a640','production_manifests':sources,'assets':assets,'asset_count':len(assets),'bytes':sum(x['bytes']for x in assets),'validation':'All installed files match production SHA-256 and the active agency manifest. Native/derived dimensions, decode and cadence are recorded in each production manifest. Browser observations and publication are separate.'}
(P/'ASSET-TRILOGY-CINEMA-20261112.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'assets':len(assets),'bytes':report['bytes']},indent=2))
