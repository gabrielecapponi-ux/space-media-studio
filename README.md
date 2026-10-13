# Space Media Studio

Studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. **Space / Launch Room**, riprogettazione del 12 ottobre 2026, presenta quattro servizi attraverso una mostra digitale con camera e superfici tridimensionali: branding, web ed e-commerce, immagini e film di prodotto, contenuti e campagne. L'apertura «Le idee. In grande.» introduce il percorso; una sezione complementare presenta progetti e bandi per aziende, APS e ASD.

[Apri il sito](https://gabrielecapponi-ux.github.io/space-media-studio/)

## Sviluppo e pubblicazione

Node.js compatibile con Vite 8. La scena usa **Three.js 0.186.1**; non è richiesto un framework UI o un servizio remoto per il sito.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm run deploy
```

La build statica è in `dist/`. `main` contiene i sorgenti e GitHub Pages pubblica `gh-pages`. I percorsi relativi consentono la pubblicazione nel sottopercorso del repository. Il deploy ricostruisce il bundle e aggiorna soltanto le radici Space elencate in `scripts/deploy-pages.mjs`, mantenendo cronologia, cartelle estranee e `CNAME` presenti nel ramo di pubblicazione. Nuovi percorsi di produzione alla radice richiedono un aggiornamento esplicito dell'elenco.

## Quattro servizi, un percorso

| Capitolo | Esempio dimostrativo | Offerta |
| --- | --- | --- |
| 01 / Branding | Identità FORMA: packaging, stampa e direzione artistica per un caffè contemporaneo | Strategia, naming, logo, brand identity, packaging |
| 02 / Web | Interfaccia per uno studio di architettura, presentata in superfici desktop e mobile | Siti, landing page, e-commerce, esperienze web 3D |
| 03 / Prodotto | Visual ORA: vetro, fragranza ambrata, acqua e luce | Immagini di prodotto, render, film CGI, campagne di lancio |
| 04 / Campagne | Spazio: un'immagine di seta gialla tradotta in campagna culturale | Video e contenuti social, creatività pubblicitarie, campagne Meta e Google |

Sono **progetti possibili originali**, con nomi illustrativi: non clienti, lavori commissionati o risultati commerciali. Quattro immagini generate con il tool image_gen incorporato vengono applicate a vere superfici 3D, con spessore, materiali, luci, ombre e camera. Il browser e il billboard curvo sono geometrie della scena; il caffè, l'edificio, il flacone e la seta raffigurati nelle immagini rimangono contenuti raster. Non sono modelli 3D navigabili dei prodotti, né film renderizzati 4K a 60 fps.

Lo scroll nativo sposta la camera fra quattro stazioni; superfici e composizioni entrano ed escono in continuità. Il puntatore fine aggiunge un movimento contenuto. I dettagli del progetto si aprono in un dialog nativo con testo, visual e collegamento al relativo box idea. Le immagini HTML restano il ripiego quando la scena non è disponibile.

## Idee, progetti e contatti

I **cinque box «Descrivi la tua idea»**, uno per servizio più Progetti & bandi, usano un form GET nativo verso WhatsApp e funzionano anche senza JavaScript. Il miglioramento JavaScript aggiunge il contesto del servizio, conteggio e validazione. Il visitatore rilegge la bozza e decide se inviarla; il sito non invia messaggi automaticamente e non archivia le idee in un backend.

**Progetti & bandi** presenta obiettivi, attività, partner, budget, ricerca delle opportunità e preparazione del dossier per aziende, APS e ASD. Le fonti considerate sono europee, nazionali, regionali, provinciali, private, fondazioni e istituti bancari. Digitalizzazione, cultura e sport sono esempi generali: non annunci di bandi aperti o garanzie di finanziamento. Ogni percorso richiede la verifica del bando e dei requisiti.

**Space Media Studio — Stradello Conrad Marca Relli 1, Parma. +39 347 962 3498.** Il footer riporta fondatori, sede, chiamata, WhatsApp e mappa. Non sono presenti analytics o cookie di profilazione.

## Architettura e movimento

- `index.html`: quattro capitoli semantici, immagini di ripiego, dialog dei progetti, cinque form, progetti e contatti.
- `src/launch-room.css`: composizione responsive, tipografia, navigazione, menu e dialog.
- `src/launch-room.js`: scena Three.js, superfici, camera, caricamento delle texture e gestione delle risorse GPU.
- `src/main.js`: importazione della scena, navigazione, pausa, menu, dialog, focus e lifecycle.
- `src/idea-briefs.js`: miglioramento dei form WhatsApp, mantenendo l'invio nativo.

La scena viene importata dinamicamente quando le preferenze permettono il movimento. Movimento ridotto e SaveData mantengono le immagini HTML. Il comando pausa e l’apertura di un box idea tornano alla presentazione statica; menu, dialog e documento nascosto sospendono il rendering. Uscire dai quattro capitoli ferma la scena. Nessuna intercettazione di wheel o swipe impone un numero di gesti: i quattro capitoli possono crescere per accogliere contenuti e form aperti.

I limiti di densità del rendering e le cadenze previste dal controller sono scelte di implementazione, non una certificazione di fluidità, risoluzione 4K o prestazioni su un iPhone fisico. La build è stata verificata nel browser a 1200×728, 390×844, 320×667 e 844×390, senza overflow laterale. Menu, dialog, focus, pausa, box idea e navigazione fra le quattro scene sono stati provati; 39 gruppi di contratti locali coprono inoltre lifecycle, preferenze, errori e form. La build completa occupa circa 1,9 MB; i quattro JPEG totalizzano 1.145.984 byte.

## Provenienza e licenze

Le quattro immagini pubbliche sono **1672×941 pixel nativi**, senza upscaling. Master e prove rimangono in `outputs/launch-room/`, esclusa dal repository e dalla build. Hash, dimensioni, provenienza e ambito dei materiali correnti sono in [ASSET-LAUNCH-ROOM.json](./ASSET-LAUNCH-ROOM.json); fonti e licenze sono in [ASSET-SOURCES.md](./ASSET-SOURCES.md).

`studio-siti-space`, Studio frontend, UI animation e Siti 3D guidano la riprogettazione. La prova locale Video Non Higgsfield con ComfyUI/LTX è stata interrotta prima di produrre fotogrammi: nessun video di quella prova è incluso nel sito. **Horizon CoverFlow non è acquisito né integrato**; la scena e i componenti correnti sono originali e non consumano download Horizon.

Le vecchie scene e i film sono documentazione storica, archiviati fuori dai media pubblici; non descrivono la produzione corrente. Three.js conserva la licenza MIT e i font locali Space Grotesk e DM Mono conservano la SIL Open Font License. La pubblicazione dei sorgenti non concede una licenza generale di riutilizzo delle composizioni originali.
