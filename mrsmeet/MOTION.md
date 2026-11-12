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

Le richieste delle schede partono dopo 90 ms stabili nella zona di lettura, 40 ms al passaggio del puntatore e subito per il focus da tastiera. Se il video vicino è già pronto nel buffer, l’avvio non attende nuovamente questi 90 ms. Il vicino richiede altri 150 ms di selezione stabile prima del caricamento anticipato. La riproduzione parte da zero con un margine di 1,5 secondi nel buffer e dati futuri disponibili (`readyState >= 3`); per clip più corte basta la durata completa. Chromium può stimare il tempo bufferizzato dai byte: la soglia è stata scelta sulle prove dei file VBR, non costituisce una misura esatta dei frame decodificati. Se il browser sospende volontariamente il preload dichiarando `HAVE_ENOUGH_DATA`, il controller consente l’avvio da mezzo secondo stimato: aspettare altro in quel caso bloccherebbe il filmato. Il video diventa visibile soltanto dopo il primo frame decodificato. Il precedente limite fisso di 3,2 secondi è sostituito da **8 secondi di inattività del caricamento**, rinnovati quando arrivano nuovi dati, con un **limite assoluto di 30 secondi**: oltre questi limiti rimane la foto. Le attese durante la riproduzione non consumano il tempo residuo del movimento. Il fermo immagine conserva fino a 960 px reali, senza upscale della sorgente. Rientro in vista e nuovo passaggio del puntatore consentono il replay. Preferenze statiche, finestre nascoste e dialoghi interrompono anche il caricamento anticipato. Le soglie di lettura considerano l’area effettiva fra header persistente e barra inferiore, tramite `src/motion-viewport.js`.

## Verifica e limiti

Gli export vengono controllati con decodifica integrale, tempi dei frame, confronto con il master montato e ispezione delle pose iniziale, aperta e finale. Le misure SSIM controllano la fedeltà della compressione, non certificano il realismo del movimento. I nuovi filmati sono H.264 yuv420p, 24 fps, MP4 con intestazione anticipata per la riproduzione progressiva. La maggiore risoluzione può aumentare il peso complessivo: durata più corta non equivale necessariamente a meno byte.

Provenienza, ricette di export, hash, mappe dei frame e confronti attuali sono conservati localmente in `artifacts/cinematic-20261112/`. La revisione precedente è in `artifacts/motion-polish-20261109/`. Il recupero storico precedente rimane documentato in `artifacts/restoration-20261109/`. Le prove browser distinguono WebKit/Chrome simulati da un iPhone fisico.

Gli asset sono elaborazioni generative illustrative. Non sono riprese del prodotto reale o simulazioni fisiche misurate. I master e le prove scartate restano nell’archivio di produzione.


## Apertura rider, testata e percorso d’ordine

La nuova apertura è la scena del rider in `#rider-hero`, seguita dal **Classic Triplo in una fascia compatta**: foto, animazione originale, nome, prezzi approvati, promozione e «Aggiungi» restano disponibili senza una seconda hero a tutta altezza. `src/featured-triplo.css` cambia soltanto la disposizione. Il burger che si veste rimane raggiungibile da «Rivedi l’apertura» nel footer, ma non parte più automaticamente sulle tre homepage.

L’header semitrasparente conserva **orari, logo con mascotte, telefono, email, menù, collaborazione e sacchetto durante tutto lo scroll**. Lo stato di apertura viene calcolato dagli orari ordinari approvati nel fuso Europe/Rome e aggiornato ogni minuto: non è un feed dell’effettiva attività del locale. `src/header-size.js` misura l’altezza reale, inclusa la safe area, aggiorna `--header-height` e invia `smeet:header-resize` per riallineare hero e controlli. DynaPuff coordina titoli e navigazione; Instrument Sans rimane per ingredienti, orari e testi di lettura.

