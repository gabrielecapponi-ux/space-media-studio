import bpy,json
from pathlib import Path
p=Path(__file__).resolve().parents[2]/'outputs/luma-mechanics-20261112/inspection.json'
s=bpy.context.scene
r={'version':bpy.app.version_string,'source':bpy.data.filepath,'engine':s.render.engine,'resolution':[s.render.resolution_x,s.render.resolution_y],'objects':[{'name':o.name,'type':o.type,'parent':o.parent.name if o.parent else None,'location':list(o.location),'rotation':list(o.rotation_euler),'dimensions':list(o.dimensions),'materials':[x.name for x in o.data.materials]if hasattr(o.data,'materials')else [],'vertices':len(o.data.vertices)if o.type=='MESH'else None}for o in s.objects],'materials':[m.name for m in bpy.data.materials]}
p.write_text(json.dumps(r,indent=2));print('INSPECT',len(s.objects),p)
