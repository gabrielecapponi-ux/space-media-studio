import bpy,json,hashlib
from pathlib import Path
P=Path(__file__).resolve().parents[2];O=P/'outputs/cacao-cinema-20261112';O.mkdir(exist_ok=True)
sources=['outputs/flagship-20261106/brand/desktop/brand-macro-desktop.blend','outputs/motion-refinement-20261105/brand/desktop/brand-balanced.blend']
rows=[]
for src in sources:
 p=P/src;bpy.ops.wm.open_mainfile(filepath=str(p));s=bpy.context.scene
 rows.append({'file':src,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'blender':bpy.app.version_string,'engine':s.render.engine,'objects':len(s.objects),'vertices':sum(len(o.data.vertices)for o in s.objects if o.type=='MESH'),'camera':s.camera.name,'objects_detail':[{'name':o.name,'type':o.type,'parent':o.parent.name if o.parent else None,'location':list(o.location),'rotation':list(o.rotation_euler),'scale':list(o.scale),'dimensions':list(o.dimensions),'materials':[slot.material.name if slot.material else None for slot in o.material_slots]}for o in s.objects], 'materials':[{'name':m.name,'nodes':[(n.name,n.type)for n in m.node_tree.nodes] if m.use_nodes else []}for m in bpy.data.materials],'fonts':[{'name':f.name,'filepath':f.filepath,'packed':bool(f.packed_file)}for f in bpy.data.fonts]})
(O/'inspection.json').write_text(json.dumps(rows,indent=2))
print(json.dumps([{k:r[k]for k in ['file','sha256','blender','engine','objects','vertices','camera']}for r in rows],indent=2))
