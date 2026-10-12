"""Four original service films, authored geometry / materials / 60 distinct poses per second."""
import argparse, json, math, sys, time
from pathlib import Path
import bpy
from mathutils import Vector
args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
p = argparse.ArgumentParser()
p.add_argument('--scene', choices=['identity','web','cgi','campaigns'], required=True)
p.add_argument('--preview', action='store_true')
p.add_argument('--benchmark', action='store_true')
p.add_argument('--engine', default='CYCLES', choices=['CYCLES','BLENDER_EEVEE'])
p.add_argument('--samples', type=int, default=16)
p.add_argument('--frames', default='1:120')
p.add_argument('--pose', type=int, default=1)
p.add_argument('--resume', action='store_true')
a = p.parse_args(args)
ROOT = Path(__file__).resolve().parents[1]
out = ROOT/'outputs/four-services'/a.scene
out.mkdir(parents=True, exist_ok=True)
for obj in list(bpy.data.objects): bpy.data.objects.remove(obj, do_unlink=True)
s = bpy.context.scene
s.render.engine=a.engine
s.render.resolution_x=1280 if a.preview else 3840
s.render.resolution_y=720 if a.preview else 2160
s.render.resolution_percentage=100
s.render.fps=60
s.frame_start=1;s.frame_end=120
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8';s.render.image_settings.compression=30
s.render.film_transparent=False
s.render.use_persistent_data=a.engine!='CYCLES'
s.render.use_motion_blur=True;s.render.motion_blur_shutter=.35
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast'
s.view_settings.exposure=0
if a.engine=='CYCLES':
 s.cycles.samples=a.samples;s.cycles.use_denoising=True;s.cycles.denoising_use_gpu=False;s.cycles.adaptive_threshold=.06
 s.cycles.use_auto_tile=True;s.cycles.tile_size=1024
 s.cycles.max_bounces=6;s.cycles.diffuse_bounces=2;s.cycles.glossy_bounces=4;s.cycles.transmission_bounces=6
 try:
  prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
  for device in prefs.devices: device.use=device.type=='METAL'
  s.cycles.device='GPU'
 except: s.cycles.device='CPU'
else:
 s.eevee.taa_render_samples=a.samples
 s.eevee.shadow_pool_size='1024' if a.scene=='campaigns' else '512'
 s.eevee.use_raytracing=True
 s.eevee.ray_tracing_options.resolution_scale='2' if a.scene=='identity' else '4'
s.world.use_nodes=True
s.world.node_tree.nodes['Background'].inputs['Color'].default_value=(.065,.07,.08,1)
s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.28


def mat(name, color, metal=0, rough=.3, coat=0, transmission=0, micro=0):
 m=bpy.data.materials.new(name);m.use_nodes=True
 n=m.node_tree.nodes;l=m.node_tree.links;b=n.get('Principled BSDF')
 b.inputs['Base Color'].default_value=(*color,1);b.inputs['Metallic'].default_value=metal;b.inputs['Roughness'].default_value=rough
 b.inputs['Coat Weight'].default_value=coat;b.inputs['Coat Roughness'].default_value=.15
 b.inputs['Transmission Weight'].default_value=transmission;b.inputs['IOR'].default_value=1.46
 if transmission:
  m.use_raytrace_refraction=True
  m.thickness_mode='SLAB'
  n.get('Material Output').inputs['Thickness'].default_value=.12
 if micro:
  noise=n.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=350;noise.inputs['Detail'].default_value=2
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=micro;bump.inputs['Distance'].default_value=.012
  l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],b.inputs['Normal'])
 return m
ivory=mat('Cotton ivory paper',(.75,.72,.64),rough=.67,micro=.15)
white=mat('Warm white printed ink',(.92,.92,.85),rough=.4)
black=mat('Graphite satin coating',(.012,.016,.019),rough=.27,coat=.2,micro=.04)
lime=mat('Space chartreuse pigment',(.7,.88,.006),rough=.36,coat=.16)
metal=mat('Brushed aluminium',(.56,.6,.64),1,.24,micro=.045)
chrome=mat('Polished platinum',(.69,.73,.78),1,.13)
gold=mat('Champagne foil',(.63,.45,.22),1,.21)


