# Filmati del menù Mr Smeet

## Serie attiva — 12 novembre 2026

La serie attiva dei sette panini e menù è **BRASCA**, con apertura degli ingredienti in sospensione e ricomposizione del panino. Il riferimento di movimento è [BRASCA Chicken Sandwich Motion su HorizonX](https://horizonx.so/explore/brasca-chicken-sandwich-motion). I filmati sono stati ricreati sui prodotti Mr Smeet con Higgsfield Seedance 2.5 il 5 novembre 2026. Il filmato originale BRASCA non è stato scaricato o incorporato.

Il ripristino del 9 novembre segue il chiarimento dell’utente che richiede questo movimento di apertura. Sostituisce la precedente interpretazione della serie del 3 novembre, composta da panini fermi con vapore. Quella serie rimane nell’archivio ma non alimenta i sette prodotti attivi.

`data/appetite-media.json` è la fonte dei filmati e delle anteprime. Tutti i dieci prodotti usano ora `films/food-unified/{id}-web.mp4` a 720 × 720 e `films/food-unified/{id}.mp4` a 960 × 960. Sono ricavati dagli stessi master approvati, a 24 fps nativi, H.264 / avc1, senza audio e con intestazione MP4 anticipata. Matrice e primarie BT.709, curva di trasferimento sRGB esplicita: il remux finale corregge la lettura colore del browser senza cambiare pacchetti compressi, tempi o qualità. Aggiunge 19 byte per file. I vecchi export rimangono disponibili per recupero.

Il fondale è stato uniformato a salvia chiaro (#D5DDC6 nominale; #D4DDC6 ai bordi del video decodificato), conservando cibo, packaging, loghi e ombre. La nuova codifica riduce i byte dei sette panini singoli e contorni a 720 px da 1.588.878 a 1.087.260 (−31,57%); il primo keyframe complessivo passa da 300.803 a 229.258 byte (−23,78%). I dieci video web passano da 2.467.900 a 1.855.191 byte (−24,83%). I sette Retina pesano 1.979.796 byte.

Il montaggio mantiene le finestre sicure di apertura e ricomposizione. Triplo, Doppio e Vegano durano 2,125 secondi; Plant Based mantiene 1,542 secondi per non includere la parte difettosa del master. Triplo ha due fotogrammi finali chiusi aggiuntivi. Non si è allungato il movimento ripetendo frame, né si sono interpolati fotogrammi. I tre menù completi conservano il ciclo originale di 5 secondi; le cadute mantengono la velocità nativa. La coerenza del ritmo non implica che ogni prodotto abbia la stessa durata.

| Prodotto | Identificativo della serie BRASCA | Job Higgsfield del master | Montaggio storico |
| --- | --- | --- | --- |
| Classic Doppio | `classic-smash-burger-doppio.mp4` | `eef16e48-fd1f-4fe1-87d8-880badcced65` | Prefisso 0,875 s, apertura rallentata, posa e ritorno inverso |
| Classic Triplo | `classic-smash-burger-triplo.mp4` | `3c18465c-ad4d-450e-bd9f-e4931173ff14` | Prefisso 0,8 s, apertura rallentata, posa e ritorno inverso |
| Plant Based Doppio | `plant-based-burger-doppio.mp4` | `f0fbfdae-560b-400b-8384-a36f524374ba` | Prefisso 0,58 s, apertura rallentata, posa e ritorno inverso |
| 100% vegano | `100-percento-vegano.mp4` | `a9f8e4c1-2caa-4fd0-8477-b5df7dc08067` | Prefisso 0,875 s, apertura rallentata, posa e ritorno inverso |
| Classic Smash Menù | `classic-smash-menu.mp4` | `2517676b-b318-444a-ac98-3541e7eb308f` | Ciclo generato completo |
| Chicken Burger Menù | `chicken-burger-menu.mp4` | `c6bb6ac2-82a5-42d3-add1-532730d2288a` | Ciclo generato completo |
| Menù Birra | `menu-birra.mp4` | `390da53c-0f67-455f-a1f9-09c2ac63e331` | Ciclo generato completo |

I quattro montaggi storici con prefisso limitato restano archiviati; i nuovi export conservano le stesse finestre sicure per mantenere il pane intero e gli ingredienti nel quadro. Il Menù Birra usa la generazione corretta con una sola polpetta. La prima prova, che duplicava la carne, resta scartata. Le animazioni dei prodotti non introducono nuovi effetti, luccichii, generazioni a pagamento o acquisizioni Horizon.

## Contorni

I tre contorni mantengono le cadute dei pezzi singoli generate il 9 novembre con Higgsfield Seedance 2.0. I nuovi export `films/food-unified/` arrivano direttamente dai master a 1440 × 1440 e vengono ridotti a 720 × 720 o 960 × 960: la confezione resta sul piano e gli oggetti cadono alla velocità nativa. Patatine dolci e nuggets perdono soltanto la coda ferma; Classic conserva esattamente i 60 frame approvati, con maggiore risoluzione.

| Prodotto | File | Job Higgsfield | Export |
| --- | --- | --- | --- |
| Sweet Fries | `films/food-unified/sweet-fries.mp4` | `55f134de-76de-4eff-b91e-0e5ddd834de4` | 960 × 960, 24 fps, 84 fotogrammi, 3,5 s |
| Classic Fries | `films/food-unified/classic-fries.mp4` | `da9cb0d1-ca70-4c73-8a60-951f06e70b7e` | 960 × 960, 24 fps, 60 fotogrammi, 2,5 s |
| Nuggets | `films/food-unified/nuggets-di-pollo.mp4` | `05dbdfc1-7880-4114-87d9-5b1a35248a2c` | 960 × 960, 24 fps, 72 fotogrammi, 3 s |

La prima prova Classic Fries è stata scartata per un taglio netto e un cambio di confezione. Il secondo tentativo usa il movimento iniziale completo e rimuove soltanto la coda immobile, mantenendo la velocità nativa. Sweet Fries e Nuggets conservano tutta la caduta e l’assestamento, senza accelerarli. Non vengono ripristinate le vecchie sequenze `sides-fall` o `fries-natural`.

## Anteprime e riproduzione

Tutti i dieci filmati hanno tre poster ciascuno, a 320, 640 e 960 px in `images/food-unified/`, estratti dal fotogramma zero dell’export finale. Le homepage usano `srcset` per scegliere la dimensione adatta. I trenta poster pesano 621.602 byte. Poster, filmato e fotogramma mantenuto condividono il medesimo ritaglio; non vengono aggiunti dissolvenze o cambi di scala sui prodotti.

Le foto del catalogo rimangono nei dettagli, nel sacchetto e nelle modalità movimento ridotto e risparmio dati. Il controller `src/appetite-motion.js` riproduce un solo prodotto alla volta e prepara al massimo un secondo filmato vicino, riutilizzando il suo elemento e buffer al passaggio. I caricamenti anticipati rispettano direzione di scroll, categoria visibile e buffer completo fino alla fine del filmato corrente; durante un’attesa di rete viene liberato il secondo video. Il limite globale hero più prodotti è due sorgenti residenti, con una sola riproduzione.

La sorgente viene scelta prima del caricamento e resta uguale per tutta la visita. La variante `-web.mp4` a 720 px serve connessioni lente o sconosciute e schermi che non richiedono più dettaglio. Quella a 960 px serve display Retina quando la connessione dichiara almeno 4 Mbps oppure un trasferimento reale recente lo dimostra. Quando entrambe le stime sono disponibili prevale la più prudente. Risposte dalla cache e 304 non vengono scambiate per una rete veloce. `src/food-media-source.js` gestisce questa scelta, condivisa tra hero e schede; i suoi test portabili sono in `scripts/food-media-source.test.mjs`.

Viene caricata una sola risoluzione per visita al prodotto, senza rimpiazzare il filmato mentre sta andando.

Le richieste delle schede partono dopo 90 ms stabili nella zona di lettura, 40 ms al passaggio del puntatore e subito per il focus da tastiera. Se il video vicino è già pronto nel buffer, l’avvio non attende nuovamente questi 90 ms. Il vicino richiede altri 150 ms di selezione stabile prima del caricamento anticipato. La riproduzione parte da zero con un margine di 1,5 secondi nel buffer e dati futuri disponibili (`readyState >= 3`); per clip più corte basta la durata completa. Chromium può stimare il tempo bufferizzato dai byte: la soglia è stata scelta sulle prove dei file VBR, non costituisce una misura esatta dei frame decodificati. Se il browser sospende volontariamente il preload dichiarando `HAVE_ENOUGH_DATA`, il controller consente l’avvio da mezzo secondo stimato: aspettare altro in quel caso bloccherebbe il filmato. Il video diventa visibile soltanto dopo il primo frame decodificato; se il caricamento non riesce entro 3,2 secondi rimane la foto. Il fermo immagine conserva fino a 960 px reali, senza upscale della sorgente. Rientro in vista e nuovo passaggio del puntatore consentono il replay. Preferenze statiche, finestre nascoste e dialoghi interrompono anche il caricamento anticipato.

## Verifica e limiti

Gli export vengono controllati con decodifica integrale, tempi dei frame, confronto con il master montato e ispezione delle pose iniziale, aperta e finale. Le misure SSIM controllano la fedeltà della compressione, non certificano il realismo del movimento. I nuovi filmati sono H.264 yuv420p, 24 fps, MP4 con intestazione anticipata per la riproduzione progressiva. La maggiore risoluzione può aumentare il peso complessivo: durata più corta non equivale necessariamente a meno byte.

Provenienza, ricette di export, hash, mappe dei frame e confronti attuali sono conservati localmente in `artifacts/cinematic-20261112/`. La revisione precedente è in `artifacts/motion-polish-20261109/`. Il recupero storico precedente rimane documentato in `artifacts/restoration-20261109/`. Le prove browser distinguono WebKit/Chrome simulati da un iPhone fisico.

Gli asset sono elaborazioni generative illustrative. Non sono riprese del prodotto reale o simulazioni fisiche misurate. I master e le prove scartate restano nell’archivio di produzione.


## Apertura, testata e locale

La hero mantiene il Classic Triplo e l’apertura originale del burger che si veste. La foto iniziale è prioritaria; il filmato non aspetta il completamento del suo decode per iniziare a scaricare. La hero attende 90 ms in vista su mobile o 60 ms su desktop; rivisita 60/30 ms. Il suo primo frame viene mostrato soltanto dopo la decodifica. L’header presenta orari live, logo, menù, collaborazione e sacchetto; durante lo scroll resta il logo centrato sulla barra semitrasparente. DynaPuff coordina titoli e controlli; Instrument Sans rimane per ingredienti e orari. Il tabellone segue il catalogo, mantenendo la composizione di tre righe per volta in 500 ms e la posa definitiva.

La sezione del locale passa dalla foto a un’illustrazione originale, quindi a un filmato in cui il burger rider parte in scooter con lo zaino rosa ed esce a destra. Il fotogramma iniziale è stato realizzato con il generatore immagini, usando la foto del locale e gli asset del marchio; il movimento è Higgsfield Seedance 2.5, job `3d4416a5-96db-46d0-9258-5fdeb0d6971b` del 12 novembre 2026. Il primo tentativo è fallito e non è usato. È una scena illustrativa, non un video del locale reale.

`src/storefront-rider.js` usa lo scroll nativo per la dissolvenza, poi riproduce il filmato a velocità naturale, senza cercare continuamente i frame. Video H.264 720p mobile / 1080p desktop in `films/storefront-rider/`; poster estratti dal video finale in `images/storefront-rider/`. I media arrivano solo avvicinandosi alla sezione. Movimento ridotto e risparmio dati mantengono la foto; fuori schermo si interrompe la riproduzione e lontano dalla sezione si libera il video. Replay e indicazioni restano accessibili da tastiera.
