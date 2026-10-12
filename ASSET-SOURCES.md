# Provenienza dei materiali

Versione a quattro capitoli, 12 ottobre 2026. Il sito corrente usa **quattro film CGI originali**, poster estratti dai film, logo originale e font locali. Nessuna fotografia o ripresa stock è caricata dal sito.

## Quattro scene Blender originali

Geometria, materiali, camera, luci, tipografia e coreografia sono realizzati nel progetto con `scripts/render-four-services.py`. I soggetti sono un'identità coordinata, un laptop con interfaccia originale, un flacone di fragranza e una campagna per cuffie. I movimenti illustrano rispettivamente composizione del brand, apertura del dispositivo, dettagli del prodotto e variazioni del formato pubblicitario.

Tutti i visual sono **concept dimostrativi**, non lavori commissionati o prodotti commerciali in vendita. I nomi nei render sono illustrativi e non dichiarano affiliazioni a marchi esistenti.

- Render nativo: **3840×2160, 60 fps**, senza upscaling o interpolazione.
- Export pubblico 4K: `public/films/four-{identity,web,cgi,campaigns}-4k.mp4`.
- Export Full HD: `public/films/four-{identity,web,cgi,campaigns}-desktop.mp4`.
- Export mobile Full HD: `public/films/four-{identity,web,cgi,campaigns}-mobile.mp4`, **1920×1080 a 60 fps**, senza crop o padding.
- Poster: `public/images/four-{identity,web,cgi,campaigns}-{desktop,mobile}.jpg`, estratti dagli stessi render originali.
- Master e scene Blender: `outputs/four-services/`, esclusi dalla build e dal repository.

Pipeline locale **Blender + FFmpeg**, senza Higgsfield, servizi a pagamento, modelli scaricati o pesi AI. La skill `video-non-higgsfield` è stata applicata alla scelta della pipeline locale e alle verifiche; questa produzione è CGI deterministica, non video generato da un modello AI.

[ASSET-FOUR-SERVICES.json](./ASSET-FOUR-SERVICES.json) registra engine, campioni, dimensioni, frame rate, durata, hash e verifiche effettive. Il desktop sceglie l'export 4K alla risoluzione originale; il mobile usa Full HD con compressione dedicata. Connessioni lente e problemi di decodifica 4K attivano Full HD su desktop.

Il dialog dei quattro concept riusa questi stessi film e poster, senza introdurre nuove riprese o scene. Il cursore controlla il tempo del loop originale di due secondi: è una vista guidata del film, non un modello navigabile liberamente a 360°.

## Anteprime web originali

Le tre anteprime sono composizioni SVG originali con grafica, testo e poster Blender del progetto incorporati come immagini JPEG. Non contengono script o immagini stock.

| Anteprima | File | Poster incorporato |
| --- | --- | --- |
| Seta / E-commerce skincare | `public/previews/seta-web.svg` | `public/images/four-cgi-desktop.jpg` |
| Forma / Sito essenziale | `public/previews/forma-web.svg` | `public/images/four-identity-desktop.jpg` |
| Nova / Landing di prodotto | `public/previews/nova-web.svg` | `public/images/four-campaigns-desktop.jpg` |

Sono esempi dimostrativi di interfaccia, non siti di clienti né siti completi già realizzati e pubblicati. I nomi hanno funzione illustrativa.

## Font e identità

- **Space Grotesk:** WOFF2 variabile dal [repository ufficiale di Florian Karsten](https://github.com/floriankarsten/space-grotesk), SIL Open Font License 1.1; copia in `public/fonts/SpaceGrotesk-OFL.txt`.
- **DM Mono:** dal pacchetto skill fornito dall'utente, SIL Open Font License; copia in `public/fonts/DMMono-OFL.txt`.
- Logo Space, composizioni, codice UI e scene originali del progetto.

I font web sono serviti localmente. Gli eventuali font di sistema usati per renderizzare il testo tridimensionale restano incorporati nei raster dei film e sono indicati nella pipeline, senza distribuire i file di sistema.

## Reference Horizon e contenuti di servizio

**Horizon CoverFlow** è stato selezionato come riferimento, ma non acquisito né integrato perché richiede un accesso autenticato non disponibile. Nessun codice o asset Horizon è pubblicato nel sito. Le tre anteprime web e la loro presentazione corrente sono realizzate nel progetto; un nome di classe o attributo predisposto per il pattern non indica l'incorporazione di sorgenti Horizon.

La sezione **Progetti & bandi** usa testi ed esempi generali originali per aziende, APS e ASD. Non riporta bandi aperti, scadenze o finanziamenti verificati e non promette ammissibilità o contributi. I cinque moduli creano una bozza WhatsApp tramite richiesta GET; non inviano messaggi automaticamente e non usano un backend di raccolta.

## Iterazioni precedenti

Soft motion study, Studio Orbit, il film d'acqua, le nove anteprime SVG e le tre fotografie dei vecchi concept non sono caricati o distribuiti dalla versione corrente. La loro documentazione resta nei manifest storici e nella cronologia Git. Le fotografie storiche erano soggette a licenza Pexels e mantengono i diritti degli autori; non sono mai state dichiarate di pubblico dominio o produzione fotografica dello studio.

Lusion e il linguaggio di presentazione Apple sono riferimenti di composizione e movimento, senza incorporarne codice o asset. Il manuale 3D WEB LAB fornito dall'utente è un riferimento tecnico interno, escluso dalla distribuzione. Le librerie Studio guidano il lavoro; nessun demo o pacchetto commerciale viene ridistribuito come asset del sito.

La pubblicazione dei sorgenti non modifica le licenze di terze parti né concede una licenza generale di riutilizzo delle composizioni originali.
