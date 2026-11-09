# Mr Smeet — Parma

Sorgenti del sito Mr Smeet ospitato nella cartella `/mrsmeet/` di [Space Media Studio](https://gabrielecapponi-ux.github.io/space-media-studio/mrsmeet/). HTML, CSS e JavaScript, con build Vite. La build viene generata in `dist/`; l'aggiornamento dei sorgenti non pubblica automaticamente GitHub Pages.

```sh
npm ci
npm run dev
npm run build
npm run preview
```

## Dati strutturati

Il prebuild esegue `scripts/build-structured-data.mjs --write` e aggiorna un unico blocco JSON-LD nelle sei pagine. Le tre homepage descrivono il ristorante, il menù, tre sezioni e dieci prodotti. Le pagine del sacchetto descrivono il locale e collegano il menù senza dichiarare prodotti assenti dal loro contenuto.

Le fonti del generatore sono:

- `data/menu.json` per nomi, ingredienti e prezzi approvati.
- `data/menu-presentation.json` per l'ordine di menù completi, panini e contorni.
- `data/appetite-media.json` per le fotografie statiche dei prodotti.
- `src/cart.js` per il calcolo del prezzo corrente, il telefono e la destinazione Glovo.
- `src/opening-hours.js` per gli orari ordinari, condivisi con la testata.
- `data/business.json` per nome, indirizzo, contatti e collegamenti verificati.

L'identità e i contatti sono confrontati con il [sito ufficiale Mr Smeet](https://mrsmeet.it/). Gli orari sono trascritti dal [cartello ufficiale](https://mrsmeet.it/wp-content/uploads/2025/11/orari-mrsmeet.jpg), verificato il 9 novembre 2026. Lunedì chiuso; martedì–giovedì 12:00–14:30 e 19:00–22:30; venerdì–sabato 12:00–14:30 e 19:00–23:30; domenica 19:00–23:00. Le aperture festive non sono note e restano da verificare con il locale.

Le offerte usano gli stessi prezzi visibili nelle schede e nel sacchetto. Non vengono inventate scadenze promozionali o disponibilità. Solo il prodotto esplicitamente denominato «100% vegano» riceve l'indicazione VeganDiet. Il markup non dichiara recensioni, fondatori, coordinate, valori nutrizionali o un checkout operativo.

Per verificare che il markup sia aggiornato e coerente:

```sh
npm run check:schema
```

Il comando controlla le sei pagine ed esegue nove test versionati in `scripts/structured-data.test.mjs`, inclusi corrispondenza di prezzi e orari, ordine dei prodotti, immagini esistenti, idempotenza ed escaping. Dopo una modifica ai dati, eseguire `npm run build` per rigenerare il JSON-LD prima del controllo. Il generatore senza argomenti prepara copie di revisione locali senza modificare le pagine.

I tipi seguono [Schema.org MenuItem](https://schema.org/MenuItem) e le [indicazioni Google per LocalBusiness](https://developers.google.com/search/docs/appearance/structured-data/local-business). Il 9 novembre 2026 il validatore Schema.org ha riportato zero errori e zero avvisi per i due tipi di pagina. Il Rich Results Test di Google ha richiesto accesso e non ha prodotto un risultato. La correttezza del markup non garantisce la comparsa di risultati avanzati nella ricerca.
