import {mountMobileFinish} from './mobile-finish.js';
import {mountOpeningHours} from './opening-hours.js';
import './cart-feedback.css';
import { mountSimpleMenu } from './menu-simple.js';
import { mountDetailMotion } from './menu-detail-motion.js';
import { mountOriginalOpening } from './original-opening.js';
import { mountTruckTour } from './truck-tour.js';
import { mountServiceMotion } from './service-motion.js';
import { mountCart, formatCents, productUnitCents, GLOVO_URL, PICKUP_PHONE } from './cart.js';
import products from '../data/menu.json';
import presentation from '../data/menu-presentation.json';
import {productPhotoSources} from './product-media.js';
import {mountAppetiteMotion, holdFoodFrame, clearFoodFrame} from './appetite-motion.js';
import appetiteMedia from '../data/appetite-media.json';
import {mountMenuBoard} from './menu-board.js';
import {motionViewport, motionExposure} from './motion-viewport.js';
import {selectFoodVideo, recordFoodTransfer} from './food-media-source.js';
import './cinematic.css';
import {mountRiderHero} from './rider-hero.js';
import './rider-hero.css';
import {mountHeaderSize} from './header-size.js';
import './persistent-header.css';
import './featured-triplo.css';

const $ = query => document.querySelector(query);
const $$ = query => [...document.querySelectorAll(query)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const lifecycle = new AbortController();
const {signal} = lifecycle;
let disposed = false, paused = false, introActive = !$('#rider-hero'), serviceMotion, intro, truckEvents, appetiteMotion, menuBoard, bagRider;
const mobileFinish = mountMobileFinish({reducedMotion:reduced});
const openingHours = mountOpeningHours();
const headerSize = mountHeaderSize({root:$('[data-persistent-header]')});
const film = $('#hero-film');
const stage = $('#hero-scene');
const filmButton = $('#hero-motion');
const motionButton = $('#toggle-motion');
const dialog = $('.product-dialog');
const menuRoot = $('#menu');
const catalog = new Map(products.map(product => [product.id, product]));
let filmWanted = false, filmInView = false, filmLoaded = false, filmRequest = 0;
let filmTransferStartedAt = 0, filmLoadDeadline = 0, filmLoadFail = null, filmViewportRaf = 0;
let filmRatio = 0, filmVisited = false, filmVisitConsumed = false, filmHovered = false;
let filmDwell = null, filmEndTimer = null, filmLoadTimer = null, filmFrameRequest = null, filmHeldFrame = null;
const filmTouch = matchMedia('(hover: none), (pointer: coarse)');
const filmConnection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

// The scroll-driven rider opens the page; the original preparation film remains
// available for replay. Menu content stays in HTML throughout.
const cart = mountCart({products, presentation, reducedMotion:reduced, channels:{
  glovo:{verified:true, url:GLOVO_URL}, pickup:{verified:true, phone:PICKUP_PHONE},
}});

// Signature follows the same finite visits as the product cards. No loop.
const filmBlocked = () => paused || reduced.matches || introActive || filmConnection?.saveData
  || document.hidden || document.body.classList.contains('motion-paused') || Boolean(document.querySelector('dialog[open]'));
function renderFilmButton() {
  if (!filmButton) return;
  const running = filmWanted && filmInView && !filmBlocked();
  filmButton.setAttribute('aria-pressed', String(running));
  filmButton.disabled = reduced.matches || Boolean(filmConnection?.saveData);
  filmButton.textContent = reduced.matches ? 'Foto del burger' : filmConnection?.saveData ? 'Foto · Risparmio dati'
    : running ? 'Ⅱ Ferma il video' : filmVisited ? '▷ Rivedi il burger' : '▷ Anima il burger';
}
function stopFilm(release = false, preserve = true) {
  const keep = preserve && !disposed && !document.hidden && filmInView && !reduced.matches && !filmConnection?.saveData;
  if (keep && stage?.classList.contains('has-video')) filmHeldFrame = holdFoodFrame(film, stage, filmHeldFrame, 'hero-film-frame');
  if (!keep) filmHeldFrame = clearFoodFrame(filmHeldFrame);
  filmRequest++; filmWanted = false; filmLoadFail = null;
  if (filmFrameRequest != null) film?.cancelVideoFrameCallback?.(filmFrameRequest);
  filmFrameRequest = null;
  window.clearTimeout(filmDwell); window.clearTimeout(filmEndTimer); window.clearTimeout(filmLoadTimer);
  filmDwell = filmEndTimer = filmLoadTimer = null;
  film?.pause(); stage?.classList.remove('has-video');
  if (release && film?.hasAttribute('src')) {film.removeAttribute('src'); film.load(); filmLoaded = false;}
}
function finishFilm() {
  filmWanted = false; window.clearTimeout(filmEndTimer); window.clearTimeout(filmLoadTimer);
  filmEndTimer = filmLoadTimer = null; film?.pause(); renderFilmButton();
}
function prepareFilm() {
  if (!film || filmBlocked()) return false;
  if (filmLoaded) return true;
  const source = selectFoodVideo(appetiteMedia['classic-smash-burger-triplo'], window, stage.getBoundingClientRect().width)
    || film.dataset.mobileSrc || film.dataset.desktopSrc;
  if (!source) return false;
  filmTransferStartedAt = performance.now();
  film.preload = 'auto'; film.src = source; filmLoaded = true; film.load();
  return true;
}
function beginFilm() {
  if (!film || disposed || filmBlocked() || !filmInView) return false;
  stopFilm();
  document.dispatchEvent(new CustomEvent('smeet:food-claim',{detail:film}));
  const still = stage?.querySelector('.signature-photo img');
  if (still?.currentSrc) film.poster = still.currentSrc;
  if (!prepareFilm()) return false;
  filmVisitConsumed = filmVisited = filmWanted = true;
  film.muted = true; film.playsInline = true; film.loop = false;
  try {film.currentTime = 0;} catch { /* A fresh resource already starts at zero. */ }
  const request = ++filmRequest;
  const failed = () => {
    if (request !== filmRequest || disposed) return;
    stopFilm(true); renderFilmButton();
    if (filmButton) filmButton.textContent = '▷ Riprova il video';
  };
  filmLoadDeadline = performance.now()+30000; filmLoadFail=failed;
  filmLoadTimer = window.setTimeout(failed, 8000);
  try {Promise.resolve(film.play()).catch(failed);} catch {failed();}
  renderFilmButton(); return true;
}
function queueFilm() {
  if (!film || disposed || filmWanted || filmDwell != null || filmBlocked() || filmRatio < .55 || filmVisitConsumed
    || (filmTouch.matches && appetiteMotion?.signatureIsPrimary?.() === false)
    || document.querySelector('.product-photo[data-appetite-playing]:not([data-appetite-holding])')) return;
  filmDwell = window.setTimeout(() => {
    filmDwell = null;
    const eligible = () => filmRatio >= .55 && !filmVisitConsumed && !filmBlocked() && (!filmTouch.matches || appetiteMotion?.signatureIsPrimary?.() !== false);
    if (!eligible()) return;
    // The poster is already high priority. Do not serialize its decode and
    // the film request on mobile; the film reveals only a decoded frame.
    beginFilm();
  }, filmVisited ? (filmTouch.matches ? 60 : 30) : (filmTouch.matches ? 90 : 60));
}
function syncFilm() {
  if (!film || disposed) return;
  if (filmBlocked() || !filmInView) {filmVisitConsumed=false;stopFilm(reduced.matches || Boolean(filmConnection?.saveData));}
  else queueFilm();
  renderFilmButton();
}
function syncMotion() {
  const stopped = paused || reduced.matches || introActive;
  document.body.classList.toggle('motion-paused', stopped);
  mobileFinish.setPaused(stopped); serviceMotion?.setPaused(stopped); truckEvents?.setPaused(stopped); appetiteMotion?.setPaused(stopped); menuBoard?.setPaused(stopped); bagRider?.setPaused(stopped); syncFilm();
  if (motionButton) {
    motionButton.setAttribute('aria-pressed', String(stopped));
    motionButton.disabled = reduced.matches;
    motionButton.textContent = reduced.matches ? 'MOVIMENTO RIDOTTO ATTIVO' : stopped ? 'RIPRENDI ANIMAZIONI ▷' : 'FERMA ANIMAZIONI Ⅱ';
  }
}
filmButton?.addEventListener('click', () => {
  if (!film || reduced.matches || filmConnection?.saveData) return;
  filmVisitConsumed = true;
  if (filmWanted) {stopFilm(); renderFilmButton(); return;}
  paused = false;
  if (motionButton) motionButton.hidden = false;
  if (!filmObserver) filmInView = true; // Explicit control remains usable without IO.
  syncMotion(); beginFilm();
}, {signal});
function showFilmFrame() {
  filmFrameRequest = null;
  if (!filmWanted || filmBlocked() || !filmInView) {stopFilm(); renderFilmButton(); return;}
  window.clearTimeout(filmLoadTimer); filmLoadTimer = null; filmLoadFail=null;
  stage?.classList.add('has-video');
  filmHeldFrame = clearFoodFrame(filmHeldFrame);
  const remaining = Number.isFinite(film.duration) && film.duration > 0 ? Math.min(Math.max(0, film.duration-film.currentTime)*1000+250, 12000) : 5000;
  if (filmEndTimer == null) filmEndTimer = window.setTimeout(finishFilm, remaining);
}
film?.addEventListener('playing', () => {
  if (!film.requestVideoFrameCallback) {showFilmFrame(); return;}
  if (filmFrameRequest != null) return;
  const request = filmRequest;
  filmFrameRequest = film.requestVideoFrameCallback(() => {if (request === filmRequest) showFilmFrame();});
}, {signal});
film?.addEventListener('progress', () => {
  recordFoodTransfer(film, window, filmTransferStartedAt);
  if (filmLoadFail && filmLoadTimer != null) {window.clearTimeout(filmLoadTimer);filmLoadTimer=window.setTimeout(filmLoadFail,Math.max(0,Math.min(8000,filmLoadDeadline-performance.now())));}
}, {signal});
film?.addEventListener('canplaythrough', () => recordFoodTransfer(film, window, filmTransferStartedAt), {signal});
film?.addEventListener('waiting', () => {
  if(!filmWanted || filmBlocked())return;
  window.clearTimeout(filmEndTimer);filmEndTimer=null;
  const request=filmRequest;
  filmLoadDeadline=performance.now()+30000;
  filmLoadFail=()=>{if(request===filmRequest && filmWanted){stopFilm(true);renderFilmButton();}};
  window.clearTimeout(filmLoadTimer);filmLoadTimer=window.setTimeout(filmLoadFail,8000);
}, {signal});
film?.addEventListener('ended', finishFilm, {signal});
film?.addEventListener('error', () => {
  if (!filmLoaded) return;
  stopFilm(true); renderFilmButton();
  if (filmButton) filmButton.textContent = '▷ Riprova il video';
}, {signal});
stage?.addEventListener('pointerenter', event => {
  if (event.pointerType === 'touch' || filmTouch.matches) return;
  filmHovered = true;
  if (!filmWanted) filmVisitConsumed = false;
  queueFilm();
}, {signal});
stage?.addEventListener('pointerleave', event => {
  if (event.pointerType === 'touch' || filmTouch.matches) return;
  filmHovered = false;
  if (!stage.contains(document.activeElement)) {stopFilm(); renderFilmButton();}
}, {signal});
stage?.addEventListener('focusin', event => {
  if (!event.target.closest('.signature-photo')) return;
  if (!filmWanted) filmVisitConsumed = false;
  filmHovered = true; queueFilm();
}, {signal});
stage?.addEventListener('focusout', event => {
  if (stage.contains(event.relatedTarget)) return;
  filmHovered = false; stopFilm(); renderFilmButton();
}, {signal});
document.addEventListener('smeet:food-claim', event => {
  if (event.detail !== film && event.detail?.matches?.('.appetite-motion-video, .hero-scroll-video')) {stopFilm(true); renderFilmButton();}
}, {signal});
document.addEventListener('playing', event => {
  if (event.target !== film && event.target.matches?.('.appetite-motion-video')) {stopFilm(); renderFilmButton();}
}, {capture:true,signal});
document.addEventListener('visibilitychange', syncFilm, {signal});
window.addEventListener('pagehide', () => stopFilm(true, false), {signal});
reduced.addEventListener('change', syncMotion, {signal});
filmConnection?.addEventListener?.('change', syncFilm, {signal});
filmTouch.addEventListener('change', syncFilm, {signal});
function syncFilmVisibility() {
  filmViewportRaf=0;
  if(!stage || disposed)return;
  filmRatio=motionExposure(stage.getBoundingClientRect(),motionViewport(document,window));
  filmInView=filmRatio>0;
  if(filmRatio<.3){filmVisitConsumed=false;stopFilm(filmRatio===0,filmRatio>0);}
  syncFilm();
}
const filmObserver=film && stage && typeof IntersectionObserver==='function' ? new IntersectionObserver(syncFilmVisibility,{threshold:[0,.3,.55,1]}) : null;
if(stage)filmObserver?.observe(stage);
const queueFilmVisibility=()=>{if(!filmViewportRaf)filmViewportRaf=requestAnimationFrame(syncFilmVisibility);};
window.addEventListener('scroll',queueFilmVisibility,{passive:true,signal});
window.addEventListener('resize',queueFilmVisibility,{passive:true,signal});
window.addEventListener('smeet:header-resize',queueFilmVisibility,{signal});
const modalObserver = typeof MutationObserver === 'function' ? new MutationObserver(syncFilm) : null;
[dialog, $('#smeet-cart')].filter(Boolean).forEach(modal => modalObserver?.observe(modal,{attributes:true,attributeFilter:['open']}));
modalObserver?.observe(document.body,{attributes:true,attributeFilter:['class']});
motionButton?.addEventListener('click', () => {paused = !paused; syncMotion();}, {signal});
truckEvents = mountTruckTour({root:$('#truck'), reducedMotion:reduced});
bagRider = mountRiderHero({root:$('#rider-hero'), reducedMotion:reduced});
syncMotion();

// A photographic detail keeps the product, ingredients and purchase together.
// It never mounts or requests ingredient geometry.
const detailMotion = mountDetailMotion({dialog, reducedMotion:reduced});
const detailVisual = dialog?.querySelector('.dialog-product-visual');
const detailImage = dialog?.querySelector('.dialog-product-image');
const detailDescription = dialog?.querySelector('.dialog-product-description');
const ingredientsHeading = detailDescription ? document.createElement('h3') : null;
if (ingredientsHeading) {
  ingredientsHeading.className = 'dialog-ingredients-heading';
  detailDescription.before(ingredientsHeading);
}
dialog?.classList.add('photo-detail-dialog');
const dialogAdd = dialog?.querySelector('.dialog-add');
dialogAdd?.classList.add('smeet-jelly-button');
let photoOpener = null, selectedProduct = null, detailOverflow = null;
let detailLocked = false, handingToCart = false, detailRevision = 0;

detailImage?.addEventListener('error', () => {
  if (!selectedProduct || detailVisual?.dataset.detailPhoto !== 'appetite') return;
  const fallback = productPhotoSources(selectedProduct,presentation);
  detailVisual.dataset.detailPhoto = 'original';
  detailImage.removeAttribute('srcset'); detailImage.removeAttribute('sizes');
  detailImage.src = new URL(fallback.src,document.baseURI).href;
}, {signal});

function restoreDetailPage(restoreFocus = true) {
  if (dialog?.open) return;
  if (detailLocked) {
    document.body.style.setProperty('overflow', detailOverflow.value, detailOverflow.priority);
    detailLocked = false; detailOverflow = null;
  }
  if (restoreFocus && !handingToCart && !document.querySelector('dialog[open]')) {
    const target = photoOpener; photoOpener = null;
    if (target?.isConnected) target.focus({preventScroll:true});
  }
}
function showProduct(id, opener) {
  const product = catalog.get(id);
  if (disposed || !product || !dialog || typeof dialog.showModal !== 'function') return false;
  if (handingToCart) return true;
  if ($$('dialog[open]').some(modal => modal !== dialog)) return false;
  const image = dialog.querySelector('.dialog-product-image');
  const title = dialog.querySelector('#product-dialog-title');
  const description = dialog.querySelector('.dialog-product-description');
  const priceSlot = dialog.querySelector('.dialog-product-price');
  if (!image || !title || !description || !priceSlot) return false;
  detailRevision++; photoOpener = opener; selectedProduct = id;
  const photo = productPhotoSources(product.id,presentation);
  const media = appetiteMedia[id], isAppetite = Boolean(media?.poster);
  const src = isAppetite ? media.poster : photo.src;
  const srcset = isAppetite ? (media.posterSmall ? `${media.posterSmall} 640w, ${media.poster} 960w` : '') : photo.srcset;
  // Assign responsive candidates first, so a small screen need not fetch both.
  if (srcset) {image.srcset = srcset; image.sizes = '(max-width: 760px) calc(100vw - 24px), 500px';}
  else {image.removeAttribute('srcset'); image.removeAttribute('sizes');}
  image.src = new URL(src,document.baseURI).href;
  image.decoding = 'async'; image.width = 960; image.height = 960;
  image.dataset.photoOriginal = photo.original;
  if (detailVisual) {
    delete detailVisual.dataset.foodScene;
    detailVisual.dataset.detailPhoto = isAppetite ? 'appetite' : 'original';
  }
  image.alt = product.name; title.textContent = product.name; description.textContent = product.description;
  if (ingredientsHeading) ingredientsHeading.textContent = product.category === 'Burger' ? 'Ingredienti' : product.category === 'Menù completi' ? 'Nel menù' : 'Il contorno';
  const options = dialog.querySelector('.dialog-product-options');
  if (options) options.textContent = (product.observed_options || []).map(option => `${option.name}: +${formatCents(Math.round(option.additional_price_eur * 100))}`).join(' · ');
  const price = document.createElement('div'); price.className = 'product-price';
  const unitCents = productUnitCents(product), regularCents = Math.round(product.regular_price_eur * 100);
  if (unitCents < regularCents) {
    const original = document.createElement('s');
    original.className = 'price-original'; original.textContent = formatCents(regularCents);
    price.append(original, ' ');
  }
  const current = document.createElement('strong');
  current.className = 'price-current'; current.textContent = formatCents(unitCents);
  price.append(current); priceSlot.replaceChildren(price);
  if (dialogAdd) {
    dialogAdd.disabled = false;
    dialogAdd.setAttribute('aria-label', `Aggiungi ${product.name} al sacchetto`);
  }
  if (!dialog.open) {
    detailOverflow = {value:document.body.style.getPropertyValue('overflow'),priority:document.body.style.getPropertyPriority('overflow')};
    document.body.style.setProperty('overflow','hidden'); detailLocked = true;
    try { dialog.showModal(); }
    catch { restoreDetailPage(false); selectedProduct = null; return false; }
  }
  dialog.scrollTop = 0;
  void detailMotion.open(opener);
  syncFilm();
  return true;
}

// The menu delegates its own links. This hook covers #signature and any other
// product link outside the menu, independently of the hero's class name.
const outsideProductLinks = $$('[data-product-photo]').filter(link => !menuRoot?.contains(link));
outsideProductLinks.forEach(link => {
  if (dialog && typeof dialog.showModal === 'function') link.setAttribute('aria-haspopup','dialog');
  link.addEventListener('click', event => {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (showProduct(link.dataset.productPhoto, link)) event.preventDefault();
  }, {signal});
});
dialog?.querySelector('.dialog-close')?.addEventListener('click', () => {void detailMotion.close();}, {signal});
dialog?.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) void detailMotion.close();
}, {signal});
dialog?.addEventListener('close', () => {
  if (dialog.open) return; // Ignore a delayed event after a quick reopening.
  restoreDetailPage();
  if (!handingToCart) selectedProduct = null;
  syncFilm();
}, {signal});

