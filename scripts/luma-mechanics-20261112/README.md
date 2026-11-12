# LUMA Mechanics · 12 November 2026

Original Space Media fictional camera, reusing the editable optical-bench geometry.
All body, lens groups, iris leaves, engraved dials and shutter movement is evaluated
in Blender for each native frame. This is not a photograph animated with a pan or
projected on a plane. There is no frame interpolation or resolution upscaling.

## Editable source and recipe

- Input: `outputs/flagship-20261106/luma/luma-optical-bench.blend`.
- Recipe: `build.py`; no external models/textures, all materials procedural.
- Independent rigs: body, three coaxial lens groups, three top dials, nine aperture
  pivots, shutter. Rotating dial engraving and knurling remain attached.
- Native loop: 10 seconds, desktop 60 fps, portrait 30 fps. The portrait has its own
  composition and is never derived by cropping the landscape movie.
- Master outputs: `outputs/luma-mechanics-20261112/luma-mechanics-{profile}.blend`.
- Production: Cycles Metal with solid refractive optics and denoising. The EEVEE
  experiment uses a thin Fresnel coating and was not selected for delivery.

## Reproduce

Run from the Space Media repository root with Blender 5.2.1 LTS, FFmpeg and cwebp installed.
The inherited editable lettering uses Arial Regular and Arial Bold. Both fonts
were already packed in the original source and remain packed in the two masters.
The verified packed-data hashes and original system paths are recorded in the
manifest. No external textures or linked Blender libraries are required:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/luma-mechanics-20261112/build.py -- --profile desktop --engine CYCLES --samples 20 --width 2560 --mode build
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/luma-mechanics-20261112/render-master.py -- --profile desktop --engine CYCLES --samples 20 --width 2560
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/luma-mechanics-20261112/build.py -- --profile portrait --engine CYCLES --samples 20 --width 1080 --mode build
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/luma-mechanics-20261112/render-master.py -- --profile portrait --engine CYCLES --samples 20 --width 1080
```

The build commands require the original optical-bench master at the input path
above. If the two final masters already exist, reuse the render commands without
rebuilding them; the saved chunk signatures guard against mixing different scenes.

After both native movies finish, run these commands in order to generate all
seven public assets, the two identical SHA manifests and the QA reports:

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/luma-mechanics-20261112/validate-master.py
python3 scripts/luma-mechanics-20261112/export.py
python3 scripts/luma-mechanics-20261112/temporal-qa.py
python3 scripts/luma-mechanics-20261112/contact-sheets.py
```

`export.py` writes QHD60, HD60, compact720p30 and portrait1080×1350/30 movies,
two WebP posters and the320×180 thumbnail. It verifies decoding, dimensions,
frame uniqueness and progressive download. The manifest is saved both in the
output directory and beside this README. `export.py --verify-only` rechecks the
existing seven assets and refreshes the manifest without re-encoding them.

Run proof mode before a production batch. The renderer streams native PNGs into resumable one-second H.264 chunks,
retains one review PNG every half-second plus the last frame, and keeps one
temporary frame. The editable Blender master reconstructs every full native frame.
Completed chunks can be resumed without rerendering. This avoids storing duplicate multi-gigabyte sequences on the nearly-full machine.
The output movie is staged privately and moved to public/films only on success.

Posters are exported from native frame 0001. The 320×180 index thumbnail uses
frame 0301 (a larger front-facing camera), encoded with cwebp. The source geometry, prior films and old historical masters remain unchanged.
Dates and publication status belong to the parent integration task; this asset task
never publishes or changes the active site manifest.
