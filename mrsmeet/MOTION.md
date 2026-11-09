# Filmati del menù Mr Smeet

La revisione del 9 novembre 2026 recupera la serie Higgsfield del 3 novembre richiesta dall’utente. La serie BRASCA successiva, con ingredienti che si separano, non è la serie da ripristinare.

`data/appetite-media.json` è la fonte dei filmati attivi e delle anteprime. Doppio usa `films/menu-unified/classic-smash-burger-doppio.mp4`. Plant Doppio, Vegano e i tre menù usano gli omonimi file `-natural.mp4` nella stessa cartella. Sono i sei export originali, senza nuove trasformazioni. Il Triplo usa `films/food-recovered/classic-smash-burger-triplo-v1.mp4`, ricavato dai primi 42 fotogrammi del filmato naturale originale. La finestra di 1,75 secondi esclude il riflesso luminoso presente più avanti. Il movimento mantiene la velocità originale.

Le tre clip dei contorni sono nuove generazioni Higgsfield Seedance 2.0 da riferimenti del catalogo. Cadono pezzi singoli, mentre la confezione rimane ferma. I file attivi sono `films/food-recovered/sweet-fries-v1.mp4`, `nuggets-di-pollo-v1.mp4` e `classic-fries-v2.mp4`. La prima prova delle classiche è stata scartata per un taglio e un cambio di confezione. Non usare le vecchie sequenze `sides-fall` o `fries-natural` come ripristino di questa revisione.

Le anteprime in `images/food-recovered/` sono fotogrammi dei filmati corrispondenti. Le foto del catalogo restano disponibili nei dettagli, nel sacchetto e per movimento ridotto o risparmio dati.

`src/appetite-motion.js` assegna la riproduzione a un solo prodotto per volta. Il video compare quando il primo fotogramma è decodificato, senza dissolvenza. Quando il decoder passa a un’altra scheda visibile, un canvas limitato a 640 pixel mantiene il fotogramma raggiunto. Fuori schermo, al cambio delle preferenze e allo smontaggio le risorse vengono rilasciate. Il passaggio del puntatore e il nuovo ingresso nella zona di lettura possono riavviare il filmato. L’hero segue le stesse regole in `src/main.js`.

Gli asset sono elaborazioni generative illustrative. Non sono riprese del prodotto reale o simulazioni fisiche misurate. I master e le prove di produzione restano nell’archivio locale.
