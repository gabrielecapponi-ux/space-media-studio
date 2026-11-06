import {productPhotoSources} from './product-media.js';
import {createCartFeedback} from './cart-feedback.js';
import appetiteMedia from '../data/appetite-media.json' with {type:'json'};
/** Client-side shopping list. No orders, payment or customer details are sent. */
export const CART_STORAGE_KEY = 'mrsmeet:bag:v1';
export const CART_VERSION = 1;
export const MAX_QUANTITY = 20;
export const GLOVO_URL = 'https://glovoapp.com/it/it/parma/stores/mr-smeet-pmf';
export const PICKUP_PHONE = '+3905211792168';
const euro = new Intl.NumberFormat('it-IT', {style:'currency', currency:'EUR'});
export const formatCents = cents => euro.format(cents / 100);

export function productUnitCents(product) {
  const regular = product?.regular_price_eur;
  const promo = product?.observed_promo_price;
  const valid = price => typeof price === 'number' && Number.isFinite(price) && price >= 0 && price <= 100000;
  if (!valid(regular)) return null;
  return Math.round((valid(promo) && promo <= regular ? promo : regular) * 100);
}

function makeCatalog(products) {
  const catalog = new Map();
  for (const product of Array.isArray(products) ? products : []) {
    if (!product || typeof product.id !== 'string' || !/^[a-z0-9-]{1,100}$/.test(product.id)
      || typeof product.name !== 'string' || !product.name.trim() || catalog.has(product.id)) continue;
    const unitCents = productUnitCents(product);
    if (unitCents === null) continue;
    catalog.set(product.id, {
      id:product.id, name:product.name.trim().slice(0,200),
      unitCents, regularCents:Math.round(product.regular_price_eur * 100),
    });
  }
  return catalog;
}

function readItems(stored, catalog) {
  let value;
  try { value = typeof stored === 'string' ? JSON.parse(stored) : stored; } catch { return new Map(); }
  const items = new Map();
  if (!value || value.version !== CART_VERSION || !Array.isArray(value.items)) return items;
  for (const item of value.items) {
    if (!item || !catalog.has(item.id) || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) continue;
    items.set(item.id, Math.min(MAX_QUANTITY, (items.get(item.id) || 0) + item.quantity));
  }
  return items;
}

/** Pure model: prices always come from the current menu, never localStorage. */
export function createCartModel(products, stored = null) {
  const catalog = makeCatalog(products);
  let items = readItems(stored,catalog);
  const snapshot = () => {
    const rows = [...items].map(([id,quantity]) => ({...catalog.get(id),quantity,lineCents:catalog.get(id).unitCents * quantity}));
    return {items:rows,quantity:rows.reduce((sum,item) => sum + item.quantity,0),totalCents:rows.reduce((sum,item) => sum + item.lineCents,0)};
  };
  function setQuantity(id, quantity) {
    if (!catalog.has(id) || !Number.isSafeInteger(quantity) || quantity < 0) return false;
    const next = Math.min(quantity,MAX_QUANTITY);
    if ((items.get(id) || 0) === next) return false;
    if (next === 0) items.delete(id); else items.set(id,next);
    return true;
  }
  return {
    snapshot,
    add:id => setQuantity(id,(items.get(id) || 0) + 1),
    setQuantity,
    remove:id => setQuantity(id,0),
    hasProduct:id => catalog.has(id),
    replace(storedValue) { items = readItems(storedValue,catalog); return snapshot(); },
    serialize:() => JSON.stringify({version:CART_VERSION,items:[...items].map(([id,quantity]) => ({id,quantity}))}),
  };
}

export function buildOrderText(snapshot) {
  const lines = snapshot.items.map(item => `${item.quantity} × ${item.name} — ${formatCents(item.lineCents)}`);
  return ['Il mio sacchetto Mr Smeet',...lines,'',`Totale prodotti: ${formatCents(snapshot.totalCents)}`,
    'Prezzi e disponibilità da confermare sul canale scelto.'].join('\n');
}