function waitForDetailClose() {
  let finish;
  const promise = new Promise(resolve => {
    finish = value => {
      dialog.removeEventListener('close', onClose);
      signal.removeEventListener('abort', onAbort);
      resolve(value);
    };
    const onClose = () => {if (!dialog.open) finish(true);};
    const onAbort = () => finish(false);
    // Registered after restoration above, before starting the close animation.
    dialog.addEventListener('close', onClose);
    signal.addEventListener('abort', onAbort, {once:true});
  });
  return {promise, cancel:() => finish(false)};
}
dialogAdd?.addEventListener('click', async event => {
  event.preventDefault(); // Cart's document handler must not add the item twice.
  if (disposed || handingToCart || !dialog.open || !selectedProduct) return;
  const id = selectedProduct;
  const feedbackSnapshot = cart.captureFeedback(dialogAdd,id);
  const returnTarget = photoOpener?.isConnected ? photoOpener : $('[data-cart-open]');
  const token = ++detailRevision;
  handingToCart = true; dialogAdd.disabled = true;
  let closeEvent;
  try {
    if (!cart.add(id)) return;
    closeEvent = waitForDetailClose();
    const closed = await detailMotion.close();
    if (!closed && dialog.open) return;
    if (!await closeEvent.promise || disposed || token !== detailRevision || dialog.open) return;
    // Keep shopping after adding. Closing restores the product link focus and
    // removes the native top layer before the thumbnail flies to the bag.
    restoreDetailPage(false); photoOpener = null; selectedProduct = null;
    if (returnTarget?.isConnected) returnTarget.focus({preventScroll:true});
    const addButton = returnTarget?.closest('[data-menu-product]')?.querySelector('[data-add-to-cart]');
    cart.confirmAdded(id,feedbackSnapshot,{trigger:addButton || dialogAdd}); syncFilm();
  } finally {
    closeEvent?.cancel();
    if (token === detailRevision) {
      handingToCart = false;
      if (!disposed) dialogAdd.disabled = false;
    }
  }
}, {signal});
const menu = mountSimpleMenu({root:menuRoot, onOpenProduct:showProduct});
appetiteMotion = mountAppetiteMotion({root:menuRoot, entries:appetiteMedia, reducedMotion:reduced, paused:true});
menuBoard = mountMenuBoard({root:$('#menu-board'), reducedMotion:reduced, paused:true});

