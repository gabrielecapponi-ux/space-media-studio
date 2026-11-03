# Dentro Space — regia visiva

L’ingresso approvato rimane il riferimento: studio che si costruisce, zoom nel monitor, apertura «Brand. Web. Motion.» sull’acqua. Bianco caldo, grafite, giallo, Space Grotesk e DM Mono restano invariati.

Il seguito usa cinque gesti coerenti con l’offerta, descritti in [MOTION-SERVICES.md](./MOTION-SERVICES.md). Una sequenza principale per servizio, un solo supporto fotografico dove serve, testi brevi e spazio vuoto. Sono rimossi la composizione web duplicata, il diagramma di progetto duplicato e gli elenchi ripetuti nei case. Restano quattro concept dimostrativi, senza clienti o commesse attribuiti, e una sezione distinta per progetti e bandi.

## Movimento

`src/atelier-cinema.js` controlla i film sotto la hero e la parallasse dei dettagli. Il movimento degli oggetti è renderizzato in Blender con fasi periodiche; il sito non simula rotazione libera o configurazione. La camera e i materiali sono parte della composizione originale, con una sola intenzione per scena.

Il controller prepara i media vicino allo schermo e riproduce quelli visibili. Rispetta pausa esplicita, menu, pagina nascosta, movimento ridotto e risparmio dati. La rotazione del telefono non scarica di nuovo il film già scelto. La tipografia SPAZIO conserva una variante verticale; gli altri quattro film mantengono la proporzione nativa 16:10, senza tagliare gli oggetti.

Scroll, testi, navigazione, cinque form e contatti restano HTML. Il visitatore decide se inviare la bozza su WhatsApp. Il dossier progettuale illustra metodo, attività e risorse, senza annunciare bandi aperti o promettere contributi.

## Produzione e verifica

La stanza è Three.js originale; l’acqua è stock fotografico dichiarato; i film dei servizi sono Blender; i tre dettagli fotografici sono raster AI. AVANT incorpora una texture architettonica AI. Provenienza e specifiche sono in [ASSET-SOURCES.md](./ASSET-SOURCES.md).

`index.html` è canonico e `atelier.html` rimane un alias con `noindex`. I vecchi diorami Launch Room sono archivio sorgente, senza caricamento nella homepage. Build, prove del controller e verifiche reali nel browser sono documentate nel [README](./README.md#verifiche). Il deploy sostituisce solo le radici Space dichiarate.
