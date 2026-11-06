"""Prepare a single-decoder-friendly 30p edition from each validated 60p portrait master."""
from pathlib import Path
import json, subprocess, hashlib, sys, shutil
RECIPE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = RECIPE_DIR.parents[1]
WORK_DIR = PROJECT_ROOT / 'outputs/director-20261106/craft'
asset = sys.argv[1]
asset_dir = WORK_DIR / asset / 'mobile'
source = PROJECT_ROOT / 'public/films' / ('director-' + asset + '-mobile.mp4')
archive = asset_dir / 'native-60.mp4'
final = asset_dir / 'phone.pending.mp4'
rec = json.loads((asset_dir / 'verification.json').read_text())
if rec['fps'] == 30:
    sys.exit()
assert rec['fps'] == 60
shutil.copyfile(source, archive)
(asset_dir / 'verification-native60.json').write_text(json.dumps(rec, indent=2) + '\n')

def run(*args):
    return subprocess.check_output(args)
run('ffmpeg', '-v', 'error', '-nostdin', '-y', '-threads', '2', '-i', str(archive), '-vf', 'fps=30,scale=720:900:flags=lanczos,setsar=1,format=yuv420p', '-filter_threads', '2', '-an', '-c:v', 'libx264', '-threads', '3', '-preset', 'slow', '-crf', '18.5', '-maxrate', '1700k', '-bufsize', '2550k', '-profile:v', 'high', '-level:v', '3.1', '-refs', '2', '-bf', '2', '-g', '30', '-fps_mode', 'cfr', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'iec61966-2-1', '-movflags', '+faststart', str(final))
probe = json.loads(run('ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(final)))
assert len(probe['streams']) == 1
v = probe['streams'][0]
count = 360 if asset == 'funding' else 240
assert (v['width'], v['height'], v['r_frame_rate'], v['avg_frame_rate'], v['pix_fmt'], v['profile'], v['level'], int(v['nb_frames'])) == (720, 900, '30/1', '30/1', 'yuv420p', 'High', 31, count)
assert abs(float(v['duration']) - count / 30) < 0.0001
raw = run('ffmpeg', '-v', 'error', '-threads', '2', '-i', str(final), '-vf', 'scale=96:60,format=gray', '-f', 'rawvideo', 'pipe:1')
stride = 5760
seq = [raw[i:i + stride] for i in range(0, len(raw), stride)]
assert len(seq) == count and len(set(seq)) == count

def mad(a, b):
    return sum((abs(x - y) for x, y in zip(a, b))) / len(a)

def sample(file, t):
    return run('ffmpeg', '-v', 'error', '-ss', str(t), '-threads', '2', '-i', str(file), '-frames:v', '1', '-vf', 'scale=96:60,format=gray', '-f', 'rawvideo', 'pipe:1')
delta = mad(sample(PROJECT_ROOT / 'public/films' / ('flagship-' + asset + '-mobile.mp4'), rec['comparison_time_s']), sample(final, rec['comparison_time_s']))
assert delta > 1.8
data = final.read_bytes()
assert data.index(b'moov') < data.index(b'mdat')
poster = PROJECT_ROOT / 'public/images' / ('director-' + asset + '-mobile.jpg')
t = {'product': 0.48, 'brand': 4.65, 'funding': 0}[asset]
run('ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-threads', '2', '-i', str(final), '-frames:v', '1', '-q:v', '2', str(poster))
final.replace(source)
rec.update({'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'size': [720, 900], 'source_fps': 60, 'fps': 30, 'seconds': count / 30, 'frames': count, 'consecutive_duplicates': 0, 'unique_downscaled_frames': len(set(seq)), 'last_first_MAD_8bit': round(mad(seq[-1], seq[0]), 4), 'old_new_MAD_8bit': round(delta, 3), 'h264_level': '3.1', 'mobile_method': 'Every other native frame retained; constant 30 fps, no optical flow, two references; native 60p audit separately archived.'})
(asset_dir / 'verification.json').write_text(json.dumps(rec, indent=2) + '\n')
print(json.dumps(rec), flush=True)