def box(name, loc, dim, material, bevel=.035, rot=(0,0,0), parent=None):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc,rotation=rot);o=bpy.context.object;o.name=name;o.dimensions=dim
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Manufactured soft edge','BEVEL');mod.width=bevel;mod.segments=4
  mod=o.modifiers.new('Weighted corner normals','WEIGHTED_NORMAL')
 for f in o.data.polygons:f.use_smooth=True
 o.data.materials.append(material)
 if parent:o.parent=parent
 return o

def cylinder(name,loc,radius,depth,material,rot=(0,0,0),parent=None):
 bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=radius,depth=depth,location=loc,rotation=rot)
 o=bpy.context.object;o.name=name;o.data.materials.append(material)
 mod=o.modifiers.new('Precision edge','BEVEL');mod.width=min(.04,depth*.18);mod.segments=4
 mod=o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
 for f in o.data.polygons:f.use_smooth=True
 if parent:o.parent=parent
 return o

font_regular=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial.ttf')
font_bold=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial Bold.ttf')

def text(name,body,loc,size,material,rot=(0,0,0),align='LEFT',parent=None,extrude=.0002):
 data=bpy.data.curves.new(name,'FONT');data.font=font_bold if len(body)<23 else font_regular;data.body=body;data.size=size;data.align_x=align;data.extrude=extrude;data.resolution_u=8
 o=bpy.data.objects.new(name,data);s.collection.objects.link(o);o.location=loc;o.rotation_euler=rot;o.data.materials.append(material)
 if parent:o.parent=parent
 return o

def curve(name, coords, radius, material, parent=None):
 data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.resolution_u=24;data.bevel_depth=radius;data.bevel_resolution=5
 path=data.splines.new('BEZIER');path.bezier_points.add(len(coords)-1)
 for bp,co in zip(path.bezier_points,coords):bp.co=co;bp.handle_left_type='AUTO';bp.handle_right_type='AUTO'
 o=bpy.data.objects.new(name,data);s.collection.objects.link(o);o.data.materials.append(material)
 if parent:o.parent=parent
 return o

def empty(name):
 o=bpy.data.objects.new(name,None);s.collection.objects.link(o);return o

def look(obj,target):obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

def area(name,loc,power,dim,target=(0,0,1),color=(1,1,1)):
 data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='RECTANGLE';data.size=dim[0];data.size_y=dim[1];data.color=color
 o=bpy.data.objects.new(name,data);s.collection.objects.link(o);o.location=loc;look(o,target);return o

def stage(dark=False):
 m=mat('Photographic cyclorama',(.012,.016,.02) if dark else (.61,.59,.54),rough=.42 if dark else .6)
 box('Infinite grounded photographic stage',(0,0,-.12),(200,200,.2),m,0)
 area('Key / 3m diffusion',(-4,-3,7),1200,(5,5),color=(1,.96,.9))
 area('Tall edge reflection',(4,1,5),950,(2,5),color=(.88,.94,1))
 area('Front fill',(0,-6,3),400,(4,2))
 area('Top strip',(0,3,6),1000,(5,1))

camera_data=bpy.data.cameras.new('85mm commercial product lens');cam=bpy.data.objects.new('85mm commercial product lens',camera_data);s.collection.objects.link(cam);s.camera=cam
camera_data.lens=60;camera_data.dof.use_dof=True;camera_data.dof.aperture_fstop=8
focus=empty('Precise focal plane');camera_data.dof.focus_object=focus
root=empty('Authored product grouping')

