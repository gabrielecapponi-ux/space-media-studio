# Studio refinement — 11 ottobre 2026

Direzione: mantenere Space Grotesk / DM Mono, nero, bianco caldo e lime. Il movimento iniziale deve mostrare una costruzione leggibile, mentre la parte inferiore deve rendere immediata l’offerta dello studio.

## Riferimenti studiati

- Libreria locale Studio frontend, schede **On-Scroll Layout Formations**, **Blur Fade** e **Staggered Menu**: composizione da pose assolute, ingresso breve dei contenuti, semantica coerente anche durante chiusure e riaperture. Fonti: https://tympanus.net/Development/OnScrollLayoutFormations/ e https://reactbits.dev/components/staggered-menu. Consultate le note e i sorgenti conservati nella libreria; nessun codice o asset di queste demo è incorporato.
- Libreria locale siti-3d, schede del configuratore Poimandres e delle transizioni ambientali: relazione fra HTML e canvas, continuità del caricamento e resa del materiale tramite ambiente. Il progetto conserva Three.js vanilla e le risorse originali, senza introdurre React o altre dipendenze.

## Adattamento originale

- **Hero:** gli stessi 24 archi diventano un rotore ordinato, una doppia elica curvata tramite morph e un prodotto. Quaternioni, posizioni e morph derivano dalla fase assoluta della sequenza. Il contenitore usa `overflow: clip`: il focus dei controlli non può scorrere internamente la composizione.
- **Servizi:** quattro tavole compatte con griglia sottile, simboli con spessore, titoli espliciti e dodici attività sempre presenti in HTML. Movimento solo sui dettagli decorativi, con variante a movimento ridotto.
- **Concept:** anteprima fotografica e contenuto affiancati su desktop, impilati su telefono. L’apertura dura 300 ms; chiusura nativa immediata, Escape, focus restituito e scroll esterno bloccato. La fotografia e il marchio sono dimostrativi, con attribuzione visibile.

Stack: HTML, CSS, JavaScript ESM, Three.js 0.186.1, Vite 8.3.4. Nessuna nuova dipendenza o risorsa esterna. Le fotografie esistenti mantengono le licenze documentate in `ASSET-SOURCES.md`.

La verifica comprende build di produzione, immagini renderizzate delle tre pose 3D, desktop 1280×720, viste responsive 390×844 e 320×667, menu, pausa, focus, dialog e movimento ridotto. Le dimensioni mobili sono simulate nel browser; non costituiscono una misurazione su iPhone fisico.
