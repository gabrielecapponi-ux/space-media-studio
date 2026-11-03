# Space Media Studio

Studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. La homepage «**Brand. Web. Motion.**» unisce il caricamento 3D dello studio, il film macro dell’acqua e quattro concept di lavoro: identità, siti, immagini di prodotto e campagne. Ogni servizio ha una propria sequenza 3D originale. Progetti e bandi estende l’offerta ad aziende, APS e ASD, con un dossier tridimensionale dedicato.

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
| FORMA / Torrefazione | Naming, logo, brand identity e packaging | Monogramma 3D che si compone su carta, packaging e dettaglio di stampa |
| AVANT / Architettura | Siti, landing page, e-commerce e web 3D | Film 3D di interfacce desktop e mobile in profondità |
| ORA / Fragranza | Direzione visiva, motion design e CGI | Flacone 3D con vetro, liquido, luci e movimento di camera |
| SPAZIO / Cultura | Identità evento, contenuti e campagne | Film tipografico 3D originale e dettaglio di seta gialla |
| Progetti / Aziende, APS e ASD | Progettazione, budget e candidature | Dossier 3D con piani che si separano e si ricompongono |

Sono esempi originali di lavori possibili, non clienti, commesse o risultati commerciali. I cinque film principali sono render Blender originali; i dettagli fotografici AI sono raster. Il film AVANT incorpora una texture architettonica AI e non rappresenta un configuratore interattivo. Nessuna fotografia viene presentata come mesh navigabile o film prodotto dallo studio.

Il caricamento e l’apertura approvati sono conservati. Sotto la hero, `src/atelier-cinema.js` coordina movimento allo scroll, riproduzione differita dei cinque film. Non intercetta wheel o swipe; testi e azioni restano HTML. Riduzione del movimento, SaveData, pagina nascosta, menu e uscita dall’inquadratura sospendono il lavoro non necessario. I poster mantengono utile il percorso statico.

I cinque box idea usano form GET nativi verso WhatsApp, con contesto e validazione aggiunti da `src/idea-briefs.js`. Il visitatore decide se inviare la bozza. Non sono presenti invii automatici, backend di raccolta o analytics.

Progetti e bandi comprende obiettivi, attività, partner, calendario, budget e ricerca delle opportunità europee, nazionali, regionali, provinciali, private, di fondazioni e banche. Il dossier è illustrativo, senza importi o finanziamenti attribuiti; non annuncia bandi aperti né garantisce contributi.

**Space Media Studio — Stradello Conrad Marca Relli 1, Parma. +39 347 962 3498.**

## Produzione e provenienza

- [ASSET-ATELIER.json](./ASSET-ATELIER.json): film d’acqua stock di Film Composite/Pexels, riusato nell’apertura con crediti e licenza.
- [ASSET-LAUNCH-ROOM.json](./ASSET-LAUNCH-ROOM.json): provenienza dei quattro visual AI originali, ancora usati nei concept; le descrizioni della vecchia scena live conservano il proprio ambito storico.
- [ASSET-ATELIER-VISUALS.json](./ASSET-ATELIER-VISUALS.json): tre nuovi dettagli AI di FORMA, ORA e SPAZIO, 1672×941 nativi, senza upscaling, 812.292 byte complessivi.
- [ASSET-ATELIER-MOTION.json](./ASSET-ATELIER-MOTION.json): film tipografico Blender originale, profili web, poster, hash e verifiche.
- [ASSET-SERVICE-MOTION.json](./ASSET-SERVICE-MOTION.json): quattro nuovi film Blender per brand, web, prodotto e progettazione.
- [MOTION-SERVICES.md](./MOTION-SERVICES.md): direzione e funzione dei cinque gesti.
- [ASSET-SOURCES.md](./ASSET-SOURCES.md): distinzione dei materiali, font e licenze.

I master `.blend`, i PNG numerati e i master AI sono conservati localmente in `outputs/nov26/` e `outputs/motion-services/`, escluse dalla pubblicazione. La build usa gli asset già pronti. La rigenerazione dei film richiede Blender, FFmpeg/ffprobe, Python 3 con Pillow e i font di sistema dichiarati negli script; la produzione corrente usa macOS e Blender 5.2.1 LTS. Il film tipografico usa geometrie e materiali 3D reali; non è una simulazione di fluidi o un video 4K a 60 fps. I vecchi modelli sperimentali di `launch-room.js` e `scene-objects.js` restano archivio sorgente e non vengono caricati dalla homepage.

## Verifiche

Build di produzione e `npm test` superati: **28 contratti correnti**, undici per l’ingresso e diciassette per il controller dei film. I contratti includono cinque player indipendenti, nomi accessibili dedicati, un solo film principale in riproduzione quando le sezioni si sovrappongono, pausa conservata, visibilità, lifecycle, movimento ridotto, risparmio dati e recupero manuale di un errore di rete.

Prove effettive con Playwright CLI 0.1.23 in Chrome headless isolato: desktop 1440×900, telefono emulato 393×852, layout 320×667, 667×900 e 844×390. Tutti i cinque film vengono caricati e riprodotti; SPAZIO sceglie correttamente la variante verticale. Verificati controlli da 44 px, colonne del testo, assenza di overflow laterale, pausa dopo andata/ritorno, menu e validazione dei brief. Nessun messaggio esterno inviato. Nessun errore JavaScript osservato nei flussi normali.

Una navigazione con movimento ridotto mantiene senza sorgente tutti e sei i video (apertura e cinque servizi); il comando manuale resta disponibile. Provati anche ingresso immediato e recupero dopo un errore video indotto, con un errore di rete atteso e nessun errore JavaScript.

Nel passaggio desktop locale l’ingresso è risultato pronto in circa 5,0 secondi, senza throttling; è una misura di laboratorio su Chrome con risorse già visitate, non un dato di campo. Tempi e impostazioni effettivi del rendering Blender sono nel manifest. Le prove non certificano un iPhone fisico, Safari o una frequenza GPU universale. Poster e fotogrammi sono verificati visivamente; la continuità dei film viene controllata sui fotogrammi nativi e sulla chiusura del loop.
