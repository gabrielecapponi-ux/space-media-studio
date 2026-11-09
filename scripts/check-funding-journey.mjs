import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = (await readFile(process.env.FUNDING_SOURCE || new URL('../src/funding-journey.js', import.meta.url), 'utf8')).replaceAll('export function', 'function');
let writes = { style: 0, attribute: 0, dataset: 0 };
class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn, { signal } = {}) {
    if (signal?.aborted) return;
    const group = this.listeners.get(type) || new Set();
    group.add(fn); this.listeners.set(type, group);
    signal?.addEventListener('abort', () => group.delete(fn), { once: true });
  }
  removeEventListener(type, fn) { this.listeners.get(type)?.delete(fn); }
  emit(type, event = {}) { for (const fn of this.listeners.get(type) || []) fn({ target: this, ...event }); }
}
class Element extends Events {
  constructor() {
    super(); this.dataset = new Proxy({}, { set(target, key, value) { writes.dataset++; target[key] = value; return true; } }); this.attrs = {}; this.hidden = true; this.textContent = '';
    this.style = new Proxy({ setProperty(name, value) { this[name] = value; } }, { set(target, key, value) { writes.style++; target[key] = value; return true; } });
    this.classList = { values: new Set(), contains(name) { return this.values.has(name); } };
  }
  setAttribute(name, value) { writes.attribute++; this.attrs[name] = value; }
  contains(node) { return node === this || node?.parent === this; }
  closest() { return null; }
}
function fixture({ reduced = false, saveData = false } = {}) {
  let now = 0, id = 0; const frames = new Map();
  const root = new Element(), button = new Element(), replay = new Element(), symbol = new Element();
  const heading = new Element(), step = new Element(), canvas = new Element(), camera = new Element(), ink = new Element();
  const scenes = Array.from({ length: 4 }, () => new Element()), guides = Array.from({ length: 4 }, () => new Element()), links = Array.from({ length: 3 }, () => new Element());
  const rail = Array.from({ length: 4 }, () => new Element());
  const html = new Element(), doc = new Events(), win = new Events(), menu = new Events();
  menu.open = false; doc.hidden = false; doc.documentElement = html;
  doc.querySelector = () => root;
  button.parent = replay.parent = canvas.parent = root;
  button.closest = replay.closest = () => button;
  button.querySelector = () => symbol;
  root.querySelector = selector => ({ '[data-journey-toggle]': button, '[data-journey-replay]': replay,
    '[data-journey-heading]': heading, '[data-journey-step]': step, '[data-journey-canvas]': canvas })[selector];
  root.querySelectorAll = () => rail;
  let paths = [];
  Object.defineProperty(canvas, 'innerHTML', { set(markup) {
    paths = [...markup.matchAll(/data-draw="([^"]+)"/g)].map(([, value]) => {
      const node = new Element(); node.dataset.draw = value; return node;
    });
  } });
  canvas.querySelector = () => ({
    querySelector: selector => selector === '[data-journey-ink]' ? ink : camera,
    querySelectorAll: selector => selector === '[data-journey-scene]' ? scenes : selector === '[data-journey-guide]' ? guides : selector === '[data-journey-link]' ? links : paths,
  });
  const pref = new Events(), portrait = new Events(), connection = new Events();
  pref.matches = reduced; portrait.matches = false; connection.saveData = saveData;
  let intersection, mutation, disconnected = 0;
  const context = { document: doc, window: win, navigator: { connection }, AbortController,
    matchMedia: query => query.includes('reduced') ? pref : portrait,
    IntersectionObserver: class { constructor(fn) { intersection = fn; } observe() {} disconnect() { disconnected++; } },
    MutationObserver: class { constructor(fn) { mutation = fn; } observe() {} disconnect() { disconnected++; } },
    requestAnimationFrame: fn => { frames.set(++id, fn); return id; }, cancelAnimationFrame: key => frames.delete(key) };
  vm.runInNewContext(source, context);
  const controller = new AbortController();
  const api = context.installFundingJourney({ signal: controller.signal, menu });
  function advance(ms) { for (let left = ms; left > 0; left -= 16) {
    now += Math.min(left, 16); const queue = [...frames.values()]; frames.clear(); queue.forEach(fn => fn(now));
  } }
  const enter = ratio => intersection([{ isIntersecting: ratio > 0, intersectionRatio: ratio }]);
  return { root, button, replay, heading, rail, camera, ink, scenes, guides, links, canvas, pref, portrait, connection, doc, win,
    writeCounts: () => ({ ...writes }), resetWrites: () => { writes = { style: 0, attribute: 0, dataset: 0 }; },
    menu, html, api, controller, advance, enter, mutate: () => mutation(), paths: () => paths,
    frameCount: () => frames.size, time: () => Number(root.dataset.journeyTime), disconnected: () => disconnected };
}
let groups = 0;
function test(name, fn) { fn(); groups++; console.log('PASS', name); }

