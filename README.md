# Space Media Studio

Studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. Creiamo **siti web, e-commerce, loghi, identità visive, video, animazioni 3D e campagne**. Affianchiamo aziende, APS e ASD nella progettazione e nelle candidature a bandi.

[Apri il sito](https://gabrielecapponi-ux.github.io/space-media-studio/)

La homepage canonica è `index.html`; `atelier.html` conserva lo stesso percorso come alias con `noindex, nofollow`. Il caricamento dello studio, lo zoom, l’acqua, la hero e il monitor conservano la direzione approvata. La revisione del 3 novembre 2026 riguarda il percorso dopo l’apertura.

## Sviluppo e pubblicazione

HTML, CSS, JavaScript, Three.js 0.186.1 e Vite 8. Font e media sono locali; la build usa gli asset già pronti.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
npm run deploy
```

`npm test` copre **28 contratti correnti**: undici per l’ingresso e diciassette per il controller dei film. I 31 contratti di Launch Room rimangono separati in `npm run test:legacy` e non attestano la homepage attuale.

La build statica è in `dist/`; `main` conserva i sorgenti e GitHub Pages pubblica `gh-pages`. Il deploy aggiorna soltanto le radici Space dichiarate in `scripts/deploy-pages.mjs`, preservando le altre cartelle e configurazioni del ramo.

## Percorso e offerta

Un indice compatto presenta subito i cinque servizi. Ogni capitolo ha un titolo esplicito prima del film, una frase e i principali formati realizzabili. I tre blocchi editoriali ripetuti e la lunga lista dei servizi sono stati eliminati; la misurazione della revisione editoriale è **621→278 parole, −55%**, sul contenuto sotto la hero escludendo i form, l’apertura e il footer. I crediti restano consultabili in un pannello del footer.

| Capitolo | Cosa proponiamo | Esempio visivo |
| --- | --- | --- |
| Siti web ed e-commerce | Vendita online, siti vetrina, landing, prenotazioni ed esperienze 3D | Showreel veloce di cinque direzioni web, con demo apribili |
| Loghi e identità | Logo, palette, packaging e comunicazione | FORMA: monogramma 3D e materia stampata |
| Video e animazioni 3D | Film di lancio, CGI e loghi animati | ORA: flacone, vetro, luce e movimento |
| Social e campagne | Contenuti, creatività pubblicitarie ed eventi | SHIFT: prodotto e creatività in più formati |
| Progetti e bandi | Obiettivi, attività, partner, budget e candidature | Dossier tridimensionale per aziende, APS e ASD |

Il nuovo capitolo web sostituisce AVANT e il relativo soggetto architettonico. I cinque esempi sono **SHIFT** (e-commerce sportivo), **VELA** (prodotto di design), **NOVA** (servizi beauty), **BASILICO** (ristorazione) e **OLTRE** (eventi e associazioni). Sono accessibili in `public/showcase/index.html?scene=shift|vela|nude|basilico|oltre`; `nova` è un alias di `nude`. Le azioni di carrello e i moduli sono dimostrativi e locali, senza pagamenti o invii esterni.

Concept, prodotti e marchi dimostrativi non sono clienti, commesse o risultati commerciali. Il web showreel deriva da interfacce HTML originali e transizioni CSS in prospettiva. I render Blender, le immagini AI e i video generativi mantengono provenienze distinte, dichiarate in [ASSET-SOURCES.md](./ASSET-SOURCES.md).

`src/atelier-cinema.js` coordina caricamento vicino allo schermo, pausa, visibilità e primo piano dei film. La timeline web collega la sequenza ai nomi delle cinque direzioni. Scroll, descrizioni, navigazione e azioni restano HTML; movimento ridotto e risparmio dati mantengono il percorso statico con riproduzione manuale disponibile.

I cinque box idea preparano bozze WhatsApp: il visitatore decide se inviarle. I bandi comprendono opportunità europee, nazionali, regionali, provinciali, private, di fondazioni e banche, senza annunci di aperture o promesse di contributi.

**Space Media Studio — Stradello Conrad Marca Relli 1, Parma. +39 347 962 3498.**

## Media e sorgenti

- [ASSET-WEB-SHOWREEL.json](./ASSET-WEB-SHOWREEL.json): nuovo reel web, pipeline e profili nativi.
- [ASSET-WEB-REEL-VISUALS.json](./ASSET-WEB-REEL-VISUALS.json): quattro visual originali AI a 1536×1024 per le demo.
- [ASSET-ATELIER.json](./ASSET-ATELIER.json): film d’acqua stock Film Composite/Pexels, crediti e licenza.
- [ASSET-CINEMA-BLENDER.json](./ASSET-CINEMA-BLENDER.json): nuovi render FORMA e dossier, profili dedicati e verifiche.
- [ASSET-CINEMA-CAMPAIGN.json](./ASSET-CINEMA-CAMPAIGN.json): film Higgsfield SHIFT e composizione pubblicitaria.
- [ASSET-SERVICE-MOTION.json](./ASSET-SERVICE-MOTION.json): produzione Blender precedente; ORA resta attivo, i vecchi FORMA, dossier e AVANT sono archivio.
- [ASSET-ATELIER-MOTION.json](./ASSET-ATELIER-MOTION.json): tipografia Blender SPAZIO, ora archivio.
- [ASSET-ATELIER-VISUALS.json](./ASSET-ATELIER-VISUALS.json): dettagli AI precedenti; i blocchi editoriali sono rimossi, il visual di seta rimane nella demo OLTRE.
- [ASSET-SOURCES.md](./ASSET-SOURCES.md), [MOTION-SERVICES.md](./MOTION-SERVICES.md): provenienza e regia.

Il reel web ha profili **1920×1080 e 720×900**, dieci secondi, 300 fotogrammi a 30 fps, H.264 High/yuv420p con faststart e senza audio. `scripts/render-web-showreel.mjs` compone catture native delle demo con transizioni CSS 3D deterministiche e codifica FFmpeg. È distinto da Blender, da una generazione video AI e da un modello navigabile.

Master, catture e frame rimangono in `outputs/web-reel/`, `outputs/nov26/`, `outputs/motion-services/`, `outputs/cinema-20261103/` e `outputs/cinema-campaign/`, esclusi dal sito pubblico. Il rendering Blender richiede i software e i font dichiarati nei relativi script. I vecchi diorami e i materiali AVANT restano archivio sorgente, senza caricamento nella homepage.

## Produzione cinematica del 3 novembre 2026

La nuova produzione FORMA e dossier è completata: scene originali Blender 5.2.1 LTS / EEVEE a 48 sample con profili nativi 1920×1080 e 720×900, 120 fotogrammi a 30 fps per quattro secondi. Gli output sono `cinema-brand.mp4`, `cinema-brand-mobile.mp4`, `cinema-funding.mp4` e `cinema-funding-mobile.mp4`. Lo script riproducibile è `scripts/cinema-20261103.py`; i master sono in `outputs/cinema-20261103/{brand,funding}/{desktop,mobile}/`. Arial e Times New Roman sono rasterizzati nei render, senza distribuire i file dei font. I quattro profili hanno superato reimportazione dei master, inquadratura, contatti con il piano, separazione di elementi e testi, loop, continuità dei 480 frame nativi, decodifica completa, faststart e confronto con campioni codificati. Film e poster sono otto file, 3.602.997 byte complessivi.

SHIFT sostituisce la precedente tipografia SPAZIO con tre formati pubblicitari in una composizione CSS 3D animata completata: profili 1920×1080 e 720×900, 180 fotogrammi a 30 fps per sei secondi, H.264 High/yuv420p, faststart e senza audio. I film pesano rispettivamente 3.092.933 e 1.609.452 byte; poster dal fotogramma 55. Il film Higgsfield Seedance 2.5 è completato e verificato visivamente: sorgente nativo 1920×1080, HEVC 10 bit, 24 fps, 193 fotogrammi e 8,041667 secondi. La composizione lo usa come superficie video nei formati animati: il movimento della scena è a 30 fps, il film interno conserva la cadenza originale a 24 fps, senza interpolazione. I 360 fotogrammi nativi complessivi e gli export sono verificati, con decodifica completa, struttura faststart e confronto dei campioni codificati con i master. [ASSET-CINEMA-CAMPAIGN.json](./ASSET-CINEMA-CAMPAIGN.json) conserva i risultati. La nuova integrazione è verificata sulla build locale di produzione, su desktop e telefono emulato.

## Verifiche

`npm test` riconfermato durante questa revisione: **28 gruppi superati**. Il controller rimane invariato. La build e il controllo del diff passano; il markup della hero e i sei sorgenti dell’apertura sono identici alla revisione precedente.

La build di produzione è stata provata in Chromium headless isolato a 1440×1100, 1024×768, 700×1000, 393×852, 320×667 e 844×390: nessun overflow laterale e tutti i collegamenti dell’indice con altezza di almeno 44 px. I cinque film sono stati riprodotti e messi in pausa con dimensioni e durate attese: web 1920×1080/10 s, FORMA 1920×1080/4 s, ORA 1440×900/3 s, SHIFT 1920×1080/6 s, dossier 1920×1080/4 s. Cinque brief compilati e validati senza invio, cinque demo aperte e immagini caricate. Nessun errore JavaScript o richiesta esterna osservati.

La prova dedicata del telefono emulato conferma web, FORMA, SHIFT e dossier a **720×900 in riquadri 4:5**, con pause funzionanti. La rotazione a 844×390 contiene lo stesso file verticale in un riquadro 16:9, senza un secondo download. Con una nuova navigazione a movimento ridotto tutti i sei video restano senza sorgente e in pausa; la richiesta manuale avvia correttamente FORMA 720×900. Nessun errore JavaScript osservato.

I quattro profili Blender hanno superato tutti i controlli dei master e degli export; SHIFT ha superato decodifica completa, controllo dei 360 frame nativi, faststart e confronto di campioni codificati con i master. I risultati sono nei rispettivi manifest. Le ricevute delle prove del sito sono `outputs/proofs/cinema-local-desktop-result.json` e `outputs/proofs/cinema-local-phone-result.json`: riguardano la build locale di produzione.

Le prove usano Chromium e telefono emulato, non iPhone fisico o Safari. Il sito preserva il percorso statico e la riproduzione manuale; nessun controllo di build sostituisce l’ispezione delle immagini effettive.
