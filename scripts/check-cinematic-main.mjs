/**
 * Behavioral contracts for Space's HTML controller and WhatsApp-draft helper.
 * Executes the actual source in an isolated VM with small DOM/event doubles.
 * No renderer, real browser, remote request, WhatsApp navigation or submission.
 * Run from any directory: npm test
 * These checks complement browser QA; they do not measure visual/GPU quality.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const rootURL = new URL('../', import.meta.url);
const mainSource = await readFile(new URL('src/main.js', rootURL), 'utf8');
const briefsSource = await readFile(new URL('src/idea-briefs.js', rootURL), 'utf8');
const groups = [];
const flush = async () => { for (let i = 0; i < 6; i += 1) await Promise.resolve(); };

class Events {
  constructor() { this.listeners = new Map(); }
  addEventListener(type, fn, options = {}) {
    if (options.signal?.aborted) return;
    const entry = { fn, once: options.once };
    const entries = this.listeners.get(type) || new Set();
    entries.add(entry);
    this.listeners.set(type, entries);
    options.signal?.addEventListener('abort', () => entries.delete(entry), { once: true });
  }
  removeEventListener(type, fn) {
    for (const entry of this.listeners.get(type) || []) if (entry.fn === fn) this.listeners.get(type).delete(entry);
  }
  emit(type, extra = {}) {
    const event = { type, target: this, defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; }, ...extra };
    for (const entry of [...(this.listeners.get(type) || [])]) {
      if (entry.once) this.listeners.get(type).delete(entry);
      entry.fn.call(this, event);
    }
    return event;
  }
}

class Classes {
  constructor() { this.names = new Set(); }
  add(name) { this.names.add(name); }
  remove(name) { this.names.delete(name); }
  contains(name) { return this.names.has(name); }
  toggle(name, force) {
    const on = force ?? !this.names.has(name);
    if (on) this.names.add(name); else this.names.delete(name);
    return on;
  }
}

function createHarness({ reduced = false, saveData = false, importFailure = false, pendingImport = false } = {}) {
  let document;
  let scrollY = 0;
  const animations = [];
  const scrolls = [];
  const observers = [];
  const rafs = new Map();
  let rafID = 0;
  let loadCount = 0;
  let createCount = 0;
  let roomOptions;
  let resolveImport;
  const roomCalls = { blocked: [], paused: [], disposed: 0 };
  const historyCalls = [];

  class Element extends Events {
    constructor(id = '') {
      super(); this.id = id; this.attributes = new Map(); this.dataset = {}; this.classList = new Classes();
      this.style = { setProperty(name, value) { this[name] = value; } };
      this.hidden = false; this.textContent = ''; this.open = false;
      this.children = []; this.parent = undefined; this.firstElementChild = { textContent: '' };
    }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.get(name) ?? null; }
    removeAttribute(name) { this.attributes.delete(name); }
    append(child) { this.children.push(child); child.parent = this; }
    contains(element) { return element === this || this.children.some(child => child.contains?.(element)); }
    querySelector(selector) {
      if (selector === 'textarea') return this.field;
      if (selector === '.idea-box[open]') return this.details?.open ? this.details : null;
      if (selector === 'textarea[name="text"]') return this.field;
      if (selector === '[data-idea-count]') return this.count;
      if (selector === '[data-idea-status]') return this.status;
      return null;
    }
    querySelectorAll(selector) { return selector === 'a[href^="#"]' ? this.links || [] : []; }
    focus() { document.activeElement = this; document.emit('focusin', { target: this }); }
    scrollIntoView(options) { scrolls.push({ id: this.id, ...options }); }
    getBoundingClientRect() { const top = (this.documentTop || 0) - scrollY; return { top, bottom: top + (this.height || 800) }; }
    showModal() { this.open = true; }
    close() { this.open = false; queueMicrotask(() => this.emit('close')); }
    replaceChildren(...children) { this.children = children; this.lastReplacement = children; }
    animate(keyframes, options) {
      const animation = { keyframes, options, canceled: false, cancel() { this.canceled = true; } };
      animations.push(animation); return animation;
    }
  }

  const html = new Element('html');
  const body = new Element('body');
  const stage = new Element('launch-stage');
  const menu = new Element('menu-dialog');
  const menuToggle = new Element('menu-toggle');
  const motion = new Element('motion-toggle');
  const project = new Element('project-dialog');
  const content = new Element('project-content');
  const closeMenu = new Element('close-menu');
  const closeProject = new Element('close-project');
  const progress = new Element('progress-line');
  const contact = new Element('contatti'); contact.documentTop = 4000;
  const sections = ['brand', 'web', 'cgi', 'campagne'].map((id, index) => {
    const section = new Element(id); section.documentTop = index * 800; return section;
  });
  const details = sections.map((section, index) => {
    const key = ['identity', 'web', 'cgi', 'campaigns'][index];
    const item = new Element(`idea-${key}`);
    const field = new Element(`brief-${key}`);
    item.field = field; item.append(field); section.details = item; section.append(item);
    return item;
  });
  const projectBrief = new Element('idea-projects');
  projectBrief.field = new Element('brief-projects'); projectBrief.append(projectBrief.field);
  details.push(projectBrief);
  const forms = details.map((detail, index) => {
    const form = new Element(`form-${index}`);
    form.dataset.serviceLabel = ['Branding & identità', 'Siti web & e-commerce', 'Motion & 3D', 'Contenuti & campagne', 'Progetti & bandi'][index];
    form.field = detail.field; form.count = new Element(); form.status = new Element();
    form.field.value = ''; form.field.maxLength = 1200; form.field.minLength = 12;
    form.field.validity = { customError: false }; form.field.validationMessage = '';
    form.field.setCustomValidity = function (value) { this.validationMessage = value; this.validity.customError = Boolean(value); };
    return form;
  });
  const links = sections.map(section => {
    const link = new Element(`link-${section.id}`); link.hash = `#${section.id}`; link.setAttribute('href', link.hash); return link;
  });
  menu.links = links;
  const openers = ['identity', 'web', 'cgi', 'campaigns'].map(key => {
    const opener = new Element(`open-${key}`); opener.dataset.openProject = key; opener.hidden = true; return opener;
  });
  const templates = Object.fromEntries(openers.map(opener => [opener.dataset.openProject, {
    content: { cloneNode(deep) { assert.equal(deep, true); return { trustedTemplate: opener.dataset.openProject }; } },
  }]));
  const byID = new Map([html, body, stage, menu, motion, project, content, contact, ...sections, ...details].map(el => [el.id, el]));
  const selectors = new Map([
    ['#menu-dialog', menu], ['.menu-toggle', menuToggle], ['#motion-toggle', motion], ['#project-dialog', project],
    ['[data-project-content]', content], ['#launch-stage', stage], ['[data-page-progress]', progress],
    ['#contatti', contact], ['[data-close-menu]', closeMenu], ['[data-close-project]', closeProject],
    ...details.map(item => [`#${item.id}`, item]),
  ]);
  document = new Events();
  Object.assign(document, { documentElement: html, body, hidden: false, activeElement: body,
    getElementById(id) { return byID.get(id); },
    querySelector(selector) {
      if (selector === '.idea-box[open]') return details.find(item => item.open) || null;
      const templateMatch = /^#project-(.+)\[data-project-template\]$/.exec(selector);
      return templateMatch ? templates[templateMatch[1]] : selectors.get(selector) || null;
    },
    querySelectorAll(selector) {
      return ({ '[data-launch-chapter]': sections, '[data-chapter-link]': links,
        '[data-open-project]': openers, '.idea-box': details, '[data-idea-form]': forms, '[data-year]': [] })[selector] || [];
    },
  });
  const window = new Events();
  const reducedQuery = new Events(); reducedQuery.matches = reduced;
  const connection = new Events(); connection.saveData = saveData;
  const room = {
    setBlocked(value) { roomCalls.blocked.push(value); },
    setPaused(value) { roomCalls.paused.push(value); },
    dispose() { roomCalls.disposed += 1; },
  };
  const roomModule = { createLaunchRoom(options) {
    roomOptions = options; createCount += 1;
    queueMicrotask(() => options.onReady());
    return room;
  } };
  const importPromise = pendingImport ? new Promise(resolve => { resolveImport = resolve; }) : null;
  class Observer {
    constructor(callback) { this.callback = callback; this.disconnected = false; this.targets = []; observers.push(this); }
    observe(target) { this.targets.push(target); }
    disconnect() { this.disconnected = true; }
  }
  const context = vm.createContext({
    console, AbortController, document, window, navigator: { connection }, innerHeight: 800,
    matchMedia() { return reducedQuery; }, MutationObserver: Observer, ResizeObserver: Observer,
    requestAnimationFrame(fn) { const id = ++rafID; rafs.set(id, fn); return id; },
    cancelAnimationFrame(id) { rafs.delete(id); },
    history: { pushState(...args) { historyCalls.push(args); } },
    __loadRoom() {
      loadCount += 1;
      if (importFailure) return Promise.reject(new Error('Controlled import failure'));
      return pendingImport ? importPromise : Promise.resolve(roomModule);
    },
  });
  // Dependency imports are injected so the real controllers run without a
  // browser/renderer; statements and event handlers remain the actual source.
  const injectedBriefs = briefsSource.replaceAll('export function ', 'function ');
  const injectedMain = mainSource
    .replace(/^import \{ installIdeaBriefs \} from '\.\/idea-briefs\.js';\s*/u, '')
    .replace("import('./launch-room.js')", '__loadRoom()');
  assert.notEqual(injectedMain, mainSource, 'The controller import injection must match the source.');
  vm.runInContext(`${injectedBriefs}\n${injectedMain}`, context, { filename: 'actual-main-and-briefs.js' });
  return {
    html, body, stage, menu, menuToggle, motion, project, content, closeMenu, closeProject, progress,
    sections, details, forms, links, openers, document, window, reducedQuery, connection,
    roomCalls, historyCalls, observers, animations, scrolls, rafs,
    get loadCount() { return loadCount; }, get createCount() { return createCount; },
    triggerError() { roomOptions.onError(new Error('Controlled renderer failure')); },
    resolveImport() { resolveImport(roomModule); },
    flushFrames() { const callbacks = [...rafs.values()]; rafs.clear(); callbacks.forEach(fn => fn(100)); },
    setScroll(value) { scrollY = value; window.emit('scroll'); this.flushFrames(); },
  };
}

