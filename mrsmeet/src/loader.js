// A vector short film: all costumes are independent pieces so Mr Smeet can
// actually wake, dress and become his own logo at any screen resolution.
const assetBase = import.meta.env?.BASE_URL || './';
const scene = `
<div class="smeet-loader__theatre" aria-hidden="true">
  <svg class="smeet-loader__film" viewBox="0 0 960 570" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <pattern id="smeet-quilt" width="45" height="45" patternUnits="userSpaceOnUse"><path d="m0 0 45 45M45 0 0 45" stroke="#dc94ae" stroke-width="1.4"/><circle cx="22.5" cy="22.5" r="2" fill="#dc94ae"/></pattern>
      <pattern id="smeet-pajama" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M4 0v18" stroke="#fff9dc" stroke-width="5"/></pattern>
      <linearGradient id="smeet-window-sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f3bfd3"/><stop offset="1" stop-color="#fff9dc"/></linearGradient>
      <linearGradient id="smeet-bun" x1="0" y1="0" x2="0.8" y2="1"><stop stop-color="#fffde8"/><stop offset="1" stop-color="#f9edb8"/></linearGradient>
      <linearGradient id="smeet-duvet-shade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f9d8e5"/><stop offset="1" stop-color="#edabc7"/></linearGradient>
      <radialGradient id="smeet-light"><stop stop-color="#fff9dc" stop-opacity=".7"/><stop offset="1" stop-color="#fff9dc" stop-opacity="0"/></radialGradient>
    </defs>
    <g class="smeet-loader__room">
      <path d="M124 454V261C124 125 232 49 480 49s356 76 356 212v193" fill="#fff9dc" fill-opacity=".18"/>
      <path d="M145 451V264c0-124 103-194 335-194s335 70 335 194v187" stroke="#173e34" stroke-opacity=".25" stroke-width="1.2"/>
      <path d="M145 418h670" stroke="#173e34" stroke-opacity=".25" stroke-width="1.2"/>
      <g class="smeet-loader__window" stroke="#173e34" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M221 284V191c0-55 41-77 76-77s76 22 76 77v93Z" fill="url(#smeet-window-sky)"/>
        <path d="M231 274v-83c0-44 33-67 66-67s66 23 66 67v83Z" stroke-width="1.5"/>
        <g class="smeet-loader__sun"><circle cx="299" cy="206" r="31" fill="#f4d377" stroke="none"/><path d="M299 163v-9m-32 23-7-7m80 36h9m-93 0h-9m85-29 7-7" stroke="#e3b14c" stroke-width="2"/></g>
        <path d="M229 247c20-27 37-22 57-9 26-37 51-18 79 7v30H230Z" fill="#70c8a7" stroke="none"/>
        <path d="M297 125v150m-65-64h131" stroke-width="3"/>
        <path d="M211 285h172v9H211Z" fill="#fff9dc"/>
      </g>
      <g class="smeet-loader__wall-doodle" stroke="#173e34" stroke-width="2.8" stroke-linecap="round">
        <path d="M461 121c7-9 16-9 22-2 9-14 26-7 23 7-2 11-13 17-23 24-12-7-22-17-22-29Z" fill="#f3bfd3"/>
        <path d="m476 87 2 10m-36 10 8 5m72-4-8 5"/>
      </g>
      <g class="smeet-loader__dresser" stroke="#173e34" stroke-width="3.4" stroke-linejoin="round">
        <path d="M707 253h95v192h-95Z" fill="#fff9dc"/><path d="M707 253h95v21h-95Z" fill="#f3bfd3"/>
        <path d="M713 309h83m-83 64h83" stroke-width="2"/><path d="M745 291h17m-17 49h17m-17 60h17" stroke-width="3" stroke-linecap="round"/>
        <path d="M716 445v11m77-11v11" stroke-width="8" stroke-linecap="round"/>
        <ellipse cx="754" cy="188" rx="40" ry="56" fill="#80d5ba"/><ellipse cx="754" cy="188" rx="33" ry="48" fill="#d5eed6" stroke-width="1.5"/>
        <path d="m733 174 25-27m-19 45 37-39" stroke="#fff9dc" stroke-width="6" stroke-linecap="round"/>
        <path d="M754 245v7"/>
      </g>
      <ellipse cx="476" cy="478" rx="280" ry="36" fill="#f3bfd3" stroke="#173e34" stroke-width="2.5"/>
      <ellipse cx="476" cy="478" rx="256" ry="24" stroke="#173e34" stroke-opacity=".28" stroke-width="1.1"/>
      <path d="m218 478 516 0m-480-12h442m-442 24h442" stroke="#173e34" stroke-opacity=".14"/>
      <g class="smeet-loader__bed" stroke="#173e34" stroke-width="3.5" stroke-linejoin="round">
        <path d="M214 447V308c0-25 15-39 41-39h172c25 0 39 15 39 39v139" fill="#f3bfd3"/>
        <path d="M228 321v-11c0-15 9-26 25-26h171c16 0 28 11 28 26v11" stroke-opacity=".4" stroke-width="1.6"/>
        <path d="M233 327c18-16 184-16 211 0l-12 73H244Z" fill="#fff9dc"/>
        <path d="M247 338c21-10 154-10 181 0" stroke-opacity=".22" stroke-width="1.5"/>
        <path d="M204 406h276v42H204Z" fill="#eaa5c0"/>
        <path d="M208 449v25m268-25v25" stroke-width="10" stroke-linecap="round"/>
        <path d="M202 419h279" stroke-width="1.5"/>
      </g>
      <g class="smeet-loader__nightstand" stroke="#173e34" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M151 377h70v63h-70Z" fill="#fff9dc"/><path d="M146 372h80v8h-80Z" fill="#f3bfd3"/>
        <path d="M155 440v16m62-16v16m-60-51h58"/><path d="M180 391h11" stroke-width="3"/>
        <g class="smeet-loader__alarm">
          <path d="m165 339-5-6m40 6 5-6m-39 32-4 7m39-7 4 7"/>
          <circle cx="183" cy="352" r="21" fill="#f3bfd3"/><circle cx="183" cy="352" r="15" fill="#fff9dc" stroke-width="1.8"/>
          <path d="M183 341v12l8 4" stroke-width="2"/>
          <path d="M161 331c-5 1-9 6-8 11m52-11c6 1 10 6 9 11" stroke-width="7"/>
        </g>
        <g class="smeet-loader__alarm-rays" stroke-width="2"><path d="m147 324-7-9m3 33-11-2m85-21 8-10m-6 33 11-2"/></g>
      </g>
    </g>
    <ellipse class="smeet-loader__actor-shadow" cx="499" cy="477" rx="103" ry="12" fill="#173e34" opacity=".13"/>
    <g class="smeet-loader__actor">
      <g class="smeet-loader__legs" fill="#fff9dc" stroke="#173e34" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M456 393c-4 24-2 46-5 67m89-67c2 24 1 46 7 67" fill="none" stroke-width="7"/>
        <path d="M454 455c-8-2-16 6-15 12-18-5-35-1-35 8 0 10 50 9 61 4 8-4 7-16-11-24Zm88 0c8-2 16 6 15 12 18-5 35-1 35 8 0 10-50 9-61 4-8-4-7-16 11-24Z"/>
        <path d="m416 474 16 0m134 0h14" stroke-width="2"/>
      </g>
      <g class="smeet-loader__left-arm" stroke="#173e34" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M406 329c-21 7-49 31-49 51"/>
        <g fill="#fff9dc" stroke-width="3.5"><path d="M357 375c-10-4-20 0-22 8-11-4-16 4-8 11-11 4-10 13 2 14-6 8 1 15 11 9l14-11c8 2 14-2 14-9 0-8-3-15-11-22Z"/><path d="m330 394 9 3m-8 11 9-6" stroke-width="2"/></g>
      </g>
      <g class="smeet-loader__right-arm" stroke="#173e34" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
        <path d="M583 333c28 6 51 29 54 50"/>
        <g fill="#fff9dc" stroke-width="3.5"><path d="M637 377c10-4 20 0 22 8 11-4 16 4 8 11 11 4 10 13-2 14 6 8-1 15-11 9l-14-11c-8 2-14-2-14-9 0-8 3-15 11-22Z"/><path d="m664 396-9 3m8 11-9-6" stroke-width="2"/></g>
      </g>
      <path class="smeet-loader__bare-body" d="M417 284c0-45 31-74 79-74 49 0 85 31 85 74v78c0 37-25 60-84 60-52 0-80-24-80-60Z" fill="#fff9dc" stroke="#173e34" stroke-width="4"/>
      <g class="smeet-loader__pajamas" stroke="#173e34" stroke-width="3.5" stroke-linejoin="round">
        <path d="M416 329c17 14 63 20 81 20 27 0 60-7 84-20v42c0 34-35 46-84 46-47 0-81-11-81-46Z" fill="#39bd9d"/>
        <path d="M416 329c17 14 63 20 81 20 27 0 60-7 84-20v42c0 34-35 46-84 46-47 0-81-11-81-46Z" fill="url(#smeet-pajama)"/>
        <path d="m462 344 28 18 8-13 10 13 27-18" fill="#fff9dc"/><path d="M497 365v44" stroke-width="2"/>
        <circle cx="508" cy="378" r="2.5" fill="#173e34" stroke="none"/><circle cx="508" cy="397" r="2.5" fill="#173e34" stroke="none"/>
      </g>
      <g class="smeet-loader__bun-bottom" stroke="#173e34" stroke-width="4" stroke-linejoin="round">
        <path d="M355 351c5 48 21 59 55 69 39 12 132 20 175 0 26-12 34-31 38-68Z" fill="url(#smeet-bun)"/>
        <path d="M371 370c6 21 14 29 27 33" stroke="#fffef1" stroke-width="7" stroke-linecap="round"/>
      </g>
      <g class="smeet-loader__patty" fill="#111c17"><path d="M351 329c-19 8-17 24-9 30-10 20 11 31 26 25 10 16 30 19 45 10 15 15 35 16 52 6 19 18 44 18 61 7 21 16 42 15 54 1 22 7 42-1 43-18 20 1 28-12 21-29 15-23-9-44-30-35-70-12-170-20-263 3Z"/></g>
      <g class="smeet-loader__bun-top" stroke="#173e34" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M352 329c-4-31 8-70 30-98 27-37 62-58 111-59 48-1 85 19 112 56 25 34 42 75 33 119-30 17-116 20-181 13-50-5-87-13-105-31Z" fill="url(#smeet-bun)"/>
        <path d="M372 277c14-37 40-65 71-76" stroke="#fffef1" stroke-width="7"/>
        <g fill="#fffef1" stroke-width="2.8"><path d="M443 196c-18 2-24 7-19 11 4 4 14-1 19-11Zm38-11c-12 5-16 13-13 15 6 3 10-9 13-15Zm33 4c-4 10-3 15 1 17 6-1 2-11-1-17Zm39 16c-2 9-1 15 4 17 6-4 0-13-4-17Zm30 26c-3 8-1 13 4 14 4-4 0-9-4-14Z"/></g>
      </g>
      <g class="smeet-loader__face" stroke="#111c17" stroke-linecap="round" stroke-linejoin="round">
        <g class="smeet-loader__eyes-open" fill="#111c17" stroke="none"><circle cx="424" cy="262" r="7.5"/><circle cx="525" cy="271" r="8.5"/></g>
        <g class="smeet-loader__eyes-closed" stroke-width="4"><path d="M415 263c5 6 12 6 18 0m83 8c6 6 12 6 18 0"/></g>
        <path d="M479 265c-2 11-11 16-18 12-7-5-11-15-18-10-7 6-1 20 6 23 8 6 29 7 38-1" stroke-width="4"/>
        <g class="smeet-loader__moustache" fill="#111c17" stroke-width="1.5">
          <path class="smeet-loader__moustache-left" d="M452 301c-16 9-36 14-56 7-7-2-10-5-14-10 2 20 40 30 55 20 6 4 13-4 15-17Z"/>
          <path class="smeet-loader__moustache-right" d="M466 302c15 13 32 26 54 28 10 1 15-1 23-3-15 18-46 16-64 4-10 5-19-1-13-29Z"/>
        </g>
      </g>
      <g class="smeet-loader__monocle" stroke="#111c17" stroke-linecap="round" stroke-linejoin="round">
        <path d="M554 269c39 0 46 29 50 77" stroke-width="3"/>
        <circle cx="525" cy="271" r="29" fill="#67baa0" stroke-width="4"/><circle cx="525" cy="271" r="21.5" fill="#fff9dc" stroke-width="2.5"/><circle cx="525" cy="271" r="8.5" fill="#111c17" stroke="none"/>
        <path d="m512 261 7-7" stroke="#fffef1" stroke-width="4"/>
      </g>
      <g class="smeet-loader__hat" stroke="#111c17" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="m526 171 30-76c12-9 42-1 47 12l-43 77Z" fill="#111c17"/>
        <path d="m535 151-9 21c9 12 27 16 39 11l10-18c-12 5-31-1-40-14Z" fill="#39bd9d" stroke="none"/>
        <path d="M514 163c-6-8-15-1-7 8 11 23 53 37 74 20 10-9 4-14-3-8-13 9-46-2-64-20Z" fill="#111c17"/>
        <path d="m564 110-13 34" stroke="#fff9dc" stroke-opacity=".14" stroke-width="4"/>
      </g>
      <g class="smeet-loader__groom-hand" fill="#fff9dc" stroke="#173e34" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">
        <path d="M585 341c6-19-10-32-29-27" fill="none" stroke-width="7"/>
        <path d="M548 320c-1-7-14-7-21-13-7-7-10-13-15-11-6 3-2 10 4 16-14-8-20-17-25-13-5 4 4 13 12 19-15-5-20-10-24-5-4 6 11 13 19 16-12-2-17 0-17 4 2 10 30 17 42 17 18 1 28-13 25-30Z"/>
      </g>
      <g class="smeet-loader__sleep" fill="#173e34" font-family="DynaPuff, sans-serif"><text x="544" y="224" font-size="20">z</text><text x="569" y="200" font-size="28">z</text><text x="597" y="169" font-size="39">Z</text></g>
    </g>
    <g class="smeet-loader__duvet" stroke="#173e34" stroke-width="3.5" stroke-linejoin="round">
      <path d="M222 355c38-25 198-22 239 5l19 80c-67 20-219 17-276-1Z" fill="url(#smeet-duvet-shade)"/>
      <path d="M222 355c38-25 198-22 239 5l19 80c-67 20-219 17-276-1Z" fill="url(#smeet-quilt)"/>
      <path d="M222 355c43-19 191-17 239 5l4 22c-48-26-210-19-249 0Z" fill="#fff9dc"/>
      <path d="M258 389c-6 15-7 30-3 46m54-50c-3 17-1 33 3 54m52-53c3 15 7 30 7 45" stroke-opacity=".3" stroke-width="1.5"/>
    </g>
    <g class="smeet-loader__ready-sparkles" fill="#fff9dc" stroke="#173e34" stroke-width="3" stroke-linejoin="round">
      <path d="M337 193c1 23-12 37-32 41 21 2 33 15 37 36 1-23 14-36 33-40-23-3-36-16-38-37Z"/>
      <path d="M663 222c1 15-8 23-20 25 15 2 23 10 25 23 1-15 9-22 21-25-14-2-24-9-26-23Z" fill="#f3bfd3"/>
      <path d="m379 131 7-14m-31 39-15-3m281 220 10 10m-1-25 15 0" stroke-linecap="round"/>
    </g>
  </svg>
  <div class="smeet-loader__logo-assembly">
    <span class="smeet-loader__logo-orbit"></span>
    <div class="smeet-loader__logo-art">
      <img class="logo-part logo-part--one" src="${assetBase}images/original-logo.png" alt="" width="500" height="500" />
      <img class="logo-part logo-part--two" src="${assetBase}images/original-logo.png" alt="" width="500" height="500" />
      <img class="logo-part logo-part--three" src="${assetBase}images/original-logo.png" alt="" width="500" height="500" />
      <img class="logo-part logo-part--four" src="${assetBase}images/original-logo.png" alt="" width="500" height="500" />
    </div>
    <span class="smeet-loader__logo-star smeet-loader__logo-star--one">✦</span><span class="smeet-loader__logo-star smeet-loader__logo-star--two">✧</span>
  </div>
</div>`;

