# Atelier — homepage e alias

`index.html` è la homepage canonica; `atelier.html` conserva lo stesso contenuto con `noindex, nofollow`.

La revisione del **4 novembre 2026** conserva byte per byte la hero e i sorgenti dell’ingresso: stanza, assemblaggio, zoom, acqua e monitor. L’ingresso prepara font, poster, primo frame e scena, con ingresso immediato, Escape, limite temporale e percorso statico. La stanza è immaginaria.

Un indice di cinque miniature statiche anticipa siti, loghi, video, campagne e progetti. Ogni capitolo ha un titolo esplicito prima del film, una frase e una riga di formati. I cinque box idea e le demo HTML rimangono accessibili. La revisione editoriale precedente ha eliminato tre blocchi ripetuti e la lunga lista dei servizi, riducendo il testo editoriale del 55%.

La nuova regia web usa transizioni quintiche più lunghe a 60 fps; SHIFT passa da un video centrale a tre formati pubblicitari, con hold e ricomposizione a 60 fps. Il film interno SHIFT resta il sorgente Higgsfield a 24 fps. Il branding Blender è completato e verificato a 48 fps in entrambi i profili; il nuovo ORA Higgsfield è approvato a 24 fps, con derivato portrait verificato. Il dossier Blender mantiene i propri 30 fps. I metodi e le cadenze non sono intercambiabili.

- Ingresso: `src/atelier-entry.js`, `src/studio-room.js`, `src/entry-shell.js`, `src/entry.css`.
- Apertura: `src/atelier.js`, `src/atelier.css`.
- Controller: `src/atelier-cinema.js`, `src/atelier-cinema.css`, `src/web-reel.js`.
- Nuova timeline web: `src/web-reel-motion.js`; la precedente timeline rimane archivio.
- Demo: `public/showcase/index.html`, `showcase.css`, `showcase.js`.
- Nuovo reel web: `scripts/motion-web-20261104.mjs`, `motion-web-20261104-stage.html` e `motion-web-20261104-verify.py`.
- Nuovo ORA: `scripts/motion-product-20261104.py`, clip Higgsfield approvata e derivato portrait a cadenza originale; ricevute in [ASSET-MOTION-PRODUCT-20261104.json](./ASSET-MOTION-PRODUCT-20261104.json).
- Nuovo branding: `scripts/motion-20261104-brand.py`, master dedicati desktop e portrait e ricevute in [ASSET-MOTION-BLENDER-20261104.json](./ASSET-MOTION-BLENDER-20261104.json).
- Nuova campagna: `scripts/motion-campaign-20261104-render.mjs`, `motion-campaign-20261104-stage.html` e `motion-campaign-20261104-verify.py`.
- Materiali, regia e stato del rilascio: [ASSET-SOURCES.md](./ASSET-SOURCES.md), [MOTION-SERVICES.md](./MOTION-SERVICES.md), [README](./README.md#verifiche).

Master e sequenze in `outputs/` non sono pubblicati. I manifest precedenti conservano i fatti originali; AVANT, SPAZIO e Launch Room restano archivio. Il deploy selettivo preserva gli altri siti sul ramo Pages. La verifica locale desktop del nuovo sito è passata: cinque film e miniature, cinque brief, cinque demo, sincronizzazione del reel e sei viewport senza overflow. Tutti i film e le verifiche locali sono completati. La prova dedicata del telefono conferma cinque file 720×900 in 4:5, pause, rotazione, movimento ridotto e avvio manuale, senza errori JavaScript. La pubblicazione viene verificata separatamente dopo il deploy, con ricevuta `outputs/proofs/motion-20261104-final-verification.json`.
