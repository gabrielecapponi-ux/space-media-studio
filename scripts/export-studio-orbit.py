"""Export the verified local Blender/ComfyUI master for the responsive website."""
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MASTER = ROOT / "outputs/studio-orbit/master.mp4"
PROVENANCE = ROOT / "outputs/studio-orbit-comfy/provenance.json"
MOBILE_FILTER = "crop=1280:1080,scale=640:540:flags=lanczos,pad=640:900:0:180:color=0x090b10,setsar=1"


def run(args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args], check=True)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def probe(path):
    result = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries",
        "stream=codec_name,codec_type,width,height,pix_fmt,r_frame_rate,nb_frames,color_range,color_space,color_transfer,color_primaries:format=duration",
        "-of", "json", str(path)]))
    stream = next(item for item in result["streams"] if item["codec_type"] == "video")
    assert stream["r_frame_rate"] == "24/1" and int(stream["nb_frames"]) == 144, result
    assert stream["pix_fmt"] == "yuv420p", result
    assert abs(float(result["format"]["duration"]) - 6) < .01, result
    assert not any(item["codec_type"] == "audio" for item in result["streams"]), result
    subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "null", "-"], check=True)
    return result


source = json.loads(PROVENANCE.read_text())
assert source["job_id"] and not source["model_weights_used"]
assert sha(MASTER) == source["master"]["sha256"], "Master changed after ComfyUI validation"
exports, posters = {}, {}
for variant, dimensions in (("desktop", (1920, 1080)), ("mobile", (640, 900))):
    target = ROOT / f"public/films/studio-orbit-{variant}.mp4"
    args = ["-i", str(MASTER)]
    if variant == "mobile":
        args += ["-vf", MOBILE_FILTER]
    args += ["-an", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-threads", "4",
             "-pix_fmt", "yuv420p", "-profile:v", "high", "-level:v", "4.1", "-g", "48",
             "-keyint_min", "24", "-sc_threshold", "0", "-color_primaries", "bt709",
             "-color_trc", "iec61966-2-1", "-colorspace", "bt709", "-movflags", "+faststart", str(target)]
    run(args)
    validation = probe(target)
    stream = validation["streams"][0]
    assert (stream["width"], stream["height"]) == dimensions, validation
    exports[variant] = {"file": str(target.relative_to(ROOT)), "bytes": target.stat().st_size,
                        "sha256": sha(target), "validation": validation}
    for label, frame in (("start-", 0), ("", 72)):
        poster = ROOT / f"public/images/studio-orbit-{label}{variant}.jpg"
        run(["-i", str(target), "-vf", f"select=eq(n\\,{frame})", "-frames:v", "1", "-q:v", "3", str(poster)])
        posters[poster.name] = {"frame": frame + 1, "bytes": poster.stat().st_size, "sha256": sha(poster)}

manifest = {
    "title": "Space / Motion study 02",
    "source": "Original procedural Blender geometry, materials, lighting, camera and choreography",
    "render": source["blender_manifest"],
    "render_script_sha256": sha(ROOT / "scripts/render-studio-orbit.py"),
    "composition": {"tool": "Local ComfyUI native video nodes, CPU",
                    "nodes": ["LoadVideo", "LoadVideo", "ConcatenateVideo", "SaveVideo"],
                    "job_id": source["job_id"], "status": "success", "commit": source["comfyui_commit"],
                    "model_weights_used": False, "paid_api_used": False},
    "master_sha256": sha(MASTER),
    "mobile_filter": MOBILE_FILTER,
    "exports": exports, "posters": posters,
    "ffmpeg": source["ffmpeg_version"],
    "loop": "Periodic absolute poses. Frame145 matches frame1; frames1–144 exported in chronological order.",
}
(ROOT / "ASSET-STUDIO-ORBIT.json").write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
print(json.dumps({variant: {"bytes": item["bytes"], "sha256": item["sha256"]} for variant, item in exports.items()}, indent=2))