// The opening is intentionally replayable; service objects never loop.
$('#replay-intro')?.addEventListener('click', () => {
  introActive = true; syncMotion();
  intro?.replay();
}, {signal});

if ($('#year')) $('#year').textContent = new Date().getFullYear();

// Variant B keeps the previous experiment behind a deliberate action.
const mapButton = $('#open-parma-map');
mapButton?.addEventListener('click', async () => {
  try {
    const {toggleOptionalMap} = await import('./optional-map.js');
    if (!disposed) await toggleOptionalMap(mapButton);
  } catch {
    const status = $('[data-map-status]');
    if (status) status.textContent = 'La mappa animata non è disponibile. Puoi usare le indicazioni qui sotto.';
  }
}, {signal});
// The original morning and dressing film opens the visit; the footer can replay it.
intro = mountOriginalOpening({reducedMotion:reduced, autoStart:!$('#rider-hero'), onComplete:() => {
  if (disposed) return;
  introActive = false;
  if (motionButton) motionButton.hidden = false;
  if (!serviceMotion) serviceMotion = mountServiceMotion({root:document, reducedMotion:reduced, includeMenuImages:false});
  syncMotion();
}});
if (!introActive) {
  if (motionButton) motionButton.hidden = false;
  serviceMotion = mountServiceMotion({root:document, reducedMotion:reduced, includeMenuImages:false});
  syncMotion();
}
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  disposed = true; detailRevision++; lifecycle.abort();
  cancelAnimationFrame(filmViewportRaf); stopFilm(true); filmObserver?.disconnect(); modalObserver?.disconnect();
  mobileFinish.dispose();
  openingHours.dispose(); headerSize.dispose();
  detailMotion.dispose();
  ingredientsHeading?.remove(); dialog?.classList.remove('photo-detail-dialog');
  appetiteMotion?.dispose();
  menuBoard?.dispose();
  truckEvents?.dispose();
  bagRider?.dispose();
  if (dialog?.open) dialog.close();
  restoreDetailPage(false);
  intro?.dispose(); serviceMotion?.dispose(); menu.dispose(); cart.dispose();
  outsideProductLinks.forEach(link => link.removeAttribute('aria-haspopup'));
});
