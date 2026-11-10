"""Load-check a generated master with Blender -b master.blend -P this_file."""
from pathlib import Path
import bpy,json
scene=bpy.context.scene
assert len(scene.objects)==13,len(scene.objects)
assert scene.camera and scene.camera.data.sensor_fit=='VERTICAL'
assert scene['no_white_edges']
assert all(image.packed_file for image in bpy.data.images if image.name not in ['Render Result','Viewer Node'])
edge=bpy.data.materials['Graphite — no ivory edge'];rgba=list(edge.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value);assert max(rgba[:3])<.03
path=Path(bpy.data.filepath);report={'master':path.name,'objects':len(scene.objects),'dimensions':[scene.render.resolution_x,scene.render.resolution_y],'camera':scene.camera.name,'frames':scene.frame_end,'fps':scene.render.fps,'allTexturesPacked':True,'edgeLinearRGBA':rgba,'reimport':'pass'}
path.with_suffix('.reimport.json').write_text(json.dumps(report,indent=2)+'\n');print(report)
