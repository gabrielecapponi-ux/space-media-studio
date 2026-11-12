# Provenienza dei materiali — Space Media Studio

## Blackbox, CACAO e campagne — 12 novembre 2026

La nuova apertura riutilizza il master originale dello studio e aggiunge una scultura Space con foro reale, struttura luminosa in titanio, monitor audio, console rotativa e campioni di materiale. Architettura, finiture, fondale continuo, illuminazione e camera sono rifatti in nero, bianco e giallo. Non sono acquisiti nuovi modelli, HDR o film generativi. L’acqua e LUMA sui monitor sono immagini originali già documentate, incorporate nei master. Il GLB contiene geometria e metadati di diciannove gruppi; il runtime Three.js riproduce la costruzione se il film non può avviarsi.

Il film Blackbox ha 288 fotogrammi nativi QHD 60 e 144 nativi portrait 1080×1920/30; dura 4,8 secondi, con HD derivato. CACAO e SHIFT hanno ciascuno 480 fotogrammi QHD 60 e 240 portrait 1080×1350/30, durata 8 secondi, più HD 60 e compact 30 derivati. Sono render Blender Cycles con denoise, senza interpolazione o ingrandimento artificiale; nessuna dichiarazione 4K. I fotogrammi iniziali reali alimentano i poster. Le tre scene mantengono master, ricette, firme dei chunk e manifest con hash; gli export si verificano per decodifica completa, cadenza, unicità e faststart.

CACAO riutilizza il cofanetto originale, con coperchio sulla cerniera, sei tavolette animate, materiali carta/lamina/cioccolato e camera macro dedicata. SHIFT riutilizza la geometria del campionatore PHASE 01: jog wheel e pad sono animati fisicamente; tre pannelli grafite portano artwork stampati nero/arancio. I pannelli sono veri oggetti tridimensionali con lati e dorsi scuri. Restano concept dimostrativi, non lavori commissionati o risultati di clienti reali.

Ricette e manifest: `scripts/studio-cinema-20261112/`, `scripts/cacao-cinema-20261112/`, `scripts/campaign-cinema-20261112/`. Master privati, prove e QA nelle corrispondenti cartelle `outputs/`; registro pubblico degli asset attivi in `ASSET-TRILOGY-CINEMA-20261112.json`. Il materiale storico rimane recuperabile; `director-brand.jpg` è conservato per la demo CACAO. Questa produzione non modifica LUMA, Web, bandi o la ripresa UHD dell’acqua.

## Hero e meccanica LUMA — 12 novembre 2026

La nuova hero «La tua idea. Prende forma.» è una composizione originale HTML/CSS. Riutilizza la ripresa UHD dell’acqua e l’introduzione dello studio già approvate. Titolo e proposta commerciale rimangono fuori dal film; il monitor desktop ricava righe, spazi e colori dalla pagina effettiva. Nessuna nuova risorsa Horizon è acquisita: l’adattamento OSKEN esistente rimane conservato.

I nuovi film `luma-mechanics-20261112-*` derivano dal modello editabile originale `outputs/flagship-20261106/luma/luma-optical-bench.blend`. Il corpo, tre gruppi ottici coassiali, nove lamelle su perni, tre selettori incisi e il pulsante di scatto sono animati nella geometria. Vetri e materiali metallici vengono renderizzati da Blender Cycles, 20 campioni massimi, sette rimbalzi, denoise OIDN su Metal e motion blur. Non vengono usate fotografie proiettate per il nuovo movimento, immagini esterne o frame interpolati.

Due master editabili producono QHD 2560×1440/60 e portrait 1080×1350/30 nativi, entrambi da dieci secondi. HD 1920×1080/60 e compact 1280×720/30 sono derivati del QHD; nessun file LUMA è dichiarato 4K. Il portrait ha camera e fondale curvo dedicati. I poster WebP provengono dal primo fotogramma di ciascun profilo; la miniatura 320×180 usa il fotogramma desktop 0301, con il prodotto frontale e più leggibile. Il manifest pubblico `ASSET-LUMA-MECHANICS-20261112.json` registra master, ricette, font di sistema, hash e caratteristiche degli export. Ricette in `scripts/luma-mechanics-20261112/`; master, prove scartate, controlli e manifest completo in `outputs/luma-mechanics-20261112/`.

