# Space Media Studio

Sito dello studio creativo di Gabriele Capponi e Mattia Tanzi, Parma. Strategia, design e comunicazione in un’esperienza originale con sculture 3D interattive, colori accesi e una trasformazione iniziale da totem a composizione aperta a nodo intrecciato.

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
- `src/world.js`: percorso 3D con capsule, architetture surreali e loop.
- `src/main.js`, `src/hero-ui.js`, `src/experience.js`: navigazione, dialog dei concept, controlli e stato delle animazioni.
- `src/*.css`: identità visiva, layout responsive e movimento dell’interfaccia.
- `public/`: immagini, poster vettoriale, font locali e licenze.
- `ASSET-SOURCES.md`: provenienza, autori e licenze delle risorse.

## Accessibilità e prestazioni

Contenuti disponibili anche senza JavaScript, navigazione da tastiera, dialog nativi con gestione del focus, controlli pausa e preferenza di movimento ridotto aggiornata in tempo reale. Se WebGL non è disponibile, resta visibile un poster vettoriale.

La trasformazione iniziale viene eseguita una volta. Il rendering si sospende fuori schermo e quando la pagina non è visibile. Risoluzione e ombre sono limitate per contenere il carico grafico; geometrie instanziate nel percorso 3D, font locali e immagini differite riducono le richieste.

Il sito non include form, analytics o cookie di profilazione. Telefono, WhatsApp e mappa si aprono su richiesta dell’utente. I concept sono etichettati come **progetti possibili**, con immagini stock su licenza: non rappresentano lavori commissionati.

## Contatti e diritti

Space Media Studio — Stradello Conrad Marca Relli 1, Parma, Italia. Telefono: +39 347 962 3498.

Codice, identità visiva e composizioni originali: tutti i diritti riservati. La pubblicazione dei sorgenti non concede una licenza di riutilizzo. Le risorse di terze parti conservano le rispettive licenze, indicate in `ASSET-SOURCES.md` e nei file allegati.
