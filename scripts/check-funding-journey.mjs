import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source = (await readFile(new URL('../src/funding-journey.js', import.meta.url), 'utf8')).replaceAll('export function', 'function');
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
    super(); this.dataset = {}; this.attrs = {}; this.hidden = true; this.textContent = '';
    this.style = { setProperty(name, value) { this[name] = value; } };
    this.classList = { values: new Set(), contains(name) { return this.values.has(name); } };
  }
  setAttribute(name, value) { this.attrs[name] = value; }
  contains(node) { return node === this || node?.parent === this; }
  closest() { return null; }
}
function fixture({ reduced = false, saveData = false } = {}) {
  let now = 0, id = 0; const frames = new Map();
  const root = new Element(), button = new Element(), replay = new Element(), symbol = new Element();
  const heading = new Element(), step = new Element(), canvas = new Element(), camera = new Element();
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
  canvas.querySelector = () => ({ querySelector: () => camera, querySelectorAll: () => paths });
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
  return { root, button, replay, heading, rail, camera, canvas, pref, portrait, connection, doc, win,
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
console.log(JSON.stringify({ groups, browser: false, remoteRequests: false }));
