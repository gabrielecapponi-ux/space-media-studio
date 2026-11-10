# Web reel — actual destinations, 10 November 2026

The film shows the five functional demo pages in this order: SHIFT PHASE 01, CACAO ATELIER, LUMA, BASILICO, OLTRE. The route keys remain `shift`, `vela`, `nude`, `basilico`, `oltre`. The timeline stays ten seconds long, with the active HTML chapter switching at 1.7, 3.7, 5.7, 7.7 and 9.7 seconds.

The renderer uses the actual responsive HTML pages at 2× device density, mounted as thin graphite planes in a perspective camera rail. The opening pulls back from the original SHIFT encoder photograph into its own store. The sampler photograph and its native detail exposure are original Blender/Cycles assets from the existing production. No new mesh, client commission or product photography is claimed for the website screen captures.

The renderer extends each source edge independently before the inverse perspective transform. The source corner colour is never used as a perimeter fill; all physical sides and the reverse use graphite. Quintic camera travel gives the held views a quiet entrance and departure. A short optical wipe at the end returns to the original macro pose without travelling through a magnified empty gap; the first and final poses join continuously.

## Rebuild

Use the existing Python/Pillow, FFmpeg/libx264 and Node/Playwright installations. No new runtime dependency is added to the site. Start a static HTTP server rooted in `public/` and supply its showcase URL:

```sh
SPACE_DEMO_URL=http://127.0.0.1:5233/showcase/ node scripts/web-reel-polish-20261110/capture.cjs
python3 scripts/web-reel-polish-20261110/render.py desktop --proof
python3 scripts/web-reel-polish-20261110/render.py mobile --proof
python3 scripts/web-reel-polish-20261110/render.py desktop
python3 scripts/web-reel-polish-20261110/render.py mobile
python3 scripts/web-reel-polish-20261110/verify.py
```

`SPACE_PLAYWRIGHT` may point to another installed Playwright package. Capture mode uses the real page components with tighter film spacing; normal mobile pages retain natural scrolling. The capture manifest records the exact code hashes, screenshot hashes, viewport, image sources and photographic geometry. The SHIFT detail plate is aligned to that geometry, rather than a fixed obsolete rectangle.

Sources and generated masters are in `outputs/campaign-web-revision-20261110/web/`. The existing original Cycles imagery is in `outputs/flagship-20261106/shift/phase-hero.png` and `outputs/director-20261106/shift/jog-negative-3200-crop.png`, reproducible through the original `scripts/director-shift/` recipes. The camera renderer imports the existing projection and backdrop helpers without altering them.

Delivery is versioned: `cinematic-web-20261110.mp4` is native 2560×1440 at 60 fps; `-hd` is 1920×1080 at 60 fps; `-compact` is 1280×720 at 30 fps; `-mobile` is a separately composed 720×900 film sampled at its native 30 fps. There is no interpolated frame-rate conversion. Frames stream to the encoder; no large PNG sequence is retained. All exports are ten-second, silent H.264/yuv420p files, BT.709 tagged, fast-start enabled. Matching WebP posters depict the first frame, and the index thumbnail depicts the completed SHIFT store.

The earlier `director-web*` films and their recipes remain historical and unchanged. The new files must be connected by the homepage/config owner before being considered active. A successful encode is not proof of live publication or physical iPhone performance.
