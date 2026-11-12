import bpy,json
s=bpy.context.scene
ns=['LUMA studio camera','Nine-leaf optical diaphragm 0','Curved multi-coated optical element','Optical group 2','desktop hero plate camera']
r={}
for n in ns:
 o=s.objects[n];r[n]={'location':list(o.location),'scale':list(o.scale),'rotation':list(o.rotation_euler),'verts':[list(v.co) for v in o.data.vertices] if o.type=='MESH' and len(o.data.vertices)<10 else None}
 if o.type=='CAMERA':r[n]['lens']=o.data.lens;r[n]['clip']=o.data.clip_start
r['lights']=[{'name':o.name,'energy':o.data.energy,'size':o.data.size,'size_y':o.data.size_y,'color':list(o.data.color)}for o in s.objects if o.type=='LIGHT']
r['materials']={}
for m in bpy.data.materials:
 if m.use_nodes:
  p=m.node_tree.nodes.get('Principled BSDF')
  if p:r['materials'][m.name]={x:list(p.inputs[x].default_value) if x=='Base Color' else p.inputs[x].default_value for x in ['Base Color','Roughness','Metallic','Transmission Weight','IOR','Coat Weight']}
print(json.dumps(r,indent=2))