if a.scene=='identity':
 stage(False)
 # Thick editorial book, visible paper signatures, foil mark, and two printed cards.
 book=empty('Identity editorial book');book.parent=root;book.rotation_euler.z=-.16
 box('Ivory sewn page block',(-.2,.3,.25),(2.8,2.05,.42),ivory,.018,parent=book)
 for z in [.12,.18,.24,.30,.36,.42]:box('Subtle signature line',(-.2,-.728,z),(2.75,.002,.003),gold,.001,parent=book)
 box('Cloth front cover',(-.2,.3,.484),(2.89,2.14,.045),black,.022,parent=book)
 box('Cloth back cover',(-.2,.3,.027),(2.89,2.14,.045),black,.022,parent=book)
 text('Foil masthead','SPACE',(-1.45,.15,.511),.48,white,parent=book)
 text('Book editorial line','FORM / PURPOSE / IDENTITY',(-1.42,-.1,.511),.095,white,parent=book)
 text('Book edition','STUDIO / 01',(-1.42,1.06,.511),.095,lime,parent=book)
 # Folding carton, reverse bevel, debossed geometric mark and large print.
 carton=empty('Precision carton');carton.parent=root;carton.location=(2.05,1.1,.53);carton.rotation_euler.z=.13
 box('Lime rigid box',(0,0,0),(1.15,1.25,1.05),lime,.045,parent=carton)
 box('Box lid seam',(0,0,.38),(1.165,1.265,.022),black,.025,parent=carton)
 text('Box logotype','S.',(-.32,-.636,-.2),.57,black,rot=(math.pi/2,0,0),parent=carton)
 text('Box side detail','SPACE STUDIO',(-.4,-.638,.27),.072,black,rot=(math.pi/2,0,0),parent=carton)
 for i,(x,y,z,rz) in enumerate([(-.8,-1.7,0,-.12),(.95,-1.6,.035,.2)]):
  card=empty('Cotton business card '+str(i));card.parent=root;card.location=(x,y,z);card.rotation_euler.z=rz
  box('600gsm card',(0,0,0),(1.55,.88,.025),ivory if i==0 else lime,.015,parent=card)
  text('Card identity','SPACE',(-.62,.12,.016),.24,black,parent=card)
  text('Card information','CREATIVE STUDIO / PARMA',(-.61,-.2,.016),.057,black,parent=card)
 camera_data.lens=54
 cam_start=(6,-8,7);target=(.2,0,.52);amp=.2
