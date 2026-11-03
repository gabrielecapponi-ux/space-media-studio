"""Original ORA product and project-dossier motion studies, authored in Blender.

Run on an isolated background process. Masters/PNGs stay in ignored outputs.
blender --background --factory-startup --python scripts/render-service-scenes-b.py -- --scene product --mode proof --engine CYCLES --device METAL --samples 32
"""
import argparse, bpy, hashlib, json, math, struct, subprocess, sys, time
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'outputs/motion-services/b'
p = argparse.ArgumentParser()
p.add_argument('--scene', choices=['product', 'funding'], required=True)
p.add_argument('--mode', choices=['proof', 'render', 'encode', 'build'], default='proof')
p.add_argument('--frames', default='1:72')
p.add_argument('--samples', type=int)
p.add_argument('--engine', choices=['BLENDER_EEVEE','CYCLES'])
p.add_argument('--device', choices=['CPU','METAL'], default='CPU')
args = p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
args.engine=args.engine or ('CYCLES' if args.scene=='product' else 'BLENDER_EEVEE')
args.samples=args.samples or (32 if args.scene=='product' else 64)
folder = OUT / args.scene
folder.mkdir(parents=True, exist_ok=True)
FRAMES = 72

def srgb(hex):
    v=[int(hex.strip('#')[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(n/12.92 if n <= .04045 else ((n+.055)/1.055)**2.4 for n in v)+(1,)

def mat(name, color, rough=.35, metal=0, coat=0, transmission=0):
    m=bpy.data.materials.new(name); m.use_nodes=True
    bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=srgb(color)
    bs.inputs['Roughness'].default_value=rough
    bs.inputs['Metallic'].default_value=metal
    bs.inputs['Coat Weight'].default_value=coat
    bs.inputs['Transmission Weight'].default_value=transmission
    bs.inputs['IOR'].default_value=1.47
    if transmission:
        m.use_raytrace_refraction=True
        m.use_screen_refraction=True
        m.thickness_mode='SLAB'
        m.refraction_depth=.12
    return m

def noise_bump(m, scale=150, distance=.012, strength=.12):
    n=m.node_tree.nodes; l=m.node_tree.links
    noise=n.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value=scale
    bump=n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=strength; bump.inputs['Distance'].default_value=distance
    l.new(noise.outputs['Fac'],bump.inputs['Height']);l.new(bump.outputs['Normal'],n.get('Principled BSDF').inputs['Normal'])

def aim(o, target): o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()

def block(name, dims, pos, m, bevel=.03, segments=5, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    o=bpy.context.object; o.name=name; o.dimensions=dims
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        b=o.modifiers.new('Machined / finished edge','BEVEL');b.width=bevel;b.segments=segments
        b.affect='EDGES'; bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
        for face in o.data.polygons:face.use_smooth=True
        n=o.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL');n.keep_sharp=True
    if m:o.data.materials.append(m)
    o.parent=parent
    return o

def text(name, body, size, pos, m, font, parent=None, rotation=(0,0,0), align='LEFT', extrude=.0005):
    c=bpy.data.curves.new(name,'FONT');c.body=body;c.font=font;c.size=size;c.space_character=1.03;c.align_x=align;c.extrude=extrude;c.bevel_depth=.0002;c.bevel_resolution=1
    o=bpy.data.objects.new(name,c);bpy.context.scene.collection.objects.link(o);o.location=pos;o.rotation_euler=rotation;o.data.materials.append(m);o.parent=parent
    return o

def area(name, loc, power, size, target, color='#ffffff', size_y=None):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='RECTANGLE';d.size=size;d.size_y=size_y or size;d.color=srgb(color)[:3]
    o=bpy.data.objects.new(name,d);bpy.context.scene.collection.objects.link(o);o.location=loc;aim(o,target);return o

def available_gib():
    try:
        raw=subprocess.check_output(['vm_stat'],text=True);page=int(raw.split('page size of ')[1].split(' bytes')[0]);counts={}
        for line in raw.splitlines()[1:]:
            if ':' in line:
                k,v=line.split(':',1)
                try:counts[k]=int(v.strip().strip('.'))
                except ValueError:pass
        return sum(counts.get(k,0) for k in ['Pages free','Pages inactive','Pages speculative'])*page/1024**3
    except Exception:return None

def pixel_pair(first, second):
    """Read actual PNG pixels externally; transforms cannot detect GPU material loss."""
    code="from PIL import Image,ImageChops,ImageStat; import json,sys; a=Image.open(sys.argv[1]).convert('RGB'); b=Image.open(sys.argv[2]).convert('RGB'); rgb=ImageStat.Stat(ImageChops.difference(a,b)).mean; print(json.dumps({'rgb':rgb,'mean':sum(rgb)/3}))"
    return json.loads(subprocess.check_output(['python3','-c',code,str(first),str(second)],text=True))

def guard_sequence():
    first=folder/'frames/0001.png';previous=first;adjacent=[]
    for frame in range(2,73):
        current=folder/'frames'/f'{frame:04}.png'
        result=pixel_pair(previous,current);adjacent.append({'from':frame-1,'to':frame,**result});previous=current
    seam=pixel_pair(previous,first)
    receipt={'method':'Mean absolute RGB difference of native display PNGs, 0–255 scale','threshold_mean_rgb':3.0,'adjacent_pairs':adjacent,'maximum_adjacent_mean_rgb':max(r['mean'] for r in adjacent),'loop_seam_72_to_1':seam}
    receipt['passed']=receipt['maximum_adjacent_mean_rgb']<3 and seam['mean']<3
    (folder/'native-pixel-continuity.json').write_text(json.dumps(receipt,indent=2)+'\n')
    if not receipt['passed']:raise RuntimeError(f'Native optical continuity failed: adjacent={receipt["maximum_adjacent_mean_rgb"]}, seam={seam}')
    return receipt

def encode():
    master=folder/f'service-{args.scene}-master.blend'
    bpy.ops.wm.open_mainfile(filepath=str(master))
    s=bpy.context.scene
    names=['Cinematic camera','Moving key strip','Assembly']+(['Quiet cap assembly'] if args.scene=='product' else ['Plan layer 1','Plan layer 2','Plan layer 3'])
    poses={}
    for frame in [1,25,49,73]:
        s.frame_set(frame);bpy.context.view_layer.update()
        poses[frame]=[[v for row in bpy.data.objects[name].matrix_world for v in row] for name in names]
    closure=max(abs(x-y) for a,b in zip(poses[1],poses[73]) for x,y in zip(a,b))
    change=max(abs(x-y) for a,b in zip(poses[1],poses[25]) for x,y in zip(a,b))
    if closure>.0001 or change<.05:raise RuntimeError(f'Invalid periodic motion: {closure}, {change}')
    deps=bpy.context.evaluated_depsgraph_get()
    descendants=list(bpy.data.objects['Assembly'].children_recursive)
    margins={'left':1.,'right':1.,'bottom':1.,'top':1.}
    anchor=bpy.data.objects['ORA / thick glass vessel' if args.scene=='product' else 'Citron cloth dossier cover']
    ground=bpy.data.objects['Continuous graphite studio' if args.scene=='product' else 'Continuous paper studio']
    ground_top=max((ground.matrix_world@v.co).z for v in ground.evaluated_get(deps).data.vertices)
    contact_gaps=[]
    for frame in range(1,73):
        s.frame_set(frame);bpy.context.view_layer.update()
        contact_gaps.append(min((anchor.matrix_world@v.co).z for v in anchor.evaluated_get(deps).data.vertices)-ground_top)
        for ob in descendants:
            if ob.type not in {'MESH','FONT'}:continue
            evaluated=ob.evaluated_get(deps)
            for corner in evaluated.bound_box:
                ndc=world_to_camera_view(s,s.camera,evaluated.matrix_world@Vector(corner))
                margins['left']=min(margins['left'],ndc.x);margins['right']=min(margins['right'],1-ndc.x)
                margins['bottom']=min(margins['bottom'],ndc.y);margins['top']=min(margins['top'],1-ndc.y)
    if min(margins.values())<.035:raise RuntimeError(f'Unsafe framing: {margins}')
    if max(abs(gap) for gap in contact_gaps)>.00001:raise RuntimeError(f'Animated anchor lost physical contact: {contact_gaps}')
    missing=[n for n in range(1,73) if not (folder/'frames'/f'{n:04}.png').exists()]
    if missing:raise RuntimeError(f'Missing frames: {missing}')
    optical=guard_sequence()
    dest=ROOT/'public/films'/f'service-{args.scene}.mp4';poster=ROOT/'public/images'/f'service-{args.scene}.jpg'
    subprocess.run(['ffmpeg','-v','error','-y','-framerate','24','-i',str(folder/'frames/%04d.png'),'-frames:v','72','-vf','scale=out_color_matrix=bt709:out_range=tv,format=yuv420p','-color_primaries','bt709','-color_trc','iec61966-2-1','-colorspace','bt709','-c:v','libx264','-threads','4','-preset','slow','-crf','18','-profile:v','high','-level','4.1','-pix_fmt','yuv420p','-g','48','-movflags','+faststart','-an',str(dest)],check=True)
    subprocess.run(['ffmpeg','-v','error','-y','-i',str(folder/'frames/0001.png'),'-q:v','2','-frames:v','1',str(poster)],check=True)
    subprocess.run(['ffmpeg','-v','error','-i',str(dest),'-f','null','-'],check=True)
    stream=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(dest)],text=True))
    data=dest.read_bytes();atoms={};position=0
    while position+8<=len(data):
        size,kind=struct.unpack('>I4s',data[position:position+8]);atoms.setdefault(kind.decode('ascii',errors='replace'),position)
        if size==1:size=struct.unpack('>Q',data[position+8:position+16])[0]
        if size==0:break
        if size<8:raise RuntimeError('Invalid MP4 atom size')
        position+=size
    faststart=atoms.get('moov',len(data))<atoms.get('mdat',0)
    if not faststart:raise RuntimeError(f'MP4 is not faststart: {atoms}')
    check={'reimport':'passed','master':str(master.relative_to(ROOT)),'objects':len(s.objects),'mesh_objects':sum(o.type=='MESH' for o in s.objects),'mesh_vertices':sum(len(o.data.vertices) for o in s.objects if o.type=='MESH'),'loop_transform_error':closure,'transform_change':change,'poses':[1,25,49,73],'projected_safe_margins_all_72_poses':margins,'maximum_anchor_contact_gap_all_72_poses':max(abs(gap) for gap in contact_gaps),'native_pixel_continuity':{'passed':optical['passed'],'maximum_adjacent_mean_rgb':optical['maximum_adjacent_mean_rgb'],'loop_seam_72_to_1':optical['loop_seam_72_to_1']},'full_decode':'passed','faststart_verified':faststart,'mp4_top_level_atom_offsets':atoms,'ffprobe':stream,'files':[]}
    for f in [dest,poster]:check['files'].append({'path':str(f.relative_to(ROOT)),'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
    (folder/'validation.json').write_text(json.dumps(check,indent=2)+'\n')
    print(json.dumps(check),flush=True)

if args.mode=='encode':encode();sys.exit(0)

bpy.ops.wm.read_factory_settings(use_empty=True)
s=bpy.context.scene;s.render.engine=args.engine;s.eevee.taa_render_samples=args.samples;s.eevee.use_raytracing=True;s.eevee.ray_tracing_options.resolution_scale='1'
if args.engine=='CYCLES':
    s.cycles.samples=args.samples;s.cycles.use_denoising=True;s.render.use_persistent_data=False;s.cycles.max_bounces=10;s.cycles.transmission_bounces=8
    if args.device=='METAL':
        prefs=bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type='METAL';prefs.get_devices()
        # Optimized/persistent Metal state lost glass shading at frame45 on this
        # device. Generic kernels and fresh scene data preserve optical continuity.
        prefs.kernel_optimization_level='OFF'
        for device in prefs.devices:device.use=device.type=='METAL'
        if not any(device.type=='METAL' and device.use for device in prefs.devices):raise RuntimeError('No active Metal device; refusing to pretend GPU render')
        s.cycles.device='GPU'
s.render.fps=24;s.frame_start=1;s.frame_end=FRAMES
s.render.resolution_x=1440;s.render.resolution_y=900;s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG';s.render.image_settings.color_mode='RGB';s.render.image_settings.color_depth='8';s.render.film_transparent=False
s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast'
s.world=bpy.data.worlds.new('Photographic studio');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs['Color'].default_value=srgb('#ccccca' if args.scene=='funding' else '#101713');s.world.node_tree.nodes['Background'].inputs['Strength'].default_value=.3
paper=mat('Warm cotton paper','#f3f0e7',.63);noise_bump(paper,230,.007,.14)
yellow=mat('Space citron lacquer','#dfff00',.3,0,.18)
ink=mat('Graphite ink','#171b18',.43)
black=mat('Satin graphite cap','#111613',.24,.25,.3);noise_bump(black,260,.005,.07)
chrome=mat('Pale brushed brass collar','#c7ae72',.18,.88,.12)
font=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial.ttf')
bold=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Arial Bold.ttf')
serif=bpy.data.fonts.load('/System/Library/Fonts/Supplemental/Times New Roman.ttf')
root=bpy.data.objects.new('Assembly',None);s.collection.objects.link(root)
animated=[]

if args.scene=='product':
    floor=mat('Polished graphite sweep','#0b100d',.22,.18,.22);noise_bump(floor,170,.003,.12)
    block('Continuous graphite studio',(200,200,.08),(0,0,-.07),floor,.02)
    glass=mat('Clear heavy flint glass','#f4f5ed',.055,0,.08,1)
    glass.node_tree.nodes['Principled BSDF'].inputs['IOR'].default_value=1.48
    outer=block('ORA / thick glass vessel',(2.65,1.34,3.16),(0,0,1.66),glass,.22,12,root)
    # Closed inner cavity gives real front/back/base thickness and clear edge refraction.
    inner=block('Cavity cutter',(2.32,1.02,2.82),(0,0,1.76),None,.17,10)
    boolean=outer.modifiers.new('Real internal glass cavity','BOOLEAN');boolean.operation='DIFFERENCE';boolean.solver='EXACT';boolean.object=inner
    bpy.context.view_layer.objects.active=outer;bpy.ops.object.modifier_move_up(modifier=boolean.name);bpy.ops.object.modifier_apply(modifier=boolean.name);bpy.data.objects.remove(inner,do_unlink=True)
    liquid=mat('Pale amber eau de parfum','#edd39d',.065,0,0,1)
    liquid.node_tree.nodes['Principled BSDF'].inputs['IOR'].default_value=1.36
    n=liquid.node_tree.nodes;l=liquid.node_tree.links;absorb=n.new('ShaderNodeVolumeAbsorption');absorb.inputs['Color'].default_value=srgb('#d99d3c');absorb.inputs['Density'].default_value=.08;l.new(absorb.outputs['Volume'],n.get('Material Output').inputs['Volume'])
    block('Perfume / liquid volume',(2.22,.93,2.28),(0,0,1.49),liquid,.15,10,root)
    neck=block('Glass neck',(.66,.62,.48),(0,0,3.30),glass,.12,10,root)
    caproot=bpy.data.objects.new('Quiet cap assembly',None);s.collection.objects.link(caproot);caproot.parent=root;animated.append(caproot)
    block('Precision brass collar',(.75,.69,.24),(0,0,3.47),chrome,.06,8,root)
    block('Satin cap',(1.12,.9,.84),(0,0,3.94),black,.10,10,caproot)
    block('Cap highlight seam',(1.10,.88,.018),(0,0,3.58),chrome,.005,4,caproot)
    # Actual raised cotton label and precise typography; no raster sticker or AI geometry.
    block('Cotton label',(1.85,.016,1.46),(0,-.686,1.79),paper,.015,6,root)
    text('ORA logotype','ORA',.60,(0,-.701,1.93),ink,serif,root,(math.pi/2,0,0),'CENTER',.0005)
    text('Parfum subtitle','EAU DE PARFUM',.095,(0,-.703,1.63),ink,font,root,(math.pi/2,0,0),'CENTER')
    text('Collection subtitle','O B J E T   D E   L U M I È R E',.055,(0,-.703,1.34),ink,font,root,(math.pi/2,0,0),'CENTER')
    text('Volume','50 ml / 1.7 fl. oz.',.066,(0,-.703,1.19),ink,font,root,(math.pi/2,0,0),'CENTER')
    key=area('Moving key strip',(-4,-2,5.2),1900,1.2,(0,0,2),size_y=6)
    area('Long soft reflection',(4,-.5,4.3),2400,1.0,(0,0,2),size_y=5)
    area('Gold back rim',(-1,4,5),1700,3,(0,0,2),'#fff0d4',5)
    area('Upper box',(-2,-2,8),1400,5,(0,0,1),size_y=4)
    target=(0,0,2.05)
    root.location.z=-.11
else:
    floor=mat('Warm neutral studio','#e7e6de',.69)
    block('Continuous paper studio',(200,200,.08),(0,0,-.09),floor,.02)
    # Dimensional cover and distinct, addressable planning pages.
    block('Citron cloth dossier cover',(4.75,6.10,.13),(0,0,.08),yellow,.055,8,root)
    block('Graphite inner cover',(4.55,5.94,.065),(.04,.01,.18),black,.025,5,root)
    for k in range(12):
        block(f'Bound paper edge {k:02}',(4.35,5.72,.010),(.07,.025,.23+k*.012),paper,.006,3,root)
    sheets=[]
    for k in range(3):
        ob=bpy.data.objects.new(f'Plan layer {k+1}',None);s.collection.objects.link(ob);ob.parent=root;ob.location=(.12+k*.11,.08+k*.08,.44+k*.12);sheets.append(ob)
        block(f'Cotton planning sheet {k+1}',(4.25,5.60,.026),(0,0,0),paper,.012,5,ob)
        # The exposed margins show distinct document sections, not invented funding values.
        text(f'Sheet index {k+1}',f'0{k+1}  /  '+['OBIETTIVI','ATTIVITÀ','PROGETTO'][k],.09,(-1.80,2.35,.020),ink,bold,ob)
        block(f'Graphite rule {k+1}',(3.60,.013,.001),(0,2.12,.018),ink,0,parent=ob)
        if k<2:
            text(f'Inner page heading {k+1}', ['Obiettivi chiari.','Un piano concreto.'][k],.29,(-1.80,1.55,.021),ink,bold,ob)
            for row,label in enumerate(['ATTIVITÀ','PARTNER','BUDGET']):
                y=.65-row*.74
                text(f'Inner field {k+1}-{row}',label,.085,(-1.80,y,.021),ink,bold,ob)
                for bar in range(2):
                    block(f'Inner field line {k+1}-{row}-{bar}',(2.1-bar*.5,.018,.001),(-.4+bar*.02,y-.18-bar*.16,.020),ink,0,parent=ob)
            text(f'Inner page footer {k+1}', ['01  /  OBIETTIVI E RISULTATI','02  /  ATTIVITÀ E PARTNER'][k],.074,(-1.80,-2.48,.021),ink,font,ob)
            block(f'Inner page footer accent {k+1}',(.65,.06,.003),(1.43,-2.44,.022),yellow,.009,4,ob)
    top=sheets[2];animated.extend(sheets)
    text('Main cover statement','Diamo forma\nalle idee.',.52,(-1.80,.97,.021),ink,bold,top)
    text('Dossier audience','AZIENDE  /  APS  /  ASD',.092,(-1.80,.45,.022),ink,font,top)
    block('Citron line',(3.60,.055,.003),(0,.16,.02),yellow,.005,3,top)
    rows=[('IDEA',-.40,.70,0),('PIANO',-.95,1.35,.7),('IMPATTO',-1.50,.95,1.8)]
    for i,(label,y,width,offset) in enumerate(rows):
        text('Planning phase '+label,label,.098,(-1.80,y,.021),ink,bold,top)
        block('Track '+label,(2.45,.012,.002),(.50,y+.045,.02),ink,0,parent=top)
        block('Timeline '+label,(width,.12,.01),(-.73+offset+width/2,y+.046,.025),yellow if i==1 else ink,.025,5,top)
    text('Dossier footer','OBIETTIVI  ·  PARTNER  ·  BUDGET',.075,(-1.80,-2.15,.021),ink,font,top)
    text('Dossier mark','SPACE / PROGETTI',.075,(-1.80,-2.42,.021),ink,bold,top)
    block('Cover spine deboss',(0.025,5.9,.008),(-2.11,0,.157),ink,.004,3,root)
    key=area('Moving key strip',(-5,-3,9),1500,6,(0,0,0),size_y=5)
    area('Soft window fill',(4,4,7),1000,5,(0,0,0),'#f7faff',5)
    area('Paper edge rim',(0,6,4),500,4,(0,0,.4),'#fff8df',2)
    target=(.05,.15,.10)
    root.location.z=-.065

camdata=bpy.data.cameras.new('Cinematic camera');cam=bpy.data.objects.new('Cinematic camera',camdata);s.collection.objects.link(cam);s.camera=cam
camdata.lens=56 if args.scene=='product' else 47;camdata.sensor_width=36;camdata.clip_start=.05;camdata.clip_end=300
camdata.dof.use_dof=True;camdata.dof.aperture_fstop=9
focus=bpy.data.objects.new('Focus plane',None);s.collection.objects.link(focus);focus.location=target;camdata.dof.focus_object=focus

def pose(frame):
    s.frame_set(frame);phase=2*math.pi*(frame-1)/FRAMES
    if args.scene=='product':
        angle=.24+.07*math.sin(phase)
        cam.location=(13.3*math.sin(angle),-13.3*math.cos(angle),4.9+.10*math.cos(phase))
        animated[0].location.z=.11*(1-math.cos(phase))*.5
        root.rotation_euler.z=.025*math.sin(phase)
        key.location=(-4+.45*math.sin(phase),-2,5.2);aim(key,(0,0,2))
    else:
        cam.location=(6.6+.25*math.sin(phase),-10.2,11.6+.14*math.cos(phase))
        for i,ob in enumerate(animated):
            amount=.5-.5*math.cos(phase)
            ob.location=(.12+i*.11+i*.20*amount,.08+i*.08+i*.15*amount,.44+i*.12+[0,.30,.65][i]*amount)
        root.rotation_euler.z=.025*math.sin(phase)
        key.location=(-5+.5*math.sin(phase),-3,9);aim(key,(0,0,0))
    aim(cam,target)

for frame in range(1,FRAMES+2):
    pose(frame)
    for ob in [cam,key,root]+animated:
        ob.keyframe_insert('location',frame=frame);ob.keyframe_insert('rotation_euler',frame=frame)
pose(1)
bpy.context.view_layer.update()
deps=bpy.context.evaluated_depsgraph_get()
anchor=bpy.data.objects['ORA / thick glass vessel' if args.scene=='product' else 'Citron cloth dossier cover'].evaluated_get(deps)
ground=bpy.data.objects['Continuous graphite studio' if args.scene=='product' else 'Continuous paper studio'].evaluated_get(deps)
anchor_base=min((anchor.matrix_world@v.co).z for v in anchor.data.vertices)
ground_top=max((ground.matrix_world@v.co).z for v in ground.data.vertices)
contact={'anchor_base_z':anchor_base,'ground_top_z':ground_top,'gap':anchor_base-ground_top,'checked_at_frame':1,'expected':'physical contact, no hover'}
if abs(contact['gap'])>.00001:raise RuntimeError(f'Ground contact failed: {contact}')
descendants=list(root.children_recursive)
margins={'left':1.,'right':1.,'bottom':1.,'top':1.}
for frame in range(1,73):
    pose(frame);bpy.context.view_layer.update()
    for ob in descendants:
        if ob.type not in {'MESH','FONT'}:continue
        evaluated=ob.evaluated_get(deps)
        for corner in evaluated.bound_box:
            ndc=world_to_camera_view(s,cam,evaluated.matrix_world@Vector(corner))
            margins['left']=min(margins['left'],ndc.x);margins['right']=min(margins['right'],1-ndc.x)
            margins['bottom']=min(margins['bottom'],ndc.y);margins['top']=min(margins['top'],1-ndc.y)
if min(margins.values())<.055:raise RuntimeError(f'Camera preflight safe frame failed before render: {margins}')
pose(1)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=str(folder/f'service-{args.scene}-master.blend'))
info={'scene':args.scene,'blender':bpy.app.version_string,'engine':s.render.engine,'samples':args.samples,'cycles_device':args.device if args.engine=='CYCLES' else None,'cycles_persistent_data':s.render.use_persistent_data if args.engine=='CYCLES' else None,'metal_kernel_optimization':'OFF' if args.engine=='CYCLES' and args.device=='METAL' else None,'enabled_cycles_devices':[{'name':d.name,'type':d.type} for d in bpy.context.preferences.addons['cycles'].preferences.devices if d.use] if args.engine=='CYCLES' else [],'resolution':[1440,900],'frames':FRAMES,'fps':24,'duration_seconds':3,'source':'Original authored Blender geometry, PBR materials, light, lens and periodic object transforms','font':'System Arial / Times New Roman rasterized in film, font files not distributed','master':str((folder/f'service-{args.scene}-master.blend').relative_to(ROOT)),'ground_contact':contact,'camera_lens_mm':camdata.lens,'preflight_projected_safe_margins_all_72_poses':margins}
(folder/'production.json').write_text(json.dumps(info,indent=2)+'\n')
if args.mode=='build':sys.exit(0)
frames=[1,25,49] if args.mode=='proof' else range(int(args.frames.split(':')[0]),int(args.frames.split(':')[1])+1)
framesdir=folder/('proof' if args.mode=='proof' else 'frames');framesdir.mkdir(exist_ok=True)
if args.mode=='proof':s.render.resolution_percentage=50;s.eevee.taa_render_samples=32
started=time.monotonic();timings=[]
for frame in frames:
    path=framesdir/f'{frame:04}.png'
    if path.exists() and args.mode=='render':continue
    mem=available_gib()
    if mem is not None and mem<3:raise RuntimeError(f'Available memory below 3GiB floor: {mem}')
    pose(frame);s.render.filepath=str(path);t=time.monotonic();bpy.ops.render.render(write_still=True);elapsed=time.monotonic()-t;timings.append(elapsed)
    if args.scene=='product' and args.mode=='render' and frame>1 and (framesdir/f'{frame-1:04}.png').exists():
        optical=pixel_pair(framesdir/f'{frame-1:04}.png',path)
        if optical['mean']>=3:
            rejected=folder/'diagnostic/pixel-rejected';rejected.mkdir(parents=True,exist_ok=True);path.rename(rejected/path.name)
            raise RuntimeError(f'Optical jump at frame{frame}; rejected output quarantined: {optical}')
    print(json.dumps({'frame':frame,'seconds':round(elapsed,3),'available_gib':mem,'file':str(path)}),flush=True)
info.update({'rendered_frames':len(timings),'batch_seconds':round(time.monotonic()-started,3),'mean_frame_seconds':sum(timings)/max(1,len(timings))})
info.update({'render_resolution':[round(s.render.resolution_x*s.render.resolution_percentage/100),round(s.render.resolution_y*s.render.resolution_percentage/100)],'actual_samples':s.cycles.samples if s.render.engine=='CYCLES' else s.eevee.taa_render_samples})
(folder/f'{args.mode}-metrics.json').write_text(json.dumps(info,indent=2)+'\n')
