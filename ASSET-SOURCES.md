# Provenienza dei materiali — Space / Launch Room

La scena corrente usa **modelli tridimensionali originali costruiti nel codice** e quattro immagini image_gen già presenti nel progetto. Le immagini rimangono nei concept e nei ripieghi HTML; l'architettura è anche una texture delle interfacce web. Questa revisione non aggiunge generazioni AI, immagini stock, film CGI storici o risorse Horizon.

## Immagini correnti

| File pubblico | Contenuto | Produzione |
| --- | --- | --- |
| `public/images/launch-brand.jpg` | FORMA, identità illustrativa per un caffè contemporaneo: packaging giallo, tipografia nera, espresso, pietra e stampa | Generazione image_gen; successivo edit con lo stesso tool per rimuovere microtesti di contatto, indirizzo e anno |
| `public/images/launch-architecture.jpg` | Architettura contemporanea in travertino, vetrate scure e luce naturale | Generazione image_gen |
| `public/images/launch-product.jpg` | ORA, fragranza illustrativa in vetro spesso, liquido ambrato, acqua e set scuro | Generazione image_gen |
| `public/images/launch-campaign.jpg` | Installazione di seta gialla, pieghe e fasci di luce su nero | Generazione image_gen |

Le immagini sono **1672×941 pixel nativi**, circa 16:9, e totalizzano **1.145.984 byte**. I master PNG sono in `outputs/launch-room/`; FFmpeg ha prodotto i JPEG alla risoluzione originale, senza upscaling. Prompt, identificatori di generazione, byte e SHA-256 sono registrati in [ASSET-LAUNCH-ROOM.json](./ASSET-LAUNCH-ROOM.json). Master e prove locali non sono distribuiti dal sito.

Sono **concept dimostrativi generati con AI**, non fotografie documentarie di beni reali, incarichi ricevuti, clienti o prodotti commerciali in vendita. FORMA, AVANT, ORA e SPAZIO hanno una funzione narrativa e non dichiarano affiliazioni. Le immagini non sono materiali dichiarati di pubblico dominio o «senza copyright».

## Modelli, materiali e animazione

`src/scene-objects.js` costruisce i quattro allestimenti originali; `src/launch-room.js` coordina scena, ambiente, luci e camera:

- **Bussola Space:** quattro elementi smussati, separabili e animati, con materiali giallo e metallo; carta, campioni e supporto tipografico completano l'identità.
- **Interfacce web:** superfici originali desktop e mobile, con bordi e retro, più un modulo di navigazione. Layout e texture Canvas sono composti nel progetto; l'edificio raffigurato resta raster.
- **Flacone ORA:** geometrie originali per corpo, contenuto ambrato, collo, collare, erogatore, tappo, etichetta e base. Il vetro usa materiale fisico con trasmissione; il contenuto è geometria, non una simulazione di fluido. Il modello non è un CAD di un prodotto reale né una conversione automatica della foto.
- **Campagna motion:** manifesto tipografico e tre nastri con sezione e percorso geometrici, animati separatamente. Non sono una simulazione di tessuto e non ricostruiscono le pieghe del raster.

I modelli procedurali hanno come sorgente editabile i file JavaScript. Non vengono forniti master Blender o asset GLB per questi allestimenti. Poster, etichette e interfacce sono texture Canvas originali con i font locali. Caffè, packaging, architettura e seta raffigurati nelle immagini non diventano mesh.

Camera e pose rispondono allo scroll nativo e al puntatore fine; i cicli locali danno continuità alle scene ferme. Il sito non distribuisce film Blender o video 4K a 60 fps. Opzioni del renderer e cadenze del controller non certificano prestazioni sul dispositivo del visitatore.

## Software, font e identità

- **Three.js 0.186.1**, incluse le utility `RoomEnvironment`: licenza MIT; copia locale in `public/licenses/three-MIT.txt`.
- **Space Grotesk:** font variabile dal [repository ufficiale di Florian Karsten](https://github.com/floriankarsten/space-grotesk), SIL Open Font License 1.1; copia in `public/fonts/SpaceGrotesk-OFL.txt`.
- **DM Mono:** dal pacchetto skill fornito dall'utente, SIL Open Font License; copia in `public/fonts/DMMono-OFL.txt`.
- Logo Space, testi, composizioni, modelli procedurali, coreografie e texture Canvas: originali del progetto.

Font e librerie vengono serviti localmente o incorporati nella build, senza un CDN durante la visita. Le licenze di terze parti mantengono il proprio ambito; la pubblicazione dei sorgenti non concede una licenza generale delle composizioni originali.

## Video Non Higgsfield e Horizon

La precedente **prova locale ComfyUI/LTX** è separata dal sito. È stata interrotta quando la memoria disponibile è scesa a circa 2,51 GiB, sotto la soglia impostata di 3 GiB, prima di produrre fotogrammi. Stato: `attempted_no_output`. Nessun video di quella prova è incluso nella build; non sono stati scaricati nuovi modelli. I dettagli restano in `outputs/launch-room/video-preview/`.

**Horizon CoverFlow non è acquisito né integrato.** La scelta precedente non equivale a un download. Nessun sorgente Horizon è nel repository o nella build; questa scena non consuma download Horizon. I modelli e le interazioni correnti sono originali.

## Contenuti di servizio, verifiche e archivio

Progetti & bandi contiene testi originali ed esempi generali per aziende, APS e ASD. Non riporta bandi aperti, scadenze o finanziamenti verificati e non promette ammissibilità o contributi. I cinque form preparano una bozza WhatsApp tramite GET; non inviano messaggi automaticamente e non usano un backend di raccolta.

La build e i controlli riproducibili `npm test` sono superati; risultati e limiti sono registrati nel manifest. Quattro render diagnostici locali in Blender 5.2.1 controllano geometrie e materiali, con luci e font sostitutivi; non sono asset distribuiti o schermate del sito. La verifica visiva WebGL resta da eseguire perché l’uso del browser è disabilitato nelle impostazioni Work. Le prove e le misure della precedente scena a pannelli non attestano la versione corrente. I media e i manifest storici rimangono nella cronologia e nell'archivio locale `outputs/launch-room/previous-public/`, fuori dalla distribuzione. Le fotografie storiche soggette a licenze di terzi mantengono quei diritti e non sono dichiarate di pubblico dominio.

Lusion e il linguaggio di presentazione Apple sono riferimenti di composizione e movimento; il sito non ne incorpora codice o asset. Il manuale 3D WEB LAB fornito dall'utente è un riferimento interno, escluso dalla distribuzione. Nessuna demo commerciale viene ridistribuita come asset del sito.
