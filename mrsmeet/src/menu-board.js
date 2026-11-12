/** A mechanical split-flap board, with a readable static HTML baseline. */
import {motionViewport, motionExposure} from './motion-viewport.js';
const ORDER = ['classic-smash-menu', 'chicken-burger-menu', 'menu-birra', 'classic-smash-burger-triplo', 'classic-smash-burger-doppio', 'plant-based-burger-doppio', '100-percento-vegano', 'sweet-fries', 'classic-fries', 'nuggets-di-pollo'];
const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
const money = value => `€ ${Number(value).toFixed(2).replace('.', ',')}`;
const GROUP_SIZE = 3;
const GROUP_TURN_MS = 500;
const TURNS = 4;
const FLAP_MS = GROUP_TURN_MS / TURNS;
const WHEEL = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789%&';

function tile(character) {
  const char = escapeHTML(character);
  return `<span class="menu-board__glyph" data-final="${char}"><span class="menu-board__letter">${char}</span><span class="menu-board__half menu-board__top" data-char="${char}"></span><span class="menu-board__half menu-board__bottom" data-char="${char}"></span><span class="menu-board__half menu-board__flap-top" data-char="${char}"></span><span class="menu-board__half menu-board__flap-bottom" data-char="${char}"></span></span>`;
}
function tiles(text) {
  return String(text).split(/(\s+)/u).map(part => /^\s+$/u.test(part) ? escapeHTML(part) : `<span class="menu-board__word">${[...part].map(tile).join('')}</span>`).join('');
}

/** Can also be imported by the page generator: data/menu.json is the source. */
export function renderMenuBoardSection(products) {
  const byId = new Map(products.map(product => [product.id, product]));
  const rows = ORDER.map(id => byId.get(id)).filter(Boolean).map((product, index) => {
    const price = product.regular_price_eur, promo = product.observed_promo_price;
    if (!Number.isFinite(price) || price < 0) throw new TypeError(`Invalid price for ${product.id}`);
    const discounted = Number.isFinite(promo) && promo >= 0 && promo < price;
    const category = product.category === 'Menù completi' ? 'MENÙ COMPLETO' : product.category.toUpperCase();
    return `          <li class="menu-board__row" data-menu-board-row="${escapeHTML(product.id)}">
            <span class="menu-board__number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
            <span class="menu-board__product"><span class="menu-board__category">${escapeHTML(category)}</span><span class="menu-board__name"><span class="menu-board__sr">${escapeHTML(product.name)}</span><span data-menu-board-letters aria-hidden="true">${tiles(product.name)}</span></span></span>
            <span class="menu-board__price">${discounted ? `<span class="menu-board__was"><span class="menu-board__sr">Prezzo precedente </span><s>${money(price)}</s></span>` : ''}<strong${discounted ? ' class="menu-board__offer"' : ''}>${discounted ? '<span class="menu-board__sr">Prezzo promozionale </span>' : ''}${money(discounted ? promo : price)}</strong></span>
          </li>`;
  });
  return `<section class="menu-board" id="menu-board" aria-labelledby="menu-board-title">
  <div class="menu-board__panel">
    <header class="menu-board__header">
      <div class="menu-board__heading"><p class="menu-board__eyebrow">MR SMEET · MENÙ</p><h2 id="menu-board-title">IL TABELLONE</h2><p class="menu-board__intro">Smash burger, menù e contorni.</p></div>
      <div class="menu-board__art" data-menu-board-art aria-hidden="true">
        <img src="./images/menu-unified/menu-board.webp" srcset="./images/menu-unified/menu-board-640.webp 640w, ./images/menu-unified/menu-board.webp 960w" sizes="(max-width: 600px) 120px, 230px" alt="" width="960" height="540" loading="lazy" decoding="async" />
        <video class="menu-board__film" data-menu-board-film data-src="./films/menu-unified/menu-board.mp4" preload="none" muted playsinline tabindex="-1" aria-hidden="true"></video>
      </div>
    </header>
    <div class="menu-board__columns" aria-hidden="true"><span>#</span><span>SCELTA</span><span>PREZZO</span></div>
    <ul class="menu-board__rows" aria-label="Riepilogo del menù e dei prezzi">
${rows.join('\n')}
    </ul>
    <p class="menu-board__note">Promozioni e disponibilità da verificare sul canale scelto. Consegna ed eventuali commissioni escluse.</p>
  </div>
</section>`;
}

