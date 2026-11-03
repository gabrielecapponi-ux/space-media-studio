# Provenienza dei materiali — Space Media Studio

La homepage e l’alias `atelier.html` combinano uno studio Three.js, un film stock d’acqua, uno showreel di siti e scene dedicate ai servizi. Render Blender, composizioni CSS 3D, immagini AI e film generativi mantengono provenienze distinte. La revisione del 3 novembre 2026 elimina i tre blocchi editoriali con immagini ripetute e concentra il percorso su un film per servizio.

## Nuovo showreel web e demo

`public/showcase/index.html` presenta cinque direzioni responsive originali: **SHIFT**, **VELA**, **NOVA**, **BASILICO** e **OLTRE**. Il parametro `scene` seleziona `shift`, `vela`, `nude`, `basilico` o `oltre`; `nova` è un alias. Modalità `capture=1` prepara le viste per la produzione. Carrello, prenotazioni e moduli illustrano percorsi locali: nessun acquisto, pagamento o invio a terzi viene effettuato.

Le interfacce vengono catturate nel browser alle dimensioni native, animate con trasformazioni CSS in prospettiva deterministiche e codificate con FFmpeg. Il risultato è `web-showreel.mp4` a **1920×1080** e `web-showreel-mobile.mp4` a **720×900**: dieci secondi, 300 fotogrammi a 30 fps, H.264 High/yuv420p, faststart, senza audio. [ASSET-WEB-SHOWREEL.json](./ASSET-WEB-SHOWREEL.json) documenta sorgenti, export e controlli. Questo reel è un film di interfacce originali; non proviene da Blender, stock o generazione video AI e non è una mesh configurabile.

| Visual nelle demo | Origine |
| --- | --- |
| `public/images/reel-sneaker.jpg` | Scarpa sportiva fittizia, image_gen |
| `public/images/reel-lamp.jpg` | Lampada di design fittizia, image_gen |
| `public/images/reel-skincare.jpg` | Packaging beauty NOVA, image_gen |
| `public/images/reel-food.jpg` | Immagine gastronomica illustrativa, image_gen |

Sono quattro immagini raster originali **1536×1024 nativi**, senza upscaling, 844.320 byte JPEG complessivi. [ASSET-WEB-REEL-VISUALS.json](./ASSET-WEB-REEL-VISUALS.json) conserva prompt, master, hash e specifiche. I soggetti non sono fotografie di prodotti o piatti reali né modelli tridimensionali.

## Studio iniziale e acqua

`src/studio-room.js` è una scena Three.js originale: stanza, arredi, computer, luci e logo si assemblano prima dello zoom nel monitor. È uno studio immaginario, senza asset GLB/HDR esterni. Geometrie, camera, sequenza e testi della hero e del monitor restano invariati nella revisione del 3 novembre; la promessa esplicita dei servizi era stata introdotta nella precedente revisione.

