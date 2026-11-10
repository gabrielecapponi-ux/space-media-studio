# SHIFT — campaign framing and print direction, 10 November 2026

This revision replaces the ivory side material inside the previous campaign film. The old projection explicitly used RGB 208/207/187 for the thin sides of each print. Its mask could leave a bright outline between projected front and rear surfaces. This is independent of the web page's frame entrance.

All three prints now use charcoal/orange artwork, dark front padding, graphite sides (23/27/25), dark backs (17/21/19), aligned UV corners and one antialiased front silhouette. The camera remains on a restrained axis, while the original Cycles photographs move gently inside each authored composition. No global crop of the delivered video is used to conceal edges.

Desktop uses three physical-format boards in a row. Portrait uses a dedicated two-level composition so all three formats fit in the overview; the horizontal board occupies 91% of the viewport width in its own shot. Each main print is entirely inside the frame during its reading interval. Both cameras return continuously to their first pose at 10 seconds.

## Reproduction

Requirements: Python 3 with Pillow, FFmpeg with libx264, the project's local fonts and the original SHIFT Cycles photographs in `outputs/flagship-20261106/shift/phase-{hero,overhead,detail}.png`. Blender 5.2 is used for saving and reopening the editable staging, not for an expensive second animation render.

```sh
python3 scripts/campaign-polish-20261110/render.py
blender -b -t 2 --python-exit-code 1 -P scripts/campaign-polish-20261110/master.py
python3 scripts/campaign-polish-20261110/deliver.py
python3 scripts/campaign-polish-20261110/verify_frames.py
blender -b outputs/campaign-web-revision-20261110/campaign/campaign-staging.blend -t 2 --python-exit-code 1 -P scripts/campaign-polish-20261110/verify_master.py
blender -b outputs/campaign-web-revision-20261110/campaign/campaign-staging-mobile.blend -t 2 --python-exit-code 1 -P scripts/campaign-polish-20261110/verify_master.py
```

`render.py` creates sample images, print artwork and the numeric scene/camera recipe. `master.py` saves separate Blender staging masters with packed textures and verifies camera projection against the authoring renderer. The final film uses a native-resolution projective renderer of these 3D boards and the Cycles product photographs; it is not a new path-traced 600-frame sequence. The report names this method explicitly.

`deliver.py` streams directly into the encoder, validates every decoded frame, and installs only new versioned campaign assets. It preserves previous campaign files, resolution, frame rates and duration. Desktop is 2560×1440/60 fps, HD 1920×1080/60 fps, compact 1280×720/30 fps and portrait 720×900/30 fps. The QHD CRF is 18 (previously19); portrait is19 (previously20). The compact delivery retains the existing constrained-bandwidth budget.

Deliveries use `cinematic-campaign-20261110` with `-hd`, `-compact` and `-mobile` suffixes. They are silent H.264 High, YUV4:2:0, Rec.709, fast-start MP4. The first decoded frame supplies the poster. The 320×180 tile shows the three-format overview.

## Private reproducibility and checks

`outputs/campaign-web-revision-20261110/campaign/` contains untouched previous delivery copies, before/after samples, new print masters, the numeric scene, two packed Blender files, projection/reimport checks and the final delivery manifest with SHA-256, dimensions, cadence, decoded frame count, loop error and bitrate. The frame600 authored pose equals frame0 exactly; only frames0–599 are encoded. A successful video decode is separate from browser playback verification performed by the main task.
