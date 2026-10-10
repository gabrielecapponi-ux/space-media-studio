"""Encode original Blender frames and assemble them with native local ComfyUI nodes.

No diffusion model, model weights, external assets or paid API are used.
Run `prepare`, then `chapter1`, `chapter2` after the corrected render is ready,
then `assemble`. Each command retains its real inputs and execution evidence.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import struct
import subprocess
import time
from urllib.request import Request, urlopen
import uuid


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "outputs/studio-orbit"
BASE = ROOT / "outputs/studio-orbit-comfy"
SERVER = "http://127.0.0.1:8189"
APP = Path("/Users/gabrielecapponi/Documents/Codex/video-non-higgsfield-apps/ComfyUI")
FPS, WIDTH, HEIGHT = 24, 1920, 1080


def save(name, data):
    path = BASE / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def api(route, body=None):
    request = Request(SERVER + route, data=json.dumps(body).encode() if body is not None else None,
                      headers={"Content-Type": "application/json"})
    with urlopen(request, timeout=20) as response:
        return json.load(response)


def sha(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def probe(path, expected_frames):
    result = json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries",
        "stream=codec_name,codec_type,width,height,pix_fmt,r_frame_rate,nb_frames:format=duration",
        "-of", "json", str(path)]))
    video = next(stream for stream in result["streams"] if stream["codec_type"] == "video")
    assert (video["width"], video["height"]) == (WIDTH, HEIGHT), result
    assert video["r_frame_rate"] == f"{FPS}/1", result
    assert video["pix_fmt"] == "yuv420p", result
    assert int(video["nb_frames"]) == expected_frames, result
    assert abs(float(result["format"]["duration"]) - expected_frames / FPS) < .01, result
    assert not any(stream["codec_type"] == "audio" for stream in result["streams"]), result
    return result


def workflow():
    return {
        "prompt": {
            "1": {"class_type": "LoadVideo", "inputs": {"file": "space-orbit-chapter-1.mp4"}},
            "2": {"class_type": "LoadVideo", "inputs": {"file": "space-orbit-chapter-2.mp4"}},
            "3": {"class_type": "ConcatenateVideo", "inputs": {
                "videos.video0": ["1", 0], "videos.video1": ["2", 0], "codec": "auto"}},
            "4": {"class_type": "SaveVideo", "inputs": {
                "video": ["3", 0], "filename_prefix": "space-media/studio-orbit",
                "format": "mp4", "format.codec": "auto"}},
        },
        "client_id": str(uuid.uuid4()),
        "extra_data": {"extra_pnginfo": {
            "title": "Space / Motion study 02",
            "source": "Original procedural Blender Cycles render",
            "assembly": "Native local ComfyUI LoadVideo / ConcatenateVideo / SaveVideo",
            "model_weights_used": False,
            "external_assets_used": False,
        }},
    }


def prepare():
    for node in ("LoadVideo", "ConcatenateVideo", "SaveVideo"):
        result = api("/object_info/" + node)
        assert node in result, result
        save("node-" + node + ".json", result)
    save("workflow-api.json", workflow())
    print("Verified the three native video nodes; saved the API workflow. No job submitted.")


def chapter(number):
    first, last = ((1, 72) if number == 1 else (73, 144))
    frames = []
    for frame in range(first, last + 1):
        path = SOURCE / "frames" / f"orbit_{frame:04d}.png"
        with path.open("rb") as stream:
            header = stream.read(24)
            stream.seek(-12, 2)
            tail = stream.read()
        assert header[:8] == b"\x89PNG\r\n\x1a\n", f"Invalid PNG: {path}"
        assert struct.unpack(">II", header[16:24]) == (WIDTH, HEIGHT), f"Wrong dimensions: {path}"
        assert tail == b"\x00\x00\x00\x00IEND\xaeB`\x82", f"Incomplete PNG: {path}"
        frames.append({"frame": frame, "bytes": path.stat().st_size, "sha256": sha(path)})
    target = BASE / "input" / f"space-orbit-chapter-{number}.mp4"
    target.parent.mkdir(parents=True, exist_ok=True)
    command = [
        "ffmpeg", "-hide_banner", "-y", "-framerate", str(FPS), "-start_number", str(first),
        "-i", str(SOURCE / "frames/orbit_%04d.png"), "-frames:v", str(last - first + 1),
        "-vf", "scale=in_range=full:out_range=tv:out_color_matrix=bt709,format=yuv420p",
        "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-threads", "4",
        "-g", "48", "-keyint_min", "24", "-sc_threshold", "0", "-profile:v", "high",
        "-level:v", "4.1", "-color_primaries", "bt709", "-color_trc", "bt709",
        "-colorspace", "bt709", "-movflags", "+faststart", "-an", str(target),
    ]
    with (BASE / f"chapter-{number}.ffmpeg.log").open("wb") as log:
        subprocess.run(command, check=True, stdout=log, stderr=subprocess.STDOUT)
    metadata = {"chapter": number, "first_frame": first, "last_frame": last,
                "path": str(target), "bytes": target.stat().st_size, "sha256": sha(target),
                "encoder_argv": command, "validation": probe(target, 72), "frames": frames,
                "render_script_sha256": sha(ROOT / "scripts/render-studio-orbit.py")}
    save(f"chapter-{number}.json", metadata)
    print(json.dumps({"chapter": number, "path": str(target), "bytes": target.stat().st_size}))


def assemble():
    chapters = [json.loads((BASE / f"chapter-{number}.json").read_text()) for number in (1, 2)]
    assert chapters[0]["render_script_sha256"] == chapters[1]["render_script_sha256"], "Render source changed between chapters"
    for part in chapters:
        path = Path(part["path"])
        assert sha(path) == part["sha256"], f"Changed input: {path}"
        probe(path, 72)
    payload = workflow()
    save("workflow-api.json", payload)
    submission = api("/prompt", payload)
    save("submission.json", submission)
    assert submission.get("prompt_id") and not submission.get("node_errors"), submission
    job_id = submission["prompt_id"]
    print("Submitted real ComfyUI job " + job_id, flush=True)
    deadline = time.monotonic() + 55
    history = None
    while time.monotonic() < deadline:
        history = api("/history/" + job_id).get(job_id)
        if history:
            break
        time.sleep(1)
    assert history is not None, "Job still running; check its saved prompt_id, do not resubmit"
    save("history.json", history)
    assert history["status"]["status_str"] == "success", history["status"]
    videos = history["outputs"]["4"]["images"]
    result = next(item for item in videos if item["filename"].endswith(".mp4"))
    generated = BASE / "output" / result["subfolder"] / result["filename"]
    master = SOURCE / "master.mp4"
    shutil.copy2(generated, master)
    provenance = {
        "title": "Space / Motion study 02", "source": "Original Blender Cycles animation",
        "method": "144 authored frames, encoded as two sequential 72-frame H.264 chapters, concatenated by native local ComfyUI video nodes",
        "model_weights_used": False, "paid_api_used": False, "external_assets_used": False,
        "comfyui_commit": subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=APP, text=True).strip(),
        "ffmpeg_version": subprocess.check_output(["ffmpeg", "-version"], text=True).splitlines()[0],
        "blender_manifest": json.loads((SOURCE / "manifest.json").read_text()),
        "chapters": [{key: value for key, value in part.items() if key != "frames"} for part in chapters],
        "job_id": job_id, "submission": submission, "server_output": result,
        "master": {"path": str(master), "bytes": master.stat().st_size, "sha256": sha(master),
                   "validation": probe(master, 144)},
    }
    save("provenance.json", provenance)
    print(json.dumps({"job_id": job_id, "master": str(master), "bytes": master.stat().st_size, "frames": 144, "duration": 6}))


def wait_for_render():
    deadline = time.monotonic() + 30 * 60
    for number, final_frame in ((1, 72), (2, 144)):
        target = SOURCE / "frames" / f"orbit_{final_frame:04d}.png"
        while True:
            if target.exists() and target.stat().st_size >= 12:
                with target.open("rb") as stream:
                    stream.seek(-12, 2)
                    if stream.read() == b"\x00\x00\x00\x00IEND\xaeB`\x82":
                        break
            assert time.monotonic() < deadline, f"Render deadline exceeded before frame {final_frame}"
            count = len(list((SOURCE / "frames").glob("orbit_*.png")))
            print(f"Waiting for corrected render: {count}/144 frames; chapter {number} needs frame {final_frame}", flush=True)
            time.sleep(30)
        chapter(number)
    assemble()


def verify():
    """Prove that ComfyUI retained every decoded chapter frame in the right order."""
    def decoded(path, label):
        result = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(path),
                                          "-map", "0:v:0", "-f", "framemd5", "-"], text=True)
        (BASE / f"{label}.framemd5").write_text(result)
        return [line.rsplit(",", 1)[-1].strip() for line in result.splitlines()
                if line and not line.startswith("#")]
    first = decoded(BASE / "input/space-orbit-chapter-1.mp4", "chapter-1")
    second = decoded(BASE / "input/space-orbit-chapter-2.mp4", "chapter-2")
    master = SOURCE / "master.mp4"
    actual = decoded(master, "master")
    assert len(actual) == 144 and actual == first + second, "Decoded frame order or content changed"
    evidence = {"decoded_frames": len(actual), "all_frames_match_chapters_in_order": True,
                "master_sha256": sha(master), "validation": probe(master, 144)}
    save("frame-validation.json", evidence)
    print("Verified all 144 decoded frames match the two chapters in order; no drop, duplication or re-encoding.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("step", choices=("prepare", "chapter1", "chapter2", "assemble", "wait", "verify"))
    step = parser.parse_args().step
    BASE.mkdir(parents=True, exist_ok=True)
    if step == "prepare": prepare()
    elif step.startswith("chapter"): chapter(int(step[-1]))
    elif step == "wait": wait_for_render()
    elif step == "verify": verify()
    else: assemble()