La scena eredita Arial e Arial Bold di macOS, già incorporati nel master originale e conservati nei master privati. Percorsi e hash sono documentati; nessun file di font separato viene pubblicato. La riapertura dei master non richiede texture esterne o librerie Blender collegate. I film LUMA precedenti vengono esclusi dal manifest attivo, conservando la fotografia `elegant-product.webp` ancora usata dalla demo. Il materiale storico resta recuperabile da Git; questa lavorazione non elimina file degli altri progetti o ripristina cancellazioni locali preesistenti.

## Campagne e demo Web — revisione successiva del 10 novembre 2026

I film dell’edizione del 10 novembre `cinematic-web-20261110*` e `cinematic-campaign-20261110*` sostituiscono nella build i rispettivi film precedenti, conservati senza modifiche nell’archivio e in `public/`. Entrambi offrono master nativi QHD 2560×1440/60 fps, HD 1920×1080/60, compact 1280×720/30 e regia portrait 720×900/30, dieci secondi. Non sono esportazioni 4K né frame interpolati. La ripresa UHD dell’acqua rimane invariata.

La campagna SHIFT riutilizza le fotografie originali Cycles del campionatore con nuovi artwork nero/arancio e tre supporti grafite. Il materiale avorio dei bordi è stato sostituito nel disegno dei pannelli; non è nascosto ritagliando il film. Due master Blender editabili contengono le texture incorporate e le camere calibrate. La consegna usa un renderer proiettivo delle geometrie e delle fotografie, non una nuova sequenza path-traced di 600 frame. Ricette in `scripts/campaign-polish-20261110/`, master e manifest con hash, cadenza, loop e verifiche in `outputs/campaign-web-revision-20261110/campaign/`.

Lo showreel Web usa catture delle cinque pagine funzionanti PHASE 01, CACAO ATELIER, LUMA, BASILICO e OLTRE a doppia densità. Camera, superfici grafite e raccordi sono originali; macro e fotografie PHASE 01 provengono dai master Cycles già documentati. Le demo sostituiscono VELA/NOVA e la vecchia OLTRE conservando le chiavi di navigazione. Ricette e manifest delle catture: `scripts/web-reel-polish-20261110/` e `outputs/campaign-web-revision-20261110/web/`. Nessun asset di un sito esterno viene incorporato.

La scultura in rame OLTRE è una geometria originale Blender di 24.576 vertici, render Cycles trasparente 1200×1200 a 128 campioni; ricetta `public/showcase/oltre/build-artwork.py`, master e ricevute in `outputs/campaign-web-revision-20261110/showcase/orbit-final/`. Solo `orbit.webp` è incluso nella build. CACAO/LUMA riusano i prodotti Blender originali; BASILICO conserva il visual gastronomico AI preesistente. Eventi, prenotazioni, prodotti e prezzi delle demo sono esempi locali, senza invii, pagamenti o commesse reali dichiarate.

Le cinque nuove miniature totalizzano 62.146 byte. `scripts/export-demo-previews.py` e il manifest in `outputs/campaign-web-revision-20261110/` ne registrano sorgenti e hash. Il nuovo titolo sulla goccia è HTML/CSS, senza ricodificare l’acqua. Le sezioni seguenti descrivono le revisioni storiche: i loro conteggi e file non identificano automaticamente la consegna attiva.

## Rifinitura cinematografica — 10 novembre 2026

Il nuovo disegno dei bandi sostituisce le persone con tavole di progetto e un padiglione esploso. Il master vettoriale editabile è `src/artwork/funding-planning-master.svg`, generato tramite Higgsfield, modello GPT Image 2.6, job `f1b1dc02-899c-42be-a98e-599cced4491f`. Non è una mesh 3D né un film: è un'illustrazione SVG in prospettiva animata nel browser. Prompt, ricevuta e master ricevuto sono conservati in `outputs/cinematic-polish-20261110/higgsfield/`; l'adattamento conserva la linea sul giallo, i quattro titoli e la durata di 22 secondi. `scripts/export-funding-journey.mjs` riproduce il modulo di geometria e i due poster. Lampadina e dossier riutilizzano il disegno originale Space Media. Nessuna persona del percorso precedente resta nelle nuove tavole.

