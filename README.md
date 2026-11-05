# Space Media Studio

Studio creativo di **Gabriele Capponi e Mattia Tanzi**, a Parma. Creiamo **siti web, e-commerce, loghi, identità, video, animazioni 3D e campagne**. Affianchiamo aziende, APS e ASD nella progettazione e nelle candidature a bandi.

[Apri il sito](https://gabrielecapponi-ux.github.io/space-media-studio/)

`index.html` è la homepage canonica; `atelier.html` ne conserva il contenuto con `noindex, nofollow`. La revisione del **5 novembre 2026** sostituisce profumo, confezione cilindrica e dossier con due nuovi concept di prodotto e un percorso illustrato. Caricamento dello studio, assemblaggio, zoom nel monitor, acqua e hero conservano la regia approvata.

## Sviluppo e pubblicazione

HTML, CSS, JavaScript, Three.js 0.186.1 e Vite 8. Font e media sono locali. Nessuna nuova dipendenza per questa revisione; la build usa gli asset già pronti.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
npm run deploy
```

La suite dell’ingresso e del controller dei film comprende 28 gruppi: undici per l’ingresso e diciassette per i media. I controlli storici di Launch Room rimangono separati in `npm run test:legacy` e non attestano la homepage attuale.

La build statica è in `dist/`; `main` conserva i sorgenti e GitHub Pages pubblica `gh-pages`. `scripts/deploy-pages.mjs` sostituisce soltanto le radici Space dichiarate, preservando le altre cartelle e configurazioni del ramo.

## Percorso e offerta

Cinque miniature collegano direttamente ai servizi. Ogni capitolo mantiene un titolo esplicito, una frase e una riga di formati; le immagini mostrano esempi possibili, senza presentarli come clienti o commesse reali.

| Servizio | Esempio visivo | Metodo |
| --- | --- | --- |
| Siti web ed e-commerce | Cinque direzioni: sport, design, beauty, ristorazione e associazioni | Interfacce originali e composizione CSS 3D |
| Loghi e identità | CACAO ATELIER: cofanetto, cioccolato e identità coordinata | Geometria, materiali e regia Blender originali |
| Video e animazioni 3D | LUMA: fotocamera di design con ottiche che si separano e ricompongono | Geometria, materiali e regia Blender originali |
| Social e campagne | SHIFT: un annuncio si declina in tre formati | Composizione CSS 3D con inserto video Higgsfield |
| Progetti e bandi | Una linea disegna idea, scrittura insieme, candidatura e progetto realizzato | Animazione SVG originale, nera su giallo |

Le cinque demo web sono **SHIFT**, **VELA**, **NOVA**, **BASILICO** e **OLTRE**. Il percorso è `public/showcase/index.html?scene=shift|vela|nude|basilico|oltre`; `nova` è un alias di `nude`. Carrello, prenotazioni e moduli sono dimostrativi e locali, senza pagamenti o invii esterni.

I cinque box “Descrivi la tua idea” preparano bozze WhatsApp: il visitatore decide se inviarle. L’offerta bandi comprende opportunità UE, nazionali, regionali, provinciali, private, di fondazioni e banche. Requisiti, ammissibilità ed esito sono da verificare per ogni candidatura: il percorso illustrato non promette un finanziamento.

**Space Media Studio — Stradello Conrad Marca Relli 1, Parma. +39 347 962 3498.**

## Animazioni attive

| Materiale | File o sorgente | Profilo e cadenza |
| --- | --- | --- |
| Reel web | `motion-web.mp4`, variante `-mobile` | 1920×1080 e 720×900; 10 s, 600 frame per profilo, composizione nativa a 60 fps |
| CACAO ATELIER | `showcase-brand.mp4`, variante `-mobile` | Due camere Blender dedicate, 1920×1080 e 720×900; 6 s, 288 frame per profilo a 48 fps |
| LUMA | `showcase-product.mp4`, variante `-mobile` | Due camere Blender dedicate, 1920×1080 e 720×900; 6 s, 288 frame per profilo a 48 fps |
| Campagna SHIFT | `motion-campaign.mp4`, variante `-mobile` | 1920×1080 e 720×900; 6 s, composizione nativa a 60 fps, inserto Higgsfield a 24 fps |
| Percorso progetti | `src/funding-journey.js`, `src/funding-journey.css` | SVG responsive, ciclo di 22 s; nessun video da scaricare |

Le cadenze descrivono i materiali, non una misurazione del display del visitatore. I nuovi prodotti non sono filmati AI, modelli scaricati o prodotti realmente in commercio. Nessun aumento artificiale della risoluzione o interpolazione ottica; non si dichiarano 4K o 60 fps per i render a 48 fps o per l’inserto generativo a 24 fps.

`src/atelier-cinema.js` gestisce i quattro film dei servizi: caricamento vicino allo schermo, pausa e primo piano. Movimento ridotto e risparmio dati mantengono i poster e l’avvio manuale. Il percorso SVG ha controlli propri e una vista completa statica; si sospende fuori schermo, con menu aperto o pagina nascosta. Testi, demo, navigazione e contatti restano HTML su scroll nativo.

## Provenienza e archivio

- [ASSET-SOURCES.md](./ASSET-SOURCES.md): fonti, diritti e materiali attivi.
- [ASSET-SHOWCASE-BRAND-20261105.json](./ASSET-SHOWCASE-BRAND-20261105.json): CACAO ATELIER e verifiche dei render.
- [ASSET-SHOWCASE-PRODUCT-20261105.json](./ASSET-SHOWCASE-PRODUCT-20261105.json): LUMA e verifiche dei render.
- [ASSET-FUNDING-JOURNEY-20261105.json](./ASSET-FUNDING-JOURNEY-20261105.json): percorso vettoriale originale.
- [MOTION-SERVICES.md](./MOTION-SERVICES.md): regia dei cinque servizi.
- [ASSET-MOTION-WEB-20261104.json](./ASSET-MOTION-WEB-20261104.json): reel web mantenuto.
- [ASSET-MOTION-CAMPAIGN-20261104.json](./ASSET-MOTION-CAMPAIGN-20261104.json): campagna mantenuta e relativo inserto Higgsfield.
- [ASSET-WEB-REEL-VISUALS.json](./ASSET-WEB-REEL-VISUALS.json): immagini originali delle demo.
- [ASSET-ATELIER.json](./ASSET-ATELIER.json): film stock dell’acqua e lavorazioni.
- [ASSET-MOTION-BLENDER-20261104.json](./ASSET-MOTION-BLENDER-20261104.json), [ASSET-MOTION-PRODUCT-20261104.json](./ASSET-MOTION-PRODUCT-20261104.json), [ASSET-CINEMA-BLENDER.json](./ASSET-CINEMA-BLENDER.json): FORMA, ORA e dossier archiviati, con dati e hash originali preservati.

Master `.blend`, fotogrammi nativi e ricevute restano in `outputs/`, esclusi dal sito pubblico. La homepage usa solo film compressi, poster e SVG. Le produzioni precedenti rimangono documentate senza trasferire la loro provenienza ai nuovi materiali.

## Horizon-3d

Ricerca pubblica aggiornata al 5 novembre: [Halvane AR](https://horizonx.so/explore/halvane-ar), [Cyber Jackets](https://horizonx.so/explore/cyber-jackets) e [OSKEN](https://horizonx.so/explore/osken). Le tre schede attuali sono Premium Library: ciascuna richiederebbe un posto giornaliero personale e uno premium mensile. La scelta è in attesa; nessun download o export eseguito, nessun saldo di novembre assunto e nessun sorgente Horizon pubblicato. Il precedente CoverFlow non è mai stato acquisito o integrato e ora risulta anch’esso Premium.

## Verifiche

Superati i 28 gruppi dei controller esistenti e i controlli sui 1.152 fotogrammi Blender nativi dei due nuovi concept: geometria, inquadrature, continuità, confronto con le prove approvate, decodifica e compressione. Verificati nella build locale cinque anteprime, cinque demo, cinque brief, sei viewport da 320 a 1440 pixel, i quattro film in Full HD e portrait, pausa, rotazione, movimento ridotto e avvio manuale. Il percorso SVG ha verifiche separate di disegno, pausa, lifecycle, XML e decodifica dei poster. Nessun errore JavaScript o invio esterno nelle prove finali. Le ricevute sono in `outputs/showcase-20261105/qa/`; la verifica del sito pubblico rimane distinta da quella locale. I risultati del 4 novembre attestano soltanto il rilascio precedente.

Le prove browser del progetto usano Chromium isolato e telefono emulato. Non attestano un iPhone fisico, Safari o una frequenza di presentazione misurata sul dispositivo. Nessun form viene inviato durante la verifica.
