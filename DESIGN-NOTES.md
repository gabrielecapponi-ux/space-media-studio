# Space / Launch Room — 12 ottobre 2026

«**Le idee. In grande.**» introduce una mostra digitale di quattro servizi. La riprogettazione sostituisce i film e i soggetti della versione precedente con un sistema coerente: supporti tridimensionali, immagini curate, camera e passaggi fra stazioni. Il movimento deve spiegare come un'idea diventa identità, spazio digitale, immagine di prodotto e campagna.

## Regia

La palette mantiene bianco caldo, nero e giallo elettrico. Space Grotesk e DM Mono sono locali. Il titolo, l'offerta e le azioni appartengono all'HTML; la scena Three.js accompagna il contenuto senza inglobare la navigazione o i form nel canvas.

1. **Branding:** un'immagine di identità FORMA su un supporto con spessore, affiancata da un manifesto tipografico e una didascalia. Il packaging è raffigurato nel raster, mentre i supporti sono geometrie 3D.
2. **Web:** il visual architettonico viene inserito in interfacce originali desktop e mobile. Sono superfici di presentazione tridimensionali di una direzione web possibile, non dispositivi o siti completi già consegnati.
3. **Prodotto:** ORA, un visual di fragranza con vetro spesso, liquido ambrato, acqua e luce. La scena mette in mostra il visual e la direzione artistica; il flacone non viene simulato come mesh.
4. **Campagne:** la seta gialla vive su un billboard curvo e su un formato verticale. Una sola direzione visiva mostra la continuità fra i supporti pubblicitari.

I nomi e i visual sono concept originali dimostrativi, non clienti o incarichi inventati. Le immagini vengono dichiarate come generate con AI; la geometria effettivamente interattiva riguarda la mostra, le superfici e la camera.

## Movimento e struttura

Quattro stazioni condividono la stessa scena e la camera si sposta tra loro in base alla posizione assoluta dello scroll nativo. Le pose delle superfici dipendono dalla distanza dalla stazione attiva: ingresso, esposizione e uscita appartengono a una sola coreografia reversibile. Non si intercettano wheel o swipe e non si impongono quattro gesti esatti.

L'apertura aggiunge un breve ingresso della camera. Un mouse con puntatore fine introduce un movimento contenuto; i supporti hanno una lieve oscillazione e l'illuminazione accompagna la mostra. I dettagli non devono trasformarsi in oggetti decorativi slegati dall'offerta.

Il rendering è confinato ai quattro capitoli. Pausa, menu, dialog e documento nascosto impediscono l'animazione; movimento ridotto e risparmio dati mantengono il percorso statico con immagini HTML. L'importazione della scena è dinamica. Il controller possiede listener, observer, geometrie, materiali, texture e risorse del renderer e li rilascia alla chiusura della pagina.

Il percorso rimane leggibile senza WebGL o JavaScript: titoli, descrizioni, immagini, link e form fanno parte del documento. La navigazione segnala il capitolo attivo e una linea indica l'avanzamento. I capitoli possono crescere quando il contenuto o un box idea aperto richiedono spazio.

## Progetti e richieste

Ogni concept apre un dialog nativo con immagine, racconto e attività; l'azione «Partiamo dalla tua idea» porta al box del servizio. Menu e dialog conservano i controlli HTML e il ripristino del focus. I cinque box idea usano form GET nativi verso WhatsApp, con un miglioramento JavaScript per contesto, conteggio e validazione. Il visitatore rilegge la bozza e decide se inviarla.

Progetti & bandi mantiene tre passaggi: idea e obiettivi, progetto e budget, opportunità e candidatura. Si rivolge ad aziende, APS e ASD e include ambiti europei, nazionali, regionali, provinciali, privati, fondazioni e istituti bancari. Gli esempi di digitalizzazione, cultura e sport sono generali: nessun bando viene dichiarato aperto e nessun contributo viene garantito.

## Materiali e skill

Quattro immagini image_gen a **1672×941 pixel nativi** forniscono una direzione fotografica distinta. Il visual branding ha ricevuto un edit per eliminare microtesti di contatto, indirizzo e anno. I master sono locali e ignorati; i JPEG web sono registrati con hash e byte in `ASSET-LAUNCH-ROOM.json`.

`studio-siti-space`, Studio frontend, UI animation e Siti 3D guidano gerarchia, composizione, movimento e gestione della scena. Three.js 0.186.1 è distribuito con licenza MIT; i font locali mantengono la SIL Open Font License.

La prova Video Non Higgsfield con ComfyUI/LTX è stata fermata per memoria disponibile prima di generare fotogrammi. Non costituisce un film di produzione e non produce asset del sito. Horizon CoverFlow non è stato acquisito o integrato; la Launch Room usa risorse e supporti originali e non consuma download Horizon.

## Verifica e pubblicazione

La build è stata controllata nel browser a 1200×728, 390×844, 320×667 e 844×390: nessun overflow laterale, foto complete negli slot mobile, copy libero dalle superfici alle quattro posizioni di lettura, menu e dialog nativi, focus e passaggio al box idea corretti. Pausa e box aperti mostrano il ripiego fotografico; la ripresa si riallinea al capitolo corrente. 39 gruppi di contratti locali coprono preferenze, errori, caricamento, cleanup, focus e form. Sono prove su browser desktop con viewport simulati, non su iPhone fisico.

Nella build locale, Chrome a 1200×728 ha mostrato il primo render 3D a 355 ms dalla navigazione (189 ms di setup, import escluso), con asset e ambiente locali/cache e senza throttling. Invio CPU per un render osservato fra circa 0,5 e 1,6 ms; 10 draw call e 2072 triangoli nella hero. In simulazione mobile le superfici secondarie vengono nascoste: 3 draw call, circa 690 triangoli. Questi dati non misurano la durata GPU né certificano frame rate o tempi su rete mobile. Le immagini totalizzano 1.145.984 byte; build statica circa 1,9 MB.

Il deploy aggiorna soltanto le radici Space dichiarate nello script, preservando siti e cartelle estranee nel ramo di pubblicazione. Le scene e i film precedenti rimangono archivio storico e non fanno parte della versione corrente.
