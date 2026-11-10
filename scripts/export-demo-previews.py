"""Rebuild the five small contact-sheet images from existing licensed site assets.

No crop, upscaling, or changes to any film. Requires the existing cwebp CLI.
"""
from pathlib import Path
import hashlib
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    'shift': 'showcase/phase-01/hero.webp',
    'cacao': 'images/director-brand.jpg',
    'luma': 'images/elegant-product.webp',
    'basilico': 'images/reel-food.jpg',
    'oltre-culture': 'showcase/oltre/orbit.webp',
}
rows = []
for name, source in SOURCES.items():
    src = ROOT / 'public' / source
    dst = ROOT / 'public' / 'images' / f'demo-preview-{name}.webp'
    subprocess.run(['cwebp', '-quiet', '-resize', '480', '0', '-q', '82', '-m', '6',
                    str(src), '-o', str(dst)], check=True)
    rows.append({'source': source, 'output': str(dst.relative_to(ROOT / 'public')),
                 'sourceSha256': hashlib.sha256(src.read_bytes()).hexdigest(),
                 'outputSha256': hashlib.sha256(dst.read_bytes()).hexdigest(),
                 'bytes': dst.stat().st_size, 'width': 480})
out = ROOT / 'outputs' / 'campaign-web-revision-20261110'
out.mkdir(parents=True, exist_ok=True)
(out / 'demo-previews-manifest.json').write_text(json.dumps(rows, indent=2) + '\n')
print(f'{len(rows)} previews, {sum(row["bytes"] for row in rows):,} bytes. Originals preserved.')
