"""SHIFT PHASE 01. Original studio instrument and photographic source views."""
import bpy
import math
import sys
from mathutils import Vector
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs/flagship-20261106/shift'
OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 28
scene.cycles.use_denoising = True
scene.cycles.max_bounces = 5
scene.render.threads_mode = 'FIXED'
scene.render.threads = 5
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.view_settings.view_transform = 'AgX'
scene.view_settings.look = 'AgX - Medium High Contrast'
world = bpy.data.worlds.new('Soft studio ambient')
scene.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (.55,.60,.65,1)
world.node_tree.nodes['Background'].inputs[1].default_value = .38

def linear(h):
    n = [int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in n)+(1,)

def material(name,h,metal=0,rough=.36,light=0,brushed=False):
    m = bpy.data.materials.new(name)
    m.diffuse_color = linear(h)
    m.use_nodes=True
    bs = m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value = linear(h)
    bs.inputs['Metallic'].default_value=metal
    bs.inputs['Roughness'].default_value=rough
    if light:
        bs.inputs['Emission Color'].default_value=linear(h)
        bs.inputs['Emission Strength'].default_value=light
    if brushed:
        nt=m.node_tree
        tex=nt.nodes.new('ShaderNodeTexCoord')
        v=nt.nodes.new('ShaderNodeVectorMath');v.operation='MULTIPLY'
        v.inputs[1].default_value=(2,180,2)
        nt.links.new(tex.outputs['Generated'],v.inputs[0])
        noise=nt.nodes.new('ShaderNodeTexNoise');noise.inputs['Scale'].default_value=5.4
        nt.links.new(v.outputs[0],noise.inputs['Vector'])
        bump=nt.nodes.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.13;bump.inputs['Distance'].default_value=.0028
        nt.links.new(noise.outputs['Fac'],bump.inputs['Height']);nt.links.new(bump.outputs['Normal'],bs.inputs['Normal'])
    return m

chassis=material('Vapour blasted aluminium','aeb3b2',.82,.28,brushed=True)
panel=material('Directional brushed platinum','c3c6c1',.72,.36,brushed=True)
edge=material('Machined bright chamfer','c8cdd0',.92,.21)
graphite=material('Graphite anodising','24292b',.65,.29)
rubber=material('Graphite elastomer','202224',0,.54)
ink=material('Silk-screen carbon','292b28',.08,.43)
legend=material('Warm precision legends','e1e4d3',.1,.42)
amber=material('Ember silicone','eb6031',.02,.41)
strong=material('Active ember pad','ff9b52',.03,.37,.09)
clay=material('Burnt sienna silicone','bf4830',.02,.45)
screen=material('Polarised OLED','111d1b',.13,.23)
lime=material('Phosphor display','cad956',.08,.38,1.25)
fine=material('OLED secondary grid','3c4f41',.15,.32,.16)
studio=material('Studio sweep','758482',.04,.63)
mono=bpy.data.fonts.load(str(ROOT/'public/fonts/DMMono-Regular.ttf'))

def finish(ob,name,mat):
    ob.name=name;ob.data.materials.append(mat)
    return ob

def bevel(ob,r,segments=4):
    if r<=0:return
    b=ob.modifiers.new('Machined radius','BEVEL');b.width=r;b.segments=segments
    b=ob.modifiers.new('Face weighted normals','WEIGHTED_NORMAL')
    b.keep_sharp=True

def box(name,xyz,dims,mat,r=.02):
    bpy.ops.mesh.primitive_cube_add(size=1,location=xyz)
    ob=bpy.context.object;ob.dimensions=dims
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    bevel(ob,r);return finish(ob,name,mat)

def cyl(name,x,y,z,r,h,mat,segments=64):
    bpy.ops.mesh.primitive_cylinder_add(vertices=segments,radius=r,depth=h,location=(x,y,z))
    ob=bpy.context.object
    for poly in ob.data.polygons:poly.use_smooth=len(poly.vertices)==4
    bevel(ob,min(h*.20,r*.10),3)
    return finish(ob,name,mat)

