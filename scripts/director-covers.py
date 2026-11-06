"""Lightweight static covers used on the cold entry path, from original production JPEGs."""
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[1] / 'public/images'
for name in ['director-web', 'director-web-mobile', 'director-water-desktop', 'director-water-mobile', 'director-studio-mobile']:
    subprocess.run(['cwebp', '-quiet', '-q', '83', '-m', '6', str(root / (name + '.jpg')),
                    '-o', str(root / (name + '.webp'))], check=True)