Il tabellone segue il catalogo e compone tre righe per volta in 500 ms, mantenendo poi la scritta definitiva. «Il tuo sacchetto» è un richiamo compatto con il collegamento d’apertura, **subito prima del food truck**, senza ripetere il filmato della hero. La foto reale del locale resta statica in «Dove siamo». Un aggiornamento esplicito della pagina riporta all’apertura e a `#top`; il primo accesso tramite un collegamento a una sezione mantiene la propria destinazione.

### Master e file immutabili della scena v2

La mascotte riempie il sacchetto in primo piano, lo porta allo scooter, lo sistema nel contenitore termico rosa, sale e parte verso destra. La nuova composizione mantiene **lo scooter intero prima della partenza** e aggiunge il tabellone verde/crema/rosa sotto la lampada sinistra, con le scritte MR SMEET / SMASH / FRIES / NUGGETS, senza nuovi prezzi. Su mobile il quadro è **3:2, `object-position: 100% 50%`**; desktop 16:9. Il ritaglio è applicato dal CSS e non incorporato nel filmato.

Master Higgsfield Seedance 2.5 del 12 novembre 2026, job `efae3358-fdfc-4ab9-bc9e-a9449243f9d4`, da un fotogramma iniziale corretto sulla mascotte e sul locale già approvati. `outputs/bag-rider/packing-v2-master.mp4` conserva il master nativo Full HD, 24 fps, **337 fotogrammi e 14,041667 secondi**, senza audio. È una scena illustrativa generata, non una ripresa del locale. Nessun taglio, accelerazione, interpolazione o movimento di camera è stato aggiunto agli export.

| File attivo | Dimensioni | Byte effettivi |
| --- | --- | ---: |
| `films/bag-rider/scroll-v2-mobile.mp4` | 960 × 540 | 3.498.785 |
| `films/bag-rider/scroll-v2-1080.mp4` | 1920 × 1080 | 8.656.851 |
| `images/bag-rider/scroll-v2-poster-768.webp` | 768 × 432 | 60.180 |
| `images/bag-rider/scroll-v2-poster-1920.webp` | 1920 × 1080 | 209.456 |

I nomi v2 sono nuovi e immutabili: non sovrascrivono i precedenti filmati. Gli MP4 sono H.264 High / avc1, yuv420p, BT.709, faststart, preset slow, CRF 22,55 mobile / 22 Full HD. Mantengono tutti i frame nativi, **GOP12 con keyframe distanti al massimo 0,5 secondi**, zero B-frame e `moov` prima di `mdat`. La distanza fra keyframe facilita la decodifica per il seek; non equivale a una latenza di seek misurata di mezzo secondo. Decodifica integrale superata per entrambi.

I poster derivano dal fotogramma zero dell’export Full HD finale, con conversione BT.709 → sRGB e WebP q84/q86. Composizione e ritaglio corrispondono al video; la compressione non è lossless. Il poster iniziale è prioritario e rimane visibile fino alla disponibilità del fotogramma richiesto. Provenienza, prompt, ricette, hash e controlli dei file v2 sono in `artifacts/bag-rider-v2-20261112/`.

### Scroll, seek e riproduzione manuale

`src/rider-hero.js` usa **scroll nativo, sticky CSS e GSAP ScrollTrigger con `scrub: .4`**. La distanza aggiuntiva appartiene alla sezione; non vengono intercettati wheel o touch né imposto uno scroll artificiale. La posizione sticky parte sotto l’header misurato. Lo scroll seleziona `currentTime`: non avvia un filmato in loop dietro al movimento della pagina.

Le richieste di frame sono raggruppate: **un solo seek pendente, con priorità all’ultimo target dello scroll**. Durante la decodifica non si accodano tutte le posizioni intermedie; completato il seek, il controller verifica il target più recente. Poster, video, didascalia e indicatore non anticipano un fotogramma ancora in attesa. La sorgente viene scelta una volta per visita usando il selettore di rete condiviso: mobile per reti lente o sconosciute, Full HD quando il dettaglio e la rete lo consentono, oppure sui desktop larghi senza Network Information API. La hero reclama i decoder dei prodotti quando entra nella zona effettivamente leggibile; fuori dalla sezione rilascia la propria risorsa.

