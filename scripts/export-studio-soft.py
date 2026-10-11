"""Encode and validate original local Blender frames for Space's website."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "outputs/studio-soft"
MASTER = OUT / "master.mp4"
MOBILE_FILTER = "crop=1280:1080,scale=640:540:flags=lanczos,pad=640:900:0:180:color=0x090b10,setsar=1"


def run(args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def probe(path):
    data = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries",
        "stream=codec_name,codec_type,width,height,pix_fmt,r_frame_rate,nb_frames,color_range,color_space,color_transfer,color_primaries:format=duration",
        "-of", "json", str(path)]))
    stream = next(item for item in data["streams"] if item["codec_type"] == "video")
    assert stream["codec_name"] == "h264", data
    assert stream["r_frame_rate"] == "24/1" and int(stream["nb_frames"]) == 144, data
    assert stream["pix_fmt"] == "yuv420p", data
    assert abs(float(data["format"]["duration"]) - 6) < .01, data
    assert not any(item["codec_type"] == "audio" for item in data["streams"]), data
    encoded = path.read_bytes()
    assert 0 < encoded.find(b"moov") < encoded.find(b"mdat"), "Faststart header missing"
    subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "null", "-"], check=True)
    return data


source = json.loads((OUT / "manifest.json").read_text())
collision_check = json.loads((OUT / "collision-check/collision-check.json").read_text())
assert collision_check["frames_checked"] == 144 and not collision_check["surface_intersections"], collision_check
assert source["width"] == 1920 and source["height"] == 1080 and not source["preview"], source
assert source["frames"] == 144 and source["sculpture_modules"] == 8, source
assert source["loop_boundary_max_transform_error"] < 1e-7, source
frames = sorted((OUT / "frames").glob("soft_*.png"))
assert len(frames) == 144, len(frames)
assert frames[0].name == "soft_0001.png" and frames[-1].name == "soft_0144.png"
run(["-framerate", "24", "-start_number", "1", "-i", str(OUT / "frames/soft_%04d.png"),
     "-frames:v", "144", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "14",
     "-threads", "4", "-vf", "scale=out_color_matrix=bt709:out_range=tv", "-pix_fmt", "yuv420p",
     "-color_primaries", "bt709", "-color_trc", "iec61966-2-1", "-colorspace", "bt709",
     "-color_range", "tv", "-movflags", "+faststart", str(MASTER)])
probe(MASTER)
exports, posters = {}, {}
for variant, dimensions in (("desktop", (1920, 1080)), ("mobile", (640, 900))):
    target = ROOT / f"public/films/studio-soft-{variant}.mp4"
    args = ["-i", str(MASTER)]
    if variant == "mobile":
        args += ["-vf", MOBILE_FILTER]
    args += ["-an", "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-threads", "4",
             "-pix_fmt", "yuv420p", "-profile:v", "high", "-level:v", "4.1", "-g", "48",
             "-keyint_min", "24", "-sc_threshold", "0", "-color_primaries", "bt709",
             "-color_trc", "iec61966-2-1", "-colorspace", "bt709", "-color_range", "tv",
             "-movflags", "+faststart", str(target)]
    run(args)
    validation = probe(target)
    stream = validation["streams"][0]
    assert (stream["width"], stream["height"]) == dimensions, validation
    exports[variant] = {"file": str(target.relative_to(ROOT)), "bytes": target.stat().st_size,
                        "sha256": sha(target), "validation": validation}
    for label, frame in (("start-", 0), ("", 72)):
        poster = ROOT / f"public/images/studio-soft-{label}{variant}.jpg"
        run(["-i", str(target), "-vf", f"select=eq(n\\,{frame})", "-frames:v", "1", "-q:v", "3", str(poster)])
        posters[poster.name] = {"frame": frame + 1, "bytes": poster.stat().st_size, "sha256": sha(poster)}

manifest = {
    "title": "Space / Soft motion study",
    "source": "Original procedural Blender superellipsoids, materials, studio lighting, camera and choreography",
    "render": source,
    "render_passes": ([{"frames": [1, 144], "purpose": "Initial full resolution render"},
                       {"frames": [41, 107], "purpose": "Replace stack transitions with collision-safe choreography"}]
                      if source.get("render_range") == [41, 107] else [{"frames": [1, 144], "purpose": "Full resolution render"}]),
    "collision_check": collision_check,
    "render_script_sha256": sha(ROOT / "scripts/render-studio-soft.py"),
    "export_script_sha256": sha(ROOT / "scripts/export-studio-soft.py"),
    "blend_sha256": sha(OUT / "studio-soft.blend"),
    "composition": {"tools": ["Local Blender", "Local FFmpeg"], "status": "success",
                    "ai_model_weights_used": False, "external_assets_used": False,
                    "paid_api_used": False, "comfyui_used": False},
    "master_sha256": sha(MASTER),
    "mobile_filter": MOBILE_FILTER,
    "exports": exports,
    "posters": posters,
    "ffmpeg": subprocess.check_output(["ffmpeg", "-version"], text=True).splitlines()[0],
    "loop": "Periodic absolute poses. Frame145 matches frame1; frames1–144 exported in chronological order, without reverse footage.",
    "validation": "Both exports fully decoded with FFmpeg; resolution, frame count, duration, format and faststart verified.",
}
(ROOT / "ASSET-STUDIO-SOFT.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
print(json.dumps({variant: {"bytes": item["bytes"], "sha256": item["sha256"]} for variant, item in exports.items()}, indent=2))
