"""Encode the phone cut from the photographic UHD source with the same frame edit as the master."""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
source = root / 'outputs/water-stock/pexels-film-composite-16392049-4k.mp4'
film = root / 'public/films/director-water-mobile.mp4'
edit = (
    '[0:v]crop=1632:2040:1088:0,scale=720:900:flags=lanczos,setsar=1,split=2[body][quiet];'
    '[body]trim=start_frame=32:end_frame=248,setpts=PTS-STARTPTS[a];'
    '[quiet]trim=start_frame=16:end_frame=32,setpts=PTS-STARTPTS[b];'
    '[a][b]xfade=transition=fade:duration=0.625:offset=8.333333,'
    "eq=saturation=0.30,curves=all='0/0 0.06/0.075 0.20/0.27 0.45/0.54 0.75/0.82 1/1',"
    'unsharp=5:5:0.18:3:3:0,format=yuv420p[v]'
)
subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-threads','2',
                '-filter_complex_threads','2','-i',str(source),'-filter_complex',edit,'-map','[v]',
                '-an','-frames:v','216','-r','24','-c:v','libx264','-preset','slow','-crf','23',
                '-g','48','-threads','2','-colorspace','bt709','-color_trc','bt709',
                '-color_primaries','bt709','-movflags','+faststart',str(film)], check=True)

for name, profile in [('mobile', film), ('desktop', root / 'public/films/flagship-water-desktop.mp4')]:
    subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-y', '-ss', '1.55', '-i', str(profile),
                    '-frames:v', '1', '-q:v', '2', str(root / f'public/images/director-water-{name}.jpg')], check=True)
