// Original, illustrative product directions. These are not commissioned client projects.
export const digitalConcepts = {
  seta: {
    name: 'Seta', category: 'essenziale', label: 'Sito essenziale',
    card: 'Un sito essenziale per studi beauty, wellness e professionisti del benessere.',
    title: 'Seta — La calma, online',
    imageAlt: 'Concept Seta: sito beauty essenziale con palette crema e salvia',
    description: 'Un possibile sito per uno studio beauty o wellness, costruito attorno a immagini, servizi e dettagli essenziali. Un percorso breve accompagna le persone dalla scoperta alla richiesta di un appuntamento.',
    deliverables: ['Sito responsive con servizi e listino', 'Direzione visiva e tipografica', 'Contatti e richiesta di appuntamento'],
  },
  tavola: {
    name: 'Tavola', category: 'essenziale', label: 'Ristorante & menu digitale',
    card: 'Un sito per ristoranti, con menu digitale e prenotazioni sempre a portata.',
    title: 'Tavola — Il gusto di esserci',
    imageAlt: 'Concept Tavola: sito per ristorante con menu e prenotazioni',
    description: 'Un possibile sito per un ristorante, dove cucina, atmosfera e persone hanno il giusto spazio. Menu e prenotazioni restano facili da trovare, anche dal telefono.',
    deliverables: ['Sito con racconto, immagini e contatti', 'Menu digitale aggiornabile', 'Collegamento al sistema di prenotazione'],
  },
  noma: {
    name: 'Noma', category: 'essenziale', label: 'Portfolio & studio creativo',
    card: 'Portfolio eleganti per architetti, interior designer e studi creativi.',
    title: 'Noma — Spazio alle idee',
    imageAlt: 'Concept Noma: portfolio di interior design con una stanza illustrata e toni caldi',
    description: 'Un possibile portfolio per uno studio di architettura o interior design. Grandi immagini, schede progetto e una navigazione discreta lasciano parlare il lavoro.',
    deliverables: ['Portfolio responsive dei progetti', 'Schede con immagini e dettagli', 'Gestione semplice dei contenuti'],
  },
  focus: {
    name: 'Focus', category: 'essenziale', label: 'Landing page',
    card: 'Una pagina dedicata a un prodotto, un lancio o una richiesta.',
    title: 'Focus — Una pagina, una direzione',
    imageAlt: 'Concept Focus: landing page di lancio nera e lime con un pulsante di contatto',
    description: 'Una possibile landing page per presentare un prodotto, un servizio o un nuovo lancio. Ogni sezione sostiene un obiettivo preciso: ricevere richieste, iscrizioni o contatti.',
    deliverables: ['Design e sviluppo della landing page', 'Testi, immagini e struttura dei contenuti', 'Modulo contatti o integrazione newsletter'],
  },
  vela: {
    name: 'Vela', category: '3d', label: 'Minisito 3D',
    card: 'Un piccolo sito 3D che mette il tuo prodotto al centro.',
    title: 'Vela — Una nuova prospettiva',
    imageAlt: 'Concept Vela: minisito di prodotto blu e bianco con una scultura morbida originale',
    description: 'Un possibile minisito per presentare un prodotto attraverso una scena 3D. Rotazioni, dettagli e transizioni accompagnano il racconto, con una versione curata anche per smartphone.',
    deliverables: ['Pagina responsive con scena 3D', 'Movimento e interazioni sul prodotto', 'Versione statica alternativa e ottimizzazione mobile'],
  },
  materia: {
    name: 'Materia', category: '3d', label: 'Configuratore 3D',
    card: 'Un configuratore 3D per esplorare colori, materiali e varianti di un prodotto.',
    title: 'Materia — Scegli ogni dettaglio',
    imageAlt: 'Concept Materia: configuratore di arredo con una lampada illustrata e campioni di colore',
    description: 'Un possibile configuratore per vedere come cambia un prodotto scegliendo finiture e varianti. L’anteprima 3D rende più chiara la scelta prima di richiedere informazioni o un preventivo.',
    deliverables: ['Modello 3D preparato per il web', 'Selettori di materiali, colori e varianti', 'Riepilogo della configurazione e richiesta'],
  },
  ritual: {
    name: 'Ritual', category: 'commerce', label: 'E-commerce essenziale',
    card: 'Un piccolo e-commerce per collezioni curate e prodotti da scoprire.',
    title: 'Ritual — Il tuo piccolo universo',
    imageAlt: 'Concept Ritual: piccolo shop skincare con flaconi illustrati e schede prodotto',
    description: 'Un possibile e-commerce per un brand con una collezione selezionata. Fotografie, schede prodotto e acquisto condividono un’esperienza semplice e riconoscibile.',
    deliverables: ['Vetrina responsive della collezione', 'Schede prodotto e carrello', 'Configurazione di pagamenti e spedizioni'],
  },
  slot: {
    name: 'Slot', category: 'app', label: 'Web app prenotazioni',
    card: 'Una web app per scegliere servizi, disponibilità e prenotare un appuntamento.',
    title: 'Slot — Il momento giusto',
    imageAlt: 'Concept Slot: interfaccia di prenotazione con calendario e orari su fondo lavanda',
    description: 'Una possibile web app per studi e attività che lavorano su appuntamento. Le persone scelgono servizio e orario, mentre l’attività gestisce le richieste da un unico spazio.',
    deliverables: ['Percorso di prenotazione responsive', 'Calendario con servizi e disponibilità', 'Area di gestione delle richieste'],
  },
  index: {
    name: 'Index', category: 'essenziale', label: 'Magazine & newsletter',
    card: 'Un magazine digitale per articoli, newsletter e contenuti da seguire.',
    title: 'Index — Idee da tenere',
    imageAlt: 'Concept Index: magazine digitale editoriale in bianco e nero con articoli e newsletter',
    description: 'Un possibile magazine per un brand che vuole raccontare idee, storie e competenze. Articoli, categorie e newsletter costruiscono un archivio da esplorare e ritrovare.',
    deliverables: ['Design editoriale e archivio articoli', 'Sistema per pubblicare i contenuti', 'Integrazione dell’iscrizione alla newsletter'],
  },
};

for (const [id, concept] of Object.entries(digitalConcepts)) {
  concept.digital = true;
  concept.image = `./previews/${id}.svg`;
  concept.discipline = concept.label;
  concept.wordmark = '';
  concept.signature = '';
}
