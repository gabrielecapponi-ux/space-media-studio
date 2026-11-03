# Provenienza dei materiali — Space Media Studio

La homepage e l’alias `atelier.html` usano uno studio Three.js, un film stock d’acqua, un nuovo showreel di siti, quattro film Blender e dettagli raster AI. Ogni tecnica mantiene il proprio ambito.

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

`src/studio-room.js` è una scena Three.js originale: stanza, arredi, computer, luci e logo si assemblano prima dello zoom nel monitor. È uno studio immaginario, senza asset GLB/HDR esterni. Geometrie, camera e sequenza approvate restano invariate; i testi della pagina e del monitor vengono aggiornati per chiarire l’offerta.

L’acqua è fotografia stock di **Film Composite**, [Pexels 16392049](https://www.pexels.com/video/a-drop-of-water-in-a-bowl-with-a-black-background-16392049/), usata secondo la [licenza Pexels](https://www.pexels.com/license/), con crediti nel footer. Non è pubblico dominio né una simulazione CGI dello studio. Gli export conservati sono 1920×1080 e 640×900, 11,5 secondi a 24 fps, senza audio. [ASSET-ATELIER.json](./ASSET-ATELIER.json) e i documenti `ASSET-WATER.*` registrano origine e lavorazioni.

## Film Blender attivi

- **FORMA:** monogramma, carta e packaging (`service-brand.mp4`).
- **ORA:** flacone, vetro e riflessi (`service-product.mp4`).
- **Progettazione:** dossier e piani (`service-funding.mp4`).
- **SPAZIO:** tipografia MAKE / IT MOVE. (`atelier-type-desktop.mp4` e variante mobile).

I primi tre film hanno profilo nativo 1440×900, tre secondi, 72 fotogrammi a 24 fps. SPAZIO usa 1920×1080 e 720×900, cinque secondi, 120 fotogrammi a 24 fps. Sono render offline originali con geometrie, materiali, camera e luci reali, distinti dalle immagini AI. [ASSET-SERVICE-MOTION.json](./ASSET-SERVICE-MOTION.json) e [ASSET-ATELIER-MOTION.json](./ASSET-ATELIER-MOTION.json) conservano fatti di produzione, ricevute, hash e controlli, incluse le correzioni del vetro ORA. Non si dichiarano 4K o 60 fps.

I tre dettagli `atelier-brand-detail.jpg`, `atelier-product-detail.jpg` e `atelier-campaign-detail.jpg` rimangono raster AI a 1672×941 nativi, documentati in [ASSET-ATELIER-VISUALS.json](./ASSET-ATELIER-VISUALS.json).

## Archivio, font e diritti

Il precedente film Blender **AVANT**, la texture `launch-architecture.jpg` e gli studi Launch Room sono archivio; nessun soggetto architettonico viene più caricato nella homepage corrente. Le quattro immagini originali `launch-*.jpg` rimangono documentate in [ASSET-LAUNCH-ROOM.json](./ASSET-LAUNCH-ROOM.json). I fatti e gli hash dei manifest storici vengono preservati anche quando cambia l’integrazione.

Three.js usa licenza MIT; l’avviso è in `public/licenses/three-MIT.txt`. Space Grotesk e DM Mono sono serviti localmente con le copie OFL in `public/fonts/`. I font di sistema dei render Blender sono rasterizzati nei film e non distribuiti come binari. Codice, interfacce, testi, diagrammi e scene originali restano materiali del progetto; la pubblicazione del repository non concede una licenza generale sulle composizioni.

Concept e marchi dimostrativi non documentano clienti, commesse o risultati commerciali. Il dossier non attribuisce contributi o finanziamenti. Le demo hanno interazioni locali; i cinque form della homepage preparano bozze WhatsApp, con invio deciso dal visitatore.

Lusion e Apple sono riferimenti di composizione; non vengono incorporati loro asset o codice. Horizon CoverFlow non è acquisito o integrato. La prova ComfyUI/LTX storica non fornisce media al sito corrente.

Verifiche correnti, viewport e condizioni delle misure sono nel [README](./README.md#verifiche). I manifest distinguono controlli strutturali, visivi e di decodifica dei singoli materiali.
