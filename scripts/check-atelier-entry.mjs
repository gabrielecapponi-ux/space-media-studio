import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const raw=await readFile(new URL('../src/atelier-entry.js', import.meta.url),'utf8');
const source=raw.replace(/^import .*;\n/,'').replaceAll('export function','function').replace("import('./studio-blender-room.js')","Promise.resolve({createStudioRoom: fakeCreateRoom})");
class Events{constructor(){this.listeners=new Map();}addEventListener(k,fn,opts={}){if(opts.signal?.aborted)return;const a=this.listeners.get(k)||new Set();const x={fn,once:opts.once};a.add(x);this.listeners.set(k,a);opts.signal?.addEventListener('abort',()=>a.delete(x),{once:true});}removeEventListener(k,fn){for(const x of this.listeners.get(k)||[])if(x.fn===fn)this.listeners.get(k).delete(x);}emit(k,extra={}){for(const x of [...this.listeners.get(k)||[]]){if(x.once)this.listeners.get(k).delete(x);x.fn({key:k,preventDefault(){},...extra});}}}
class Node extends Events{constructor(){super();this.style={overflow:''};this.dataset={};this.inert=false;this.isConnected=true;this.classList={set:new Set(),add:(...v)=>v.forEach(x=>this.classList.set.add(x)),remove:(...v)=>v.forEach(x=>this.classList.set.delete(x))};}focus(){this.focused=true;}remove(){this.isConnected=false;}}
const flush=async()=>{for(let i=0;i<30;i++)await Promise.resolve();};
function fixture({reduced=false,saveData=false,posterFail=false,fontStall=false,videoStall=false,startAt,signal}={}){
 let now=0,id=1,timers=new Map(),frames=new Map(),roomCount=0,roomDisposed=0;
 const html=new Node(),main=new Node(),doc=new Events();doc.documentElement=html;doc.body={children:[main]};doc.activeElement=doc.body;doc.baseURI='http://localhost/atelier.html';doc.hidden=false;doc.querySelector=()=>main;let resolveFonts;
 doc.fonts={load:()=>fontStall?new Promise(r=>{resolveFonts=r;}):Promise.resolve(),ready:Promise.resolve()};
 const pref=new Events();pref.matches=reduced;const conn=new Events();conn.saveData=saveData;
 const root=new Node(),sceneHost=new Node(),skip=new Node();let shellDisposed=0;const shell={root,sceneHost,skip,update(p,l){root.dataset.progress=p;},setState(s){root.dataset.state=s;},dispose(){shellDisposed++;root.remove();}};
 const video=new Events();video.readyState=videoStall?0:2;video.duration=11.5;video.buffered={length:1,end:()=>6};video.paused=true;video.networkState=2;video.dataset={};video.poster='poster.jpg';video.pause=()=>{video.paused=true;};video.play=()=>{video.paused=false;video.emit('play');};let time=0;video.seeking=false;Object.defineProperty(video,'currentTime',{get:()=>time,set:value=>{time=value;video.seeking=true;queueMicrotask(()=>{video.seeking=false;video.readyState=2;video.emit('seeked');});}});
 const c={document:doc,navigator:{connection:conn},matchMedia:()=>pref,AbortController,DOMException,URL,Promise,Number,Math,Set,Map,performance:{now:()=>now},console,createEntryShell:()=>{doc.body.children.push(root);return shell;},fakeCreateRoom:()=>{roomCount++;sceneHost.dataset.scene='ready';return {setProgress(p){sceneHost.dataset.progress=p;},setZoom(p){sceneHost.dataset.zoom=p;},dispose(){roomDisposed++;sceneHost.dataset.scene='fallback';}};},Image:class{decode(){return Promise.resolve();}set src(v){queueMicrotask(()=>posterFail?this.onerror?.():this.onload?.());}},MutationObserver:class{observe(){}disconnect(){}},requestAnimationFrame:fn=>{const n=id++;frames.set(n,fn);return n;},cancelAnimationFrame:n=>frames.delete(n),setTimeout:(fn,ms)=>{const n=id++;timers.set(n,{fn,at:now+ms});return n;},clearTimeout:n=>timers.delete(n)};
 vm.runInNewContext(source,c);const results=[],preparations=[];const api=c.createAtelierEntry({video,poster:'poster.jpg',startAt,signal,prepareVideo:()=>preparations.push({roomCount,scene:sceneHost.dataset.scene}),onComplete:r=>results.push(r)});
 async function advance(ms,step=16){for(let left=ms;left>0;left-=step){now+=Math.min(step,left);const due=[...timers].filter(([,t])=>t.at<=now);for(const [n,t]of due){timers.delete(n);t.fn();}const q=[...frames];frames.clear();q.forEach(([,fn])=>fn(now));await flush();}}
 return {api,results,preparations,html,main,doc,video,pref,conn,root,sceneHost,skip,advance,flush,counts:()=>({roomCount,roomDisposed,shellDisposed}),pendingFrames:()=>frames.size};
}
const names=[];async function test(name,fn){await fn();names.push(name);console.log('PASS',name);}
await test('The complete fall starts on decoded frame zero after assembly, zoom and cleanup',async()=>{const f=fixture();await f.flush();f.video.play();assert.equal(f.video.paused,true);await f.advance(6000);const r=await f.api.ready;assert.equal(r.status,'ready');assert.equal(r.videoPrepared,true);assert.equal(f.video.currentTime,0);assert.equal(f.sceneHost.dataset.zoom,1);assert.equal(f.main.inert,false);assert.equal(f.html.style.overflow,'');assert.equal(f.results.length,1);assert.equal(f.counts().roomDisposed,1);assert.equal(f.root.isConnected,false);});
await test('Skip is synchronous and prevents late room creation',async()=>{const f=fixture();f.skip.emit('click');assert.equal(f.main.inert,false);assert.equal(f.root.isConnected,false);assert.equal((await f.api.ready).status,'skipped');await f.flush();assert.equal(f.counts().roomCount,0);});
await test('Escape releases immediately',async()=>{const f=fixture();f.root.emit('keydown',{key:'Escape'});assert.equal((await f.api.ready).status,'skipped');assert.equal(f.main.inert,false);});
await test('Reduced motion completes without room allocation, video seeking or animation',async()=>{const f=fixture({reduced:true});await f.flush();await f.advance(16);assert.equal((await f.api.ready).status,'ready');assert.equal(f.counts().roomCount,0);assert.equal(f.video.currentTime,0);assert.equal(f.pendingFrames(),0);});
await test('SaveData uses the same static path',async()=>{const f=fixture({saveData:true});await f.flush();await f.advance(16);assert.equal((await f.api.ready).status,'ready');assert.equal(f.counts().roomCount,0);assert.equal(f.video.currentTime,0);});
await test('Explicit disposal restores page and suppresses playback callback',async()=>{const f=fixture();await f.flush();f.api.dispose();assert.equal((await f.api.ready).status,'disposed');assert.equal(f.results.length,0);assert.equal(f.main.inert,false);f.api.dispose();assert.equal(f.counts().roomDisposed,1);});
await test('Parent abort is identical to disposal',async()=>{const a=new AbortController(),f=fixture({signal:a.signal});await f.flush();a.abort();assert.equal((await f.api.ready).status,'disposed');assert.equal(f.results.length,0);});
await test('12second stalled media deadline releases controls in degraded mode',async()=>{const f=fixture({videoStall:true});await f.flush();await f.advance(12016);const r=await f.api.ready;assert.equal(r.status,'timeout');assert.equal(r.degraded,true);assert.equal(f.root.isConnected,false);assert.equal(f.main.inert,false);});
await test('Unavailable poster is degraded content rather than a blocked loading screen',async()=>{const f=fixture({posterFail:true});await f.flush();await f.advance(6000);const r=await f.api.ready;assert.equal(r.status,'ready');assert.equal(r.degraded,true);assert.ok(r.failures.includes('poster'));});
await test('Hidden document suspends animation and the visible-time deadline',async()=>{const f=fixture({videoStall:true});await f.flush();await f.advance(1000);f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.pendingFrames(),0);await f.advance(14000);assert.equal(f.results.length,0);assert.equal(f.main.inert,true);f.doc.hidden=false;f.doc.emit('visibilitychange');await f.advance(11016);assert.equal((await f.api.ready).status,'timeout');});
await test('A live reducedmotion change releases a stalled video and disposes the room',async()=>{const f=fixture({videoStall:true});await f.flush();await f.advance(500);f.pref.matches=true;f.pref.emit('change');await f.flush();await f.advance(16);assert.equal((await f.api.ready).status,'ready');assert.equal(f.main.inert,false);assert.equal(f.counts().roomDisposed,1);});
await test('Slow media does not freeze the architectural assembly; its completed pose waits for the film',async()=>{const f=fixture({videoStall:true});await f.flush();await f.advance(1900);const halfway=f.sceneHost.dataset.progress;assert.ok(halfway>.55);await f.advance(1600);assert.equal(f.sceneHost.dataset.progress,1);assert.equal(f.results.length,0);assert.equal(f.main.inert,true);f.video.readyState=1;f.video.emit('loadedmetadata');await f.flush();assert.equal(f.results.length,0);f.video.readyState=2;f.video.emit('loadeddata');await f.flush();await f.advance(2000);assert.equal(f.results.length,1,'A completed scene must not wait for a cosmetic percentage catch-up');assert.equal((await f.api.ready).status,'ready');assert.equal(f.main.inert,false);});
await test('Cold arrival prioritizes the room before the video request; static and skipped arrivals do not prepare media',async()=>{const f=fixture();assert.equal(f.preparations.length,0);await f.flush();assert.equal(f.preparations.length,1);assert.equal(f.preparations[0].roomCount,1);assert.equal(f.preparations[0].scene,'ready');f.api.dispose();for(const option of [{reduced:true},{saveData:true}]){const s=fixture(option);await s.flush();assert.equal(s.preparations.length,0);s.api.dispose();}const skipped=fixture();skipped.skip.emit('click');await skipped.flush();assert.equal(skipped.preparations.length,0);});