def ring(name,x,y,z,r,t,mat):
    bpy.ops.mesh.primitive_torus_add(major_segments=100,minor_segments=7,location=(x,y,z),major_radius=r,minor_radius=t)
    ob=bpy.context.object
    for poly in ob.data.polygons:poly.use_smooth=True
    return finish(ob,name,mat)

def tube(name,pts,mat,rad=.009):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=1
    s=cu.splines.new('POLY');s.points.add(len(pts)-1)
    for p,v in zip(s.points,pts):p.co=(*v,1)
    cu.bevel_depth=rad;cu.bevel_resolution=2
    ob=bpy.data.objects.new(name,cu);scene.collection.objects.link(ob);return finish(ob,name,mat)

def label(body,x,y,z,size,mat=ink,align='LEFT'):
    cu=bpy.data.curves.new(body,'FONT');cu.body=body;cu.font=mono;cu.size=size
    cu.align_x=align;cu.align_y='CENTER'
    ob=bpy.data.objects.new(body,cu);scene.collection.objects.link(ob);ob.location=(x,y,z);return finish(ob,body,mat)

def knob(name,x,y,z,r,h,cap,teeth):
    verts=[];faces=[];n=teeth*4
    profile=[(.00,.95),(.05,1),(.83,1),(.96,.955),(1,.89)]
    for hh,rr in profile:
        for j in range(n):
            a=2*math.pi*j/n;tooth=1 if j%4 in (1,2) else .968
            verts.append((x+r*rr*tooth*math.cos(a),y+r*rr*tooth*math.sin(a),z+h*hh))
    for k in range(len(profile)-1):
        for j in range(n):
            faces.append((k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j))
    faces.append(tuple(reversed(range(n))));faces.append(tuple(range((len(profile)-1)*n,len(profile)*n)))
    mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],faces)
    ob=bpy.data.objects.new(name,mesh);scene.collection.objects.link(ob);finish(ob,name,edge)
    cyl(name+' inset',x,y,z+h+.005,r*.87,.018,cap,segments=100)
    return ob

def area(name,xyz,power,size,target,tint=(1,1,1),height=None):
    li=bpy.data.lights.new(name,'AREA');li.energy=power;li.shape='RECTANGLE';li.size=size;li.size_y=height or size;li.color=tint
    ob=bpy.data.objects.new(name,li);scene.collection.objects.link(ob);ob.location=xyz
    ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()

# The deck floats on a dark polymer lower shell, with real feet and metal seams.
for x in (-2.60,2.60):
    for y in (-1.47,1.47):cyl('Neoprene isolation foot',x,y,.082,.18,.164,rubber)
box('Lower pressure casting',(0,0,.28),(6.55,4.08,.32),graphite,.15)
box('Machined upper chassis',(0,0,.45),(6.70,4.16,.31),chassis,.135)
box('Shadow line below faceplate',(0,0,.604),(6.60,4.08,.045),graphite,.09)
box('Brushed faceplate',(0,0,.649),(6.62,4.10,.072),panel,.075)
Z=.686
for x in (-3.20,3.20):
    for y in (-1.93,1.93):
        cyl('Countersunk fastener',x,y,Z+.003,.043,.010,graphite,32)
        tube('Torx screw slot',[(x-.023,y-.007,Z+.009),(x+.023,y+.007,Z+.009)],chassis,.004)
# Front jack bezels, ventilation and two actual concentric TRS jack openings.
for x in (2.43,2.88):
    for r,h,ma,yy in ((.139,.053,edge,-2.083),(.095,.056,graphite,-2.100),(.055,.055,rubber,-2.115)):
        ob=cyl('Front TRS socket',x,yy,.44,r,h,ma);ob.rotation_euler.x=math.pi/2