// Timings preserve the original six-part morning film and logo assembly.
const EXIT_MS = 620;
const SAFETY_MS = 12000;
const REDUCED_SAFETY_MS = 3500;
let loaderSequence = 0;

/** The original vector film. Progress reports resources, never elapsed time. */
export function mountLoader({autoStart = true, reducedMotion} = {}) {
  const doc = document, view = doc.defaultView || window;
  const Controller = view.AbortController || AbortController;
  const lifecycle = new Controller();
  const media = reducedMotion && typeof reducedMotion === 'object'
    ? reducedMotion : view.matchMedia?.('(prefers-reduced-motion: reduce)');
  const isReduced = () => reducedMotion === true || Boolean(media?.matches);
  const now = () => view.performance.now();
  const id = `smeet-opening-${++loaderSequence}`;
  let active = null, disposed = false, sequence = 0;

  function later(cycle, callback, delay) {
    const timer = view.setTimeout(() => {
      cycle.timers.delete(timer);
      if (!disposed && active === cycle && !cycle.closed) callback();
    }, Math.max(0,delay));
    cycle.timers.add(timer);
    return timer;
  }
  function clearTimers(cycle) {
    cycle.timers.forEach(timer => view.clearTimeout(timer));
    cycle.timers.clear();
  }
  function percentage(cycle) {
    const resources = Math.round(cycle.ready / cycle.total * 100);
    // The last point represents a real second prerequisite: the original
    // morning story has finished and the logo assembly can actually begin.
    return cycle.storyReady && cycle.logoAssembling ? resources : Math.min(99,resources);
  }
  function paintProgress(cycle) {
    const progress = percentage(cycle);
    cycle.overlay.querySelector('[data-loader-number]').textContent = String(progress).padStart(2,'0');
    const meter = cycle.overlay.querySelector('[data-loader-progress]');
    meter.setAttribute('aria-valuenow',String(progress));
    meter.style.setProperty('--loader-progress',`${progress}%`);
    meter.setAttribute('aria-valuetext',cycle.ready === cycle.total && !cycle.logoAssembling
      ? 'Risorse pronte. Mr Smeet si prepara.' : `${progress}% della preparazione completata`);
    if (cycle.ready === cycle.total) {
      cycle.overlay.setAttribute('aria-busy','false');
      cycle.overlay.querySelector('[data-loader-resource-label]').textContent = 'RISORSE PRONTE. MR SMEET SI PREPARA.';
    }
  }
  function releasePage(cycle, entered = true) {
    if (cycle.released) return;
    cycle.released = true;
    cycle.controller.abort();
    cycle.observer?.disconnect();
    const restoreFocus = cycle.overlay.contains(doc.activeElement) || doc.activeElement === doc.body;
    for (const [element,value] of cycle.inertBefore) {
      if (value === null) element.removeAttribute('inert');
      else element.setAttribute('inert',value);
    }
    doc.body.style.setProperty('overflow',cycle.overflow.value,cycle.overflow.priority);
    doc.body.classList.toggle('smeet-is-loading',cycle.bodyClasses.loading);
    doc.body.classList.toggle('smeet-has-entered',entered || cycle.bodyClasses.entered);
    // Keep the departing curtain out of the accessibility tree. No focus is
    // restored a second time when it is removed, avoiding races with the cart.
    cycle.overlay.setAttribute('inert','');
    cycle.overlay.setAttribute('aria-hidden','true');
    if (!restoreFocus) return;
    const previous = cycle.previousFocus;
    if (previous?.isConnected && previous !== doc.body && !previous.closest('[inert],[hidden]')) {
      previous.focus({preventScroll:true});
    } else if (entered) {
      const target = doc.querySelector('main h1, #site h1, main');
      if (!target || target.closest('[inert],[hidden]')) return;
      const tabindex = target.getAttribute('tabindex');
      target.setAttribute('tabindex','-1'); target.focus({preventScroll:true});
      if (tabindex === null) target.removeAttribute('tabindex');
      else target.setAttribute('tabindex',tabindex);
    }
  }
  function remove(cycle, notify = true) {
    if (active !== cycle || cycle.closed) return;
    cycle.closed = true;
    clearTimers(cycle);
    releasePage(cycle,notify);
    cycle.overlay.remove();
    active = null;
    if (notify && !disposed) doc.dispatchEvent(new view.CustomEvent('smeet:entered',{detail:{
      owner:id, cycle:cycle.number, replay:cycle.replay, skipped:cycle.skipped,
      reducedMotion:isReduced(), exitDuration:cycle.exitDuration || 0,
      reason:cycle.reason, ready:cycle.ready === cycle.total && cycle.storyReady && cycle.logoAssembling,
      progress:percentage(cycle), failed:cycle.failed,
      durationMs:Math.round(now()-cycle.started),
    }}));
  }
  function finish({immediate = false, skipped = false, reason = 'complete'} = {}) {
    const cycle = active;
    if (!cycle || cycle.closed) return false;
    immediate ||= isReduced() || doc.hidden || skipped;
    if (cycle.finishing) {
      if (immediate) {
        cycle.reason=reason; cycle.skipped ||= skipped;
        cycle.exitDuration = Math.max(0,Math.round(now()-cycle.exitStarted));
        remove(cycle);
      }
      return true;
    }
    cycle.finishing = true; cycle.skipped = skipped; cycle.reason = reason;
    cycle.exitStarted = now();
    clearTimers(cycle);
    cycle.exitDuration = immediate ? 0 : Math.max(0,Math.min(EXIT_MS,SAFETY_MS-(now()-cycle.started)));
    cycle.overlay.style.setProperty('--loader-exit-duration',`${cycle.exitDuration}ms`);
    cycle.overlay.classList.add('is-exiting');
    releasePage(cycle);
    if (!cycle.exitDuration) remove(cycle);
    else later(cycle,() => remove(cycle),cycle.exitDuration);
    return true;
  }
  function stage(cycle, name, title, detail, index) {
    if (active !== cycle || cycle.finishing) return;
    const overlay = cycle.overlay;
    overlay.classList.add(`is-${name}`); overlay.dataset.stage = name;
    overlay.querySelector('[data-loader-title]').textContent = title;
    overlay.querySelector('[data-loader-detail]').textContent = detail;
    overlay.querySelector('[data-loader-chapter]').textContent = `0${index} / 06`;
    overlay.querySelectorAll('[data-loader-step]').forEach((step,i) => step.classList.toggle('is-active',i<index));
  }
  function completeProgress(cycle) {
    paintProgress(cycle);
    cycle.overlay.classList.add('is-complete');
    cycle.overlay.querySelector('[data-loader-status]').textContent = cycle.ready === cycle.total
      ? 'Il sito è pronto. Benvenuto da Mr Smeet.' : 'Benvenuto da Mr Smeet. Entriamo nel sito.';
    cycle.overlay.querySelector('[data-loader-resource-label]').textContent = cycle.ready === cycle.total
      ? 'IL TUO TAVOLO È PRONTO' : 'BENVENUTO DA MR SMEET';
  }
  function assembleLogo(cycle) {
    if (active !== cycle || cycle.finishing || cycle.logoAssembling || !cycle.storyReady || cycle.settled < cycle.total) return;
    cycle.logoAssembling = true;
    paintProgress(cycle);
    if (isReduced()) { completeProgress(cycle); finish({immediate:true,reason:cycle.failed?'fallback':'complete'}); return; }
    // A failed logo leaves the intact original vector actor on screen instead
    // of replacing it with four broken raster images or another mascot.
    if (cycle.logoReady) stage(cycle,'logo','Piacere, Mr Smeet.','Il tuo prossimo morso ti aspetta.',6);
    later(cycle,() => {
      completeProgress(cycle);
      later(cycle,() => finish({reason:cycle.failed?'fallback':'complete'}),380);
    },900);
  }
  function markAsset(cycle, success, isLogo = false) {
    if (active !== cycle || cycle.closed || cycle.finishing) return;
    cycle.settled++;
    if (success) cycle.ready++; else cycle.failed++;
    if (isLogo) cycle.logoReady = success;
    paintProgress(cycle); assembleLogo(cycle);
  }
  function trackImage(cycle, image, isLogo = false) {
    let settled = false;
    const done = success => {
      if (settled) return;
      settled = true; markAsset(cycle,success,isLogo);
    };
    const loaded = () => {
      if (!image.naturalWidth) { done(false); return; }
      if (typeof image.decode !== 'function') { done(true); return; }
      try { Promise.resolve(image.decode()).then(() => done(true),() => done(false)); }
      catch { done(false); }
    };
    image.addEventListener('load',loaded,{signal:cycle.controller.signal});
    image.addEventListener('error',() => done(false),{signal:cycle.controller.signal});
    if (image.complete) loaded();
  }
  function trackFont(cycle, specification) {
    if (typeof doc.fonts?.load !== 'function') { markAsset(cycle,true); return; }
    try { Promise.resolve(doc.fonts.load(specification)).then(faces => markAsset(cycle,Boolean(faces?.length)),() => markAsset(cycle,false)); }
    catch { markAsset(cycle,false); }
  }
  function scheduleDeadline(cycle) {
    if (cycle.deadline !== null) { view.clearTimeout(cycle.deadline); cycle.timers.delete(cycle.deadline); }
    const budget = isReduced() ? REDUCED_SAFETY_MS : SAFETY_MS;
    cycle.deadline = later(cycle,() => finish({immediate:true,reason:'timeout'}),budget-(now()-cycle.started));
  }
  function start(replay = false) {
    if (disposed || active || !doc.body) return false;
    const overlay = doc.createElement('div');
    overlay.className = `smeet-loader${isReduced() ? ' has-reduced-motion' : ''}`;
    overlay.setAttribute('role','dialog'); overlay.setAttribute('aria-modal','true');
    overlay.setAttribute('aria-label','Il risveglio di Mr Smeet'); overlay.setAttribute('aria-busy','true');
    overlay.innerHTML = `
      <div class="smeet-loader__top"><img class="smeet-loader__wordmark" src="${assetBase}images/wordmark.png" width="900" height="600" alt="Mr Smeet — meetico smash burger" /><span class="smeet-loader__edition">UN NUOVO GIORNO. UN GRANDE MORSO.</span><button class="smeet-loader__skip" type="button" aria-label="Salta l’animazione e vai al sito">Entra subito <span aria-hidden="true">↗</span></button></div>
      <div class="smeet-loader__center"><div class="smeet-loader__film-label"><span>IL RISVEGLIO DI UN MITO</span><span data-loader-chapter>01 / 06</span></div>${scene}<div class="smeet-loader__copy"><h2 data-loader-title>Ancora cinque minuti.</h2><p data-loader-detail>Anche i miti hanno la sveglia.</p></div><div class="smeet-loader__chapters" aria-hidden="true">${Array.from({length:6},(_,i) => `<i data-loader-step class="${i===0?'is-active':''}"></i>`).join('')}</div></div>
      <div class="smeet-loader__bottom"><div class="smeet-loader__resource"><span data-loader-resource-label>SI PREPARA IL TUO PROSSIMO MORSO</span><div class="smeet-loader__progress" data-loader-progress role="progressbar" aria-label="Caricamento del sito" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div></div><div class="smeet-loader__percentage" aria-hidden="true"><span data-loader-number>00</span><span>%</span></div></div>
      <p class="smeet-loader__sr" data-loader-status role="status" aria-live="polite">Mr Smeet si prepara. Puoi saltare l’animazione in qualsiasi momento.</p>`;
    const images = new Map();
    for (const image of [...overlay.querySelectorAll('img'),...doc.querySelectorAll('img[fetchpriority="high"]')]) {
      if (image.getAttribute('loading')?.toLowerCase() === 'lazy' || !(image.currentSrc || image.getAttribute('src'))) continue;
      const url = new URL(image.currentSrc || image.src,doc.baseURI).href;
      if (!images.has(url)) images.set(url,image);
    }
    const cycle = {
      overlay, number:++sequence, replay, started:now(), controller:new Controller(), timers:new Set(),
      total:images.size+2, ready:0, failed:0, settled:0, logoReady:false, logoAssembling:false,
      storyReady:isReduced(), finishing:false, closed:false, released:false, deadline:null,
      previousFocus:doc.activeElement, inertBefore:new Map(),
      overflow:{value:doc.body.style.getPropertyValue('overflow'),priority:doc.body.style.getPropertyPriority('overflow')},
      bodyClasses:{loading:doc.body.classList.contains('smeet-is-loading'),entered:doc.body.classList.contains('smeet-has-entered')},
    };
    active = cycle;
    const makeInert = element => {
      if (element === overlay || cycle.inertBefore.has(element) || ['SCRIPT','STYLE','LINK','META'].includes(element.tagName)) return;
      cycle.inertBefore.set(element,element.getAttribute('inert')); element.setAttribute('inert','');
    };
    [...doc.body.children].forEach(makeInert);
    doc.body.append(overlay); doc.body.style.setProperty('overflow','hidden');
    doc.body.classList.add('smeet-is-loading'); doc.body.classList.remove('smeet-has-entered');
    cycle.observer = view.MutationObserver ? new view.MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1) makeInert(node);
    }) : null;
    cycle.observer?.observe(doc.body,{childList:true});
    const skip = overlay.querySelector('button');
    skip.addEventListener('click',() => finish({skipped:true,reason:'skip'}),{signal:cycle.controller.signal});
    doc.addEventListener('keydown',event => {
      if (active !== cycle || cycle.finishing) return;
      if (event.key === 'Escape') { event.preventDefault(); finish({skipped:true,reason:'skip'}); }
      else if (event.key === 'Tab') { event.preventDefault(); skip.focus({preventScroll:true}); }
    },{signal:cycle.controller.signal});
    doc.addEventListener('focusin',event => {
      if (active === cycle && !cycle.finishing && !overlay.contains(event.target)) skip.focus({preventScroll:true});
    },{signal:cycle.controller.signal});
    skip.focus({preventScroll:true}); paintProgress(cycle); scheduleDeadline(cycle);
    for (const image of images.values()) trackImage(cycle,image,image.classList.contains('logo-part'));
    trackFont(cycle,'700 24px "DynaPuff"'); trackFont(cycle,'700 12px "Instrument Sans"');
    if (isReduced()) return true;
    later(cycle,() => stage(cycle,'awake','Buongiorno, leggenda.','Piedi a terra. Fame alle stelle.',1),750);
    later(cycle,() => stage(cycle,'dressed','Il suo abito migliore.','Sopra il bun. Sotto il bun. Sempre in grande stile.',2),1800);
    later(cycle,() => stage(cycle,'monocle','Questione di sguardi.','Il dettaglio che fa il gentleman.',3),3000);
    later(cycle,() => stage(cycle,'hatted','Tanto di cappello.','Il tocco di classe è servito.',4),4100);
    later(cycle,() => stage(cycle,'groomed','Baffi fuori posto. Fatto.','Un po’ di carattere, prima di uscire.',5),5150);
    later(cycle,() => stage(cycle,'proud','Adesso sì, è lui.','Il gusto ha trovato il suo stile.',6),6100);
    later(cycle,() => {
      cycle.storyReady = true;
      if (cycle.settled < cycle.total) overlay.querySelector('[data-loader-detail]').textContent = 'Ancora un attimo: stiamo preparando la scena.';
      assembleLogo(cycle);
    },6750);
    return true;
  }
  function dispose() {
    if (disposed) return;
    disposed = true; lifecycle.abort();
    if (active) remove(active,false);
  }
  media?.addEventListener?.('change',() => {
    const cycle = active;
    if (!cycle) return;
    cycle.overlay.classList.toggle('has-reduced-motion',isReduced());
    if (!isReduced()) return;
    if (cycle.finishing) { finish({immediate:true,reason:cycle.reason}); return; }
    clearTimers(cycle); cycle.storyReady=true; cycle.logoAssembling=false;
    scheduleDeadline(cycle); assembleLogo(cycle);
  },{signal:lifecycle.signal});
  doc.addEventListener('visibilitychange',() => active?.overlay.classList.toggle('is-paused',doc.hidden),{signal:lifecycle.signal});
  view.addEventListener('pagehide',event => {
    if (event.persisted) finish({immediate:true,reason:'bfcache'});
    else dispose();
  },{signal:lifecycle.signal});
  view.addEventListener('pageshow',event => {
    if (event.persisted) finish({immediate:true,reason:'bfcache'});
  },{signal:lifecycle.signal});
  if (autoStart) start();
  return {id,start,replay:() => start(true),finish,dispose};
}
