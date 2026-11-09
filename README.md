# Space Media Studio

Studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. Creiamo **siti web, e-commerce, loghi, identità, video, animazioni 3D e campagne**. Affianchiamo aziende, APS e ASD nella progettazione e nelle candidature a bandi.

[Apri il sito](https://gabrielecapponi-ux.github.io/space-media-studio/)

La vetrina del **9 novembre 2026** apre con la costruzione dello studio Blender a schermo intero. Il caricamento arriva al 100%, poi si apre il sito con la goccia filmata in macro in 4K nativo su desktop. Il titolo occupa la parte alta della pagina e si allarga leggermente all’impatto. La demo e-commerce e la campagna condividono il campionatore SHIFT PHASE 01. “Web.”, il simbolo e i richiami principali sono gialli. Le cinque offerte conservano ancore, demo e brief. Progetti e bandi torna al percorso originale disegnato da una linea sul giallo. `index.html` è la homepage e `atelier.html` è la variante con `noindex, nofollow`. La pubblicazione è separata dalla build locale.

## Sviluppo e pubblicazione

HTML, CSS, JavaScript, Three.js 0.186.1 e Vite 8. Font e media sono locali; nessuna nuova dipendenza per questa revisione. La build usa gli asset già prodotti.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
npm run deploy -- --ref <commit-sorgenti-gia-inviato>
```

La suite comprende **69 gruppi, 21 per l’ingresso, 40 per i media e 8 per il percorso dei progetti**. I controlli storici di Launch Room rimangono separati in `npm run test:legacy` e non attestano la homepage attuale.

La build statica è in `dist/`; `main` conserva i sorgenti e GitHub Pages pubblica `gh-pages`. `scripts/deploy-pages.mjs` sostituisce soltanto le radici Space dichiarate, inclusa `models/`, preservando le altre cartelle e configurazioni del ramo. Il contratto di copia è stato provato in directory temporanee con `mrsmeet/` e `CNAME` conservati, senza pubblicare. Porte configurate: dev 5174, preview 5175; le anteprime isolate della lavorazione usano 5208 e 5209, da verificare prima di aprirle.

## Percorso e offerta

La [guida della cartella](docs/WORKSPACE.md) distingue file attivi, archivi, memoria locale e siti cliente. `npm run assets:check` verifica i 56 asset del manifest di consegna; `npm test` comprende anche le verifiche di asset e pubblicazione. `npm run context:backup` conserva una copia verificata della memoria locale. Il deploy usa esclusivamente un commit già presente su `main` remoto, costruito e testato in una cartella temporanea: le modifiche locali non entrano nel rilascio.

Cinque miniature collegano direttamente ai servizi. Ogni capitolo mantiene un titolo esplicito, una frase e una riga di formati; le immagini mostrano concept non commissionati, senza presentarli come clienti o risultati reali.

| Servizio | Esempio visivo | Metodo |
| --- | --- | --- |
| Siti web ed e-commerce | Strumenti musicali, design, beauty, ristorazione e associazioni | Schermate delle cinque demo funzionanti. Fotografie Cycles del campionatore SHIFT PHASE 01 |
| Loghi e identità | CACAO ATELIER: cofanetto, cioccolato e identità coordinata | Geometria, materiali, cerniera e animazione Blender originali |
| Video e animazioni 3D | LUMA, corpo macchina, diaframma e selettori | Fotografie Cycles riproiettate sulla geometria Blender con camera animata, parallasse e profondità |
| Social e campagne | SHIFT PHASE 01 in verticale, quadrato e banner | Artwork della campagna ricavati dallo stesso modello 3D usato nello shop |
| Progetti e bandi | Idea, scrittura insieme, candidatura e progetto possibile | Percorso SVG originale, linea nera sul giallo e camera animata |

Le cinque demo web sono **SHIFT**, **VELA**, **NOVA**, **BASILICO** e **OLTRE**. Il percorso è `public/showcase/index.html?scene=shift|vela|nude|basilico|oltre`; `nova` è un alias di `nude`. Carrello, prenotazioni e moduli sono dimostrativi e locali, senza pagamenti o invii esterni.

I cinque box “Descrivi la tua idea” preparano bozze WhatsApp: il visitatore decide se inviarle. L’offerta bandi comprende opportunità UE, nazionali, regionali, provinciali, private, di fondazioni e banche. Requisiti, ammissibilità ed esito sono da verificare per ogni candidatura: il percorso illustrato non promette un finanziamento.

**Space Media Studio — Stradello Conrad Marca Relli 1, Parma. +39 347 962 3498.**

## Intro, film e controlli

Il caricamento occupa lo schermo su desktop e mobile e precede la pagina a ogni nuova navigazione, anche arrivando da un’ancora o ricaricando dopo lo scroll. L’eventuale ancora si apre dopo l’ingresso. Il contatore descrive la preparazione e la costruzione dello studio, termina a 100% e lascia un breve momento di lettura prima della transizione. “Entra subito” ed Escape consentono di saltarlo. Errori e timeout rilasciano sempre la pagina. Movimento ridotto e risparmio dati usano il percorso statico.

Su desktop la stanza modellata in Blender viene assemblata in tempo reale. Il GLB di 635.496 byte viene richiesto una volta insieme al modulo grafico. I 17 gruppi si assemblano in 2,65 s, poi la camera avvicina il monitor. Su telefono e dispositivi touch il film Blender dedicato riproduce l’intera costruzione dentro lo stesso caricamento a schermo intero, con percentuale e comandi. L’acqua resta ferma fino alla conclusione.

La goccia di Film Composite parte dal fotogramma zero. La hero conserva il rapporto fotografico completo 16:9 su desktop e 4:5 in verticale, con titolo sopra e comandi sotto. Il desktop usa il master nativo 3840×2160 a 24 fps anche in finestre più piccole, il portrait un taglio 1080×1350 dallo stesso negativo UHD, il touch in orizzontale il Full HD. La cadenza è quella della ripresa originale, senza interpolazione. L’impatto al frame 25 (1,04 s) allarga il titolo del 3,5%. “Rivedi la caduta” riavvia acqua e titolo.

I film dei servizi usano i prefissi `director-` ed `elegant-`. LUMA e la campagna SHIFT hanno nuovi master widescreen 2560×1440 a 60 fps, da dieci secondi, con illuminazione e movimento dei soggetti ricomposti dai master originali. Le ricette sono in `scripts/elegant-films/`. Il desktop sceglie la versione QHD o Full HD disponibile, a 60 fps, oppure 1280×720 a 30 fps su una connessione lenta. Quando disponibile viene usata la velocità effettiva di trasferimento del modello dello studio. Per i due film QHD si seleziona il master da 1440p sopra 12 Mbit/s, Full HD fra 6 e 12, 720p sotto 6. I film portrait sono 720×900 a 30 fps. I comandi per CACAO, LUMA e campagna sono nella fascia sotto l’immagine. I master di produzione e i rapporti di collaudo sono in `outputs/director-20261106/`. Le ricette sono in `scripts/director-craft/`, `scripts/director-shift/`, `scripts/director-mobile-studio.py` e `scripts/director-phone-water.py`.

`src/atelier-cinema.js` prepara i film vicino al viewport, aspetta il primo fotogramma decodificato per l’avvio automatico e gestisce le richieste `play()` interrotte. Ogni nuovo ingresso in vista e ogni nuovo passaggio del mouse fa ripartire il film da zero. La pausa resta attiva nella visita corrente, anche aprendo il menu o cambiando scheda. Un ritorno alla sezione o al film avvia una nuova visita. Il puntatore dà priorità al film desiderato quando due capitoli sono visibili. Il controller mantiene un solo film dei quattro servizi video in riproduzione e conserva `muted`/`playsinline`. La goccia segue la stessa regola di rientro. I quattro poster HTML responsivi restano visibili fino al primo frame decodificato. Senza JavaScript sono utilizzabili poster, ancore e brief; il player manuale non è attivo. Con JavaScript e movimento ridotto o risparmio dati, i poster rimangono visibili e il film parte soltanto su comando manuale. Menu, ingresso, pagina nascosta e vista cinema sospendono i player della pagina.

“Progetti e bandi” usa `src/funding-journey.js` e i poster SVG originali. In 22 secondi la linea costruisce lampadina, progettazione condivisa, candidatura ed edificio, poi riunisce le quattro fasi. Il percorso riparte tornando in vista o entrando con il mouse, con comandi pausa e replay. Menu, cinema e scheda nascosta sospendono il disegno. Movimento ridotto e risparmio dati mostrano subito l’illustrazione completa, con avvio manuale disponibile. Non si scarica più un MP4 dei bandi.

Il comando “In primo piano” apre il film dal punto corrente con controlli nativi, Escape e restituzione del focus. Il dialog conserva il rapporto 16:9 o 4:5 anche con poca altezza disponibile. Chiusura, resize, nuove preferenze e pagina nascosta annullano l’animazione; alla chiusura si libera il decoder. La ripresa rispetta la pausa manuale. Il menu mobile si chiude anche con Escape, clic esterno o uscita del focus. Testi, demo e navigazione rimangono HTML su scroll nativo.

## OSKEN e provenienza

[OSKEN 1.0.0](https://horizonx.so/explore/osken) è stato acquisito il 5 novembre con approvazione dell’utente tramite la Premium Library HorizonX. Ricevuta e licenza sono in `outputs/horizon-osken-20261105/ACQUISITION.json`; `ADAPTATION.md` descrive il port. `src/atelier-osken-motion.js/.css` applicano un ingresso di 620 ms alla superficie poster/video e una risposta di 280 ms al passaggio del mouse. Alla fine si rilasciano trasformazione, prospettiva e layer temporaneo. `src/cinema-viewer.js/.css` adattano l’espansione all’apertura esplicita di 460 ms. Comandi e rettangoli misurati restano stabili; mobile, finestre basse, movimento ridotto e SaveData non ricevono moto decorativo.

La pila di articoli da 600 vh e lo slideshow OSKEN non sono trasferiti. Nessuna immagine, font, marchio o dipendenza React/Motion/Lenis del template è importata. Il codice originale acquisito rimane privato ed escluso dalla build. Halvane AR, Cyber Jackets e CoverFlow rimangono reference non acquisite. Le correzioni dell’autoplay appartengono al controller Space.

[ASSET-SOURCES.md](./ASSET-SOURCES.md) documenta le fonti. In `outputs/flagship-20261106/` si trovano i master del 6 novembre, le ricette di produzione, i provini e i risultati dei controlli. Per la sorgente fotografica dell’acqua consultare [ASSET-WATER.md](./ASSET-WATER.md).

## Verifiche della precedente edizione del 6 novembre (mattina)

La build Vite e tutti i 41 gruppi sono passati. Entrambe le pagine risolvono i 37 percorsi locali e le dieci ancore. La suite Chrome ha verificato l’autoplay dei cinque servizi a 1440×900, 393×852, 320×640 e 844×390. WebKit ha superato 16 controlli a 1440×900 e 393×852. Verificati separatamente replay, pausa, vista cinema, preferenze statiche e cambio automatico HD/UHD/portrait. Sul Mac di prova la misura conclusiva a 1440×900 registra 150 fotogrammi in 2,5 secondi per ciascuno dei cinque film, zero scarti. Dati e schermate sono in `outputs/flagship-20261106/qa/`. L’anteprima locale è sulla porta 5209.

## Verifiche del 5 novembre (versione precedente)

- **41 gruppi controller PASS**, inclusi associazione poster/sorgente, cambio formato, errori e riavvio; `final-tests.log`. **Build PASS**, `final-build.log`; 174 frammenti di testo e vincoli dei form preservati, 30 asset con hash coerenti fra produzione, `public/` e `dist/` in `final-assets-report.json`.
- **Dieci film CACAO/LUMA/SHIFT/web/funding verificati:** master riaperti, conteggi/cadenza dei file, decodifica completa, faststart e loop. Ricevute per profilo in `outputs/motion-refinement-20261105/`; web ha 600 frame e funding 720, senza frame adiacenti identici nell’analisi 96×54 e con posa periodica di guardia identica all’iniziale. Funding include tutti i 152 raccordi compositi per profilo.
- **30 casi autoplay PASS:** cinque film per tre viewport (1440×900, 393×852, 320×740) in Chrome e WebKit, con profili/durate corretti, avanzamento, pausa persistente e focus cinema. Nessun errore JavaScript/HTTP o overflow; `final-site-{chrome,webkit}.txt`. I gate separati `final-static-play-{chrome,webkit}.txt` confermano, dopo play manuale in reduced motion, `readyState` 4 e circa 0,60 s di avanzamento in entrambi i browser.
- **OSKEN e cinema PASS Chrome/WebKit:** ingresso, superficie poster/video, pausa, focus, resize e lifecycle. Rapporto corretto e nessun overflow a 1440×900, 393×852 e 844×390. Report `osken-surface-build-*`, `cinema-aspect-*` e `cinema-lifecycle-*` nella stessa cartella.
- **Sei percorsi statici PASS** in Chrome isolato a 1440×900 e 393×852: JavaScript disabilitato, SaveData emulato, movimento ridotto; cinque immagini complete, ancore e brief nativi. Nessun GLB/MP4 automatico; nei casi con JavaScript e SaveData/movimento ridotto parte soltanto il film richiesto dal gesto manuale. Il caso senza JavaScript resta statico. Report `static-browser-SUMMARY.md` e `static-browser-report.json`; questa prova strutturale precede l’ultima sostituzione web/funding.
- **Rete a cache fredda:** nella prova mobile 393×852, 4 Mbps/80 ms, il rilascio dell’ingresso passa da 11,24 a 7,57 s. Entrambe le misure avvengono durante render Blender concorrenti; ricevute `cold-network.txt` e `cold-network-final.txt`. È un confronto osservato, non una garanzia universale o una misura degli FPS.

L’intro geometrica conserva le verifiche export/reimport e fallback in `outputs/studio-blender-20261105/`. I report delle precedenti produzioni restano nell’archivio. Le prove Chrome/WebKit sono automatizzate, con viewport emulati; non attestano un iPhone fisico. Le prove lifecycle annotate usano eventi di visibilità simulati. Nessun form inviato.

**Cadenza osservata:** due campioni di cinque film per quattro secondi, su questo Mac a 1440×900 senza Blender concorrente. Il primo registra 1.205 frame decodificati e zero scarti; il secondo registra 1.202 frame al compositore e uno scarto totale, circa 60 fps nelle condizioni della prova. Le callback JavaScript hanno mediana 16,7 ms e p95 fino a 33,4 ms e possono aggregarsi: il loro numero non coincide necessariamente con i frame presentati. Ricevute `final-cadence-chrome.txt` e `final-cadence-compositor-chrome.txt`. Il risultato non garantisce la stessa cadenza su altri dispositivi.

**Consegna locale completata, QA finale PASS.** Riepilogo autorevole in `outputs/motion-refinement-20261105/FINAL-QA.json`, asset in `final-assets-report.json`, test e build nei log citati. Tutti i dieci film dei servizi sono attivi in entrambe le pagine HTML; nessun output privato è incluso nella build. La pubblicazione rimane separata e non è stata eseguita.
