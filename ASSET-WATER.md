# Water film — source, licence and preparation

Verified and downloaded on 10 October 2026 for the Space Media Studio website.

## Source

- Creator: **Film Composite**.
- Pexels asset: **16392049**, “A drop of water in a bowl with a black background” / “Epic slow-motion capture of a water droplet creating ripples”.
- Source page: https://www.pexels.com/video/a-drop-of-water-in-a-bowl-with-a-black-background-16392049/
- Creator profile: https://www.pexels.com/@film-composite-518472883/
- Original download, linked by the source page: https://videos.pexels.com/video-files/16392049/16392049-uhd_3840_2160_24fps.mp4
- Licence: **Pexels License**, https://www.pexels.com/license/ . The official licence permits free downloads, edits and website/marketing use. Attribution is appreciated but not required. The restrictions against implying endorsement, stock redistribution and selling unaltered copies still apply.

This is licensed photographic slow-motion stock footage, **not an original Space Media Studio shoot, a commissioned client project, a generated AI video or an interactive 3D model**. It is integrated as a film within the site's creative demonstration. Do not describe it as a water simulation made by the studio.

## Original file

- Local master: `outputs/water-stock/pexels-film-composite-16392049-4k.mp4` (excluded from Git).
- 3840 × 2160, H.264 High, YUV420P, BT.709, progressive, 24 fps.
- 451 frames, 18.791667 seconds, 19,463,238 bytes; no audio stream.
- SHA-256: `564f001b84bc027847e7bfa26a1850e7e5a714bc2df0d6a5295d98e8c40dfe6a`.
- Original metadata saved as `outputs/water-stock/master-probe.json`.
- The original sequence was visually inspected using a 12-frame contact sheet and full-size impact frame. It shows a falling droplet, impact/crown, rebound column and expanding surface ripples in their natural chronological order.

## Website exports

Both exports retain the native 24 fps and the natural direction of motion. Source range **1.0–12.5 seconds**, 276 frames / **11.5 seconds**. A monochrome grade removes the source's slight cyan cast to fit the black, white and yellow visual system. There is no optical-flow interpolation, synthetic 4K upscale or water reversal.

| File | Dimensions | Codec | Bytes |
| --- | --- | --- | --- |
| `public/films/water-desktop.mp4` | 1920 × 1080 | H.264 / YUV420P | 3,792,538 |
| `public/films/water-mobile.mp4` | 640 × 900 | H.264 / YUV420P | 1,779,047 |
| `public/images/water-desktop.jpg` | 1600 × 900 | JPEG | 57,435 |
| `public/images/water-mobile.jpg` | 640 × 900 | JPEG | 36,562 |
| `public/images/water-start-desktop.jpg` | 1920 × 1080 | JPEG | 24,052 |
| `public/images/water-start-mobile.jpg` | 640 × 900 | JPEG | 7,144 |

Video exports are silent, use MP4 fast-start, and have a keyframe every 12 frames (0.5 seconds) to keep deliberate seeking responsive. Mobile has an independently encoded central portrait crop of the 4K source, preserving the drop and rebound column. Posters show the source at 5.6 seconds, with matching monochrome grade/crop.

The `water-start-*` posters are extracted directly from **frame 0 of each final website MP4**, at that MP4's native dimensions and without any further crop, scale or grade. Use these for a continuous poster-to-playback entrance. Keep the more dramatic `water-desktop.jpg` and `water-mobile.jpg` for static, reduced-motion and data-saving presentations. Source and chapter timings are also recorded in `ASSET-WATER.json`; chapter boundaries are approximate editorial cues, not exact scientific measurements.

For continuous storytelling, play through the natural sequence or seek through it with scroll. Avoid a ping-pong loop: reversing the impact would make the water behave incorrectly. The site can hold the final ripple frame or hide a replay transition behind the next chapter.

## Reproduction

Requirements: FFmpeg with libx264. The following commands were executed locally; no cloud generation, model downloads, accounts or service credits were used.

```sh
curl --fail --location --retry 2 --output outputs/water-stock/pexels-film-composite-16392049-4k.mp4 'https://videos.pexels.com/video-files/16392049/16392049-uhd_3840_2160_24fps.mp4'

ffmpeg -ss 1 -t 11.5 -i outputs/water-stock/pexels-film-composite-16392049-4k.mp4 -map 0:v:0 -an -vf 'scale=1920:1080:flags=lanczos,eq=saturation=0,setsar=1' -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 24 -g 12 -keyint_min 12 -sc_threshold 0 -movflags +faststart public/films/water-desktop.mp4

ffmpeg -ss 1 -t 11.5 -i outputs/water-stock/pexels-film-composite-16392049-4k.mp4 -map 0:v:0 -an -vf 'crop=1536:2160:1152:0,scale=640:900:flags=lanczos,eq=saturation=0,setsar=1' -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 24 -g 12 -keyint_min 12 -sc_threshold 0 -movflags +faststart public/films/water-mobile.mp4

ffmpeg -ss 5.6 -i outputs/water-stock/pexels-film-composite-16392049-4k.mp4 -frames:v 1 -vf 'scale=1600:900:flags=lanczos,eq=saturation=0,setsar=1' -q:v 2 public/images/water-desktop.jpg

ffmpeg -ss 5.6 -i outputs/water-stock/pexels-film-composite-16392049-4k.mp4 -frames:v 1 -vf 'crop=1536:2160:1152:0,scale=640:900:flags=lanczos,eq=saturation=0,setsar=1' -q:v 2 public/images/water-mobile.jpg

ffmpeg -i public/films/water-desktop.mp4 -frames:v 1 -q:v 2 public/images/water-start-desktop.jpg

ffmpeg -i public/films/water-mobile.mp4 -frames:v 1 -q:v 2 public/images/water-start-mobile.jpg
```

Validation: both MP4 files decoded without errors; FFprobe confirmed codec, dimensions, 276 frames, 24 fps, 11.5 seconds and no audio. JPEG dimensions were checked and the portrait poster was visually inspected.