Cinque miniature WebP da 480 px (54.400 byte totali) riutilizzano le immagini delle demo SHIFT, VELA, NOVA, BASILICO e OLTRE. Ricetta: `scripts/export-demo-previews.py`; manifest di sorgenti, hash e dimensioni in `outputs/cinematic-polish-20261110/demo-previews-manifest.json`. Gli originali e tutti i 19 MP4 attivi restano identici: nessuna ricodifica, interpolazione o riduzione della qualità video. I materiali e le ricevute delle versioni precedenti sotto restano storici.

## Fluidità mobile e disegno dei bandi — 9 novembre 2026

Il percorso dei bandi conserva palette, testi e durata di 22 secondi. Il master originale `src/funding-journey.js` contiene ora un filamento più dettagliato, due persone che progettano insieme, un dossier di candidatura e un edificio civico in prospettiva. Le geometrie sono SVG originali Space Media. `node scripts/export-funding-journey.mjs` riproduce entrambi i poster attivi dallo stesso master e genera il manifest con dimensioni e SHA-256 in `outputs/iphone-funding-20261109/funding/asset-manifest.json`. La versione precedente resta nella cronologia Git e nella copia locale `funding/before/`.

Questa revisione non ricodifica né sostituisce i film: conserva i 19 MP4 del manifest attivo, inclusi studio, acqua UHD e tagli portrait. L'ottimizzazione riguarda preparazione del prossimo film e aggiornamenti dell'interfaccia. Il confronto degli hash è in `outputs/iphone-funding-20261109/`; le ricevute storiche sotto continuano a descrivere le rispettive versioni.

## Riordino del 9 novembre 2026

- Ripristinato lo studio come caricamento a schermo intero fino al 100%, usando la geometria Blender e il film mobile originali già documentati. Quando la policy mobile blocca il film, il caricamento usa la stessa mesh Blender in WebGL. Nessuna nuova attribuzione di produzione.
- La hero desktop seleziona sempre `flagship-water-desktop.mp4`, master fotografico nativo 3840×2160 a 24 fps, 9 s, 7.519.280 byte. Il portrait usa `flagship-water-mobile.mp4`, taglio 1080×1350 ricavato dal negativo UHD, 2.529.669 byte. Provenienza Film Composite/Pexels in `ASSET-WATER.md`. Le fasce specchiate sono state rimosse, l’inquadratura conserva le proporzioni.
- “Progetti e bandi” torna all’animazione SVG originale di Space Media in `src/funding-journey.js`, linea nera sul giallo. Poster `public/images/funding-journey{,-mobile}.svg`. I film Blender dei bandi restano archivio e non sono più referenziati dalla homepage.
- I quattro servizi video mantengono i film `director-*` ed `elegant-*` della precedente consegna, con le risoluzioni documentate sotto. Il 4K della hero non descrive i film QHD LUMA e SHIFT.


## Rifinitura desktop del 9 novembre 2026

LUMA e la campagna SHIFT usano i film `elegant-product` ed `elegant-campaign`, da dieci secondi a 2560×1440 e 60 fps. LUMA usa la geometria Blender originale e fotografie Cycles da 2880×1620 per una nuova traiettoria e un riflesso che attraversa l’ottica. La campagna ricompone a risoluzione doppia i tre supporti e le loro rotazioni. Le versioni leggere sono 1280×720 a 30 fps, con il medesimo montaggio. Copertine e miniature derivano dai nuovi film. I tagli portrait usano i master dedicati dell’edizione Director.

Le ricette, la descrizione dei materiali e le istruzioni di produzione sono in `scripts/elegant-films/`. Verifiche dei frame, dei loop, del bitrate e hash sono in `outputs/reentry-20261109/films/`.

## Edizione Director del 6 novembre 2026

