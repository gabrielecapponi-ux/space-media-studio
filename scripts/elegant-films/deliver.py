"""Encode the constrained-bandwidth renditions and validate every delivered frame."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs/reentry-20261109/films'


def run(arguments):
    return subprocess.run(arguments, check=True, stdout=subprocess.PIPE).stdout


def probe(path):
    result = json.loads(run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]))
    assert len(result['streams']) == 1
    return result['streams'][0]


def capture(source, seconds, destination):
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-ss', str(seconds), '-threads', '2', '-i', str(source),
         '-frames:v', '1', '-q:v', '2', str(destination)])


def validate(path, size, fps):
    data = path.read_bytes()
    media = probe(path)
    expected = (*size, f'{fps}/1', str(fps * 10))
    observed = (media['width'], media['height'], media['avg_frame_rate'], media['nb_frames'])
    assert observed == expected, (path, observed, expected)
    assert media['pix_fmt'] == 'yuv420p' and media['profile'] == 'High'
    assert 0 < data.index(b'moov') < data.index(b'mdat')
    raw = run(['ffmpeg', '-nostdin', '-v', 'error', '-threads', '2', '-i', str(path),
               '-vf', 'scale=128:72,format=gray', '-threads', '1', '-f', 'rawvideo', '-'])
    frames = [raw[i:i+9216] for i in range(0, len(raw), 9216)]
    assert len(frames) == fps * 10
    duplicates = sum(a == b for a, b in zip(frames, frames[1:]))
    assert duplicates == 0, (path, duplicates)
    loop = sum(abs(a-b) for a, b in zip(frames[0], frames[-1])) / len(frames[0])
    assert loop < 1.7, (path, loop)
    packets = json.loads(run(['ffprobe', '-v', 'error', '-show_packets', '-show_entries',
                              'packet=pts_time,size', '-of', 'json', str(path)]))['packets']
    ordered = sorted((float(p['pts_time']), int(p['size'])) for p in packets)
    left, window_bytes, peak = 0, 0, 0
    for stamp, packet_bytes in ordered:
        window_bytes += packet_bytes
        while ordered[left][0] <= stamp - 1:
            window_bytes -= ordered[left][1]
            left += 1
        peak = max(peak, window_bytes * 8)
    if fps == 30:
        assert peak <= 1_400_000, (path, peak)
    return dict(file=str(path.relative_to(ROOT)), dimensions=size, fps=fps, frames=len(frames),
                bytes=len(data), sha256=hashlib.sha256(data).hexdigest(), full_decode=True,
                adjacent_duplicate_frames=duplicates, loop_boundary_mean_difference=round(loop, 4),
                faststart=True, peak_bitrate_one_second=peak, bitrate=media.get('bit_rate'), profile=media['profile'], level=media['level'])


def deliver(asset):
    name = 'elegant-' + asset
    film = ROOT / 'public/films' / (name + '.mp4')
    compact = ROOT / 'public/films' / (name + '-compact.mp4')
    pending = OUT / (name + '-compact.pending.mp4')
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-threads', '2', '-i', str(film),
         '-an', '-filter_threads', '2', '-vf', 'fps=30,scale=1280:720:flags=lanczos',
         '-c:v', 'libx264', '-threads', '3', '-preset', 'medium', '-b:v', '950k', '-maxrate', '1100k',
         '-bufsize', '220k', '-profile:v', 'high', '-level:v', '3.1', '-g', '30', '-keyint_min', '30',
         '-sc_threshold', '0', '-colorspace', 'bt709', '-color_primaries', 'bt709',
         '-color_trc', 'bt709', '-movflags', '+faststart', str(pending)])
    pending.replace(compact)
    records = [validate(film, (2560, 1440), 60), validate(compact, (1280, 720), 30)]
    assert records[0]['bytes'] < 8_000_000
    assert records[1]['bytes'] / 10 * 8 < 1_400_000
    poster = ROOT / 'public/images' / (name + '.jpg')
    capture(film, 0, poster)
    with Image.open(poster) as image:
        image.save(poster.with_suffix('.webp'), quality=85, method=6)
    thumb = OUT / (name + '-thumb.jpg')
    capture(film, 4.1 if asset == 'product' else 3.55, thumb)
    with Image.open(thumb) as image:
        image.resize((320, 180), Image.Resampling.LANCZOS).save(ROOT/'public/images'/(name+'-thumb.webp'),quality=87,method=6)
    proof = Image.new('RGB', (1280, 2*210), (21, 23, 23))
    draw = ImageDraw.Draw(proof)
    for i, sec in enumerate([0, 1.15, 2.85, 4.1, 5.8, 7.3, 8.9, 9.98]):
        snap = OUT / (name + '-proof-frame.jpg')
        capture(film, sec, snap)
        with Image.open(snap) as image:
            image.thumbnail((320, 180))
            x, y = (i % 4)*320, (i // 4)*210
            proof.paste(image, (x, y))
            draw.text((x+8,y+187), f'{sec:.2f} s / 2560 x 1440', fill='white')
    proof.save(OUT/(name+'-proof.jpg'),quality=90)
    assets = []
    for path in [poster, poster.with_suffix('.webp'), ROOT/'public/images'/(name+'-thumb.webp')]:
        data=path.read_bytes()
        assets.append(dict(file=str(path.relative_to(ROOT)),bytes=len(data),sha256=hashlib.sha256(data).hexdigest()))
    report = dict(asset=asset, renderer='Blender camera and 314906-triangle mesh, Cycles plate projection in Metal' if asset=='product' else 'Perspective projection of three native 2048px graphic compositions with Cycles product photography',
                  renditions=records, stills=assets)
    (OUT/(name+'-delivery.json')).write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2),flush=True)


if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('asset',choices=['product','campaign'])
    deliver(parser.parse_args().asset)