elif a.scene=='web':
 stage(True)
 # True metal laptop: keyboard deck, trackpad, speaker perforations, hinge and opening screen.
 root.rotation_euler.z=-.08
 box('CNC aluminium unibody',(0,0,.16),(4.2,2.8,.18),metal,.11,parent=root)
 box('Black keyboard inset',(0,.3,.262),(3.62,1.35,.025),black,.065,parent=root)
 key_labels=[['esc','F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'],['1','2','3','4','5','6','7','8','9','0','-','+','del'],['Q','W','E','R','T','Y','U','I','O','P','[',']','ret'],['A','S','D','F','G','H','J','K','L',':','@','ret','ret'],['Z','X','C','V','B','N','M',',','.','/','up','up','up']]
 for row in range(5):
  for col in range(13):
   x=-1.65+col*.274;y=.85-row*.232
   box('Individual soft touch key',(x,y,.289),(.232,.18,.035),black,.025,parent=root)
   text('Laser key legend',key_labels[row][col],(x-.045,y-.025,.309),.04,white,parent=root,extrude=0)
 box('Space bar',(0,-.3,.289),(1.48,.14,.035),black,.025,parent=root)
 for x in [-1.64,-1.36,-1.08,1.08,1.36,1.64]:box('Modifier key',(x,-.3,.289),(.23,.14,.035),black,.025,parent=root)
 box('Glass trackpad',(0,-.85,.257),(1.48,.73,.015),metal,.055,parent=root)
 for side in [-1,1]:
  for j in range(17):
   for k in range(2):cylinder('Speaker micro perforation',(side*1.97+(k-.5)*.05,-.35+j*.073,.258),.009,.004,black,parent=root)
 cylinder('Display hinge',(0,1.3,.27),.085,3.75,metal,(0,math.pi/2,0),root)
 screen=empty('Display / physically angled hinge');screen.parent=root;screen.location=(0,1.29,.25);screen.rotation_euler.x=math.radians(-13)
 box('Display aluminium rear',(0,0,1.3),(4.18,.095,2.62),metal,.075,parent=screen)
 box('Obsidian glass bezel',(0,-.058,1.3),(4.03,.018,2.48),black,.045,parent=screen)
 emission=mat('Display ivory luminous pixels',(.81,.8,.73),rough=.5);bs=emission.node_tree.nodes['Principled BSDF'];bs.inputs['Emission Color'].default_value=(.7,.69,.62,1);bs.inputs['Emission Strength'].default_value=.45
 box('Original Seta site viewport',(0,-.071,1.3),(3.87,.007,2.27),emission,.015,parent=screen)
 # Visible authored digital design, three-column editorial treatment.
 text('Site logo','seta',(-1.7,-.079,2.23),.18,black,(math.pi/2,0,0),parent=screen)
 text('Navigation','STUDIO       EXPERIENCES       CONTACT',(.35,-.079,2.26),.062,black,(math.pi/2,0,0),parent=screen)
 text('Website kicker','BEAUTY IN SIMPLICITY',(-1.7,-.079,1.98),.065,black,(math.pi/2,0,0),parent=screen)
 text('Website headline','Made to\nfeel better.',(-1.7,-.079,1.44),.25,black,(math.pi/2,0,0),parent=screen)
 text('Website body','Thoughtful rituals. Quiet confidence.\nA considered digital experience.',(-1.7,-.079,.99),.065,black,(math.pi/2,0,0),parent=screen)
 box('Site call to action',(-1.13,-.081,.65),(1.14,.006,.23),black,.018,parent=screen)
 text('Site button','DISCOVER SETA',(-1.58,-.089,.625),.065,white,(math.pi/2,0,0),parent=screen)
 sage=mat('Sage digital hero image',(.23,.32,.23),rough=.5)
 box('Sage art direction panel',(1.02,-.079,1.33),(1.23,.008,1.55),sage,.02,parent=screen)
 # Abstract cosmetic product exists as mesh within the screen and has shading.
 box('Website product still life',(1.02,-.135,1.23),(.45,.14,.78),ivory,.09,parent=screen)
 box('Website product cap',(1.02,-.135,1.69),(.47,.15,.14),black,.03,parent=screen)
 text('Website product label','S',(.93,-.215,1.23),.18,black,(math.pi/2,0,0),parent=screen)
 cylinder('Webcam',(0,-.073,2.5),.017,.004,black,(math.pi/2,0,0),screen)
 camera_data.lens=50
 cam_start=(6,-8,5.1);target=(0,.35,1.05);amp=.28
