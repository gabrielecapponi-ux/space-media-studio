"""Compose the native moving plates and encode the 60p production masters."""
import sys, subprocess, json, time, math, hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageChops
RECIPE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = RECIPE_DIR.parents[1]
WORK_DIR = PROJECT_ROOT / 'outputs/director-20261106/craft'
FLAGSHIP_ROOT = PROJECT_ROOT / 'outputs/flagship-20261106'
NATIVE_ROOT = PROJECT_ROOT / 'outputs/motion-refinement-20261105'
asset, profile = sys.argv[1:]
asset_dir = WORK_DIR / asset / profile
asset_dir.mkdir(exist_ok=True, parents=True)
start_time = time.monotonic()
mobile = profile == 'mobile'
suffix = '-mobile' if mobile else ''
name = 'director-' + asset + suffix
dest = PROJECT_ROOT / 'public/films' / (name + '.mp4')
tmp = asset_dir / 'delivery.pending.mp4'
size = (864, 1080) if asset == 'product' and mobile else (720, 900) if mobile else (1920, 1080)
frames = 720 if asset == 'funding' else 480

def load(path):
    with Image.open(path) as f:
        return f.convert('RGB')

def clamp(x):
    return max(0, min(1, x))

def smooth(u):
    u = clamp(u)
    return u * u * u * (10 + u * (-15 + u * 6))

def emit(args, **kw):
    return subprocess.run(args, check=True, **kw)

def shell(*args):
    return subprocess.check_output(args)

def crop(plate, n, start, end):
    u = (n - start) / (end - start)
    s = u + 0.25 * math.sin(math.tau * (u - 0.5)) / math.tau
    # Camera gently pushes along the chamfer then settles on the embossing, remaining within native pixels.
    if asset == 'brand':
        k = 0.982 - 0.105 * s
        xf = 0.21 + 0.47 * s
        yf = 0.33 + 0.28 * math.sin(math.pi * 0.65 * s)
    else:
        k = 0.982 - 0.075 * s
        xf = 0.27 + 0.44 * s
        yf = 0.54 - 0.22 * s
    w, h = plate.size
    w0, h0 = (w * k, h * k)
    x = (w - w0) * xf
    y = (h - h0) * yf
    assert w0 >= size[0] and h0 >= size[1]
    return plate.resize(size, Image.Resampling.BICUBIC, box=(x, y, x + w0, y + h0))

def line_mask(u):
    """Reveal the photographed model with a soft, inclined plane."""
    # Draw a small mask and upscale to avoid constructing a full-frame Python array.
    w, h = (224, 126)
    v = u * (w + h * 0.12 + 34) - 17
    m = Image.new('L', (w, h))
    draw = ImageDraw.Draw(m)
    for row in range(h):
        x = int(v - 0.12 * row)
        if x >= 0:
            draw.line([(0, row), (x, row)], fill=255)
        for j in range(1, 12):
            if 0 <= x + j < w:
                draw.point((x + j, row), round(255 * (1 - smooth(j / 12))))
    return m.resize(size, Image.Resampling.BILINEAR)
