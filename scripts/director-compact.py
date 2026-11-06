"""Build and check 720p30 H.264 copies of the Space Media desktop service films."""
import argparse
import json
import subprocess
import tempfile
from fractions import Fraction
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILMS = ROOT / "public/films"
NAMES = ("product", "web", "brand", "campaign", "funding")
TARGET_BPS = 1_150_000
MAX_WINDOW_BPS = 1_650_000
FPS = 30


def probe(path, *entries):
    command = ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries"]
    command.extend([":".join(entries), "-of", "json", str(path)])
    return json.loads(subprocess.check_output(command))


def endpoint_luma(path, last):
    """Decode the whole film and retain reduced first and last frames for comparison."""
    filters = f"select='eq(n,0)+eq(n,{last})',scale=160:90:flags=lanczos,format=gray"
    return subprocess.check_output([
        "ffmpeg", "-v", "error", "-xerror", "-threads", "2", "-i", str(path), "-an",
        "-vf", filters, "-fps_mode", "passthrough", "-threads", "1", "-f", "rawvideo", "-"
    ])


def peak_one_second(packets):
    """Maximum packet payload in any 30 consecutive presentation frames."""
    sizes = [int(item["size"]) * 8 for item in sorted(packets, key=lambda item: float(item["pts_time"]))]
    total = peak = sum(sizes[:FPS])
    for previous, current in zip(sizes, sizes[FPS:]):
        total += current - previous
        peak = max(peak, total)
    return peak


def build(name):
    source = FILMS / f"director-{name}.mp4"
    destination = FILMS / f"director-{name}-compact.mp4"
    metadata = probe(source, "stream=width,height,avg_frame_rate,nb_frames")["streams"][0]
    assert (metadata["width"], metadata["height"], Fraction(metadata["avg_frame_rate"])) == (1920, 1080, 60)
    count = int(metadata["nb_frames"])
    assert count % 2 == 0
    expected = count // 2
    # Select genuine source poses, including both exact endpoints. Preserve the
    # original optical field and duration with one target frame per 1/30 second.
    filters = (f"select='not(mod(n,2))*lt(n,{count-2})+eq(n,{count-1})',"
               "setpts=N/(30*TB),scale=1280:720:flags=lanczos,setsar=1,format=yuv420p")
    with tempfile.TemporaryDirectory(dir=FILMS, prefix=".compact-") as temporary:
        work = Path(temporary)
        pending = work / destination.name
        command = [
            "ffmpeg", "-nostdin", "-v", "error", "-y", "-threads", "2", "-i", str(source),
            "-map", "0:v:0", "-an", "-vf", filters, "-r", str(FPS), "-fps_mode", "cfr",
            "-c:v", "libx264", "-preset", "medium", "-threads", "3", "-profile:v", "high",
            "-level:v", "3.1", "-b:v", str(TARGET_BPS), "-maxrate", "1450k", "-bufsize", "180k",
            "-g", "30", "-keyint_min", "30", "-sc_threshold", "0", "-colorspace", "bt709",
            "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
            "-passlogfile", str(work / "stats"),
        ]
        subprocess.run(command + ["-pass", "1", "-f", "null", "-"], check=True)
        subprocess.run(command + ["-pass", "2", "-movflags", "+faststart", str(pending)], check=True)
        data = probe(pending, "stream=width,height,avg_frame_rate,nb_frames,duration,bit_rate,codec_name,pix_fmt",
                     "packet=pts_time,size,flags")
        stream = data["streams"][0]
        assert (stream["width"], stream["height"], stream["codec_name"], stream["pix_fmt"]) == (1280, 720, "h264", "yuv420p")
        assert Fraction(stream["avg_frame_rate"]) == FPS and int(stream["nb_frames"]) == expected
        assert abs(float(stream["duration"]) - expected / FPS) < 0.00001
        ordered = sorted(data["packets"], key=lambda packet: float(packet["pts_time"]))
        assert all(abs(float(packet["pts_time"]) - i / FPS) < 0.000002 for i, packet in enumerate(ordered))
        assert [i for i, packet in enumerate(ordered) if "K" in packet["flags"]] == list(range(0, expected, FPS))
        peak = peak_one_second(ordered)
        assert peak <= MAX_WINDOW_BPS, (name, peak)
        file_bytes = pending.read_bytes()
        assert 0 <= file_bytes.find(b"moov") < file_bytes.find(b"mdat")
        original = endpoint_luma(source, count - 1)
        compact = endpoint_luma(pending, expected - 1)
        assert len(original) == len(compact) == 2 * 160 * 90
        error = sum(abs(a - b) for a, b in zip(original, compact)) / len(original)
        assert error < 6, (name, error)
        pending.replace(destination)
        print(f"{destination.name}: {len(file_bytes)} B; {stream['bit_rate']} bit/s average, "
              f"{peak} bit/s maximum over 1 s; {expected} frames; endpoint luma MAE {error:.2f}", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("films", nargs="*", help="ordered subset of product, web, brand, campaign, funding")
    selected = parser.parse_args().films or NAMES
    if any(name not in NAMES for name in selected):
        parser.error("invalid film name")
    for name in selected:
        build(name)
