from pathlib import Path
import bpy,json,hashlib
from mathutils import Vector
P=Path(__file__).resolve().parents[2];O=P/'outputs/campaign-cinema-20261112';source=P/'outputs/flagship-20261106/shift/phase-01.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
rows=[]
for o in bpy.context.scene.objects:
 rows.append({'name':o.name,'type':o.type,'location':list(o.location),'dimensions':list(o.dimensions),'vertices':len(o.data.vertices)if o.type=='MESH' else 0,'parent':o.parent.name if o.parent else None,'materials':[m.name for m in o.data.materials]if hasattr(o.data,'materials')else[]})
d={'source':str(source.relative_to(P)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'objects':rows,'images':[{'name':i.name,'path':i.filepath,'packed':bool(i.packed_file)}for i in bpy.data.images],'fonts':[{'name':f.name,'path':f.filepath,'packed':bool(f.packed_file)}for f in bpy.data.fonts]};(O/'inspection.json').write_text(json.dumps(d,indent=2));print('INSPECT',len(rows),sum(r['vertices']for r in rows))
