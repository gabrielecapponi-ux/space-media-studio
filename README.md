# Space Media Studio

Studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. «**Le idee. In azione.**» apre un percorso fra loghi e identità, siti web, motion design e campagne. Quattro scene tridimensionali originali mostrano il passaggio dal segno al prodotto e ai formati di comunicazione. Una sezione complementare presenta sviluppo di progetti e candidature a bandi per aziende, APS e ASD.

[Apri il sito](https://gabrielecapponi-ux.github.io/space-media-studio/)

È disponibile anche una [anteprima editoriale indipendente](https://gabrielecapponi-ux.github.io/space-media-studio/atelier.html), che recupera il caricamento dello studio. Stato, media e limiti sono in [ATELIER-PREVIEW.md](./ATELIER-PREVIEW.md).

## Sviluppo e pubblicazione

Node.js compatibile con Vite 8. La scena usa **Three.js 0.186.1**; non è richiesto un framework UI o un servizio remoto per il sito.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
npm run deploy
```

La build statica è in `dist/`. `main` contiene i sorgenti e GitHub Pages pubblica `gh-pages`. I percorsi relativi consentono la pubblicazione nel sottopercorso del repository. Il deploy ricostruisce il bundle e aggiorna soltanto le radici Space elencate in `scripts/deploy-pages.mjs`, mantenendo cronologia, cartelle estranee e `CNAME` presenti nel ramo di pubblicazione. Nuovi percorsi di produzione alla radice richiedono un aggiornamento esplicito dell'elenco.

## Quattro servizi, quattro scene

| Capitolo | Geometria e movimento nel browser | Esempio di lavoro possibile |
| --- | --- | --- |
| 01 / Branding | Il marchio Space, spesso e smussato, si divide in quattro parti e si ricompone; carta, colore e tipografia completano l'identità | FORMA: naming, logo, packaging e materiali di lancio per una torrefazione |
| 02 / Web | Interfacce originali desktop e mobile si compongono su livelli differenti, mantenendo lo stesso linguaggio | AVANT: sito responsive e schede progetto per uno studio di architettura |
| 03 / Motion & 3D | Flacone ORA modellato con corpo, contenuto ambrato, etichetta, collare e tappo separato; camera e luce valorizzano il prodotto | ORA: concept, storyboard, animazione e formati di lancio per una fragranza |
| 04 / Campagne | Un manifesto tipografico e tre nastri geometrici condividono una coreografia continua | SPAZIO: identità animata, teaser e campagna d'iscrizione per una rassegna di un'APS |

Sono **scenari dimostrativi originali**, non clienti, incarichi ricevuti o risultati commerciali. Ogni dialog presenta scenario, obiettivo e deliverable. Il modello ORA è una geometria originale, non una ricostruzione CAD fedele di un prodotto reale. Il contenuto ambrato e i nastri sono mesh animate, non simulazioni di fluidi o tessuti.

Le quattro immagini generate con image_gen nella versione precedente rimangono nei concept e nei ripieghi HTML. L'architettura è anche una texture delle interfacce web. Il caffè, l'edificio e la seta raffigurati nelle immagini restano raster; i modelli della nuova scena sono costruiti separatamente nel codice. Non vengono distribuiti film Blender, video 4K a 60 fps o asset Horizon.

## Idee, progetti e contatti

I **cinque box «Descrivi la tua idea»**, uno per servizio più Progetti & bandi, usano un form GET nativo verso WhatsApp e funzionano anche senza JavaScript. Il miglioramento JavaScript aggiunge contesto del servizio, conteggio e validazione. Il visitatore rilegge la bozza e decide se inviarla; il sito non invia messaggi automaticamente e non archivia le idee in un backend.

**Progetti & bandi** comprende analisi dei bisogni, obiettivi, attività, calendario, partner, budget, ricerca delle opportunità e dossier di candidatura per aziende, APS e ASD. Gli ambiti sono europei, nazionali, regionali, provinciali, privati, fondazioni e istituti bancari. Digitalizzazione, cultura e sport sono esempi generali: non annunci di bandi aperti o garanzie di finanziamento. Ogni percorso parte dalla verifica del bando e dei requisiti.

**Space Media Studio — Stradello Conrad Marca Relli 1, Parma. +39 347 962 3498.** Il footer riporta fondatori, sede, chiamata, WhatsApp e mappa. Non sono presenti analytics o cookie di profilazione.

## Architettura e movimento

- `index.html`: quattro capitoli semantici, immagini di ripiego, dialog dei progetti, cinque form, progetti e contatti.
- `src/launch-room.css`: composizione responsive, tipografia, navigazione, menu, dialog e brief dei concept.
- `src/scene-objects.js`: modelli originali, materiali e coreografie locali dei quattro allestimenti.
- `src/launch-room.js`: scena Three.js, camera fra stazioni, ambiente, luci, caricamento e risorse GPU.
- `src/main.js`: importazione della scena, navigazione, pausa, menu, dialog, focus e lifecycle.
- `src/idea-briefs.js`: miglioramento dei form WhatsApp, mantenendo l'invio nativo.

Lo scroll nativo determina il viaggio fra quattro stazioni; le animazioni locali mantengono vivo il capitolo fermo. Le pose sono calcolate da tempo e stato, senza sommare trasformazioni a ogni evento. Un puntatore fine introduce un movimento contenuto. Titoli, offerta e azioni restano leggibili in HTML durante il percorso; non vengono nascosti per far posto alla camera.

La scena viene importata dinamicamente quando le preferenze permettono il movimento. Movimento ridotto e SaveData mantengono le immagini HTML. Il comando pausa e l'apertura di un box idea tornano alla presentazione statica; menu, dialog e documento nascosto sospendono il rendering. Uscire dai quattro capitoli ferma la scena. Nessuna intercettazione di wheel o swipe impone un numero di gesti. Nel layout stretto il controller misura lo slot HTML riservato al modello; il canvas non contiene testi, navigazione o moduli.

## Stato delle verifiche

La build di produzione e `npm test` passano: 19 gruppi coprono controller HTML e brief, 12 gruppi coprono il controller 3D con geometrie Three reali e renderer/DOM simulati. I controlli degli oggetti verificano vertici finiti, ripetibilità delle pose e proiezioni numeriche a 1200×728 e 390×844. Altri 256 campioni verificano il ritaglio durante lo scroll a 320×667, 390×844, 844×390 e 900×800. I tre controlli riproducibili sono in `scripts/check-cinematic-*.mjs`. La build della sola pagina principale, prima dell’aggiunta della pagina Atelier, occupava 1.901.750 byte; il 3D richiede inizialmente soltanto il JPEG architettura da 383.589 byte, mentre gli altri concept rimangono nei ripieghi e nei dialog.

Quattro studi locali in Blender 5.2.1 verificano silhouette e materiali dei modelli esportati dal codice. Sono diagnostica in un renderer diverso, con font sostitutivo: non schermate del sito né una prova della resa WebGL. Il browser locale rimane disabilitato nelle impostazioni Work; la verifica visiva della pagina corrente non è stata eseguita. I risultati e i tempi della precedente scena a pannelli non attestano la nuova versione.

Densità del rendering e cadenze del controller sono scelte di implementazione, non certificazioni di frame rate, risoluzione 4K o prestazioni su iPhone fisico. Il manifest distingue stato dei controlli e misure effettive.

## Provenienza e licenze

Le quattro immagini pubbliche sono **1672×941 pixel nativi**, senza upscaling, e totalizzano **1.145.984 byte**. Non sono state generate nuove immagini per questa revisione. Master e prove rimangono in `outputs/launch-room/`, esclusa dal repository e dalla build. Hash, dimensioni, provenienza e ambito dei materiali correnti sono in [ASSET-LAUNCH-ROOM.json](./ASSET-LAUNCH-ROOM.json); fonti e licenze sono in [ASSET-SOURCES.md](./ASSET-SOURCES.md).

`studio-siti-space`, Studio frontend, UI animation e Siti 3D guidano la riprogettazione. La precedente prova locale Video Non Higgsfield con ComfyUI/LTX si è fermata prima di produrre fotogrammi e non fornisce media al sito. Horizon CoverFlow non è acquisito né integrato.

Le vecchie scene e i film rimangono archivio storico, fuori dai media pubblici. Three.js conserva la licenza MIT e i font locali Space Grotesk e DM Mono conservano la SIL Open Font License. La pubblicazione dei sorgenti non concede una licenza generale di riutilizzo delle composizioni originali.
