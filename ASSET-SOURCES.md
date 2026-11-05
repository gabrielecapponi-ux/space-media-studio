# Provenienza dei materiali — Space Media Studio

La revisione del **5 novembre 2026** combina uno studio Three.js, un film stock d’acqua, quattro film di servizio e un percorso SVG. Le origini restano distinte: i nuovi cofanetto e fotocamera sono geometria Blender originale; il percorso progetti è vettoriale; web e campagna usano composizioni CSS 3D. Non sono tutti film generativi o modelli interattivi.

## Studio iniziale e acqua

`src/studio-room.js` è una scena Three.js originale: stanza, arredi, computer, luci e logo si assemblano prima dello zoom nel monitor. Lo studio è immaginario, senza modelli GLB o HDR esterni. La regia approvata di ingresso, hero, acqua e monitor rimane; `src/atelier.js` collega anche il nuovo percorso progetti.

L’acqua è fotografia stock di **Film Composite**, [Pexels 16392049](https://www.pexels.com/video/a-drop-of-water-in-a-bowl-with-a-black-background-16392049/), secondo la [licenza Pexels](https://www.pexels.com/license/) e con credito nel footer. Non è pubblico dominio o una simulazione CGI dello studio. Gli export conservati sono 1920×1080 e 640×900, 11,5 secondi a 24 fps, senza audio. Origine e lavorazioni in [ASSET-ATELIER.json](./ASSET-ATELIER.json) e `ASSET-WATER.*`.

## CACAO ATELIER — identità Blender

`showcase-brand.mp4` e `showcase-brand-mobile.mp4`, con i rispettivi poster, mostrano un cofanetto di cioccolato di un marchio fittizio originale. Fondo, pareti, vassoio, coperchio incernierato, tipografia, dettagli in lamina e tavolette con rilievi sono geometria e materiali originali del progetto. Il coperchio si apre, rivela il contenuto, accompagna un dettaglio e si richiude; camera e softbox seguono la regia. Non ci sono fogli di presentazione o confezioni cilindriche in questo concept.

I due profili Blender dedicati sono 1920×1080 e 720×900 nativi, sei secondi, 288 frame per profilo a 48 fps. Render EEVEE con materiali procedurali e luci di studio; nessun modello o texture scaricati, generazione AI o interpolazione ottica. I font di sistema sono rasterizzati nei film, senza distribuzione dei binari.

Sorgenti: `scripts/showcase-brand-20261105.py`, `showcase-brand-20261105-runner.py`, `showcase-brand-20261105-pixels.py`. Master e fotogrammi rimangono in `outputs/showcase-brand-20261105/`. Provenienza e controlli sono raccolti in [ASSET-SHOWCASE-BRAND-20261105.json](./ASSET-SHOWCASE-BRAND-20261105.json).

## LUMA — CGI prodotto Blender

`showcase-product.mp4` e `showcase-product-mobile.mp4`, con i rispettivi poster, mostrano una fotocamera di design fittizia. Corpo, appoggi, ghiere, materiali e tre gruppi ottici cavi sono originali. I gruppi si separano lungo l’asse ottico, sostano e rientrano; il corpo mantiene l’appoggio. Camera e riflessi accompagnano la sequenza. Non è una fotocamera realmente prodotta, un modello acquisito o un filmato AI.

Profili nativi 1920×1080 e 720×900, camere dedicate, sei secondi e 288 frame per profilo a 48 fps. Geometria, materiali procedurali, illuminazione e movimento Blender; nessuna texture esterna, interpolazione ottica, riproduzione inversa o aumento della risoluzione. I caratteri di sistema sono rasterizzati, senza ridistribuzione dei font.

Sorgenti: `scripts/showcase-product-20261105.py` e `showcase-product-20261105-delivery.py`. Master e fotogrammi rimangono in `outputs/showcase-product-20261105/`. Provenienza e controlli in [ASSET-SHOWCASE-PRODUCT-20261105.json](./ASSET-SHOWCASE-PRODUCT-20261105.json).

## Percorso progetti — disegno originale

`src/funding-journey.js` e `src/funding-journey.css` realizzano un’animazione SVG originale di 22 secondi, tratto nero `#101110` su giallo `#dfff00`: idea, scrittura condivisa, candidatura e progetto realizzato come esempio possibile. La linea disegna progressivamente quattro scene, con raccordi e vista d’insieme. I poster sono `public/images/funding-journey.svg` e `funding-journey-mobile.svg`.

Non è un render Blender o un video stock: nessun film viene scaricato per questo servizio. Sono previsti layout panoramico e portrait, pausa, sospensione fuori schermo e vista completa statica. L’illustrazione non attesta l’approvazione di un bando e non promette contributi. Origine e verifiche in [ASSET-FUNDING-JOURNEY-20261105.json](./ASSET-FUNDING-JOURNEY-20261105.json).

## Reel web e demo mantenuti

Le cinque demo in `public/showcase/index.html` hanno identità originali: **SHIFT**, **VELA**, **NOVA**, **BASILICO** e **OLTRE**. Il parametro `scene` seleziona `shift`, `vela`, `nude`, `basilico` o `oltre`; `nova` è un alias. Carrello, prenotazioni e moduli illustrano azioni locali, senza pagamenti o invii a terzi.

Le interfacce sono catturate nel browser alle dimensioni native, animate in prospettiva CSS e codificate con FFmpeg. `motion-web.mp4` e la variante `-mobile` mantengono i profili 1920×1080 e 720×900, dieci secondi e 600 frame per profilo a 60 fps. Transizioni quintiche di 0,6 secondi; nessun nuovo render del reel in questa revisione. Sorgenti e controlli dei materiali in [ASSET-MOTION-WEB-20261104.json](./ASSET-MOTION-WEB-20261104.json); timeline `src/web-reel-motion.js`.

| Visual nelle demo | Origine |
| --- | --- |
| `public/images/reel-sneaker.jpg` | Scarpa fittizia, image_gen |
| `public/images/reel-lamp.jpg` | Lampada fittizia, image_gen |
| `public/images/reel-skincare.jpg` | Packaging beauty fittizio, image_gen |
| `public/images/reel-food.jpg` | Gastronomia illustrativa, image_gen |

Le quattro immagini sono raster originali a 1536×1024 nativi, non fotografie di prodotti reali o modelli 3D. Prompt, master e hash in [ASSET-WEB-REEL-VISUALS.json](./ASSET-WEB-REEL-VISUALS.json). Il visual di seta nella demo OLTRE rimane documentato in [ASSET-ATELIER-VISUALS.json](./ASSET-ATELIER-VISUALS.json).

## Campagna SHIFT mantenuta

`motion-campaign.mp4` e `motion-campaign-mobile.mp4` mantengono tre formati pubblicitari su piani CSS 3D: presentazione centrale, apertura sfalsata, pausa leggibile e ricomposizione. Profili 1920×1080 e 720×900 nativi, sei secondi e 360 frame per profilo a 60 fps. Nessun nuovo film generativo viene richiesto per questa revisione.

Il film interno è il precedente sorgente **Higgsfield / Seedance 2.5**, job `81af6305-30fb-4ff1-88dc-7e1b26635568`: HEVC 10 bit, 1920×1080, 24 fps, 193 frame e 8,041667 secondi. La scarpa e il nastro sono video generativo, non una mesh o una simulazione fisica documentata. La composizione campiona il sorgente alla sua cadenza; la chiusura dissolve negli ultimi 24 frame verso la prima immagine, senza interpolazione ottica. Provenienza e controlli in [ASSET-MOTION-CAMPAIGN-20261104.json](./ASSET-MOTION-CAMPAIGN-20261104.json) e [ASSET-CINEMA-CAMPAIGN.json](./ASSET-CINEMA-CAMPAIGN.json).

## Horizon-3d — ricerca, nessuna acquisizione

Sono state consultate le schede pubbliche e osservate le anteprime video ufficiali di [Halvane AR](https://horizonx.so/explore/halvane-ar), [Cyber Jackets](https://horizonx.so/explore/cyber-jackets) e [OSKEN](https://horizonx.so/explore/osken). Al 5 novembre tutte sono **Premium Library**; ciascuna richiederebbe un posto del tetto personale giornaliero e uno premium mensile. Halvane dichiara HTML/Three.js r180, Cyber Jackets Three.js/Vite, OSKEN React19/Tailwind4/Motion/Lenis. La fattibilità finale richiede l’esame dei file dopo una scelta autorizzata.

Nessun asset è stato acquisito o integrato; i saldi di novembre non sono riconciliati e non sono assunti disponibili. CoverFlow era stato scelto in ottobre ma non scaricato; la sua scheda attuale è Premium. Nessun sorgente Horizon è nel repository pubblico. I [termini correnti](https://horizonx.so/terms) richiedono membership per l’impiego commerciale degli asset della piattaforma e vietano la redistribuzione dei sorgenti raw.

## Archivio, font e diritti

Il cilindro FORMA, il profumo ORA e il dossier rimangono documentati come archivio in [ASSET-MOTION-BLENDER-20261104.json](./ASSET-MOTION-BLENDER-20261104.json), [ASSET-MOTION-PRODUCT-20261104.json](./ASSET-MOTION-PRODUCT-20261104.json) e [ASSET-CINEMA-BLENDER.json](./ASSET-CINEMA-BLENDER.json). I loro fatti, job generativi, specifiche, controlli e hash sono preservati: non vengono attribuiti ai nuovi concept. Anche le produzioni AVANT, SPAZIO e Launch Room restano archivio.

Three.js usa licenza MIT, con avviso in `public/licenses/three-MIT.txt`. Space Grotesk e DM Mono sono locali con copie OFL in `public/fonts/`. Codice, interfacce, testi, diagrammi e scene originali restano materiali del progetto; la pubblicazione del repository non concede una licenza generale sulle composizioni. Apple e Lusion sono riferimenti di regia, senza asset o codice incorporati.

Tutti gli esempi sono non commissionati: non documentano clienti acquisiti, commesse o risultati. I cinque form preparano bozze WhatsApp e il visitatore decide l’invio. Master e sequenze native rimangono in `outputs/`, esclusi dal sito pubblico. I controlli dei materiali, del browser locale e della pubblicazione sono distinti; stato e limiti nel [README](./README.md#verifiche).
