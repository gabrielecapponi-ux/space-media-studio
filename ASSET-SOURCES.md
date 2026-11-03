# Provenienza dei materiali — Space Media Studio

La homepage corrente (`index.html`) e l’alias `atelier.html` conservano l’ingresso nello studio e l’apertura con acqua. Il resto del percorso usa cinque film Blender originali, tre dettagli fotografici AI e una texture architettonica AI incorporata nel film web. Le immagini concept precedenti rimangono documentate come archivio. I materiali hanno origini e funzioni diverse.

## Studio 3D e film d’acqua

La stanza in `src/studio-room.js` è una scena Three.js originale: pareti, arredi, computer, luci e logo vengono assemblati prima dello zoom nel monitor. È uno spazio immaginario, non una fotografia o un rilievo della sede di Parma. Non richiede GLB, HDR o modelli esterni. Il ripiego CSS è originale. La callback `drawScreen` adatta il display alla pagina in arrivo; geometrie e camera dell’introduzione approvata sono conservate.

Il film macro dell’acqua è **fotografia stock in slow motion di Film Composite**, [Pexels 16392049](https://www.pexels.com/video/a-drop-of-water-in-a-bowl-with-a-black-background-16392049/), con [licenza Pexels](https://www.pexels.com/license/). È autorizzato per uso web secondo le condizioni della licenza; non è pubblico dominio, una ripresa Space o una simulazione CGI. Crediti e natura stock sono riportati nel footer.

Gli export `atelier-water-desktop.mp4` e `atelier-water-mobile.mp4` sono rispettivamente 1920×1080 e 640×900, 11,5 secondi a 24 fps, H.264 senza audio. Poster e primo avvio automatico usano il momento della colonna a circa 4,6 secondi; i loop successivi ripartono in avanti dall’inizio. [ASSET-ATELIER.json](./ASSET-ATELIER.json) e i documenti storici `ASSET-WATER.*` conservano origine, lavorazioni, specifiche e hash.

## Immagini dei quattro concept

| File | Contenuto e origine |
| --- | --- |
| `public/images/launch-brand.jpg` | Identità FORMA: generazione image_gen, poi edit con lo stesso tool per rimuovere microtesti di contatto, indirizzo e anno |
| `public/images/launch-architecture.jpg` | Architettura contemporanea in travertino: generazione image_gen |
| `public/images/launch-product.jpg` | Fragranza ORA, vetro e liquido ambrato: generazione image_gen |
| `public/images/launch-campaign.jpg` | Installazione di seta gialla per SPAZIO: generazione image_gen |
| `public/images/atelier-brand-detail.jpg` | Nuovo dettaglio FORMA, generato con image_gen usando il visual originale come riferimento |
| `public/images/atelier-product-detail.jpg` | Nuovo dettaglio ORA, generato con image_gen usando il visual originale come riferimento |
| `public/images/atelier-campaign-detail.jpg` | Nuovo dettaglio SPAZIO, generato con image_gen usando il visual originale come riferimento |

Le sette immagini sono raster **1672×941 nativi**, senza upscaling. Le quattro originali totalizzano 1.145.984 byte; i tre nuovi JPEG 812.292 byte. Master PNG locali, prompt, identificatori e SHA-256 sono documentati in [ASSET-LAUNCH-ROOM.json](./ASSET-LAUNCH-ROOM.json) e [ASSET-ATELIER-VISUALS.json](./ASSET-ATELIER-VISUALS.json).

FORMA, AVANT, ORA e SPAZIO sono scenari dimostrativi, non clienti o commesse. I visual non documentano prodotti, edifici o eventi reali; non sono dichiarati stock di pubblico dominio. Parallasse e movimento d’impaginazione non trasformano le fotografie in mesh o fotogrammi di un film 3D. La scena AVANT è ora un render Blender di superfici di interfaccia; incorpora il visual architettonico come texture. Non è un sito cliente né una mesh web navigabile.

## Film tipografico originale

`public/films/atelier-type-desktop.mp4` e `atelier-type-mobile.mp4` presentano il motion study di SPAZIO. La produzione avviene localmente in Blender: geometrie tipografiche, materiali, luci e camera originali. Il film è distinto dalle immagini AI della seta e non ne simula il tessuto.

I profili web verificati sono **1920×1080 e 720×900**, cinque secondi a 24 fps nativi, 120 fotogrammi. Master `.blend` e sequenze PNG rimangono in `outputs/nov26/motion/`; poster e MP4 sono le copie web. [ASSET-ATELIER-MOTION.json](./ASSET-ATELIER-MOTION.json) registra gli esiti finali di produzione, reimportazione, codifica e decodifica. Non vengono dichiarati 4K, 60 fps o interpolazione.

## Quattro nuovi film di servizio

I film `service-brand.mp4`, `service-web.mp4`, `service-product.mp4` e `service-funding.mp4` sono originali Blender. Modellazione, superfici, tipografia, camera, luci e trasformazioni periodiche sono create per questa pagina. FORMA rende fisico un sistema di identità; AVANT mostra livelli desktop/mobile; ORA mette in scena il flacone e il vetro; il dossier illustra la progettazione. Il film SPAZIO già approvato resta il quinto capitolo.

Master e fotogrammi numerati sono conservati in `outputs/motion-services/`. Gli script riproducibili sono `scripts/render-service-scenes-a.py` e `scripts/render-service-scenes-b.py`. Specifiche native, motore, tempi di rendering, hash, verifica dei master e decodifica sono registrati in [ASSET-SERVICE-MOTION.json](./ASSET-SERVICE-MOTION.json). Nessun film nuovo proviene da stock, API a pagamento o interpolazione di immagini AI. L’unica texture AI nei nuovi render è l’architettura dichiarata di AVANT.

## Software, font e contenuti

- Three.js 0.186.1: MIT; avviso in `public/licenses/three-MIT.txt`.
- Space Grotesk: [repository ufficiale](https://github.com/floriankarsten/space-grotesk), SIL Open Font License 1.1; copia locale in `public/fonts/SpaceGrotesk-OFL.txt`.
- DM Mono: pacchetto skill fornito dall’utente, SIL Open Font License; copia locale in `public/fonts/DMMono-OFL.txt`.
- Logo, testi, interfacce, dossier progettuale, scena dello studio e motion tipografico: composizioni originali del progetto.

Font, film e immagini sono serviti localmente. I cinque form preparano bozze WhatsApp; non inviano messaggi automaticamente. Il dossier di progetti e bandi contiene categorie e diagrammi illustrativi, senza importi o finanziamenti attribuiti e senza promesse di ammissibilità.

Lusion e il linguaggio editoriale Apple sono riferimenti di composizione e movimento; non vengono incorporati loro asset o codice. Horizon CoverFlow non è acquisito o integrato. La vecchia prova ComfyUI/LTX non ha prodotto fotogrammi e non fornisce media al sito corrente.

## Archivio e verifica

`src/launch-room.js`, `src/scene-objects.js` e i relativi studi documentano un percorso sperimentale precedente, non caricato dalla homepage attuale. I media e i manifest storici conservano il proprio ambito e le eventuali licenze di terzi. La pubblicazione dei sorgenti non concede una licenza generale delle composizioni originali.

Le verifiche correnti del sito, i viewport e le condizioni delle misure sono raccolti nel [README](./README.md#verifiche). I manifest dei film registrano separatamente verifiche di master, inquadratura, contatto, decodifica e continuità. Le immagini native e il confronto dei fotogrammi completano i controlli strutturali delle animazioni: la sola chiusura delle trasformazioni non attesta la continuità ottica.
