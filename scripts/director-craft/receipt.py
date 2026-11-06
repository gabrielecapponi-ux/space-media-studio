"""Validate that the byte manifests match the actual integration targets and write the studio receipt."""
import json, hashlib, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
RECIPE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = RECIPE_DIR.parents[1]
WORK_DIR = PROJECT_ROOT / 'outputs/director-20261106/craft'
assets = []
thumbs = []
for a in ['product', 'brand', 'funding']:
    for p in ['desktop', 'mobile']:
        profile_dir = WORK_DIR / a / p
        s = json.loads((profile_dir / 'verification.json').read_text())
        ph = json.loads((profile_dir / 'photograph.json').read_text())
        vid = PROJECT_ROOT / s['mp4']
        assert hashlib.sha256(vid.read_bytes()).hexdigest() == s['sha256']
        suffix = '' if p == 'desktop' else '-mobile'
        poster = PROJECT_ROOT / 'public/images' / ('director-' + a + suffix + '.jpg')
        assert Image.open(poster).size == tuple(s['size'])
        thumb = PROJECT_ROOT / 'public/images' / ('director-' + a + '-thumb.webp')
        assert Image.open(thumb).size == (320, 180)
        assets.append(dict(s, source_master=ph['master'], photograph=ph['renderer'], photograph_dimensions=ph['dims'], poster=str(poster.relative_to(PROJECT_ROOT)), thumbnail=str(thumb.relative_to(PROJECT_ROOT))))
        for image_type, path in (('poster', poster), ('thumbnail', thumb)):
            assets[-1][image_type + '_sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
        files = []
        for n, source in [('prima', PROJECT_ROOT / 'public/films' / ('flagship-' + a + suffix + '.mp4')), ('dopo', vid)]:
            dst = profile_dir / f'present-{n}.jpg'
            subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(s['comparison_time_s']), '-threads', '2', '-i', str(source), '-frames:v', '1', '-vf', 'scale=280:350' if p == 'mobile' else 'scale=416:234', '-y', '-q:v', '3', str(dst)], check=True)
            files.append(dst)
        thumbs.append((a, p, *files))
rec = {'project': 'Space Media — director cut 2026-11-06', 'credit': 'Original Space Media studio models and still / moving Blender photography; Cycles Metal, Freestyle and calibrated Metal projection. No external stock or generative video.', 'assets': assets}
(WORK_DIR / 'credits-delivery.json').write_text(json.dumps(rec, indent=2) + '\n')
board = Image.new('RGB', (1350, 3 * 274 + 46), (23, 24, 23))
g = ImageDraw.Draw(board)
font = ImageFont.truetype('/System/Library/Fonts/Helvetica.ttc', 17)
g.text((16, 12), 'SPACE MEDIA  /  Prima e dopo: direzione fotografica                   Desktop                                                                     Portrait', fill=(235, 233, 216), font=font)
for i in range(3):
    y = 48 + i * 274
    for j in range(2):
        a, p, old, new = thumbs[i * 2 + j]
        left = 16 if j == 0 else 882
        for k, f in enumerate([old, new]):
            with Image.open(f) as im:
                if j:
                    im.thumbnail((190, 228))
                x = left + k * (422 if not j else 192)
                board.paste(im, (x, y))
                g.text((x, y + 236), f'{a.upper()}   /   ' + ('PRIMA' if k == 0 else 'DIRECTOR'), fill=(195, 196, 182), font=font)
board.save(WORK_DIR / 'comparison-all.jpg', quality=90)
