# Provenienza dei materiali

Aggiornato il 10 ottobre 2026. Immagini e filmati sono salvati in locale: la navigazione del sito non richiede servizi di generazione o CDN fotografici esterni.

## Fotografie

Le fotografie seguenti sono protette da copyright e distribuite con la [licenza Pexels](https://www.pexels.com/license/), che permette download, modifica e utilizzo gratuito anche commerciale su siti e campagne. Non sono dichiarate di pubblico dominio. Non vengono rivendute come stock né attribuite allo studio come produzione fotografica.

| File                                   | Autore e pagina fonte                                                                                                                                    | Uso                           |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `public/images/muse-skincare.jpg`      | [Polina — Cosmetic Containers on Gray Textile](https://www.pexels.com/photo/cosmetic-containers-on-gray-textile-8101525/)                                | Concept dimostrativo Aura     |
| `public/images/forma-architecture.jpg` | [Alec Doualetas — Modern Architectural Concrete Structure Detail](https://www.pexels.com/photo/modern-architectural-concrete-structure-detail-31851512/) | Mockup web dimostrativo Forma |
| `public/images/aura-perfume.jpg`       | [Daria Liudnaya — Blank Perfume Bottles](https://www.pexels.com/photo/blank-perfume-bottles-8166611/)                                                    | Concept dimostrativo Reverie  |

Sono stati scaricati JPEG a larghezza 1600px dal CDN ufficiale `images.pexels.com`. Autori e pagine fonte sono collegati anche nei dettagli dei concept sul sito. Le composizioni, i testi e il mockup browser sono realizzati per questo progetto. I nomi Aura, Forma, Reverie e Play sono nomi illustrativi di concept, non clienti né marchi registrati dallo studio.

## 3D, grafica e font

- Sculture hero, percorso scroll e concept Play: geometrie procedurali originali, nessun modello o render scaricato.
- Three.js e RoomEnvironment: pacchetto ufficiale Three.js (MIT), avviso di licenza incluso in `public/licenses/three-MIT.txt`.
- Instrument Sans, Instrument Serif e DM Mono: SIL Open Font License; copie delle licenze in `public/fonts/`. Font estratti dal pacchetto skill fornito dall’utente. La licenza Instrument Serif mancante nello ZIP è stata recuperata dal [repository ufficiale Google Fonts](https://github.com/google/fonts/blob/main/ofl/instrumentserif/OFL.txt).
- Logo e segno orbitale: composizione SVG realizzata nel progetto.

## Fonti valutate

- [Mockups Design](https://mockups-design.com/license/): utilizzabile per mockup commerciali dopo sostituzione del design di esempio ed esportazione piatta; file sorgente non redistribuibili. Nessun loro file è incluso.
- [Poly Haven](https://polyhaven.com/license/): HDRI, texture e modelli CC0; i render di esempio e le immagini inviate dagli utenti non sono coperti automaticamente da CC0. Nessun loro asset è incluso.
- [Lusion](https://lusion.co/): riferimento di composizione e immersività; nessun codice, asset o progetto copiato.

## Hero cinematografica

Il segno a quattro moduli della hero, la lampadina, il diaframma fotografico e il bersaglio sono geometrie procedurali originali generate nel progetto. Nessun modello 3D esterno. Il poster di ripiego `public/images/hero-static-spark.jpg` è un fotogramma della posa finale renderizzata in locale, senza risorse stock. Il manuale 3D WEB LAB fornito dall’utente è un riferimento tecnico interno e non viene distribuito con il sito.

## Film CGI locale — La scintilla prende forma

Film originale renderizzato il 10 ottobre 2026 con **Blender 5.2.1 LTS / Cycles Metal**, composto attraverso i nodi video nativi di **ComfyUI locale**. La geometria viene estratta direttamente dalle funzioni Three.js del progetto: quattro petali laccati, quattro chassis cromati e due elementi del nucleo, per 35.044 triangoli. La trasformazione usa le stesse equazioni assolute della scena interattiva, con seed di rendering 61739. Si tratta di CGI da geometria reale, non di riprese fotografiche o di generazione con modelli video AI.

- `public/films/spark-desktop.mp4` e `spark-mobile.mp4`: apertura singola di 11 secondi, 264 fotogrammi a 24 fps, 1600×900 e 640×640.
- `public/films/spark-loop-desktop.mp4` e `spark-loop-mobile.mp4`: lo stesso film montato avanti/indietro per un ciclo continuo di 22 secondi.
- `public/images/hero-spark.jpg`, `portal-spark.jpg` e le varianti `-mobile.jpg`: primo fotogramma del film, con la stessa inquadratura della rispettiva versione video.

Non vengono utilizzati modelli, texture, filmati stock o marchi esterni. La scena modificabile `.blend`, il master, i fotogrammi, il manifest e il workflow ComfyUI con la cronologia del job rimangono in `outputs/`, esclusa dal repository. `scripts/render-spark.py`, `scripts/compose-local-film.mjs` e `scripts/prepare-films.mjs` documentano il flusso riproducibile. Il precedente film del giroscopio Higgsfield è sostituito nella versione corrente; il suo master rimane negli artefatti locali e la versione precedente è conservata nella cronologia Git.

Le quattro sculture del canvas condiviso (sistema ottico, nastro continuo, orbite, anelli collegati) sono geometrie procedurali originali del progetto, separate dai filmati.
