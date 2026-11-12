# SHIFT campaign — native cinema revision, 12 November 2026

The original PHASE01 sampler is reused as real geometry in a photographic studio.
Three real graphite plates carry the existing story, square and banner campaign
artwork. Their positions, yaws and camera motion create parallax and cast actual
shadows; the sampler rotates, its main wheel turns and pads press in sequence.
The display playhead moves over the original vector waveform. The film is a
native Cycles sequence, not a second animation of a rendered product photograph.

The campaign artwork still includes the original Cycles photographs, because they
are the authored graphics printed on the three plates. Those images are not used
as a replacement for the separate three-dimensional sampler in the foreground.
Every plate side/back is graphite and the print fills the complete front UV.
There is no bright padding or white substrate to reveal during movement.

Source: `outputs/flagship-20261106/shift/phase-01.blend` and the three original
prints under `outputs/campaign-web-revision-20261110/campaign/prints/`.
Original masters and historical exports are untouched. Artwork, original font
and scene data are packed into the new editable masters.

The loop is eight seconds, desktop QHD60 and dedicated portrait
1080×1350/30. No interpolated frames or resolution upscaling. HD and compact
are derived from the native QHD. Master and delivery QA are separate from
site/browser QA, which is performed by the parent integration task.

## Preparation

Run from the repository root with Blender5.2.1LTS, FFmpeg and cwebp installed.
First inspect the source, build both cameras, and review representative frames.
Do not start production while another task is using the GPU.

```sh
blender -b -t 2 --python-exit-code 1 -P scripts/campaign-cinema-20261112/inspect-scene.py
blender -b -t 2 --python-exit-code 1 -P scripts/campaign-cinema-20261112/build.py -- --profile desktop --mode proof --width 1280 --samples 20 --frames 1,161,321
blender -b -t 2 --python-exit-code 1 -P scripts/campaign-cinema-20261112/build.py -- --profile portrait --mode proof --width 1080 --samples 20 --frames 121
```

## Accepted composition and production

The initial proof direction was accepted. The final desktop camera is 4% wider
and recentered to preserve breathing room throughout the movement. The initial
proofs and their original camera values are preserved in `proof-v1.json`.
Rebuilding a master invalidates existing chunk signatures; never change a
master midway through production.

Build and independently validate the final native masters before rendering:

```sh
blender -b -t 2 --python-exit-code 1 -P scripts/campaign-cinema-20261112/build.py -- --profile desktop --mode build --width 2560 --samples 20
blender -b -t 2 --python-exit-code 1 -P scripts/campaign-cinema-20261112/build.py -- --profile portrait --mode build --width 1080 --samples 20
blender -b -t 2 --python-exit-code 1 -P scripts/campaign-cinema-20261112/validate-master.py
blender -b -t 2 --python-exit-code 1 -P scripts/campaign-cinema-20261112/benchmark.py
```

When the GPU is assigned, the following command renders the two profiles
serially, exports the delivery versions, validates all media and makes review
contact sheets. `BLENDER_BIN` may override the default macOS executable.

```sh
python3 scripts/campaign-cinema-20261112/finish-pipeline.py
```

`render-master.py` streams each native PNG into one-second H.264 chunks and
retains only review frames every half second. Complete chunks are resumable
only with an identical master SHA and render settings. Final media is moved
into `public/` atomically after complete decode and frame-count checks. The
pipeline does not publish the website.

Delivery prefix: `campaign-cinema-20261112-`. Desktop QHD60 and portrait
1080×1350/30 are native; HD60 and compact 720p30 are derived by downsampling.
All use H.264, yuv420p and faststart. No frame interpolation or upscaling.
Two full-resolution WebP posters and a 320×180 thumbnail accompany the films.

`export.py --verify-only` repeats decoding, exact frame-count and unique-frame
checks and refreshes asset/recipe SHA manifests. `temporal-qa.py` checks all
decoded frame differences and loop continuity, and `contact-sheets.py` creates
16 evenly spaced frames for each native profile. These media checks do not
establish real-iPhone playback performance; browser and device testing remain
separate.

Master files and raw QA evidence stay in the private
`outputs/campaign-cinema-20261112/` archive. Final verification status is recorded
in that directory's `QA.md` and `pipeline-status.json`.
