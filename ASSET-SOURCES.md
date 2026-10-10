# Provenienza dei materiali

Aggiornato il 10 ottobre 2026. Il percorso corrente usa scene WebGL e un film CGI originali; le sole fotografie stock compaiono nelle tre card dei concept. Media e font sono serviti localmente, senza CDN fotografici o servizi di generazione durante la visita.

## Film CGI originale — Studio Orbit

**Space / Motion study 02** è creato per Space Media Studio con `scripts/render-studio-orbit.py`: otto segmenti ad arco, superfici cromo/grafite/lime, nucleo, palco, luci, camera e coreografia procedurale. Non utilizza modelli scaricati, fotografie stock o filmati AI.

- Render: **Blender 5.2.1, Cycles GPU**, 32 campioni e denoising, **1920×1080**, **144 fotogrammi / 24 fps / 6 secondi**.
- Montaggio locale: due capitoli caricati e concatenati con i nodi nativi ComfyUI **LoadVideo → ConcatenateVideo → SaveVideo**, su CPU. Nessun peso AI, account Higgsfield o servizio di generazione a pagamento.
- Desktop: `public/films/studio-orbit-desktop.mp4`, **1920×1080**.
- Mobile: `public/films/studio-orbit-mobile.mp4`, **640×900**. Finestra centrale 1280×1080, riduzione a 640×540, margini verticali da 180 pixel per mantenere visibile la scultura.
- `public/images/studio-orbit-start-desktop.jpg` e `studio-orbit-start-mobile.jpg`: primo fotogramma degli export. `studio-orbit-desktop.jpg` e `studio-orbit-mobile.jpg`: fotogramma 73 per il ripiego statico.

Hash, dimensioni, verifica completa degli export e job ComfyUI riuscito sono in [ASSET-STUDIO-ORBIT.json](./ASSET-STUDIO-ORBIT.json). La pipeline riproducibile è in `scripts/render-studio-orbit.py`, `scripts/comfy-studio-orbit.py` e `scripts/export-studio-orbit.py`.

Il movimento è progettato come gesto periodico; il loop non usa una riproduzione al contrario. Scena Blender, render e manifest di lavorazione sono conservati in `outputs/studio-orbit/`, esclusa dal repository e dalla build. Il sito distribuisce gli export web e i poster.

Il precedente film fotografico d’acqua e i suoi poster non sono usati dal percorso corrente. [ASSET-WATER.md](./ASSET-WATER.md) e [ASSET-WATER.json](./ASSET-WATER.json) conservano fonte, licenza e specifiche storiche; non descrivono Studio Orbit.

## Scene WebGL e grafica originali

- **Introduzione:** `src/studio-room.js` costruisce pareti, postazioni, computer e logo SPACE. È uno studio immaginario, non una fotografia o un rilievo della sede di Parma. `src/entry-shell.js` e `src/entry.css` forniscono il ripiego CSS originale.
- **Hero:** `src/kinetic-hero.js` riutilizza una geometria originale in 24 segmenti lime/cromo. La coreografia passa da forma orbitale a struttura elicoidale, scomposizione e prodotto AURA; superfici, etichetta e ambienti di riflessione sono creati nel progetto.
- **Showcase:** `src/showcase.js` costruisce flacone AURA, tappo, etichetta, piedistallo, display e telefono. Dodici frammenti condividono la geometria e si ricompongono tra branding, e-commerce e campagna. Le pose assolute dello scroll hanno un livello temporale separato di movimento contenuto, senza accumulo delle trasformazioni. Il rendering è limitato a 45 fps desktop / 30 fps compatto o touch e si ferma in pausa, fuori schermo, durante la preparazione, con pagina nascosta o movimento ridotto.
- **Interfacce:** texture Canvas 2D originali, con illustrazioni AURA coerenti con il flacone 3D. Non contengono fotografie Pexels, prezzi o acquisti attivi. Sono concept visivi di esperienze che lo studio potrebbe sviluppare.
- **Identità:** logo SVG e composizioni realizzati nel progetto; palette bianco caldo `#f5f5f2`, nero `#090b10`, giallo acido `#dfff00`.

Queste scene sono rendering WebGL in tempo reale. Studio Orbit è invece un render Blender preparato e distribuito come video. Non viene attribuita al sito una ricostruzione geometrica delle fotografie stock né una collaborazione con produttori di dispositivi o marchi esterni.

**Three.js** è distribuito con licenza MIT; avviso in `public/licenses/three-MIT.txt`.

## Fotografie delle card concept

Le fotografie mantengono il copyright degli autori e sono distribuite con la [licenza Pexels](https://www.pexels.com/license/), che consente uso e modifica anche commerciale. Non sono dichiarate di pubblico dominio, rivendute come stock o attribuite allo studio come produzione fotografica.

| File | Autore e pagina fonte | Uso |
| --- | --- | --- |
| `public/images/muse-skincare.jpg` | [Polina — Cosmetic Containers on Gray Textile](https://www.pexels.com/photo/cosmetic-containers-on-gray-textile-8101525/) | Card del concept Aura |
| `public/images/forma-architecture.jpg` | [Alec Doualetas — Modern Architectural Concrete Structure Detail](https://www.pexels.com/photo/modern-architectural-concrete-structure-detail-31851512/) | Card del concept web FORMA |
| `public/images/aura-perfume.jpg` | [Daria Liudnaya — Blank Perfume Bottles](https://www.pexels.com/photo/blank-perfume-bottles-8166611/) | Card del concept di campagna REVERIE |

I JPEG a larghezza 1600 px provengono dal CDN ufficiale `images.pexels.com`. Gli export hanno un’ottimizzazione progressiva senza ricampionamento; la foto architettonica monocromatica elimina anche le componenti cromatiche ridondanti. Autori e fonti sono collegati nei dettagli dei concept. Testi, composizioni e mockup sono originali; le fotografie conservano i diritti dei rispettivi autori.

Aura, FORMA e REVERIE sono **progetti possibili**, non clienti, incarichi commissionati, case study o risultati commerciali. I nomi hanno scopo illustrativo e non implicano una registrazione da parte dello studio.

## Font

- **Space Grotesk:** WOFF2 variabile dal [repository ufficiale di Florian Karsten](https://github.com/floriankarsten/space-grotesk), SIL Open Font License 1.1; copia in `public/fonts/SpaceGrotesk-OFL.txt`.
- **DM Mono:** dal pacchetto skill fornito dall’utente, SIL Open Font License; copia in `public/fonts/DMMono-OFL.txt`.

I font sono serviti localmente, senza API esterne.

## Riferimenti e storia

[Lusion](https://lusion.co/) e il linguaggio di presentazione Apple sono riferimenti di composizione e movimento; codice, asset e progetti non sono copiati. Il manuale 3D WEB LAB fornito dall’utente è un riferimento tecnico interno, escluso dalla distribuzione. Mockups Design e Poly Haven sono stati valutati in precedenza; nessun loro asset fa parte del percorso corrente. Le iterazioni precedenti, comprese la pipeline CGI `spark` e il film d’acqua, restano documentazione storica e non sono caricate dal sito.

Codice, identità visiva e composizioni originali conservano i diritti del progetto. La pubblicazione dei sorgenti non modifica le licenze di terze parti né concede una licenza generale di riutilizzo.
