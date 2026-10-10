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

L’hero riutilizza 24 segmenti originali lime e cromo per passare da una scultura orbitale a una struttura elicoidale e al prodotto AURA. Il percorso successivo mantiene il prodotto come riferimento: branding e 3D, e-commerce, contenuti e campagne. Dodici frammenti si separano in profondità e si ricompongono intorno al display e al telefono. Le interfacce mostrano grafica Canvas originale, senza fotografie stock, prezzi o acquisti attivi.

Dopo il film CGI, la sezione **Servizi** presenta quattro card aperte, con benefici, attività e collegamenti ai contatti: **Branding & strategia**, **Siti web & e-commerce**, **Contenuti, social & 3D**, **Campagne digitali**. La navigazione offre un accesso diretto ai servizi; il metodo di lavoro è descritto in tre passaggi. I contenuti dell’offerta sono leggibili senza esplorare le scene 3D.

| File | Responsabilità |
| --- | --- |
| `index.html` | Contenuti, navigazione, capitoli, film, quattro servizi, concept e contatti |
| `src/main.js` | Avvio, menu, dialog dei concept e ciclo di vita della pagina |
| `src/entry.js` | Preparazione delle risorse, avanzamento reale ponderato e uscita dall’introduzione |
| `src/entry-shell.js`, `src/entry.css` | Overlay, contatore, controlli e illustrazione CSS di ripiego |
| `src/studio-room.js` | Studio Three.js originale e ingresso della camera nel monitor |
| `src/motion.js` | Coordinamento di hero, showcase e film, scroll, pausa e replay |
| `src/kinetic-hero.js` | Coreografia orbitale, elica e assemblaggio del prodotto AURA |
| `src/showcase.js` | Prodotto, e-commerce e campagna; pose assolute e movimento ambientale contenuto |
| `src/editorial.css`, `src/kinetic.css` | Layout, tipografia, servizi, adattamenti responsive e ripieghi |
| `scripts/render-studio-orbit.py` | Geometrie, materiali, luci, camera e animazione del film CGI originale |
| `scripts/comfy-studio-orbit.py` e `scripts/export-studio-orbit.py` | Composizione ComfyUI locale, export responsive e verifica dei file |
| `public/` | Export web del film, poster, fotografie dei concept, font e licenze |

## Film CGI originale

**Space / Motion study 02** mostra otto segmenti in cromo, grafite e lime che si aprono attorno a un nucleo e si ricompongono. Geometrie, superfici, illuminazione e movimento sono creati per il progetto; il film non usa modelli o riprese stock.

Pipeline locale: **Blender 5.2.1 / Cycles GPU**, 32 campioni con denoising, **144 fotogrammi a 24 fps**, durata **6 secondi**, render **1920×1080**. La composizione dei due capitoli usa i nodi nativi ComfyUI **LoadVideo → ConcatenateVideo → SaveVideo**, eseguiti localmente su CPU senza pesi AI, Higgsfield o servizi di generazione a pagamento.

- Desktop: `public/films/studio-orbit-desktop.mp4`, **1920×1080**.
- Mobile: `public/films/studio-orbit-mobile.mp4`, **640×900**. La finestra centrale 1280×1080 viene ridotta a 640×540 e inserita con 180 pixel di margine sopra e sotto, preservando la scultura nel formato verticale.
- Poster `studio-orbit-start-*`: primo fotogramma. Poster `studio-orbit-desktop.jpg` e `studio-orbit-mobile.jpg`: fotogramma 73 per la presentazione statica.

Hash e verifica degli export finali sono in [ASSET-STUDIO-ORBIT.json](./ASSET-STUDIO-ORBIT.json). Il gesto è periodico e il film può ripetersi senza invertire il montaggio. Pausa e **Rivedi** rimangono disponibili. Master, scena Blender e fotogrammi di lavorazione sono in `outputs/studio-orbit/`, esclusa dalla build. Il precedente film d’acqua non fa parte del percorso corrente; [ASSET-WATER.md](./ASSET-WATER.md) e [ASSET-WATER.json](./ASSET-WATER.json) ne conservano la documentazione storica.

## Caricamento, movimento e accessibilità

La stanza iniziale è un’illustrazione originale di uno studio immaginario, non una ricostruzione della sede di Parma. Il contatore segue font, immagini, modulo della stanza, un solo formato responsive del film e preparazione GPU di hero e showcase. Quando disponibile, misura anche l’avanzamento dei byte trasferiti. Il numero viene smorzato senza superare il lavoro completato fino al 99%; il 100% avvia il raccordo attraverso il monitor. Le aperture successive nella stessa sessione hanno un assemblaggio più breve.

Il film viene preparato come Blob e non parte dietro l’overlay. **Entra subito**, **Esc** e il limite massimo di 20 secondi permettono di accedere al sito anche se una risorsa tarda o fallisce; gli errori attivano i relativi ripieghi. Movimento ridotto e risparmio dati escludono il film dal download automatico. Lo sfondo è `inert` durante l’introduzione e il focus viene ripristinato all’uscita; le risorse GPU della stanza vengono liberate.

La progressione del showcase usa pose assolute, coerenti anche scorrendo indietro. Un livello temporale separato ripristina la posa di base prima di aggiungere oscillazioni limitate del prodotto, respirazione dei frammenti e variazioni delle luci. Il rendering del showcase è limitato a **45 fps desktop / 30 fps compatto o touch**; si ferma quando è in pausa, fuori schermo, durante la preparazione, con pagina nascosta o movimento ridotto. Le interfacce mantengono un orientamento leggibile. I diagnostici distinguono limite di frequenza, frequenza osservata e tempo CPU di invio del rendering, che non misura il completamento GPU.

Anche l’hero anima soltanto quando è visibile e il movimento è consentito. Il DPR è limitato a 1.4/1.6 nell’hero e 1.35/1.6 nel showcase. Geometrie condivise, dettagli proporzionati alla dimensione visibile e un’ombra di studio precalcolata limitano il costo del showcase; la stanza conserva le proprie ombre architettoniche. Se WebGL non è disponibile, rimangono le composizioni CSS/HTML. Testi, servizi e contatti sono nel documento HTML; menu, concept e controlli funzionano da tastiera. Con movimento ridotto i capitoli restano selezionabili come pose statiche.

## Concept e diritti

Aura, FORMA e REVERIE sono **progetti possibili**, dichiarati come concept dimostrativi: non sono clienti, incarichi o risultati ottenuti. Le fotografie su licenza Pexels compaiono soltanto nelle tre card dei concept; hero, prodotto, dispositivi e film CGI usano geometrie e grafica originali. I crediti sono in [ASSET-SOURCES.md](./ASSET-SOURCES.md).

Il sito non include form, analytics o cookie di profilazione. Telefono, WhatsApp e mappa si aprono su richiesta.

**Space Media Studio — Stradello Conrad Marca Relli 1, Parma. +39 347 962 3498.**

Codice, identità visiva e composizioni originali: tutti i diritti riservati. La pubblicazione dei sorgenti non concede una licenza di riutilizzo. Le risorse di terze parti mantengono le rispettive licenze.