async function test(name, fn) {
  await fn(); groups.push(name); console.log(`PASS ${name}`);
}

await test('Initial reduced motion and SaveData preserve native content and avoid loading Three', async () => {
  for (const policy of [{ reduced: true }, { saveData: true }]) {
    const h = createHarness(policy); await flush();
    assert.equal(h.loadCount, 0); assert.equal(h.createCount, 0);
    assert.equal(h.menuToggle.hidden, false);
    assert(h.openers.every(opener => !opener.hidden));
  }
});

await test('Preference relaxation imports once and exposes a wired pause control', async () => {
  const h = createHarness({ reduced: true });
  h.reducedQuery.matches = false; h.reducedQuery.emit('change'); await flush();
  h.reducedQuery.emit('change'); h.connection.emit('change'); await flush();
  assert.equal(h.loadCount, 1); assert.equal(h.createCount, 1);
  assert.equal(h.motion.hidden, false); assert.equal(h.roomCalls.blocked.at(-1), false);
});

await test('Explicit pause is reflected in renderer state, text, and pressed accessibility state', async () => {
  const h = createHarness(); await flush(); h.motion.emit('click');
  assert.equal(h.roomCalls.paused.at(-1), true);
  assert.equal(h.motion.getAttribute('aria-pressed'), 'true');
  assert.equal(h.motion.getAttribute('aria-label'), 'Riprendi le animazioni');
  h.motion.emit('click');
  assert.equal(h.roomCalls.paused.at(-1), false);
  assert.equal(h.motion.getAttribute('aria-pressed'), 'false');
});

