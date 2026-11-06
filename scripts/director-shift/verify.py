"""Compare the new delivery against the previous actual encodes and write the source inventory."""
from io import BytesIO
from pathlib import Path
import hashlib
import json
import subprocess
from PIL import Image, ImageDraw, ImageChops, ImageStat

SCRIPTS = Path(__file__).resolve().parent
ROOT = SCRIPTS.parents[1]
OUT = ROOT / 'outputs/director-20261106/shift'
BASE = ROOT / 'outputs/flagship-20261106/shift'
PUBLIC = ROOT / 'public'

def receipt(path):
    return {'path': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'bytes': path.stat().st_size}

def frame(path, at, size):
    cmd = ['ffmpeg', '-v', 'error', '-threads', '2', '-ss', str(at), '-i', str(path), '-vf', f'scale={size[0]}:{size[1]}', '-frames:v', '1', '-threads', '1', '-f', 'image2pipe', '-c:v', 'png', '-']
    with Image.open(BytesIO(subprocess.check_output(cmd))) as img:
        return img.convert('RGB')

def verify_frames(path, poster, size, fps, frame_count):
    cmd = ['ffmpeg', '-v', 'error', '-threads', '2', '-i', str(path), '-an', '-vf', 'scale=144:90,format=gray', '-threads', '1', '-f', 'rawvideo', '-']
    decoded = subprocess.check_output(cmd)
    stride = 144*90
    assert len(decoded) == stride*frame_count
    unique = len({decoded[start:start+stride] for start in range(0, len(decoded), stride)})
    assert unique == frame_count, (path.name, unique, frame_count)
    cmd = ['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time', '-of', 'json', str(path)]
    pts = sorted(float(pkt['pts_time']) for pkt in json.loads(subprocess.check_output(cmd))['packets'])
    assert len(pts) == frame_count and abs(pts[0]) < 0.000001
    step_errors = [abs((end-start) - 1/fps) for start, end in zip(pts, pts[1:])]
    assert max(step_errors) < 0.000002, (path.name, max(step_errors))
    decoded_first = frame(path, 0, size)
    stored_first = Image.open(poster).convert('RGB').resize(size, Image.Resampling.LANCZOS)
    still_delta = ImageStat.Stat(ImageChops.difference(decoded_first, stored_first)).mean
    assert max(still_delta) < 4, (path.name, still_delta)
    return {'allDecodedPosesUnique144x90': unique, 'presentationTimestampsEven': True, 'posterFirstFrameMeanDifferenceRGB8bit': [round(v, 2) for v in still_delta]}

sources = [BASE / name for name in ('phase-01.blend', 'phase-hero.png', 'phase-overhead.png', 'phase-detail.png')]
for profile in ('desktop', 'mobile'):
    sources.extend(sorted((BASE / 'screens' / profile).glob('*.jpg')))
sources.append(OUT / 'jog-negative-3200-crop.png')
sources += [SCRIPTS / name for name in ('capture.cjs', 'model.py', 'negative.py', 'plates.py', 'render.py', 'verify.py')]
report = {'product': 'SHIFT PHASE 01, original Space Media studio demonstration sampler', 'origin': 'Packed original Blender/Cycles scene, 3 studio photographs, a new 3200×2400-field Cycles exposure of the original optical setup, original studio-owned storefront captures and campaign layouts. Fonts from the website: DM Mono and Space Grotesk.', 'method': 'Perspective reprojection of native imagery and multi-plane camera treatment, 600 desktop and 300 mobile output poses per sequence. Original source displays retain the five functional site demos; the camera moves in 3D around the prints and within the image, while the sampler model contributes the photographic renders.', 'webTimelineFrames': [102, 222, 342, 462, 582], 'campaignHoldSeconds': {'story': [0, 1.72], 'square': [2.63, 4.32], 'banner': [5.24, 6.98], 'overview': [7.96, 8.59]}, 'sources': [receipt(p) for p in sources], 'outputs': [], 'encodes': []}
for profile in ('desktop', 'mobile'):
    suffix = '' if profile == 'desktop' else '-mobile'
    cell = (320, 180) if not suffix else (224, 280)
    canvas = Image.new('RGB', (3 * (cell[0] + 8), 4 * (cell[1] + 28)), (31, 33, 32))
    draw = ImageDraw.Draw(canvas)
    for row, film in enumerate(('web', 'campaign')):
        times = [.0, .76, 1.29] if film == 'web' else [.55, 3.18, 5.78]
        for edition_index, edition in enumerate(('flagship', 'director')):
            key = edition + '-' + film + suffix
            path = PUBLIC / 'films' / (key + '.mp4')
            y = (row * 2 + edition_index) * (cell[1] + 28)
            for col, at in enumerate(times):
                x = col * (cell[0] + 8)
                canvas.paste(frame(path, at, cell), (x, y))
                draw.text((x + 4, y + cell[1] + 4), f'{edition.upper()} / {film} - {at:.2f}s', fill=(245, 244, 233))
        key = 'director-' + film + suffix
        deliverables = [PUBLIC / 'films' / (key + '.mp4'), PUBLIC / 'images' / (key + '.jpg')]
        if not suffix:
            deliverables.append(PUBLIC / 'images' / (key + '-thumb.webp'))
        report['outputs'].extend(receipt(path) for path in deliverables)
        record = json.loads((OUT / (key + '.json')).read_text())
        record.update(verify_frames(deliverables[0], deliverables[1], cell, record['fps'], record['frames']))
        report['encodes'].append(record)
    canvas.save(OUT / ('comparison-' + profile + '.jpg'), quality=92)
(OUT / 'delivery.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
