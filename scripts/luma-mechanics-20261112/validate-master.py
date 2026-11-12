"""Reopen both masters; verify geometry containment, full framing and loop continuity."""
import bpy,json,math,hashlib
from mathutils import Vector
from pathlib import Path
from bpy_extras.object_utils import world_to_camera_view
P=Path(__file__).resolve().parents[2];O=P/'outputs/luma-mechanics-20261112';reports=[]
for profile in ['desktop','portrait']:
 bpy.ops.wm.open_mainfile(filepath=str(O/f'luma-mechanics-{profile}.blend'));s=bpy.context.scene;root=s.objects['LUMA studio camera'];front=s.objects['Optical group 2'];parts=[s.objects['Optical group '+str(i)]for i in range(3)];subject=[o for o in root.children_recursive if o.type in {'MESH','FONT','CURVE'}];leaves=[o for o in s.objects if o.name.startswith('MECH / titanium iris leaf')]
 assert len(leaves)==9
 camera=s.camera;floor=s.objects['Cyclorama'];floor_top=max((floor.matrix_world@Vector(v)).z for v in floor.bound_box)
 minimum={'left':1,'right':1,'top':1,'bottom':1,'floor_gap_m':1,'lens_gap_model_units':1};max_rad=0;leaf_y=[1,-1];loop={};motion={n:[]for n in ['body_yaw','front_extension','dial_rotation','iris_rotation']}
 watched=[root,camera]+parts+[o for o in s.objects if o.name.startswith('MECH /')]
 for f in sorted(set(list(range(1,s.frame_end+2,5))+[1,2,s.frame_end,s.frame_end+1])):
  s.frame_set(f);bpy.context.view_layer.update()
  pts=[world_to_camera_view(s,camera,o.matrix_world@Vector(v))for o in subject for v in o.bound_box]
  for k,v in [('left',min(p.x for p in pts)),('right',1-max(p.x for p in pts)),('bottom',min(p.y for p in pts)),('top',1-max(p.y for p in pts))]:minimum[k]=min(minimum[k],v)
  minimum['floor_gap_m']=min(minimum['floor_gap_m'],min((o.matrix_world@Vector(v)).z for o in subject for v in o.bound_box)-floor_top)
  minimum['lens_gap_model_units']=min(minimum['lens_gap_model_units'],*(parts[i].location.y-[.31,.32,.24][i]/2-(parts[i+1].location.y+[.31,.32,.24][i+1]/2)for i in range(2)))
  inv=front.matrix_world.inverted()
  for ob in leaves:
   for v in ob.data.vertices:
    pt=inv@ob.matrix_world@v.co;max_rad=max(max_rad,math.hypot(pt.x,pt.z));leaf_y=[min(leaf_y[0],pt.y),max(leaf_y[1],pt.y)]
  motion['body_yaw'].append(root.rotation_euler.z);motion['front_extension'].append(parts[2].location.y);motion['dial_rotation'].append(s.objects['MECH / dial pivot 1'].rotation_euler.z);motion['iris_rotation'].append(s.objects['MECH / iris pivot 0'].rotation_euler.y)
  if f in [1,2,s.frame_end,s.frame_end+1]:loop[f]=[float(v)for ob in watched for row in ob.matrix_world for v in row]
 delta=max(abs(x-y)for x,y in zip(loop[1],loop[s.frame_end+1]));assert delta<1e-6,delta
 assert min(minimum[k]for k in ['left','right','top','bottom'])>.015,minimum
 assert minimum['floor_gap_m']>0,minimum
 assert minimum['lens_gap_model_units']>=0,minimum
 assert max_rad<.65 and leaf_y[0]>.09 and leaf_y[1]<.115,(max_rad,leaf_y)
 spans={k:max(v)-min(v)for k,v in motion.items()};assert spans['body_yaw']>.6 and spans['front_extension']>.37 and spans['dial_rotation']>1.8 and spans['iris_rotation']>.58
 dependencies=[]
 for kind,items in [('font',bpy.data.fonts),('image',bpy.data.images)]:
  for item in items:
   if item.users==0 or not getattr(item,'filepath','') or item.filepath=='<builtin>':continue
   path=Path(bpy.path.abspath(item.filepath)).resolve();packed=bool(getattr(item,'packed_file',None));exists=path.is_file()
   dependencies.append({'type':kind,'name':item.name,'path':str(path),'packed':packed,'packed_bytes':item.packed_file.size if packed else 0,'packed_sha256':hashlib.sha256(item.packed_file.data).hexdigest()if packed else None,'exists':exists,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()if exists else None})
   assert packed or exists,('Missing external dependency',str(path))
 reports.append({'profile':profile,'dependencies':dependencies,'external_libraries':[x.filepath for x in bpy.data.libraries],'file':str(Path(bpy.data.filepath).relative_to(P)),'resolution':[s.render.resolution_x,s.render.resolution_y],'fps':s.render.fps,'frames':s.frame_end,'engine':s.render.engine,'samples':s.cycles.samples,'gpu_denoise':s.cycles.denoising_use_gpu,'seed':s.cycles.seed,'minimum_margins':minimum,'loop_transform_max_error':delta,'iris_radial_max':max_rad,'iris_depth_range':leaf_y,'mechanism_spans':spans,'status':'pass'})
(O/'geometry-validation.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports,indent=2))
