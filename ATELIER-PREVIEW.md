# Atelier — dalla direzione approvata alla homepage

La direzione inizialmente pubblicata in `atelier.html` è ora la base della homepage canonica **`index.html`**. `atelier.html` resta un alias storico dello stesso percorso, con `noindex, nofollow`. Il vecchio sito Launch Room a quattro modelli non descrive più l’esperienza principale.

## Elementi conservati e ampliamento

Caricamento dello studio, assemblaggio, zoom nel monitor e hero con acqua sono conservati. Seguono quattro concept, ora sviluppati con immagini d’insieme e dettagli, tre viste HTML AVANT e un film tipografico originale SPAZIO. Servizi, progetti e bandi, cinque form idea e contatti completano il percorso.

L’ingresso prepara font, poster, primo frame e scena, non tutti i byte dell’intero sito. «Entra subito», Escape e un limite di dodici secondi visibili mantengono accessibile la pagina. Movimento ridotto e SaveData conservano la presentazione statica; nessun film viene riprodotto dietro l’introduzione. La stanza è immaginaria, non una ricostruzione documentaria della sede.

Il film d’acqua di Film Composite/Pexels rimane fotografia stock, non produzione Space o CGI. I sette visual dei concept sono immagini AI; la sequenza tipografica è invece un film Blender originale. I nomi rappresentano progetti possibili, senza clienti o incarichi attribuiti. Il diagramma di dodici mesi per i bandi è illustrativo, senza importi o finanziamenti attribuiti.

## Sorgenti e media

- `src/atelier-entry.js`, `src/studio-room.js`, `src/entry-shell.js`, `src/entry.css`: introduzione approvata.
- `src/atelier.js`, `src/atelier.css`: apertura e base editoriale.
- `src/atelier-cinema.js`, `src/atelier-cinema.css`: movimento successivo, scene, formati e playback differito.
- `ASSET-ATELIER.json`: film d’acqua e poster.
- `ASSET-LAUNCH-ROOM.json`: quattro immagini concept originali, con ambito storico delle vecchie scene.
- `ASSET-ATELIER-VISUALS.json`: tre dettagli AI aggiunti agli stessi concept.
- `ASSET-ATELIER-MOTION.json`: sequenza tipografica Blender, export web e verifiche.

Master AI, `.blend` e sequenze numerate sono locali in `outputs/nov26/` e non distribuiti dal sito. Foto, film offline e geometria live non vengono presentati come equivalenti.

## Verifiche

Build di produzione e `npm test` superati: 23 contratti correnti, undici per l’ingresso e dodici per il cinema. Verifica reale in Chrome headless isolato con Playwright CLI 0.1.23: desktop 1280×720 e formati emulati 393×852, 320×667 e 844×390, senza overflow laterale. Provati ingresso e ritorno dei controlli, film desktop/verticale, pausa mantenuta dopo lo scroll, riproduzione manuale, menu, apertura e validazione dei brief. Nessun invio esterno effettuato e nessun errore JavaScript osservato nei due flussi completi.

Con movimento ridotto, una nuova navigazione mantiene entrambe le sorgenti video non assegnate; la riproduzione manuale resta disponibile. Poster, ritaglio e impaginazione sono stati controllati nelle schermate catturate. Si tratta di emulazione Chromium, non di una prova su iPhone fisico o di una certificazione GPU/FPS. I 31 controlli del percorso precedente rimangono separati in `npm run test:legacy`.

La pubblicazione usa il deploy selettivo già presente, preservando le radici degli altri siti.
