"""Space / original cinematic branding and project-design studies.
Run only in an isolated background Blender process. Actual 3D typography,
geometry, light and periodic authored motion. No external model or texture.
"""
import argparse, bpy, hashlib, json, math, subprocess, sys, time, struct
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'outputs/cinema-20261103'
p=argparse.ArgumentParser();p.add_argument('--scene',choices=['brand','funding'],required=True);p.add_argument('--mode',choices=['proof','nativeproof','render','encode','validate'],default='proof');p.add_argument('--frames',default='1:120');p.add_argument('--profile',choices=['desktop','mobile'],default='desktop');p.add_argument('--samples',type=int,default=48)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
folder=OUT/a.scene/a.profile;folder.mkdir(parents=True,exist_ok=True)
N=120;FPS=30
WIDTH,HEIGHT=(1920,1080)if a.profile=='desktop'else(720,900)
SUFFIX=''if a.profile=='desktop'else'-mobile'

def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def rgb(h):
 v=[int(h.lstrip('#')[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4 for x in v)+(1,)
def material(name,color,rough=.4,metal=0,coat=0,micro=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes['Principled BSDF'];bs.inputs['Base Color'].default_value=rgb(color);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal;bs.inputs['Coat Weight'].default_value=coat
 if micro:
  n=m.node_tree.nodes;l=m.node_tree.links;noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=220
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=micro;bump.inputs['Distance'].default_value=.004;l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],bs.inputs['Normal'])
 return m
def empty(name,pos=(0,0,0),parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.scene.collection.objects.link(o);o.location=pos;o.parent=parent;return o
def box(name,dims,pos,m,parent=None,bevel=.02):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name=name;o.dimensions=dims;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  b=o.modifiers.new('Crafted edge','BEVEL');b.width=bevel;b.segments=5
  b.affect='EDGES';bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
  for f in o.data.polygons:f.use_smooth=True
  n=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');n.keep_sharp=True
 o.location=pos;o.parent=parent;o.data.materials.append(m);return o
def cylinder(name,radius,depth,pos,m,parent=None):
 bpy.ops.mesh.primitive_cylinder_add(vertices=128,radius=radius,depth=depth);o=bpy.context.object;o.name=name;o.location=pos;o.parent=parent;o.data.materials.append(m)
 b=o.modifiers.new('Rolled finished edge','BEVEL');b.width=.025;b.segments=4;n=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL');n.keep_sharp=True
 for f in o.data.polygons:f.use_smooth=True
 return o
def hollow_tin(name,radius,height,bottom,m,parent):
 verts=[];count=128;thickness=.027
 rings=[(radius,bottom),(radius,bottom+height),(radius-thickness,bottom+height),(radius-thickness,bottom+.07)]
 for r,z in rings:
  for i in range(count):
   angle=2*math.pi*i/count;verts.append((r*math.cos(angle),r*math.sin(angle),z))
 faces=[];indices=[]
 for ring in range(3):
  for i in range(count):faces.append((ring*count+i,ring*count+(i+1)%count,(ring+1)*count+(i+1)%count,(ring+1)*count+i));indices.append(0 if ring==0 else 1 if ring==1 else 2)
 faces.append(tuple(reversed(range(3*count,4*count))));indices.append(2)
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new(name,me);s.collection.objects.link(ob);ob.parent=parent
 for mat in[m,silver,black]:ob.data.materials.append(mat)
 for face,idx in zip(ob.data.polygons,indices):face.material_index=idx;face.use_smooth=len(face.vertices)==4
 return ob

def torus(name,major,minor,pos,m,parent=None,rotation=(0,0,0)):
 bpy.ops.mesh.primitive_torus_add(major_segments=128,minor_segments=12,major_radius=major,minor_radius=minor,location=(0,0,0));o=bpy.context.object;o.name=name;o.location=pos;o.rotation_euler=rotation;o.parent=parent;o.data.materials.append(m)
 for f in o.data.polygons:f.use_smooth=True
 return o
def text(body,name,size,pos,m,parent=None,font=None,align='LEFT',rot=(0,0,0),extrude=.0008):
 c=bpy.data.curves.new(name,'FONT');c.body=body;c.font=font or font_regular;c.size=size;c.align_x=align;c.space_character=1;c.extrude=extrude;c.bevel_depth=.0003;c.bevel_resolution=2;c.resolution_u=16
 o=bpy.data.objects.new(name,c);s.collection.objects.link(o);o.location=pos;o.rotation_euler=rot;o.parent=parent;o.data.materials.append(m);return o
def curved(body,name,size,radius,z,m,parent,center=.25,font=None):
 widths=[]
 for ch in body:
  ob=text(ch,'Measure',size,(0,0,0),m,font=font);bpy.context.view_layer.update();widths.append(ob.dimensions.x+size*.08);bpy.data.objects.remove(ob,do_unlink=True)
 x=-sum(widths)/2
 for i,(ch,w) in enumerate(zip(body,widths)):
  angle=center+(x+w*.5)/radius
  text(ch,name+f' {i:02}',size,(radius*math.sin(angle),-radius*math.cos(angle),z),m,parent,font,align='CENTER',rot=(math.pi/2,0,angle));x+=w

def aim(o,point):o.rotation_euler=(Vector(point)-o.location).to_track_quat('-Z','Y').to_euler()
def area(name,pos,power,size,target,size_y=None,color='#ffffff'):
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='RECTANGLE';d.size=size;d.size_y=size_y or size;d.color=rgb(color)[:3];o=bpy.data.objects.new(name,d);s.collection.objects.link(o);o.location=pos;aim(o,target);return o

def hull2(points):
 points=sorted(set(points))
 def cross(a,b,c):return(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])
 lower=[];upper=[]
 for point in points:
  while len(lower)>1 and cross(lower[-2],lower[-1],point)<=0:lower.pop()
  lower.append(point)
 for point in reversed(points):
  while len(upper)>1 and cross(upper[-2],upper[-1],point)<=0:upper.pop()
  upper.append(point)
 return lower[:-1]+upper[:-1]

def paper_clearance(scene):
 can=scene.objects.get('FORMA coffee tin')
 if can is None:return None
 inv=can.matrix_world.inverted();minimum=100
 for name in ['Lower white cotton card','Thick graphite card','Citron cotton card']:
  ob=scene.objects[name]
  if ob.hide_render:continue
  matrix=inv@ob.matrix_world;corners=[matrix@Vector(v)for v in ob.bound_box]
  if max(v.z for v in corners)<.075 or min(v.z for v in corners)>2.725:continue
  polygon=hull2([(v.x,v.y)for v in corners]);distances=[];crosses=[]
  for i,point in enumerate(polygon):
   other=polygon[(i+1)%len(polygon)];dx=other[0]-point[0];dy=other[1]-point[1];t=max(0,min(1,-(point[0]*dx+point[1]*dy)/(dx*dx+dy*dy)));distances.append(math.hypot(point[0]+t*dx,point[1]+t*dy));crosses.append(dx*(-point[1])-dy*(-point[0]))
  inside=all(v>=0 for v in crosses)or all(v<=0 for v in crosses)
  gap=(0 if inside else min(distances))-1.185;minimum=min(minimum,gap)
 return minimum

def encode():
 master=folder/f'cinema-{a.scene}{SUFFIX}.blend';bpy.ops.wm.open_mainfile(filepath=str(master));scene=bpy.context.scene
 watched=[o for o in scene.objects if o.animation_data]
 states={}
 for f in [1,31,61,91,121]:
  scene.frame_set(f);bpy.context.view_layer.update();states[f]=[[v for row in ob.matrix_world for v in row]for ob in watched]
 delta=lambda u,v:max(abs(x-y)for m,n in zip(states[u],states[v])for x,y in zip(m,n))
 closure=delta(1,121);motion=max(delta(1,f)for f in[31,61,91]);assert closure<.0001 and motion>.1,(closure,motion)
 bounds=[1.,1.,1.,1.];clearance=100
 for f in range(1,N+1):
  scene.frame_set(f);bpy.context.view_layer.update()
  if a.scene=='brand':clearance=min(clearance,paper_clearance(scene))
  for ob in scene.objects:
   if ob.type not in {'MESH','FONT'} or ob.name=='Infinite photographic cyclorama' or ob.hide_render or (ob.type=='FONT'and not ob.data.body.strip()):continue
   projected=[world_to_camera_view(scene,scene.camera,ob.matrix_world@Vector(corner))for corner in ob.bound_box]
   local=[min(v.x for v in projected),min(1-v.x for v in projected),min(v.y for v in projected),min(1-v.y for v in projected)]
   # A circle's square bounding box has impossible corner points. Refine only
   # conservative bounds near the edge using actual evaluated geometry.
   if min(local)<.025:
    evaluated=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());mesh=evaluated.to_mesh()
    projected=[world_to_camera_view(scene,scene.camera,evaluated.matrix_world@v.co)for v in mesh.vertices]
    local=[min(v.x for v in projected),min(1-v.x for v in projected),min(v.y for v in projected),min(1-v.y for v in projected)];evaluated.to_mesh_clear()
   bounds=[min(x,y)for x,y in zip(bounds,local)]
 assert min(bounds)>.015,('Unsafe framing',bounds)
 if a.scene=='brand':assert clearance>=0,('Paper intersects tin',clearance)
 scene.frame_set(1);bpy.context.view_layer.update()
 typography_gap=None
 if a.scene=='funding':
  title=scene.objects['Main project title'];audience=scene.objects['Project audiences'];page=title.parent;inv=page.matrix_world.inverted()
  title_bottom=min((inv@title.matrix_world@Vector(v)).y for v in title.bound_box);audience_top=max((inv@audience.matrix_world@Vector(v)).y for v in audience.bound_box);typography_gap=title_bottom-audience_top
  assert typography_gap>.08,('Project title and audiences overlap',typography_gap)
 floor=scene.objects['Infinite photographic cyclorama'];floor_top=max((floor.matrix_world@Vector(v)).z for v in floor.bound_box)
 anchors=['Rolled aluminium base','Lower white cotton card']if a.scene=='brand'else['Citron cloth back cover']
 contacts={name:min((scene.objects[name].matrix_world@Vector(v)).z for v in scene.objects[name].bound_box)-floor_top for name in anchors}
 assert max(abs(v)for v in contacts.values())<.0001,('Ground contact',contacts)
 if a.mode=='validate':
  receipt={'scene':a.scene,'profile':a.profile,'master_reimport':'passed','periodic_transform_error':closure,'observed_motion':motion,'safe_margins_all_120_poses':bounds,'anchor_ground_contact_gaps':contacts,'paper_to_tin_clearance_all_120_poses':clearance if a.scene=='brand'else None,'funding_title_to_audiences_gap':typography_gap,'passed':True}
  (folder/'scene-check.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps(receipt),flush=True);return
 missing=[f for f in range(1,N+1)if not(folder/'frames'/f'{f:04}.png').exists()];assert not missing,missing
 optical=json.loads(subprocess.check_output(['python3',str(ROOT/'scripts/cinema-20261103-pixels.py'),str(folder)],text=True))
 film=ROOT/'public/films'/f'cinema-{a.scene}{SUFFIX}.mp4';poster=ROOT/'public/images'/f'cinema-{a.scene}{SUFFIX}.jpg'
 subprocess.run(['ffmpeg','-v','error','-y','-framerate',str(FPS),'-i',str(folder/'frames/%04d.png'),'-frames:v',str(N),'-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-c:v','libx264','-threads','4','-preset','slow','-crf','18','-profile:v','high','-level','4.1','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-g','60','-movflags','+faststart','-an',str(film)],check=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(folder/'frames/0001.png'),'-q:v','2','-frames:v','1',str(poster)],check=True)
 subprocess.run(['ffmpeg','-v','error','-i',str(film),'-f','null','-'],check=True)
 data=film.read_bytes();atoms={};pos=0
 while pos+8<=len(data):
  size,kind=struct.unpack('>I4s',data[pos:pos+8]);atoms[kind.decode('ascii',errors='replace')]=pos
  if size==1:size=struct.unpack('>Q',data[pos+8:pos+16])[0]
  if size==0:break
  assert size>=8;pos+=size
 assert atoms.get('moov',len(data))<atoms.get('mdat',0),atoms
 encoded_pixels=json.loads(subprocess.check_output(['python3',str(ROOT/'scripts/cinema-20261103-pixels.py'),str(folder),str(film)],text=True))
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(film)],text=True))
 stream=probe['streams'][0]
 assert(stream['width'],stream['height'])==(WIDTH,HEIGHT)and stream['avg_frame_rate']==f'{FPS}/1'and int(stream['nb_frames'])==N
 assert stream['codec_name']=='h264'and stream['pix_fmt']=='yuv420p'and abs(float(probe['format']['duration'])-N/FPS)<.001 and len(probe['streams'])==1
 info={'scene':a.scene,'master':str(master.relative_to(ROOT)),'master_reimport':'passed','original_authored_geometry':True,'external_models':False,'ai_video':False,'engine':scene.render.engine,'blender':bpy.app.version_string,'native_width':WIDTH,'native_height':HEIGHT,'fps':FPS,'frames':N,'duration_seconds':N/FPS,'upscaled':False,'interpolated':False,'audio':False,'periodic_transform_error':closure,'observed_transform_change':motion,'projected_safe_margins_all_frames':dict(zip(['left','right','bottom','top'],bounds)),'anchor_ground_contact_gaps':contacts,'funding_title_to_audiences_vertical_gap':typography_gap,'minimum_paper_to_tin_clearance_all_120_poses':clearance if a.scene=='brand'else None,'samples':scene.eevee.taa_render_samples,'ray_tracing_resolution_scale':scene.eevee.ray_tracing_options.resolution_scale,'full_decode':'passed','native_pixel_continuity':optical,'encoded_native_pixel_checks':encoded_pixels,'faststart_verified':True,'mp4_atom_offsets':atoms,'ffprobe':probe,'assets':[]}
 for f in[film,poster]:info['assets'].append({'path':str(f.relative_to(ROOT)),'bytes':f.stat().st_size,'sha256':sha(f)})
 (folder/'validation.json').write_text(json.dumps(info,indent=2)+'\n');print(json.dumps(info),flush=True)
 return
