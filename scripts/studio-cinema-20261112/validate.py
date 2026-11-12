"""Inspect native Blackbox masters and fresh GLB reimport, preserving originals."""
import bpy,json,hashlib,math
from pathlib import Path
from bpy_extras.object_utils import world_to_camera_view
P=Path(__file__).resolve().parents[2];O=P/'outputs/studio-cinema-20261112';report=[]
for profile in ['desktop','portrait']:
 master=O/f'studio-cinema-{profile}.blend';bpy.ops.wm.open_mainfile(filepath=str(master));s=bpy.context.scene
 groups=[o for o in s.objects if 'entryFrom' in o];mark=bpy.data.objects['Sculpted yellow SPACE emblem'];frames=[]
 assert s.render.resolution_x==(2560 if profile=='desktop' else 1080)
 assert s.render.resolution_y==(1440 if profile=='desktop' else 1920)
 for frame in [1,round(s.frame_end*.5),s.frame_end]:
  s.frame_set(frame);bpy.context.view_layer.update();points=[world_to_camera_view(s,s.camera,mark.matrix_world@__import__('mathutils').Vector(c))for c in [v.co for v in mark.data.vertices]]
  bounds=[min(p.x for p in points),max(p.x for p in points),min(p.y for p in points),max(p.y for p in points)]
  if frame==1:assert min(bounds[0],1-bounds[1],bounds[2],1-bounds[3])>.02,('Clipped opening mark',profile,bounds)
  frames.append({'frame':frame,'mark_bounds':bounds,'camera':list(s.camera.location)})
 deps=[{'name':i.name,'packed':bool(i.packed_file),'sha256':hashlib.sha256(i.packed_file.data).hexdigest()if i.packed_file else None}for i in bpy.data.images if i.source=='FILE']
 assert all(d['packed']for d in deps),deps
 report.append({'profile':profile,'sha256':hashlib.sha256(master.read_bytes()).hexdigest(),'resolution':[s.render.resolution_x,s.render.resolution_y],'frames':s.frame_end,'fps':s.render.fps,'groups':len(groups),'objects':len(s.objects),'samples':s.cycles.samples,'opening_framing':frames,'image_dependencies':deps})
bpy.ops.wm.read_factory_settings(use_empty=True);bpy.ops.import_scene.gltf(filepath=str(P/'public/models/studio-blackbox-20261112.glb'));scene=bpy.context.scene
for name in ['SPACE_Studio','Screen_Hero','Screen_Secondary','Assembly_SpaceEmblem']:assert bpy.data.objects.get(name),name
assert bpy.data.objects['SPACE_Studio']['entryEdition']=='blackbox-20261112'
report.append({'glb':'public/models/studio-blackbox-20261112.glb','sha256':hashlib.sha256((P/'public/models/studio-blackbox-20261112.glb').read_bytes()).hexdigest(),'objects':len(scene.objects),'tracks':sum('entryFrom'in o for o in scene.objects),'fresh_reimport':'pass'})
(O/'geometry-validation.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report),flush=True)
