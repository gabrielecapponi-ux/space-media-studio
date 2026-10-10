# Provenienza dei materiali

Aggiornato il 10 ottobre 2026 per il percorso corrente di Space Media Studio. Filmati, fotografie e font sono salvati in locale: la navigazione del sito non richiede servizi di generazione o CDN fotografici esterni.

## Film d’acqua

Il film d’acqua, collocato dopo le tre card dei progetti possibili, è **fotografia stock in slow motion**, non un render 3D, una ripresa realizzata dallo studio o un video generato con AI.

- Autore: **Film Composite**.
- Fonte: [A drop of water in a bowl with a black background — Pexels 16392049](https://www.pexels.com/video/a-drop-of-water-in-a-bowl-with-a-black-background-16392049/).
- Licenza: [Pexels License](https://www.pexels.com/license/), verificata sul sito ufficiale. Consente download, modifiche e uso commerciale sul sito; non è una dichiarazione di pubblico dominio. Restano applicabili i divieti di rivendita di copie inalterate, redistribuzione come stock e falsa approvazione da parte degli autori.
- Master scaricato dal CDN ufficiale: **3840×2160, 24 fps, 18.791667 secondi**. Conservato in `outputs/water-stock/`, esclusa dal repository.
- Esportazioni web: `public/films/water-desktop.mp4` (**1920×1080**) e `water-mobile.mp4` (**640×900**), entrambe 11.5 secondi / 276 fotogrammi, H.264/YUV420P senza audio.
- Interventi: selezione dell’intervallo 1.0–12.5 secondi, ridimensionamento/ritaglio per dispositivo, grade monocromatico, compressione H.264 High Level 4.1 / CRF 20 e MP4 fast-start. L’ottimizzazione corrente è esportata direttamente dal master 4K, con keyframe ogni 2 secondi, e riduce i due filmati complessivamente di 1.326.780 byte (23,81%) mantenendo formato, durata e numero di fotogrammi. Nessuna interpolazione del movimento, risalita inversa dell’acqua o falsa conversione in geometria 3D.
- I poster `water-start-desktop.jpg` e `water-start-mobile.jpg` sono estratti dal primo fotogramma degli export finali. `water-desktop.jpg` e `water-mobile.jpg` sono estratti dal momento della colonna d’acqua e usati come presentazione statica.

Provenienza completa, URL del download, hash, dimensioni, comandi e verifiche sono documentati in [ASSET-WATER.md](./ASSET-WATER.md). [ASSET-WATER.json](./ASSET-WATER.json) conserva le specifiche e i tempi editoriali indicativi della sequenza. Il film viene integrato nella dimostrazione creativa del sito, senza attribuire la produzione fotografica a Space Media Studio.

## Fotografie

Le fotografie seguenti sono protette da copyright e distribuite con la [licenza Pexels](https://www.pexels.com/license/), che permette download, modifica e utilizzo gratuito anche commerciale su siti e campagne. Non sono dichiarate di pubblico dominio. Non vengono rivendute come stock né attribuite allo studio come produzione fotografica.

| File | Autore e pagina fonte | Uso |
| --- | --- | --- |
| `public/images/muse-skincare.jpg` | [Polina — Cosmetic Containers on Gray Textile](https://www.pexels.com/photo/cosmetic-containers-on-gray-textile-8101525/) | Solo card HTML del concept dimostrativo Aura |
| `public/images/forma-architecture.jpg` | [Alec Doualetas — Modern Architectural Concrete Structure Detail](https://www.pexels.com/photo/modern-architectural-concrete-structure-detail-31851512/) | Solo mockup nella card HTML del concept web FORMA |
| `public/images/aura-perfume.jpg` | [Daria Liudnaya — Blank Perfume Bottles](https://www.pexels.com/photo/blank-perfume-bottles-8166611/) | Solo card HTML del concept di campagna REVERIE |

Le tre fotografie sono usate esclusivamente nelle card HTML dei concept; non fanno parte delle texture dell’hero, del prodotto AURA o dei dispositivi nel percorso 3D. Sono stati scaricati JPEG a larghezza 1600 px dal CDN ufficiale `images.pexels.com`. Gli export correnti mantengono le stesse dimensioni e gli stessi pixel RGB decodificati, con ottimizzazione JPEG progressiva senza perdita; per la foto architettonica interamente monocromatica vengono eliminate anche le componenti cromatiche ridondanti. Questa ottimizzazione riduce il trasferimento senza ricampionare le immagini. Le prove WebP ad alta qualità risultavano più grandi e non sono distribuite. Autori e pagine fonte sono collegati anche nei dettagli dei concept sul sito. Le composizioni grafiche, i testi e i mockup sono realizzati per questo progetto; le fotografie conservano i diritti dei rispettivi autori.

Aura, FORMA e REVERIE sono nomi illustrativi di **progetti possibili**, non clienti dello studio. Questi concept non sono presentati come incarichi commissionati, case study o risultati commerciali. Non viene rivendicata una registrazione dei relativi nomi da parte dello studio.

## 3D e grafica originali

L’introduzione utilizza una **stanza Three.js originale** in `src/studio-room.js`: pareti, postazioni, computer, superfici colorate e logo SPACE vengono assemblati durante la preparazione del sito, prima dell’ingresso della camera nello schermo. La stanza futuristica è un’illustrazione di uno spazio immaginario, non una fotografia, una ricostruzione documentaria o un rilievo della sede reale di Parma. Non usa modelli 3D, immagini architettoniche o video esterni. L’alternativa senza WebGL è un’illustrazione CSS originale in `src/entry-shell.js` e `src/entry.css`.

Il controller `src/entry.js` prepara i font e le immagini già elencati in questo documento, un solo formato responsive del film d’acqua, l’hero e la scena dei servizi. Il contatore è legato al completamento ponderato delle attività e, ove disponibile, ai byte del video trasferiti; il numero visualizzato viene smorzato e non supera il valore effettivo fino al 99%. Dopo il completamento, il 100% introduce il raccordo attraverso il monitor. Il video viene conservato in un Blob per playback e replay; non si avvia dietro l’overlay. Desktop usa 1920×1080, mobile 640×900. Movimento ridotto e risparmio dati escludono il video dal caricamento automatico; uscita immediata e limite di 20 secondi mantengono accessibile il sito anche in caso di errore o attesa eccessiva. Le risorse GPU della stanza vengono rilasciate al termine dell’introduzione.

L’hero utilizza una scena Three.js originale in `src/kinetic-hero.js`, con il layout nero, i servizi espliciti e le regole responsive in `src/kinetic.css`. Una geometria ad arco creata nel progetto è riutilizzata per 24 segmenti lime e cromo: la scultura orbitale si separa e si ricompone nella bottiglia AURA. Bottiglia, tappo, etichetta, superfici e coreografia sono originali; non derivano da un modello o da una fotografia stock. Il monitor dell’introduzione mostra una composizione Canvas 2D originale coerente con questo hero.

Il percorso dei servizi utilizza un’altra scena Three.js in `src/showcase.js`, preparata prima dell’apertura. Lo stesso concept AURA collega bottiglia, e-commerce e campagna su telefono e social. Dodici frammenti con geometria condivisa accompagnano la trasformazione tra i capitoli. Le pose dipendono dalla progressione assoluta dello scroll e rimangono coerenti anche tornando indietro.

Prodotto, display, telefono, cornici, dettagli, superfici e geometrie sono costruiti proceduralmente nel progetto; non sono modelli 3D scaricati. Le superfici dei dispositivi sono composizioni Canvas 2D originali con illustrazioni del prodotto AURA: non contengono le fotografie Pexels elencate sopra e non mostrano prezzi. Le interfacce sono dimostrazioni visive, senza acquisti attivi. Gli ambienti di riflessione sono softbox originali costruiti nel codice. Hero, stanza e percorso dei servizi sono rendering WebGL in tempo reale. Il film d’acqua è una risorsa fotografica distinta e non viene descritto come una simulazione realizzata dallo studio.

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
- Le sculture delle iterazioni precedenti e il film CGI `spark` appartengono alle iterazioni conservate nella cronologia Git. La pipeline Blender/ComfyUI di quelle versioni non produce il film d’acqua attuale e non viene eseguita dal sito corrente.

Codice, identità visiva e composizioni originali restano soggetti ai diritti del progetto. La pubblicazione dei sorgenti non modifica le licenze dei materiali di terze parti né concede una licenza generale di riutilizzo.