if a.mode in ['encode','validate']:encode();sys.exit(0)

bpy.ops.wm.read_factory_settings(use_empty=True);s=bpy.context.scene;s.render.engine='BLENDER_EEVEE';s.eevee.taa_render_samples=a.samples;s.eevee.use_raytracing=True;s.eevee.ray_tracing_options.resolution_scale='2';s.eevee.use_fast_gi=True
s.render.resolution_x=WIDTH;s.render.resolution_y=HEIGHT;s.render.resolution_percentage=100;s.render.fps=FPS;s.frame_start=1;s.frame_end=N;s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8';s.render.film_transparent=False
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.view_settings.exposure=-.3
s.world=bpy.data.worlds.new('Calibrated photographic studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=rgb('#bfc4bd');s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.35
font_regular=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial.ttf');font_bold=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial Bold.ttf');font_serif=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Times New Roman.ttf')
yellow=material('Citron yellow paper','#c9f700',.52,0,0,.05);black=material('Soft graphite pigment','#101511',.3,.1,.15,.035);ivory=material('Cotton white stock','#eeeee6',.61,0,0,.10);ink=material('Dense black ink','#030603',.83);foil=material('Anodised graphite foil','#151a15',.2,.85,.2);silver=material('Brushed aluminium','#b3b6ac',.22,.9,.15);floor=material('White cyclorama','#ddded5',.46,0,0,.025)
yellow.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.17
ink.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.08
graphite_paper=material('Uncoated graphite cover','#141a15',.73,0,0,.07)
graphite_paper.node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value=.16
box('Infinite photographic cyclorama',(200,200,.12),(0,0,-.06),floor,bevel=0)
root=empty('Cinematic assembly')
animated=[]
if a.scene=='brand':
 can=empty('FORMA coffee tin',(1.25,.48,-.005),root)
 cylinder('Rolled aluminium base',1.21,.10,(0,0,.055),black,can)
 hollow_tin('Open-walled coffee tin',1.185,2.65,.075,yellow,can)
 torus('Bottom folded rim',1.181,.026,(0,0,.12),silver,can)
 # Physical label printing conforms to cylindrical packaging rather than a flat billboard.
 curved('FORMA','Can identity',.47,1.189,1.58,ink,can,center=.30,font=font_bold)
 curved('COFFEE ROASTERS','Can descriptor',.071,1.190,1.26,ink,can,center=.30)
 curved('PARMA / ITALIA','Origin',.060,1.191,.72,ink,can,center=.30)
 curved('250 g','Package weight',.07,1.191,.52,ink,can,center=.30)
 # Seam, lid lip, and recessed lid surface remain visibly distinct parts.
 lid=empty('Precision lid assembly',(0,0,2.75),can);animated.append(lid)
 cylinder('Graphite lid side',1.225,.14,(0,0,0),black,lid)
 cylinder('Recessed lid top',1.175,.025,(0,0,.082),black,lid)
 for j in range(4):torus(f'Spun lid ring {j}',1.16-j*.045,.006,(0,0,.100),silver if j==0 else black,lid)
 text('f.','Lid foil signature',.93,(0,-.28,.104),silver,lid,font_serif,'CENTER',extrude=.002)
 cards=empty('Printed identity cards',(-1.78,-.63,.0225),root)
 lower=box('Lower white cotton card',(3.50,2.10,.045),(0,0,0),ivory,cards,.022);lower.rotation_euler.z=.10
 for k in range(7):box(f'Visible stock edge {k}',(3.45,2.06,.005),(0,0,.025+k*.008),ivory,cards,.004)
 card=empty('Hero graphite card',(0,-.06,.12),cards);card.rotation_euler.z=-.08
 box('Thick graphite card',(3.50,2.10,.055),(0,0,0),graphite_paper,card,.022)
 text('FORMA','Card logotype',.53,(-1.46,.24,.030),yellow,card,font_bold,extrude=.001)
 text('COFFEE ROASTERS','Card descriptor',.10,(-1.43,-.04,.031),ivory,card,font_regular)
 text('UN’IDENTITÀ DA RICONOSCERE.','Card signature',.069,(-1.43,-.76,.031),ivory,card,font_regular)
 text('01 / PARMA','Card index',.07,(1.42,-.76,.031),yellow,card,font_regular,'RIGHT')
 # Embossed monogram card rises just enough to show thick stock and separates as a real item.
 second=empty('Citron monogram card',(-1.65,1.00,.16),root);animated.append(second)
 box('Citron cotton card',(2.72,1.70,.065),(0,0,0),yellow,second,.02)
 text('f.','Dimensional original signature',1.08,(0,-.36,.036),foil,second,font_serif,'CENTER',extrude=.026)
 text('FORMA / IDENTITÀ','Monogram caption',.076,(0,-.65,.036),ink,second,font_regular,'CENTER')
 if a.profile=='mobile':
  for ob in [second]+list(second.children_recursive):ob.hide_render=True
 target=(-.1,.15,1.15)
 key=area('Moving soft key',(-3,-6,8),1250,5,target,7,'#fff8e8');area('Long cool edge',(6,0,6),1100,2.5,(1,.4,1.8),5,'#f1f6ff');area('Top fill',(-1,5,8),1100,6,target,5)
