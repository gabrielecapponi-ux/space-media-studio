# Provenienza dei materiali

Aggiornato il 10 ottobre 2026 per il percorso corrente di Space Media Studio. Filmati, fotografie e font sono salvati in locale: la navigazione del sito non richiede servizi di generazione o CDN fotografici esterni.

## Film d’acqua

Il film in apertura è **fotografia stock in slow motion**, non un render 3D, una ripresa realizzata dallo studio o un video generato con AI.

- Autore: **Film Composite**.
- Fonte: [A drop of water in a bowl with a black background — Pexels 16392049](https://www.pexels.com/video/a-drop-of-water-in-a-bowl-with-a-black-background-16392049/).
- Licenza: [Pexels License](https://www.pexels.com/license/), verificata sul sito ufficiale. Consente download, modifiche e uso commerciale sul sito; non è una dichiarazione di pubblico dominio. Restano applicabili i divieti di rivendita di copie inalterate, redistribuzione come stock e falsa approvazione da parte degli autori.
- Master scaricato dal CDN ufficiale: **3840×2160, 24 fps, 18.791667 secondi**. Conservato in `outputs/water-stock/`, esclusa dal repository.
- Esportazioni web: `public/films/water-desktop.mp4` (**1920×1080**) e `water-mobile.mp4` (**640×900**), entrambe 11.5 secondi / 276 fotogrammi, H.264/YUV420P senza audio.
- Interventi: selezione dell’intervallo 1.0–12.5 secondi, ridimensionamento/ritaglio per dispositivo, grade monocromatico, compressione e MP4 fast-start. Nessuna interpolazione del movimento, risalita inversa dell’acqua o falsa conversione in geometria 3D.
- I poster `water-start-desktop.jpg` e `water-start-mobile.jpg` sono estratti dal primo fotogramma degli export finali. `water-desktop.jpg` e `water-mobile.jpg` sono estratti dal momento della colonna d’acqua e usati come presentazione statica.

Provenienza completa, URL del download, hash, dimensioni, comandi e verifiche sono documentati in [ASSET-WATER.md](./ASSET-WATER.md). [ASSET-WATER.json](./ASSET-WATER.json) conserva le specifiche e i tempi editoriali indicativi della sequenza. Il film viene integrato nella dimostrazione creativa del sito, senza attribuire la produzione fotografica a Space Media Studio.

## Fotografie

Le fotografie seguenti sono protette da copyright e distribuite con la [licenza Pexels](https://www.pexels.com/license/), che permette download, modifica e utilizzo gratuito anche commerciale su siti e campagne. Non sono dichiarate di pubblico dominio. Non vengono rivendute come stock né attribuite allo studio come produzione fotografica.

| File | Autore e pagina fonte | Uso |
| --- | --- | --- |
| `public/images/muse-skincare.jpg` | [Polina — Cosmetic Containers on Gray Textile](https://www.pexels.com/photo/cosmetic-containers-on-gray-textile-8101525/) | Concept dimostrativo Aura |
| `public/images/forma-architecture.jpg` | [Alec Doualetas — Modern Architectural Concrete Structure Detail](https://www.pexels.com/photo/modern-architectural-concrete-structure-detail-31851512/) | Mockup FORMA nel percorso 3D e concept web |
| `public/images/aura-perfume.jpg` | [Daria Liudnaya — Blank Perfume Bottles](https://www.pexels.com/photo/blank-perfume-bottles-8166611/) | Creatività REVERIE nei dispositivi 3D e concept di campagna |

Sono stati scaricati JPEG a larghezza 1600 px dal CDN ufficiale `images.pexels.com`. Autori e pagine fonte sono collegati anche nei dettagli dei concept sul sito. Le composizioni grafiche, i testi e i mockup sono realizzati per questo progetto; le fotografie conservano i diritti dei rispettivi autori.

Aura, FORMA e REVERIE sono nomi illustrativi di **progetti possibili**, non clienti dello studio. Questi concept non sono presentati come incarichi commissionati, case study o risultati commerciali. Non viene rivendicata una registrazione dei relativi nomi da parte dello studio.

## 3D e grafica originali

Il percorso corrente utilizza **un’unica scena Three.js** in `src/showcase.js`. Un pannello con l’identità Space Media Studio si espande nella presenza web FORMA; telefono e creatività social introducono poi la campagna REVERIE. Le pose dipendono dalla progressione assoluta dello scroll e rimangono coerenti anche tornando indietro.

Pannello, display, telefono, cornici, dettagli, superfici e geometrie sono costruiti proceduralmente nel progetto; non sono modelli 3D scaricati. Le superfici grafiche sono composizioni Canvas 2D originali che utilizzano le fotografie Pexels indicate sopra. Gli ambienti di riflessione sono softbox originali costruiti nel codice. Il film d’acqua e la scena WebGL sono risorse distinte: il film non viene descritto come una simulazione realizzata dallo studio.

- **Three.js**: pacchetto ufficiale, licenza MIT; avviso incluso in `public/licenses/three-MIT.txt`.
- **Logo**: composizione SVG realizzata nel progetto.
- **Palette**: bianco caldo `#f5f5f2`, nero `#090b10`, giallo acido `#dfff00`, applicata anche alle composizioni sui dispositivi 3D.
- Le interfacce dei concept sono dimostrazioni visive; non implicano approvazione o collaborazione con produttori di dispositivi o marchi esterni.

## Font

- **Space Grotesk**: font variabile WOFF2 dal [repository ufficiale di Florian Karsten](https://github.com/floriankarsten/space-grotesk), SIL Open Font License 1.1. Copia della licenza: `public/fonts/SpaceGrotesk-OFL.txt`.
- **DM Mono**: font del pacchetto skill fornito dall’utente, SIL Open Font License conservata in `public/fonts/DMMono-OFL.txt`.

Tutti i font sono serviti localmente. Non vengono chiamate API di font esterne durante la visita.

## Riferimenti e storia

- [Lusion](https://lusion.co/) è stato un riferimento iniziale per composizione e immersività. Il linguaggio essenziale richiesto successivamente dall’utente guida la versione corrente; nessun codice, asset o progetto di Lusion o Apple è copiato.
- [Mockups Design](https://mockups-design.com/license/) e [Poly Haven](https://polyhaven.com/license/) sono stati valutati nelle fasi precedenti. Nessun loro asset è incluso nel percorso corrente.
- Il manuale 3D WEB LAB fornito dall’utente è un riferimento tecnico interno e non viene distribuito con il sito.
- Le precedenti sculture e il film CGI `spark` appartengono alle iterazioni conservate nella cronologia Git. La pipeline Blender/ComfyUI di quelle versioni non produce il film d’acqua attuale e non viene eseguita dal sito corrente.

Codice, identità visiva e composizioni originali restano soggetti ai diritti del progetto. La pubblicazione dei sorgenti non modifica le licenze dei materiali di terze parti né concede una licenza generale di riutilizzo.
