# Provenienza dei materiali — Space Media Studio

La homepage e l’alias `atelier.html` combinano uno studio Three.js, un film stock d’acqua, un reel di siti e film dedicati ai servizi. Il rilascio del **4 novembre 2026** distingue geometria Blender, composizioni CSS 3D, immagini AI e film generativi. Cinque miniature statiche tratte dalle scene anticipano i servizi senza nuovi testi.

## Studio iniziale e acqua

`src/studio-room.js` è una scena Three.js originale: stanza, arredi, computer, luci e logo si assemblano prima dello zoom nel monitor. È uno studio immaginario, senza asset GLB o HDR esterni. Hero, monitor e sorgenti dell’ingresso vengono conservati byte per byte nella revisione del 4 novembre.

L’acqua è fotografia stock di **Film Composite**, [Pexels 16392049](https://www.pexels.com/video/a-drop-of-water-in-a-bowl-with-a-black-background-16392049/), usata secondo la [licenza Pexels](https://www.pexels.com/license/) e accreditata nel footer. Non è pubblico dominio né una simulazione CGI dello studio. Gli export conservati sono 1920×1080 e 640×900, 11,5 secondi a 24 fps, senza audio. [ASSET-ATELIER.json](./ASSET-ATELIER.json) e `ASSET-WATER.*` conservano origine e lavorazioni.

## Reel web e demo

`public/showcase/index.html` presenta cinque direzioni responsive originali: **SHIFT**, **VELA**, **NOVA**, **BASILICO** e **OLTRE**. Il parametro `scene` seleziona `shift`, `vela`, `nude`, `basilico` o `oltre`; `nova` è un alias. La modalità `capture=1` prepara le viste per la produzione. Carrello, prenotazioni e moduli illustrano percorsi locali, senza acquisti, pagamenti o invii a terzi.

Le interfacce sono catturate nel browser alle dimensioni native, animate in prospettiva CSS e codificate con FFmpeg. Il nuovo reel `motion-web.mp4` e la variante `-mobile` hanno profili 1920×1080 e 720×900, dieci secondi e 600 fotogrammi per profilo a 60 fps. Le transizioni di 36 frame usano easing quintico e durano 0,6 secondi. I 1.200 frame nativi complessivi, dimensioni, assenza di frame neri, loop, decodifica completa, faststart e cinque campioni codificati per profilo sono verificati. Film e poster pesano 11.250.745 byte complessivi; risultati in [ASSET-MOTION-WEB-20261104.json](./ASSET-MOTION-WEB-20261104.json). La timeline è `src/web-reel-motion.js`; il precedente reel a 30 fps e la sua timeline rimangono archivio con [ASSET-WEB-SHOWREEL.json](./ASSET-WEB-SHOWREEL.json).

| Visual nelle demo | Origine |
| --- | --- |
| `public/images/reel-sneaker.jpg` | Scarpa sportiva fittizia, image_gen |
| `public/images/reel-lamp.jpg` | Lampada di design fittizia, image_gen |
| `public/images/reel-skincare.jpg` | Packaging beauty NOVA, image_gen |
| `public/images/reel-food.jpg` | Immagine gastronomica illustrativa, image_gen |

Le quattro immagini raster sono originali a **1536×1024 nativi**, senza aumento di risoluzione, 844.320 byte JPEG complessivi. [ASSET-WEB-REEL-VISUALS.json](./ASSET-WEB-REEL-VISUALS.json) conserva prompt, master, hash e specifiche. Non sono fotografie di prodotti o piatti reali né modelli tridimensionali. Il visual di seta `atelier-campaign-detail.jpg`, 1672×941 nativi, rimane nella demo OLTRE; origine in [ASSET-ATELIER-VISUALS.json](./ASSET-ATELIER-VISUALS.json).

## Branding Blender

Il nuovo FORMA è completato e verificato: geometria, tipografia, materiali, luci e camera originali Blender, 1920×1080 e 720×900 nativi, sei secondi, 288 frame per profilo a 48 fps. L’apertura del coperchio e della card è sequenziata, con soste, arco di camera e riflessi fotografici controllati. Le carte poggiano su supporti fisicamente allineati; il microtesto curvo mantiene la spaziatura delle parole.

Master e sequenze restano in `outputs/motion-20261104/brand/{desktop,mobile}/`. [ASSET-MOTION-BLENDER-20261104.json](./ASSET-MOTION-BLENDER-20261104.json) conserva export e controlli finali. `motion-brand.mp4` pesa 1.612.293 byte, il poster 116.334; `motion-brand-mobile.mp4` pesa 488.111 byte, il poster 44.065. Totale dei quattro file: 2.260.803 byte. H.264 High livello 4.2 desktop e 4.1 portrait, senza audio, aumento della risoluzione o interpolazione ottica.

Entrambi i profili hanno superato reimportazione del master, preflight di tutte le 288 pose, contatti, separazione fisica, loop, controllo dei 576 frame nativi, confronto di tre campioni codificati per profilo, decodifica completa e faststart. La chiusura è quella della sequenza originale, senza un endpoint duplicato aggiunto o una clip inversa.

Il dossier continua a usare `cinema-funding.mp4` e `cinema-funding-mobile.mp4`, render originali Blender 5.2.1 LTS / EEVEE: 1920×1080 e 720×900 nativi, quattro secondi, 120 frame per profilo a 30 fps. Pagine, copertina, tabs e diagramma sono geometrie e tipografie originali. Il dossier e la precedente identità FORMA sono documentati in [ASSET-CINEMA-BLENDER.json](./ASSET-CINEMA-BLENDER.json), con reimportazione dei master, contatti, inquadrature, loop, pixel, decodifica e faststart verificati.

I font di sistema dei render Blender sono rasterizzati nel film e non ridistribuiti come binari. Le versioni precedenti dell’identità rimangono archivio; il dossier conservato mantiene la propria provenienza e cadenza.

## Campagna SHIFT a 60 fps

`scripts/motion-campaign-20261104-stage.html`, `motion-campaign-20261104-render.mjs` e `motion-campaign-20261104-verify.py` producono tre formati pubblicitari originali su piani CSS 3D. La regia presenta il video centrale, dispiega due formati con easing quintico, mantiene una pausa leggibile e ricompone la scena. Sono rimossi footer, microdescrizioni e CTA dal film; restano identità, claim e nomi dei tre formati.

La composizione completata ha sei secondi, **360 frame per profilo a 60 fps**, 1920×1080 e 720×900 nativi. I film `motion-campaign.mp4` e `motion-campaign-mobile.mp4` pesano 2.206.333 e 1.242.598 byte; poster dal frame 144, 242.981 e 120.374 byte. Totale dei quattro file: 3.812.286 byte. H.264 High/yuv420p con faststart, livello 4.2 per 1080p60 e 4.1 per portrait, senza audio.

Sono verificati tutti i 720 frame nativi, preflight geometrico di 361 pose per profilo con chiusura esatta, 24 ricevute browser senza errori, decodifica completa, faststart e confronto di cinque campioni codificati per profilo. Il massimo scarto RGB tra ultimo e primo frame è 0,563/255; il massimo scarto per canale dei campioni codificati rispetto ai master è 2,58/255. [ASSET-MOTION-CAMPAIGN-20261104.json](./ASSET-MOTION-CAMPAIGN-20261104.json) conserva fonti, hash e risultati.

Il film interno è riusato dalla precedente produzione **Higgsfield / Seedance 2.5**, job `81af6305-30fb-4ff1-88dc-7e1b26635568`: sorgente nativo 1920×1080, HEVC 10 bit, 24 fps, 193 frame, 8,041667 secondi, 19.953.014 byte. La generazione originale era quotata 128 crediti; il riuso non avvia altre generazioni. La scarpa e il nastro giallo sono video generativo, non una mesh o una simulazione fisica documentata. Il sorgente a 24 fps viene campionato nella composizione a 60 fps, senza interpolazione ottica. La chiusura dissolve negli ultimi 24 frame verso la prima immagine del film. L’origine della clip rimane in [ASSET-CINEMA-CAMPAIGN.json](./ASSET-CINEMA-CAMPAIGN.json).

## Nuovo film ORA Higgsfield

Il nuovo film **ORA / Higgsfield Seedance 2.5** è approvato e integrato. Il job `93cbca2c-9156-4a4c-aeb4-21ec50b16606` ha prodotto un sorgente HEVC 10 bit, 1920×1080, 193 frame a 24 fps, 8,041667 secondi, 10.226.269 byte. L’ispezione visiva di sorgente e crop a 0, 1, 2, 3, 4, 5, 6, 7, 7,9167 e 8 secondi ha confermato un solo flacone coerente, base e tappo contenuti, chiusura nativa approvata. Non si attribuisce al video una mesh o una simulazione fisica Blender.

Gli export sono `motion-product.mp4` (1920×1080, 2.708.121 byte) e `motion-product-mobile.mp4` (720×900, 1.357.095 byte). Il derivato portrait usa il crop nativo `(528,0,864,1080)` e una riduzione a 720×900. I poster pesano 133.513 e 83.614 byte. Totale dei quattro file: 4.282.343 byte. Tutti i 193 frame per profilo mantengono la cadenza originale di 24 fps, senza aumento di risoluzione, interpolazione, cambio di velocità, dissolvenza editoriale o riproduzione inversa.

Sono superati decodifica dei 386 frame consegnati, controllo dei pixel a piena risoluzione, assenza di frame vuoti, confronto di tre campioni per profilo con il sorgente elaborato senza perdita e struttura faststart. Il montaggio è riproducibile con `scripts/motion-product-20261104.py`; [ASSET-MOTION-PRODUCT-20261104.json](./ASSET-MOTION-PRODUCT-20261104.json) conserva sorgenti, hash, geometria del crop e verifiche. La prova browser del nuovo rilascio rimane distinta dai controlli del materiale.

Il precedente tentativo `4843ab07-828a-458c-b38d-39d852aa39c1` è stato scartato per trasformazione tra due identità e doppia etichetta. Il video scartato non viene consegnato: soltanto il suo frame 0 è stato usato come unica immagine di inizio e fine della rigenerazione, mantenendo un riferimento coerente. Entrambe le richieste erano quotate 128 crediti ciascuna, 256 complessivi di preventivo. Il precedente ORA `service-product.mp4` resta un render Blender originale in archivio, documentato in [ASSET-SERVICE-MOTION.json](./ASSET-SERVICE-MOTION.json); tale provenienza non viene trasferita al nuovo film AI.

## Archivio, font e diritti

AVANT, la texture `launch-architecture.jpg`, SPAZIO e Launch Room rimangono archivio. Le immagini `launch-*.jpg` sono documentate in [ASSET-LAUNCH-ROOM.json](./ASSET-LAUNCH-ROOM.json); la tipografia Blender precedente in [ASSET-ATELIER-MOTION.json](./ASSET-ATELIER-MOTION.json). Fatti, fonti e hash dei manifest storici vengono preservati quando cambia l’integrazione nella homepage.

Three.js usa licenza MIT, con avviso in `public/licenses/three-MIT.txt`. Space Grotesk e DM Mono sono locali con copie OFL in `public/fonts/`. Codice, interfacce, testi, diagrammi e scene originali restano materiali del progetto; la pubblicazione del repository non concede una licenza generale sulle composizioni.

Concept e marchi dimostrativi non documentano clienti, commesse o risultati commerciali. Il dossier non attribuisce contributi o finanziamenti. Le demo hanno azioni locali; i cinque form della homepage preparano bozze WhatsApp e il visitatore decide l’invio.

Lusion e Apple sono riferimenti di composizione; loro asset o codice non sono incorporati. Horizon CoverFlow non è acquisito o integrato. La prova ComfyUI/LTX storica non fornisce media alla homepage.

Le ricevute del 3 novembre attestano quel rilascio. La nuova integrazione locale desktop ha superato la prova di cinque film, miniature, box idea e demo, sincronizzazione del reel e sei viewport senza overflow; nessun errore JavaScript o richiesta esterna osservati. Anche la prova dedicata del telefono è passata: cinque film 720×900 in 4:5, pause, rotazione con il file portrait già selezionato, movimento ridotto e avvio manuale, senza errori JavaScript. Le ricevute locali sono `outputs/proofs/motion-local-desktop-20261104.json` e `motion-local-phone-20261104.json`; la verifica della pubblicazione viene registrata separatamente dopo il deploy in `outputs/proofs/motion-20261104-final-verification.json`. Verifiche correnti e limiti delle misure sono nel [README](./README.md#verifiche).
