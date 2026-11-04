"""Prepare approved Higgsfield product media without changing its native cadence.

The source is preserved. Inspect first; run encode only after visual approval.
Delivery versions keep all source frames, with an optional declared tail dissolve.
The portrait is a native-height crop followed by downsampling, never an upscale.
"""
import argparse
import hashlib
import json
import shutil
import struct
import subprocess
from fractions import Fraction
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'outputs/motion-product-20261104'


def run(args):
    subprocess.run(args, check=True)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def relative(path):
    return str(path.resolve().relative_to(ROOT))


def probe(path):
    data = json.loads(subprocess.check_output([
        'ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)
    ], text=True))
    data['format']['filename'] = relative(path)
    return data


def video_stream(data):
    return next(s for s in data['streams'] if s['codec_type'] == 'video')


def frame(source, number, output, filters=''):
    output.parent.mkdir(parents=True, exist_ok=True)
    chain = f'select=eq(n\\,{number})' + (',' + filters if filters else '')
    run(['ffmpeg', '-v', 'error', '-y', '-i', str(source), '-vf', chain,
         '-frames:v', '1', '-threads', '2', str(output)])


def faststart(path):
    offsets = {}
    with path.open('rb') as stream:
        while True:
            pos = stream.tell()
            head = stream.read(8)
            if len(head) != 8:
                break
            size, name = struct.unpack('>I4s', head)
            skip = 8
            if size == 1:
                size = struct.unpack('>Q', stream.read(8))[0]
                skip = 16
            offsets[name.decode('ascii', errors='replace')] = pos
            if size < skip:
                break
            stream.seek(size - skip, 1)
    assert offsets['moov'] < offsets['mdat'], offsets
    return offsets


