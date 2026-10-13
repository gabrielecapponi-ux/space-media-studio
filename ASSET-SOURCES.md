# Provenienza dei materiali — Space / Launch Room

Versione del **12 ottobre 2026**. Il sito corrente usa quattro immagini originali generate con **OpenAI image_gen incorporato**, applicate a superfici tridimensionali costruite nel progetto. Nessuna immagine stock, film CGI storico o risorsa Horizon è inclusa nella presentazione corrente.

## Immagini correnti

| File pubblico | Contenuto | Produzione |
| --- | --- | --- |
| `public/images/launch-brand.jpg` | FORMA, identità illustrativa per un caffè contemporaneo: packaging giallo, tipografia nera, espresso, pietra e stampa | Generazione image_gen; successivo edit con lo stesso tool per rimuovere microtesti di contatto, indirizzo e anno |
| `public/images/launch-architecture.jpg` | Architettura contemporanea in travertino, vetrate scure e luce naturale | Generazione image_gen |
| `public/images/launch-product.jpg` | ORA, fragranza illustrativa in vetro spesso, liquido ambrato, acqua e set scuro | Generazione image_gen |
| `public/images/launch-campaign.jpg` | Installazione di seta gialla, pieghe fisiche e fasci di luce su nero | Generazione image_gen |

Le immagini sono **1672×941 pixel nativi**, circa 16:9. I master PNG sono copiati in `outputs/launch-room/`; FFmpeg produce i JPEG web alla risoluzione originale, senza upscaling. Prompt, identificatori di generazione, byte e SHA-256 sono registrati nel manifest [ASSET-LAUNCH-ROOM.json](./ASSET-LAUNCH-ROOM.json). I master e le prove locali non sono distribuiti dal sito.

Si tratta di **concept dimostrativi generati con AI**, non fotografie documentarie di beni reali, incarichi ricevuti, clienti o prodotti commerciali in vendita. I nomi FORMA, ORA e Spazio hanno una funzione narrativa nel concept e non dichiarano affiliazioni. Le immagini non sono descritte come materiali di pubblico dominio o «senza copyright».

## Scena e superfici 3D

`src/launch-room.js` costruisce una scena Three.js originale con camera prospettica e quattro stazioni. Pannelli con spessore, bordi, retro e materiali illuminati ospitano le immagini; superfici desktop e mobile presentano un'interfaccia disegnata nel progetto; un billboard curvo traduce il visual campagna in un supporto spaziale. Poster, didascalie e interfacce aggiuntive sono texture Canvas originali, composte con i font locali.

**La geometria tridimensionale riguarda la mostra e i supporti.** I soggetti presenti nelle immagini — caffè, edificio, flacone e seta — non sono mesh del progetto. Le immagini sono texture raster e ripieghi HTML. Il sito corrente non distribuisce film renderizzati in Blender o video 4K a 60 fps.

Camera, luci e pose vengono aggiornate in risposta allo scroll nativo e al puntatore fine. Le opzioni del renderer e le cadenze previste dal controller non certificano prestazioni sul dispositivo del visitatore.

## Software, font e identità

- **Three.js 0.186.1**, incluse le utility `RoomEnvironment`: licenza MIT; copia locale in `public/licenses/three-MIT.txt`.
- **Space Grotesk:** font variabile dal [repository ufficiale di Florian Karsten](https://github.com/floriankarsten/space-grotesk), SIL Open Font License 1.1; copia in `public/fonts/SpaceGrotesk-OFL.txt`.
- **DM Mono:** dal pacchetto skill fornito dall'utente, SIL Open Font License; copia in `public/fonts/DMMono-OFL.txt`.
- Logo Space, composizioni dell'interfaccia, testi, supporti tridimensionali e texture Canvas: originali del progetto.

I font e le librerie di produzione vengono serviti localmente o incorporati nella build, senza dipendere da un CDN durante la visita. Le licenze di terze parti mantengono il proprio ambito; la pubblicazione dei sorgenti non concede una licenza generale delle composizioni originali.

## Video Non Higgsfield e Horizon

È stata eseguita una **prova locale ComfyUI/LTX**, separata dal sito. La prova è stata interrotta quando la memoria disponibile è scesa a circa 2,51 GiB, sotto la soglia impostata di 3 GiB, prima di produrre fotogrammi. Stato: `attempted_no_output`. Nessun video generato da questa prova è incluso nella build; non sono stati scaricati nuovi modelli. I dettagli diagnostici restano in `outputs/launch-room/video-preview/`.

**Horizon CoverFlow non è acquisito né integrato.** La scelta precedente non equivale a un download. Nessun sorgente Horizon è incluso nel repository o nella build; nessun download o quota Horizon è stato consumato per la Launch Room. I supporti e le interazioni correnti sono originali del progetto.

## Contenuti di servizio e archivio

Progetti & bandi contiene testi originali ed esempi generali per aziende, APS e ASD. Non riporta bandi aperti, scadenze o finanziamenti verificati e non promette ammissibilità o contributi. I cinque form preparano una bozza WhatsApp tramite GET; non inviano messaggi automaticamente e non usano un backend di raccolta.

Le vecchie scene, i film, i poster e le anteprime sono materiale storico, conservato nella cronologia e nell'archivio locale `outputs/launch-room/previous-public/`. I relativi manifest storici non attestano media o prestazioni della versione corrente. Le fotografie storiche soggette a licenze di terzi mantengono quei diritti e non sono dichiarate di pubblico dominio.

Lusion e il linguaggio di presentazione Apple sono riferimenti di composizione e movimento; il sito non ne incorpora codice o asset. Il manuale 3D WEB LAB fornito dall'utente è un riferimento interno, escluso dalla distribuzione. Nessun demo commerciale viene ridistribuito come asset del sito.