elif a.scene=='cgi':
 stage(False)
 glass=mat('Thick clear optical glass',(.97,.97,.93),rough=.075,transmission=1)
 liquid=mat('Pale amber fragrance',(.7,.42,.18),rough=.11,transmission=.82)
 frosted=mat('Satin frosted glass',(.76,.69,.56),rough=.21,transmission=.62,micro=.035)
 root.rotation_euler.z=-.13
 box('Thick walled fragrance flacon',(0,0,1.22),(1.65,.92,2.35),glass,.19,parent=root)
 box('Actual inner liquid volume',(0,0,1.1),(1.39,.69,1.96),liquid,.14,parent=root)
 cylinder('Sprayer collar',(0,0,2.46),.25,.16,gold,parent=root)
 fragrance_cap=cylinder('Sculpted satin cap',(0,0,2.85),.48,.67,black,parent=root)
 cylinder('Cap foil edge',(0,0,-.32),.48,.022,gold,parent=fragrance_cap)
 label=box('Cotton front label',(0,-.475,1.33),(1.17,.015,1.1),ivory,.015,parent=root)
 text('Fragrance label','AURA',(-.47,-.488,1.55),.26,black,(math.pi/2,0,0),parent=root)
 text('Fragrance editorial type','EAU DE PARFUM\n\nSPACE / 003',(-.45,-.488,1.2),.087,black,(math.pi/2,0,0),parent=root)
 text('Fragrance volume','50 ML',(-.45,-.488,.9),.075,gold,(math.pi/2,0,0),parent=root)
 fragrance_packaging=box('Fragrance presentation box',(-1.5,.6,1.35),(1.05,.85,2.7),black,.045,parent=root,rot=(0,0,-.14))
 text('Presentation box label','AURA',(-.43,-.426,.5),.235,gold,(math.pi/2,0,0),parent=fragrance_packaging)
 box('Travertine sample block',(1.45,.35,.09),(1.0,1.0,.19),ivory,.04,parent=root)
 cylinder('Frosted refill vessel',(1.45,.35,.71),.38,1.05,frosted,parent=root)
 cylinder('Refill metal lid',(1.45,.35,1.27),.385,.1,gold,parent=root)
 # Clear suspended macro drop, no simulation claim, asymmetrical teardrop mesh.
 bpy.ops.mesh.primitive_uv_sphere_add(segments=64,ring_count=48,radius=.27,location=(1.45,.35,2.0));drop=bpy.context.object;drop.name='Authored glass fragrance droplet';drop.scale=(.72,.72,1.7);drop.data.materials.append(glass);drop.parent=root
 for f in drop.data.polygons:f.use_smooth=True
 camera_data.lens=50
 cam_start=(5.5,-8.4,4.6);target=(0,0,1.55);amp=.2
else:
 stage(True)
 # Precision over-ear headphones: thick leather earpads, metal yokes, crowned headband and controls.
 root.rotation_euler.z=.08
 leather=mat('Charcoal leather micrograin',(.014,.018,.021),rough=.43,micro=.18)
 band=[]
 for i in range(13):
  t=math.pi*i/12
  band.append((1.22*math.cos(t),.08,1.55+1.47*math.sin(t)))
 curve('Curved padded headband',band,.16,leather,root)
 curve('Anodised structural band',[(x,y+.08,z+.05) for x,y,z in band],.09,metal,root)
 for side in [-1,1]:
  ear=empty('Left driver' if side<0 else 'Right driver');ear.parent=root;ear.location=(side*1.19,0,1.32);ear.rotation_euler.y=side*.11
  shell=cylinder('Machined oval driver shell',(0,.03,0),.5,.72,metal,(math.pi/2,0,0),ear);shell.scale=(.68,1.17,1)
  face=cylinder('Satin oval driver face',(0,-.345,0),.465,.08,black,(math.pi/2,0,0),ear);face.scale=(.67,1.14,1)
  cushion=cylinder('Supple leather ear cushion',(0,.44,0),.47,.23,leather,(math.pi/2,0,0),ear);cushion.scale=(.67,1.13,1)
  cloth=cylinder('Inset cushion acoustic cloth',(0,.567,0),.32,.015,black,(math.pi/2,0,0),ear);cloth.scale=(.62,1.12,1)
  cylinder('Rotating yoke hinge',(0,0,.67),.145,.16,chrome,(0,math.pi/2,0),ear)
  curve('Brushed curved yoke',[(0,.03,.7),(side*.16,.05,.43),(side*.25,.05,.02)],.045,metal,ear)
  text('Driver Space emblem','S',(-.13,-.39,-.06),.29,white,(math.pi/2,0,0),parent=ear)
  for i in range(5):cylinder('Driver acoustic vent',(-.17+i*.085,-.391,.31),.012,.004,black,(math.pi/2,0,0),ear)
  box('Tactile volume rocker',(side*.32,-.1,-.24),(.035,.23,.07),black,.02,parent=ear)
 # Product display on dark stone and an actual portrait campaign lightbox in another plane.
 box('Product plinth',(-.15,0,.12),(3.6,1.9,.24),black,.12,parent=root)
 curve('Minimal grounded headphone support',[(0,.65,.25),(0,.65,2.75),(0,.48,2.85),(0,.12,2.85)],.045,metal,root)
 ad=empty('Portrait campaign lightbox');ad.parent=root;ad.location=(2.45,.7,1.8);ad.rotation_euler.z=-.1
 box('Grounded lightbox base',(0,0,-1.75),(1.3,.75,.14),black,.055,parent=ad)
 box('Lightbox support stem',(0,.015,-1.61),(.24,.16,.28),metal,.025,parent=ad)
 box('Lightbox aluminium frame',(0,0,0),(1.62,.1,3.2),metal,.065,parent=ad)
 luminous=mat('Chartreuse luminous campaign',(.66,.9,.005),rough=.4);bs=luminous.node_tree.nodes['Principled BSDF'];bs.inputs['Emission Color'].default_value=(.4,.65,.001,1);bs.inputs['Emission Strength'].default_value=.13
 box('Original campaign artwork',(0,-.06,0),(1.5,.01,3.07),luminous,.02,parent=ad)
 text('Campaign brand','SPACE',(-.62,-.075,1.23),.18,black,(math.pi/2,0,0),parent=ad)
 text('Campaign headline','FEEL\nEVERY\nFREQUENCY.',(-.62,-.075,.18),.20,black,(math.pi/2,0,0),parent=ad)
 text('Campaign copy','SOUND THAT MOVES YOU.\n\nA NEW CREATIVE FREQUENCY.',(-.62,-.075,-.58),.067,black,(math.pi/2,0,0),parent=ad)
 box('Campaign call to action',(0,-.075,-1.05),(1.14,.007,.26),black,.025,parent=ad)
 text('Campaign CTA','DISCOVER THE DROP',(-.49,-.084,-1.08),.07,white,(math.pi/2,0,0),parent=ad)
 cam_start=(7.8,-10.8,5.2);target=(.6,0,1.55);amp=.14