- **Ingresso.** Su telefono il film di 2,8 secondi deriva dalla scena Blender originale dello studio. Camera verticale, illuminazione, materiali del fondale e monitor fotografici sono preparati da `scripts/director-mobile-studio.py`. Il desktop carica la geometria originale e avvicina il monitor tramite Three.js.
- **Acqua.** Si usa la ripresa macro UHD di Film Composite su Pexels. Il profilo per telefono è codificato direttamente dal negativo UHD a 720×900, 24 fps. La copertina mostra la corona dopo l’impatto. Ricetta in `scripts/director-phone-water.py`. [Provenienza e licenza](./ASSET-WATER.md).
- **SHIFT PHASE 01.** Il macro del jog wheel usa una nuova esposizione Cycles nella stessa prospettiva della fotografia presente nel negozio. Il montaggio prosegue nelle cinque demo reali. Il film campagna ricompone verticale, quadrato e banner dal medesimo campionatore modellato. Crediti e ricette in `scripts/director-shift/`.
- **LUMA, CACAO e progettazione.** Nuove fotografie Cycles e animazione per riproiezione, materiali ottici, lamina illuminata di taglio e pass di linee dalla stessa camera del plastico. Crediti e ricette in `scripts/director-craft/`. Ogni servizio ha una distribuzione HD widescreen a 60 fps, una panoramica 720p a 30 fps per la rete lenta e una 720×900 a 30 fps per telefono.

## Edizione precedente del 6 novembre 2026, mattina

Questa edizione utilizzava la serie `flagship-*`. L’apertura riutilizzava lo studio Blender e adatta la texture del monitor alla nuova impaginazione e al fotogramma iniziale dell’acqua.

- **Acqua.** Macro fotografica di Film Composite, video Pexels 16392049, girata a 3840×2160 e 24 fps. Taglio cronologico, color grading, raccordo del loop e variante verticale prodotti per la homepage. Provenienza e licenza in [ASSET-WATER.md](./ASSET-WATER.md).
- **SHIFT PHASE 01.** Campionatore originale modellato per la demo. Le fotografie Cycles, le sue viste di dettaglio e le schermate del negozio alimentano i film web e campagna. Master e compositing in `outputs/flagship-20261106/shift/`. Le altre quattro demo web riutilizzano gli artwork Higgsfield documentati in `ASSET-WEB-REEL-VISUALS.json`.
- **LUMA.** Corpo, ottica e comandi nella scena `outputs/flagship-20261106/luma/luma-optical-bench.blend`. Le tre inquadrature di ogni profilo partono da immagini Cycles ad alta definizione proiettate sulla geometria originale per animare la camera. Il fondale usa un pass ombre separato. Consegna 1920×1080 e 864×1080 a 60 fps.
- **CACAO ATELIER e progetti.** I movimenti del cofanetto e le quattro fasi della maquette provengono dalle scene Blender del progetto. La nuova edizione integra macro fotografiche Cycles. Master e preparazione in `outputs/flagship-20261106/brand/` e `funding/`.

## Archivio della produzione del 5 novembre 2026

La revisione locale del **5 novembre 2026**, richiesta con Blender e Higgsfield, conserva struttura, testi, demo e regia della homepage. La rifinitura comprende dieci film dei servizi con fotogrammi Blender nativi a 60 fps, tutti installati e verificati; l’acqua Higgsfield e la geometria dello studio rimangono invariate. **Consegna locale completata; nessuna pubblicazione di questa lavorazione.**

I nuovi film e poster hanno prefisso `refined-*`; l’acqua conserva `recreated-water-*`. L’installazione validata con `scripts/install-refined-motion-20261105.py` è registrata in [ASSET-MOTION-REFINEMENT-20261105.json](./ASSET-MOTION-REFINEMENT-20261105.json), con hash e specifiche dei dieci film. `ASSET-RECREATED-20261105.json` documenta la precedente produzione: i suoi hash e controlli non attestano i nuovi asset. I materiali invariati mantengono la propria provenienza. Peso dei film dei servizi: 24.587.041 byte; totale dei dodici MP4 attivi: 27.979.409 byte; cinque miniature WebP: 20.062 byte.

