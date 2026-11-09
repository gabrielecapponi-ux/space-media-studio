"""Add a 1080p60 rendition for desktop connections between 6 and 12 Mbit/s."""
import argparse
import hashlib
import json

from deliver import ROOT, OUT, run, validate


def render(asset):
    name = 'elegant-' + asset
    master = ROOT / 'public/films' / (name + '.mp4')
    target = ROOT / 'public/films' / (name + '-hd.mp4')
    pending = OUT / (name + '-hd.pending.mp4')
    receipt = OUT / (name + '-delivery.json')
    record = json.loads(receipt.read_text())
    assert hashlib.sha256(master.read_bytes()).hexdigest() == record['renditions'][0]['sha256']
    run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-threads', '2', '-i', str(master), '-an',
         '-filter_threads', '2', '-vf', 'scale=1920:1080:flags=lanczos', '-c:v', 'libx264',
         '-threads', '3', '-preset', 'medium', '-b:v', '3000k', '-maxrate', '4600k', '-bufsize', '750k',
         '-profile:v', 'high', '-level:v', '4.2', '-g', '60', '-keyint_min', '60', '-sc_threshold', '0',
         '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
         '-movflags', '+faststart', str(pending)])
    pending.replace(target)
    hd = validate(target, (1920, 1080), 60)
    assert hd['peak_bitrate_one_second'] < 6_000_000
    record['renditions'] = [record['renditions'][0], hd, record['renditions'][-1]]
    receipt.write_text(json.dumps(record, indent=2) + '\n')
    rows = [json.loads((OUT / ('elegant-' + item + '-delivery.json')).read_text())
            for item in ['product', 'campaign']]
    (ROOT / 'scripts/elegant-films/delivery.json').write_text(json.dumps({'edition': '2026-11-09', 'films': rows}, indent=2) + '\n')
    print(json.dumps(hd, indent=2), flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('asset', choices=['product', 'campaign'])
    render(parser.parse_args().asset)
