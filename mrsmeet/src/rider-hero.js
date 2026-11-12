import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {motionViewport, motionExposure} from './motion-viewport.js';
import {selectFoodVideo} from './food-media-source.js';

gsap.registerPlugin(ScrollTrigger);

// A single pending seek follows the latest scroll position. Never queue every
// wheel/touch event, play the film behind the scroll, or intercept native input.
export function mountRiderHero({root, reducedMotion} = {}) {
  if (!root) return {setPaused(){}, dispose(){}};
  const doc = root.ownerDocument, win = doc.defaultView;
  const scene = root.querySelector('.rider-hero-scene');
  const control = root.querySelector('[data-hero-watch]');
  const caption = root.querySelector('[data-hero-caption]');
  const meter = root.querySelector('[data-hero-progress]');
  const pref = reducedMotion || win.matchMedia('(prefers-reduced-motion: reduce)');
  const compact = win.matchMedia('(max-height: 640px), (min-width: 441px) and (max-width: 760px) and (max-height: 720px)');
  const connection = win.navigator.connection || win.navigator.webkitConnection;
  const life = new win.AbortController(), signal = life.signal;
  const state = {progress:0};
  let video, mediaLife, tween, disposed = false, paused = false, manual = false, manualHold = false, failed = false;
  let playVersion = 0, presentedTime = 0, claimed = false;
  let seekTimer = 0, failedOutsideView = false;
  let target = 0, near = false, inView = false, seekingAt = 0, lastFrame = -1;
  let raf = 0, watchdog = 0, refreshFrame = 0, manualScrollY = 0;
  let locateQueued = false, seekQueued = false;
  const staticMode = () => pref.matches || Boolean(connection?.saveData);
  const blocked = () => disposed || paused || staticMode() || doc.hidden || Boolean(doc.querySelector('dialog[open]'));
  const listen = (node,event,fn,options={}) => node?.addEventListener?.(event,fn,{...options,signal});
  const headerHeight = () => doc.querySelector('[data-persistent-header]')?.getBoundingClientRect().height || 0;
  function render() {
    const p = video?.duration && scene.classList.contains('has-hero-video') ? presentedTime/video.duration : 0;
    const progress = `scaleX(${Math.max(0,Math.min(1,p))})`;
    const text = p < .31 ? 'Il tuo prossimo morso, preparato con cura.' : p < .71 ? 'Tutto nel sacchetto. Pronti a partire.' : 'Il gusto prende la sua strada.';
    if (meter && meter.style.transform !== progress) meter.style.transform = progress;
    if (caption && caption.textContent !== text) caption.textContent = text;
    if (control) {
      const hidden = staticMode(), label = manual ? 'Ⅱ Pausa la scena' : failed ? '▷ Riprova la scena' : '▷ Guarda la scena';
      if (control.hidden !== hidden) control.hidden = hidden;
      if (control.textContent !== label) control.textContent = label;
      if (control.getAttribute('aria-pressed') !== String(manual)) control.setAttribute('aria-pressed',String(manual));
    }
  }
  function reveal() {
    if (!video || blocked() || !inView || video.readyState < 2 || video.seeking) return;
    const desired = Math.floor(target * Math.max(0,video.duration-1/24)*24)/24;
    if (!manual && Math.abs(video.currentTime-desired) > 1/24) return;
    presentedTime=video.currentTime;
    if (!scene.classList.contains('has-hero-video')) scene.classList.add('has-hero-video');
    render();
  }
  function clearSeekDeadline() {
    win.clearTimeout(seekTimer); seekTimer=0; seekingAt=0;
  }
  function watchSeek(v = video) {
    if (!v || seekTimer) return;
    seekingAt=win.performance.now();
    seekTimer=win.setTimeout(()=> {
      seekTimer=0;
      if (disposed || video!==v) return;
      if (blocked() || !near) {seekingAt=0;return;}
      if (v.seeking) {
        // Abort this one stalled range request. Keep the matching HTML poster
        // and wait for a deliberate retry or a new visible visit.
        const outside=!inView;
        release();failed=true;failedOutsideView=outside;render();
      } else {seekingAt=0;lastFrame=-1;queueSeek();}
    },15000);
  }
  function seek() {
    if (!video || blocked() || manual || manualHold || !near || video.readyState < 1 || !Number.isFinite(video.duration)) return;
    const frame = Math.min(Math.floor(target * (video.duration-1/24)*24), Math.floor(video.duration*24)-1);
    // One outstanding seek, with latest-wins coalescing and native range fetch.
    if (video.seeking) return;
    if (Math.abs(video.currentTime-frame/24) < 1/48) {reveal(); return;}
    lastFrame = frame; watchSeek();
    try {video.currentTime = frame/24;} catch {clearSeekDeadline();lastFrame = -1;}
  }
  function queueFrame() {
    if (raf || disposed) return;
    raf = win.requestAnimationFrame(()=> {
      // ScrollTrigger and native scroll share one geometry pass. Seek only
      // after that pass, in the same frame, so visibility and target agree.
      if (locateQueued) locate();
      if (seekQueued) {seekQueued=false;seek();}
      raf=0;
      if (locateQueued || seekQueued) queueFrame();
    });
  }
  function queueSeek() {seekQueued=true;queueFrame();}
  function queueLocate() {locateQueued=true;queueFrame();}
  function prepare() {
    if (video || failed || !near || blocked()) return;
    const v = doc.createElement('video'); video = v;
    mediaLife = new win.AbortController();
    const on = (event,fn) => v.addEventListener(event,fn,{signal:mediaLife.signal});
    v.className = 'hero-scroll-video'; v.preload = 'auto';
    v.muted = v.defaultMuted = v.playsInline = true;
    v.setAttribute('muted',''); v.setAttribute('playsinline',''); v.setAttribute('aria-hidden','true');
    v.tabIndex = -1; v.disablePictureInPicture = true;
    v.poster = scene.querySelector('img').currentSrc || scene.querySelector('img').src;
    const mobile = new URL('./films/bag-rider/scroll-v2-mobile.mp4',doc.baseURI).href;
    const desktop = new URL('./films/bag-rider/scroll-v2-1080.mp4',doc.baseURI).href;
    const width = scene.getBoundingClientRect().width;
    v.src = width >= 840 && !connection ? desktop : selectFoodVideo({video:mobile,videoRetina:desktop},win,width);
    on('loadedmetadata',queueSeek);
    on('loadeddata',()=>{reveal();queueSeek();});
    on('seeked',()=>{clearSeekDeadline();reveal();render();queueSeek();});
    on('progress',queueSeek);
    on('canplay',queueSeek);
    on('playing',()=>{if (blocked() || !manual || !inView) v.pause();else reveal();});
    on('timeupdate',()=>{if(manual && !v.seeking){presentedTime=v.currentTime;render();}});
    on('ended',()=>{manual=false;manualHold=true;presentedTime=v.currentTime;render();});
    on('error',()=>{clearSeekDeadline();playVersion++;manual=false;manualHold=false;failed=true;failedOutsideView=!inView;scene.classList.remove('has-hero-video');render();});
    scene.append(v); v.load();
    // A browser may suspend after a range request without emitting seeked.
    // Check only while the hero is near; never launch overlapping seeks.
    watchdog = win.setInterval(()=> {
      if (!blocked() && near && video === v && !v.seeking && seekingAt && win.performance.now()-seekingAt > 1500) {clearSeekDeadline();lastFrame=-1;queueSeek();}
    },1500);
  }
  function release() {
    clearSeekDeadline();
    playVersion++;claimed=false;manual=false;manualHold=false;failed=false;failedOutsideView=false;presentedTime=0;mediaLife?.abort();mediaLife=null;
    win.clearInterval(watchdog);watchdog=0;
    if(video){video.pause();video.removeAttribute('src');video.load();video.remove();video=null;}
    scene.classList.remove('has-hero-video');lastFrame=-1;seekingAt=0;
  }
  function locate() {
    locateQueued=false;
    const b=root.getBoundingClientRect(), s=scene.getBoundingClientRect();
    near=b.bottom>0 && b.top<win.innerHeight+200;
    inView=motionExposure(s,motionViewport(doc,win)) >= .3;
    if (!near || staticMode()) {release();render();return;}
    if (blocked()) {clearSeekDeadline();playVersion++;video?.pause();manualHold=manual||manualHold;manual=false;render();return;}
    if (failed && !inView) failedOutsideView=true;
    else if (failed && failedOutsideView) release();
    prepare();
    if (video?.seeking && !failed) watchSeek();
    if (!inView && manual) {playVersion++;manual=false;video?.pause();}
    if (inView && !claimed && video) {claimed=true;doc.dispatchEvent(new win.CustomEvent('smeet:food-claim',{detail:video}));}
    if (!inView) claimed=false;
    queueSeek();render();
  }
  function update() {
    target=state.progress;
    if (!manual) queueSeek();
  }
  function setup() {
    tween?.scrollTrigger?.kill();tween?.kill();tween=null;
    root.classList.toggle('is-scroll-ready',!staticMode() && !compact.matches);
    if (staticMode()) {release();render();return;}
    state.progress=0;target=0;
    if(compact.matches){locate();return;}
    tween=gsap.to(state,{progress:1,ease:'none',onUpdate:update,scrollTrigger:{
      trigger:root,start:()=>`top ${headerHeight()}`,
      end:()=>`+=${Math.max(1,root.offsetHeight-root.querySelector('.rider-hero-stage').offsetHeight)}`,
      scrub:.4,invalidateOnRefresh:true,onUpdate:queueLocate,onRefresh:locate,
    }});
    locate();
  }
  listen(control,'click',()=> {
    if (blocked()) return;
    if (manual) {playVersion++;manual=false;manualHold=true;video?.pause();render();return;}
    if(failed)release();
    prepare();if(!video)return;
    manual=true;manualHold=false;manualScrollY=win.scrollY;video.currentTime=0;
    if(video.seeking)watchSeek();
    const v=video, attempt=++playVersion;
    doc.dispatchEvent(new win.CustomEvent('smeet:food-claim',{detail:video}));
    const reject=()=>{if(!disposed && video===v && attempt===playVersion){manual=false;render();}};
    try {Promise.resolve(v.play()).then(()=>{if(video!==v || blocked() || !manual)v.pause();}).catch(reject);} catch {reject();}
    render();
  });
  listen(win,'scroll',()=> {
    if ((manual || manualHold) && Math.abs(win.scrollY-manualScrollY)>12) {playVersion++;manual=false;manualHold=false;video?.pause();lastFrame=-1;render();}
    queueLocate();
  },{passive:true});
  listen(doc,'visibilitychange',locate);
  listen(pref,'change',setup);listen(compact,'change',setup);listen(connection,'change',setup);
  listen(win,'pageshow',()=>{ScrollTrigger.refresh();locate();});
  listen(win,'pagehide',()=>{playVersion++;video?.pause();manual=false;});
  listen(win,'smeet:header-resize',()=> {
    if(!refreshFrame)refreshFrame=win.requestAnimationFrame(()=>{refreshFrame=0;ScrollTrigger.refresh();});
  });
  const dialogs=new win.MutationObserver(locate);
  doc.querySelectorAll('dialog').forEach(d=>dialogs.observe(d,{attributes:true,attributeFilter:['open']}));
  setup();
  return {
    setPaused(value){paused=Boolean(value);locate();},
    dispose(){disposed=true;life.abort();dialogs.disconnect();tween?.scrollTrigger?.kill();tween?.kill();win.cancelAnimationFrame(raf);win.cancelAnimationFrame(refreshFrame);release();root.classList.remove('is-scroll-ready');},
  };
}