focus.location=target
loop=[]
base_rotation=root.rotation_euler.z
base_card=card.location.copy() if a.scene=='identity' else None
base_screen=screen.rotation_euler.x if a.scene=='web' else None
cap=bpy.data.objects.get('Sculpted satin cap')
base_cap=cap.location.z if cap else None
ears=[obj for obj in bpy.data.objects if obj.name in ['Left driver','Right driver']]
for frame in range(1,122):
 phase=2*math.pi*(frame-1)/120
 cam.location=(cam_start[0]+amp*math.sin(phase),cam_start[1]+amp*.45*(1-math.cos(phase)),cam_start[2]+amp*.35*math.sin(phase))
 look(cam,target)
 cam.keyframe_insert(data_path='location',frame=frame);cam.keyframe_insert(data_path='rotation_euler',frame=frame)
 root.rotation_euler.z=base_rotation+math.sin(phase)*.10
 root.keyframe_insert(data_path='rotation_euler',frame=frame)
 if a.scene=='identity':
  card.location.z=base_card.z+(1-math.cos(phase))*.18
  card.rotation_euler.z=.2+math.sin(phase)*.18
  card.keyframe_insert(data_path='location',frame=frame);card.keyframe_insert(data_path='rotation_euler',frame=frame)
 if a.scene=='web':
  screen.rotation_euler.x=base_screen+(1-math.cos(phase))*.065
  screen.keyframe_insert(data_path='rotation_euler',frame=frame)
 if a.scene=='cgi':
  cap.location.z=base_cap+(1-math.cos(phase))*.15
  cap.keyframe_insert(data_path='location',frame=frame)
 if a.scene=='campaigns':
  ad.rotation_euler.z=-.1+math.sin(phase)*.10
  ad.keyframe_insert(data_path='rotation_euler',frame=frame)
  for ear in ears:
   ear.rotation_euler.z=math.sin(phase)*(.13 if ear.name=='Left driver' else -.13)
   ear.keyframe_insert(data_path='rotation_euler',frame=frame)
 if a.scene=='cgi':
  drop.location.z=2.0+math.sin(phase)*.12;drop.keyframe_insert(data_path='location',frame=frame)
 if frame in [1,121]:
  loop.append([[*obj.location,*obj.rotation_euler,*obj.scale] for obj in s.objects if obj.animation_data])