for j in range(23):
    box('Cooling louvre',(-2.96+j*.116,-2.072,.414),(.057,.022,.096),rubber,.013)
for j in range(13):
    box('Rear vent slot',(-.35+j*.12,1.834,Z+.003),(.052,.18,.009),graphite,.012)
label('SHIFT',-3.025,1.76,Z+.009,.335)
label('PHASE 01',-1.66,1.76,Z+.009,.235)
label('STEREO SAMPLER',2.98,1.82,Z+.009,.095,ink,'RIGHT')
# Sixteen backlit performance pads with a dark moulded recess and individual legends.
box('Pad matrix recess',(-1.837,-.44,Z+.006),(2.52,2.55,.043),graphite,.068)
for row in range(4):
    for col in range(4):
        x=-2.756+col*.614;y=-1.357+row*.61
        num=row*4+col+1
        mat=strong if num in (1,6,11) else clay if num in (4,8,12,16) else amber
        box('Performance pad %02d'%num,(x,y,Z+.071),(.555,.545,.139),mat,.075)
        label('%02d'%num,x-.182,y-.135,Z+.141,.072,ink)
label('PERFORMANCE',-3.026,-1.833,Z+.008,.081)
label('A  /  01—16',-.589,-1.833,Z+.008,.081,ink,'RIGHT')
# Four bank selectors and the playhead LED scale.
for j,bank in enumerate('ABCD'):
    x=-2.77+j*.62
    box('Bank '+bank,(x,1.195,Z+.047),(.465,.205,.079),graphite,.043)
    label(bank,x,1.193,Z+.089,.084,legend,'CENTER')
for j in range(16):
    x=-3.005+j*.159
    box('Step lamp %02d'%j,(x,.927,Z+.018),(.103,.045,.025),lime if j in (0,4,8,12) else rubber,.009)
box('Controls separation rule',(-.413,-.19,Z+.008),(.014,3.21,.008),graphite,.002)
# The OLED is an actual inset glass panel with a vector display beneath the frame.
box('OLED gasket',(1.36,1.006,Z+.011),(3.20,1.216,.037),graphite,.071)
box('OLED glass',(1.36,1.006,Z+.034),(3.108,1.126,.025),screen,.051)
SZ=Z+.051
label('01  /  TAPE GRAIN',-.070,1.389,SZ,.105,legend)
label('128.0',2.773,1.389,SZ,.113,lime,'RIGHT')
label('STEREO   48K',-.065,.604,SZ,.071,legend);label('1:04:12',2.772,.604,SZ,.073,lime,'RIGHT')
for j in range(29):
    x=-.041+j*.097
    tube('Display grid',[(x,.753,SZ),(x,1.281,SZ)],fine,.0028)
for j in range(3):
    y=.810+j*.185;tube('Display grid',[(-.061,y,SZ),(2.82,y,SZ)],fine,.0028)
for j in range(172):
    u=j/171;x=-.062+u*2.875
    env=(.28+.72*abs(math.sin(u*8.5+.7))**.9)*(.56+.44*abs(math.sin(u*48.3)))
    amp=.218*env*(.32+.68*abs(math.sin(j*2.01+math.sin(j*.46)*3.3)))
    tube('Stereo waveform',[(x,1.047-amp,SZ+.006),(x,1.047+amp,SZ+.006)],lime,.006)
tube('Display playhead',[(1.26,.755,SZ+.012),(1.26,1.270,SZ+.012)],legend,.008)
# Precision rotary encoders surrounding a machined main wheel.
for j,(x,y,name) in enumerate([(-.065,-.122,'TUNE'),(.643,-.122,'LEVEL'),(-.065,-.993,'FILTER'),(.643,-.993,'DRIVE')]):
    cyl(name+' base',x,y,Z+.026,.221,.045,graphite)
    knob(name,x,y,Z+.049,.18,.196,graphite,30)
    t=.8+j*.8
    tube(name+' index',[(x+.084*math.cos(t),y+.084*math.sin(t),Z+.267),(x+.148*math.cos(t),y+.148*math.sin(t),Z+.267)],legend,.010)
    label(name,x,y-.310,Z+.010,.081,ink,'CENTER')
