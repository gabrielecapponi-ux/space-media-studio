# Dentro Space — anteprima editoriale

`atelier.html` è una pagina indipendente per valutare la direzione visiva. La pagina principale e i suoi quattro modelli rimangono separati: l’anteprima non li richiama. La pagina ha `noindex, nofollow` e non è collegata dalla navigazione principale.

## Esperienza

Il caricamento recupera lo studio originale, con pareti, arredi, postazioni e scritta Space in giallo. La camera entra nel monitor, la cui grafica usa il poster e la tipografia della nuova apertura. Geometrie e percorso della stanza sono conservati; il parametro opzionale `drawScreen` cambia soltanto la texture del display.

L’apertura presenta il film macro dell’acqua a pieno schermo e «Brand. Web. Motion.». Seguono quattro concept fotografici ampi: FORMA, AVANT, ORA e SPAZIO. Il concept web è una composizione HTML originale. Quattro righe di servizi precedono la sezione progetti e bandi per aziende, APS e ASD e i contatti. Cinque form nativi preparano bozze WhatsApp, senza inviarle automaticamente.

Le fotografie concept sono le immagini AI già documentate in `ASSET-LAUNCH-ROOM.json`; non sono commesse o clienti. Il film è stock di Film Composite/Pexels, non una produzione Space o una simulazione 3D. L’introduzione è invece una vera scena Three.js originale di uno studio immaginario.

## Media e comportamento

Gli export d’acqua storici sono riusati con nomi `atelier-water-*`. Sono H.264 senza audio, 11,5 secondi a 24 fps: 1920×1080 desktop, 640×900 sul formato verticale. I poster mostrano la colonna a 4,6 s. Il primo fotogramma automatico viene preparato allo stesso punto; la riproduzione prosegue in avanti e i successivi loop tornano all’inizio, senza inversione o interpolazione.

Il contatore misura la preparazione ponderata di font, poster, primo frame e stanza; non promette che ogni byte o tutti i concept della pagina siano già in memoria. «Entra subito», Escape e un limite di dodici secondi visibili rilasciano sempre la pagina. La riduzione del movimento e SaveData mantengono il poster e non caricano automaticamente video o stanza. Il film parte dopo la rimozione dell’ingresso e si ferma fuori dalla hero, a documento nascosto, con il menu aperto o su pausa esplicita. La sorgente viene scelta al primo caricamento; ruotare il dispositivo durante il playback non scarica una seconda variante.

Provenienza, licenza, hash e specifiche dei quattro file riusati sono in `ASSET-ATELIER.json`. I crediti sono anche nel footer.

## Controlli e limite di verifica

- `npm run build`: build con due pagine indipendenti.
- `npm run test:atelier`: undici contratti sul controller dell’introduzione, con DOM/video/renderer simulati.
- `npm test`: contratti della pagina principale e modelli precedenti, per verificare che l’anteprima non ne cambi il comportamento.
- Entrambe le pagine: ID attivi unici, ancore e risorse locali valide, cinque form GET verso il numero corretto. I due film sono stati decodificati integralmente e verificati con FFprobe.

Il browser locale è disabilitato nelle impostazioni Work: non viene dichiarato un collaudo visivo nel browser o su iPhone fisico. I controlli automatici non costituiscono approvazione della qualità estetica. L’anteprima serve alla valutazione visiva della direzione prima di sostituire il sito principale.

## Sorgenti

- `atelier.html`: contenuti e componenti HTML.
- `src/atelier.css`: composizione editoriale e responsive.
- `src/atelier.js`: playback, preferenze, navigazione e lifecycle.
- `src/atelier-entry.js`: preparazione e ingresso nello studio.
- `src/studio-room.js`, `src/entry-shell.js`, `src/entry.css`: stanza e presentazione originali.

Il deploy aggiunge soltanto la radice esplicita `atelier.html` e gli asset Space ai percorsi già dichiarati. Le radici di altri siti nel ramo di pubblicazione vengono preservate.
