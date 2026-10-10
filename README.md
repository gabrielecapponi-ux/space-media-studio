# Space Media Studio

Sito dello studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. Branding, siti web, contenuti e campagne vengono presentati attraverso una sequenza visiva continua: una goccia crea un’onda; un’identità diventa un sito FORMA e poi una campagna REVERIE.

Il film d’acqua è una ripresa stock in slow motion, acquisita da un master **4K** con licenza Pexels. La successiva trasformazione di pannello, schermo e dispositivi è una scena **WebGL originale** costruita nel progetto. Le due tecniche hanno provenienze distinte e dichiarate. Il linguaggio visivo usa bianco caldo, nero e giallo acido, con **Space Grotesk** e dettagli **DM Mono** serviti localmente.

[Apri il sito](https://gabrielecapponi-ux.github.io/space-media-studio/)

## Sviluppo

Richiede Node.js 22.12+ o una versione supportata da Vite 8.

```sh
npm ci
npm run dev
```

Anteprima locale su `http://127.0.0.1:5174`.

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
| `src/main.js` | Navigazione, dialog nativi dei concept, servizi e ciclo di vita della pagina |
| `src/motion.js` | Playback del film, pausa/ripresa, replay, progressione dello scroll e cambio dei capitoli |
| `src/showcase.js` | Unica scena Three.js: identità → sito FORMA → dispositivi e campagna REVERIE |
| `src/editorial.css` | Palette, tipografia, layout responsive, stati di ripiego e transizioni |
| `public/` | Esportazioni video, immagini, poster, font locali e licenze |

La scena 3D evolve lungo una progressione assoluta da 0 a 1, smorzata durante lo scroll. Scorrendo indietro si ritrovano le stesse pose; le trasformazioni non si accumulano e gli oggetti non ruotano a riposo. Il pannello iniziale si espande nella presenza web FORMA, quindi viene affiancato da telefono e creatività social REVERIE. Le immagini dei dispositivi sono composizioni Canvas 2D applicate a geometrie originali, con dettagli metallici, vetro, illuminazione da studio e ombre.

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

Il browser carica un solo formato del film quando entra in vista. Movimento ridotto e risparmio dati evitano il download automatico iniziale; un problema di autoplay o di caricamento mantiene una presentazione statica e consente di riprovare. Playback e aggiornamenti si fermano fuori schermo o quando la pagina è nascosta.

Il modulo 3D viene importato avvicinandosi alla sezione e il renderer viene creato quando la scena entra in vista. Un unico canvas serve tutti i capitoli. Il disegno avviene su richiesta e termina dopo l’assestamento dello scroll; il DPR è limitato a 1.35 sui formati compatti/touch e a 1.6 sugli altri, con ombre da 512 o 1024 pixel. Se WebGL non è disponibile o il contesto viene perso, rimangono mockup HTML/CSS corrispondenti al capitolo selezionato. Immagini dei concept differite, font locali e video silenziosi riducono le richieste esterne.

## Progetti possibili e diritti

Aura, FORMA e REVERIE sono **concept dimostrativi**, esplicitamente etichettati come progetti possibili. Presentano direzioni che lo studio potrebbe sviluppare: non sono clienti, lavori commissionati o risultati ottenuti. Le fotografie stock mantengono autore e licenza; lo studio firma testi, composizioni, mockup e geometrie originali. I nomi non implicano un rapporto commerciale con marchi esistenti.

I crediti completi sono in [ASSET-SOURCES.md](./ASSET-SOURCES.md). Le precedenti scene e la pipeline CGI `spark`, conservate nella cronologia del progetto, non fanno parte del percorso attuale.

Il sito non include form, analytics o cookie di profilazione. Telefono, WhatsApp e mappa si aprono su richiesta dell’utente.

Space Media Studio — Stradello Conrad Marca Relli 1, Parma, Italia. Telefono: **+39 347 962 3498**.

Codice, identità visiva e composizioni originali: tutti i diritti riservati. La pubblicazione dei sorgenti non concede una licenza di riutilizzo. Le risorse di terze parti conservano le rispettive licenze, indicate nella documentazione e nei file allegati.
