/** Behavioral contracts for the actual below-the-fold cinematic controller.
 * DOM, video and browser observers are doubles; no media request or GPU exists.
 * Run: node scripts/check-atelier-cinema.mjs
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const raw = await readFile(new URL('../src/atelier-cinema.js', import.meta.url), 'utf8');
const delivery = await readFile(new URL('../src/film-delivery.js', import.meta.url), 'utf8');
const source = delivery.replaceAll('export function', 'function') + '\n' +
  raw.replace(/^import [^\n]+\n/, '').replace('export function installAtelierCinema', 'function installAtelierCinema');
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };

class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn, options = {}) {
    if (options.signal?.aborted) return;
    const item = { fn, once: options.once };
    const entries = this.listeners.get(type) || new Set();
    entries.add(item); this.listeners.set(type, entries);
    options.signal?.addEventListener('abort', () => entries.delete(item), { once: true });
  }
  removeEventListener(type, fn) {
    for (const item of this.listeners.get(type) || []) if (item.fn === fn) this.listeners.get(type).delete(item);
  }
  emit(type, fields = {}) {
    for (const item of [...this.listeners.get(type) || []]) {
      if (item.once) this.listeners.get(type).delete(item);
      item.fn({ type, target: this, ...fields });
    }
  }
  listenerCount() { return [...this.listeners.values()].reduce((sum, entries) => sum + entries.size, 0); }
}
class Node extends Events {
  constructor() {
    super(); this.attrs = new Map(); this.dataset = {}; this.hidden = true;
    this.style = { transform: '', setProperty(name, value) { this[name] = value; } };
    const classes = new Set(); this.classList = { contains: value => classes.has(value), add: value => classes.add(value), remove: value => classes.delete(value) };
  }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  setAttribute(name, value) { this.attrs.set(name, String(value)); }
}
function fixture({ reduced = false, saveData = false, portrait = false, entry = false, signal, playerCount = 1, decode = true } = {}) {
  const pref = new Events(); pref.matches = reduced;
  const connection = new Events(); connection.saveData = saveData;
  const orientation = new Events(); orientation.matches = portrait;
  const root = new Node(); if (entry) root.classList.add('entry-pending');
  const image = new Node();
  const photo = new Node(); photo.kind = 'photo'; photo.top = 200;
  photo.matches = () => false; photo.querySelector = selector => selector === 'img' ? image : null;
  photo.getBoundingClientRect = () => ({ top: photo.top, height: 400 });
  const web = new Node(); web.kind = 'web'; web.matches = () => true; web.querySelector = () => null;
  web.getBoundingClientRect = () => ({ top: 150, height: 450 });
  const shots = [photo, web];
  const media = Array.from({ length: playerCount }, (_, index) => {
    const stage = new Node();
    const posterImage = new Node();
    stage.matches = selector => selector.includes('.atelier-service-film');
    stage.querySelector = selector => selector === 'img' ? posterImage : null;
    stage.getBoundingClientRect = () => ({ top: 200, height: 400 });
    const button = new Node(), symbol = new Node(), label = new Node();
    button.querySelector = selector => selector === '[data-media-symbol]' ? symbol : label;
    const video = new Node(); video.id = `atelier-service-video-${index}`; video.closest = () => stage;
    video.dataset = { srcDesktop: './films/type-desktop.mp4', srcMobile: './films/type-mobile.mp4', posterDesktop: './images/type-desktop.jpg', posterMobile: './images/type-mobile.jpg', mediaLabel: `il film del servizio ${index + 1}` };
    let src = ''; Object.defineProperty(video, 'src', { get: () => src, set: value => { src = value; video.setAttribute('src', value); } });
    let poster = ''; video.posterAssignments = [];
    Object.defineProperty(video, 'poster', { get: () => poster, set: value => { poster = value; video.posterAssignments.push(value); video.setAttribute('poster', value); } });
    video.readyState = 0; video.currentTime = 0;
    video.paused = true; video.ended = false; video.muted = false; video.loads = 0; video.plays = 0; video.pauses = 0;
    video.mode = 'resolve'; let pendingResolve, pendingReject;
    video.load = () => { video.loads++; if (decode) video.readyState = 2; };
    video.pause = () => { video.pauses++; const changed = !video.paused; video.paused = true; if (changed) video.emit('pause'); };
    video.play = () => {
      video.plays++;
      if (video.mode === 'reject') { video.paused = true; const error = new Error('Autoplay refused'); error.name = 'NotAllowedError'; return Promise.reject(error); }
      if (video.mode === 'abort-once') { video.mode = 'resolve'; video.paused = true; const error = new Error('Play interrupted'); error.name = 'AbortError'; return Promise.reject(error); }
      video.paused = false; video.emit('play');
      if (video.mode === 'pending') return new Promise((resolve, reject) => { pendingResolve = resolve; pendingReject = reject; });
      return Promise.resolve();
    };
    return { stage, button, symbol, label, video, posterImage, resolvePlay: () => pendingResolve?.(),
      rejectPlay: () => { const error = new Error('Play interrupted by pause'); error.name = 'AbortError'; pendingReject?.(error); } };
  });
  shots.push(...media.map(item => item.stage));
  const { stage, button, symbol, label, video, resolvePlay } = media[0];
  const menu = new Events(); menu.open = false;
  const doc = new Events(); doc.hidden = false; doc.documentElement = root;
  doc.baseURI = 'https://example.test/space/atelier.html';
  doc.querySelectorAll = selector => selector === '[data-atelier-media]' ? media.map(item => item.video) : shots;
  doc.querySelector = selector => media.find(item => selector.includes(`"${item.video.id}"`))?.button;
  const win = new Events();
  const intersections = []; const mutations = [];
  let nextID = 1; const frames = new Map();
  class Intersection {
    constructor(callback, options = {}) { this.callback = callback; this.options = options; this.targets = new Set(); this.disconnected = false; intersections.push(this); }
    observe(target) { this.targets.add(target); }
    disconnect() { this.disconnected = true; this.targets.clear(); }
    fire(target, isIntersecting = true, intersectionRatio = 1) { if (!this.disconnected) this.callback([{ target, isIntersecting, intersectionRatio }]); }
  }
  class Mutation {
    constructor(callback) { this.callback = callback; this.disconnected = false; mutations.push(this); }
    observe(target, options) { this.target = target; this.options = options; }
    disconnect() { this.disconnected = true; }
    fire() { if (!this.disconnected) this.callback([]); }
  }
  const context = { document: doc, window: win, navigator: { connection }, matchMedia: query => query.includes('reduced-motion') ? pref : orientation,
    IntersectionObserver: Intersection, MutationObserver: Mutation, AbortController, URL, Promise, Set, Math, Number,
    innerWidth: 1280, innerHeight: 800,
    requestAnimationFrame: callback => { const id = nextID++; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id),
  };
  vm.runInNewContext(source, context);
  const api = context.installAtelierCinema({ signal, menu });
  const shotObserver = intersections[0], warmObserver = intersections[1], visibleObserver = intersections[2];
  const tick = () => { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(16)); };
  return { api, pref, connection, orientation, root, doc, win, menu, photo, web, image, stage, video, button, symbol, label,
    shotObserver, warmObserver, visibleObserver, intersections, mutations, tick, media, pendingFrames: () => frames.size,
    resolvePlay, flush,
    show: async () => { warmObserver.fire(stage); visibleObserver.fire(stage, true, .8); await flush(); },
  };
}
const groups = [];
async function test(name, work) { await work(); groups.push(name); console.log('PASS', name); }

await test('Initialization sets format and accessible controls without preparing offscreen native posters or videos', async () => {
  const f = fixture(); await f.flush();
  assert.equal(f.video.loads, 0); assert.equal(f.video.plays, 0);
  assert.equal(f.video.poster, ''); assert.deepEqual(f.video.posterAssignments, []);
  assert.equal(f.stage.dataset.mediaFormat, 'wide');
  assert.equal(f.video.muted, true); assert.equal(f.button.hidden, false);
  assert.equal(f.button.getAttribute('aria-pressed'), 'false');
  assert.equal(f.label.textContent, 'Riproduci');
  f.api.dispose();
});
await test('Reduced motion and SaveData avoid automatic download even inside warm and visible ranges', async () => {
  for (const options of [{ reduced: true }, { saveData: true }]) {
    const f = fixture(options); await f.show();
    assert.equal(f.video.loads, 0); assert.equal(f.video.plays, 0); assert.equal(f.video.paused, true);
    assert.equal(f.video.poster, 'https://example.test/space/images/type-desktop.jpg');
    f.api.dispose();
  }
});
await test('Warm range prepares once, while only the visible stage starts playback', async () => {
  const f = fixture(); f.warmObserver.fire(f.stage); await f.flush();
  assert.equal(f.video.loads, 1); assert.equal(f.video.plays, 0);
  assert.deepEqual(f.video.posterAssignments, ['https://example.test/space/images/type-desktop.jpg']);
  assert.equal(f.video.src, 'https://example.test/space/films/type-desktop.mp4');
  f.warmObserver.fire(f.stage); f.visibleObserver.fire(f.stage, true, .8); await f.flush();
  assert.equal(f.video.loads, 1); assert.equal(f.video.plays, 1); assert.equal(f.video.paused, false);
  assert.equal(f.button.getAttribute('aria-pressed'), 'true');
  f.visibleObserver.fire(f.stage, false, 0); await f.flush(); assert.equal(f.video.paused, true);
  f.api.dispose();
});
await test('Entry, open menu and hidden document block playback and pause a running stage', async () => {
  const f = fixture({ entry: true }); await f.show();
  assert.equal(f.video.loads, 0); assert.equal(f.video.paused, true);
  f.root.classList.remove('entry-pending'); f.mutations[0].fire(); await f.flush();
  assert.equal(f.video.paused, false);
  f.menu.open = true; f.menu.emit('toggle'); await f.flush(); assert.equal(f.video.paused, true);
  f.menu.open = false; f.menu.emit('toggle'); await f.flush(); assert.equal(f.video.paused, false);
  f.doc.hidden = true; f.doc.emit('visibilitychange'); await f.flush();
  assert.equal(f.video.paused, true); assert.equal(f.pendingFrames(), 0);
  f.doc.hidden = false; f.doc.emit('visibilitychange'); await f.flush(); assert.equal(f.video.paused, false);
  f.api.dispose();
});
await test('Explicit pause holds within a visit; a new viewport visit restarts playback', async () => {
  const f = fixture(); await f.show(); f.button.emit('click'); await f.flush();
  assert.equal(f.video.paused, true);
  f.visibleObserver.fire(f.stage, false, 0); f.visibleObserver.fire(f.stage, true, .9); await f.flush();
  assert.equal(f.video.paused, false);
  assert.equal(f.video.currentTime, 0);
  f.api.dispose();
});
await test('A pending play resolved after an explicit pause is stopped by the final permission check', async () => {
  const f = fixture(); f.video.mode = 'pending'; f.visibleObserver.fire(f.stage, true, .9);
  assert.equal(f.video.plays, 1); f.button.emit('click'); assert.equal(f.video.paused, true);
  f.resolvePlay(); await f.flush(); assert.equal(f.video.paused, true);
  assert.equal(f.button.getAttribute('aria-pressed'), 'false'); f.api.dispose();
});
await test('Autoplay refusal retains the poster and a usable manual control', async () => {
  const f = fixture(); f.video.mode = 'reject'; await f.show();
  assert.equal(f.video.paused, true); assert.match(f.video.poster, /type-desktop\.jpg$/);
  assert.equal(f.button.hidden, false); assert.equal(f.label.textContent, 'Riproduci');
  f.video.emit('error'); assert.equal(f.button.getAttribute('aria-pressed'), 'false');
  f.video.mode = 'resolve'; f.button.emit('click'); await f.flush(); assert.equal(f.video.paused, false);
  f.api.dispose();
});
await test('Manual playback can be requested from a static arrival; a live policy change revokes it', async () => {
  const f = fixture({ reduced: true }); await f.show(); f.button.emit('click'); await f.flush();
  assert.equal(f.video.loads, 1); assert.equal(f.video.paused, false);
  f.pref.emit('change'); await f.flush(); assert.equal(f.video.paused, true);
  f.api.dispose();
});
await test('Photographic motion is absolute, scroll events coalesce, and live static preferences reset transforms', async () => {
  const f = fixture(); f.shotObserver.fire(f.photo); f.shotObserver.fire(f.web); f.tick();
  const first = f.image.style.transform; assert.match(first, /scale\(1\.055\)/);
  f.photo.top = 100; for (let i = 0; i < 20; i++) f.win.emit('scroll');
  assert.equal(f.pendingFrames(), 1); f.tick(); assert.notEqual(f.image.style.transform, first); assert.equal(f.pendingFrames(), 0);
  f.pref.matches = true; f.pref.emit('change'); await f.flush();
  assert.equal(f.image.style.transform, ''); assert.equal(f.photo.style['--scene-progress'], '.5');
  f.tick(); assert.equal(f.image.style.transform, '');
  f.api.dispose();
});
await test('Wide screens on a measured 4 Mbit connection fetch only the visible compact film', async () => {
  const f = fixture();
  f.win.performance = { getEntriesByType: () => [{ name: 'https://example.test/models/studio-space-20261105.glb',
    transferSize: 635800, encodedBodySize: 635496, responseStart: 500, responseEnd: 1770 }] };
  f.video.dataset.srcCompact = './films/type-compact.mp4';
  f.warmObserver.fire(f.stage); await f.flush();
  assert.equal(f.video.loads, 0);
  await f.show();
  assert.match(f.video.src, /type-compact\.mp4$/);
  f.api.dispose();
});
await test('The same film chooses compact, HD and QHD for measured 4, 8 and 20 Mbit connections', async () => {
  for (const [mbps, expected] of [[4, 'compact'], [8, 'hd'], [20, 'desktop']]) {
    const f = fixture();
    f.win.performance = { getEntriesByType: () => [{ name: 'https://example.test/models/studio-space-20261105.glb',
      transferSize: 635796, encodedBodySize: 635496, responseStart: 200, responseEnd: 200 + 635496 * .008 / mbps }] };
    f.video.dataset.srcCompact = './films/type-compact.mp4';
    f.video.dataset.srcHd = './films/type-hd.mp4';
    await f.show(); assert.ok(f.video.src.endsWith('type-' + expected + '.mp4')); f.api.dispose();
  }
});
await test('A fast measured transfer wins over an outdated low downlink estimate', async () => {
  const f = fixture();
  f.connection.downlink = 1.7;
  f.win.performance = { getEntriesByType: () => [{ name: 'https://example.test/models/studio-space-20261105.glb',
    transferSize: 635796, encodedBodySize: 635496, responseStart: 300, responseEnd: 303.3 }] };
  f.video.dataset.srcCompact = './films/type-compact.mp4';
  await f.show();
  assert.match(f.video.src, /type-desktop\.mp4$/);
  f.api.dispose();
});
await test('Phone autoplay waits for a decoded frame while a manual tap retains its gesture', async () => {
  const auto = fixture({ portrait: true, decode: false });
  await auto.show();
  assert.equal(auto.video.autoplay, true);
  assert.equal(auto.video.plays, 0);
  auto.video.readyState = 2;
  auto.video.emit('loadeddata'); await auto.flush();
  assert.equal(auto.video.paused, false);
  auto.api.dispose();
  const manual = fixture({ portrait: true, saveData: true });
  await manual.show();
  manual.button.emit('click'); await manual.flush();
  assert.equal(manual.video.plays, 1);
  manual.api.dispose();
});
await test('Portrait choice selects portrait media initially and retains an already loaded source during rotation', async () => {
  const f = fixture({ portrait: true });
  assert.equal(f.video.poster, ''); assert.equal(f.stage.dataset.mediaFormat, 'portrait');
  await f.show(); assert.match(f.video.poster, /type-mobile\.jpg$/); assert.match(f.video.src, /type-mobile\.mp4$/);
  f.orientation.matches = false; f.orientation.emit('change'); await f.flush();
  assert.match(f.video.src, /type-mobile\.mp4$/); assert.equal(f.video.loads, 1);
  assert.match(f.video.poster, /type-mobile\.jpg$/); assert.equal(f.stage.dataset.mediaFormat, 'wide');
  f.api.dispose();
});
await test('BFCache suspension keeps observers available, resumes naturally, and preserves explicit pause', async () => {
  const f = fixture(); await f.show(); f.win.emit('pagehide', { persisted: true }); await f.flush();
  assert.equal(f.video.paused, true); assert.ok(f.intersections.every(o => !o.disconnected));
  f.win.emit('pageshow'); await f.flush(); assert.equal(f.video.paused, false);
  f.button.emit('click'); await f.flush(); f.win.emit('pagehide', { persisted: true }); f.win.emit('pageshow'); await f.flush();
  assert.equal(f.video.paused, true); f.api.dispose();
});
await test('Final disposal is idempotent, cancels queued work and disconnects listeners and observers', async () => {
  const controller = new AbortController(), f = fixture({ signal: controller.signal });
  await f.show(); f.shotObserver.fire(f.photo); assert.equal(f.pendingFrames(), 1);
  controller.abort(); assert.equal(f.video.paused, true); assert.equal(f.pendingFrames(), 0);
  assert.ok(f.intersections.every(o => o.disconnected)); assert.ok(f.mutations.every(o => o.disconnected));
  const count = f.video.plays; f.win.emit('pageshow'); f.menu.emit('toggle'); f.button.emit('click'); await f.flush();
  assert.equal(f.video.plays, count); assert.equal(f.win.listenerCount(), 0); assert.equal(f.doc.listenerCount(), 0); assert.equal(f.menu.listenerCount(), 0);
  f.api.dispose();
});
await test('A failed film retries once on a new visit and remains manually recoverable', async () => {
  const f = fixture({ playerCount: 5 });
  const target = f.media[2]; target.video.mode = 'reject';
  f.warmObserver.fire(target.stage); f.visibleObserver.fire(target.stage, true, .9); await f.flush();
  target.video.error = { code: 2 }; target.video.emit('error');
  f.visibleObserver.fire(target.stage, false, 0); f.visibleObserver.fire(target.stage, true, .9); await f.flush();
  assert.equal(target.video.loads, 2); assert.equal(target.video.paused, true);
  target.video.load = () => { target.video.loads++; target.video.error = null; target.video.mode = 'resolve'; };
  target.button.emit('click'); await f.flush();
  assert.equal(target.video.loads, 3); assert.equal(target.video.paused, false);
  assert.ok(f.media.filter(item => item !== target).every(item => item.video.loads === 0));
  f.api.dispose();
});
await test('Five service films keep independent controls and reset a pause on each new visit', async () => {
  const f = fixture({ playerCount: 5 });
  for (const [index, item] of f.media.entries()) {
    assert.equal(item.video.loads, 0);
    assert.equal(item.button.getAttribute('aria-label'), `Riproduci il film del servizio ${index + 1}`);
  }
  for (const [index, item] of f.media.entries()) {
    f.warmObserver.fire(item.stage); f.visibleObserver.fire(item.stage, true, .9); await f.flush();
    assert.equal(item.video.loads, 1); assert.equal(item.video.paused, false);
    assert.equal(item.button.getAttribute('aria-label'), `Metti in pausa il film del servizio ${index + 1}`);
    item.button.emit('click'); await f.flush();
    assert.equal(item.video.paused, true);
    f.visibleObserver.fire(item.stage, false, 0);
    f.visibleObserver.fire(item.stage, true, .9); await f.flush();
    assert.equal(item.video.paused, false);
    assert.equal(item.video.currentTime, 0);
    f.visibleObserver.fire(item.stage, false, 0);
  }
  f.media[2].button.emit('click'); f.visibleObserver.fire(f.media[2].stage, true, .9); await f.flush();
  assert.equal(f.media[2].video.paused, false);
  assert.ok(f.media.filter((_, index) => index !== 2).every(item => item.video.paused));
  f.menu.open = true; f.menu.emit('toggle'); await f.flush();
  assert.ok(f.media.every(item => item.video.paused));
  f.api.dispose();
});
await test('Five films in reduced motion defer all media until a specific manual request', async () => {
  const f = fixture({ reduced: true, playerCount: 5 });
  f.media.forEach(item => { f.warmObserver.fire(item.stage); f.visibleObserver.fire(item.stage, true, .9); });
  await f.flush(); assert.ok(f.media.every(item => item.video.loads === 0));
  f.media[3].button.emit('click'); await f.flush();
  assert.equal(f.media[3].video.loads, 1); assert.equal(f.media[3].video.paused, false);
  assert.ok(f.media.filter((_, index) => index !== 3).every(item => item.video.loads === 0));
  f.pref.emit('change'); await f.flush();
  assert.ok(f.media.every(item => item.video.paused));
  f.api.dispose();
});
await test('Overlapping service stages elect one foreground film and respect a direct playback request', async () => {
  const f = fixture({ playerCount: 5 }), [first, second] = f.media;
  f.visibleObserver.fire(first.stage, true, .8); f.visibleObserver.fire(second.stage, true, .3); await f.flush();
  assert.equal(first.video.paused, false); assert.equal(second.video.paused, true);
  f.visibleObserver.fire(second.stage, true, .95); await f.flush();
  assert.equal(first.video.paused, true); assert.equal(second.video.paused, false);
  first.button.emit('click'); await f.flush();
  assert.equal(first.video.paused, false); assert.equal(second.video.paused, true);
  f.visibleObserver.fire(first.stage, false, 0); await f.flush();
  assert.equal(first.video.paused, true); assert.equal(second.video.paused, false);
  assert.equal(f.media.filter(item => !item.video.paused).length, 1);
  f.api.dispose();
});
await test('A delayed playback promise cannot reclaim the foreground from a newer visible scene', async () => {
  const f = fixture({ playerCount: 5 }), [first, second] = f.media;
  first.video.mode = 'pending'; f.visibleObserver.fire(first.stage, true, .5);
  f.visibleObserver.fire(second.stage, true, 1); await f.flush();
  first.resolvePlay(); await f.flush();
  assert.equal(first.video.paused, true); assert.equal(second.video.paused, false);
  assert.equal(f.media.filter(item => !item.video.paused).length, 1);
  f.api.dispose();
});
await test('A pending play interrupted by a brief menu cycle resumes after its late AbortError', async () => {
  const f = fixture(); f.video.mode = 'pending';
  f.visibleObserver.fire(f.stage, true, .9);
  assert.equal(f.video.plays, 1);
  f.menu.open = true; f.menu.emit('toggle');
  f.menu.open = false; f.menu.emit('toggle');
  assert.equal(f.video.paused, true);
  f.video.mode = 'resolve'; f.media[0].rejectPlay(); await f.flush();
  assert.equal(f.video.paused, false); assert.equal(f.video.plays, 2);
  f.api.dispose();
});
await test('A readiness event resumes an eligible film after an interrupted load, without reloading', async () => {
  const f = fixture(); f.video.mode = 'abort-once'; await f.show();
  assert.equal(f.video.paused, true);
  f.video.emit('canplay'); await f.flush();
  assert.equal(f.video.paused, false); assert.equal(f.video.loads, 1);
  f.api.dispose();
});
await test('A policy refusal is not retried by readiness events; an explicit request remains usable', async () => {
  const f = fixture(); f.video.mode = 'reject'; await f.show();
  const calls = f.video.plays;
  f.video.emit('loadeddata'); f.video.emit('canplay'); await f.flush();
  assert.equal(f.video.plays, calls); assert.equal(f.video.autoplay, false);
  f.video.mode = 'resolve'; f.button.emit('click'); await f.flush();
  assert.equal(f.video.paused, false);
  f.api.dispose();
});
await test('Inline muted autoplay hints follow permission and never override static preferences', async () => {
  const f = fixture();
  assert.equal(f.video.defaultMuted, true); assert.equal(f.video.playsInline, true);
  await f.show(); assert.equal(f.video.autoplay, true);
  f.menu.open = true; f.menu.emit('toggle'); await f.flush(); assert.equal(f.video.autoplay, false);
  f.menu.open = false; f.menu.emit('toggle'); await f.flush(); assert.equal(f.video.autoplay, true);
  f.pref.matches = true; f.pref.emit('change'); await f.flush(); assert.equal(f.video.autoplay, false);
  f.button.emit('click'); await f.flush(); assert.equal(f.video.paused, false); assert.equal(f.video.autoplay, false);
  f.api.dispose();
});
await test('A native play event cannot start an offscreen film or bypass explicit pause', async () => {
  const f = fixture();
  await f.video.play(); assert.equal(f.video.paused, true);
  await f.show(); assert.equal(f.video.paused, false);
  f.button.emit('click'); await f.flush();
  await f.video.play(); assert.equal(f.video.paused, true);
  f.api.dispose();
});
await test('Phone warms just the selected poster; a rotation before playback picks the wide source', async () => {
  const f = fixture({ portrait: true, playerCount: 5 });
  f.api.refresh(); f.doc.emit('visibilitychange');
  f.media.forEach(item => { f.warmObserver.fire(item.stage, false, 0); f.visibleObserver.fire(item.stage, false, 0); });
  await f.flush();
  assert.ok(f.media.every(item => item.video.posterAssignments.length === 0 && item.video.loads === 0));
  const target = f.media[3];
  f.warmObserver.fire(target.stage); f.warmObserver.fire(target.stage); f.api.refresh(); await f.flush();
  assert.deepEqual(target.video.posterAssignments, ['https://example.test/space/images/type-mobile.jpg']);
  assert.ok(f.media.filter(item => item !== target).every(item => item.video.posterAssignments.length === 0));
  assert.equal(target.video.loads, 0);
  f.orientation.matches = false; f.orientation.emit('change'); await f.flush();
  assert.deepEqual(target.video.posterAssignments, ['https://example.test/space/images/type-mobile.jpg', 'https://example.test/space/images/type-desktop.jpg']);
  assert.match(target.video.src, /desktop\.mp4$/);
  assert.ok(f.media.filter(item => item !== target).every(item => item.video.posterAssignments.length === 0 && item.video.loads === 0));
  f.api.dispose();
});
await test('Static policies prepare only nearby posters; offscreen rotation waits until warming again', async () => {
  for (const options of [{ reduced: true }, { saveData: true }]) {
    const f = fixture({ ...options, portrait: true, playerCount: 5 });
    const target = f.media[2]; f.warmObserver.fire(target.stage); await f.flush();
    assert.match(target.video.poster, /type-mobile\.jpg$/);
    assert.ok(f.media.every(item => item.video.loads === 0 && item.video.plays === 0));
    f.warmObserver.fire(target.stage, false, 0);
    f.orientation.matches = false; f.orientation.emit('change'); await f.flush();
    assert.equal(target.video.posterAssignments.length, 1);
    assert.ok(f.media.filter(item => item !== target).every(item => item.video.posterAssignments.length === 0));
    f.warmObserver.fire(target.stage); await f.flush();
    assert.match(target.video.poster, /type-desktop\.jpg$/);
    assert.equal(target.video.posterAssignments.length, 2); assert.equal(target.video.loads, 0);
    f.api.dispose();
  }
});
await test('A manual cinema request prepares its poster before the control reads it, without downloading inline video', async () => {
  const f = fixture({ saveData: true });
  f.stage.emit('click', { target: { closest: selector => selector.includes('.atelier-cinema-open') ? {} : null } });
  assert.match(f.video.poster, /type-desktop\.jpg$/);
  assert.equal(f.video.loads, 0); assert.equal(f.video.plays, 0);
  f.api.dispose();
});
await test('Picture fallback yields only to a decoded frame, remains aligned on pause and returns on media error', async () => {
  const f = fixture({ decode: false }); await f.show();
  assert.notEqual(f.stage.dataset.mediaReady, 'true');
  f.video.readyState = 2; f.video.emit('loadeddata'); await f.flush();
  assert.equal(f.stage.dataset.mediaReady, 'true');
  f.button.emit('click'); await f.flush(); assert.equal(f.stage.dataset.mediaReady, 'true');
  f.video.error = { code: 2 }; f.video.emit('error');
  assert.equal(f.stage.dataset.mediaReady, 'false');
  f.video.emit('canplay'); await f.flush(); assert.equal(f.stage.dataset.mediaReady, 'false');
  f.video.error = null; f.video.readyState = 0; f.video.emit('emptied');
  assert.equal(f.stage.dataset.mediaReady, 'false');
  f.api.dispose();
});
await test('The historical photo parallax never transforms a film poster independently from its video', async () => {
  const f = fixture(); f.shotObserver.fire(f.stage); f.tick();
  assert.equal(f.media[0].posterImage.style.transform, '');
  f.shotObserver.fire(f.photo); f.tick(); assert.match(f.image.style.transform, /scale/);
  f.api.dispose();
});
await test('Cold desktop autoplay waits for decoded data and stays armed while loading', async () => {
  const f = fixture({ decode: false });
  await f.show();
  assert.equal(f.video.autoplay, true); assert.equal(f.video.plays, 0);
  f.video.readyState = 1; f.video.emit('loadedmetadata'); await f.flush();
  assert.equal(f.video.plays, 0);
  f.video.readyState = 2; f.video.emit('loadeddata'); await f.flush();
  assert.equal(f.video.paused, false); assert.equal(f.video.plays, 1);
  f.video.emit('canplay'); await f.flush(); assert.equal(f.video.plays, 1);
  f.api.dispose();
});
await test('Every genuine viewport return restarts at zero without reloading the film', async () => {
  const f = fixture(); await f.show();
  for (let i = 0; i < 3; i++) {
    f.video.currentTime = 4.5;
    f.visibleObserver.fire(f.stage, false, 0); await f.flush();
    assert.equal(f.video.paused, true);
    f.visibleObserver.fire(f.stage, true, .6); await f.flush();
    assert.equal(f.video.paused, false); assert.equal(f.video.currentTime, 0);
  }
  assert.equal(f.video.loads, 1); f.api.dispose();
});
await test('Small scroll adjustments preserve the shot and a fresh visit clears a prior pause', async () => {
  const f = fixture(); await f.show(); f.video.currentTime = 3.2;
  f.visibleObserver.fire(f.stage, true, .12); await f.flush();
  assert.equal(f.video.currentTime, 3.2); assert.equal(f.video.paused, false);
  f.button.emit('click'); await f.flush();
  f.menu.open = true; f.menu.emit('toggle'); f.menu.open = false; f.menu.emit('toggle'); await f.flush();
  assert.equal(f.video.paused, true);
  f.visibleObserver.fire(f.stage, true, .02);
  f.visibleObserver.fire(f.stage, true, .16); await f.flush();
  assert.equal(f.video.paused, false); assert.equal(f.video.currentTime, 0);
  f.api.dispose();
});
await test('The hovered film wins over the larger visible film and restarts on each pointer return', async () => {
  const f = fixture({ playerCount: 2 }), [a, b] = f.media;
  f.visibleObserver.fire(a.stage, true, .8); f.visibleObserver.fire(b.stage, true, .3); await f.flush();
  b.video.currentTime = 4;
  b.stage.emit('pointerenter', { pointerType: 'mouse' }); await f.flush();
  assert.equal(a.video.paused, true); assert.equal(b.video.paused, false); assert.equal(b.video.currentTime, 0);
  b.video.currentTime = 2.4;
  b.stage.emit('pointermove', { pointerType: 'mouse' }); await f.flush(); assert.equal(b.video.currentTime, 2.4);
  b.button.emit('click'); await f.flush(); assert.equal(b.video.paused, true);
  b.stage.emit('pointerleave'); b.stage.emit('pointerenter', { pointerType: 'mouse' }); await f.flush();
  assert.equal(b.video.paused, false); assert.equal(b.video.currentTime, 0);
  assert.equal(f.media.filter(item => !item.video.paused).length, 1);
  f.api.dispose();
});
await test('Touch entry and static preferences never manufacture a hover replay', async () => {
  const f = fixture(); await f.show(); f.video.currentTime = 3;
  f.stage.emit('pointerenter', { pointerType: 'touch' }); await f.flush();
  assert.equal(f.video.currentTime, 3); f.api.dispose();
  for (const opts of [{ reduced: true }, { saveData: true }]) {
    const s = fixture(opts); await s.show();
    s.stage.emit('pointerenter', { pointerType: 'mouse' });
    s.doc.emit('pointerdown', { isTrusted: true }); await s.flush();
    assert.equal(s.video.loads, 0); assert.equal(s.video.plays, 0); s.api.dispose();
  }
});
await test('A new visit and a trusted interaction each recover a previous autoplay refusal once', async () => {
  const f = fixture(); f.video.mode = 'reject'; await f.show(); const calls = f.video.plays;
  f.video.emit('canplay'); f.video.emit('loadeddata'); await f.flush(); assert.equal(f.video.plays, calls);
  f.video.mode = 'resolve'; f.visibleObserver.fire(f.stage, false, 0);
  f.visibleObserver.fire(f.stage, true, .6); await f.flush(); assert.equal(f.video.paused, false);
  f.api.dispose();
  const b = fixture(); b.video.mode = 'reject'; await b.show(); b.video.mode = 'resolve';
  b.doc.emit('pointerdown', { isTrusted: false }); await b.flush(); assert.equal(b.video.paused, true);
  b.doc.emit('pointerdown', { isTrusted: true }); await b.flush(); assert.equal(b.video.paused, false); b.api.dispose();
});
await test('Pointerdown on a blocked transport leaves one play action for its click handler', async () => {
  const f = fixture(); f.video.mode = 'reject'; await f.show(); f.video.mode = 'resolve';
  const attempts = f.video.plays;
  f.doc.emit('pointerdown', { isTrusted: true, target: { closest: () => f.button } });
  await f.flush(); assert.equal(f.video.plays, attempts);
  f.button.emit('click'); await f.flush();
  assert.equal(f.video.paused, false); assert.equal(f.video.plays, attempts + 1);
  f.api.dispose();
});
await test('A superseded play rejection cannot leave the next visit blocked', async () => {
  const f = fixture(); f.video.mode = 'pending'; await f.show();
  f.visibleObserver.fire(f.stage, false, 0); f.visibleObserver.fire(f.stage, true, .8);
  f.video.mode = 'resolve'; f.media[0].rejectPlay(); await f.flush();
  assert.equal(f.video.paused, false); assert.equal(f.video.currentTime, 0); f.api.dispose();
});
await test('Both HTML entries keep responsive lazy picture fallbacks, compact index thumbnails and controls outside the surface', async () => {
  const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
  for (const filename of ['index.html', 'atelier.html']) {
    const html = await readFile(new URL(`../${filename}`, import.meta.url), 'utf8');
    const films = [...html.matchAll(/<figure\b[^>]*data-service-film="([^"]+)"[^>]*>([\s\S]*?)<\/figure>/g)];
    assert.equal(films.length, 4, filename);
    assert.equal([...html.matchAll(/class="atelier-film-surface"/g)].length, 4, filename);
    for (const [, asset, body] of films) {
      const surface = body.match(/<div class="atelier-film-surface">([\s\S]*?)<\/div>/)?.[1];
      assert.ok(surface, `${filename}/${asset} surface`);
      assert.doesNotMatch(surface, /<figcaption|<button/);
      const video = attrs(surface.match(/<video\b[^>]+>/)[0]);
      const picture = surface.match(/<picture\b[^>]+>([\s\S]*?)<\/picture>/);
      assert.equal(attrs(picture[0])['aria-hidden'], 'true');
      const image = attrs(picture[1].match(/<img\b[^>]+>/)[0]);
      const source = attrs(picture[1].match(/<source\b[^>]+>/)[0]);
      assert.equal(video.poster, undefined); assert.equal(video.src, undefined); assert.equal(video.preload, 'none');
      assert.equal(image.src, video['data-poster-desktop'].replace(/^\./, ''));
      assert.equal(source.srcset, video['data-poster-mobile'].replace(/^\./, ''));
      assert.equal(source.media, '(max-width: 760px) and (orientation: portrait)');
      assert.equal(image.loading, 'lazy'); assert.equal(image.decoding, 'async'); assert.equal(image.fetchpriority, 'low'); assert.equal(image.alt, '');
      assert.match(body.slice(body.indexOf('</div>') + 6), /<figcaption/);
      assert.match(body.slice(body.indexOf('</div>') + 6), /data-media-toggle/);
      const thumb = html.match(new RegExp(`<img[^>]+src="/images/(?:director|elegant)-${asset}-thumb\\.webp"[^>]+>`));
      assert.ok(thumb, `${filename}/${asset} thumbnail`);
      const small = attrs(thumb[0]); assert.equal(small.width, '320'); assert.equal(small.height, '180'); assert.equal(small.fetchpriority, 'low');
      const bytes = await readFile(new URL(`../public${small.src}`, import.meta.url));
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF'); assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
    }
    const heroPoster = html.match(/<picture class="flagship-water-poster">([\s\S]*?)<\/picture>/)?.[1];
    assert.ok(heroPoster);
    assert.match(heroPoster, /srcset="\/images\/director-water-mobile\.webp"/);
    assert.match(heroPoster, /src="\/images\/director-water-desktop\.webp"/);
    const water = attrs(html.match(/<video id="atelier-film"[^>]+>/)[0]);
    assert.equal(water.preload, 'none'); assert.equal(water.src, undefined); assert.equal(water.poster, undefined);
    assert.match(html, /id="atelier-film-replay"[^>]+aria-controls="atelier-film"/);
  }
});
console.log(JSON.stringify({ groups: groups.length, source: 'actual src/atelier-cinema.js', browser: false, externalRequests: false }, null, 2));
