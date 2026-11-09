# Cartella operativa Space Media

## Mappa dei file

| Percorso | Ruolo | Regola |
| --- | --- | --- |
| `index.html`, `atelier.html` | Homepage e variante noindex | Entrambe caricano `src/atelier.js` |
| `src/atelier.js` e dipendenze | Codice attivo dell'agenzia | Verificare il grafo con `npm run assets:check` |
| `src/main.js`, `test:legacy` | Esperienza storica | Non attestano la homepage corrente |
| `config/agency-assets.json` | Elenco esplicito dei file pubblici consegnati | Aggiungere qui ogni nuova risorsa, incluse le varianti dinamiche |
| `public/` | Asset web correnti e generazioni precedenti | La build copia soltanto i file del manifest; gli originali restano disponibili |
| `ASSET-SOURCES.md`, `scripts/director-*`, `scripts/elegant-films/` | Provenienza e ricette | I manifest storici descrivono la propria edizione |
| `outputs/` | Master, render, rapporti, copie del contesto | Locale, escluso dalla pubblicazione e da Git |
| `dist/` | Build locale rigenerabile | Può differire dalla versione pubblicata |
| `mrsmeet/` | Sito cliente nello stesso repository | Commit e rilascio separati; il deploy agenzia lo preserva |
| `farmacia-2/`, `volpi-2/` | Copie operative di altri progetti | Escluse dal repository genitore; usare la rispettiva scheda e destinazione |
| `.agency/`, `AGENTS.md`, `LINK-SITES.md` | Contesto privato condiviso fra chat | Conservato localmente con snapshot verificati; non pubblicato nel repository pubblico |

## Controlli e build

```sh
npm run context:backup
npm run assets:check
npm test
npm run build
npm run preview
```

I test di ingresso, media e percorso vengono eseguiti sul codice attivo. Si aggiungono controlli del manifest e della copia di pubblicazione. I conteggi nei rapporti storici valgono per il commit indicato: per lo stato attuale usare l'output dei test. I controlli automatici senza browser non attestano qualità visiva o prestazioni su telefoni fisici.

Il manifest include file richiamati direttamente, varianti costruite da JavaScript, risorse delle cinque demo e licenze. I riferimenti dinamici vanno riesaminati quando cambiano le espressioni del codice. Il controllo automatico aiuta a trovare omissioni, ma non sostituisce le prove nel browser su tutti i profili.

Per un nuovo asset: produrre il master in `outputs/`, esportare il file web in `public/`, aggiornare manifest e provenienza, verificare build e comportamento nel browser. Non eliminare generazioni precedenti per prefisso: le demo possono riusare immagini storiche.

## Pubblicazione riproducibile

Prima salvare e inviare su `main` esclusivamente i sorgenti pertinenti, verificando l'elenco dei file. Evitare `git add .` nella cartella condivisa. Poi usare un commit preciso:

```sh
npm run deploy -- --ref <commit-sorgenti-gia-inviato>
```

Il comando verifica che il commit appartenga a `main` remoto, estrae solo i file versionati in una cartella temporanea, installa dal lockfile, esegue test e build e aggiorna le sole radici dell'agenzia su `gh-pages`. Le modifiche locali e i media non versionati non entrano nel rilascio. Il comando senza `--ref` si ferma senza pubblicare. La copia rifiuta cartelle annidate, symlink e radici non appartenenti all'agenzia prima di cancellare file nella destinazione.

Un push di `gh-pages` non attesta ancora l'aggiornamento del sito: attendere il job Pages, verificare URL e file effettivamente serviti e registrare l'orario reale Europe/Rome. Rileggere `LINK-SITES.md` prima di aggiornarlo e seguire `AGENTS.md` per la notifica alla chat. Non aggiornare l'orario per semplici verifiche locali.

## Recupero del contesto

`npm run context:backup` salva i documenti operativi Markdown in `outputs/context-backups/<data-UTC>/`, con un manifest SHA-256 verificato dopo la scrittura. Esclude `.agency/work/`, master e credenziali. È eseguibile anche dopo una modifica della memoria per conservarne una nuova revisione.

Per recuperare un documento, confrontare la copia desiderata con il file corrente e ripristinare solo quello pertinente, dopo aver conservato anche lo stato corrente. Non ripristinare in blocco le schede di altre chat. Queste copie sono sullo stesso disco: un backup esterno dei master e del contesto richiede una destinazione scelta dall'utente.