test('A new visible visit draws the original line, reaches all four scenes and overview', () => {
  const f = fixture(); assert.equal(f.frameCount(), 0); f.enter(.8); f.advance(2500);
  assert.ok(f.time() > 2); assert.ok(Number(f.paths()[0].style.strokeDashoffset) < 1);
  assert.equal(f.root.dataset.journeyPhaseIndex, '0'); f.advance(2400);
  assert.equal(f.root.dataset.journeyPhaseIndex, '1'); f.advance(4000);
  assert.equal(f.root.dataset.journeyPhaseIndex, '2'); f.advance(4000);
  assert.equal(f.root.dataset.journeyPhaseIndex, '3'); f.advance(6000);
  assert.equal(f.root.dataset.journeyPhaseIndex, '4'); assert.equal(f.heading.textContent, 'Dall’idea alla realtà.');
  f.api.dispose();
});
test('Reentry rewinds and clears the previous visit pause, with hysteresis at the edge', () => {
  const f = fixture(); f.enter(.8); f.advance(2000); f.enter(.1); f.advance(200);
  assert.ok(f.time() > 2); f.button.emit('click'); const paused = f.time(); f.advance(2000);
  assert.equal(f.time(), paused); f.enter(.01); f.enter(.8);
  assert.equal(f.time(), 0); assert.equal(f.frameCount(), 1); f.api.dispose();
});
test('Mouse reentry restarts, internal pointer motion and touch do not', () => {
  const f = fixture(); f.enter(.8); f.advance(3000);
  f.root.emit('pointerover', { target: f.canvas, pointerType: 'touch' }); assert.ok(f.time() > 2);
  f.root.emit('pointerover', { target: f.canvas, pointerType: 'mouse', relatedTarget: f.button }); assert.ok(f.time() > 2);
  f.root.emit('pointerover', { target: f.canvas, pointerType: 'mouse', relatedTarget: null }); assert.equal(f.time(), 0);
  f.api.dispose();
});
test('Entering through transport controls does not double-toggle a paused drawing', () => {
  const f = fixture(); f.enter(.8); f.advance(3000); f.button.emit('click');
  f.root.emit('pointerover', { target: f.button, pointerType: 'mouse', relatedTarget: null });
  assert.equal(f.frameCount(), 0); f.button.emit('click'); assert.equal(f.frameCount(), 1);
  f.replay.emit('click'); assert.equal(f.time(), 0); f.api.dispose();
});
test('Menu, hidden document, entry and cinema suspend drawing without resetting a visit', () => {
  const f = fixture(); f.enter(.8); f.advance(3000); const time = f.time();
  f.menu.open = true; f.menu.emit('toggle'); f.advance(1000); assert.equal(f.time(), time);
  f.menu.open = false; f.menu.emit('toggle'); assert.equal(f.frameCount(), 1);
  f.doc.hidden = true; f.doc.emit('visibilitychange'); assert.equal(f.frameCount(), 0);
  f.doc.hidden = false; f.doc.emit('visibilitychange');
  for (const flag of ['entry-pending', 'cinema-open']) {
    f.html.classList.values.add(flag); f.mutate(); assert.equal(f.frameCount(), 0);
    f.html.classList.values.delete(flag); f.mutate(); assert.equal(f.frameCount(), 1);
  }
  assert.equal(f.time(), time); f.api.dispose();
});
test('Reduced motion and SaveData show complete geometry and require manual playback', () => {
  for (const option of [{ reduced: true }, { saveData: true }]) {
    const f = fixture(option); f.enter(.8); f.advance(1000);
    assert.equal(f.frameCount(), 0); assert.ok(f.paths().every(p => p.style.strokeDashoffset === '0'));
    f.replay.emit('click'); f.advance(1000); assert.ok(f.time() > .5);
    f.enter(0); f.enter(.8); assert.equal(f.frameCount(), 0); f.api.dispose();
  }
});
test('Live preference changes stop animation, and resize retains progress', () => {
  const f = fixture(); f.enter(.8); f.advance(3000); const time = f.time();
  f.portrait.matches = true; f.portrait.emit('change'); assert.equal(f.time(), time);
  f.pref.matches = true; f.pref.emit('change'); assert.equal(f.frameCount(), 0);
  assert.ok(f.paths().every(p => p.style.strokeDashoffset === '0'));
  f.pref.matches = false; f.pref.emit('change'); assert.equal(f.frameCount(), 1); f.api.dispose();
});
test('BFCache suspension resumes and abort releases observers and frame work exactly once', () => {
  const f = fixture(); f.enter(.8); f.advance(1000); f.win.emit('pagehide', { persisted: true });
  assert.equal(f.frameCount(), 0); f.win.emit('pageshow'); assert.equal(f.frameCount(), 1);
  f.controller.abort(); assert.equal(f.frameCount(), 0); assert.equal(f.disconnected(), 2);
  f.api.dispose(); assert.equal(f.disconnected(), 2); f.button.emit('click'); assert.equal(f.frameCount(), 0);
});
test('Incoming scene is drawn before its title and outgoing scenes leave the close-up', () => {
  const f = fixture(); f.enter(.8); f.advance(4220);
  assert.equal(f.root.dataset.journeyPhaseIndex, '1');
  assert.equal(f.scenes[0].attrs.opacity, '0');
  assert.ok(Number(f.scenes[1].attrs.opacity) > .95);
  const head = f.paths().find(path => path.dataset.draw.startsWith('3.25,'));
  assert.ok(Number(head.style.strokeDashoffset) < .05);
  f.advance(11300);
  assert.equal(f.scenes[1].attrs.opacity, '0');
  assert.equal(f.scenes[3].attrs.opacity, '1');
  assert.ok(f.links.every(link => link.attrs.opacity === '0'), 'No connector leftovers in the building close-up');
  f.advance(4000);
  assert.ok(f.links.every(link => link.attrs.opacity === '1'), 'Connectors restore the complete overview');
  f.api.dispose();
});
test('Loop returns to the same camera without fading the construction guides', () => {
  const f = fixture(); f.enter(.8); const start = f.camera.attrs.transform;
  f.advance(21600);
  assert.equal(f.root.dataset.journeyPhaseIndex, '0');
  assert.ok(f.rail.every(item => item.style['--journey-progress'] === '0'), 'The returning idea resets the phase rails together');
  f.advance(400);
  const a = f.camera.attrs.transform.match(/-?[0-9.]+/g).map(Number), b = start.match(/-?[0-9.]+/g).map(Number);
  assert.ok(a.every((value, i) => Math.abs(value - b[i]) < .01), 'Camera closes its 22 second loop');
  assert.equal(f.guides[0].attrs.opacity, '1');
  assert.equal(f.camera.attrs.opacity, undefined);
  f.advance(96); assert.ok(Number(f.paths()[0].style.strokeDashoffset) < 1);
  assert.equal(f.ink.attrs.opacity, '1');
  f.api.dispose();
});
test('Held frames and completed strokes do not repeatedly write the same DOM values', () => {
  const f = fixture(); f.enter(.8); f.resetWrites(); f.advance(22000);
  const counts = f.writeCounts(), total = Object.values(counts).reduce((a, b) => a + b, 0);
  assert.ok(total < 14000, `Unexpected DOM writes per cycle: ${total}`);
  console.log(JSON.stringify({ simulatedMs: 22000, cadenceMs: 16, paths: f.paths().length, writes: counts, total }));
  f.api.dispose();
});
console.log(JSON.stringify({ groups, browser: false, remoteRequests: false }));
