/** Behavioral contracts for the actual below-the-fold cinematic controller.
 * DOM, video and browser observers are doubles; no media request or GPU exists.
 * Run: node scripts/check-atelier-cinema.mjs
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
const raw = await readFile(new URL('../src/atelier-cinema.js', import.meta.url), 'utf8');
const source = raw.replace('export function installAtelierCinema', 'function installAtelierCinema');
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
function fixture({ reduced = false, saveData = false, portrait = false, entry = false, signal, playerCount = 1 } = {}) {
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
    const button = new Node(), symbol = new Node(), label = new Node();
    button.querySelector = selector => selector === '[data-media-symbol]' ? symbol : label;
    const video = new Node(); video.id = `atelier-service-video-${index}`; video.closest = () => stage;
    video.dataset = { srcDesktop: './films/type-desktop.mp4', srcMobile: './films/type-mobile.mp4', posterDesktop: './images/type-desktop.jpg', posterMobile: './images/type-mobile.jpg', mediaLabel: `il film del servizio ${index + 1}` };
    let src = ''; Object.defineProperty(video, 'src', { get: () => src, set: value => { src = value; video.setAttribute('src', value); } });
    video.paused = true; video.ended = false; video.muted = false; video.loads = 0; video.plays = 0; video.pauses = 0;
    video.mode = 'resolve'; let pendingResolve;
    video.load = () => { video.loads++; };
    video.pause = () => { video.pauses++; const changed = !video.paused; video.paused = true; if (changed) video.emit('pause'); };
    video.play = () => {
      video.plays++;
      if (video.mode === 'reject') { video.paused = true; return Promise.reject(new Error('Autoplay refused')); }
      video.paused = false; video.emit('play');
      if (video.mode === 'pending') return new Promise(resolve => { pendingResolve = resolve; });
      return Promise.resolve();
    };
    return { stage, button, symbol, label, video, resolvePlay: () => pendingResolve?.() };
  });
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

await test('Initialization chooses an accessible poster/control without loading an offscreen video', async () => {
  const f = fixture(); await f.flush();
  assert.equal(f.video.loads, 0); assert.equal(f.video.plays, 0);
  assert.equal(f.video.poster, 'https://example.test/space/images/type-desktop.jpg');
  assert.equal(f.video.muted, true); assert.equal(f.button.hidden, false);
  assert.equal(f.button.getAttribute('aria-pressed'), 'false');
  assert.equal(f.label.textContent, 'Riproduci');
  f.api.dispose();
});
await test('Reduced motion and SaveData avoid automatic download even inside warm and visible ranges', async () => {
  for (const options of [{ reduced: true }, { saveData: true }]) {
    const f = fixture(options); await f.show();
    assert.equal(f.video.loads, 0); assert.equal(f.video.plays, 0); assert.equal(f.video.paused, true);
    f.api.dispose();
  }
});
await test('Warm range prepares once, while only the visible stage starts playback', async () => {
  const f = fixture(); f.warmObserver.fire(f.stage); await f.flush();
  assert.equal(f.video.loads, 1); assert.equal(f.video.plays, 0);
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
await test('Explicit pause survives visibility cycles and explicit play resumes it', async () => {
  const f = fixture(); await f.show(); f.button.emit('click'); await f.flush();
  assert.equal(f.video.paused, true);
  f.visibleObserver.fire(f.stage, false, 0); f.visibleObserver.fire(f.stage, true, .9); await f.flush();
  assert.equal(f.video.paused, true);
  f.button.emit('click'); await f.flush(); assert.equal(f.video.paused, false);
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
await test('Portrait choice selects portrait media initially and retains an already loaded source during rotation', async () => {
  const f = fixture({ portrait: true });
  assert.match(f.video.poster, /type-mobile\.jpg$/); await f.show(); assert.match(f.video.src, /type-mobile\.mp4$/);
  f.orientation.matches = false; f.orientation.emit('change'); await f.flush();
  assert.match(f.video.src, /type-mobile\.mp4$/); assert.equal(f.video.loads, 1);
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
await test('A failed film reloads only when its own control is explicitly retried', async () => {
  const f = fixture({ playerCount: 5 });
  const target = f.media[2]; target.video.mode = 'reject';
  f.warmObserver.fire(target.stage); f.visibleObserver.fire(target.stage, true, .9); await f.flush();
  target.video.error = { code: 2 }; target.video.emit('error');
  f.visibleObserver.fire(target.stage, false, 0); f.visibleObserver.fire(target.stage, true, .9); await f.flush();
  assert.equal(target.video.loads, 1); assert.equal(target.video.paused, true);
  target.video.load = () => { target.video.loads++; target.video.error = null; target.video.mode = 'resolve'; };
  target.button.emit('click'); await f.flush();
  assert.equal(target.video.loads, 2); assert.equal(target.video.paused, false);
  assert.ok(f.media.filter(item => item !== target).every(item => item.video.loads === 0));
  f.api.dispose();
});
await test('Five service films keep their own labels, source preparation and explicit pause state', async () => {
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
    assert.equal(item.video.paused, true);
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
console.log(JSON.stringify({ groups: groups.length, source: 'actual src/atelier-cinema.js', browser: false, externalRequests: false }, null, 2));