await test('Menu blocks the renderer and closes before section focus and hash navigation', async () => {
  const h = createHarness(); await flush(); h.menuToggle.emit('click');
  assert.equal(h.menu.open, true); assert.equal(h.roomCalls.blocked.at(-1), true);
  assert.equal(h.menuToggle.getAttribute('aria-expanded'), 'true');
  assert.equal(h.body.classList.contains('dialog-open'), true);
  const event = h.links[1].emit('click'); await flush();
  assert.equal(event.defaultPrevented, true); assert.equal(h.menu.open, false);
  assert.equal(h.roomCalls.blocked.at(-1), false);
  assert.equal(h.document.activeElement, h.sections[1]);
  assert.equal(h.historyCalls.at(-1)[2], '#web');
  assert.equal(h.scrolls.at(-1).id, 'web');
});

await test('Reduced-motion menu navigation stays immediate and project reveal remains static', async () => {
  const h = createHarness({ reduced: true }); await flush();
  h.menuToggle.emit('click'); h.links[2].emit('click'); await flush();
  assert.equal(h.scrolls.at(-1).behavior, 'auto');
  assert.equal(h.document.activeElement, h.sections[2]);
  h.openers[2].emit('click');
  assert.equal(h.project.open, true); assert.equal(h.animations.length, 0);
});

