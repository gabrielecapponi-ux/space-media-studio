# Space Media Studio

Sito dello studio creativo di Gabriele Capponi e Mattia Tanzi, Parma. Strategia, design e comunicazione in un’esperienza con film CGI originale generato con Higgsfield e sculture 3D interattive. L’apertura passa da un giroscopio cromato al segno dello studio; il percorso e le sculture delle sezioni accompagnano la navigazione.

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

Il ramo `main` contiene i sorgenti. GitHub Pages pubblica il ramo `gh-pages`, composto esclusivamente dalla build di produzione.

```sh
npm run deploy
```

Il comando richiede accesso Git al repository, costruisce il sito e aggiorna il ramo di pubblicazione da una cartella temporanea, mantenendo la cronologia e il checkout dei sorgenti. La configurazione Vite usa percorsi relativi per funzionare anche nel sottopercorso GitHub Pages.

## Struttura

- `index.html`: contenuti, metadati, contatti e dati strutturati.
- `src/scene.js`: trasformazione della hero, materiali fisici, illuminazione e controlli delle pose.
- `src/world.js`: percorso 3D con lampadina, diaframma fotografico e bersaglio.
- `src/continuum.js`: unico canvas condiviso dalle sculture di portfolio, servizi, studio e contatti.
- `src/films.js`: caricamento differito, playback, pausa e preferenze dei filmati.
- `src/main.js`, `src/hero-ui.js`, `src/experience.js`: navigazione, dialog dei concept, controlli e stato delle animazioni.
- `src/*.css`: identità visiva, layout responsive e movimento dell’interfaccia.
- `public/`: filmati H.264, immagini, poster, font locali e licenze.
- `ASSET-SOURCES.md`: provenienza, autori e licenze delle risorse.

## Accessibilità e prestazioni

Contenuti disponibili anche senza JavaScript, navigazione da tastiera, dialog nativi con gestione del focus, controlli pausa e preferenza di movimento ridotto aggiornata in tempo reale. Se WebGL non è disponibile, resta visibile un poster vettoriale.

La trasformazione iniziale viene eseguita una volta. Su schermi compatti il percorso 3D viene inizializzato solo quando entra in vista, per alleggerire l’apertura. Il rendering si sospende fuori schermo e quando la pagina non è visibile. Su touch e formati compatti il rendering è limitato a 30 fps e DPR 1,5, con ombre da 512 pixel. Il percorso si assesta dopo scroll o interazione e interrompe il loop a riposo; geometrie instanziate nel percorso 3D, font locali e immagini differite riducono le richieste.

Il film iniziale dura circa 8 secondi. La versione espositiva torna lungo la stessa traiettoria per un loop continuo di circa 16 secondi. Il browser carica solo il formato desktop o mobile necessario, quando entra in vista; tutti i filmati sono silenziosi, `playsinline`, H.264/yuv420p e ottimizzati per l’avvio progressivo. Movimento ridotto e risparmio dati evitano il caricamento automatico. Il canvas delle sezioni viene inizializzato solo al primo spazio visibile, usa DPR massimo 1,15 su mobile e si ferma dopo l’assestamento.

Per rigenerare le versioni web dal master originale, con FFmpeg installato:

```sh
node scripts/prepare-films.mjs /percorso/al/master.mp4
```

Il sito non include form, analytics o cookie di profilazione. Telefono, WhatsApp e mappa si aprono su richiesta dell’utente. I concept sono etichettati come **progetti possibili**, con immagini stock su licenza: non rappresentano lavori commissionati.

## Contatti e diritti

Space Media Studio — Stradello Conrad Marca Relli 1, Parma, Italia. Telefono: +39 347 962 3498.

Codice, identità visiva e composizioni originali: tutti i diritti riservati. La pubblicazione dei sorgenti non concede una licenza di riutilizzo. Le risorse di terze parti conservano le rispettive licenze, indicate in `ASSET-SOURCES.md` e nei file allegati.
