# Quattro servizi in quattro scroll — 12 ottobre 2026

La versione corrente concentra l'offerta in quattro capitoli: branding, web, film CGI e campagne. Il catalogo di dodici concept, la scultura astratta e il percorso AURA in tre tappe sono sostituiti da quattro scene di oggetti fisici, ciascuna legata a un servizio concreto.

## Direzione

Space Grotesk e DM Mono locali. Bianco caldo, nero e lime. Alternanza chiaro/scuro tra i capitoli; titolo grande, beneficio, tre attività e CTA a sinistra, film originale a destra. Su telefono il film segue il testo. L'offerta rimane comprensibile nei quattro capitoli, senza richiedere l'apertura dei concept. Il dialog aggiunge un approfondimento facoltativo; la sezione Progetti & bandi completa il percorso prima dei contatti.

1. Carta, libro e packaging: identità riconoscibile.
2. Laptop in alluminio e interfaccia elegante: siti ed e-commerce.
3. Vetro e luce: immagini e film 3D di prodotto.
4. Cuffie e composizione pubblicitaria: contenuti e campagne.

Ogni visual indica il carattere di concept dimostrativo. Non si inventano clienti, testimonial o risultati.

Il percorso segue una sequenza concreta: definire l'identità, creare il sito o lo shop, mostrare il prodotto, distribuirne i contenuti. I titoli parlano del risultato; le tre attività sotto ciascuno chiariscono ciò che il cliente può richiedere. «Quattro scroll» identifica questi quattro capitoli, lasciando al contenuto lo spazio necessario su schermi piccoli o con testo ingrandito.

## Esplorazione e richieste

Ogni capitolo apre il proprio concept in un dialog nativo con film, descrizione e attività. Il cursore esplora il loop guidato di due secondi dei quattro film Blender esistenti, con export 4K a 60 fps o Full HD secondo la variante attiva. Non introduce un modello WebGL o una rotazione libera a 360°. Il dialog sospende i film sottostanti, offre pausa e concept successivo, ripristina il focus alla chiusura e può portare al modulo del servizio selezionato.

Il concept web presenta tre direzioni originali in SVG: Seta (shop skincare), Forma (sito essenziale) e Nova (landing di prodotto). I file `public/previews/{seta,forma,nova}-web.svg` incorporano i nostri poster CGI. Le anteprime mostrano direzioni possibili, senza aggiungere tre lavori commissionati al portfolio o tre capitoli al percorso principale.

Cinque brevi moduli, uno per servizio più Progetti & bandi, sono contenuti in elementi `details`. I form nativi GET preparano il testo su WhatsApp anche senza JavaScript; il miglioramento aggiunge il contesto del servizio, il conteggio dei caratteri e la validazione. Non esistono invio automatico, backend di raccolta o archiviazione delle idee nel sito: l'utente sceglie se inviare la bozza su WhatsApp.

Progetti & bandi presenta supporto a obiettivi, attività, partner, budget, ricerca e candidatura per aziende, APS e ASD. Gli esempi di digitalizzazione, cultura e sport sono generali; non rappresentano bandi aperti o garanzie di ottenimento di fondi. Il punto di partenza resta la verifica del bando e dei requisiti.

## Movimento e formati

Le scene Blender hanno movimenti periodici distinti, illuminazione da studio e materiali PBR per carta, metallo, vetro, pelle e stampa. Master nativi 3840×2160 a 60 fps; il desktop usa il 4K, con comando di passaggio a Full HD e ripiego automatico in caso di errore. Il mobile fino a 1024 px usa Full HD 1920×1080 a 60 fps con compressione dedicata, conservando l'intero soggetto senza crop o bande aggiunte. Le connessioni 2G/3G iniziano in Full HD.

Il frame di presentazione segue il rapporto effettivo del film; la sfumatura si applica ai suoi bordi, evitando rettangoli visibili dentro un contenitore più alto. Lo scorrimento è nativo e i collegamenti raggiungono l'inizio dei capitoli senza duplicare l'offset del menu fisso. Il film visibile è l'unico in riproduzione; un secondo può essere preparato solo come metadata.

Il loader usa dipendenze reali del primo viewport, si può saltare subito ed ha una scadenza. Menu, focus, pausa e movimento ridotto sono gestiti senza introdurre una libreria di animazione o un nuovo framework. I feedback dei controlli rimangono brevi e interrompibili.

I testi entrano una sola volta per capitolo, con una traslazione di 18 px e uno sfalsamento contenuto entro 785 ms. Pausa, menu, focus e movimento ridotto annullano subito il reveal; senza JavaScript i testi sono già visibili.

## Stack e reference

HTML, CSS e JavaScript ESM con Vite. Il bundle corrente non importa Three.js né i controller delle vecchie scene. Le skill Studio frontend e UI animation sono applicate a gerarchia, continuità, lifecycle e varianti statiche. `using-blender` e `video-non-higgsfield` guidano la pipeline locale originale; non viene dichiarato l'uso di generazione video AI.

Le reference Studio su reveal, menu e composizione sono usate come criteri progettuali, senza incorporare codice o asset delle demo. Provenienza e impostazioni effettive dei film sono nel manifest degli asset.

Horizon CoverFlow è stato selezionato come riferimento ma non acquisito né integrato per mancanza di un accesso autenticato. La presentazione delle tre anteprime è originale e non pubblica sorgenti o asset Horizon.

## Verifica

Struttura HTML, link interni, build, tastiera, menu, loader, autoplay, cambio qualità, ripiego statico e dimensioni responsive vengono verificati sulla build di produzione. La QA distingue la frequenza nominale dei file dalle prestazioni su dispositivi fisici; non dichiara un benchmark iPhone dal solo browser desktop.