else:
 # Premium project folio with genuine sheet thickness, edge detail, original printed hierarchy.
 box('Citron cloth back cover',(4.30,5.45,.12),(0,.1,.06),yellow,root,.045)
 box('Graphite bound spine',(.22,5.39,.22),(-1.95,.1,.15),black,root,.035)
 for k in range(18):box(f'Bound cotton paper {k:02}',(3.91,5.09,.008),(.11,.08,.135+k*.010),ivory,root,.003)
 sheets=[]
 for i in range(3):
  page=empty(f'Project planning sheet {i+1}',(.11,.08,.33+i*.026),root);sheets.append(page);animated.append(page)
  box(f'Fine uncoated page {i+1}',(3.91,5.09,.025),(0,0,0),graphite_paper if i==2 else ivory,page,.011)
  page_ink=yellow if i==2 else ink
  text(f'0{i+1} / '+['STRATEGIA','PIANO','PROGETTO'][i],f'Sheet header {i}',.087,(-1.66,2.15,.017),page_ink,page,font_bold)
  box(f'Header baseline {i}',(3.31,.012,.002),(0,1.94,.018),page_ink,page,0)
  if i<2:
   text(['Obiettivi.\nPersone.\nImpatto.','Un piano\nche funziona.'][i],f'Page purpose {i}',.38,(-1.66,1.20,.02),ink,page,font_bold)
   for row,label in enumerate(['ATTIVITÀ','PARTNER','BUDGET']):
    y=-.35-row*.59;text(label,f'Planning line {i}-{row}',.085,(-1.66,y,.020),ink,page,font_bold)
    box(f'Planning rule {i}-{row}',(1.92,.017,.002),(.61,y+.025,.019),ink,page,0)
  else:
   text('Dall’idea\nal progetto.', 'Main project title',.46,(-1.66,1.09,.021),ivory,page,font_bold)
   text('AZIENDE  /  APS  /  ASD','Project audiences',.092,(-1.66,.18,.021),yellow,page,font_bold)
   # Authored proposal diagram: three aligned phases become one coherent plan.
   for k,(label,width,offset) in enumerate([('IDEA',.63,0),('PIANO',1.13,.45),('IMPATTO',.80,1.29)]):
    y=-.12-k*.55;text(label,'Phase '+label,.085,(-1.66,y,.022),ivory,page,font_bold)
    box('Timeline track '+label,(2.23,.010,.002),(.50,y+.025,.018),ivory,page,0)
    box('Timeline block '+label,(width,.10,.012),(-.60+offset+width/2,y+.025,.025),yellow if k==1 else ivory,page,.017)
  text('SPACE / PROGETTI & BANDI',f'Sheet footer {i}',.071,(-1.66,-2.22,.021),page_ink,page,font_bold)
  text(f'0{i+1}',f'Page number {i}',.072,(1.66,-2.22,.021),page_ink,page,font_regular,'RIGHT')
 # Tactile, colored section tabs stay connected to their respective sheet.
 for i,label in enumerate(['AZIENDE','APS','ASD']):
  y=1.25-i*.82
  box('Index tab '+label,(.62,.58,.022),(2.10,y,.001),yellow if i==1 else black,sheets[i],.026)
  text(label,'Index label '+label,.068,(2.14,y-.025,.016),ink if i==1 else ivory,sheets[i],font_bold,'CENTER')
 root.rotation_euler.z=-.12
 target=(.25,.15,.38)
 key=area('Moving soft key',(-4,-5,8),1400,6,target,6,'#fff9e8');area('Paper edge fill',(5,1,7),1100,4,target,6,'#f0f6ff');area('Rear rim',(-2,6,4),850,3,target,5)