L’acqua è fotografia stock di **Film Composite**, [Pexels 16392049](https://www.pexels.com/video/a-drop-of-water-in-a-bowl-with-a-black-background-16392049/), usata secondo la [licenza Pexels](https://www.pexels.com/license/), con crediti nel footer. Non è pubblico dominio né una simulazione CGI dello studio. Gli export conservati sono 1920×1080 e 640×900, 11,5 secondi a 24 fps, senza audio. [ASSET-ATELIER.json](./ASSET-ATELIER.json) e i documenti `ASSET-WATER.*` registrano origine e lavorazioni.

## Produzione Blender precedente

- **FORMA:** monogramma, carta e packaging (`service-brand.mp4`).
- **ORA:** flacone, vetro e riflessi (`service-product.mp4`).
- **Progettazione:** dossier e piani (`service-funding.mp4`).
- **SPAZIO:** tipografia MAKE / IT MOVE. (`atelier-type-desktop.mp4` e variante mobile).

I primi tre film hanno profilo nativo 1440×900, tre secondi, 72 fotogrammi a 24 fps. SPAZIO usa 1920×1080 e 720×900, cinque secondi, 120 fotogrammi a 24 fps. Sono render offline originali con geometrie, materiali, camera e luci reali, distinti dalle immagini AI. [ASSET-SERVICE-MOTION.json](./ASSET-SERVICE-MOTION.json) e [ASSET-ATELIER-MOTION.json](./ASSET-ATELIER-MOTION.json) conservano fatti di produzione, ricevute, hash e controlli, incluse le correzioni del vetro ORA. Non si dichiarano 4K o 60 fps.

I tre dettagli `atelier-brand-detail.jpg`, `atelier-product-detail.jpg` e `atelier-campaign-detail.jpg` rimangono raster AI a 1672×941 nativi, documentati in [ASSET-ATELIER-VISUALS.json](./ASSET-ATELIER-VISUALS.json). I blocchi di dettaglio sono rimossi dalla homepage; OLTRE conserva il visual della seta gialla nella propria demo.

## Nuove scene e campagna — 3 novembre 2026

`scripts/cinema-20261103.py` produce scene originali FORMA e dossier in Blender 5.2.1 LTS / EEVEE, 48 sample, senza modelli o texture esterni. I profili completati sono **1920×1080 e 720×900 nativi**, quattro secondi, 120 fotogrammi a 30 fps. Gli export sono `cinema-brand.mp4`, `cinema-brand-mobile.mp4`, `cinema-funding.mp4` e `cinema-funding-mobile.mp4`, con poster corrispondenti. Master e frame risiedono in `outputs/cinema-20261103/{brand,funding}/{desktop,mobile}/`, con nomi `cinema-{scene}[-mobile].blend`; Arial Regular/Bold e Times New Roman sono rasterizzati, senza ridistribuzione dei font. I quattro profili hanno superato reimportazione dei master, inquadratura, contatti con il piano, separazione di testi e oggetti, loop, continuità dei 480 frame nativi, decodifica completa, faststart e confronto con campioni codificati. Gli otto asset pubblici, film e poster, pesano complessivamente 3.602.997 byte. [ASSET-CINEMA-BLENDER.json](./ASSET-CINEMA-BLENDER.json) conserva sorgenti, hash e risultati verificati.

`scripts/cinema-campaign-stage.html` e `scripts/cinema-campaign-render.mjs` producono SHIFT: tre formati pubblicitari originali disposti e animati in prospettiva CSS 3D. La composizione completata ha sei secondi, 180 fotogrammi a 30 fps, profili nativi 1920×1080 e 720×900, output `cinema-campaign.mp4` (3.092.933 byte) e `cinema-campaign-mobile.mp4` (1.609.452 byte). I poster sono il fotogramma 55. H.264 High/yuv420p, faststart, senza audio. I 360 fotogrammi nativi, la decodifica completa e il confronto dei campioni MP4 con i master sono verificati da `scripts/cinema-campaign-verify.py`; frame e controlli restano in `outputs/cinema-campaign/`. È una composizione di superfici e contenuti raster, distinta da una scena Blender o una mesh configurabile.

Il film del prodotto SHIFT, **Higgsfield / Seedance 2.5**, è completato e verificato visivamente: job `81af6305-30fb-4ff1-88dc-7e1b26635568`, costo quotato 128 crediti. Il sorgente in `outputs/cinema-campaign/source/higgsfield-shift.mp4` è nativo **1920×1080, HEVC 10 bit, 24 fps, 193 fotogrammi, 8,041667 secondi**, 19.953.014 byte. La scarpa e il nastro giallo derivano da un video generativo, non da una mesh modellata o da una simulazione fisica documentata. La composizione CSS 3D conserva la cadenza originale a 24 fps dentro il proprio export a 30 fps, senza interpolazione. La chiusura dissolve negli ultimi 18 fotogrammi verso il primo frame del film, senza riproduzione inversa. [ASSET-CINEMA-CAMPAIGN.json](./ASSET-CINEMA-CAMPAIGN.json) conserva sorgenti, hash e verifiche finali.

## Archivio, font e diritti

Il precedente film Blender **AVANT**, la texture `launch-architecture.jpg` e gli studi Launch Room sono archivio; nessun soggetto architettonico viene più caricato nella homepage corrente. Le quattro immagini originali `launch-*.jpg` rimangono documentate in [ASSET-LAUNCH-ROOM.json](./ASSET-LAUNCH-ROOM.json). I fatti e gli hash dei manifest storici vengono preservati anche quando cambia l’integrazione.

Three.js usa licenza MIT; l’avviso è in `public/licenses/three-MIT.txt`. Space Grotesk e DM Mono sono serviti localmente con le copie OFL in `public/fonts/`. I font di sistema dei render Blender sono rasterizzati nei film e non distribuiti come binari. Codice, interfacce, testi, diagrammi e scene originali restano materiali del progetto; la pubblicazione del repository non concede una licenza generale sulle composizioni.

Concept e marchi dimostrativi non documentano clienti, commesse o risultati commerciali. Il dossier non attribuisce contributi o finanziamenti. Le demo hanno interazioni locali; i cinque form della homepage preparano bozze WhatsApp, con invio deciso dal visitatore.

Lusion e Apple sono riferimenti di composizione; non vengono incorporati loro asset o codice. Horizon CoverFlow non è acquisito o integrato. La prova ComfyUI/LTX storica non fornisce media al sito corrente.

Verifiche correnti, viewport e condizioni delle misure sono nel [README](./README.md#verifiche). I manifest distinguono controlli strutturali, visivi e di decodifica dei singoli materiali.
