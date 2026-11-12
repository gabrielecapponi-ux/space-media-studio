"""Render proof frames from a frozen master without overwriting its animation."""
import argparse, bpy, hashlib, json, sys, time
from pathlib import Path

p = argparse.ArgumentParser()
p.add_argument('--profile', choices=['desktop', 'portrait'], required=True)
p.add_argument('--frames', required=True)
a = p.parse_args(sys.argv[sys.argv.index('--') + 1:])
root = Path(__file__).resolve().parents[2]
out = root / 'outputs/cacao-cinema-20261112'
master = out / f'cacao-cinema-{a.profile}.blend'
bpy.ops.wm.open_mainfile(filepath=str(master))
s = bpy.context.scene
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'
prefs.get_devices()
for device in prefs.devices:
    device.use = device.type == 'METAL'
s.cycles.device = 'GPU'
folder = out / f'proof-{a.profile}'
folder.mkdir(exist_ok=True)
report = {'profile': a.profile, 'master_sha256': hashlib.sha256(master.read_bytes()).hexdigest(), 'width': s.render.resolution_x, 'height': s.render.resolution_y, 'samples': s.cycles.samples, 'timings': []}
for f in [int(v) for v in a.frames.split(',')]:
    s.frame_set(f)
    s.render.filepath = str(folder / f'{f:04d}.png')
    start = time.monotonic()
    bpy.ops.render.render(write_still=True)
    timing = {'frame': f, 'seconds': round(time.monotonic() - start, 3)}
    report['timings'].append(timing)
    print('CACAO_PROOF', timing, flush=True)
(out / f'proof-final-{a.profile}.json').write_text(json.dumps(report, indent=2) + '\n')