## Studio iniziale — Blender e Three.js

`scripts/studio-blender-20261105.py` crea uno studio immaginario originale: architettura minerale, scrivanie e pannelli in noce, sedie in tessuto, metalli, computer, lampade, libri e accenti lime. La venatura del noce è una piccola texture matematica originale incorporata nel modello. Non sono stati scaricati modelli, texture o HDR esterni.

Il master `outputs/studio-blender-20261105/space-studio-master.blend` contiene geometria e curve di assemblaggio/camera campionate a 30 fps per l’ispezione. Il GLB web `public/models/studio-space-20261105.glb` rimane di 635.496 byte, con 19 mesh, 19.020 triangoli e 17 gruppi. Contiene la posa assemblata e i metadati; `src/studio-blender-room.js` applica le pose in tempo reale sotto `src/atelier-entry.js`. La cadenza del master non promette FPS nel browser.

Il monitor riceve la texture della hero adattata al viewport, con poster e testo. Restano dolly frontale, skip e fallback `src/studio-room.js`. La rifinitura rende il tempo dell’assemblaggio indipendente dal download e dà precedenza di rete a stanza/font/poster: sono modifiche del runtime, non della geometria. Blender 5.2.1 LTS ha esportato e reimportato il GLB; ricevute in `outputs/studio-blender-20261105/validation.json`, `browser-proof.json` e `lifecycle-proof.json`.

## Acqua — Higgsfield, invariata

`recreated-water-desktop.mp4` e `recreated-water-mobile.mp4` derivano da **Higgsfield / Seedance 2.5**, job `fb17b779-179c-46d9-aca4-0bfced1c0954`. Il prompt descrive acqua macro su fondo nero con riflessi argento e un lieve bordo lime. È un film generativo, non una ripresa reale o una simulazione Blender.

Fonte desktop 1920×1080 a 24 fps; export silenziosi di 9,5 secondi e 228 frame. Il desktop conserva la risoluzione nativa, il mobile è un crop centrale 608×1080. Una dissolvenza di 0,5 secondi raccorda la chiusura; non è interpolazione ottica. Poster e ingresso usano il punto 4,6 s. Sorgente, prompt e job sono in `outputs/recreate-20261105/source/water.mp4`, `prompts.json` e `higgsfield-jobs.json`.

## Film dei servizi — produzione nativa a 60 fps

Tutti i profili desktop sono 1920×1080 e quelli mobile 720×900 nativi. I render usano Blender/EEVEE, qualità di produzione `balanced`: 32 campioni, senza ray tracing. Il formato di consegna è H.264 High 4.2, yuv420p, silenzioso e faststart. Non si usano upscale, interpolazione ottica o frame duplicati per aumentare la cadenza. I controlli finali dei file restano distinti dalle misure di riproduzione nel browser.

La radice dei master e delle ricevute è `outputs/motion-refinement-20261105/`. Nella tabella `{profile}` indica `desktop` oppure `mobile`; ogni cartella contiene `{asset}.mp4` e `poster.jpg`.

| Asset e durata | Script di scena | Master di produzione nella radice |
| --- | --- | --- |
| Web — 10 s / 600 frame | `scripts/refine-web-funding-20261105.py` | `web/{profile}/web.blend` |
| CACAO — 8 s / 480 frame | `scripts/refine-products-motion-20261105.py` | `brand/{profile}/brand-balanced.blend` |
| LUMA — 8 s / 480 frame | `scripts/refine-products-motion-20261105.py` | `product/{profile}/product-balanced.blend` |
| SHIFT — 8 s / 480 frame | `scripts/refine-campaign-motion-20261105.py` | `campaign/{profile}/shift-motion-balanced.blend` |
| Bandi — 12 s / 720 frame | `scripts/refine-web-funding-20261105.py` | `funding/{profile}/funding.blend` |

