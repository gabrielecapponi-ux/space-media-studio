const scenes = {
  shift: {
    title: 'SHIFT — Strumenti musicali', product: 'PHASE 01 / Campionatore stereo',
    html: `<div class="site phase-store">
      <header class="site-nav phase-nav"><a class="site-logo phase-logo" href="#site-title" aria-label="SHIFT Audio">SHIFT<span>AUDIO</span></a><nav aria-label="Navigazione SHIFT"><a href="#site-title">Strumento</a><a href="#details">Dettagli</a></nav><button class="nav-action" data-cart type="button">Carrello <span class="cart-count">0</span></button></header>
      <section class="phase-hero" aria-labelledby="site-title">
        <div class="phase-intro"><p class="phase-label"><i></i>CAMPIONATORE STEREO</p><h1 id="site-title">PHASE <span>01</span></h1><p class="phase-description">Campiona, taglia, suona. Sedici pad sotto le dita e una ruota per trovare il punto esatto di ogni suono.</p>
          <fieldset class="phase-editions"><legend>Configurazione</legend><button type="button" data-edition="Studio" aria-pressed="true">Studio</button><button type="button" data-edition="Live" aria-pressed="false">Live</button></fieldset>
          <p class="phase-bundle" data-bundle>Strumento e alimentatore</p>
          <button class="phase-buy" data-buy type="button"><span>Aggiungi al carrello</span><span data-price>€690</span></button>
        </div>
        <figure class="phase-photo"><img src="./phase-01/hero.webp" alt="Sampler SHIFT PHASE 01 in alluminio, con sedici pad ambra, display di forma d’onda e ruota di controllo." width="1800" height="1350" fetchpriority="high" /></figure>
      </section>
      <section class="details-section phase-details" id="details"><div class="phase-detail-copy"><p class="phase-label"><i></i>I CONTROLLI</p><h2>Il suono,<br />da vicino.</h2><p>I sedici pad richiamano i campioni. Il display mostra la forma d’onda, mentre la ruota dentata regola il punto di attacco. Quattro encoder dedicati controllano intonazione, livello, filtro e drive.</p></div><figure><img src="./phase-01/overhead.webp" width="1800" height="1350" loading="lazy" alt="Vista dall’alto del pannello con matrice di pad, quattro encoder e controlli di trasporto." /></figure><figure class="phase-macro"><img src="./phase-01/detail.webp" width="1620" height="1080" loading="lazy" alt="Dettaglio del display, della ghiera lavorata e del cursore del volume." /></figure></section>
    </div>`
  },
  vela: {
    title: 'VELA — Pagina prodotto design', product: 'Forma / Lampada da tavolo', price: '€220',
    html: `<div class="site site-vela">
      <header class="site-nav"><a class="site-logo vela-logo" href="#">vela<span>®</span></a><nav aria-label="Navigazione VELA"><a href="#details">Luci</a><a href="#details">Oggetti</a><a href="#details">Il progetto</a></nav><button class="nav-action" data-cart type="button">Bag <span class="cart-count">0</span></button></header>
      <section class="site-hero vela-hero" aria-labelledby="site-title"><div class="hero-visual vela-visual"><img src="../images/reel-lamp.jpg" alt="Concept di una lampada scultorea arancione, con luce calda e superfici materiche." width="1536" height="1024" /><span class="lamp-caption">FORMA / TABLE LIGHT 01</span></div><div class="hero-copy"><p class="kicker">OGGETTI DA ABITARE.</p><h1 id="site-title">Una luce.<br />Un nuovo<br /><em>ritmo.</em></h1><p class="hero-description">La forma incontra la luce.<br />Il resto diventa atmosfera.</p><button class="primary-action" data-buy type="button"><span>Scopri Forma</span><span>€220&nbsp; ↗</span></button></div><div class="vela-detail"><span class="tiny-label">DISEGNATA PER RESTARE.</span><span>Materia, proporzioni,<br />un carattere essenziale.</span><span class="swatch-row" aria-label="Colori: cotto, crema e grafite"><i></i><i></i><i></i></span></div></section>
      <section class="details-section" id="details"><p class="kicker">FORMA / IL PRODOTTO</p><h2>Il dettaglio<br />fa la stanza.</h2><div class="detail-options"><span>01 / Una luce calda</span><span>02 / Una forma essenziale</span><span>03 / Tre finiture</span></div><p>Una pagina prodotto editoriale: il soggetto, le sue caratteristiche, i dettagli e un percorso d’acquisto essenziale.</p><button class="text-action" data-buy type="button">Aggiungi Forma alla tua demo ↗</button></section>
    </div>`
  },
  nude: {
    title: 'NOVA — Servizi e beauty',
    html: `<div class="site site-nude"><header class="site-nav"><a class="site-logo nude-logo" href="#">nova<span>studio</span></a><nav aria-label="Navigazione NOVA"><a href="#details">Il metodo</a><a href="#details">I rituali</a><a href="#details">Lo studio</a></nav><button class="nav-action" data-consult type="button">Prenditi un momento ↗</button></header><section class="site-hero nude-hero" aria-labelledby="site-title"><div class="hero-visual nude-visual"><img src="../images/reel-skincare.jpg" alt="Concept beauty con confezioni per la cura della pelle, lilla e verdi, in luce naturale morbida." width="1536" height="1024" /><span class="nude-seal">LESS ROUTINE.<br />MORE YOU.</span></div><div class="hero-copy"><p class="kicker">RITUALI DI BENESSERE, SU MISURA.</p><h1 id="site-title">Prenditi<br />il tuo<br /><em>spazio.</em></h1><p class="hero-description">Una pausa. Un rituale.<br />Un momento che parla di te.</p><button class="primary-action" data-consult type="button">Prenota una consulenza <span>↗</span></button></div><div class="nude-foot"><span>CONSAPEVOLI. ESSENZIALI. PERSONALI.</span><span>Il tuo tempo comincia qui. ↓</span></div></section><section class="details-section" id="details"><p class="kicker">IL METODO NOVA</p><h2>Prima l’ascolto.<br />Poi il tuo rituale.</h2><div class="detail-options"><span>01 / Conosciamoci</span><span>02 / Scegli il tuo momento</span><span>03 / Trova il tuo equilibrio</span></div><p>Un sito per un’attività di servizi: racconta il metodo, presenta i percorsi e semplifica la richiesta di un appuntamento.</p><button class="text-action" data-consult type="button">Scegli un appuntamento demo ↗</button></section></div>`
  },
  basilico: {
    title: 'BASILICO — Ristorazione e prenotazioni',
    html: `<div class="site site-basilico"><header class="site-nav"><a class="site-logo basilico-logo" href="#">basilico.</a><nav aria-label="Navigazione BASILICO"><a href="#details">La cucina</a><a href="#details">Il menu</a><a href="#details">La nostra tavola</a></nav><button class="nav-action" data-book type="button">Prenota un tavolo ↗</button></header><section class="site-hero basilico-hero" aria-labelledby="site-title"><div class="hero-visual basilico-visual"><img src="../images/reel-food.jpg" alt="Concept di cucina italiana contemporanea: un piatto di pasta in un’atmosfera calda e conviviale." width="1536" height="1024" /></div><div class="hero-copy"><p class="kicker">CUCINA DI STAGIONE. SENZA FILTRI.</p><h1 id="site-title">Fatto bene.<br /><em>Da sempre.</em></h1><p class="hero-description">Buone cose, persone vicine.<br />Il nostro ingrediente preferito sei tu.</p><button class="primary-action" data-book type="button">Prenota il tuo tavolo <span>↗</span></button><a class="basilico-menu-link" href="#details">Dai un’occhiata al menu ↓</a></div><div class="basilico-foot"><span>UNA TAVOLA, TANTE STORIE.</span><span>Il piacere di esserci.</span><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 2c-4 7-12 7-12 15 0 8 8 13 12 13S28 25 28 17C28 9 20 9 16 2Z" fill="none" stroke="currentColor"/><path d="M16 8v21M9 14l7 7 7-7" fill="none" stroke="currentColor"/></svg></div></section><section class="details-section" id="details"><p class="kicker">DALLA NOSTRA CUCINA</p><h2>La stagione<br />va in tavola.</h2><div class="food-menu"><p><span>Spaghetto, pomodoro e basilico</span><small>Il nostro inizio preferito</small></p><p><span>La pasta del giorno</span><small>Una storia diversa, ogni volta</small></p><p><span>Il dolce, da condividere</span><small>Un buon motivo per restare</small></p></div><button class="text-action" data-book type="button">Prova la prenotazione demo ↗</button></section></div>`
  },
  oltre: {
    title: 'OLTRE — Eventi, associazioni e community',
    html: `<div class="site site-oltre"><header class="site-nav"><a class="site-logo oltre-logo" href="#">OLTRE<span>club</span></a><nav aria-label="Navigazione OLTRE"><a href="#details">Il progetto</a><a href="#details">Le attività</a><a href="#details">La community</a></nav><button class="nav-action" data-join type="button">Entra nel club ↗</button></header><section class="site-hero oltre-hero" aria-labelledby="site-title"><div class="hero-visual oltre-visual"><img src="../images/atelier-campaign-detail.jpg" alt="Tessuto giallo illuminato: direzione visiva per un progetto di cultura, sport e comunità." width="1672" height="941" /><span class="oltre-vertical" aria-hidden="true">FACCIAMO<br />SPAZIO.</span><span class="oltre-sticker">SPORT<br />CULTURA<br />COMUNITÀ<span>↗</span></span></div><div class="hero-copy"><p class="kicker">PER CHI HA VOGLIA DI PARTECIPARE.</p><h1 id="site-title">MUOVIAMOCI.<br /><em>INSIEME.</em></h1><p class="hero-description">Più incontri. Più possibilità.<br />Una community che diventa movimento.</p><button class="primary-action" data-join type="button">Partecipa al progetto <span>↗</span></button></div><div class="oltre-foot"><span>01 / ATTIVITÀ</span><span>02 / EVENTI</span><span>03 / PARTECIPAZIONE</span></div></section><section class="details-section" id="details"><p class="kicker">LE IDEE HANNO BISOGNO DI PERSONE</p><h2>Una community.<br />Tante possibilità.</h2><div class="detail-options"><span>Sport e benessere</span><span>Cultura e incontri</span><span>Progetti sul territorio</span></div><p>Un sito per associazioni, APS e ASD: attività, iscrizioni, eventi e una comunità che trova facilmente il proprio prossimo passo.</p><button class="text-action" data-join type="button">Prova il percorso di iscrizione ↗</button></section></div>`
  }
};
const validAliases = { lamp:'vela', skincare:'nude', nova:'nude', food:'basilico', event:'oltre' };
const params = new URLSearchParams(location.search);
const wanted = params.get('scene') || 'shift';
const key = scenes[wanted] ? wanted : validAliases[wanted] || 'shift';
const scene = scenes[key];
document.title = `${scene.title} — Concept Space Media Studio`;
document.body.dataset.scene = key;
if (params.get('capture') === '1') document.body.classList.add('capture');
document.querySelector('#demo').innerHTML = scene.html;
document.querySelectorAll('[data-scene-link]').forEach(link => { if(link.dataset.sceneLink===key) link.setAttribute('aria-current','page'); });
const dialog = document.querySelector('#demo-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const dialogContent = document.querySelector('#dialog-content');
const status = document.querySelector('.demo-status');
const editions = {
  Studio: { price: 690, bundle: 'Strumento e alimentatore' },
  Live: { price: 790, bundle: 'Strumento, alimentatore e custodia da trasporto' }
};
let selectedEdition = 'Studio';
const cart = new Map();
const escape = text => String(text).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function open(title, html) { dialogTitle.textContent=title;dialogContent.innerHTML=html;dialog.showModal(); }
function cartContent() {
  if (!cart.size) return '<p>Il carrello demo è vuoto. Aggiungi il prodotto per provare il percorso.</p>';
  const rows = [...cart.entries()].map(([edition, quantity]) => {
    const name = key === 'shift' ? `${scene.product} · ${edition}` : scene.product;
    const amount = key === 'shift' ? editions[edition].price : Number(scene.price.slice(1));
    return `<div class="cart-line"><div><strong>${escape(name)}</strong><p>Quantità ${quantity}</p></div><span>€${amount * quantity}</span></div>`;
  }).join('');
  return rows + '<button class="dialog-primary" data-finish type="button">Continua nella demo ↗</button>';
}
function formContent(type) {
 const booking=type==='book';return `<form class="demo-form" data-demo-form><label>${booking?'Il tuo giorno':'Il tuo nome'}<input ${booking?'type="date"':'type="text" autocomplete="off"'} name="first" required /></label><label>${booking?'Quanti siamo?':type==='join'?'Che cosa ti interessa?':'Il momento che preferisci'}<select name="choice">${(booking?['2 persone','3 persone','4 persone','5 o più persone']:type==='join'?['Sport e benessere','Cultura e incontri','Dare una mano']:['Un primo incontro','Un rituale personale','Conoscere lo studio']).map(v=>`<option>${v}</option>`).join('')}</select></label><button class="dialog-primary" type="submit">${booking?'Prova la prenotazione':type==='join'?'Prova l’iscrizione':'Prova la richiesta'} ↗</button></form>`;
}
document.addEventListener('click', event => {
 const button=event.target.closest('button');if(!button)return;
 if (button.matches('[data-edition]')) {
   selectedEdition = button.dataset.edition;
   document.querySelectorAll('[data-edition]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
   document.querySelector('[data-price]').textContent = `€${editions[selectedEdition].price}`;
   document.querySelector('[data-bundle]').textContent = editions[selectedEdition].bundle;
 }
 if (button.matches('[data-buy]')) {
   const edition = key === 'shift' ? selectedEdition : key;
   cart.set(edition, (cart.get(edition) || 0) + 1);
   const quantity = [...cart.values()].reduce((total, count) => total + count, 0);
   document.querySelectorAll('.cart-count').forEach(el => el.textContent = String(quantity));
   open('È nella tua demo.', cartContent());
 }
 if(button.matches('[data-cart]'))open('Il tuo carrello.',cartContent());
 if(button.matches('[data-consult]'))open('Un momento per te.',formContent('consult'));
 if(button.matches('[data-book]'))open('Ci vediamo a tavola.',formContent('book'));
 if(button.matches('[data-join]'))open('Facciamo spazio alle persone.',formContent('join'));
 if(button.matches('.dialog-close'))dialog.close();
 if(button.matches('[data-finish]')){dialog.close();status.textContent='Percorso demo completato. Nessun acquisto effettuato.';}
});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('submit',event=>{if(!event.target.matches('[data-demo-form]'))return;event.preventDefault();dialogContent.innerHTML='<p class="demo-confirmation">Il percorso funziona.<br /><strong>Il prossimo può essere il tuo.</strong></p><a class="dialog-primary" href="../#atelier-idea-web">Parlane con Space Media Studio ↗</a>';});
if (document.body.classList.contains('capture')) {
  document.querySelectorAll('#demo img[loading=lazy]').forEach(image => { image.loading = 'eager'; });
}
window.__showcaseReady = Promise.all([document.fonts.ready,...[...document.querySelectorAll('#demo img')].map(image=>image.decode().catch(()=>{}))]).then(()=>{document.documentElement.dataset.ready='true';return {scene:key,images:[...document.querySelectorAll('#demo img')].map(image=>({src:image.getAttribute('src'),complete:image.complete&&image.naturalWidth>0}))};});
