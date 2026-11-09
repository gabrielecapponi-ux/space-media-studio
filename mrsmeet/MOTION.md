# Filmati del menù Mr Smeet

## Serie attiva e provenienza

La serie attiva dei sette panini e menù è **BRASCA**, con apertura degli ingredienti in sospensione e ricomposizione del panino. Il riferimento di movimento è [BRASCA Chicken Sandwich Motion su HorizonX](https://horizonx.so/explore/brasca-chicken-sandwich-motion). I filmati sono stati ricreati sui prodotti Mr Smeet con Higgsfield Seedance 2.5 il 5 novembre 2026. Il filmato originale BRASCA non è stato scaricato o incorporato.

Il ripristino del 9 novembre segue il chiarimento dell’utente che richiede questo movimento di apertura. Sostituisce la precedente interpretazione della serie del 3 novembre, composta da panini fermi con vapore. Quella serie rimane nell’archivio ma non alimenta i sette prodotti attivi.

`data/appetite-media.json` è la fonte dei filmati e delle anteprime. I sette MP4 `films/brasca-motion/{id}.mp4` coincidono byte per byte con i file pubblicati nel commit Pages `acfb18c`. Non sono stati rigenerati o ricodificati durante questo ripristino. Ogni clip misura720 × 720 pixel, dura5 secondi a24 fps ed è muta.

| Prodotto | File nella cartella `films/brasca-motion/` | Job Higgsfield | Montaggio storico |
| --- | --- | --- | --- |
| Classic Doppio | `classic-smash-burger-doppio.mp4` | `eef16e48-fd1f-4fe1-87d8-880badcced65` | Prefisso 0,875 s, apertura rallentata, posa e ritorno inverso |
| Classic Triplo | `classic-smash-burger-triplo.mp4` | `3c18465c-ad4d-450e-bd9f-e4931173ff14` | Prefisso 0,8 s, apertura rallentata, posa e ritorno inverso |
| Plant Based Doppio | `plant-based-burger-doppio.mp4` | `f0fbfdae-560b-400b-8384-a36f524374ba` | Prefisso 0,58 s, apertura rallentata, posa e ritorno inverso |
| 100% vegano | `100-percento-vegano.mp4` | `a9f8e4c1-2caa-4fd0-8477-b5df7dc08067` | Prefisso 0,875 s, apertura rallentata, posa e ritorno inverso |
| Classic Smash Menù | `classic-smash-menu.mp4` | `2517676b-b318-444a-ac98-3541e7eb308f` | Ciclo generato completo |
| Chicken Burger Menù | `chicken-burger-menu.mp4` | `c6bb6ac2-82a5-42d3-add1-532730d2288a` | Ciclo generato completo |
| Menù Birra | `menu-birra.mp4` | `390da53c-0f67-455f-a1f9-09c2ac63e331` | Ciclo generato completo |

I quattro montaggi con prefisso limitato sono gli export storici già consegnati, preparati per conservare il pane intero e gli ingredienti nel quadro. Il Menù Birra usa la generazione corretta con una sola polpetta. La prima prova, che duplicava la carne, resta scartata. Questo ripristino non introduce nuovi effetti, luccichii, generazioni a pagamento o acquisizioni Horizon.

## Contorni

Restano attive le tre clip di caduta dei pezzi singoli, generate il 9 novembre 2026 con Higgsfield Seedance 2.0 dai riferimenti del catalogo. La confezione resta sul piano mentre arrivano i pezzi dall’alto.

| Prodotto | File | Job Higgsfield | Export |
| --- | --- | --- | --- |
| Sweet Fries | `films/food-recovered/sweet-fries-v1.mp4` | `55f134de-76de-4eff-b91e-0e5ddd834de4` | 720 × 720, 24 fps, 121 fotogrammi, 5,0417 s |
| Classic Fries | `films/food-recovered/classic-fries-v2.mp4` | `da9cb0d1-ca70-4c73-8a60-951f06e70b7e` | 720 × 720, 24 fps, 60 fotogrammi, 2,5 s |
| Nuggets | `films/food-recovered/nuggets-di-pollo-v1.mp4` | `05dbdfc1-7880-4114-87d9-5b1a35248a2c` | 720 × 720, 24 fps, 121 fotogrammi, 5,0417 s |

La prima prova Classic Fries è stata scartata per un taglio netto e un cambio di confezione. Il secondo tentativo usa il movimento iniziale completo e rimuove soltanto la coda immobile, mantenendo la velocità nativa. Sweet Fries e Nuggets usano le clip complete. Non vengono ripristinate le vecchie sequenze `sides-fall` o `fries-natural`.

## Anteprime e riproduzione

I quattordici WebP `images/film-first/{burger-id}-{320,640}.webp` sono i primi fotogrammi delle sette clip BRASCA, preparati nella revisione del 6 novembre. Coincidono con il commit sorgenti `63bdeca`. Le sei anteprime dei contorni sono in `images/food-recovered/`. Non usare le anteprime `food-recovered` dei panini con i video BRASCA, perché provengono da una serie differente.

Le foto del catalogo rimangono nei dettagli, nel sacchetto e nelle modalità movimento ridotto e risparmio dati. Il controller `src/appetite-motion.js` coordina un solo filmato di prodotto per volta, mentre `src/main.js` coordina l’hero. Il video compare quando il primo fotogramma è decodificato. Hover e nuovo ingresso nella zona di lettura possono riavviarlo.

## Verifica e limiti

Verificati i sette SHA256 contro il commit Pages storico, i quattordici poster contro il commit sorgenti storico e la decodifica integrale dei sette MP4. Esaminati42 fotogrammi reali, sei per clip, nelle pose iniziale, aperta e finale. Tutti gli ingredienti principali restano nel quadro. La ricomposizione e i montaggi riflettono gli export storici, senza attestarne una simulazione fisica reale. Riferimenti e hash completi sono conservati nell’evidenza locale `artifacts/restoration-20261109/burger-restoration.json`.

Gli asset sono elaborazioni generative illustrative. Non sono riprese del prodotto reale o simulazioni fisiche misurate. I master e le prove scartate restano nell’archivio di produzione.