await test('Project opens a trusted template, blocks motion, and restores focus on close', async () => {
  const h = createHarness(); await flush(); h.openers[0].emit('click');
  assert.equal(h.project.open, true); assert.equal(h.roomCalls.blocked.at(-1), true);
  assert.equal(h.content.lastReplacement[0].trustedTemplate, 'identity');
  assert.equal(h.animations.length, 1);
  h.closeProject.emit('click'); await flush();
  assert.equal(h.project.open, false); assert.equal(h.document.activeElement, h.openers[0]);
  assert.equal(h.content.children.length, 0); assert.equal(h.animations[0].canceled, true);
});

await test('Queued dialog close cannot clear a new project opened in the same task', async () => {
  const h = createHarness(); await flush();
  h.openers[0].emit('click'); h.closeProject.emit('click'); h.openers[1].emit('click'); await flush();
  assert.equal(h.project.open, true); assert.equal(h.content.lastReplacement[0].trustedTemplate, 'web');
});

await test('Project-to-idea action opens matching brief and keeps textarea focus', async () => {
  const h = createHarness(); await flush(); h.openers[1].emit('click');
  const button = { dataset: { projectIdea: 'web' }, closest(selector) { return selector === '[data-project-idea]' ? this : null; } };
  h.content.emit('click', { target: button }); await flush();
  assert.equal(h.project.open, false); assert.equal(h.details[1].open, true);
  assert.equal(h.document.activeElement, h.details[1].field);
  assert.equal(h.historyCalls.at(-1)[2], '#idea-web');
  assert.equal(h.scrolls.at(-1).id, 'idea-web');
});

await test('An expanded idea pauses the scene and preserves a visitor’s explicit pause', async () => {
  const h = createHarness(); await flush();
  h.details[0].open = true; h.details[0].emit('toggle');
  assert.equal(h.roomCalls.paused.at(-1), true);
  h.details[0].open = false; h.details[0].emit('toggle');
  assert.equal(h.roomCalls.paused.at(-1), false);
  h.motion.emit('click'); h.details[0].open = true; h.details[0].emit('toggle');
  h.details[0].open = false; h.details[0].emit('toggle');
  assert.equal(h.roomCalls.paused.at(-1), true);
});

await test('Live reduced motion or SaveData cancels dialog reveal and hides the motion control', async () => {
  for (const preference of ['reduced', 'data']) {
    const h = createHarness(); await flush(); h.openers[0].emit('click');
    if (preference === 'reduced') { h.reducedQuery.matches = true; h.reducedQuery.emit('change'); }
    else { h.connection.saveData = true; h.connection.emit('change'); }
    assert.equal(h.motion.hidden, true); assert.equal(h.animations.at(-1).canceled, true);
    assert.equal(h.loadCount, 1);
  }
});

await test('Visibility and BFCache suspend and resume without prematurely disposing the scene', async () => {
  const h = createHarness(); await flush();
  h.document.hidden = true; h.document.emit('visibilitychange');
  assert.equal(h.roomCalls.blocked.at(-1), true);
  h.document.hidden = false; h.document.emit('visibilitychange');
  assert.equal(h.roomCalls.blocked.at(-1), false);
  h.window.emit('pagehide', { persisted: true });
  assert.equal(h.roomCalls.blocked.at(-1), true); assert.equal(h.roomCalls.disposed, 0);
  h.window.emit('pageshow'); assert.equal(h.roomCalls.blocked.at(-1), false);
});

await test('Final pagehide aborts listeners, observers, queued frames and scene resources', async () => {
  const h = createHarness(); await flush(); h.window.emit('scroll');
  assert(h.rafs.size > 0); h.window.emit('pagehide', { persisted: false });
  assert.equal(h.rafs.size, 0); assert.equal(h.roomCalls.disposed, 1);
  assert(h.observers.every(observer => observer.disconnected));
  const pausedCalls = h.roomCalls.paused.length;
  h.motion.emit('click'); h.window.emit('scroll');
  assert.equal(h.roomCalls.paused.length, pausedCalls); assert.equal(h.rafs.size, 0);
});

