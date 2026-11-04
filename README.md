# Space Media Studio

Studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. Creiamo **siti web, e-commerce, loghi, identità visive, video, animazioni 3D e campagne**. Affianchiamo aziende, APS e ASD nella progettazione e nelle candidature a bandi.

[Apri il sito](https://gabrielecapponi-ux.github.io/space-media-studio/)

`index.html` è la homepage canonica; `atelier.html` è l’alias con `noindex, nofollow`. La revisione del **4 novembre 2026** conserva il caricamento dello studio, lo zoom, l’acqua, la hero e il monitor. Il lavoro riguarda la fluidità dei film dei servizi e la loro riconoscibilità attraverso le immagini.

## Sviluppo e pubblicazione

HTML, CSS, JavaScript, Three.js 0.186.1 e Vite 8. Font e media sono locali; la build usa gli asset già pronti.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
npm run deploy
```

La suite dell’ingresso e del controller dei film comprende 28 gruppi: undici per l’ingresso e diciassette per la gestione dei media. I controlli di Launch Room rimangono separati in `npm run test:legacy` e non attestano la homepage attuale.

La build statica è in `dist/`; `main` conserva i sorgenti e GitHub Pages pubblica `gh-pages`. Il deploy aggiorna soltanto le radici Space dichiarate in `scripts/deploy-pages.mjs`, preservando le altre cartelle e configurazioni del ramo.

## Percorso e offerta

L’indice mostra cinque miniature statiche tratte dai film dei servizi, collegate ai rispettivi capitoli. Le immagini anticipano l’offerta senza aggiungere altro testo. Ogni capitolo mantiene un titolo esplicito prima del film, una frase e una riga di formati. La precedente revisione editoriale ha ridotto il testo da 621 a 278 parole, circa il 55%, sotto la hero escludendo form, apertura e footer. I crediti restano consultabili nel footer.

| Capitolo | Cosa proponiamo | Dimostrazione |
| --- | --- | --- |
| Siti web ed e-commerce | Vendita online, siti vetrina, landing, prenotazioni ed esperienze 3D | Cinque siti con identità diverse e demo apribili |
| Loghi e identità | Logo, palette, packaging e comunicazione | Identità FORMA applicata al packaging e alla carta |
| Video e animazioni 3D | Film di lancio, CGI e loghi animati | ORA: vetro, luce e regia di prodotto |
| Social e campagne | Contenuti, creatività pubblicitarie ed eventi | SHIFT: un video diventa una campagna in tre formati |
| Progetti e bandi | Obiettivi, attività, partner, budget e candidature | Dossier che organizza idea, piano e impatto |

Le cinque demo sono **SHIFT** (e-commerce sportivo), **VELA** (design), **NOVA** (servizi beauty), **BASILICO** (ristorazione) e **OLTRE** (eventi e associazioni). Il percorso è `public/showcase/index.html?scene=shift|vela|nude|basilico|oltre`; `nova` è un alias di `nude`. Carrello, prenotazioni e moduli sono dimostrativi e locali, senza pagamenti o invii esterni.

`src/atelier-cinema.js` coordina caricamento vicino allo schermo, pausa, visibilità e film in primo piano. `src/web-reel-motion.js` definisce la nuova timeline web a 60 fps. Navigazione, descrizioni, contatti e cinque box idea rimangono HTML su scroll nativo. Movimento ridotto e risparmio dati mantengono i poster e la riproduzione manuale.

I box idea preparano bozze WhatsApp: il visitatore decide se inviarle. I bandi comprendono opportunità europee, nazionali, regionali, provinciali, private, di fondazioni e banche, senza annunci di aperture o promesse di contributi. Concept e marchi dimostrativi non documentano clienti, commesse o risultati commerciali.

**Space Media Studio — Stradello Conrad Marca Relli 1, Parma. +39 347 962 3498.**

## Produzione del 4 novembre 2026

| Film | Metodo e regia | Profili | Cadenza | Stato |
| --- | --- | --- | --- | --- |
| Web | Interfacce originali, prospettiva e transizioni quintiche di 0,6 s | 1920×1080 e 720×900 | 10 s, 600 frame per profilo, 60 fps nativi della composizione | Completato e verificato |
| FORMA | Geometria Blender, apertura del packaging e ricomposizione controllata | 1920×1080 e 720×900 | 6 s, 288 frame per profilo, 48 fps nativi | Completato e verificato |
| ORA | Film di prodotto Higgsfield approvato | 1920×1080 e derivato 720×900 | 8,041667 s, 193 frame per profilo, 24 fps | Completato e verificato |
| SHIFT | Video centrale, dispiegamento dei formati, hold e ricomposizione | 1920×1080 e 720×900 | 6 s, 360 frame per profilo, composizione nativa a 60 fps | Completato e verificato |
| Dossier | Render Blender già approvato | 1920×1080 e 720×900 | 4 s, 120 frame per profilo, 30 fps nativi | Conservato dal rilascio precedente |

I file del nuovo rilascio usano i prefissi `motion-web`, `motion-brand`, `motion-product` e `motion-campaign`, con varianti `-mobile`. Il dossier mantiene `cinema-funding`. I metodi restano distinti: il film interno alla campagna SHIFT è il precedente sorgente Higgsfield a 24 fps, campionato nella composizione a 60 fps senza interpolazione ottica. Non si attribuiscono 60 fps al film AI e non si dichiarano 4K o fotogrammi inventati.

Il nuovo FORMA è completato in entrambi i profili: 1920×1080 e 720×900, sei secondi, 288 frame ciascuno a 48 fps nativi. H.264 High livello 4.2 desktop e 4.1 portrait. Film e poster desktop pesano 1.612.293 e 116.334 byte; quelli portrait 488.111 e 44.065 byte. Totale dei quattro file: 2.260.803 byte. Sono superati reimportazione dei master, preflight di tutte le pose, contatti e separazione fisica, loop, controllo dei 576 frame nativi, confronto di tre campioni codificati per profilo, decodifica e faststart.

SHIFT è completato: 720 frame nativi complessivi, cinque campioni per profilo confrontati con gli export, decodifica completa, loop e faststart verificati. Gli export H.264 High/yuv420p usano livello 4.2 per 1080p60 e 4.1 per 720×900/60. Film e poster pesano 3.812.286 byte complessivi; poster dal frame 144. La regia sostituisce l’oscillazione continua con presentazione centrale, apertura sfalsata, pausa leggibile e ritorno.

Il nuovo ORA Higgsfield è approvato e integrato: il secondo tentativo mantiene un solo flacone coerente e chiude sul fotogramma iniziale senza dissolvenze editoriali. Tutti i 193 frame del sorgente a 24 fps sono conservati. Il derivato 720×900 deriva dal crop nativo 864×1080, con origine a x=528/y=0, e riduzione di risoluzione. Film e poster sono quattro file, 4.282.343 byte complessivi. Decodifica completa dei 386 frame consegnati, controllo dei pixel e confronto di tre campioni per profilo con i master superati. Il primo video è escluso dalla consegna per variazione dell’identità; il suo frame 0 è stato usato come unico anchor della rigenerazione. Il precedente ORA Blender rimane archivio.

## Media e sorgenti

- [ASSET-MOTION-CAMPAIGN-20261104.json](./ASSET-MOTION-CAMPAIGN-20261104.json): nuova campagna, sorgenti e verifiche reali.
- [ASSET-MOTION-WEB-20261104.json](./ASSET-MOTION-WEB-20261104.json): reel web nativo a 60 fps, sorgenti e verifiche.
- [ASSET-MOTION-PRODUCT-20261104.json](./ASSET-MOTION-PRODUCT-20261104.json): nuovo ORA Higgsfield, derivato portrait, tentativi e verifiche.
- [ASSET-MOTION-BLENDER-20261104.json](./ASSET-MOTION-BLENDER-20261104.json): nuovo branding Blender, profili nativi e verifiche.
- [ASSET-CINEMA-BLENDER.json](./ASSET-CINEMA-BLENDER.json): precedente FORMA e dossier; il dossier rimane attivo.
- [ASSET-CINEMA-CAMPAIGN.json](./ASSET-CINEMA-CAMPAIGN.json): precedente campagna e origine del sorgente Higgsfield SHIFT.
- [ASSET-WEB-SHOWREEL.json](./ASSET-WEB-SHOWREEL.json): precedente reel web a 30 fps.
- [ASSET-WEB-REEL-VISUALS.json](./ASSET-WEB-REEL-VISUALS.json): quattro immagini originali AI delle demo, a 1536×1024 nativi.
- [ASSET-ATELIER.json](./ASSET-ATELIER.json): acqua Film Composite/Pexels e licenza.
- [ASSET-SERVICE-MOTION.json](./ASSET-SERVICE-MOTION.json), [ASSET-ATELIER-MOTION.json](./ASSET-ATELIER-MOTION.json), [ASSET-ATELIER-VISUALS.json](./ASSET-ATELIER-VISUALS.json): produzioni e dettagli precedenti, con fatti e hash originali.
- [ASSET-SOURCES.md](./ASSET-SOURCES.md), [MOTION-SERVICES.md](./MOTION-SERVICES.md): provenienza e regia.

Master, frame e catture restano in `outputs/`, esclusi dal sito pubblico. Le nuove produzioni usano `outputs/motion-campaign-20261104/` e le cartelle degli altri film dichiarate nei manifest. Nessun master Blender o film AI grezzo è caricato dalla homepage.

## Verifiche

Il reel web del 4 novembre ha superato i controlli di 1.200 frame nativi, dimensioni, assenza di frame neri, loop, decodifica, faststart e cinque campioni codificati per profilo. I quattro file pesano 11.250.745 byte.

La campagna del 4 novembre ha superato i controlli dei 720 frame nativi, la chiusura del loop, la geometria di 361 pose per profilo, la decodifica degli export, faststart e confronto con campioni codificati. Il minimo margine del contenuto è 89,96 px su desktop e 22,54 px su portrait. I controlli dei materiali restano distinti dalle prove browser documentate di seguito.

La nuova prova locale desktop è passata, con ricevuta `outputs/proofs/motion-local-desktop-20261104.json`. Le cinque miniature sono caricate; le cinque direzioni del reel sono correttamente sincronizzate ai seek. Tutti i film 1920×1080 sono stati riprodotti e messi in pausa, con durate attese di 10, 6, 8,041667, 6 e 4 secondi. Cinque brief validati senza invio e cinque demo aperte con immagini caricate. Nessun errore JavaScript o richiesta esterna osservati.

Le sei viewport 1440×1100, 1024×768, 700×1000, 393×852, 320×667 e 844×390 non mostrano overflow laterale; i link dell’indice hanno altezza di almeno 44 px. Questa prova di layout riusa i film già caricati nel contesto desktop: non sostituisce la prova dedicata dei file portrait. `npm test` supera 28 gruppi e la build è completata con 19 moduli. Il markup della hero in entrambe le pagine e i sei sorgenti dell’apertura sono identici alla revisione precedente.

La prova dedicata del telefono emulato è passata, con ricevuta `outputs/proofs/motion-local-phone-20261104.json`: tutti e cinque i film sono 720×900 in riquadri 4:5, con durate attese e pause funzionanti. La rotazione a 844×390 contiene lo stesso file portrait in un riquadro 16:9. Una nuova navigazione con movimento ridotto lascia tutti i sei video senza sorgente e in pausa; la richiesta manuale avvia FORMA a 720×900. Nessun errore JavaScript osservato.

Produzione e verifiche locali sono completate. La verifica della pubblicazione viene registrata separatamente in `outputs/proofs/motion-20261104-final-verification.json` dopo il deploy. Le ricevute `cinema-final-verification.json`, `cinema-public-desktop-result.json` e `cinema-public-phone-result.json` restano riferite al rilascio del 3 novembre.

Le prove browser sono condotte in Chromium isolato e telefono emulato. Non attestano un iPhone fisico, Safari o una frequenza di presentazione misurata sul dispositivo. Poster e HTML restano disponibili anche con movimento ridotto.
