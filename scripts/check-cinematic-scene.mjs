/** Real room controller + real Three geometry, with renderer/network/DOM doubles.
 * No browser, GPU context, remote request or claim of measured frame rate.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as RealThree from 'three';
import { buildCinematicExhibits } from '../src/scene-objects.js';

const rootURL = new URL('../', import.meta.url);
const source = await readFile(new URL('src/launch-room.js', rootURL), 'utf8');
const flush = async () => { for (let n = 0; n < 12; n++) await Promise.resolve(); };
const groups = [];

class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn, options = {}) {
    if (options.signal?.aborted) return;
    const item = { fn, once: options.once };
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    const entries = this.listeners.get(type); entries.add(item);
    options.signal?.addEventListener('abort', () => entries.delete(item), { once: true });
  }
  removeEventListener(type, fn) { for (const item of this.listeners.get(type) || []) if (item.fn === fn) this.listeners.get(type).delete(item); }
  emit(type, fields = {}) {
    const event = { type, target: this, prevented: false, preventDefault() { this.prevented = true; }, ...fields };
    for (const item of [...(this.listeners.get(type) || [])]) { if (item.once) this.listeners.get(type).delete(item); item.fn(event); }
    return event;
  }
}
class Classes {
  constructor() { this.values = new Set(); }
  contains(key) { return this.values.has(key); }
  remove(key) { this.values.delete(key); }
  toggle(key, value) { if (value) this.values.add(key); else this.values.delete(key); }
}
class Element extends Events {
  constructor() { super(); this.dataset = {}; this.style = {}; this.classList = new Classes(); this.children = []; this.removed = false; }
  append(item) { this.children.push(item); }
  remove() { this.removed = true; }
  setAttribute(name, value) { if (name === 'data-launch-state') this.dataset.launchState = value; else this[name] = value; }
}
class Canvas extends Element {
  constructor() {
    super(); this.width = 0; this.height = 0;
    this.context = { fillStyle: '#000', font: '16px sans-serif', textAlign: 'left' };
    for (const method of ['fillRect', 'beginPath', 'arc', 'fill', 'fillText', 'drawImage']) this.context[method] = () => {};
  }
  getContext(type) { assert.equal(type, '2d'); return this.context; }
}

function createHarness(options = {}) {
  const width = options.width || 1200, height = options.height || 728;
  const slotHeight = width <= 900 ? Math.max(width * .75, width <= 370 ? 225 : 245) : 360;
  const slotTop = 300;
  const chapterHeight = Math.max(height, slotTop + slotHeight + 340);
  let time = 0, scroll = options.scroll || 0, nextRaf = 0, resolveTexture;
  const raf = new Map(), renderers = [], requests = [], loadedTextures = [], environments = [], errors = [], observers = [];
  const resources = new Map();
  let readyCalls = 0;
  const watch = resource => {
    if (!resource || resources.has(resource)) return;
    resources.set(resource, 0);
    resource.addEventListener('dispose', () => resources.set(resource, resources.get(resource) + 1));
  };
  const html = new Element(), mount = new Element();
  mount.getBoundingClientRect = () => ({ width, height, top: 0, bottom: height });
  const sections = Array.from({ length: options.sectionCount ?? 4 }, (_, index) => {
    const section = new Element();
    section.getBoundingClientRect = () => ({ top: index * chapterHeight - scroll, bottom: (index + 1) * chapterHeight - scroll, width, height: chapterHeight });
    const slot = new Element();
    slot.getBoundingClientRect = () => ({ top: index * chapterHeight + slotTop - scroll, bottom: index * chapterHeight + slotTop + slotHeight - scroll, width, height: slotHeight });
    section.querySelector = selector => selector === '.fallback-visual' ? slot : null;
    return section;
  });
  const document = new Events();
  Object.assign(document, { hidden: false, documentElement: html, fonts: { ready: Promise.resolve() },
    querySelector(selector) { return selector === '#launch-stage' && !options.missingMount ? mount : null; },
    querySelectorAll(selector) { return selector === '[data-launch-chapter]' ? sections : []; },
    createElement(type) { assert.equal(type, 'canvas'); return new Canvas(); },
  });
  const window = new Events();
  Object.assign(window, { innerWidth: width, innerHeight: height, devicePixelRatio: 3 });
  Object.defineProperty(window, 'scrollY', { get: () => scroll });
  const reduced = new Events(); reduced.matches = Boolean(options.reduced);
  const fine = new Events(); fine.matches = true;
  const connection = new Events(); connection.saveData = Boolean(options.saveData);
  class Renderer {
    constructor() {
      if (options.rendererFailure) throw new Error('Controlled WebGL creation failure');
      this.domElement = new Canvas(); this.capabilities = { getMaxAnisotropy: () => 8 };
      this.shadowMap = {}; this.info = { render: { calls: 0, triangles: 0 } };
      this.renderCount = 0; this.disposals = 0; renderers.push(this);
    }
    setPixelRatio(value) { this.pixelRatio = value; }
    setSize(w, h) { this.domElement.width = Math.floor(w * this.pixelRatio); this.domElement.height = Math.floor(h * this.pixelRatio); }
    render(scene, camera) {
      scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
      this.scene = scene; this.camera = camera; this.renderCount++;
      this.lastClip = mount.style.clipPath;
      scene.traverse(object => {
        if (!object.isMesh) return;
        watch(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) { watch(material); watch(material.map); }
      });
      this.info.render.calls = 10; this.info.render.triangles = 1000;
    }
    dispose() { this.disposals++; }
  }
  class PMREM {
    constructor() { this.disposals = 0; environments.push(this); }
    fromScene() {
      const texture = new RealThree.Texture(); watch(texture);
      this.target = { texture, disposals: 0, dispose() { this.disposals++; texture.dispose(); } };
      return this.target;
    }
    dispose() { this.disposals++; }
  }
  class RoomEnvironment extends RealThree.Scene { dispose() { this.wasDisposed = true; } }
  class TextureLoader {
    async loadAsync(url) {
      requests.push(url);
      if (options.textureFailure) throw new Error('Controlled texture failure');
      const texture = new RealThree.Texture({ width: 1672, height: 941 });
      watch(texture); loadedTextures.push(texture);
      if (options.pendingTexture) return new Promise(resolve => { resolveTexture = () => resolve(texture); });
      return texture;
    }
  }
  class Observer {
    constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const lifetime = new AbortController();
  if (options.aborted) lifetime.abort();
  const context = vm.createContext({
    console, AbortController, DOMException, document, window, navigator: { connection },
    performance: { now: () => time },
    matchMedia(query) { return query.includes('prefers-reduced-motion') ? reduced : fine; },
    ResizeObserver: Observer,
    requestAnimationFrame(callback) { const id = ++nextRaf; raf.set(id, callback); return id; },
    cancelAnimationFrame(id) { raf.delete(id); },
    __THREE: { ...RealThree, WebGLRenderer: Renderer, TextureLoader, PMREMGenerator: PMREM },
    __RoomEnvironment: RoomEnvironment, __buildExhibits: buildCinematicExhibits,
    __BASE: '/space-media-studio/',
  });
  const executable = source
    .replace("import * as THREE from 'three';", 'const THREE = __THREE;')
    .replace("import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';", 'const RoomEnvironment = __RoomEnvironment;')
    .replace("import { buildCinematicExhibits } from './scene-objects.js';", 'const buildCinematicExhibits = __buildExhibits;')
    .replace('const BASE = import.meta.env.BASE_URL;', 'const BASE = __BASE;')
    .replace('export function createLaunchRoom', 'function createLaunchRoom');
  assert(!executable.includes('import.meta'), 'Vite BASE injection must match the actual source.');
  vm.runInContext(`${executable}\nthis.__factory = createLaunchRoom;`, context, { filename: 'actual-launch-room.js' });
  const api = context.__factory({ signal: lifetime.signal, onReady() { readyCalls++; }, onError(error) { errors.push(error); } });
  const h = {
    api, html, mount, document, window, reduced, connection, lifetime, requests, loadedTextures, resources,
    renderers, environments, errors, observers, raf, width, height, slotTop, slotHeight, chapterHeight,
    get readyCalls() { return readyCalls; },
    get renderer() { return renderers[0]; },
    get scroll() { return scroll; },
    scrollTo(value) { scroll = value; window.emit('scroll'); },
    frame(count = 1) {
      for (let index = 0; index < count; index++) {
        time += 1000 / 60;
        const callbacks = [...raf.values()]; raf.clear(); callbacks.forEach(fn => fn(time));
      }
    },
    settle() { this.frame(100); },
    jump(chapter) { api.setPaused(true); this.scrollTo(chapter * chapterHeight); api.setPaused(false); },
    resolveTexture() { resolveTexture(); },
  };
  return h;
}

async function test(name, callback) { await callback(); groups.push(name); console.log(`PASS ${name}`); }
function assertClean(h) {
  assert.equal(h.raf.size, 0);
  assert.equal(h.renderer.disposals, 1);
  assert.equal(h.renderer.domElement.removed, true);
  assert(h.observers.every(observer => observer.disconnected));
  for (const [resource, count] of h.resources) assert.equal(count, 1, `${resource.type || resource.constructor.name} must be disposed exactly once`);
}

await test('Missing scene structure and an already-aborted lifetime allocate no renderer', async () => {
  for (const options of [{ missingMount: true }, { sectionCount: 3 }, { aborted: true }]) {
    const h = createHarness(options); assert.equal(await h.api.ready, false);
    assert.equal(h.renderers.length, 0); assert.equal(h.requests.length, 0);
  }
});

await test('Reduced motion and SaveData avoid WebGL/texture allocation until policy relaxation', async () => {
  for (const policy of ['reduced', 'saveData']) {
    const h = createHarness({ [policy]: true }); await flush();
    assert.equal(h.renderers.length, 0); assert.equal(h.requests.length, 0);
    if (policy === 'reduced') { h.reduced.matches = false; h.reduced.emit('change'); }
    else { h.connection.saveData = false; h.connection.emit('change'); }
    assert.equal(await h.api.ready, true);
    assert.equal(h.renderers.length, 1); assert.equal(h.requests.length, 1);
    h.api.dispose(); assertClean(h);
  }
});

await test('Initialization honors Vite BASE, loads only architecture, builds four original model stations and waits for unblock', async () => {
  const h = createHarness(); assert.equal(await h.api.ready, true);
  assert.deepEqual(h.requests, ['/space-media-studio/images/launch-architecture.jpg']);
  assert.equal(h.readyCalls, 1); assert.equal(h.raf.size, 0);
  const stationGroups = h.renderer.scene.children.filter(object => object.isGroup && object.children[0]?.isGroup);
  assert.equal(stationGroups.length, 4);
  assert.equal(h.renderer.pixelRatio, 1.6);
  h.api.setBlocked(false); assert.equal(h.raf.size, 1);
  h.api.setBlocked(false); assert.equal(h.raf.size, 1);
  h.api.dispose(); assertClean(h);
});

await test('Four native anchors select exact poses and desktop camera Y stays continuous', async () => {
  const h = createHarness(); await h.api.ready; h.api.setBlocked(false);
  for (const anchor of [0, 1, 2, 3, 1, 0]) {
    h.jump(anchor);
    assert(Math.abs(h.renderer.camera.position.x - anchor * 10.4) < 1e-9);
    assert.equal(h.renderer.camera.position.y, .28);
    assert.equal(h.html.dataset.launchScene, String(anchor));
  }
  h.api.dispose(); assertClean(h);
});

await test('Pause reveals fallback immediately and resume paints the current chapter without replaying the entrance', async () => {
  const h = createHarness(); await h.api.ready; h.api.setBlocked(false); h.settle();
  h.api.setPaused(true);
  assert.equal(h.raf.size, 0); assert.equal(h.html.classList.contains('launch-ready'), false);
  assert.equal(h.mount.dataset.launchState, 'fallback');
  h.scrollTo(2 * h.chapterHeight); const renders = h.renderer.renderCount;
  h.api.setPaused(false);
  assert.equal(h.renderer.renderCount, renders + 1);
  assert(Math.abs(h.renderer.camera.position.x - 20.8) < 1e-9);
  assert.equal(h.html.classList.contains('launch-ready'), true);
  h.api.dispose(); assertClean(h);
});

await test('Modal blocking, document visibility and leaving the four chapters stop frame scheduling', async () => {
  const h = createHarness(); await h.api.ready; h.api.setBlocked(false);
  h.api.setBlocked(true); assert.equal(h.raf.size, 0);
  h.api.setBlocked(false); assert.equal(h.raf.size, 1);
  h.document.hidden = true; h.document.emit('visibilitychange'); assert.equal(h.raf.size, 0);
  h.document.hidden = false; h.document.emit('visibilitychange'); assert.equal(h.raf.size, 1);
  h.scrollTo(4 * h.chapterHeight); assert.equal(h.raf.size, 0);
  assert.equal(h.html.classList.contains('launch-ready'), false);
  h.scrollTo(h.chapterHeight); assert.equal(h.raf.size, 1);
  h.api.dispose(); assertClean(h);
});

await test('Live reduced motion and SaveData stop rendering and restore the static presentation', async () => {
  for (const policy of ['reduced', 'saveData']) {
    const h = createHarness(); await h.api.ready; h.api.setBlocked(false);
    if (policy === 'reduced') { h.reduced.matches = true; h.reduced.emit('change'); }
    else { h.connection.saveData = true; h.connection.emit('change'); }
    assert.equal(h.raf.size, 0); assert.equal(h.html.classList.contains('launch-ready'), false);
    h.api.dispose(); assertClean(h);
  }
});

await test('Explicit disposal is idempotent and releases graph resources, environment, observer, canvas and listeners', async () => {
  const h = createHarness({ width: 390, height: 844 }); await h.api.ready;
  h.api.setBlocked(false); h.settle(); assert(h.mount.style.clipPath);
  h.api.dispose(); h.api.dispose(); assertClean(h);
  assert.equal(h.mount.style.clipPath, ''); assert.equal(h.html.classList.contains('launch-ready'), false);
  assert.equal(h.environments[0].target.disposals, 1);
  const renders = h.renderer.renderCount;
  h.window.emit('resize'); h.window.emit('scroll'); h.api.setPaused(false); h.api.setBlocked(false);
  assert.equal(h.renderer.renderCount, renders); assert.equal(h.raf.size, 0);
});

await test('Renderer construction and texture failures resolve usable fallback and report the failure once', async () => {
  for (const options of [{ rendererFailure: true }, { textureFailure: true }]) {
    const h = createHarness(options); assert.equal(await h.api.ready, false);
    assert.equal(h.errors.length, 1); assert.equal(h.mount.dataset.launchState, 'fallback');
    assert.equal(h.html.classList.contains('launch-ready'), false); assert.equal(h.raf.size, 0);
    if (h.renderer) assert.equal(h.renderer.disposals, 1);
    h.api.dispose(); assert.equal(h.errors.length, 1);
  }
});

await test('Abort during a texture load disposes the late image without constructing or revealing the exhibits', async () => {
  const h = createHarness({ pendingTexture: true }); await flush();
  assert.equal(h.requests.length, 1); h.lifetime.abort();
  assert.equal(await h.api.ready, false);
  h.resolveTexture(); await flush();
  assert.equal(h.resources.get(h.loadedTextures[0]), 1);
  assert.equal(h.renderer.renderCount, 0); assert.equal(h.renderer.disposals, 1);
  assert.equal(h.readyCalls, 0); assert.equal(h.raf.size, 0);
});

await test('WebGL context loss cancels the loop, clears the clipping mask and releases all observed resources', async () => {
  const h = createHarness({ width: 390, height: 844 }); await h.api.ready; h.api.setBlocked(false);
  const event = h.renderer.domElement.emit('webglcontextlost');
  assert.equal(event.prevented, true); assert.equal(h.errors.length, 1);
  assert.equal(h.mount.dataset.launchState, 'fallback'); assert.equal(h.mount.style.clipPath, '');
  assertClean(h);
});

await test('Mobile clipping follows each scrolling HTML slot at n+.2/.5/.8 and never exposes models over adjacent copy', async () => {
  let samples = 0;
  for (const [width, height] of [[320, 667], [390, 844], [844, 390], [900, 800]]) {
    const h = createHarness({ width, height }); await h.api.ready; h.api.setBlocked(false); h.settle();
    assert.equal(h.renderer.pixelRatio, 1.25);
    function verify() {
      const progress = h.renderer.camera.position.x / 10.4;
      const nearest = Math.round(progress);
      const slotCenter = nearest * h.chapterHeight + h.slotTop + h.slotHeight / 2 - h.scroll;
      const top = Math.max(0, Math.min(height, slotCenter - h.slotHeight / 2));
      const bottom = Math.max(0, Math.min(height, slotCenter + h.slotHeight / 2));
      const expected = `inset(${top.toFixed(2)}px 0 ${(height - bottom).toFixed(2)}px 0)`;
      assert.equal(h.mount.style.clipPath, expected, `slot mask ${width}x${height} at progress ${progress}`);
      assert.equal(h.renderer.lastClip, expected);
      assert(top <= bottom && top >= 0 && bottom <= height);
      samples++;
    }
    for (const n of [0, 1, 2]) for (const fraction of [.2, .5, .8]) {
      h.jump(n); h.scrollTo((n + fraction) * h.chapterHeight);
      // Several intermediate frames deliberately include the damped pose and
      // its nearest-station switch. The mask must always use the real slot.
      for (let frame = 0; frame < 60; frame++) { h.frame(); if (frame % 10 === 0 || frame === 59) verify(); }
    }
    h.jump(3); verify();
    h.api.dispose(); assertClean(h);
  }
  console.log(`  ${samples} numerical clip samples over 4 phone/tablet viewport doubles`);
});

console.log(JSON.stringify({ groups: groups.length, source: 'actual src/launch-room.js + src/scene-objects.js', geometry: 'real Three.js', graphics: 'renderer mocked; no GPU or browser measurement', externalRequests: false }, null, 2));
