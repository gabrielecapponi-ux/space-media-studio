# Space Media Studio

Studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. Creiamo **siti web, e-commerce, loghi, identità visive, video, animazioni 3D e campagne**. Affianchiamo aziende, APS e ASD nella progettazione e nelle candidature a bandi.

[Apri il sito](https://gabrielecapponi-ux.github.io/space-media-studio/)

La homepage canonica è `index.html`; `atelier.html` conserva lo stesso percorso come alias con `noindex, nofollow`. Il caricamento dello studio, lo zoom e l’acqua restano la direzione approvata. I testi dell’apertura e il monitor sono aggiornati intenzionalmente per spiegare l’offerta.

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

| Capitolo | Cosa proponiamo | Esempio visivo |
| --- | --- | --- |
| Siti web ed e-commerce | Vendita online, siti vetrina, landing, prenotazioni ed esperienze 3D | Showreel veloce di cinque direzioni web, con demo apribili |
| Loghi e identità | Logo, palette, packaging e comunicazione | FORMA: monogramma 3D e materia stampata |
| Video e animazioni 3D | Film di lancio, CGI e loghi animati | ORA: flacone, vetro, luce e movimento |
| Social e campagne | Contenuti, creatività pubblicitarie ed eventi | SPAZIO: tipografia 3D e direzione visiva |
| Progetti e bandi | Obiettivi, attività, partner, budget e candidature | Dossier tridimensionale per aziende, APS e ASD |

Il nuovo capitolo web sostituisce AVANT e il relativo soggetto architettonico. I cinque esempi sono **SHIFT** (e-commerce sportivo), **VELA** (prodotto di design), **NOVA** (servizi beauty), **BASILICO** (ristorazione) e **OLTRE** (eventi e associazioni). Sono accessibili in `public/showcase/index.html?scene=shift|vela|nude|basilico|oltre`; `nova` è un alias di `nude`. Le azioni di carrello e i moduli sono dimostrativi e locali, senza pagamenti o invii esterni.

Concept, prodotti e marchi dimostrativi non sono clienti, commesse o risultati commerciali. Il web showreel deriva da interfacce HTML originali e transizioni CSS in prospettiva; i quattro altri film principali sono render Blender. Le immagini AI sono raster, distinti dalle mesh e dai film 3D.

`src/atelier-cinema.js` coordina caricamento vicino allo schermo, pausa, visibilità e primo piano dei film. La timeline web collega la sequenza ai nomi delle cinque direzioni. Scroll, descrizioni, navigazione e azioni restano HTML; movimento ridotto e risparmio dati mantengono il percorso statico con riproduzione manuale disponibile.

I cinque box idea preparano bozze WhatsApp: il visitatore decide se inviarle. I bandi comprendono opportunità europee, nazionali, regionali, provinciali, private, di fondazioni e banche, senza annunci di aperture o promesse di contributi.

**Space Media Studio — Stradello Conrad Marca Relli 1, Parma. +39 347 962 3498.**

## Media e sorgenti

- [ASSET-WEB-SHOWREEL.json](./ASSET-WEB-SHOWREEL.json): nuovo reel web, pipeline e profili nativi.
- [ASSET-WEB-REEL-VISUALS.json](./ASSET-WEB-REEL-VISUALS.json): quattro visual originali AI a 1536×1024 per le demo.
- [ASSET-ATELIER.json](./ASSET-ATELIER.json): film d’acqua stock Film Composite/Pexels, crediti e licenza.
- [ASSET-SERVICE-MOTION.json](./ASSET-SERVICE-MOTION.json): produzione Blender di FORMA, ORA, dossier e precedente AVANT; quest’ultimo è archivio.
- [ASSET-ATELIER-MOTION.json](./ASSET-ATELIER-MOTION.json): tipografia Blender SPAZIO.
- [ASSET-ATELIER-VISUALS.json](./ASSET-ATELIER-VISUALS.json): dettagli AI di FORMA, ORA e SPAZIO.
- [ASSET-SOURCES.md](./ASSET-SOURCES.md), [MOTION-SERVICES.md](./MOTION-SERVICES.md): provenienza e regia.

Il reel web ha profili **1920×1080 e 720×900**, dieci secondi, 300 fotogrammi a 30 fps, H.264 High/yuv420p con faststart e senza audio. `scripts/render-web-showreel.mjs` compone catture native delle demo con transizioni CSS 3D deterministiche e codifica FFmpeg. È distinto da Blender, da una generazione video AI e da un modello navigabile.

Master, catture e frame rimangono in `outputs/web-reel/`, `outputs/nov26/` e `outputs/motion-services/`, esclusi dal sito pubblico. Il rendering Blender richiede i software e i font dichiarati nei relativi script. I vecchi diorami e i materiali AVANT restano archivio sorgente, senza caricamento nella homepage.

## Verifiche

Build e `npm test` superati: 28 contratti correnti, undici per l’ingresso e diciassette per i film. Verificata anche la timeline periodica di 300 fotogrammi e il deploy del nuovo percorso `showcase`, con preservazione delle cartelle estranee e rifiuto di percorsi non autorizzati.

Prova effettiva in Chrome headless isolato, Playwright CLI 0.1.23: desktop 1440×900, telefono emulato 393×852 e layout 320×667, 667×900, 844×390. Showreel desktop/verticale e durata verificati; i cinque capitoli aggiornano correttamente etichetta e link attivo. Tutte le demo si aprono dai collegamenti della homepage, caricano immagini e font e hanno interazioni locali funzionanti: carrello, richiesta, prenotazione e iscrizione. Cinque brief dell’agenzia conservati e validati; nessun invio esterno effettuato.

Nessun errore JavaScript o overflow laterale osservato. Con movimento ridotto una nuova navigazione mantiene senza sorgente tutti e sei i video, lasciando disponibile la riproduzione manuale. La rotazione mantiene il film già scelto e ne contiene la composizione in un riquadro orizzontale. Sono prove in emulazione Chromium, non una certificazione su iPhone fisico o Safari.
