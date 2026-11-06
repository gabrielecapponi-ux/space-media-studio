"""Recreate the director films from the Space Media production archive."""
import argparse
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

RECIPE_DIR = Path(__file__).resolve().parent
ROOT = RECIPE_DIR.parents[1]
WORK = ROOT / "outputs/director-20261106/craft"
FLAGSHIP = ROOT / "outputs/flagship-20261106"
NATIVE = ROOT / "outputs/motion-refinement-20261105"
ASSETS = ("product", "brand", "funding")
PROFILES = ("desktop", "mobile")


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def verify_delivery():
    release = json.loads((RECIPE_DIR / "delivery.json").read_text())
    for record in release["assets"]:
        path = ROOT / record["mp4"]
        if digest(path) != record["sha256"] or path.stat().st_size != record["bytes"]:
            raise SystemExit(f"File video diverso dalla consegna: {path}")
        for label in ("poster", "thumbnail"):
            if digest(ROOT / record[label]) != record[label + "_sha256"]:
                raise SystemExit(f"Immagine diversa dalla consegna: {record[label]}")
        result = subprocess.check_output(
            ["ffprobe", "-v", "error", "-show_streams", "-of", "json", str(path)]
        )
        streams = json.loads(result)["streams"]
        video = streams[0]
        valid = (
            len(streams) == 1
            and video["codec_name"] == "h264"
            and [video["width"], video["height"]] == record["size"]
            and video["avg_frame_rate"] == f"{record['fps']}/1"
            and int(video["nb_frames"]) == record["frames"]
        )
        if not valid:
            raise SystemExit(f"Profilo video inatteso: {path}")
        print(f"{path.name}  {record['fps']} fps, {record['frames']} fotogrammi, SHA-256 OK")


def required_inputs():
    yield FLAGSHIP / "luma/luma-optical-bench.blend"
    yield FLAGSHIP / "luma/bench.geometry"
    for profile in PROFILES:
        yield FLAGSHIP / "luma" / profile / "camera.json"
        for folder in ("plates", "floor"):
            for shot in ("hero", "optic", "dial"):
                yield FLAGSHIP / "luma" / profile / folder / (shot + ".png")
        for asset in ("brand", "funding"):
            folder = FLAGSHIP / asset / profile
            yield folder / f"{asset}-macro-{profile}.blend"
            yield folder / "macro-plate.png"
            base = NATIVE / asset / profile
            sequence = base / ("frames-balanced" if asset == "brand" else "frames")
            for number in range(1, 481 if asset == "brand" else 721):
                yield sequence / f"{number:04}.png"
        base = NATIVE / "funding" / profile
        yield base / "composite-delivery.json"
        for number in range(683, 721):
            yield base / "transition-passes" / f"{number:04}-b.png"
        suffix = "-mobile" if profile == "mobile" else ""
        for asset in ASSETS:
            yield ROOT / "public/films" / f"flagship-{asset}{suffix}.mp4"


def preflight():
    if sys.platform != "darwin":
        raise SystemExit("La produzione usa Metal su macOS.")
    if sys.version_info < (3, 11):
        raise SystemExit("Usare Python 3.11 o successivo.")
    import PIL
    for name in ("blender", "ffmpeg", "ffprobe", "clang++"):
        if not shutil.which(name):
            raise SystemExit(f"Dipendenza mancante nel PATH: {name}")
    encoders = subprocess.check_output(["ffmpeg", "-hide_banner", "-encoders"], stderr=subprocess.STDOUT)
    if b"libx264" not in encoders:
        raise SystemExit("ffmpeg deve includere libx264.")
    missing = [str(p.relative_to(ROOT)) for p in required_inputs() if not p.is_file()]
    if missing:
        raise SystemExit(f"{len(missing)} input privati mancanti. Il primo: {missing[0]}")
    print(f"Archivio, strumenti e Pillow {PIL.__version__} verificati.")


def run(label, command):
    with (WORK / (label + ".log")).open("w") as log:
        print(label, flush=True)
        result = subprocess.run(command, stdout=log, stderr=subprocess.STDOUT)
    if result.returncode:
        raise SystemExit(f"{label}: vedere {log.name}")


def blender(script, *args):
    command = ["blender", "-b", "-t", "3", "--python-exit-code", "24", "-P", str(RECIPE_DIR / script)]
    if args:
        command.extend(["--", *args])
    return command


def produce():
    preflight()
    WORK.mkdir(exist_ok=True, parents=True)
    command = ["clang++", "-std=c++17", "-O2", "-fobjc-arc"]
    for framework in ("Foundation", "Metal", "CoreGraphics", "ImageIO"):
        command.extend(["-framework", framework])
    run("compile", command + [str(RECIPE_DIR / "rail.mm"), "-o", str(WORK / "rail")])
    run("calibrate", blender("calibrate.py"))
    for asset in ASSETS:
        for profile in PROFILES:
            run(f"photograph-{asset}-{profile}", blender("photograph.py", asset, profile))
            run(f"edit-{asset}-{profile}", [sys.executable, str(RECIPE_DIR / "edit.py"), asset, profile])
        run(f"phone-{asset}", [sys.executable, str(RECIPE_DIR / "adapt-phone.py"), asset])
    run("receipt", [sys.executable, str(RECIPE_DIR / "receipt.py")])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--check", action="store_true", help="controlla l’archivio e le dipendenze")
    modes.add_argument("--verify", action="store_true", help="verifica i media pubblici contro la ricevuta")
    args = parser.parse_args()
    if args.check:
        preflight()
    elif args.verify:
        verify_delivery()
    else:
        produce()