encode = ['ffmpeg', '-v', 'error', '-nostdin', '-y', '-f', 'rawvideo', '-pixel_format', 'bgra' if asset == 'product' else 'rgb24', '-video_size', f'{size[0]}x{size[1]}', '-framerate', '60', '-i', 'pipe:0', '-an', '-filter_threads', '2', '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p', '-c:v', 'libx264', '-threads', '3', '-preset', 'fast', '-crf', '19.5' if mobile else '18.5', '-profile:v', 'high', '-level:v', '4.2', '-refs', '3' if mobile else '4', '-g', '60', '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'iec61966-2-1', '-movflags', '+faststart', str(tmp)]
if asset == 'product':
    render = subprocess.Popen([str(WORK_DIR / 'rail'), str(WORK_DIR / 'product'), profile, 'plates'], stdout=subprocess.PIPE)
    try:
        emit(encode, stdin=render.stdout)
    finally:
        render.stdout.close()
        rc = render.wait()
    assert rc == 0
else:
    source = FLAGSHIP_ROOT / asset / profile
    base = NATIVE_ROOT / asset / profile
    picture = load(source / 'macro-plate.png')
    secondary = load(asset_dir / ('rake.png' if asset == 'brand' else 'working-drawing.png'))
    assert secondary.size == picture.size, (secondary.size, picture.size)
    if asset == 'funding':
        # A graphite plate is graded for readability at phone size. Ruled drafting
        # paper stays in the same coordinate system as the registered line/photo pass.
        bg = secondary.getpixel((5, 5))
        ink = secondary.filter(ImageFilter.MinFilter(3))
        secondary = Image.blend(secondary, ink, 0.48)
        secondary = Image.merge('RGB', tuple((ch.point([max(0, min(255, round(b - (b - i) * 1.55))) for i in range(256)]) for ch, b in zip(secondary.split(), bg))))
        paper = Image.new('RGB', secondary.size, 'white')
        rule = ImageDraw.Draw(paper)
        width, height = secondary.size
        step = round(width / (27 if mobile else 50))
        for j, x in enumerate(range(int(step * 0.32), width, step)):
            rule.line((x, 0, x, height), fill=(243, 244, 242) if j % 5 == 0 else (251, 251, 249), width=1 if j % 5 else 2)
        for j, y in enumerate(range(int(step * 0.46), height, step)):
            rule.line((0, y, width, y), fill=(243, 244, 242) if j % 5 == 0 else (251, 251, 249), width=1 if j % 5 else 2)
        secondary = ImageChops.multiply(secondary, paper)
    source_dir = base / ('frames-balanced' if asset == 'brand' else 'frames')
    start, end = (161, 327) if asset == 'brand' else (568, 720)
    weights = {}
    if asset == 'funding':
        weights = {item['frame']: item['incoming_weight'] for item in json.loads((base / 'composite-delivery.json').read_text())['records'] if item['frame'] >= 683}
    enc = subprocess.Popen(encode, stdin=subprocess.PIPE)
    try:
        for n in range(1, frames + 1):
            if not start <= n <= end:
                im = load(source_dir / f'{n:04}.png')
            else:
                u = (n - start) / (end - start)
                if asset == 'brand':
                    r = smooth((u - 0.015) / 0.7)
                    strength = min(1, r * 1.07) * (1 - 0.12 * smooth((u - 0.79) / 0.2))
                    # Illumination mix after projection reads as a slow bounce-card sweep.
                    detail = crop(Image.blend(picture, secondary, strength), n, start, end)
                else:
                    p = smooth((n - 581) / 60)
                    detail = crop(secondary if p <= 0 else picture, n, start, end)
                    if 0 < p < 1:
                        detail = Image.composite(detail, crop(secondary, n, start, end), line_mask(p))
                transition = 14 if asset == 'brand' else 18
                if n < start + transition:
                    im = Image.blend(load(source_dir / f'{n:04}.png'), detail, smooth((n - start) / transition))
                elif asset == 'brand' and n > end - transition:
                    im = Image.blend(load(source_dir / f'{n:04}.png'), detail, smooth((end - n) / transition))
                elif n in weights:
                    im = Image.blend(detail, load(base / 'transition-passes' / f'{n:04d}-b.png'), weights[n])
                else:
                    im = detail
            enc.stdin.write(im.tobytes())
        enc.stdin.close()
        assert enc.wait() == 0
    finally:
        if enc.poll() is None:
            enc.terminate()
            enc.wait()
probe = json.loads(shell('ffprobe', '-v', 'error', '-show_streams', '-of', 'json', str(tmp)))['streams']
assert len(probe) == 1
v = probe[0]
assert (v['width'], v['height'], v['r_frame_rate'], v['avg_frame_rate'], v['pix_fmt'], v['profile'], v['level'], int(v['nb_frames'])) == (*size, '60/1', '60/1', 'yuv420p', 'High', 42, frames)
data = tmp.read_bytes()
assert 0 < data.index(b'moov') < data.index(b'mdat')
raw = shell('ffmpeg', '-v', 'error', '-threads', '2', '-i', str(tmp), '-vf', 'scale=96:60,format=gray', '-f', 'rawvideo', 'pipe:1')
stride = 96 * 60
seq = [raw[i:i + stride] for i in range(0, len(raw), stride)]
assert len(seq) == frames
adj = sum((a == b for a, b in zip(seq, seq[1:])))
assert adj == 0, adj

def mad(a, b):
    return sum((abs(x - y) for x, y in zip(a, b))) / len(a)
prev = PROJECT_ROOT / 'public/films' / ('flagship-' + asset + suffix + '.mp4')
sample_t = {'product': 3.75, 'brand': 4.62, 'funding': 9.98}[asset]

def comp(file):
    return shell('ffmpeg', '-v', 'error', '-ss', str(sample_t), '-threads', '2', '-i', str(file), '-frames:v', '1', '-vf', 'scale=96:60,format=gray', '-f', 'rawvideo', 'pipe:1')
old, new = (comp(prev), comp(tmp))
delta = mad(old, new)
assert delta > 1.8, (asset, delta)
poster_t = {'product': 0.48, 'brand': 4.65, 'funding': 0}[asset]
thumb_t = {'product': 3.68, 'brand': 4.65, 'funding': 10.78}[asset]

def jpg(t, path):
    emit(['ffmpeg', '-v', 'error', '-y', '-ss', str(t), '-threads', '2', '-i', str(tmp), '-frames:v', '1', '-q:v', '2', str(path)])
jpg(poster_t, PROJECT_ROOT / 'public/images' / (name + '.jpg'))
if not mobile:
    jpg(thumb_t, asset_dir / 'thumb-source.jpg')
    load(asset_dir / 'thumb-source.jpg').resize((320, 180), Image.Resampling.LANCZOS).save(PROJECT_ROOT / 'public/images' / ('director-' + asset + '-thumb.webp'), quality=86, method=5)
jpg(sample_t, asset_dir / 'new.jpg')
emit(['ffmpeg', '-v', 'error', '-y', '-ss', str(sample_t), '-threads', '2', '-i', str(prev), '-frames:v', '1', '-q:v', '2', str(asset_dir / 'old.jpg')])
C = Image.new('RGB', (680, 255 if mobile else 206), (32, 32, 32))
draw = ImageDraw.Draw(C)
for i, n in enumerate(['old', 'new']):
    im = load(asset_dir / (n + '.jpg'))
    im.thumbnail((335, 225 if mobile else 180))
    C.paste(im, (i * 340, 0))
    draw.text((i * 340, C.height - 21), ['Originale', 'Director'][i], fill='white')
C.save(asset_dir / 'comparison.jpg', quality=87)
tmp.replace(dest)
rec = {'asset': asset, 'profile': profile, 'mp4': str(dest.relative_to(PROJECT_ROOT)), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(), 'size': size, 'fps': 60, 'frames': frames, 'consecutive_duplicates': adj, 'unique_downscaled_frames': len(set(seq)), 'last_first_MAD_8bit': round(mad(seq[0], seq[-1]), 4), 'old_new_MAD_8bit': round(delta, 3), 'comparison_time_s': sample_t, 'seconds_render_encode_validate': round(time.monotonic() - start_time, 2), 'faststart': True, 'decode': 'all frames OK'}
(asset_dir / 'verification.json').write_text(json.dumps(rec, indent=2) + '\n')
print(json.dumps(rec), flush=True)
