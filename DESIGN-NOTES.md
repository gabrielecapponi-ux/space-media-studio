# Dentro Space — regia visiva

La direzione approvata mantiene **lo studio che si costruisce, lo zoom nel monitor e l’apertura «Brand. Web. Motion.» sull’acqua**. L’ampliamento riguarda il percorso successivo: quattro capitoli visivi, dettagli di materia, interfacce e un motion study tipografico. Bianco caldo, nero e giallo restano i colori dello studio; Space Grotesk e DM Mono sono locali.

## Quattro discipline, più profondità

- **FORMA / Brand identity:** immagine d’insieme e dettaglio di carta, stampa e packaging. Segno, materia e applicazioni spiegano il sistema di identità.
- **AVANT / Web:** apertura, pagina progetti e vista mobile compongono una direzione HTML coerente, senza hardware fittizio. Il movimento distingue piani e gerarchia delle interfacce.
- **ORA / Prodotto:** visual di lancio e macro di vetro e luce mostrano un’atmosfera coordinata. Sono still AI, non fotogrammi di un film del flacone.
- **SPAZIO / Campagne:** seta gialla, dettaglio e film tipografico 3D raccontano come un linguaggio possa attraversare manifesto, teaser e social.

Sono quattro lavori possibili originali, non clienti o incarichi. Non vengono aggiunti nuovi casi per aumentare il numero dei progetti: i materiali approfondiscono gli stessi quattro scenari.

Progetti e bandi mantiene una sezione chiara per aziende, APS e ASD. Il dossier visivo mostra una struttura di dodici mesi e categorie di risorse, esplicitamente illustrative. Nessun bando viene dichiarato aperto e nessun finanziamento viene garantito. Cinque box idea preparano bozze WhatsApp con invio deciso dal visitatore.

## Movimento e produzione

`src/atelier-cinema.js` possiede il movimento sotto la hero: osserva le scene, aggiorna la parallasse allo scroll nativo e prepara il video solo vicino alla sua posizione. Non impone scroll guidato. Testi, moduli, navigazione e azioni rimangono HTML; poster e contenuto statico restano disponibili quando il movimento non è consentito.

La riproduzione rispetta pausa esplicita, menu, documento nascosto, uscita dalla scena, riduzione del movimento e SaveData. La scelta del formato avviene al primo caricamento, evitando un secondo download durante la rotazione del dispositivo. Observer, listener, frame e playback vengono rilasciati nel lifecycle della pagina.

La stanza iniziale è una scena Three.js originale. Il film d’acqua è stock fotografico Pexels, dichiarato nel footer. I nuovi dettagli sono raster AI a risoluzione nativa; il motion study SPAZIO è prodotto in Blender con lettere, materiali, luci e camera reali. Sono artefatti diversi, documentati nei rispettivi manifest. I master Blender e i frame numerati rimangono locali. Non si dichiarano 4K o 60 fps.

## Sorgenti correnti

`index.html` è la homepage canonica; `atelier.html` è un alias storico con `noindex, nofollow`. `src/atelier.css` e il caricamento approvato rimangono la base; `src/atelier-cinema.css` e `.js` aggiungono la regia successiva. I vecchi quattro diorami di Launch Room non sono parte della homepage corrente.

## Verifica finale

Build di produzione e `npm test` superati: 23 contratti correnti, undici per l’ingresso e dodici per il cinema. Verifica reale in Chrome headless isolato con Playwright CLI 0.1.23: desktop 1280×720 e formati emulati 393×852, 320×667 e 844×390, senza overflow laterale. Provati ingresso e ritorno dei controlli, film desktop/verticale, pausa mantenuta dopo lo scroll, riproduzione manuale, menu, apertura e validazione dei brief. Nessun invio esterno effettuato e nessun errore JavaScript osservato nei due flussi completi.

Con movimento ridotto, una nuova navigazione mantiene entrambe le sorgenti video non assegnate; la riproduzione manuale resta disponibile. Poster, ritaglio e impaginazione sono stati controllati nelle schermate catturate. Si tratta di emulazione Chromium, non di una prova su iPhone fisico o di una certificazione GPU/FPS. I 31 controlli del percorso precedente rimangono separati in `npm run test:legacy`.

Il deploy aggiorna soltanto le radici Space dichiarate e preserva gli altri siti presenti nel ramo di pubblicazione.
