# Cinque servizi, cinque gesti

L’ingresso nello studio, l’assemblaggio, lo zoom e l’acqua restano il riferimento approvato. La revisione del **4 novembre 2026** migliora continuità e regia dei film successivi. Cinque miniature statiche mostrano subito che cosa offre lo studio, prima dei singoli capitoli.

| Servizio | Gesto e soggetto | Funzione |
| --- | --- | --- |
| Siti web ed e-commerce | Cinque interfacce attraversate da transizioni continue | Mostrare in dieci secondi prodotti, servizi, prenotazioni ed eventi |
| Loghi e identità | Packaging FORMA che si rivela e si ricompone | Collegare logo, packaging e comunicazione |
| Video e animazioni | ORA, vetro e luce con una regia di prodotto | Mostrare la capacità di presentare un prodotto |
| Social e campagne | Un video centrale si declina in tre formati SHIFT | Rendere visibile una campagna coordinata |
| Progetti e bandi | Dossier e piani che si organizzano | Collegare idea, attività, calendario e budget |

## Cadenze e metodi

| Materiale | Tecnica | Cadenza del nuovo rilascio | Stato |
| --- | --- | --- | --- |
| Reel web | Catture HTML e piani CSS 3D | 10 s, 600 frame per profilo a 60 fps | Completato e verificato |
| Branding FORMA | Geometria, materiali, luci e camera Blender | 6 s, 288 frame per profilo a 48 fps | Completato e verificato |
| ORA | Film Higgsfield con derivato portrait | 8,041667 s, 193 frame per profilo a 24 fps | Completato e verificato |
| Campagna SHIFT | Piani CSS 3D con un film Higgsfield incorporato | 6 s, 360 frame per profilo a 60 fps; inserto a 24 fps | Completata e verificata |
| Dossier | Film Blender del 3 novembre | 4 s, 120 frame per profilo a 30 fps | Conservato |

Web e campagna hanno profili nativi 1920×1080 e 720×900. Il nuovo branding usa gli stessi profili; il prodotto ha un derivato 720×900 ottenuto dal crop nativo 864×1080 della sorgente approvata. Non si dichiarano 4K o 60 fps per il film AI. Le superfici raster e le mesh Blender mantengono provenienze distinte.

Le transizioni web di 36 frame a 60 fps durano 0,6 secondi e usano easing quintico, mantenendo continuità di velocità e accelerazione. Il gesto della campagna segue una regia temporale: video principale da 0 a 0,4 s, apertura sfalsata fino a 2,34 s, hold leggibile fino a 4,56 s, ritorno fino a 5,82 s e ricongiungimento alla prima posa. Il film interno viene cercato a tempo assoluto, non registrato in autoplay; gli ultimi 24 frame dissolvono verso la sua immagine iniziale. Nessuna riproduzione inversa o interpolazione ottica.

Ogni film è preceduto dal servizio concreto, una frase e una riga di formati. Lo stato di primo piano evita film concorrenti. Pausa, caricamento vicino allo schermo, movimento ridotto e risparmio dati restano gestiti dal controller. Navigazione, box idea, demo e descrizioni sono HTML, con scroll nativo.

Concept e marchi sono esempi possibili. La progettazione non annuncia bandi aperti né promette finanziamenti. I manifest storici conservano fatti e hash originali; i nuovi manifest `ASSET-MOTION-*-20261104.json` descrivono il rilascio corrente. Master e sequenze restano in `outputs/`, fuori dal sito pubblico.

## Verifiche dei materiali

Il branding Blender è completato: due profili nativi, 288 frame ciascuno a 48 fps, sei secondi. Master, tutte le pose, contatti e distanze fisiche, loop, tutti i 576 frame nativi, export, decodifica e faststart sono verificati; tre campioni codificati per profilo sono confrontati con i master. Film e poster pesano complessivamente 2.260.803 byte. Risultati in [ASSET-MOTION-BLENDER-20261104.json](./ASSET-MOTION-BLENDER-20261104.json).

Il reel web è verificato su 1.200 frame nativi, con dimensioni, assenza di frame neri, loop, decodifica completa, faststart e cinque campioni codificati per profilo. [ASSET-MOTION-WEB-20261104.json](./ASSET-MOTION-WEB-20261104.json) conserva i risultati.

ORA è approvato come film Higgsfield, non come nuovo render Blender: 193 frame a 24 fps, 8,041667 secondi per profilo. Il crop portrait è ridotto da 864×1080 a 720×900. Il montaggio mantiene la cadenza nativa, senza dissolvenze, riproduzione inversa, cambi di velocità o interpolazioni. La decodifica completa e il controllo dei pixel coprono tutti i 386 frame consegnati; tre campioni per profilo sono confrontati con il master senza perdita. Film e poster pesano 4.282.343 byte. Ricevute in [ASSET-MOTION-PRODUCT-20261104.json](./ASSET-MOTION-PRODUCT-20261104.json).

La campagna è completata con 720 frame nativi complessivi. Preflight di 361 pose per profilo con chiusura esatta, margini minimi 89,96 px desktop e 22,54 px portrait, 24 ricevute browser senza errori, decodifica completa, faststart e confronto dei frame codificati con i master superati. H.264 High livello 4.2 per 1080p60, livello 4.1 per portrait; film e poster pesano 3.812.286 byte. Risultati in [ASSET-MOTION-CAMPAIGN-20261104.json](./ASSET-MOTION-CAMPAIGN-20261104.json).

La nuova prova locale desktop è passata su cinque film e sei viewport, con pausa, sincronizzazione del reel, cinque miniature caricate, cinque brief validati senza invio e cinque demo aperte. Zero overflow, errori JavaScript e richieste esterne osservati. La prova dedicata del telefono è passata su cinque file 720×900 in 4:5, pause, rotazione con lo stesso file portrait, arrivo statico a movimento ridotto e riproduzione manuale corretta, senza errori JavaScript. Produzione e QA locale sono completate; la verifica pubblica viene registrata separatamente dopo il deploy in `outputs/proofs/motion-20261104-final-verification.json`. Le prove del 3 novembre restano storiche. Verifiche correnti nel [README](./README.md#verifiche).