looperror=max(abs(x-y) for first,last in zip(*loop) for x,y in zip(first,last))
assert looperror<1e-7
s.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(out/f'{a.scene}.blend'))
info={'service':a.scene,'engine':a.engine,'blender':bpy.app.version_string,'samples':a.samples,'denoising_device':'CPU OIDN' if a.engine=='CYCLES' else None,'tile_size':1024 if a.engine=='CYCLES' else None,'persistent_data':s.render.use_persistent_data,'raytrace_internal_resolution_scale':(2 if a.scene=='identity' else 4) if a.engine=='BLENDER_EEVEE' else None,'shadow_pool_mb':(1024 if a.scene=='campaigns' else 512) if a.engine=='BLENDER_EEVEE' else None,'resolution':[s.render.resolution_x,s.render.resolution_y],'fps':60,'frames':120,'duration':2,'render_range':[int(x) for x in a.frames.split(':')],'purposeful_motion':{'identity':'Cotton card lifts and fans with a restrained product turntable','web':'Laptop display opens on its actual hinge while camera arcs','cgi':'Fragrance cap separates and returns, suspended glass droplet moves smoothly','campaigns':'Headphone drivers swivel around their yokes while portrait campaign display turns'}[a.scene],'native_render':True,'interpolation_or_upscale':False,'loop_error':looperror,'geometry':'Original authored Blender meshes, text, curves and studio lighting','materials':'PBR metal, leather, cotton, glass and ink; procedural micro roughness','external_assets':False,'paid_services':False,'model_weights':False,'preview':a.preview,'benchmark':a.benchmark}
(out/('preview-manifest.json' if a.preview else 'render-manifest.json')).write_text(json.dumps(info,indent=2)+'\n')
start=time.monotonic()
if a.preview:
 s.frame_set(a.pose);s.render.filepath=str(out/('preview.png' if a.pose==1 else f'preview-{a.pose:04d}.png'));bpy.ops.render.render(write_still=True)
elif a.benchmark:
 s.render.filepath=str(out/'benchmark.png');bpy.ops.render.render(write_still=True)
else:
 frames=out/'frames';frames.mkdir(exist_ok=True)
 lo,hi=map(int,a.frames.split(':'))
 for frame in range(lo,hi+1):
  target=frames/f'frame_{frame:04d}.png'
  if a.resume and target.exists() and target.stat().st_size>=36:
   with target.open('rb') as existing:
    header=existing.read(24);existing.seek(-12,2);footer=existing.read()
   if header[:8]==b'\x89PNG\r\n\x1a\n' and [int.from_bytes(header[16:20],'big'),int.from_bytes(header[20:24],'big')]==[3840,2160] and footer==b'\x00\x00\x00\x00IEND\xaeB`\x82':
    print('FOUR_RESUME',a.scene,frame,'valid native frame retained',flush=True)
    continue
  s.frame_set(frame);s.render.filepath=str(target);bpy.ops.render.render(write_still=True)
  (out/'progress.json').write_text(json.dumps({'service':a.scene,'last_completed_frame':frame,'total_frames':120,'elapsed_seconds':round(time.monotonic()-start,3)})+'\n')
  print('FOUR_FRAME',a.scene,frame,'elapsed',round(time.monotonic()-start,2),flush=True)
info['elapsed_seconds']=time.monotonic()-start
(out/('preview-manifest.json' if a.preview else 'render-manifest.json')).write_text(json.dumps(info,indent=2)+'\n')
print('FOUR_RENDER_RESULT',json.dumps(info))