await test('Disposal while the scene import is pending prevents late scene creation', async () => {
  const h = createHarness({ pendingImport: true });
  h.window.emit('pagehide', { persisted: false }); h.resolveImport(); await flush();
  assert.equal(h.loadCount, 1); assert.equal(h.createCount, 0);
});

await test('Import failure leaves usable project/menu controls and a hidden animation control', async () => {
  const h = createHarness({ importFailure: true }); await flush();
  assert.equal(h.stage.dataset.launchState, 'fallback'); assert.equal(h.motion.hidden, true);
  h.menuToggle.emit('click'); assert.equal(h.menu.open, true);
  h.closeMenu.emit('click'); await flush(); h.openers[2].emit('click');
  assert.equal(h.project.open, true); assert.equal(h.content.lastReplacement[0].trustedTemplate, 'cgi');
});

await test('Terminal renderer failure cannot re-expose an ineffective pause control', async () => {
  const h = createHarness(); await flush(); h.triggerError();
  h.document.emit('visibilitychange'); h.motion.emit('click');
  assert.equal(h.motion.hidden, true); assert.equal(h.html.classList.contains('launch-ready'), false);
});

await test('Native navigation exposes the closest chapter and clamps the page progress', async () => {
  const h = createHarness({ reduced: true }); await flush();
  h.setScroll(800);
  assert.equal(h.links[1].getAttribute('aria-current'), 'location');
  assert.equal(h.links[0].getAttribute('aria-current'), null);
  assert.equal(h.progress.style.transform, 'scaleX(0.3333333333333333)');
  h.setScroll(5000); assert.equal(h.progress.style.transform, 'scaleX(1)');
  assert(h.links.every(link => link.getAttribute('aria-current') === null));
});

await test('Idea helper preserves meaning and prepares a service-aware draft without external submission', async () => {
  const module = await import(`data:text/javascript;base64,${Buffer.from(briefsSource).toString('base64')}`);
  assert.equal(module.buildIdeaMessage('  Siti\n web  ', '  Un e-commerce per il nostro laboratorio.  '),
    'Ciao Space Media Studio,\nvorrei parlarvi di un progetto: Siti web.\n\nLa mia idea:\nUn e-commerce per il nostro laboratorio.');
  assert.equal(module.buildIdeaMessage('Branding', '   '), '');
  assert.equal(module.buildIdeaMessage(undefined, 'Un’idea'),
    'Ciao Space Media Studio,\nvorrei parlarvi di un progetto: Un nuovo progetto.\n\nLa mia idea:\nUn’idea');
  assert.equal(module.buildIdeaMessage('Logo', '<script>alert(1)</script>').includes('<script>alert(1)</script>'), true);
});

await test('Brief enhancement counts input, rejects whitespace padding and retains the original field value', async () => {
  const h = createHarness(); await flush(); const form = h.forms[0];
  form.field.value = '          ab'; form.field.emit('input');
  assert.equal(form.field.validity.customError, true); assert.equal(form.count.textContent, '12 / 1200');
  const original = '  Identità per un nuovo caffè.  ';
  form.field.value = original; form.field.emit('input');
  assert.equal(form.field.validity.customError, false);
  const formData = new Map([['text', original]]); form.emit('formdata', { formData });
  assert.equal(form.field.value, original);
  assert(formData.get('text').includes('Branding & identità'));
  assert(formData.get('text').endsWith('Identità per un nuovo caffè.'));
  assert(form.status.textContent.includes('Rileggila'));
  assert.equal(h.historyCalls.length, 0); assert.equal(h.scrolls.length, 0);
});

await test('Brief listeners and temporary custom validity are removed on final disposal', async () => {
  const h = createHarness(); await flush(); const form = h.forms[0];
  form.field.value = 'short'; form.field.emit('input'); assert.equal(form.field.validity.customError, true);
  h.window.emit('pagehide', { persisted: false });
  assert.equal(form.field.validity.customError, false);
  form.field.value = 'changed after cleanup'; form.field.emit('input');
  assert.equal(form.count.textContent, '5 / 1200');
});

console.log(JSON.stringify({ groups: groups.length, source: 'actual src/main.js + src/idea-briefs.js', renderer: 'not allocated', externalNavigation: false }, null, 2));
