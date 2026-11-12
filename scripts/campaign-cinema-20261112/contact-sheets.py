"""Review every half-second of both delivered movies without changing the assets."""
from pathlib import Path
import subprocess
P=Path(__file__).resolve().parents[2];O=P/'outputs/campaign-cinema-20261112'
for profile,scale,grid in [('desktop','320:180','4x4'),('portrait','270:338','4x4')]:
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(P/'public/films'/f'campaign-cinema-20261112-{profile}.mp4'),'-vf',f'fps=2,scale={scale}:flags=lanczos,tile={grid}','-frames:v','1','-q:v','2',str(O/f'contact-{profile}.jpg')],check=True)
