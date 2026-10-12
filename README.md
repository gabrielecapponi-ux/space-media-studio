# Space Media Studio

Studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. Il sito presenta l'offerta in **quattro capitoli**: identità di marca, siti web ed e-commerce, film 3D di prodotto, contenuti e campagne. Ogni capitolo presenta una composizione distinta con tipografia di grande scala, film originale Blender, offerta esplicita, concept esplorabile e breve modulo per descrivere la propria idea. L'apertura introduce una nuova scultura Space che si scompone e ricompone; il concept branding conserva carta e packaging coordinati. Una sezione complementare presenta il supporto a progetti e bandi per aziende, APS e ASD.

[Apri il sito](https://gabrielecapponi-ux.github.io/space-media-studio/)

## Sviluppo e pubblicazione

Node.js compatibile con Vite 8. Nessun framework UI o servizio remoto richiesto.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm run deploy
```

Vite serve lo sviluppo su `http://127.0.0.1:5174` e l'anteprima su `http://127.0.0.1:5175`. La build statica è in `dist/`. `main` contiene i sorgenti; GitHub Pages pubblica `gh-pages`. Lo script di deploy ricostruisce il bundle e aggiorna il ramo di pubblicazione da una cartella temporanea, mantenendo la cronologia. I percorsi relativi funzionano anche nel sottopercorso GitHub Pages.

Il ramo di pubblicazione può ospitare altri siti: il deploy sostituisce soltanto i percorsi di produzione Space Media elencati in `scripts/deploy-pages.mjs`, preservando cartelle estranee e `CNAME`. Un nuovo percorso alla radice della build deve essere aggiunto esplicitamente all'elenco prima della pubblicazione.

## Quattro servizi, quattro composizioni

| Capitolo | Cosa mostra | Cosa offre |
| --- | --- | --- |
| 01 / Identità | Scultura Space a otto moduli in apertura; libro, carte e packaging nel concept | Strategia, naming, logo, identità visiva, packaging |
| 02 / Web | Laptop in alluminio con un'interfaccia originale | Siti essenziali, landing page, e-commerce, web 3D |
| 03 / CGI | Vetro, fragranza, metallo e illuminazione di prodotto | Render, film 3D, visual per shop e lancio |
| 04 / Campagne | Cuffie e composizione pubblicitaria | Video, reel, creatività, campagne Meta e Google |

Sono **concept originali dimostrativi**, non clienti, incarichi ricevuti o risultati commerciali. La galleria di dodici concept e i precedenti controller WebGL non fanno parte della versione corrente. La nuova scultura di apertura è un oggetto originale Blender legato al segno Space.

I quattro film di servizio già disponibili sono renderizzati nativamente a **3840×2160, 60 fps**, con pose distinte e movimento periodico; non derivano da upscaling o interpolazione di filmati a frequenza inferiore. Il desktop carica la versione **4K a 60 fps**; il comando 4K consente di passare a Full HD. Su schermi fino a 1024 px, inclusi telefoni in orizzontale, viene usato un export **Full HD 1920×1080 a 60 fps**, con compressione dedicata e senza ritagliare i soggetti. Una connessione 2G/3G avvia il desktop in Full HD; un errore del file 4K attiva automaticamente il ripiego Full HD. I master di lavorazione e le scene `.blend` restano in `outputs/four-services/`, esclusa da Git e dal sito. Engine, campioni, hash e verifiche degli export sono riportati in [ASSET-FOUR-SERVICES.json](./ASSET-FOUR-SERVICES.json).

La nuova apertura presenta una scultura Space di **otto moduli voluminosi**, con lacca scura, ceramica gialla e metallo, che si separano e tornano a comporre il segno. Il render nativo è **3840×2160, 60 fps, 240 fotogrammi distinti, quattro secondi**, con derivati web 4K e Full HD senza interpolazione. Il file 4K pesa 1,02 MB; Full HD desktop 379 KB e mobile 260 KB. Decodifica completa, faststart, continuità del montaggio, dimensioni, frequenza e hash sono verificati in [ASSET-SPATIAL-SCULPTURE.json](./ASSET-SPATIAL-SCULPTURE.json).

Pipeline della nuova apertura: Blender locale → due segmenti cronologici consecutivi, fotogrammi 1–120 e 121–240 → montaggio locale ComfyUI con `LoadVideo`, `ConcatenateVideo` e `SaveVideo` → FFmpeg per gli export web. `video-non-higgsfield` viene applicata a questo montaggio locale: non si tratta di nuova generazione video AI, non si scaricano nuovi modelli e non si usano Higgsfield, servizi a pagamento o riprese stock. I nomi e le interfacce nei render hanno scopo illustrativo.

## Concept, idee e progetti

**Esplora il concept** apre un dialog con uno dei quattro film Blender di servizio già disponibili, il racconto del progetto possibile e le relative attività. Gli override `data-concept-*` permettono all'apertura branding di usare la nuova scultura e al relativo dialog di conservare il film originale di carta e packaging, con i suoi poster e formati. Riproduzione, pausa, selezione del concept successivo e cursore di avanzamento controllano il film. Il cursore esplora la sequenza guidata di **due secondi**: non è una rotazione libera a 360° né un modello 3D interattivo. Il dialog riusa gli export 4K a 60 fps e Full HD già documentati, con poster di ripiego; il film della pagina viene sospeso durante l'esplorazione.

Il concept web include tre anteprime SVG originali: **Seta** (e-commerce skincare), **Forma** (sito essenziale per uno studio di design) e **Nova** (landing di prodotto). Riutilizzano i poster originali del progetto; sono esempi visivi, non tre siti completi già pubblicati. File: `public/previews/seta-web.svg`, `public/previews/forma-web.svg` e `public/previews/nova-web.svg`.

I **cinque moduli** si trovano nei quattro capitoli e in **Progetti & bandi**. Usano un invio nativo GET verso WhatsApp e funzionano anche senza JavaScript. Il miglioramento JavaScript aggiunge il servizio alla bozza; il visitatore rilegge il testo e decide se inviarlo. Il sito non invia messaggi automaticamente, non salva le idee e non usa un backend per raccoglierle.

**Progetti & bandi** illustra definizione degli obiettivi, attività, partner, budget, ricerca delle opportunità e preparazione del dossier per aziende, APS e ASD. Digitalizzazione d'impresa, festival culturale e sport inclusivo sono esempi generali di progetto: non annunci di bandi aperti, valutazioni di ammissibilità o garanzie di finanziamento. Ogni percorso richiede la verifica del bando e dei requisiti.

## Architettura e accessibilità

- `index.html`: quattro capitoli semantici, poster, dialog dei concept, cinque moduli, progetti e contatti; servizi e moduli disponibili anche senza JavaScript.
- `src/four-scroll.css`, `src/project-examples.css`, `src/spatial-studio.css`: Space Grotesk e DM Mono locali, bianco/nero/lime, quattro composizioni editoriali diverse, concept e moduli.
- `src/spatial-motion.js`: movimento discreto dei quattro palcoscenici in risposta a scroll e puntatore fine, arresto dopo assestamento, progressione del percorso e gestione delle preferenze.
- `src/main.js`: loader breve, menu nativo, focus e coordinamento dei componenti.
- `src/four-films.js`: qualità e formato responsive, un solo film attivo, pausa, ripiego statico e caricamento progressivo.
- `src/concept-showcase.js`: dialog dei quattro concept, riproduzione e avanzamento guidato dei film, ripristino del focus e lifecycle.
- `src/idea-briefs.js`: validazione e composizione della bozza WhatsApp, mantenendo l'invio nativo del form.
- `scripts/render-four-services.py`, `scripts/export-four-services.py`: produzione originale e verifica dei quattro film di servizio.
- `scripts/render-spatial-sculpture.py`: scena originale a otto moduli; lavorazione e montaggio locale in `outputs/spatial-rebuild/`, esclusa dalla distribuzione dei sorgenti di lavoro.

Lo scorrimento è nativo: nessun blocco di wheel o swipe. Ogni capitolo occupa almeno un viewport, crescendo se il testo richiede più spazio. «Quattro scroll» descrive i quattro passaggi dell'offerta, senza imporre quattro gesti o schermate esatte su ogni dispositivo. La navigazione indica il servizio attivo e raggiunge direttamente i quattro capitoli. Il footer contiene fondatori, indirizzo, telefono e WhatsApp.

Una navigazione numerata 01–04 e una linea di avanzamento collegano i capitoli. Il movimento del filmstage combina una lieve traslazione verticale, entro 28 px complessivi, e una scala tra 1 e 1,045. Solo un mouse con puntatore fine e hover aggiunge inclinazioni fino a 2° e spostamenti fino a 7 px. Il ciclo `requestAnimationFrame` termina dopo l’assestamento: non esiste un loop decorativo permanente. Pausa, blocco del loader, menu, concept e documento nascosto interrompono il movimento; movimento ridotto e SaveData ripristinano la composizione statica. Lo scroll e gli input touch restano nativi.

Header, menu e collegamenti inferiori riservano gli inset di sicurezza di iPhone, per evitare sovrapposizioni con notch e indicatore Home.

Il caricamento prepara solo font, primo poster e prima versione web del film; **Entra subito**, Escape e una scadenza di cinque secondi consentono sempre l'accesso. Il contenuto sottostante è `inert` durante il caricamento. Non vengono scaricati automaticamente tutti i film 4K.

Solo il film visibile è in riproduzione. Pausa, menu o concept aperto e documento nascosto sospendono i film della pagina. Movimento ridotto e risparmio dati escludono la riproduzione automatica; il risparmio dati consente di avviare un film esplicitamente. Nel dialog, anche con movimento ridotto, il visitatore può scegliere di riprodurre il film e, dopo averlo caricato esplicitamente, esplorarne i fotogrammi con il cursore. L'autoplay negato e gli errori mantengono un comando di riproduzione/riprova. Il ripiego automatico da 4K a Full HD consente il recupero da un formato non supportato; se fallisce anche Full HD resta il poster con un comando di riprova.

La frequenza dei file è 60 fps; la frequenza effettiva di riproduzione dipende da dispositivo, decoder e rete. Le verifiche responsive nel browser non certificano prestazioni o consumi su un iPhone fisico.

## Skill e risorse esterne

`studio-siti-space`, le skill Studio di interfaccia e animazione, `siti-3d`, Blender e `video-non-higgsfield` guidano la nuova direzione. La skill denominata “City 3D Wow” non è presente nel catalogo disponibile: per questo ambito si applica `siti-3d`, senza attribuirle un nome diverso.

**Horizon CoverFlow è selezionato ma non acquisito né integrato:** l’accesso autenticato è ancora pendente. Ricerca, scelta della risorsa e integrazione sono stati distinti; le anteprime attuali e il relativo codice sono originali Space. Nessun sorgente Horizon viene pubblicato nel repository.

## Contatti e diritti

**Space Media Studio — Stradello Conrad Marca Relli 1, Parma. +39 347 962 3498.**

Il sito non include analytics o cookie di profilazione. Chiamata, WhatsApp e mappa si aprono su richiesta; i moduli preparano soltanto una bozza WhatsApp. Fonti e licenze sono documentate in [ASSET-SOURCES.md](./ASSET-SOURCES.md). Le iterazioni precedenti sono conservate nella cronologia Git e nei manifest storici; i relativi media non vengono distribuiti nella build corrente.

Codice, identità e composizioni originali: tutti i diritti riservati. La pubblicazione dei sorgenti non concede una licenza generale di riutilizzo. I font e le risorse di terze parti mantengono le rispettive licenze.