/** A phone number is not evidence of WhatsApp availability. Explicit verification is required. */
export function verifiedWhatsAppUrl(channels, text) {
  const channel = channels?.whatsapp;
  if (!channel || channel.verified !== true || typeof channel.number !== 'string') return null;
  const number = channel.number.replace(/[\s()+-]/g,'');
  if (!/^[1-9][0-9]{7,14}$/.test(number)) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export function mountCart({products = [], channels = {}, presentation = {}, reducedMotion, menuHref = './index.html#menu'} = {}) {
  const doc = document, view = doc.defaultView || window;
  let storage = null, stored = null;
  try { storage = view.localStorage; stored = storage.getItem(CART_STORAGE_KEY); } catch { /* In-memory cart remains usable. */ }
  const model = createCartModel(products,stored);
  const controller = new AbortController(), {signal} = controller;
  const media = typeof reducedMotion === 'object' && reducedMotion !== null
    ? reducedMotion : typeof reducedMotion === 'boolean' ? null : view.matchMedia?.('(prefers-reduced-motion: reduce)');
  let disposed = false, opener = null, overflow = null, panel = 'bag', animation = null;
  let copyTimer = null, revision = 0, locked = false, isFallback = false;
  const dialog = doc.createElement('dialog');
  dialog.id = 'smeet-cart';
  dialog.className = 'smeet-cart';
  dialog.setAttribute('aria-labelledby','smeet-cart-title');
  dialog.innerHTML = `
    <header class="smeet-cart-header">
      <div><p class="smeet-cart-kicker">FATTO PER LA TUA FAME</p><h2 id="smeet-cart-title">IL TUO<br>SACCHETTO<span>.</span></h2></div>
      <button class="smeet-cart-close" type="button" aria-label="Chiudi il sacchetto" data-cart-action="close" autofocus>×</button>
      <span class="smeet-cart-header-count" aria-hidden="true">0</span>
    </header>
    <div class="smeet-cart-content">
      <section class="smeet-cart-empty">
        <img src="./images/original-logo.png" width="500" height="491" alt="" decoding="async">
        <h3>La fame è solo l’inizio.</h3>
        <p>Un burger, due fries, qualcosa da bere.<br>Componi il tuo sacchetto dal menù.</p>
        <button type="button" class="smeet-cart-button" data-cart-action="continue">SCEGLI DAL MENÙ <span aria-hidden="true">↗</span></button>
      </section>
      <section class="smeet-cart-bag" aria-label="Prodotti nel sacchetto" hidden>
        <p class="smeet-cart-lead">Le tue scelte. Tutta la fame che vuoi.</p>
        <ul class="smeet-cart-items"></ul>
        <button type="button" class="smeet-cart-text-button" data-cart-action="continue">+ Aggiungi qualcosa di buono</button>
      </section>
      <section class="smeet-cart-checkout" hidden aria-labelledby="smeet-cart-checkout-title">
        <button type="button" class="smeet-cart-text-button" data-cart-action="back">← Modifica il sacchetto</button>
        <h3 id="smeet-cart-checkout-title" tabindex="-1">La fame è pronta.<br>Scegli tu come ordinare.</h3>
        <ul class="smeet-cart-summary" aria-label="Riepilogo dei prodotti"></ul>
        <button type="button" class="smeet-cart-copy" data-cart-action="copy"><span aria-hidden="true">▣</span> Copia la mia lista</button>
        <div class="smeet-cart-copy-fallback" hidden>
          <label for="smeet-cart-copy-text">Seleziona e copia la lista:</label>
          <textarea id="smeet-cart-copy-text" readonly rows="6" spellcheck="false"></textarea>
        </div>
        <p class="smeet-cart-copy-status" role="status" aria-live="polite"></p>
        <div class="smeet-cart-channel-list">
          <a class="smeet-cart-channel smeet-cart-glovo" href="${GLOVO_URL}" target="_blank" rel="noopener noreferrer" aria-label="Continua su Glovo, si apre in una nuova scheda"><span><small>CONSEGNA A CASA</small><strong>Continua su Glovo</strong></span><span aria-hidden="true">↗</span></a>
          <p class="smeet-cart-same-price">Su Glovo, gli stessi prezzi dei prodotti in negozio.</p>
          <p class="smeet-cart-handoff">Il sacchetto non viene trasferito automaticamente su Glovo. Copia la lista e scegli gli stessi prodotti.</p>
          <a class="smeet-cart-channel smeet-cart-phone" href="tel:${PICKUP_PHONE}"><span><small>PREFERISCI IL RITIRO?</small><strong>Chiama Mr Smeet</strong><em>0521 179 2168</em></span><span aria-hidden="true">↗</span></a>
          <a class="smeet-cart-channel smeet-cart-whatsapp" hidden target="_blank" rel="noopener noreferrer"><span><small>SCRIVI A MR SMEET</small><strong>Apri WhatsApp con la lista</strong></span><span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </div>
    <footer class="smeet-cart-footer" hidden>
      <div class="smeet-cart-total"><div><span>Totale prodotti</span><small class="smeet-cart-quantity"></small></div><strong class="smeet-cart-total-value"></strong></div>
      <button type="button" class="smeet-cart-button smeet-cart-checkout-button" data-cart-action="checkout">SCEGLI COME ORDINARE <span aria-hidden="true">↗</span></button>
      <p class="smeet-cart-price-note">Totale indicativo. Verifica promozioni e disponibilità sul canale scelto. Consegna ed eventuali commissioni sono escluse.</p>
    </footer>`;
  doc.body.append(dialog);
  const announcement = doc.createElement('p');
  announcement.className = 'smeet-cart-announcement';
  announcement.setAttribute('role','status');
  announcement.setAttribute('aria-live','polite');
  announcement.setAttribute('aria-atomic','true');
  doc.body.append(announcement);
  const dialogAnnouncement = announcement.cloneNode(false);
  dialog.append(dialogAnnouncement);
  const addFeedback = createCartFeedback({doc,reducedMotion:media || reducedMotion});
  const $ = selector => dialog.querySelector(selector);
  const closeButton = $('.smeet-cart-close'), list = $('.smeet-cart-items');
  const checkoutHeading = $('#smeet-cart-checkout-title');
  const copyButton = $('[data-cart-action="copy"]'), copyFallback = $('.smeet-cart-copy-fallback');
  const copyText = $('#smeet-cart-copy-text'), copyStatus = $('.smeet-cart-copy-status');
  const create = (tag,className,text) => {
    const node = doc.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const announce = text => {
    const activeLive = dialog.open ? dialogAnnouncement : announcement;
    const otherLive = dialog.open ? announcement : dialogAnnouncement;
    otherLive.textContent = ''; activeLive.textContent = text;
  };
  const motionStopped = () => typeof reducedMotion === 'boolean' ? reducedMotion || doc.hidden || doc.body.classList.contains('motion-paused')
    : Boolean(media?.matches) || doc.hidden || doc.body.classList.contains('motion-paused');
  const stopAnimation = () => { animation?.cancel(); animation = null; };
  function persist() {
    try { storage?.setItem(CART_STORAGE_KEY,model.serialize()); } catch { /* Private mode / full storage: keep the live cart. */ }
  }
  function updateBadges(snapshot) {
    doc.querySelectorAll('[data-cart-count]').forEach(badge => {
      badge.textContent = String(snapshot.quantity);
      badge.dataset.empty = String(snapshot.quantity === 0);
      badge.setAttribute('aria-label',`${snapshot.quantity} ${snapshot.quantity === 1 ? 'prodotto' : 'prodotti'} nel sacchetto`);
    });
    doc.querySelectorAll('[data-cart-open]').forEach(button => {
      button.setAttribute('aria-haspopup','dialog');
      button.setAttribute('aria-controls',dialog.id);
    });
    $('.smeet-cart-header-count').textContent = String(snapshot.quantity);
  }
  function quantityButton(action,text,label,id,disabled = false) {
    const button = create('button','',text);
    button.type = 'button'; button.dataset.cartAction = action; button.dataset.cartId = id;
    button.setAttribute('aria-label',label); button.disabled = disabled;
    return button;
  }
  function render() {
    revision++;
    const snapshot = model.snapshot();
    const active = doc.activeElement;
    const focusAction = list.contains(active) ? active?.dataset.cartAction : null;
    const focusId = focusAction ? active?.dataset.cartId : null;
    if (!snapshot.quantity) panel = 'bag';
    const fragment = doc.createDocumentFragment();
    for (const item of snapshot.items) {
      const row = create('li','smeet-cart-item');
      const image = create('img','smeet-cart-item-image');
      const fallback = productPhotoSources(item.id,presentation).thumbnail;
      const poster = appetiteMedia[item.id]?.posterSmall;
      image.src = poster || fallback; image.alt = ''; image.width = 88; image.height = 88; image.decoding = 'async';
      if (poster) image.addEventListener('error', () => {image.src = fallback;}, {once:true});
      const info = create('div','smeet-cart-item-info');
      info.append(create('h3','',item.name),create('p','smeet-cart-unit-price',`${formatCents(item.unitCents)} / cad.`));
      const controls = create('div','smeet-cart-item-controls');
      const stepper = create('div','smeet-cart-stepper');
      stepper.setAttribute('role','group'); stepper.setAttribute('aria-label',`Quantità di ${item.name}`);
      const quantity = create('span','smeet-cart-item-quantity',String(item.quantity));
      quantity.setAttribute('aria-label',`Quantità ${item.quantity}`);
      stepper.append(quantityButton('decrease','−',item.quantity === 1 ? `Rimuovi ${item.name}` : `Diminuisci ${item.name}`,item.id),quantity,
        quantityButton('increase','+',`Aggiungi un altro ${item.name}`,item.id,item.quantity >= MAX_QUANTITY));
      const remove = quantityButton('remove','Rimuovi',`Rimuovi ${item.name} dal sacchetto`,item.id);
      remove.className = 'smeet-cart-remove';
      controls.append(stepper,remove); info.append(controls);
      const price = create('strong','smeet-cart-line-price',formatCents(item.lineCents));
      row.append(image,info,price); fragment.append(row);
    }
    list.replaceChildren(fragment);
    const summary = doc.createDocumentFragment();
    snapshot.items.forEach(item => {
      const row = create('li');
      row.append(create('span','',`${item.quantity} × ${item.name}`),create('strong','',formatCents(item.lineCents)));
      summary.append(row);
    });
    $('.smeet-cart-summary').replaceChildren(summary);
    $('.smeet-cart-empty').hidden = snapshot.quantity > 0;
    $('.smeet-cart-bag').hidden = !snapshot.quantity || panel !== 'bag';
    $('.smeet-cart-checkout').hidden = !snapshot.quantity || panel !== 'checkout';
    $('.smeet-cart-footer').hidden = !snapshot.quantity;
    $('.smeet-cart-checkout-button').hidden = panel === 'checkout';
    $('.smeet-cart-total-value').textContent = formatCents(snapshot.totalCents);
    $('.smeet-cart-quantity').textContent = `${snapshot.quantity} ${snapshot.quantity === 1 ? 'prodotto' : 'prodotti'}`;
    dialog.dataset.panel = panel;
    copyFallback.hidden = true; copyStatus.textContent = '';
    view.clearTimeout(copyTimer); copyTimer = null;
    copyButton.innerHTML = '<span aria-hidden="true">▣</span> Copia la mia lista';
    const whatsapp = $('.smeet-cart-whatsapp'), whatsappUrl = verifiedWhatsAppUrl(channels,buildOrderText(snapshot));
    whatsapp.hidden = !whatsappUrl;
    if (whatsappUrl) {
      whatsapp.href = whatsappUrl;
      whatsapp.setAttribute('aria-label','Apri WhatsApp con la lista da controllare e inviare, si apre in una nuova scheda');
    } else whatsapp.removeAttribute('href');
    updateBadges(snapshot);
    if (focusAction && dialog.open) {
      const target = [...list.querySelectorAll('button')].find(button => button.dataset.cartId === focusId && button.dataset.cartAction === focusAction && !button.disabled)
        || [...list.querySelectorAll('button')].find(button => button.dataset.cartId === focusId && !button.disabled)
        || list.querySelector('button') || $('[data-cart-action="continue"]');
      target?.focus({preventScroll:true});
    } else if (dialog.open && dialog.contains(active) && active.closest?.('[hidden]')) {
      const target = panel === 'checkout' ? copyButton : snapshot.quantity ? list.querySelector('button') : $('[data-cart-action="continue"]');
      (target || closeButton).focus({preventScroll:true});
    }
    return snapshot;
  }
  function updateAndAnnounce(message) {
    persist(); const snapshot = render(); announce(message || `${snapshot.quantity} prodotti nel sacchetto. Totale ${formatCents(snapshot.totalCents)}.`);
    return snapshot;
  }
  function captureFeedback(from,id) {
    return addFeedback.capture(from,appetiteMedia[id]?.full || appetiteMedia[id]?.posterSmall || productPhotoSources(id,presentation).thumbnail);
  }
  function confirmAdded(id,snapshot,options) {
    const name = model.snapshot().items.find(item => item.id === id)?.name;
    if (disposed || !name) return;
    announce(`${name} aggiunto al sacchetto.`);
    addFeedback.play(snapshot,options);
  }
  function add(id,from = null) {
    if (disposed || !model.hasProduct(id)) return false;
    const feedbackSnapshot = from ? captureFeedback(from,id) : null;
    if (!model.add(id)) { addFeedback.cancel(); announce(`Puoi aggiungere al massimo ${MAX_QUANTITY} pezzi per prodotto.`); return false; }
    const name = model.snapshot().items.find(item => item.id === id)?.name;
    updateAndAnnounce(`${name} aggiunto al sacchetto.`);
    if (feedbackSnapshot) addFeedback.play(feedbackSnapshot);
    return true;
  }
  function restorePage() {
    if (dialog.open) return; // Ignore a queued close event after a quick reopen.
    stopAnimation();
    if (locked) {
      if (overflow) doc.body.style.setProperty('overflow',overflow.value,overflow.priority);
      locked = false; overflow = null;
    }
    const target = opener; opener = null;
    if (target?.isConnected && typeof target.focus === 'function') target.focus({preventScroll:true});
  }
  function close() {
    if (!dialog.open) return;
    addFeedback.cancel();
    stopAnimation();
    if (typeof dialog.close === 'function') dialog.close();
    else { dialog.removeAttribute('open'); restorePage(); }
    // Native close dispatches later; restore scroll before another modal can open.
    restorePage();
  }
  function open(from) {
    if (disposed) return false;
    if (dialog.open) return true;
    if ([...doc.querySelectorAll('dialog[open]')].some(other => other !== dialog)) return false;
    addFeedback.cancel();
    opener = from?.isConnected ? from : doc.activeElement;
    panel = 'bag'; render();
    overflow = {value:doc.body.style.getPropertyValue('overflow'),priority:doc.body.style.getPropertyPriority('overflow')};
    doc.body.style.setProperty('overflow','hidden'); locked = true;
    try {
      isFallback = typeof dialog.showModal !== 'function';
      if (!isFallback) dialog.showModal();
      else { dialog.setAttribute('open',''); dialog.setAttribute('aria-modal','true'); dialog.setAttribute('role','dialog'); dialog.classList.add('smeet-cart-fallback'); }
    } catch { restorePage(); return false; }
    closeButton.focus({preventScroll:true});
    $('.smeet-cart-content').scrollTop = 0;
    if (!motionStopped() && typeof dialog.animate === 'function') {
      try {
        animation = dialog.animate([{transform:'translateY(18px) scale(.985)',opacity:.6},{transform:'none',opacity:1}],{duration:200,easing:'cubic-bezier(.22,1,.36,1)'});
        const ownAnimation = animation;
        ownAnimation.finished.then(() => { if (animation === ownAnimation) animation = null; },() => {});
      } catch { stopAnimation(); }
    }
    return true;
  }
  async function copySummary() {
    const text = buildOrderText(model.snapshot()), token = revision;
    let copied = false;
    try {
      if (typeof view.navigator?.clipboard?.writeText === 'function') {
        await view.navigator.clipboard.writeText(text); copied = true;
      }
    } catch { /* A selectable fallback works without clipboard permission. */ }
    if (disposed || !dialog.open || token !== revision) return;
    if (copied) {
      copyButton.textContent = 'Lista copiata ✓';
      copyStatus.textContent = 'Lista copiata. Ora scegli come ordinare.';
      view.clearTimeout(copyTimer);
      copyTimer = view.setTimeout(() => { if (!disposed) copyButton.innerHTML = '<span aria-hidden="true">▣</span> Copia la mia lista'; },2500);
    } else {
      copyFallback.hidden = false; copyText.value = text;
      copyStatus.textContent = 'Seleziona e copia il testo della lista.';
      copyText.focus({preventScroll:true}); copyText.select();
      copyText.scrollIntoView?.({block:'nearest',behavior:'auto'});
    }
  }
  function onDialogClick(event) {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
      return;
    }
    const button = event.target.closest?.('[data-cart-action]');
    if (!button || !dialog.contains(button)) return;
    const action = button.dataset.cartAction;
    if (action === 'close' || action === 'continue') {
      close();
      if (action === 'continue') {
        const menu = doc.querySelector('#menu');
        if (menu) menu.scrollIntoView({behavior:'auto',block:'start'});
        else view.location.assign(menuHref);
      }
    } else if (action === 'checkout' || action === 'back') {
      panel = action === 'checkout' ? 'checkout' : 'bag'; render();
      $('.smeet-cart-content').scrollTop = 0;
      (panel === 'checkout' ? checkoutHeading : list.querySelector('button') || closeButton).focus({preventScroll:true});
    } else if (action === 'copy') { void copySummary(); }
    else if (['increase','decrease','remove'].includes(action)) {
      const id = button.dataset.cartId, item = model.snapshot().items.find(row => row.id === id);
      if (!item) return;
      const feedbackSnapshot = action === 'increase' ? captureFeedback(button,id) : null;
      const changed = action === 'remove' ? model.remove(id) : model.setQuantity(id,item.quantity + (action === 'increase' ? 1 : -1));
      if (changed) {
        updateAndAnnounce();
        if (feedbackSnapshot) {
          const nextButton = [...list.querySelectorAll('[data-cart-action="increase"]')].find(node => node.dataset.cartId === id);
          addFeedback.play(feedbackSnapshot,{host:dialog,target:$('.smeet-cart-header-count'),trigger:nextButton});
        }
      }
    }
  }
  function onDocumentClick(event) {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const button = event.target.closest?.('[data-add-to-cart], [data-cart-open]');
    if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
    if (button.hasAttribute('data-add-to-cart')) {
      if (!model.hasProduct(button.dataset.addToCart)) return;
      event.preventDefault(); add(button.dataset.addToCart,button);
    } else { event.preventDefault(); open(button); }
  }
  function onFallbackKey(event) {
    if (!isFallback || !dialog.open) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key !== 'Tab') return;
    const focusables = [...dialog.querySelectorAll('a[href],button:not([disabled]),textarea,[tabindex="0"]')].filter(node => !node.closest('[hidden]'));
    const first = focusables[0], last = focusables.at(-1);
    if (event.shiftKey && doc.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && doc.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  dialog.addEventListener('click',onDialogClick,{signal});
  dialog.addEventListener('close',restorePage,{signal});
  dialog.addEventListener('cancel',event => { event.preventDefault(); close(); },{signal});
  doc.addEventListener('click',onDocumentClick,{signal});
  doc.addEventListener('keydown',onFallbackKey,{signal});
  view.addEventListener('storage',event => {
    if (event.key !== CART_STORAGE_KEY && event.key !== null) return;
    if (event.storageArea && storage && event.storageArea !== storage) return;
    model.replace(event.newValue); render();
  },{signal});
  const syncMotion = () => { if (motionStopped()) stopAnimation(); };
  doc.addEventListener('visibilitychange',syncMotion,{signal});
  media?.addEventListener?.('change',syncMotion,{signal});
  const pauseObserver = typeof MutationObserver === 'function' ? new MutationObserver(syncMotion) : null;
  pauseObserver?.observe(doc.body,{attributes:true,attributeFilter:['class']});
  render(); persist();
  return {add,open,captureFeedback,confirmAdded,dispose() {
    if (disposed) return;
    close(); disposed = true; addFeedback.dispose(); stopAnimation(); controller.abort(); pauseObserver?.disconnect();
    view.clearTimeout(copyTimer); dialog.remove(); announcement.remove();
    doc.querySelectorAll('[data-cart-open]').forEach(button => {
      if (button.getAttribute('aria-controls') === dialog.id) { button.removeAttribute('aria-controls'); button.removeAttribute('aria-haspopup'); }
    });
  }};
}
