# Studio refinement — 11 ottobre 2026

Direzione: mantenere Space Grotesk / DM Mono, nero, bianco caldo e lime. Il movimento iniziale deve mostrare una costruzione leggibile, mentre la parte inferiore deve rendere immediata l’offerta dello studio.

## Riferimenti studiati

- Libreria locale Studio frontend, schede **On-Scroll Layout Formations**, **Blur Fade** e **Staggered Menu**: composizione da pose assolute, ingresso breve dei contenuti, semantica coerente anche durante chiusure e riaperture. Fonti: https://tympanus.net/Development/OnScrollLayoutFormations/ e https://reactbits.dev/components/staggered-menu. Consultate le note e i sorgenti conservati nella libreria; nessun codice o asset di queste demo è incorporato.
- Libreria locale siti-3d, schede del configuratore Poimandres e delle transizioni ambientali: relazione fra HTML e canvas, continuità del caricamento e resa del materiale tramite ambiente. Il progetto conserva Three.js vanilla e le risorse originali, senza introdurre React o altre dipendenze.

## Adattamento originale

- **Hero:** otto volumi pieni e morbidi diventano una scultura compatta, si separano, si ricompongono in un totem e convergono nel prodotto. Quaternioni, posizioni e scale derivano dalla fase assoluta della sequenza. La scala diminuisce durante l’apertura per lasciare liberi testi e controlli. Il contenitore usa `overflow: clip`: il focus dei controlli non può scorrere internamente la composizione.
- **Servizi:** quattro tavole compatte con griglia sottile, simboli con spessore, titoli espliciti e dodici attività sempre presenti in HTML. Movimento solo sui dettagli decorativi, con variante a movimento ridotto.
- **Catalogo digitale:** nove interfacce originali, più compatte delle tre direzioni creative. Tre colonne su desktop, due su tablet e una sul telefono; filtri con conteggio accessibile, anteprime SVG autonome e dettaglio con tre attività concrete. Siti essenziali, web 3D, piccoli shop e app sono mostrati senza simulare incarichi ricevuti.
- **Film:** una nuova sequenza Blender riprende gli otto volumi pieni: compatta, apertura, totem, ricomposizione. Export Full HD e verticale dedicato.
- **Concept:** anteprima fotografica e contenuto affiancati su desktop, impilati su telefono. L’apertura dura 300 ms; chiusura nativa immediata, Escape, focus restituito e scroll esterno bloccato. La fotografia e il marchio sono dimostrativi, con attribuzione visibile.

Stack: HTML, CSS, JavaScript ESM, Three.js 0.186.1, Vite 8.3.4. Nessuna nuova dipendenza o risorsa esterna. Le fotografie esistenti mantengono le licenze documentate in `ASSET-SOURCES.md`.

La verifica comprende build di produzione, immagini renderizzate delle tre pose 3D, desktop 1280×720, viste responsive 390×844 e 320×667, menu, pausa, focus, dialog e movimento ridotto. Le dimensioni mobili sono simulate nel browser; non costituiscono una misurazione su iPhone fisico.

## Correzione delle traiettorie

Le coppie mantengono il proprio ordinamento alto/basso. Entrando nel totem, posizione e scala verticali raggiungono prima il livello di destinazione; la chiusura in profondità avviene dopo. All’uscita l’ordine si inverte. Le traiettorie dirette evitano gli archi che portavano i volumi ad attraversarsi. Il controllo BVH sulla mesh dell’hero ha campionato 721 istanti a intervalli di 25 ms lungo il ciclo di 18 secondi, senza intersezioni rilevate tra gli otto moduli. Il film ha un controllo separato sui suoi 144 fotogrammi.