cd=bpy.data.cameras.new('Cinematic 65mm lens');cam=bpy.data.objects.new('Cinematic camera',cd);s.collection.objects.link(cam);s.camera=cam;cd.lens=62 if a.scene=='brand' else 57;cd.clip_start=.05;cd.clip_end=300;cd.dof.use_dof=True;cd.dof.aperture_fstop=11
focus=empty('Focus plane',target);cd.dof.focus_object=focus

def pose(frame):
 s.frame_set(frame);phase=2*math.pi*(frame-1)/N;amount=(1-math.cos(phase))*.5
 if a.scene=='brand':
  if a.profile=='mobile':
   can.location=(.53,1.12,-.005);cards.location=(-.10,-1.36,.0225);second.location=(-.65,.05,.16)
   cam.location=(5.9+.22*math.sin(phase),-11.6,9.25+.10*math.cos(phase));aim(cam,(-.02,.02,1.05))
  else:cam.location=(7.25+.32*math.sin(phase),-12.1,8.0+.14*math.cos(phase));aim(cam,target)
  lid.location.z=2.75+.59*amount;lid.rotation_euler.z=.10*math.sin(phase)
  second.location=((-1.65 if a.profile=='desktop'else-.65)-.20*amount,(1 if a.profile=='desktop'else.05)+.05*amount,.16+.55*amount);second.rotation_euler=(.05*amount,-.10*amount,-.04+.07*math.sin(phase))
  root.rotation_euler.z=.020*math.sin(phase)
 else:
  cam.location=(7.5+.30*math.sin(phase),-10.7,11.0+.18*math.cos(phase))if a.profile=='desktop'else(6.6+.25*math.sin(phase),-10.6,11.2+.15*math.cos(phase));aim(cam,target)
  for i,page in enumerate(sheets):
   page.location=(.11+i*.16*amount,.08+i*.10*amount,.33+i*.026+i*.45*amount)
   page.rotation_euler=(.035*i*amount,0,-.018*i*math.sin(phase))
  root.rotation_euler.z=-.12+.024*math.sin(phase)
 key.location.x=-3.5+.4*math.sin(phase);aim(key,target)

