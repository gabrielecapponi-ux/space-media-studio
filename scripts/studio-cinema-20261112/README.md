# SPACE Blackbox — 12 November 2026

The original Space studio is rebuilt as a dark photographic production set: a physical extruded Space emblem with aperture, machined metal, soft grazing light, two workstations, nearfield monitors, rotary console and material samples. Nineteen named assembly groups and a continuous camera trajectory form the 4.8-second entrance. This is native Blender geometry and lighting, not a projected still or an AI video.

## Reproduction

Run from the repository root with Blender 5.2.1. The original private source is `outputs/studio-blender-20261105/space-studio-master.blend`; existing original water and LUMA posters are packed into the monitors. Source and final hashes are recorded in `asset-manifest.json`. Masters remain in the private `outputs/studio-cinema-20261112/` archive.

```sh
blender --background --python-exit-code 1 --python scripts/studio-cinema-20261112/build.py -- --profile desktop --mode build --width 2560
blender --background --python-exit-code 1 --python scripts/studio-cinema-20261112/build.py -- --profile portrait --mode build --width 1080
python3 scripts/studio-cinema-20261112/finish-pipeline.py
```

`finish-pipeline.py` uses the configured local Blender executable, Cycles Metal and OIDN. Adapt the executable/device to another machine, then regenerate the signature. The native desktop film contains 288 frames at 2560×1440/60; portrait contains 144 frames at 1080×1920/30. HD 1920×1080/60 is downsampled from desktop. No upscale, frame interpolation or 4K claim. Cycles 24 maximum samples with adaptive sampling, six bounces and subtle native motion blur.

The renderer writes one PNG at a time, keeps review frames and encodes resumable one-second H.264 CRF17 chunks. Chunk signatures include the master hash, dimensions and render settings. A different master cannot silently reuse old chunks. The final partial chunk is 48 desktop or 24 portrait frames; the output duration is 4.8 seconds. Exports are decoded in full, checked for frame uniqueness, codec and progressive faststart, then hashed. Poster images are the actual first native frames.

`--mode proof` saves the working master at the requested proof resolution. Rebuild at native dimensions before production if smaller proofs were used. Geometry validation reopens both masters, checks actual emblem vertices in the initial camera and reimports the GLB from scratch. The final close-up intentionally crops peripheral architecture; the main monitor is kept legible on portrait.

## Browser delivery

All devices attempt the matching muted inline film. A matching still protects the first frame. Blocked or failed autoplay loads `public/models/studio-blackbox-20261112.glb` and animates its metadata in `src/studio-blender-room.js`. The live fallback uses the same construction and camera route, with browser PBR lighting; it is not a path-traced render. Its main monitor can render the current page typography from the DOM. A failed film and failed GLB release the accessible site without announcing fictitious 100%. Motion reduction and Save Data retain the static accessible page.

The actual film ends, the hero first frame is decoded, then 100% remains visible for 420 ms before a 220 ms fade. The selected intro profile stays fixed during orientation changes, avoiding a second download/restart. Public release and browser observations are recorded separately from asset production.
