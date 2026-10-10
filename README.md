# Space Media Studio

Sito dello studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. Un’introduzione originale costruisce uno studio futuristico durante il caricamento, poi entra nello schermo di un computer per aprire il sito. Branding, siti web, contenuti e campagne vengono presentati attraverso una sequenza visiva continua: una goccia crea un’onda; un’identità diventa un sito FORMA e poi una campagna REVERIE.

Il film d’acqua è una ripresa stock in slow motion, acquisita da un master **4K** con licenza Pexels. La successiva trasformazione di pannello, schermo e dispositivi è una scena **WebGL originale** costruita nel progetto. Le due tecniche hanno provenienze distinte e dichiarate. Il linguaggio visivo usa bianco caldo, nero e giallo acido, con **Space Grotesk** e dettagli **DM Mono** serviti localmente.

[Apri il sito](https://gabrielecapponi-ux.github.io/space-media-studio/)

## Sviluppo

Richiede Node.js 22.12+ o una versione supportata da Vite 8.

```sh
npm ci
npm run dev
```

Anteprima locale su `http://127.0.0.1:5174`.

Aprire il sorgente `index.html` con `file://` reindirizza alla versione pubblicata: per lavorare in locale usare il server Vite, che risolve moduli e risorse.

```sh
npm run build
npm run preview
```

La build statica è in `dist/`; l’anteprima della build è su `http://127.0.0.1:5175`.

## Pubblicazione

Il ramo `main` contiene i sorgenti. GitHub Pages pubblica il ramo `gh-pages`, composto dalla build di produzione.

```sh
npm run deploy
```

Il comando richiede accesso Git al repository, costruisce il sito e aggiorna il ramo di pubblicazione da una cartella temporanea, mantenendo la cronologia e il checkout dei sorgenti. La configurazione Vite usa percorsi relativi per funzionare nel sottopercorso GitHub Pages.

## Architettura corrente

| File | Responsabilità |
| --- | --- |
| `index.html` | Contenuti, tre capitoli, controlli, contatti e dati strutturati |
| `src/main.js` | Avvio dell’introduzione, navigazione, dialog nativi dei concept, servizi e ciclo di vita della pagina |
| `src/entry.js` | Preparazione delle risorse, avanzamento reale ponderato, accessibilità dell’overlay, raccordo e uscita |
| `src/entry-shell.js` e `src/entry.css` | Overlay del caricamento, contatore, controlli e illustrazione architettonica di ripiego |
| `src/studio-room.js` | Stanza Three.js originale: assemblaggio dello studio e ingresso nello schermo |
| `src/motion.js` | Preparazione del film e della scena, blocco durante l’intro, playback, replay e progressione dello scroll |
| `src/showcase.js` | Scena Three.js dei servizi: identità → sito FORMA → dispositivi e campagna REVERIE |
| `src/editorial.css` | Palette, tipografia, layout responsive, stati di ripiego e transizioni |
| `public/` | Esportazioni video, immagini, poster, font locali e licenze |

La scena 3D dei servizi evolve lungo una progressione assoluta da 0 a 1, smorzata durante lo scroll. Scorrendo indietro si ritrovano le stesse pose; le trasformazioni non si accumulano e gli oggetti non ruotano a riposo. Il pannello iniziale si espande nella presenza web FORMA, quindi viene affiancato da telefono e creatività social REVERIE. Le immagini dei dispositivi sono composizioni Canvas 2D applicate a geometrie originali, con dettagli metallici, vetro, illuminazione da studio e ombre.

## Introduzione e caricamento

L’introduzione assembla pareti, postazioni, computer, superfici colorate e il logo SPACE giallo. La stanza è un’**illustrazione 3D originale di uno studio immaginario**: non rappresenta una fotografia o un rilievo della sede di Parma. Geometrie, materiali, illuminazione e percorso della camera sono creati nel progetto, senza modelli o filmati scaricati per questa scena.

Il contatore segue il completamento ponderato di font locali, immagini, modulo della stanza, film responsive e preparazione GPU della scena dei servizi. Per il video, quando il server comunica la dimensione, viene misurato anche l’avanzamento del trasferimento. La visualizzazione del numero viene smorzata per rendere leggibile l’assemblaggio e **non supera l’avanzamento effettivo**, fino al 99%. Con le risorse elaborate, lo studio completo resta brevemente visibile al 99%; il 100% avvia il movimento della camera dentro il monitor e il raccordo al documento HTML.

L’assemblaggio ha un ritmo più breve alle aperture successive nella stessa sessione. La scelta è salvata solo in `sessionStorage`; la preparazione effettiva delle risorse resta necessaria anche quando l’introduzione è abbreviata.

In condizioni normali il film selezionato viene scaricato interamente prima dell’apertura, decodificato fino al primo fotogramma e conservato come URL Blob per playback e replay. Il download viene effettuato una volta; il film non parte dietro l’introduzione. Il formato desktop è **Full HD 1920×1080**; il formato mobile è un ritaglio verticale **640×900**. La preparazione anticipata include la compilazione e un primo rendering della scena dei servizi, così il cambio verso la sezione non dipende soltanto da un’importazione tardiva.

**Entra subito** ed **Esc** interrompono l’attesa e rendono accessibile il sito. La preferenza di movimento ridotto usa branding e avanzamento statici, senza stanza animata o movimento della camera; movimento ridotto e risparmio dati escludono il video dal download automatico. Un errore di una risorsa attiva il relativo ripiego; un limite massimo di **20 secondi** fa uscire dall’introduzione anche se una richiesta non termina. Il 100% indica il completamento della preparazione prevista, non garantisce il download riuscito di una risorsa che ha prodotto un errore. All’uscita vengono liberate le risorse GPU della stanza; il Blob del film resta disponibile fino alla chiusura della pagina.

## Film d’acqua

Fonte: **Film Composite / Pexels 16392049**, master fotografico 3840×2160, 24 fps, 18.791667 secondi. Per il sito è stato estratto l’intervallo 1.0–12.5 secondi e applicato un trattamento monocromatico.

- Desktop: `public/films/water-desktop.mp4`, **1920×1080**.
- Mobile: `public/films/water-mobile.mp4`, **640×900**, ritaglio verticale indipendente dal master.
- Durata di entrambi: **11.5 secondi**, 276 fotogrammi a 24 fps, H.264/YUV420P, senza audio e con avvio progressivo MP4.
- `water-start-*` sono poster del primo fotogramma effettivo degli export, per il raccordo all’avvio. `water-desktop.jpg` e `water-mobile.jpg` mostrano il momento della colonna d’acqua per la presentazione statica.

Il film mantiene l’ordine fisico naturale: caduta, impatto, corona, colonna e onde. Viene riprodotto una volta e conserva il finale; il pulsante **Rivedi** riavvia la sequenza. Non è montato al contrario per creare un loop. Il master 4K non viene caricato dal browser e il film non viene presentato come simulazione 3D realizzata dallo studio.

Fonte, licenza, hash del master, esportazioni e comandi FFmpeg sono in [ASSET-WATER.md](./ASSET-WATER.md). I tempi indicativi dei passaggi sono disponibili anche in [ASSET-WATER.json](./ASSET-WATER.json). Il flusso locale di preparazione non utilizza Higgsfield, modelli AI, account o servizi a pagamento.

## Accessibilità e prestazioni

I testi e i contatti restano nel documento HTML. La navigazione funziona da tastiera; i concept usano dialog nativi e i capitoli inattivi diventano `inert`. I controlli permettono pausa e replay. La preferenza di movimento ridotto viene rispettata anche quando cambia durante la visita: il film si ferma e le tre competenze restano selezionabili come pose statiche.

Il browser prepara un solo formato del film durante l’introduzione. Movimento ridotto e risparmio dati evitano il download automatico iniziale; un problema di autoplay o di caricamento mantiene una presentazione statica e consente di riprovare. Dopo l’apertura, playback e aggiornamenti si fermano fuori schermo o quando la pagina è nascosta. Durante l’introduzione lo sfondo è `inert`, il focus resta nei controlli del caricamento e viene ripristinato all’uscita.

Il modulo 3D dei servizi viene importato e preparato durante l’introduzione. Un unico canvas serve tutti i capitoli della sezione; la stanza iniziale usa un canvas separato, rimosso al termine dell’apertura. Il disegno dei servizi avviene su richiesta e termina dopo l’assestamento dello scroll; il DPR è limitato a 1.35 sui formati compatti/touch e a 1.6 sugli altri. I dispositivi usano un’ombra morbida precalcolata, senza passaggi aggiuntivi per mappe o blur. La stanza mantiene ombre architettoniche da 512/1024 pixel e riusa la mappa durante il movimento finale della sola camera. Geometrie condivise e dettagli proporzionati alla dimensione visibile riducono il carico 3D. Se WebGL non è disponibile o il contesto viene perso, rimangono l’illustrazione CSS dello studio e i mockup HTML/CSS corrispondenti al capitolo selezionato. Immagini, font e video sono serviti localmente.

## Progetti possibili e diritti

Aura, FORMA e REVERIE sono **concept dimostrativi**, esplicitamente etichettati come progetti possibili. Presentano direzioni che lo studio potrebbe sviluppare: non sono clienti, lavori commissionati o risultati ottenuti. Le fotografie stock mantengono autore e licenza; lo studio firma testi, composizioni, mockup e geometrie originali. I nomi non implicano un rapporto commerciale con marchi esistenti.

I crediti completi sono in [ASSET-SOURCES.md](./ASSET-SOURCES.md). Le precedenti scene e la pipeline CGI `spark`, conservate nella cronologia del progetto, non fanno parte del percorso attuale.

I sorgenti delle iterazioni precedenti e i relativi script inutilizzati sono stati rimossi dal checkout corrente; restano recuperabili dalla cronologia Git. La build contiene solo il percorso attuale.

Il sito non include form, analytics o cookie di profilazione. Telefono, WhatsApp e mappa si aprono su richiesta dell’utente.

Space Media Studio — Stradello Conrad Marca Relli 1, Parma, Italia. Telefono: **+39 347 962 3498**.

Codice, identità visiva e composizioni originali: tutti i diritti riservati. La pubblicazione dei sorgenti non concede una licenza di riutilizzo. Le risorse di terze parti conservano le rispettive licenze, indicate nella documentazione e nei file allegati.
