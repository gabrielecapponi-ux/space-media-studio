"""Render the calibrated Blender mesh through the native Cycles photographs."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs/reentry-20261109/films'
OUT.mkdir(parents=True, exist_ok=True)
renderer = OUT / 'rail'
source = ROOT / 'scripts/elegant-films/rail.mm'
subprocess.run(['clang++','-std=c++17','-O2','-fobjc-arc','-framework','Foundation','-framework','Metal',
                '-framework','CoreGraphics','-framework','ImageIO',str(source),'-o',str(renderer)],check=True)
render = subprocess.Popen([str(renderer),str(OUT/'product'),'desktop','plates'],stdout=subprocess.PIPE)
film = ROOT / 'public/films/elegant-product.mp4'
try:
    subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pixel_format','bgra',
                    '-video_size','2560x1440','-framerate','60','-i','pipe:0','-an','-filter_threads','2',
                    '-vf','scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p',
                    '-c:v','libx264','-threads','3','-preset','medium','-crf','18.5','-profile:v','high','-level:v','5.1',
                    '-g','60','-keyint_min','60','-sc_threshold','0','-colorspace','bt709','-color_primaries','bt709',
                    '-color_trc','iec61966-2-1','-movflags','+faststart',str(film)],stdin=render.stdout,check=True)
finally:
    render.stdout.close()
    assert render.wait() == 0
print(film,film.stat().st_size,flush=True)
