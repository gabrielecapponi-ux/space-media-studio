const scenes = {
  shift: {
    title: 'SHIFT — Strumenti musicali', product: 'PHASE 01 / Campionatore stereo',
    html: `<div class="site phase-store">
      <header class="site-nav phase-nav"><a class="site-logo phase-logo" href="#site-title" aria-label="SHIFT Audio">SHIFT<span>AUDIO</span></a><nav aria-label="Navigazione SHIFT"><a href="#site-title">Strumento</a><a href="#details">Dettagli</a></nav><button class="nav-action" data-cart type="button">Carrello <span class="cart-count">0</span></button></header>
      <section class="phase-hero" aria-labelledby="site-title">
        <div class="phase-intro"><p class="phase-label"><i></i>CAMPIONATORE STEREO</p><h1 id="site-title">PHASE <span>01</span></h1><p class="phase-description">Campiona, taglia, suona. Sedici pad sotto le dita e una ruota per trovare il punto esatto di ogni suono.</p>
          <fieldset class="phase-editions"><legend>Configurazione</legend><button type="button" data-edition="Studio" aria-pressed="true">Studio</button><button type="button" data-edition="Live" aria-pressed="false">Live</button></fieldset>
          <p class="phase-bundle" data-bundle aria-live="polite">Strumento e alimentatore</p>
          <button class="phase-buy" data-buy type="button"><span>Aggiungi al carrello</span><span data-price>€690</span></button>
        </div>
        <figure class="phase-photo"><img src="./phase-01/hero.webp" alt="Sampler SHIFT PHASE 01 in alluminio, con sedici pad ambra, display di forma d’onda e ruota di controllo." width="1800" height="1350" fetchpriority="high" /></figure>
      </section>
      <section class="details-section phase-details" id="details"><div class="phase-detail-copy"><p class="phase-label"><i></i>I CONTROLLI</p><h2>Il suono,<br />da vicino.</h2><p>I sedici pad richiamano i campioni. Il display mostra la forma d’onda, mentre la ruota dentata regola il punto di attacco. Quattro encoder dedicati controllano intonazione, livello, filtro e drive.</p></div><figure><img src="./phase-01/overhead.webp" width="1800" height="1350" loading="lazy" alt="Vista dall’alto del pannello con matrice di pad, quattro encoder e controlli di trasporto." /></figure><figure class="phase-macro"><img src="./phase-01/detail.webp" width="1620" height="1080" loading="lazy" alt="Dettaglio del display, della ghiera lavorata e del cursore del volume." /></figure></section>
    </div>`
  },
  vela: {
    title: 'CACAO ATELIER — Cioccolato e-commerce', product: 'Il cofanetto / Selezione CACAO', price: '€48',
    html: `<div class="site site-cacao site-vela">
      <header class="site-nav cacao-nav"><a class="site-logo cacao-logo" href="#site-title">CACAO<span>ATELIER</span></a><nav aria-label="Navigazione CACAO"><a href="#details">La collezione</a><a href="#details">Il gesto</a></nav><button class="nav-action" data-cart type="button">Carrello <span class="cart-count">0</span></button></header>
      <section class="site-hero cacao-hero" aria-labelledby="site-title">
        <div class="hero-copy"><p class="kicker">CIOCCOLATO. FORMA. PIACERE.</p><h1 id="site-title">Un piccolo<br /><em>rito.</em></h1><p class="hero-description">Il tempo di aprire un cofanetto.<br />Il piacere di scegliere il prossimo.</p><div class="cacao-selection"><span>LA SELEZIONE</span><strong>Origini / 12 assaggi</strong></div><button class="primary-action" data-buy type="button"><span>Aggiungi il cofanetto</span><span>€48&nbsp; ↗</span></button><p class="product-note">Un oggetto da regalare. O da tenere.</p></div>
        <figure class="hero-visual cacao-visual"><img src="../images/director-brand.jpg" alt="Il cofanetto CACAO in color cacao e terracotta, con una selezione di cioccolatini e logo inciso." width="1920" height="1080" fetchpriority="high" /><figcaption><span>LA COLLEZIONE / 01</span><span>Il dettaglio fa il desiderio.</span></figcaption></figure>
      </section>
      <section class="details-section cacao-details" id="details"><div><p class="kicker">L’ARTE DI UN PICCOLO GESTO</p><h2>Dentro,<br /><em>un mondo.</em></h2><p>Una selezione da scoprire lentamente, un pezzo alla volta. Colore, forma e materia costruiscono un’esperienza che comincia prima dell’assaggio.</p><button class="text-action" data-buy type="button">Scegli il cofanetto ↗</button></div><div class="cacao-notes"><p><span>01</span><strong>Il carattere</strong><small>Note intense, rotonde, delicate.</small></p><p><span>02</span><strong>La forma</strong><small>Un segno inciso su ogni creazione.</small></p><p><span>03</span><strong>Il gesto</strong><small>Un cofanetto pensato per restare.</small></p></div></section>
    </div>`
  },
  nude: {
    title: 'LUMA — Studio fotografico e servizi creativi',
    html: `<div class="site site-luma site-nude">
      <header class="site-nav luma-nav"><a class="site-logo luma-logo" href="#site-title">LUMA<span>IMAGE STUDIO</span></a><nav aria-label="Navigazione LUMA"><a href="#details">Lo sguardo</a><a href="#details">I progetti</a></nav><button class="nav-action" data-consult type="button">Parliamone ↗</button></header>
      <section class="site-hero luma-hero" aria-labelledby="site-title"><div class="hero-copy"><p class="kicker"><i></i>STILL LIFE / ART DIRECTION / MOTION</p><h1 id="site-title">Mettiamo<br /> a <em>fuoco.</em></h1><p class="hero-description">La luce rivela. L’inquadratura sceglie.<br />Noi diamo carattere alle tue immagini.</p><button class="primary-action" data-consult type="button"><span>Immagina il tuo progetto</span><span>↗</span></button><p class="luma-coordinate">UNO SGUARDO. TUTTE LE POSSIBILITÀ.</p></div><figure class="hero-visual luma-visual"><img src="../images/elegant-product.webp" alt="Fotocamera LUMA in grafite e metallo, illuminata in studio con riflessi sul grande obiettivo." width="2560" height="1440" fetchpriority="high" /><figcaption><span>STUDIO OBJECT / LUMA 01</span><span aria-hidden="true">[ + ]</span></figcaption></figure></section>
      <section class="details-section luma-details" id="details"><div><p class="kicker">DAL SOGGETTO ALL’IMMAGINE</p><h2>Ogni oggetto.<br /><em>Una presenza.</em></h2><p>Dal primo riferimento al fotogramma finale: una direzione visiva coerente per prodotti, storie e campagne.</p></div><div class="luma-services"><button data-consult data-service="Fotografia di prodotto" type="button"><span>01</span><strong>Fotografia di prodotto</strong><span>↗</span></button><button data-consult data-service="Direzione artistica" type="button"><span>02</span><strong>Direzione artistica</strong><span>↗</span></button><button data-consult data-service="Film e movimento" type="button"><span>03</span><strong>Film e movimento</strong><span>↗</span></button></div></section>
    </div>`
  },
  basilico: {
    title: 'BASILICO — Cucina e prenotazioni',
    html: `<div class="site site-basilico">
      <header class="site-nav basilico-nav"><a class="site-logo basilico-logo" href="#site-title">basilico.</a><nav aria-label="Navigazione BASILICO"><a href="#details">La cucina</a><a href="#details">Il menu</a></nav><button class="nav-action" data-book type="button">Un tavolo per te ↗</button></header>
      <section class="site-hero basilico-hero" aria-labelledby="site-title"><div class="hero-copy"><p class="kicker">CUCINA DI STAGIONE / PIACERE CONDIVISO</p><h1 id="site-title">A tavola,<br /><em>davvero.</em></h1><p class="hero-description">Le cose buone non hanno fretta.<br />Neanche i momenti migliori.</p><button class="primary-action" data-book type="button"><span>Prenota il tuo tavolo</span><span>↗</span></button><a class="text-action basilico-menu-link" href="#details">Il menu di stagione ↓</a></div><figure class="hero-visual basilico-visual"><img src="../images/reel-food.jpg" alt="Un piatto di pasta fresca, servito in un ambiente caldo con tovaglia e stoviglie color terra." width="1536" height="1024" fetchpriority="high" /><figcaption><span>LA CUCINA, AL CENTRO.</span><span>Fatto bene. Da condividere.</span></figcaption></figure></section>
      <section class="details-section basilico-details" id="details"><div><p class="kicker">DALLA NOSTRA CUCINA</p><h2>La stagione<br /><em>va in tavola.</em></h2><p>Un menu essenziale, il piacere di scegliere. L’inizio di una conversazione che continua a tavola.</p><button class="text-action" data-book type="button">Prova la prenotazione ↗</button></div><div class="food-menu"><p><span>01 / I CLASSICI</span><strong>Spaghetto, pomodoro<br />e basilico</strong><small>Il nostro inizio preferito</small></p><p><span>02 / OGNI GIORNO</span><strong>La pasta del giorno</strong><small>Una storia diversa, ogni volta</small></p><p><span>03 / IL FINALE</span><strong>Il dolce, da condividere</strong><small>Un buon motivo per restare</small></p></div></section>
    </div>`
  },
  oltre: {
    title: 'OLTRE — Incontri sonori, cultura e partecipazione',
    html: `<div class="site site-oltre">
      <header class="site-nav oltre-nav"><a class="site-logo oltre-logo" href="#site-title">OLTRE<span>INCONTRI SONORI</span></a><nav aria-label="Navigazione OLTRE"><a href="#details">Programma</a><a href="#community">Partecipa</a></nav><button class="nav-action" data-join type="button">Prendi parte ↗</button></header>
      <section class="site-hero oltre-hero" aria-labelledby="site-title"><div class="hero-copy"><p class="kicker">SUONI / IDEE / PERSONE</p><h1 id="site-title">ENTRA<br /> IN <em>ORBITA.</em></h1><p class="hero-description">La cultura è un punto d’incontro.<br />Il prossimo movimento comincia qui.</p><button class="primary-action" data-join type="button"><span>Partecipa a OLTRE</span><span>↗</span></button><p class="oltre-edition">UN FORMAT CULTURALE / EDIZIONE DEMO</p></div><figure class="hero-visual oltre-visual"><img src="./oltre/orbit.webp" alt="Scultura originale color rame: tre orbite intrecciate, illuminate in uno studio 3D." width="1200" height="1200" fetchpriority="high" /><figcaption><span>CONNESSIONI IN MOVIMENTO.</span><span aria-hidden="true">↗</span></figcaption></figure></section>
      <section class="details-section oltre-program" id="details"><div class="program-heading"><p class="kicker">IL PROGRAMMA / ESEMPIO DIMOSTRATIVO</p><h2>Una sera.<br /><em>Più universi.</em></h2><p>Ascoltare, incontrarsi, sperimentare. Scegli un’esperienza e prova il percorso di partecipazione.</p></div><div class="program-list"><button type="button" data-join data-program="Ascolto condiviso"><span class="program-time">18:30</span><span><small>ASCOLTO / TALK</small><strong>Ascolto condiviso</strong><em>Come cambia il modo di sentire.</em></span><span>↗</span></button><button type="button" data-join data-program="Laboratorio aperto"><span class="program-time">20:00</span><span><small>WORKSHOP / INCONTRO</small><strong>Laboratorio aperto</strong><em>Un’idea prende forma, insieme.</em></span><span>↗</span></button><button type="button" data-join data-program="Incontri sonori"><span class="program-time">21:30</span><span><small>LIVE / PERFORMANCE</small><strong>Incontri sonori</strong><em>Nuove connessioni, dal vivo.</em></span><span>↗</span></button></div></section>
      <section class="oltre-community" id="community"><p class="kicker">CULTURA È PARTECIPAZIONE</p><h2>Il posto giusto<br />è <em>insieme.</em></h2><p>Un progetto aperto a chi vuole esserci, proporre un’attività o dare una mano. Un esempio di sito che rende semplice partecipare.</p><button class="primary-action" data-join data-program="Dare una mano" type="button"><span>Entra nel progetto</span><span>↗</span></button></section>
    </div>`
  }
};
const validAliases = { lamp:'vela', cacao:'vela', skincare:'nude', nova:'nude', luma:'nude', food:'basilico', event:'oltre' };
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
let dialogTrigger;
function open(title, html, trigger) {
  dialogTrigger = trigger;
  dialogTitle.textContent = title;
  dialogContent.innerHTML = html;
  dialog.showModal();
  dialog.querySelector('.dialog-close').focus({ preventScroll: true });
}
dialog.addEventListener('close', () => {
  const trigger = dialogTrigger;
  dialogTrigger = undefined;
  if (trigger?.isConnected) trigger.focus({ preventScroll: true });
});
function cartContent() {
  if (!cart.size) return '<p>Il carrello demo è vuoto. Aggiungi il prodotto per provare il percorso.</p>';
  const rows = [...cart.entries()].map(([edition, quantity]) => {
    const name = key === 'shift' ? `${scene.product} · ${edition}` : scene.product;
    const amount = key === 'shift' ? editions[edition].price : Number(scene.price.slice(1));
    return `<div class="cart-line"><div><strong>${escape(name)}</strong><p>Quantità ${quantity}</p></div><span>€${amount * quantity}</span></div>`;
  }).join('');
  return rows + '<button class="dialog-primary" data-finish type="button">Continua nella demo ↗</button>';
}
function formContent(type, selected = '') {
 const booking = type === 'book';
 const options = booking ? ['2 persone', '3 persone', '4 persone', '5 o più persone']
   : type === 'join' ? ['Ascolto condiviso', 'Laboratorio aperto', 'Incontri sonori', 'Dare una mano']
   : ['Fotografia di prodotto', 'Direzione artistica', 'Film e movimento'];
 return `<form class="demo-form" data-demo-form><label>${booking ? 'Il tuo giorno' : 'Il tuo nome'}<input ${booking ? 'type="date"' : 'type="text" autocomplete="off"'} name="first" required /></label><label>${booking ? 'Quanti siamo?' : type === 'join' ? 'A cosa vuoi partecipare?' : 'Che progetto immagini?'}<select name="choice">${options.map(value => `<option${value === selected ? ' selected' : ''}>${value}</option>`).join('')}</select></label><button class="dialog-primary" type="submit">${booking ? 'Prova la prenotazione' : type === 'join' ? 'Prova la partecipazione' : 'Prova la richiesta'} ↗</button></form>`;
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
   open('È nella tua demo.', cartContent(), button);
 }
 if(button.matches('[data-cart]'))open('Il tuo carrello.',cartContent(),button);
 if(button.matches('[data-consult]'))open('Mettiamo a fuoco.',formContent('consult', button.dataset.service),button);
 if(button.matches('[data-book]'))open('Ci vediamo a tavola.',formContent('book'),button);
 if(button.matches('[data-join]'))open('Facciamo spazio alle persone.',formContent('join', button.dataset.program),button);
 if(button.matches('.dialog-close'))dialog.close();
 if(button.matches('[data-finish]')){dialog.close();status.textContent='Percorso demo completato. Nessun acquisto effettuato.';}
});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('submit',event=>{
  if(!event.target.matches('[data-demo-form]'))return;
  event.preventDefault();
  dialogContent.innerHTML='<p class="demo-confirmation" tabindex="-1">Il percorso funziona.<br /><strong>Il prossimo può essere il tuo.</strong></p><a class="dialog-primary" href="../#atelier-idea-web">Parlane con Space Media Studio ↗</a>';
  dialogContent.querySelector('.demo-confirmation').focus({ preventScroll: true });
});
if (document.body.classList.contains('capture')) {
  document.querySelectorAll('#demo img[loading=lazy]').forEach(image => { image.loading = 'eager'; });
}
window.__showcaseReady = Promise.all([document.fonts.ready,...[...document.querySelectorAll('#demo img')].map(image=>image.decode().catch(()=>{}))]).then(()=>{document.documentElement.dataset.ready='true';return {scene:key,images:[...document.querySelectorAll('#demo img')].map(image=>({src:image.getAttribute('src'),complete:image.complete&&image.naturalWidth>0}))};});

// One slow movement belongs to the transparent sculpture, never to a page frame.
// It runs only while visible and respects the reader's motion/data preferences.
const sculpture = document.querySelector('.oltre-visual');
if (sculpture && !document.body.classList.contains('capture')) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let inView = false;
  const syncSculpture = () => sculpture.classList.toggle('is-onstage', inView && !motion.matches && !navigator.connection?.saveData && !document.hidden);
  const observer = new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    syncSculpture();
  }, { threshold: .04 });
  observer.observe(sculpture);
  motion.addEventListener('change', syncSculpture);
  navigator.connection?.addEventListener?.('change', syncSculpture);
  document.addEventListener('visibilitychange', syncSculpture);
  addEventListener('pagehide', () => sculpture.classList.remove('is-onstage'));
  addEventListener('pageshow', syncSculpture);
}
