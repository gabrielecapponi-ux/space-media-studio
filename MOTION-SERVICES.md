# Cinque servizi, cinque gesti

L’ingresso nello studio, l’assemblaggio, lo zoom e l’acqua restano il riferimento approvato. La hero e il monitor dichiarano siti, e-commerce, loghi e video. La revisione del 3 novembre conserva questa apertura e concentra il nuovo lavoro sui cinque servizi successivi.

| Servizio | Gesto e soggetto | Funzione |
| --- | --- | --- |
| Siti web ed e-commerce | Showreel rapido di SHIFT, VELA, NOVA, BASILICO e OLTRE | Mostrare in dieci secondi prodotti, servizi, prenotazioni ed eventi possibili |
| Loghi e identità | Segno FORMA e materia stampata che si allineano | Collegare logo, packaging e comunicazione |
| Video e animazioni | Flacone ORA, vetro e riflessi con camera controllata | Presentare un prodotto e il suo carattere |
| Social e campagne | SHIFT: un prodotto, tre formati pubblicitari | Mostrare la campagna su social, annunci e formati diversi |
| Progetti e bandi | Dossier e piani che si organizzano | Collegare idea, attività, calendario e budget |

Il reel web sostituisce AVANT e usa interfacce HTML originali catturate nel browser, con transizioni CSS 3D deterministiche e codifica FFmpeg. Non è un render Blender o un video AI. FORMA, ORA e il dossier hanno scene Blender originali. La nuova composizione SHIFT usa trasformazioni CSS 3D e incorpora come superficie video il film Higgsfield completato e verificato visivamente. Una superficie video animata non è una mesh liberamente esplorabile; le immagini AI restano raster. Le cinque demo sono consultabili e hanno interazioni locali dimostrative, senza pagamenti o invii esterni.

Ogni film è preceduto dal nome concreto del servizio, una frase e una riga di formati. I contenuti editoriali ripetuti sono rimossi; il visitatore può passare direttamente a un capitolo dall’indice. Una sequenza principale per servizio e uno stato di primo piano evitano movimenti concorrenti. La pausa resta disponibile, i film vengono preparati vicino allo schermo, le preferenze di movimento ridotto e risparmio dati mantengono il percorso statico. Navigazione, box idea e descrizioni rimangono HTML, con scroll nativo.

Concept e marchi sono esempi possibili, non commesse. La progettazione resta distinta dai bandi aperti e non promette finanziamenti. Master, frame e catture rimangono locali in `outputs/web-reel/`, `outputs/nov26/`, `outputs/motion-services/`, `outputs/cinema-20261103/` e `outputs/cinema-campaign/`; i relativi manifest riportano provenienza e specifiche. Verifiche correnti nel [README](./README.md#verifiche).

## Produzione — 3 novembre 2026

- FORMA e dossier: Blender 5.2.1 LTS / EEVEE, 48 sample, 1920×1080 e 720×900 nativi, 120 fotogrammi a 30 fps, quattro secondi. Master `.blend`, frame e controlli in `outputs/cinema-20261103/{brand,funding}/{desktop,mobile}/`; tutti i quattro profili sono completati. Reimportazione, inquadratura, contatti, separazione di testi e oggetti, loop, continuità dei 480 frame nativi, decodifica, faststart e confronto con i campioni codificati superati. [ASSET-CINEMA-BLENDER.json](./ASSET-CINEMA-BLENDER.json) conserva i risultati verificati.
- SHIFT: composizione originale completata di tre formati pubblicitari con prospettiva e movimento; 1920×1080 e 720×900, 180 fotogrammi a 30 fps, sei secondi. Decodifica completa, struttura faststart e confronto dei campioni codificati con i master superati; poster dal fotogramma 55. [ASSET-CINEMA-CAMPAIGN.json](./ASSET-CINEMA-CAMPAIGN.json) conserva le ricevute.
- Higgsfield: film Seedance 2.5 completato e verificato visivamente; sorgente nativo 1920×1080, HEVC 10 bit, 24 fps, 193 fotogrammi e 8,041667 secondi. La campagna mantiene la cadenza interna a 24 fps dentro una composizione a 30 fps, senza interpolazione. La composizione chiude con una dissolvenza di 18 fotogrammi verso il primo frame del film, senza riproduzione inversa.

La precedente sequenza SPAZIO resta archivio di produzione. I manifest storici conservano i fatti e gli hash originali; la sostituzione riguarda solo l’integrazione nella homepage.