def all_pixels(path, width, height, count):
    """Decode every full-resolution output frame, bounding working memory."""
    process = subprocess.Popen([
        'ffmpeg', '-v', 'error', '-i', str(path), '-map', '0:v:0', '-f', 'rawvideo',
        '-pix_fmt', 'rgb24', '-threads', '2', 'pipe:1'
    ], stdout=subprocess.PIPE)
    size = width * height * 3
    means, deltas = [], []
    first = previous = None
    ordered = hashlib.sha256()
    while True:
        raw = process.stdout.read(size)
        if not raw:
            break
        assert len(raw) == size, ('Incomplete decoded frame', len(raw), size)
        ordered.update(raw)
        image = Image.frombytes('RGB', (width, height), raw)
        means.append(sum(ImageStat.Stat(image).mean) / 3)
        if first is None:
            first = image.copy()
        if previous is not None:
            deltas.append(sum(ImageStat.Stat(ImageChops.difference(previous, image)).mean) / 3)
        previous = image
    assert process.wait() == 0
    assert len(means) == count, (len(means), count)
    assert min(means) > 1.0, ('Possible empty black frame', min(means))
    seam = sum(ImageStat.Stat(ImageChops.difference(previous, first)).mean) / 3
    assert max(deltas) < 12.0, ('Possible hard frame discontinuity', max(deltas))
    assert seam < 3.0, ('Loop closure needs inspection or a short declared dissolve', seam)
    return {
        'decoded_full_resolution_frames': len(means),
        'ordered_decoded_rgb_sha256': ordered.hexdigest(),
        'frame_mean_rgb_range': [min(means), max(means)],
        'maximum_adjacent_mean_absolute_rgb': max(deltas),
        'last_first_mean_absolute_rgb': seam,
        'empty_black_frame_gate': 'passed; every full-resolution decoded frame mean above 1/255',
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', choices=['inspect', 'encode'], default='inspect')
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--crop-x', type=int)
    parser.add_argument('--tail-blend-frames', type=int, default=0)
    parser.add_argument('--job-id', default='93cbca2c-9156-4a4c-aeb4-21ec50b16606')
    parser.add_argument('--anchor', type=Path, default=OUT / 'keyframe-for-generation.jpg')
    parser.add_argument('--visual-note', default='Pending native contact-sheet review by the supervising agent')
    args = parser.parse_args()
    source = args.source.resolve()
    assert source.is_file(), source
    OUT.mkdir(parents=True, exist_ok=True)
    metadata = probe(source)
    stream = video_stream(metadata)
    width, height = stream['width'], stream['height']
    fps = Fraction(stream['avg_frame_rate'])
    count = int(stream['nb_frames'])
    assert Fraction(stream['r_frame_rate']) == fps, 'Expected a native constant-rate source'
    assert (width, height) == (1920, 1080), 'Do not silently upscale a model-adjusted source'
    crop_width = int(height * 4 / 5) // 2 * 2
    crop_x = args.crop_x if args.crop_x is not None else (width - crop_width) // 4 * 2
    assert 0 <= crop_x <= width - crop_width and crop_x % 2 == 0
    assert crop_width >= 720 and height >= 900
    assert args.tail_blend_frames == 0 or 2 <= args.tail_blend_frames < count / 4
    (OUT / 'source-approved-probe.json').write_text(json.dumps(metadata, indent=2) + '\n')

    picks = sorted(set(round(i * (count - 1) / 8) for i in range(9)))
    for number in picks:
        native = OUT / 'inspection/native' / f'{number:04}.png'
        portrait = OUT / 'inspection/portrait' / f'{number:04}.png'
        frame(source, number, native)
        frame(source, number, portrait, f'crop={crop_width}:{height}:{crop_x}:0')
    for label, size in [('native', (480, 270)), ('portrait', (240, 300))]:
        sheet = Image.new('RGB', (size[0] * 3, size[1] * 3))
        for i, number in enumerate(picks):
            with Image.open(OUT / 'inspection' / label / f'{number:04}.png') as image:
                sheet.paste(image.resize(size, Image.Resampling.LANCZOS),
                            ((i % 3) * size[0], (i // 3) * size[1]))
        sheet.save(OUT / f'contact-{label}.jpg', quality=94)
    print(json.dumps({'source': relative(source), 'native': [width, height], 'fps': str(fps),
                      'frames': count, 'native_portrait_crop': [crop_x, 0, crop_width, height],
                      'inspection_frames': picks, 'mode': args.mode}), flush=True)
    if args.mode == 'inspect':
        return

    # No geometry or identity is inferred from these pixels. Review precedes encode.
    assert not args.visual_note.startswith('Pending'), 'Record the actual visual source/crop review'
    first = OUT / 'inspection/native/0000.png'
    checks, assets, candidates = {}, [], []
    for label, delivered in [('desktop', (1920, 1080)), ('mobile', (720, 900))]:
        folder = OUT / label
        folder.mkdir(exist_ok=True)
        master = folder / 'processed-lossless.mkv'
        chain = '[0:v]setpts=PTS-STARTPTS,format=yuv444p[source];'
        if args.tail_blend_frames:
            start = float(Fraction(count - args.tail_blend_frames, 1) / fps)
            duration = float(Fraction(args.tail_blend_frames - 1, 1) / fps)
            assert duration > 0
            expression = f'clip((T-{start:.12f})/{duration:.12f},0,1)'
            chain += ('[1:v]setpts=PTS-STARTPTS,format=yuv444p[first];'
                      f"[source][first]blend=all_expr='A*(1-{expression})+B*{expression}'[loop];")
        else:
            chain += '[source]null[loop];'
        profile = ('null' if label == 'desktop' else
                   f'crop={crop_width}:{height}:{crop_x}:0,scale=720:900:flags=lanczos')
        chain += f'[loop]{profile},format=yuv444p[output]'
        command = ['ffmpeg', '-v', 'error', '-y', '-i', str(source)]
        if args.tail_blend_frames:
            command += ['-loop', '1', '-framerate', str(fps), '-i', str(first)]
        command += ['-filter_complex_threads', '1', '-filter_complex', chain,
                    '-map', '[output]', '-frames:v', str(count), '-an', '-fps_mode', 'passthrough',
                    '-c:v', 'ffv1', '-level', '3', '-threads', '4', '-color_primaries', 'bt709',
                    '-color_trc', 'bt709', '-colorspace', 'bt709', str(master)]
        run(command)
        film = folder / 'delivery.mp4'
        run(['ffmpeg', '-v', 'error', '-y', '-i', str(master), '-frames:v', str(count),
             '-an', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-threads', '4',
             '-profile:v', 'high', '-level', '4.1', '-pix_fmt', 'yuv420p', '-fps_mode', 'passthrough',
             '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
             '-movflags', '+faststart', str(film)])
        profile_probe = probe(film)
        info = video_stream(profile_probe)
        assert [info['width'], info['height']] == list(delivered)
        assert Fraction(info['avg_frame_rate']) == fps and int(info['nb_frames']) == count
        assert info['codec_name'] == 'h264' and info['pix_fmt'] == 'yuv420p'
        assert len(profile_probe['streams']) == 1, 'Silent video only'
        pixels = all_pixels(film, *delivered, count)
        atom_offsets = faststart(film)
        samples = []
        for number in [0, count // 2, count - 1]:
            reference = folder / f'reference-{number:04}.png'
            encoded = folder / f'encoded-{number:04}.png'
            frame(master, number, reference)
            frame(film, number, encoded)
            with Image.open(reference) as a, Image.open(encoded) as b:
                mean = ImageStat.Stat(ImageChops.difference(a.convert('RGB'), b.convert('RGB'))).mean
                assert sum(mean) / 3 < 3.5, (label, number, mean)
            samples.append({'frame': number, 'encoded_vs_lossless_mean_absolute_rgb': mean})
        poster = folder / 'poster.jpg'
        run(['ffmpeg', '-v', 'error', '-y', '-i', str(master), '-frames:v', '1', '-q:v', '2',
             '-threads', '2', str(poster)])
        assert Image.open(poster).size == delivered
        name = 'motion-product' + ('-mobile' if label == 'mobile' else '')
        for source_path, destination in [
                (film, ROOT / 'public/films' / f'{name}.mp4'),
                (poster, ROOT / 'public/images' / f'{name}.jpg')]:
            candidates.append((source_path, destination, label))
        checks[label] = {'native_output': list(delivered), 'fps': str(fps), 'frames': count,
                         'all_frames_full_decode': 'passed', 'pixels': pixels,
                         'sampled_encoded_vs_lossless': samples, 'mp4_atom_offsets': atom_offsets,
                         'probe': profile_probe}

    # Publish files into the local working tree only after both profiles pass.
    for source_path, destination, label in candidates:
        shutil.copyfile(source_path, destination)
        assets.append({'path': relative(destination), 'profile': label,
                       'bytes': destination.stat().st_size, 'sha256': digest(destination)})
    rejected = OUT / 'source.mp4'
    manifest = {
        'schema_version': 1, 'id': 'motion-product-20261104', 'concept': 'ORA / Product film',
        'method': 'Higgsfield-generated cinematic product footage; cropped/downsampled native-cadence delivery, not an authored Blender mesh',
        'commercial_status': 'Original fictional product concept; no client commission or authentic manufactured product claim',
        'model': 'Seedance 2.5 through Higgsfield', 'job_id': args.job_id,
        'source': {'path': relative(source), 'bytes': source.stat().st_size,
                   'sha256': digest(source), 'probe': metadata},
        'generation_anchor': {'path': relative(args.anchor), 'sha256': digest(args.anchor),
                              'roles': ['start_image', 'end_image'],
                              'derived_from_rejected_attempt_frame': 0},
        'generation_attempts': {'approved_job_id': args.job_id, 'approved_source_quoted_credits': 128,
                                'rejected_job_id': '4843ab07-828a-458c-b38d-39d852aa39c1',
                                'rejected_source': relative(rejected), 'rejected_source_sha256': digest(rejected),
                                'rejected_reason': 'Two-reference product identity transition and double-label ghosting. The rejected video is not used in delivery; only its native frame0 was used as the single consistent regeneration anchor.',
                                'rejected_attempt_quoted_credits': 128},
        'visual_review': args.visual_note,
        'portrait_crop_native': [crop_x, 0, crop_width, height],
        'portrait_delivery': [720, 900],
        'fps_policy': 'All source frames retained at the actual source cadence; no optical interpolation, synthetic motion frames, or speed change',
        'tail_blend_frames': args.tail_blend_frames,
        'loop': ('Native first/last-frame closure' if not args.tail_blend_frames else
                 'Closing frames dissolve toward the actual first source still; no reverse playback'),
        'audio': False, 'upscale': False, 'optical_interpolation': False,
        'script': {'path': relative(Path(__file__)), 'sha256': digest(Path(__file__))},
        'ffmpeg': subprocess.check_output(['ffmpeg', '-version'], text=True).splitlines()[0],
        'checks': checks, 'assets': assets,
    }
    (ROOT / 'ASSET-MOTION-PRODUCT-20261104.json').write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'assets': assets, 'manifest': 'ASSET-MOTION-PRODUCT-20261104.json'}), flush=True)


if __name__ == '__main__':
    main()