cx,cy=1.956,-.53
cyl('Encoder black bearing',cx,cy,Z+.031,.752,.064,graphite,120)
ring('Encoder perimeter highlight',cx,cy,Z+.068,.696,.021,edge)
knob('Inertial encoder wheel',cx,cy,Z+.077,.653,.167,graphite,84)
for i in range(4):
    ring('Concentric dial machining',cx,cy,Z+.264,.431+i*.025,.0038,edge)
cyl('Wheel index insert',cx+.295,cy+.295,Z+.267,.055,.012,amber)
for j in range(25):
    a=math.pi*.2+j*math.pi*1.6/24
    tube('Wheel calibration',[(cx+.763*math.cos(a),cy+.763*math.sin(a),Z+.010),(cx+.816*math.cos(a),cy+.816*math.sin(a),Z+.010)],ink,.005 if j%3 else .009)
label('SAMPLE / SCRUB',cx,cy-.927,Z+.009,.079,ink,'CENTER')
# Transport controls, fader and a silkscreened channel index.
for j,txt in enumerate(['REC','STOP','PLAY']):
    x=-.002+j*.47
    box('Transport '+txt,(x,-1.716,Z+.036),(.39,.182,.065),amber if j==0 else graphite,.032)
    label(txt,x,-1.713,Z+.071,.067,ink if j==0 else legend,'CENTER')
box('Output fader track',(2.974,-.659,Z+.010),(.074,1.68,.032),rubber,.029)
for j in range(11):
    y=-1.420+j*.153;box('Fader graduation',(2.834,y,Z+.008),(.078 if j%2==0 else .043,.011,.010),ink,.002)
box('Output fader carriage',(2.976,-.432,Z+.097),(.309,.216,.163),graphite,.04)
box('Fader index',(2.977,-.432,Z+.182),(.252,.022,.012),legend,.004)
label('OUT',2.968,-1.712,Z+.010,.078,ink,'CENTER')
# Ground and large photographic cards. Contact shadows are ray traced.
box('Seamless studio sweep',(0,0,-.113),(200,200,.22),studio,.01)
area('North window',(-4.5,-3.7,8.0),940,6.5,(0,0,0),(1,.90,.78),4.5)
area('Broad cool rim',(3.0,4.8,6.3),1150,6.0,(0,0,.6),(.77,.87,1),2.4)
area('Long frontal strip',(-3,-5,1.90),160,5,(0,0,.6),(1,.98,.92),.85)
area('Encoder edge',(5.2,-.45,4.0),360,3.0,(1,0,.8),(1,.84,.61),1.8)
cam_data=bpy.data.cameras.new('Product camera')
cam=bpy.data.objects.new('Product camera',cam_data);scene.collection.objects.link(cam);scene.camera=cam

def pose(position,target,lens):
    cam.location=position;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler()
    cam.data.lens=lens;cam.data.sensor_width=36
    cam.data.dof.use_dof=False

def render(name,w,h,pos,at,lens):
    pose(pos,at,lens)
    scene.render.resolution_x=w;scene.render.resolution_y=h
    scene.render.filepath=str(OUT/(name+'.png'))
    bpy.ops.render.render(write_still=True)

pose((5.25,-7.6,9.05),(0,0,.44),48)
scene.render.resolution_x=1800;scene.render.resolution_y=1350
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'phase-01.blend'))
render('phase-hero',1800,1350,(5.25,-7.6,9.05),(0,0,.44),47)
render('phase-overhead',1800,1350,(.08,-.19,11.55),(0,0,.45),48)
render('phase-detail',1620,1080,(3.55,-4.78,5.15),(1.13,-.02,.76),72)
print('SHIFT PHASE 01: 3 finished Cycles CPU views and packed master')