I vecchi master e `scene.json` delle prove prodotti/SHIFT a 64 campioni non sono i master di produzione: usare i nomi `*-balanced.blend` e i rispettivi `scene-balanced.json`. Web e funding mantengono i nomi `web.blend` e `funding.blend`. Codifica e verifiche sono in `refine-products-delivery-20261105.py`, `refine-campaign-motion-20261105.py` e `refine-web-funding-delivery-20261105.py`. L’installatore genera inoltre cinque miniature WebP da 320×180 dai poster desktop.

### Web e identità delle demo

`refined-web.mp4` e la variante mobile mostrano schermi fisici, cornici, appoggi e camera originali. Ogni demo occupa due secondi del film. Le superfici usano le catture delle cinque demo del progetto in `outputs/web-reel/screens/desktop/` e `mobile/`: incorporano i materiali delle demo, non sono immagini interamente generate da Blender.

Le cinque identità originali in `public/showcase/index.html` sono **SHIFT**, **VELA**, **NOVA**, **BASILICO** e **OLTRE**. Il parametro `scene` seleziona `shift`, `vela`, `nude`, `basilico` o `oltre`; `nova` è un alias. Carrello, prenotazioni e moduli sono dimostrazioni locali, senza pagamenti o invii a terzi.

| Visual nelle demo | Origine |
| --- | --- |
| `public/images/reel-sneaker.jpg` | Scarpa fittizia, image_gen |
| `public/images/reel-lamp.jpg` | Lampada fittizia, image_gen |
| `public/images/reel-skincare.jpg` | Packaging beauty fittizio, image_gen |
| `public/images/reel-food.jpg` | Gastronomia illustrativa, image_gen |

Le quattro immagini sono raster originali 1536×1024 nativi, non fotografie di prodotti reali o modelli 3D. Prompt, master e hash sono in [ASSET-WEB-REEL-VISUALS.json](./ASSET-WEB-REEL-VISUALS.json). Il visual di seta OLTRE resta documentato in [ASSET-ATELIER-VISUALS.json](./ASSET-ATELIER-VISUALS.json).

### CACAO ATELIER

Il cofanetto terracotta/cacao/avorio conserva geometria, lettering, materiali e tavolette originali. Il coperchio ruota sulla cerniera fisica 28°→100°→28°, con sollevamento contenuto della tavoletta e movimento continuo della camera. Collisioni, inquadrature e continuità del loop sono documentate nei master riaperti. I font di sistema sono rasterizzati nei film, senza distribuzione dei binari.

`brand/{profile}/delivery.json`, `loop-master.json`, `loop-pixels.json` e `cadence.json` attestano la produzione consegnata. Le prove Higgsfield e i precedenti render a 30 fps restano archivio.

### LUMA

`refined-product.mp4` e la variante mobile sono animazioni Blender native della fotocamera fittizia, con corpo e lettering originali, tre gruppi ottici e due elementi interni aggiunti. Coating, grafite, titanio e luci definiscono le superfici; camera e trasformazioni degli oggetti hanno moto periodico continuo.

Questi film sostituiscono l’animazione generativa precedente: i job Higgsfield non sono la fonte dei nuovi fotogrammi. Ricevute per profilo in `product/{profile}/delivery.json`, `loop-master.json`, `loop-pixels.json` e `cadence.json`; riepilogo in `products-delivery-summary.json`.

### Campagna SHIFT

Tre pannelli, cornici, illuminazione e camera originali Blender. Gli artwork derivano dalle composizioni HTML originali e dalle immagini AI preesistenti della sneaker, conservati in `outputs/recreate-20261105/source/shift-*.png`. La nuova animazione applica trasformazioni rigide periodiche e una lieve orbita/dolly: nessuna deformazione delle texture.

I master di partenza rimangono in `outputs/recreate-20261105/campaign/`; i nuovi master di produzione sono quelli `shift-motion-balanced.blend` della tabella. Il frame 481 coincide con il primo ed è solo un controllo del loop; gli MP4 contengono 480 frame. Ricevute in `campaign/manifest.json`, `delivery.json`, `probe.json` e `loop-metrics.json`. Il confronto di codifica pre-roll resta archivio, non la consegna scelta.

### Progetti e bandi

