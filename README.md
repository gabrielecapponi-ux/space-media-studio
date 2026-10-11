# Space Media Studio

Sito dello studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. Un’introduzione 3D assembla uno studio futuristico e attraversa lo schermo di un computer per aprire il sito.

Il percorso corrente è: **hero 3D → esperienza AURA in tre capitoli → film CGI originale → quattro servizi sempre visibili → progetti possibili → studio → contatti**. Nero, bianco caldo e giallo acido collegano le scene e i contenuti. **Space Grotesk** e **DM Mono** sono serviti localmente.

[Apri il sito](https://gabrielecapponi-ux.github.io/space-media-studio/)

## Sviluppo e pubblicazione

Richiede Node.js 22.12+ o una versione supportata da Vite 8.

```sh
npm ci
npm run dev
```

Server locale: `http://127.0.0.1:5174`. Aprire il sorgente con `file://` reindirizza al sito pubblicato; per modificare il progetto usare Vite.

```sh
npm run build
npm run preview
npm run deploy
```

La build statica è in `dist/`; l’anteprima è su `http://127.0.0.1:5175`. `main` contiene i sorgenti; GitHub Pages pubblica `gh-pages`. Il deploy richiede accesso Git, costruisce il sito e aggiorna il ramo di pubblicazione da una cartella temporanea mantenendone la cronologia. Vite usa percorsi relativi per il sottopercorso GitHub Pages.

## Percorso e architettura

L’hero costruisce una scultura originale di otto volumi pieni e morbidi, con geometria superellissoidale condivisa. I cuscini si separano, diventano un totem a coppie sfalsate e convergono nel prodotto AURA. Posizioni, scale e quaternioni derivano da pose assolute con raccordi continui; la fase di apertura riduce leggermente la scala per conservare spazio intorno a testi e controlli. La preview nel monitor dell’introduzione e il ripiego CSS riprendono la stessa scultura, senza anelli. Il percorso successivo mantiene il prodotto come riferimento: branding e 3D, e-commerce, contenuti e campagne. Le interfacce mostrano grafica Canvas originale, senza fotografie stock, prezzi o acquisti attivi.

Dopo il film CGI, la sezione **Servizi** presenta quattro card aperte, con benefici, attività e collegamenti ai contatti: **Branding & strategia**, **Siti web & e-commerce**, **Contenuti, social & 3D**, **Campagne digitali**. Piccole tavole tecniche collegano le competenze al linguaggio delle sculture. La navigazione offre un accesso diretto ai servizi; il metodo di lavoro è descritto in tre passaggi. I contenuti dell’offerta sono leggibili senza esplorare le scene 3D. Tre direzioni creative sono affiancate da **nove concept digitali**: Seta, Tavola, Noma, Focus, Vela, Materia, Ritual, Slot e Index. Comprendono siti essenziali, portfolio, landing page, minisiti e configuratori 3D, e-commerce, prenotazioni e magazine. Le anteprime SVG sono originali, autonome e pesano circa 45 KB complessivi. I filtri aggiornano soltanto la raccolta digitale; ogni scheda mostra anteprima, descrizione, tre attività e indicazione esplicita di progetto dimostrativo. I dialog bloccano lo scroll della pagina e restituiscono il focus al comando che li ha aperti.

| File | Responsabilità |
| --- | --- |
| `index.html` | Contenuti, navigazione, capitoli, film, quattro servizi, concept e contatti |
| `src/main.js`, `src/digital-concepts.js` | Avvio, menu, filtri, dialog dei dodici concept e ciclo di vita |
| `src/entry.js` | Preparazione delle risorse, avanzamento reale ponderato e uscita dall’introduzione |
| `src/entry-shell.js`, `src/entry.css` | Overlay, contatore, controlli e illustrazione CSS di ripiego |
| `src/studio-room.js` | Studio Three.js originale e ingresso della camera nel monitor |
| `src/motion.js` | Coordinamento di hero, showcase e film, scroll, pausa e replay |
| `src/kinetic-hero.js`, `src/soft-sculpture.js` | Scultura di otto volumi morbidi, scomposizione, totem e prodotto AURA |
| `src/showcase.js` | Prodotto, e-commerce e campagna; pose assolute e movimento ambientale contenuto |
| `src/editorial.css`, `src/kinetic.css` | Layout, tipografia, servizi, adattamenti responsive e ripieghi |
| `src/services.css`, `src/refinement.css` | Tavole dei servizi, anteprime visive dei concept, focus e impaginazione compatta |
| `src/catalogue.css`, `public/previews/` | Griglia digitale, anteprime SVG originali e dialog responsive |
| `src/soft-fallback.css` | Controparte statica della scultura, senza WebGL |
| `scripts/render-studio-soft.py`, `scripts/export-studio-soft.py` | Blender locale, film CGI, export responsive e verifica |
| `public/` | Export web del film, poster, fotografie dei concept, font e licenze |

## Film CGI originale

**Space / Soft motion study** riprende il nuovo linguaggio di otto cuscini pieni in cromo, grafite e lime. Volume compatto, apertura, totem e ricomposizione formano un gesto periodico originale. Geometrie, superfici, illuminazione e movimento sono creati per il progetto; il film non usa modelli o riprese stock.

Pipeline locale: **Blender 5.2.1 / Cycles GPU**, 32 campioni con denoising, **144 fotogrammi a 24 fps**, durata **6 secondi**, render **1920×1080**; montaggio ed export con **FFmpeg**. Non usa ComfyUI, modelli AI o servizi a pagamento.

- Desktop: `public/films/studio-soft-desktop.mp4`, **1920×1080**.
- Mobile: `public/films/studio-soft-mobile.mp4`, **640×900**. La composizione verticale conserva l’intera scultura.
- Poster `studio-soft-start-*`: primo fotogramma. Poster `studio-soft-desktop.jpg` e `studio-soft-mobile.jpg`: fotogramma 73 per la presentazione statica.

Hash e verifiche degli export sono in [ASSET-STUDIO-SOFT.json](./ASSET-STUDIO-SOFT.json). Pausa e **Rivedi** rimangono disponibili. Master, scena Blender e fotogrammi di lavorazione sono in `outputs/studio-soft/`, esclusa dalla build. I precedenti film Orbit e acqua restano documentati nei manifest storici; non sono caricati dal sito.

## Caricamento, movimento e accessibilità

La stanza iniziale è un’illustrazione originale di uno studio immaginario, non una ricostruzione della sede di Parma. Il contatore segue font, immagini, modulo della stanza, un solo formato responsive del film e preparazione GPU di hero e showcase. Quando disponibile, misura anche l’avanzamento dei byte trasferiti. Il numero viene smorzato senza superare il lavoro completato fino al 99%; il 100% avvia il raccordo attraverso il monitor. Le aperture successive nella stessa sessione hanno un assemblaggio più breve.

Il film viene preparato come Blob e non parte dietro l’overlay. **Entra subito**, **Esc** e il limite massimo di 20 secondi permettono di accedere al sito anche se una risorsa tarda o fallisce; gli errori attivano i relativi ripieghi. Movimento ridotto e risparmio dati escludono il film dal download automatico. Lo sfondo è `inert` durante l’introduzione e il focus viene ripristinato all’uscita; le risorse GPU della stanza vengono liberate.

La progressione del showcase usa pose assolute, coerenti anche scorrendo indietro. Un livello temporale separato ripristina la posa di base prima di aggiungere oscillazioni limitate del prodotto, respirazione dei frammenti e variazioni delle luci. Il rendering del showcase è limitato a **45 fps desktop / 30 fps compatto o touch**; si ferma quando è in pausa, fuori schermo, durante la preparazione, con pagina nascosta o movimento ridotto. Le interfacce mantengono un orientamento leggibile. I diagnostici distinguono limite di frequenza, frequenza osservata e tempo CPU di invio del rendering, che non misura il completamento GPU.

Anche l’hero anima soltanto quando è visibile e il movimento è consentito. Menu e anteprime dei concept sospendono il 3D e il film sullo sfondo; alla chiusura rispettano l’eventuale pausa scelta dall’utente. Il DPR è limitato a 1.4/1.6 nell’hero e 1.35/1.6 nel showcase. Geometrie condivise, dettagli proporzionati alla dimensione visibile e un’ombra di studio precalcolata limitano il costo del showcase; la stanza conserva le proprie ombre architettoniche. Se WebGL non è disponibile, rimangono le composizioni CSS/HTML. Testi, servizi e contatti sono nel documento HTML; menu, concept e controlli funzionano da tastiera. Con movimento ridotto i capitoli restano selezionabili come pose statiche.

## Concept e diritti

Tutti i dodici concept sono **progetti possibili**, dichiarati come concept dimostrativi: non sono clienti, incarichi o risultati ottenuti. Le fotografie su licenza Pexels compaiono soltanto nelle tre card dei concept; hero, prodotto, dispositivi e film CGI usano geometrie e grafica originali. I crediti sono in [ASSET-SOURCES.md](./ASSET-SOURCES.md).

Il sito non include form, analytics o cookie di profilazione. Telefono, WhatsApp e mappa si aprono su richiesta.

**Space Media Studio — Stradello Conrad Marca Relli 1, Parma. +39 347 962 3498.**

Codice, identità visiva e composizioni originali: tutti i diritti riservati. La pubblicazione dei sorgenti non concede una licenza di riutilizzo. Le risorse di terze parti mantengono le rispettive licenze.