«Guarda la scena» chiama `play()` direttamente dal gesto dell’utente. Pausa e fine della visione manuale **mantengono il fotogramma raggiunto** anche se arrivano nuovi dati o cambia il layout. Solo un nuovo scroll superiore a 12 px restituisce il controllo alla timeline. Le promise obsolete non possono modificare una visita successiva; un errore offre «Riprova la scena».

Se `video.seeking` rimane vero per **15 secondi**, il controller rilascia sorgente ed elemento video, conserva il poster HTML corrispondente e mostra «Riprova». Non ricomincia a scaricare mentre si resta nella stessa vista: un click esplicito oppure l’uscita e il successivo rientro creano una nuova sorgente. Dialoghi e pausa generale cancellano la scadenza; al ritorno parte un nuovo margine di 15 secondi soltanto se il seek è ancora pendente. Questo limite riguarda il **seek bloccato**, non l’avvio generico del filmato.

Movimento ridotto e Risparmio dati mantengono il poster, senza video né altezza extra dello scroll. Per finestre alte al massimo 560 px viene rimossa anche la timeline sticky, conservando la visione manuale quando le preferenze consentono il movimento. Sacchetto o dettagli aperti, pausa generale e pagina nascosta sospendono il lavoro. Ridimensionamento dell’header, ritorno alla pagina e cambio orientamento riallineano la geometria senza moltiplicare i trigger.

Le prove della revisione comprendono **Chrome a 320 e 393 px, Chrome desktop e Safari nativo su desktop**; controlli e screenshot sono conservati in `artifacts/scroll-hero-20261112/`. Sono passati **90 controlli logici**: 60 per prodotti/truck/tabellone, 24 per la hero e 6 per il Triplo compatto. Simulano eventi media, clock, preferenze e geometria, mentre i confronti dei file misurano la fedeltà dell’export. Queste prove non attestano fluidità o prestazioni su un **iPhone fisico**. La verifica del rilascio pubblico viene registrata separatamente; questa descrizione non dichiara una pubblicazione già avvenuta.

## Archivio — precedente scena del sacchetto

La precedente scena, job `2e131f5b-e4e3-4bca-9478-eceff5d8c641` del 12 novembre 2026, apparteneva a «Il tuo sacchetto» prima del food truck. Il vecchio `src/bag-rider.js` e il relativo CSS restano disponibili per recupero, ma **non vengono più montati dal sito corrente**. Quel controller riproduceva una sequenza finita al rientro in vista, senza seek legato allo scroll; non va confuso con `src/rider-hero.js`.

I filmati `films/bag-rider/packing-1080.mp4` (1920 × 1080, 5.341.673 byte) e `packing-720.mp4` (1280 × 720, 2.705.640 byte), insieme a `images/bag-rider/poster-1920.webp` (202.714 byte) e `poster-768.webp` (59.802 byte), rimangono conservati. I filmati hanno 337 frame a 24 fps e durata 14,041667 secondi. Il vecchio quadro mobile era 4:3 centrale; non è l’inquadratura della hero v2. Provenienza e verifiche storiche sono in `artifacts/bag-rider-20261112/`.

### Archivio della prima scena del locale

La prima partenza davanti al locale, job `3d4416a5-96db-46d0-9258-5fdeb0d6971b`, resta conservata in `films/storefront-rider/`, `images/storefront-rider/` e nel vecchio controller `src/storefront-rider.js`. Non viene montata dal sito attivo. Il primo tentativo generativo fallito resta scartato. La scena v2 della hero sostituisce entrambe le precedenti presentazioni del rider.