Quattro atti di tre secondi mostrano idea, disegno condiviso, candidatura piegata e maquette di uno spazio comunitario. Geometria, materiali, camera e movimento sono originali Blender; non sono usate immagini esterne o generazioni Higgsfield. Testi e quattro fasi HTML rimangono quelli del sito. L’illustrazione non rappresenta un finanziamento ottenuto e non promette contributi.

Il metodo finale approvato sostituisce **152 frame di transizione per profilo** — 143–180, 323–360, 503–540 e 683–720 — con due pass opachi, renderizzati allo stesso istante nativo a 60 fps e con la stessa camera. `scripts/refine-funding-opaque-passes-20261105.py` produce i pass; `scripts/refine-funding-composite-20261105.py` applica il crossfade con l’easing originale in **sRGB linearizzato dopo la trasformazione AgX**, poi ricodifica sRGB. Non vengono sintetizzati istanti intermedi. I frame opachi validi rimangono invariati.

Il compositing evita la grana della trasparenza stocastica e gli errori di ordinamento dei materiali alpha. Il master contiene geometria e animazioni editabili e il testo della pipeline; le curve alpha conservano il raccordo narrativo per l’anteprima, ma il film finale usa i due render opachi. Pass, ricevute e metadati sono in `funding/{profile}/transition-passes/`, `opaque-pass-run.json` e `composite-delivery.json`. Entrambi i film completi hanno superato decodifica, controllo dei 720 frame, loop e integrazione; tutti i 152 raccordi per profilo sono presenti. I `delivery.json` conservano i risultati, distinti dalle prove di approvazione del metodo.

## OSKEN — acquisizione e adattamento