await test('Cached assets cannot finish the counter before studio construction; 100 remains readable before the zoom',async()=>{const f=fixture();await f.flush();await f.advance(2000);assert.ok(f.root.dataset.progress<100);assert.equal(f.root.isConnected,true);await f.advance(700);assert.equal(f.root.dataset.progress,100);assert.notEqual(f.root.dataset.state,'zoom');await f.advance(300);assert.notEqual(f.root.dataset.state,'zoom');await f.advance(200);assert.equal(f.root.dataset.state,'zoom');f.api.dispose();});

const mobileRaw = await readFile(new URL('../src/atelier-mobile-entry.js', import.meta.url), 'utf8');
const mobileSource = mobileRaw.replace(/^import .*;\n/, '').replaceAll('export function', 'function')
  .replace("import('./studio-blender-room.js')", 'loadRoomModule()');
function filmFixture({ profile = 'portrait', blocked = false, waterStall = false, reduced = false, saveData = false,
  parentSignal, moduleStall = false, modelStall = false, modelFail = false, roomStall = false, roomFail = false,
  frameCallback = false, autoPresent = true, freezeMedia = false, alreadyInert = false, priorFocus = false } = {}) {
  let now = 0, id = 0, prepared = 0, ended = false, roomCount = 0, roomDisposed = 0, shellCount = 0;
  let modelSignal, modelURL, resolveModule, resolveModel, roomDrawScreen, zoomCalls = 0;
  const frames = new Map(), videoFrames = new Map(), observers = new Set(), sourceHistory = [], posterHistory = [];
  const html = new Node(), main = new Node(), doc = new Events(), root = new Node(), sceneHost = new Node(), skip = new Node();
  const focusBefore = new Node(), preference = new Events(), connection = new Events();
  main.inert = alreadyInert; preference.matches = reduced; connection.saveData = saveData;
  doc.documentElement = html; doc.body = { children: [main] }; doc.activeElement = priorFocus ? focusBefore : doc.body;
  doc.querySelector = () => main; doc.hidden = false;
  const makeVideo = () => {
    const v = new Events(); let source = '';
    Object.assign(v, { dataset: {}, readyState: 0, currentTime: 0, duration: 4.8, seeking: false, paused: true,
      hidden: false, setAttribute() {}, removeAttribute(name) { if (name === 'src') source = ''; },
      load() { if (!source) { v.readyState = 0; v.currentTime = 0; } }, pause() { v.paused = true; },
      play() { if (blocked && v === video) return Promise.reject(new Error('Autoplay denied'));
        v.paused = false; v.emit('play'); v.emit('playing'); return Promise.resolve(); } });
    Object.defineProperty(v, 'src', { get: () => source, set: value => { source = value; if (v === video) sourceHistory.push(value); } });
    return v;
  };
  const video = makeVideo(), water = makeVideo(), poster = new Node(); let posterSource = '';
  poster.hidden = false; poster.setAttribute = () => {}; poster.removeAttribute = name => { if (name === 'src') posterSource = ''; };
  Object.defineProperty(poster, 'src', { get: () => posterSource, set: value => { posterSource = value; posterHistory.push(value); } });
  water.readyState = waterStall ? 0 : 2;
  let waterTime = 0;
  Object.defineProperty(water, 'currentTime', { get: () => waterTime, set: value => {
    waterTime = value; water.seeking = true; queueMicrotask(() => { water.seeking = false; water.emit('seeked'); });
  } });
  if (frameCallback) {
    video.requestVideoFrameCallback = fn => { const handle = ++id; videoFrames.set(handle, fn); return handle; };
    video.cancelVideoFrameCallback = handle => videoFrames.delete(handle);
  }
  const present = () => { const pending = [...videoFrames]; videoFrames.clear(); pending.forEach(([, fn]) => fn(now, { mediaTime: video.currentTime })); };
  const still = new Node(); still.setAttribute = () => {};
  still.draws = 0; still.getContext = () => ({ drawImage(source, x, y) { assert.equal(source, video); assert.equal(x, 0); assert.equal(y, 0); still.draws++; } });
  video.videoWidth = profile === 'portrait' ? 1080 : 2560; video.videoHeight = profile === 'portrait' ? 1920 : 1440;
  doc.createElement = tag => tag === 'img' ? poster : tag === 'canvas' ? still : video;
  sceneHost.append = (...nodes) => { sceneHost.children = nodes; };
  const shell = { root, sceneHost, skip, update(p) { root.dataset.progress = p; },
    setState(state) { root.dataset.state = state; }, dispose() { root.remove(); } };
  const createStudioRoom = (host, { modelBytes, drawScreen }) => {
    assert.equal(modelBytes.byteLength, 8); roomDrawScreen = drawScreen; roomCount++;
    host.dataset.scene = roomFail ? 'fallback' : roomStall ? 'loading' : 'ready'; host.dataset.source = 'blender-glb';
    return { setProgress(p) { host.dataset.progress = p; }, setZoom() { zoomCalls++; }, dispose() { roomDisposed++; } };
  };
  const moduleReady = moduleStall ? new Promise(resolve => { resolveModule = () => resolve({ createStudioRoom }); }) : Promise.resolve({ createStudioRoom });
  const modelReady = modelStall ? new Promise(resolve => { resolveModel = () => resolve(new ArrayBuffer(8)); }) : Promise.resolve(new ArrayBuffer(8));
  const c = { document: doc, navigator: { connection }, AbortController, Promise, Number, Math, Map, Set,
    loadRoomModule: () => moduleReady,
    fetch: (url, options) => { modelURL = url; modelSignal = options.signal; return Promise.resolve({ ok: !modelFail, arrayBuffer: () => modelReady }); },
    MutationObserver: class { constructor(fn) { this.fn = fn; } observe() { observers.add(this.fn); } disconnect() { observers.delete(this.fn); } },
    createEntryShell: () => { shellCount++; doc.body.children.push(root); return shell; },
    requestAnimationFrame: fn => { const handle = ++id; frames.set(handle, fn); return handle; }, cancelAnimationFrame: handle => frames.delete(handle) };
  vm.runInNewContext(mobileSource, c); const results = [], drawScreen = () => {};
  const api = c.createMobileStudio({ signal: parentSignal, video: water, base: '/', preference, profile, drawScreen,
    prepareWater: () => prepared++, onComplete: result => results.push(result) });
  async function advance(ms, step = 16) {
    for (let left = ms; left > 0; left -= step) {
      const delta = Math.min(step, left); now += delta;
      if (!doc.hidden && !video.paused && !ended) {
        if (!freezeMedia) video.currentTime = Math.min(video.duration, video.currentTime + delta / 1000);
        if (autoPresent) present();
        if (video.currentTime >= video.duration) { ended = true; video.paused = true; video.emit('ended'); }
      }
      const pending = [...frames]; frames.clear(); pending.forEach(([, fn]) => fn(now)); await flush();
    }
  }
  const loaded = () => { video.readyState = 2; video.emit('loadeddata'); };
  return { api, results, html, main, doc, root, sceneHost, skip, video, water, poster, still, preference, connection,
    advance, loaded, flush, present, drawScreen, focusBefore, sourceHistory, posterHistory,
    prepared: () => prepared, pendingFrames: () => frames.size, pendingVideoFrames: () => videoFrames.size,
    source: () => video.src, roomCounts: () => ({ roomCount, roomDisposed, zoomCalls, shellCount }),
    model: () => ({ url: modelURL, signal: modelSignal, drawScreen: roomDrawScreen }), resolveModule, resolveModel,
    roomReady: () => { sceneHost.dataset.scene = 'ready'; [...observers].forEach(fn => fn()); },
    loseContext: () => { sceneHost.dataset.source = 'procedural-fallback'; sceneHost.dataset.scene = 'loading'; [...observers].forEach(fn => fn()); },
    observers: () => observers.size };
}
await test('Every viewport gets its matching fixed cinematic film and poster without reloading on orientation changes', async () => {
  for (const profile of ['desktop', 'hd', 'portrait']) {
    const f = filmFixture({ profile });
    const filmURL = `/films/studio-cinema-20261112-${profile}.mp4`;
    const posterURL = `/images/studio-cinema-20261112-${profile === 'portrait' ? 'portrait' : 'desktop'}.webp`;
    assert.equal(f.source(), filmURL); assert.equal(f.video.poster, posterURL); assert.equal(f.poster.src, posterURL);
    assert.equal(f.root.dataset.studioProfile, profile); assert.equal(f.sceneHost.children[0], f.poster);
    f.loaded(); await f.flush(); await f.advance(800); const time = f.video.currentTime;
    f.doc.emit('orientationchange'); f.doc.emit('resize'); f.connection.emit('change');
    await f.advance(200); assert.deepEqual(f.sourceHistory, [filmURL]); assert.deepEqual(f.posterHistory, [posterURL]);
    assert.ok(f.video.currentTime > time); f.api.dispose();
  }
});
await test('The poster remains until a frame is presented and is restored while a fallback model loads', async () => {
  const f = filmFixture({ frameCallback: true, autoPresent: false, modelStall: true });
  assert.equal(f.poster.hidden, false); f.loaded(); await f.flush(); await f.advance(700);
  assert.equal(f.poster.hidden, false); assert.equal(f.root.dataset.studioFrame, 'false');
  f.present(); assert.equal(f.poster.hidden, true); assert.equal(f.root.dataset.studioFrame, 'true');
  f.video.emit('error'); await f.flush(); assert.equal(f.poster.hidden, false); assert.equal(f.video.hidden, true);
  assert.equal(f.root.dataset.studioFrame, 'false'); f.resolveModel(); await f.flush();
  assert.equal(f.poster.hidden, true); assert.equal(f.root.dataset.studioPlayback, 'blender-webgl'); f.api.dispose();
});
await test('The full4.8second studio film and decoded hero precede100, a readable hold and fade', async () => {
  const f = filmFixture({ profile: 'desktop' }); assert.equal(f.main.inert, true); assert.equal(f.html.style.overflow, 'hidden');
  f.loaded(); await f.flush(); await f.advance(4700); assert.equal(f.results.length, 0); assert.ok(f.root.dataset.progress < 100);
  f.water.play(); assert.equal(f.water.paused, true); await f.advance(200); assert.equal(f.root.dataset.progress, 100);
  assert.equal(f.video.hidden, true); assert.equal(f.still.draws, 1); assert.equal(f.still.width, 2560); assert.equal(f.still.height, 1440);
  assert.equal(f.root.isConnected, true); assert.equal(f.main.inert, true); assert.notEqual(f.root.dataset.state, 'exiting');
  await f.advance(200); assert.equal(f.root.isConnected, true); await f.advance(500);
  assert.equal((await f.api.ready).status, 'ready'); assert.equal(f.main.inert, false); assert.equal(f.html.style.overflow, '');
  assert.equal(f.still.width, 0); assert.equal(f.still.height, 0);
  assert.equal(f.prepared(), 1); assert.equal(f.source(), ''); assert.equal(f.roomCounts().roomCount, 0);
});
await test('100 waits for the decoded first hero frame even after construction ends', async () => {
  const f = filmFixture({ waterStall: true }); f.loaded(); await f.flush(); await f.advance(5500);
  assert.ok(f.root.dataset.progress < 100); assert.equal(f.results.length, 0); f.water.readyState = 2; f.water.emit('loadeddata');
  await f.advance(16); assert.equal(f.root.dataset.progress, 100); await f.advance(700); assert.equal((await f.api.ready).videoPrepared, true);
});
await test('A nonzero hero clock is rewound and decoded before handoff', async () => {
  const f = filmFixture(); f.water.currentTime = 2; f.loaded(); await f.flush(); assert.equal(f.water.currentTime, 0);
  await f.advance(5500); assert.equal((await f.api.ready).videoPrepared, true); assert.equal(f.water.dataset.entryPreparedAt, '0');
});
await test('Autoplay refusal builds the new Blackbox mesh, passes drawScreen and performs no extra zoom', async () => {
  const f = filmFixture({ blocked: true, profile: 'desktop' }); f.loaded(); await f.flush();
  assert.equal(f.root.dataset.studioPlayback, 'blender-webgl'); assert.equal(f.roomCounts().roomCount, 1);
  assert.equal(f.model().url, '/models/studio-blackbox-20261112.glb'); assert.equal(f.model().drawScreen, f.drawScreen);
  assert.equal(f.video.hidden, true); assert.equal(f.source(), ''); await f.advance(4700);
  assert.ok(f.root.dataset.progress < 100); assert.ok(f.sceneHost.dataset.progress > 0 && f.sceneHost.dataset.progress < 1);
  await f.advance(150); assert.equal(f.sceneHost.dataset.progress, 1); assert.equal(f.root.dataset.progress, 100);
  await f.advance(700); assert.equal((await f.api.ready).degraded, false); assert.equal(f.roomCounts().roomDisposed, 1);
  assert.equal(f.roomCounts().zoomCalls, 0); assert.equal(f.observers(), 0); assert.equal(f.main.inert, false);
});
await test('Media errors use the same real3D fallback before completion', async () => {
  const f = filmFixture(); f.video.emit('error'); await f.flush(); assert.equal(f.model().url, '/models/studio-blackbox-20261112.glb');
  assert.equal(f.roomCounts().roomCount, 1); await f.advance(5550); assert.equal((await f.api.ready).status, 'ready');
});
await test('A playing but stalled film switches to the new3D scene instead of faking progress', async () => {
  const f = filmFixture({ freezeMedia: true }); f.loaded(); await f.flush(); await f.advance(2100);
  assert.equal(f.roomCounts().roomCount, 1); assert.ok(f.root.dataset.progress < 100); assert.equal(f.main.inert, true);
  await f.advance(5550); assert.equal((await f.api.ready).status, 'ready');
});
await test('A decoded film that never presents a frame keeps its poster, then falls back', async () => {
  const f = filmFixture({ frameCallback: true, autoPresent: false }); f.loaded(); await f.flush(); await f.advance(1700);
  assert.equal(f.poster.hidden, false); assert.equal(f.roomCounts().roomCount, 0); await f.advance(200);
  assert.equal(f.roomCounts().roomCount, 1); assert.equal(f.pendingVideoFrames(), 0); f.api.dispose();
});
await test('Fallback construction waits for the loaded model and its complete final pose', async () => {
  const f = filmFixture({ blocked: true, roomStall: true }); f.loaded(); await f.flush(); await f.advance(3500);
  assert.equal(f.sceneHost.dataset.progress, 0); assert.ok(f.root.dataset.progress < 100); assert.equal(f.poster.hidden, false);
  f.roomReady(); await f.advance(4700); assert.ok(f.sceneHost.dataset.progress < 1); assert.ok(f.root.dataset.progress < 100);
  await f.advance(150); assert.equal(f.root.dataset.progress, 100); f.api.dispose(); assert.equal(f.observers(), 0);
});
await test('If both film and renderer/model fail the page opens degraded without claiming100', async () => {
  for (const option of [{ roomFail: true }, { modelFail: true }]) {
    const f = filmFixture({ blocked: true, ...option }); f.loaded(); await f.flush();
    const result = await f.api.ready; assert.equal(result.status, 'unavailable'); assert.equal(result.degraded, true);
    assert.notEqual(f.root.dataset.progress, 100); assert.equal(f.main.inert, false); assert.equal(f.pendingFrames(), 0);
    assert.equal(f.observers(), 0);
  }
});
await test('A failed hero releases after construction without claiming a decoded first frame or100', async () => {
  const f = filmFixture({ waterStall: true }); f.loaded(); await f.flush(); f.water.emit('error'); await f.advance(5000);
  const result = await f.api.ready; assert.equal(result.status, 'unavailable'); assert.equal(result.degraded, true);
  assert.equal(result.videoPrepared, false); assert.notEqual(f.root.dataset.progress, 100); assert.equal(f.main.inert, false);
});
await test('A lost WebGL context during construction cannot finish through a procedural substitute', async () => {
  const f = filmFixture({ blocked: true }); f.loaded(); await f.flush(); await f.advance(2000);
  assert.equal(f.root.dataset.studioPlayback, 'blender-webgl'); f.loseContext();
  const result = await f.api.ready; assert.equal(result.status, 'unavailable'); assert.equal(result.degraded, true);
  assert.notEqual(f.root.dataset.progress, 100); assert.equal(f.main.inert, false); assert.equal(f.observers(), 0);
  assert.equal(f.roomCounts().roomDisposed, 1); assert.equal(f.pendingFrames(), 0);
});
await test('Skip and Escape synchronously release isolation, pending frames and source resources', async () => {
  for (const action of ['skip', 'Escape']) {
    const f = filmFixture({ frameCallback: true, autoPresent: false }); f.loaded(); await f.flush();
    if (action === 'skip') f.skip.emit('click'); else f.root.emit('keydown', { key: 'Escape' });
    assert.equal((await f.api.ready).status, 'skipped'); assert.equal(f.main.inert, false); assert.equal(f.source(), '');
    assert.equal(f.pendingFrames(), 0); assert.equal(f.pendingVideoFrames(), 0); f.loaded(); f.present(); await f.advance(6000);
    assert.equal(f.results.length, 1);
  }
});
await test('Parent abort cancels deferred renderer/model work without late scene creation or callbacks', async () => {
  const abort = new AbortController(), f = filmFixture({ blocked: true, moduleStall: true, modelStall: true, parentSignal: abort.signal });
  f.loaded(); await f.flush(); assert.equal(f.roomCounts().roomCount, 0); abort.abort(); assert.equal(f.model().signal.aborted, true);
  f.resolveModule(); f.resolveModel(); await f.flush(); await f.advance(5000);
  assert.equal((await f.api.ready).status, 'disposed'); assert.equal(f.roomCounts().roomCount, 0); assert.equal(f.results.length, 0);
  assert.equal(f.main.inert, false); assert.equal(f.observers(), 0);
});
await test('An already-aborted parent allocates no shell, media request or animation', async () => {
  const abort = new AbortController(); abort.abort(); const f = filmFixture({ parentSignal: abort.signal });
  assert.equal((await f.api.ready).status, 'disposed'); assert.equal(f.roomCounts().shellCount, 0);
  assert.equal(f.sourceHistory.length, 0); assert.equal(f.posterHistory.length, 0); assert.equal(f.pendingFrames(), 0);
});
await test('Visibility pauses film, frame callbacks and visible-time deadline, then resumes the same source', async () => {
  const f = filmFixture({ frameCallback: true }); f.loaded(); await f.flush(); await f.advance(1000);
  const at = f.video.currentTime, source = f.source(); f.doc.hidden = true; f.doc.emit('visibilitychange'); await f.advance(18000);
  assert.equal(f.video.currentTime, at); assert.equal(f.results.length, 0); assert.equal(f.pendingFrames(), 0); assert.equal(f.pendingVideoFrames(), 0);
  f.doc.hidden = false; f.doc.emit('visibilitychange'); await f.flush(); assert.equal(f.source(), source);
  await f.advance(4600); assert.equal((await f.api.ready).status, 'ready'); assert.equal(f.sourceHistory.length, 1);
});
await test('A hidden fallback freezes its construction and resumes without recreating the mesh', async () => {
  const f = filmFixture({ blocked: true }); f.loaded(); await f.flush(); await f.advance(1000);
  const progress = f.sceneHost.dataset.progress; f.doc.hidden = true; f.doc.emit('visibilitychange'); await f.advance(18000);
  assert.equal(f.sceneHost.dataset.progress, progress); assert.equal(f.results.length, 0); f.doc.hidden = false; f.doc.emit('visibilitychange');
  await f.advance(4600); assert.equal((await f.api.ready).status, 'ready'); assert.equal(f.roomCounts().roomCount, 1);
});
await test('The visible-time deadline releases a stalled hero and disposes pending work', async () => {
  const f = filmFixture({ waterStall: true }); f.loaded(); await f.flush(); await f.advance(12016);
  assert.equal((await f.api.ready).status, 'timeout'); assert.equal(f.main.inert, false); assert.equal(f.root.isConnected, false);
  assert.equal(f.pendingFrames(), 0);
});
await test('A stalled studio load selects3D fallback after6seconds and still completes inside the deadline', async () => {
  const f = filmFixture(); await f.advance(5900); assert.equal(f.roomCounts().roomCount, 0); await f.advance(200);
  assert.equal(f.roomCounts().roomCount, 1); await f.advance(5550); assert.equal((await f.api.ready).status, 'ready');
});
await test('Static preferences request neither poster nor film; live preference changes restore access', async () => {
  for (const option of [{ reduced: true }, { saveData: true }]) {
    const f = filmFixture(option); assert.equal((await f.api.ready).status, 'ready'); assert.equal(f.sourceHistory.length, 0);
    assert.equal(f.posterHistory.length, 0); assert.equal(f.prepared(), 0); assert.equal(f.main.inert, false);
  }
  for (const kind of ['reduced', 'data']) {
    const f = filmFixture({ frameCallback: true }); f.loaded(); await f.flush();
    if (kind === 'reduced') { f.preference.matches = true; f.preference.emit('change'); }
    else { f.connection.saveData = true; f.connection.emit('change'); }
    assert.equal((await f.api.ready).status, 'ready'); assert.equal(f.main.inert, false);
    assert.equal(f.pendingFrames(), 0); assert.equal(f.pendingVideoFrames(), 0);
  }
});
await test('Focus and preexisting inert state are restored rather than overwritten', async () => {
  const f = filmFixture({ alreadyInert: true, priorFocus: true }); f.root.emit('keydown', { key: 'Tab' });
  assert.equal(f.skip.focused, true); f.api.dispose(); assert.equal(f.main.inert, true); assert.equal(f.focusBefore.focused, true);
  assert.equal(f.results.length, 0); assert.equal((await f.api.ready).status, 'disposed');
});
console.log(JSON.stringify({ groups: names.length, browser: false, remoteRequests: false }));