export function mountMenuBoard({root, reducedMotion, paused = false} = {}) {
  const doc = root?.ownerDocument, view = doc?.defaultView;
  if (!root || !view) return {setPaused() {}, dispose() {}};
  const motion = reducedMotion ?? view.matchMedia?.('(prefers-reduced-motion: reduce)');
  const connection = view.navigator?.connection;
  const isReduced = () => typeof motion === 'boolean' ? motion : Boolean(motion?.matches);
  const blocked = () => manualPaused || isReduced() || doc.hidden || doc.body?.classList.contains('motion-paused') || Boolean(doc.querySelector('dialog[open]'));
  const rows = [...root.querySelectorAll('[data-menu-board-row]')].map((element,index) => ({element, group:Math.floor(index/GROUP_SIZE), visible:false, played:false, animations:new Set(), timers:new Set(), revision:0, label:element.querySelector('[data-menu-board-letters]'), original:null}));
  const art = root.querySelector('[data-menu-board-art]'), film = root.querySelector('[data-menu-board-film]');
  const removers = [], originalFilmState = film && {src:film.getAttribute('src'), ready:film.getAttribute('data-ready')};
  let disposed = false, manualPaused = Boolean(paused), observer = null, bodyObserver = null;
  const groups = Array.from({length:Math.ceil(rows.length/GROUP_SIZE)},(_,index) => ({
    rows:rows.slice(index*GROUP_SIZE,(index+1)*GROUP_SIZE),played:false,
  }));
  let groupTimer = null, activeGroup = null, scrollFrame = null;
  const originalPhase = root.getAttribute('data-menu-board-phase');
  const clearGroupTimer = () => {view.clearTimeout(groupTimer);groupTimer=null;};
  const phase = value => {root.dataset.menuBoardPhase=value;};
  const scheduleGroup = (callback,delay) => {
    clearGroupTimer();
    groupTimer=view.setTimeout(()=>{groupTimer=null;if(!disposed)callback();},delay);
  };
  let filmVisible = false, attempted = false, filmDone = false, filmActive = false, filmToken = 0, loadTimer = null, endTimer = null;
  const listen = (target, event, callback, options) => {target?.addEventListener?.(event, callback, options);removers.push(() => target?.removeEventListener?.(event, callback, options));};
  const clearTimers = () => {view.clearTimeout(loadTimer);view.clearTimeout(endTimer);loadTimer=endTimer=null;};
  const finalTile = glyph => {
    delete glyph.dataset.flipping;
    glyph.querySelectorAll('[data-char]').forEach(half => {half.dataset.char=glyph.dataset.final;});
  };
  const settle = row => {
    row.revision++;
    for(const timer of row.timers)view.clearTimeout(timer);
    row.timers.clear();
    for(const animation of row.animations)animation.cancel();
    row.animations.clear();
    row.label?.querySelectorAll('.menu-board__glyph').forEach(finalTile);
    row.element.removeAttribute('data-menu-board-turning');
  };

  function flipTile(row, glyph, revision) {
    const top=glyph.querySelector('.menu-board__top'), bottom=glyph.querySelector('.menu-board__bottom');
    const flapTop=glyph.querySelector('.menu-board__flap-top'), flapBottom=glyph.querySelector('.menu-board__flap-bottom');
    if(!top || !bottom || typeof flapTop?.animate!=='function' || typeof flapBottom?.animate!=='function')return null;
    const final=glyph.dataset.final;
    const letter=final.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
    const position=Math.max(0,WHEEL.indexOf(letter));
    const characters=Array.from({length:TURNS},(_,step)=>WHEEL[(position-TURNS+step+WHEEL.length)%WHEEL.length]);
    characters.push(final);
    const paintTurn = step => {
      if(disposed || revision!==row.revision || blocked())return;
      // The old top falls away, exposing the next upper half; its lower half
      // lands on the old bottom. Intermediate letters are actual wheel glyphs.
      top.dataset.char=flapBottom.dataset.char=characters[step+1];
      bottom.dataset.char=flapTop.dataset.char=characters[step];
    };
    paintTurn(0);glyph.dataset.flipping='true';
    const pair=[];
    try {
      const timing={duration:FLAP_MS,iterations:TURNS,easing:'linear',fill:'forwards'};
      pair.push(flapTop.animate([{transform:'rotateX(0deg)'},{transform:'rotateX(-90deg)',offset:.5},{transform:'rotateX(-90deg)'}],timing));
      pair.push(flapBottom.animate([{transform:'rotateX(90deg)'},{transform:'rotateX(90deg)',offset:.5},{transform:'rotateX(0deg)'}],timing));
      pair.forEach(animation=>{row.animations.add(animation);Promise.resolve(animation.finished).catch(()=>{});});
    } catch {
      pair.forEach(animation=>{Promise.resolve(animation.finished).catch(()=>{});animation.cancel();});
      finalTile(glyph);return null;
    }
    return paintTurn;
  }
  function flutter(row) {
    if(row.played || !row.label || blocked())return;
    row.played=true;
    if(row.original==null)row.original=row.label.innerHTML;
    if(!row.label.querySelector('.menu-board__glyph'))row.label.innerHTML=tiles(row.label.textContent);
    const revision=++row.revision;
    row.element.setAttribute('data-menu-board-turning','true');
    const turns=[...row.label.querySelectorAll('.menu-board__glyph')].map(glyph=>flipTile(row,glyph,revision)).filter(Boolean);
    // Three clocks per row, rather than a timer for each letter. Every row in
    // this fixed block starts together and reaches its final text at 500 ms.
    for(let step=1;step<TURNS;step++) {
      const timer=view.setTimeout(()=>{
        row.timers.delete(timer);
        if(revision===row.revision)turns.forEach(paintTurn=>paintTurn(step));
      },step*FLAP_MS);
      row.timers.add(timer);
    }
  }
  function finishGroup() {
    clearGroupTimer();
    activeGroup?.rows.forEach(settle);
    activeGroup=null;phase('idle');
  }
  function groupInReadingArea(group) {
    const area=motionViewport(doc,view);
    if(group.played || !group.rows.some(row=>row.visible && motionExposure(row.element.getBoundingClientRect(),area)>.2))return false;
    const first=group.rows[0].element.getBoundingClientRect();
    const last=group.rows.at(-1).element.getBoundingClientRect();
    const readingBottom=area.top+area.height*.85;
    // Usually all three rows fit together. Short landscape screens and a
    // quick scroll into the middle of a group still get one complete reveal.
    return last.bottom<=readingBottom || first.top<area.top || last.bottom-first.top>area.height*.85;
  }
  function startGroup(group) {
    group.played=true;activeGroup=group;phase('turning');
    scheduleGroup(()=>{finishGroup();sync();},GROUP_TURN_MS);
    group.rows.forEach(flutter);
  }
  function syncGroups() {
    if(typeof root.animate!=='function'){phase('idle');return;}
    if(activeGroup) {
      if(activeGroup.rows.some(row=>row.visible && motionExposure(row.element.getBoundingClientRect(),motionViewport(doc,view))>.2))return;
      finishGroup();
    }
    const group=groups.find(groupInReadingArea);
    if(group)startGroup(group);
  }
  function noteScroll() {
    // Follow native scrolling on the next frame, without waiting for the
    // gesture to end. Completed blocks stay consumed for this page visit.
    if(scrollFrame!=null)return;
    scrollFrame=view.requestAnimationFrame(()=>{scrollFrame=null;sync();});
  }
  function releaseFilm() {
    if(!film)return;
    filmToken++;clearTimers();filmActive=false;
    film.pause();film.removeAttribute('data-ready');
    if(film.hasAttribute('src')){film.removeAttribute('src');film.load();}
    if(attempted)filmDone=true;
  }
  function finishFilm() {
    if(!film || !filmActive)return;
    clearTimers();filmActive=false;filmDone=true;film.pause();
    // A native still frame remains while this small header is visible.
    if(!filmVisible || blocked())releaseFilm();
  }
  function playFilm() {
    if(!film || !filmVisible || attempted || filmDone || blocked() || connection?.saveData)return;
    const source=film.dataset.src;
    if(!source)return;
    attempted=true;filmActive=true;const token=++filmToken;
    film.muted=true;film.playsInline=true;film.loop=false;film.src=source;
    loadTimer=view.setTimeout(releaseFilm,3200);
    let result;
    try {result=film.play();} catch {releaseFilm();return;}
    Promise.resolve(result).then(() => {
      if(disposed || token!==filmToken || !filmActive || blocked())film.pause();
    }, () => {if(!disposed && token===filmToken)releaseFilm();});
  }
  function sync() {
    if(disposed)return;
    if(blocked()) {
      finishGroup();
      rows.forEach(settle);
      if(attempted)releaseFilm();
      return;
    }
    syncGroups();
    if(connection?.saveData){if(attempted)releaseFilm();}else playFilm();
  }
  listen(film,'playing',() => {
    if(disposed || !filmActive || filmDone || !filmVisible || blocked() || connection?.saveData){film?.pause();return;}
    view.clearTimeout(loadTimer);loadTimer=null;film.setAttribute('data-ready','true');
    // The supplied clip is four seconds; never extend it through buffering.
    if(endTimer==null)endTimer=view.setTimeout(finishFilm,4500);
  });
  listen(film,'ended',finishFilm);listen(film,'error',() => {if(!disposed && film?.hasAttribute('src'))releaseFilm();});
  listen(doc,'visibilitychange',sync);listen(view,'pagehide',releaseFilm);
  if(motion?.addEventListener)listen(motion,'change',sync);
  else if(motion?.addListener){motion.addListener(sync);removers.push(()=>motion.removeListener(sync));}
  listen(connection,'change',sync);
  // Catalog filters do not alter this complete list, so they never replay it.
  listen(view,'scroll',noteScroll,{passive:true});
  listen(view,'resize',noteScroll);
  listen(view,'smeet:header-resize',noteScroll);

  if(typeof view.IntersectionObserver==='function') {
    observer=new view.IntersectionObserver(entries => {
      if(disposed)return;
      for(const entry of entries) {
        if(entry.target===art){filmVisible=entry.isIntersecting && entry.intersectionRatio>=.2;if(!filmVisible && attempted)releaseFilm();continue;}
        const row=rows.find(item=>item.element===entry.target);if(!row)continue;
        const visible=entry.isIntersecting && entry.intersectionRatio>=.2;
        row.visible=visible;
        if(!row.visible)settle(row);
      }
      // Leaving the board never resets a completed block or its characters.
      sync();
    },{threshold:[0,.2]});
    rows.forEach(row=>observer.observe(row.element));if(art)observer.observe(art);
  }
  // With no observer the baseline stays still; never eager-load decorative media.
  if(view.MutationObserver && doc.body) {
    bodyObserver=new view.MutationObserver(sync);
    bodyObserver.observe(doc.body,{attributes:true,subtree:true,attributeFilter:['class','open']});
  }
  return {
    setPaused(value){if(!disposed){manualPaused=Boolean(value);sync();}},
    dispose(){
      if(disposed)return;disposed=true;clearGroupTimer();
      if(scrollFrame!=null)view.cancelAnimationFrame(scrollFrame);
      observer?.disconnect();bodyObserver?.disconnect();
      removers.forEach(remove=>remove());rows.forEach(row=>{settle(row);if(row.original!=null)row.label.innerHTML=row.original;});
      releaseFilm();
      if(originalPhase==null)root.removeAttribute('data-menu-board-phase');else root.setAttribute('data-menu-board-phase',originalPhase);
      if(film && originalFilmState){for(const [name,value] of [['src',originalFilmState.src],['data-ready',originalFilmState.ready]]){if(value==null)film.removeAttribute(name);else film.setAttribute(name,value);}}
    },
  };
}