[OSKEN 1.0.0](https://horizonx.so/explore/osken) è stato acquisito dalla Premium Library HorizonX il 5 novembre, su approvazione dell’utente. La ricevuta `outputs/horizon-osken-20261105/ACQUISITION.json` registra versione, integrità dello ZIP, hash, consumo di un posto personale giornaliero e uno premium mensile, e licenza commerciale per uso/adattamento del progetto. I residui annotati descrivono il momento dell’acquisizione, non un saldo corrente garantito.

L’adattamento iniziale di `ProjectDeck` usava scala e prospettiva. Dal 10 novembre `src/atelier-osken-motion.js/.css` mantengono la superficie poster/video aderente alla cornice, con un ingresso di sola opacità in 420 ms, per eliminare i margini scoperti. `src/cinema-viewer.js/.css` adattano l’espansione di `Showreel` alla vista cinema esplicita di 460 ms. Nessun deck di articoli da 600 vh, slideshow, immagine, font, marchio o dipendenza React/Motion/Lenis è importato. Testi, gerarchia HTML, accessibilità e politica autoplay restano nel controller Space. Il port è documentato in `ADAPTATION.md`.

La membership consente l’adattamento commerciale del progetto e vieta la redistribuzione del sorgente/template originale. ZIP e copia raw restano in `outputs/horizon-osken-20261105/source/`, esclusi dal repository pubblico e dalla build. Halvane AR, Cyber Jackets e CoverFlow rimangono ricerca non acquisita; non condividono la ricevuta OSKEN.

## Versioni precedenti e diritti conservati

- **Produzione `recreated-*` del 5 novembre:** `ASSET-RECREATED-20261105.json` conserva specifiche/hash e i master in `outputs/recreate-*/`. Web e funding erano render Blender a 30 fps; CACAO usava `recreate-brand-motion-20261105.py`, 8 s/240 frame. Le prove Higgsfield CACAO `983a1116-4a0d-49e4-8361-b6aff02f94c8` e `85b7785f-9fb3-476a-bade-94477a5b8686` non sono mai state il film definitivo.
- **LUMA e SHIFT generativi precedenti:** reference dei nuovi master originali e animazione Higgsfield/Seedance 2.5, 8 s/192 frame a 24 fps. LUMA: desktop `58084179-af8b-45bc-8c5f-fad093905278`, portrait `98115892-cd8c-4afe-bccd-15d5b29fa60a`. SHIFT: desktop `a13758e1-f4e3-481a-98fc-d569191c19c4`, portrait `ca3688dd-ac4c-418d-a94d-d7d8c041d36b`. Desktop 1920×1080; portrait 1248×1664 ritagliato a 1248×1560 e ridotto a 720×900. Sorgenti/job/report in `outputs/recreate-20261105/`, codifica `recreate-delivery-20261105.py`. La geometria di riferimento non certificava ogni frame generativo; i job non attestano i nuovi `refined-*`.
- **Acqua stock:** Film Composite, [Pexels 16392049](https://www.pexels.com/video/a-drop-of-water-in-a-bowl-with-a-black-background-16392049/), secondo la [licenza Pexels](https://www.pexels.com/license/). Export `atelier-water-*`: 1920×1080 e 640×900, 11,5 s/24 fps, senza audio. Non è pubblico dominio né CGI dello studio; origine in `ASSET-ATELIER.json` e `ASSET-WATER.*`. La licenza non si applica all’acqua Higgsfield attuale.
- **Prima vetrina CACAO/LUMA:** render `showcase-brand*`/`showcase-product*` a 48 fps; manifest `ASSET-SHOWCASE-BRAND-20261105.json` e `ASSET-SHOWCASE-PRODUCT-20261105.json`. **Percorso SVG:** `src/funding-journey.js/.css`, 22 s, poster `funding-journey*.svg`, ricevuta `ASSET-FUNDING-JOURNEY-20261105.json`.
- **Reel e campagna CSS 3D:** `ASSET-MOTION-WEB-20261104.json`, `ASSET-MOTION-CAMPAIGN-20261104.json` e `ASSET-CINEMA-CAMPAIGN.json`. L’inserto SHIFT precedente era Higgsfield/Seedance 2.5 job `81af6305-30fb-4ff1-88dc-7e1b26635568`, 1920×1080/24 fps, 193 frame, 8,041667 s.
- **FORMA, ORA e dossier:** `ASSET-MOTION-BLENDER-20261104.json`, `ASSET-MOTION-PRODUCT-20261104.json` e `ASSET-CINEMA-BLENDER.json`. Anche AVANT, SPAZIO e Launch Room restano archivio. Fatti, job, diritti e controlli storici non vengono attribuiti ai nuovi concept.

Three.js usa licenza MIT, con avviso in `public/licenses/three-MIT.txt`. Space Grotesk e DM Mono sono locali con copie OFL in `public/fonts/`. Codice, interfacce, testi, diagrammi e scene originali restano materiali del progetto; la pubblicazione del repository non concede una licenza generale sulle composizioni. Apple e Lusion sono riferimenti di regia, senza asset o codice incorporati.

Tutti gli esempi sono non commissionati: non documentano clienti acquisiti, commesse o risultati. I cinque form preparano bozze WhatsApp e il visitatore decide l’invio. Master e sequenze native restano in `outputs/`, esclusi dal sito pubblico. Le verifiche dei materiali, del browser e della pubblicazione sono distinte.

**Consegna e QA finale PASS:** `outputs/motion-refinement-20261105/FINAL-QA.json` e `final-assets-report.json` attestano dieci film installati, 30 hash coerenti fra produzione/`public/`/build e 30 casi autoplay Chrome/WebKit. `final-tests.log` e `final-build.log` registrano 41 gruppi passati e build riuscita; 174 frammenti di testo e vincoli dei form sono preservati. I gate manuali reduced motion hanno raggiunto `readyState` 4 e circa 0,60 s di avanzamento in entrambi i browser.

La misura desktop su questo Mac, 1440×900 senza Blender concorrente, comprende due campioni di cinque film per quattro secondi: 1.205 frame decodificati/zero scarti nel primo; 1.202 frame al compositore/uno scarto nel secondo. È circa 60 fps in questa prova, non una garanzia universale. Le callback JavaScript possono aggregarsi (mediana 16,7 ms, p95 fino a 33,4 ms). Ricevute `final-cadence-chrome.txt` e `final-cadence-compositor-chrome.txt`; limiti e ulteriori verifiche nel [README](./README.md#verifiche). Nessun commit, push o deploy eseguito.
