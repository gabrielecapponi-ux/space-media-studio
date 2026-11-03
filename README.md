# Space Media Studio

Studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. La homepage «**Brand. Web. Motion.**» unisce il caricamento 3D dello studio, il film macro dell’acqua e quattro concept di lavoro: identità, siti, immagini di prodotto e campagne. Progetti e bandi estende l’offerta ad aziende, APS e ASD.

[Apri il sito](https://gabrielecapponi-ux.github.io/space-media-studio/)

`index.html` è la homepage canonica. `atelier.html`, la precedente anteprima, conserva lo stesso percorso come alias con `noindex, nofollow`. [ATELIER-PREVIEW.md](./ATELIER-PREVIEW.md) ne documenta ruolo e integrazione.

## Sviluppo e pubblicazione

Il progetto usa HTML, CSS, JavaScript, Three.js 0.186.1 e Vite 8, senza un framework UI aggiuntivo. Font e media vengono serviti localmente.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
npm run deploy
```

`npm test` esegue i controlli correnti di ingresso e contenuti cinematografici: 11 contratti per l’entry e 12 per il controller del percorso. I 31 contratti della vecchia Launch Room sono separati in `npm run test:legacy` e non attestano la resa della homepage attuale.

La build statica è in `dist/`; i sorgenti sono in `main` e GitHub Pages pubblica `gh-pages`. Il deploy aggiorna solo le radici Space dichiarate in `scripts/deploy-pages.mjs`, preservando cronologia, altre cartelle e configurazioni del ramo di pubblicazione.

## Percorso visivo e servizi

| Concept dimostrativo | Servizio | Materiali mostrati |
| --- | --- | --- |
| FORMA / Torrefazione | Naming, logo, brand identity e packaging | Immagine d’insieme e dettaglio di stampa e materia |
| AVANT / Architettura | Siti, landing page, e-commerce e web 3D | Composizioni HTML desktop, progetti e mobile |
| ORA / Fragranza | Direzione visiva, motion design e CGI | Visual di lancio e dettaglio di vetro, luce e prodotto |
| SPAZIO / Cultura | Identità evento, contenuti e campagne | Immagini di seta gialla e film tipografico 3D originale |

Sono esempi originali di lavori possibili, non clienti, commesse o risultati commerciali. Le immagini AI sono raster; le interfacce AVANT sono composizioni HTML; la sequenza tipografica è un render Blender. Nessuna fotografia viene presentata come mesh navigabile o film prodotto dallo studio.

Il caricamento e l’apertura approvati sono conservati. Sotto la hero, `src/atelier-cinema.js` coordina movimento allo scroll, composizioni web e riproduzione differita del film. Non intercetta wheel o swipe; testi e azioni restano HTML. Riduzione del movimento, SaveData, pagina nascosta, menu e uscita dall’inquadratura sospendono il lavoro non necessario. I poster mantengono utile il percorso statico.

I cinque box idea usano form GET nativi verso WhatsApp, con contesto e validazione aggiunti da `src/idea-briefs.js`. Il visitatore decide se inviare la bozza. Non sono presenti invii automatici, backend di raccolta o analytics.

Progetti e bandi comprende obiettivi, attività, partner, calendario, budget e ricerca delle opportunità europee, nazionali, regionali, provinciali, private, di fondazioni e banche. Il diagramma di dodici mesi è illustrativo, senza importi o finanziamenti attribuiti; non annuncia bandi aperti né garantisce contributi.

**Space Media Studio — Stradello Conrad Marca Relli 1, Parma. +39 347 962 3498.**

## Produzione e provenienza

- [ASSET-ATELIER.json](./ASSET-ATELIER.json): film d’acqua stock di Film Composite/Pexels, riusato nell’apertura con crediti e licenza.
- [ASSET-LAUNCH-ROOM.json](./ASSET-LAUNCH-ROOM.json): provenienza dei quattro visual AI originali, ancora usati nei concept; le descrizioni della vecchia scena live conservano il proprio ambito storico.
- [ASSET-ATELIER-VISUALS.json](./ASSET-ATELIER-VISUALS.json): tre nuovi dettagli AI di FORMA, ORA e SPAZIO, 1672×941 nativi, senza upscaling, 812.292 byte complessivi.
- [ASSET-ATELIER-MOTION.json](./ASSET-ATELIER-MOTION.json): film tipografico Blender originale, profili web, poster, hash e verifiche.
- [ASSET-SOURCES.md](./ASSET-SOURCES.md): distinzione dei materiali, font e licenze.

I master `.blend`, i PNG numerati e i master AI sono conservati localmente in `outputs/nov26/`, esclusa dalla pubblicazione. Il film tipografico usa geometrie e materiali 3D reali; non è una simulazione di fluidi o un video 4K a 60 fps. I vecchi modelli sperimentali di `launch-room.js` e `scene-objects.js` restano archivio sorgente e non vengono caricati dalla homepage.

## Verifiche

Build di produzione e `npm test` superati: 23 contratti correnti, undici per l’ingresso e dodici per il cinema. Verifica reale in Chrome headless isolato con Playwright CLI 0.1.23: desktop 1280×720 e formati emulati 393×852, 320×667 e 844×390, senza overflow laterale. Provati ingresso e ritorno dei controlli, film desktop/verticale, pausa mantenuta dopo lo scroll, riproduzione manuale, menu, apertura e validazione dei brief. Nessun invio esterno effettuato e nessun errore JavaScript osservato nei due flussi completi.

Con movimento ridotto, una nuova navigazione mantiene entrambe le sorgenti video non assegnate; la riproduzione manuale resta disponibile. Poster, ritaglio e impaginazione sono stati controllati nelle schermate catturate. Si tratta di emulazione Chromium, non di una prova su iPhone fisico o di una certificazione GPU/FPS. I 31 controlli del percorso precedente rimangono separati in `npm run test:legacy`.