for f in range(1,N+2):
 pose(f)
 for ob in [cam,root,key]+animated:
  ob.keyframe_insert('location',frame=f);ob.keyframe_insert('rotation_euler',frame=f)
for ob in [cam,root,key]+animated:
 if ob.animation_data and ob.animation_data.action:
  for layer in ob.animation_data.action.layers:
   for strip in layer.strips:
    try:
     bag=strip.channelbag(ob.animation_data.action_slot)
     for fc in bag.fcurves:
      for k in fc.keyframe_points:k.interpolation='LINEAR'
    except Exception:pass
pose(1);master=folder/f'cinema-{a.scene}{SUFFIX}.blend';bpy.ops.wm.save_as_mainfile(filepath=str(master))
frames=[1,61,120]if a.mode=='nativeproof'else[1,61,101]if a.mode=='proof'else range(int(a.frames.split(':')[0]),int(a.frames.split(':')[1])+1)
if a.mode=='proof':s.render.resolution_percentage=50
out=folder/('native-proof'if a.mode=='nativeproof'else'proof'if a.mode=='proof'else'frames');out.mkdir(exist_ok=True)
metrics=[]
for f in frames:
 path=out/f'{f:04}.png'
 if path.exists()and a.mode=='render':continue
 pose(f);s.render.filepath=str(path);start=time.monotonic();bpy.ops.render.render(write_still=True);metrics.append({'frame':f,'seconds':time.monotonic()-start});print(json.dumps(metrics[-1]),flush=True)
(folder/f'{a.mode}-metrics.json').write_text(json.dumps(metrics,indent=2)+'\n')
