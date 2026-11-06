# SHIFT PHASE 01

Due film per la vetrina Space Media. Il primo arretra dall’encoder del campionatore fino allo stesso dettaglio nell’e-commerce e attraversa cinque siti dimostrativi reali. Il secondo percorre tre supporti con soggetti verticali, quadrati e panoramici. Ogni formato campagna resta in primo piano per circa 1,7 secondi e la regia portrait mantiene visibile l’intero annuncio.

## Crediti e trattamento

Il campionatore PHASE 01, l’artwork e le pagine demo sono studi originali di Space Media. Il modello è costruito da `model.py`. Il master usa il metallo satinato, una scocca verniciata, superfici emissive e luci area. Cycles produce tre fotografie di studio e una quarta esposizione del dettaglio da 47 mm, con pellicola virtuale di 3200 × 2400 pixel. La ripresa iniziale usa una finestra nativa di 2320 × 1920 della stessa esposizione. Le sequenze combinano queste fotografie con vere schermate e proiezione prospettica, eseguendo camera e compositing a ogni frame. Le licenze OFL di DM Mono e Space Grotesk si trovano in `public/fonts`.

## Rigenerare

Dalla root del repository, con Blender/Cycles, Python 3 con Pillow e supporto FreeType WOFF2, FFmpeg/libx264 e Node con Playwright/Chromium. Il materiale di lavorazione rimane in `outputs/`. I primi due comandi di generazione delle sorgenti fotografiche e delle schermate servono quando mancano i master locali. Per la cattura delle demo avviare prima `npm run dev -- --port 5213` in un altro terminale. `SHIFT_DEMO_URL`, `SHIFT_PLAYWRIGHT` e `CHROMIUM_EXECUTABLE_PATH` permettono di usare una porta, installazione Playwright o browser Chromium alternativi.

```sh
blender --background --factory-startup --python scripts/director-shift/model.py
node scripts/director-shift/capture.cjs
blender --background --factory-startup --python scripts/director-shift/negative.py
for film in web campaign; do
  for profile in desktop mobile; do
    python3 scripts/director-shift/render.py "$film" "$profile"
  done
done
python3 scripts/director-shift/verify.py
```

Il render salva i film H.264 silenziosi in `public/films`, i poster sincronizzati al primo frame e le miniature di servizio in `public/images`. I quattro film durano 10 secondi. Desktop usa 1920 × 1080 a 60 fps CFR, mobile 720 × 900 a 30 fps CFR, con camera ricomposta separatamente. I capitoli web cambiano ai secondi 1,7, 3,7, 5,7, 7,7 e 9,7. Il comando `--proof` su `render.py` produce una tavola delle inquadrature senza codificare un film. `--stills` rigenera solo poster e miniature.

`verify.py` decodifica gli export, verifica il passo temporale, confronta i poster col primo frame e salva hash e contatti a confronto con i film `flagship-*` in `outputs/director-20261106/shift/`.
