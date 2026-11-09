"""Recompose the three SHIFT formats in native QHD with high-resolution typography."""
import importlib.util
import math
import subprocess
import sys
import time
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'outputs/reentry-20261109/films'
sys.path.insert(0, str(ROOT / 'scripts/director-shift'))
spec = importlib.util.spec_from_file_location('shift_direction', ROOT / 'scripts/director-shift/render.py')
original = importlib.util.module_from_spec(spec)
spec.loader.exec_module(original)
from plates import Posters, face_font


class Prints(Posters):
    """Each digital print is redrawn at twice its previous native pixel size."""
    def __init__(self):
        photos = ROOT / 'outputs/flagship-20261106/shift'
        self.photos = {name: Image.open(photos / ('phase-' + name + '.png')).convert('RGB')
                       for name in ('hero', 'overhead', 'detail')}
        self.layout = {}
        for name, size in {'story': (1152, 2048), 'square': (2048, 2048), 'banner': (2048, 1152)}.items():
            width, height = size
            if name == 'square':
                color, ink, photo, slot = (233, 232, 222), (28, 31, 28), 'hero', (0, 448, width, 1832)
            elif name == 'story':
                color, ink, photo, slot = (28, 31, 29), (239, 241, 225), 'overhead', (0, 566, width, 1662)
            else:
                color, ink, photo, slot = (210, 94, 58), (33, 37, 31), 'detail', (820, 0, width, height)
            base = Image.new('RGB', size, color)
            draw = ImageDraw.Draw(base)
            if name == 'square':
                draw.text((88, 56), 'SHIFT AUDIO', font=face_font(54, True), fill=ink, anchor='lt')
                draw.text((width - 88, 68), 'STEREO SAMPLER', font=face_font(38, mono=True), fill=ink, anchor='rt')
                draw.text((72, 152), 'PHASE 01', font=face_font(326, True), fill=ink, anchor='lt')
                draw.rectangle((0, 1832, width, height), fill=(215, 99, 57))
                draw.text((84, 1904), '16 PAD  /  4 ENCODER', font=face_font(48, mono=True), fill=ink, anchor='lt')
            elif name == 'story':
                draw.text((58, 62), 'SHIFT AUDIO', font=face_font(52, True), fill=ink, anchor='lt')
                draw.text((54, 200), 'PHASE', font=face_font(230, True), fill=ink, anchor='lt')
                draw.text((58, 410), '01', font=face_font(172, True), fill=(230, 112, 65), anchor='lt')
                draw.text((60, 1748), 'CAMPIONATORE', font=face_font(78, True), fill=ink, anchor='lt')
                draw.text((60, 1840), 'STEREO', font=face_font(78, True), fill=ink, anchor='lt')
            else:
                draw.text((64, 64), 'SHIFT AUDIO', font=face_font(56, True), fill=ink, anchor='lt')
                draw.text((54, 358), 'PHASE', font=face_font(216, True), fill=ink, anchor='lt')
                draw.text((52, 562), '01', font=face_font(288, True), fill=ink, anchor='lt')
                draw.text((64, 1020), 'STEREO SAMPLER', font=face_font(44, mono=True), fill=ink, anchor='lt')
            self.layout[name] = (base, photo, slot)


class Gallery(original.Campaign):
    def __init__(self):
        original.SIZES['desktop'] = (2560, 1440)
        original.Posters = Prints
        super().__init__('desktop')
        self.nodes = {
            'story': (-5.55, 2.74, -.24, 2.86, .12),
            'square': (-.26, 2.54, .05, 4.65, -.065),
            'banner': (5.95, 2.23, -.32, 6.15, -.16),
        }
        # Longer travel arcs with calm reading intervals. The loop resolves to
        # the identical first camera pose, instead of cutting across formats.
        self.keys = [(0, 'story'), (1.65, 'story'), (2.85, 'square'), (4.35, 'square'),
                     (5.55, 'banner'), (7.10, 'banner'), (8.15, 'wide'),
                     (8.72, 'wide'), (10, 'story')]

    def pose(self, name, theta):
        eye, target, focal = super().pose(name, theta)
        # Keep the physical camera drift small enough that the format, copy
        # and product read as one stable plane during each hero hold.
        dx = .145 * math.sin(theta + .72)
        dy = .045 * math.cos(theta - .26)
        return (eye[0] - dx * .44, eye[1] - dy * .40, eye[2]), target, focal


def render():
    OUT.mkdir(parents=True, exist_ok=True)
    scene = Gallery()
    target = ROOT / 'public/films/elegant-campaign.mp4'
    command = ['ffmpeg', '-nostdin', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'rawvideo',
               '-pixel_format', 'rgb24', '-video_size', '2560x1440', '-framerate', '60', '-i', 'pipe:0',
               '-an', '-filter_threads', '2', '-vf', 'scale=in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p',
               '-c:v', 'libx264', '-threads', '3', '-preset', 'medium', '-crf', '19', '-maxrate', '5800k',
               '-bufsize', '8M', '-profile:v', 'high', '-level:v', '5.1', '-g', '60', '-keyint_min', '60',
               '-sc_threshold', '0', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
               '-movflags', '+faststart', str(target)]
    encoder = subprocess.Popen(command, stdin=subprocess.PIPE)
    started = time.monotonic()
    try:
        for frame in range(600):
            encoder.stdin.write(scene.frame(frame).tobytes())
            if frame % 120 == 0:
                print(frame, round(time.monotonic() - started, 1), flush=True)
    finally:
        encoder.stdin.close()
    assert encoder.wait() == 0
    print(target, target.stat().st_size, flush=True)


if __name__ == '__main__':
    render()
