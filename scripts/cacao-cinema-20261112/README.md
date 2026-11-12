# CACAO Cinema · 12 November 2026

Original Space Media CACAO/ATELIER concept. The existing rigid package, six
chocolate tablets, raised leaf marks and champagne foil lettering are reused.
This recipe animates real Blender geometry rather than projected photographs.

The box turns on the floor, its rear hinge opens, six tablets rise in a controlled
sequence and rotate gently, and a physical camera moves into a central macro
before returning to the complete packshot. The top of the lid is deliberately
outside the central macro; chocolate and the front wordmark stay protected.
Terracotta/champagne identity is preserved. A continuous dark cove removes any
white frame edge or horizon. Procedural cocoa roughness and micron-scale relief
avoid a uniform plastic highlight; no external textures or image synthesis.

## Editable source

Input: `outputs/flagship-20261106/brand/desktop/brand-macro-desktop.blend`.
The source is preserved unmodified. The output masters and review frames live in
`outputs/cacao-cinema-20261112/`. Arial Regular and Arial Bold were already packed
in the original master; the verification records their hashes. No linked Blender
libraries or external textures are required.

## Reproduce

Use the installed Blender binary (validated here with Blender 5.2.1 LTS), FFmpeg
with libx264, and cwebp. Run from the repository root. Substitute the local Blender
binary for `blender` if it is not available on PATH.

```sh
blender --background --python scripts/cacao-cinema-20261112/build.py -- --profile desktop --mode proof --width 1280 --samples 20 --macro --frames 1,181,301
blender --background --python scripts/cacao-cinema-20261112/build.py -- --profile desktop --mode build --width 2560 --samples 20 --macro
blender --background --python scripts/cacao-cinema-20261112/build.py -- --profile portrait --mode build --width 1080 --samples 20 --macro
blender --background --python scripts/cacao-cinema-20261112/validate-master.py
blender --background --python scripts/cacao-cinema-20261112/render-master.py -- --profile desktop --width 2560 --samples 20
blender --background --python scripts/cacao-cinema-20261112/render-master.py -- --profile portrait --width 1080 --samples 20
python3 scripts/cacao-cinema-20261112/export.py
python3 scripts/cacao-cinema-20261112/temporal-qa.py
python3 scripts/cacao-cinema-20261112/contact-sheets.py
```

Native duration is eight seconds: desktop 2560×1440 at 60 fps, dedicated portrait
1080×1350 at 30 fps. HD 1920×1080/60 and compact 1280×720/30 are downscaled from the
QHD master. There is no optical interpolation, manufactured frame rate or upscale.
These are not 4K exports.

The renderer uses Cycles Metal, 20 maximum samples, 7 bounces, OIDN Metal and a small
motion-blur shutter. It streams PNGs into resumable one-second H.264 chunks and
retains native review frames. A signature prevents mixing different master or
render settings. Remaining disk space is checked before and during production.

Posters come from native frame 0001. The 320×180 thumbnail uses desktop frame 0241,
inside the central detail shot. `export.py --verify-only` rechecks existing files,
full decode, distinct frames, progressive MP4 layout and SHA provenance without
re-encoding. `validate-master.py` verifies every pose for interpenetration,
framing, ground contact, loop continuity and packed dependencies.

Generation and asset QA do not publish the site. Website integration, browser
checks, GitHub release and Link sites updates belong to the parent task.
