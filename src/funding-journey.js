/** Space line film. Original bulb/dossier and Higgsfield vector architecture share one authored timeline. */
import { fundingArtwork } from './funding-artwork.js';
const DURATION = 22;
const PLAYBACK_RATE = 1.5;
const NS = 'http://www.w3.org/2000/svg';
const SCENE_STARTS = [0, 3.1, 7.1, 11.1];
const SCENE_ENDS = [3.1, 7.1, 11.1, 16.65];
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * t * (10 + t * (-15 + 6 * t)); };
const phases = [
  { start: 0, title: 'Ogni progetto comincia così.', key: '01 / L’idea' },
  { start: 4, title: 'La scriviamo. Insieme.', key: '02 / La progettazione' },
  { start: 8, title: 'Le diamo una direzione.', key: '03 / La candidatura' },
  { start: 12, title: 'Per farla diventare reale.', key: '04 / Il progetto' },
];

// [path, start seconds, duration seconds, stroke width]. Fine strokes describe
// materials and perspective; the stronger contours carry the story on a phone.
// Incoming subjects begin before the camera arrives, so a title never meets an
// empty stage. The saved SVG and export recipe document the architectural source.
const scenes = [
  [
    // A glass bulb, its inner filament and machined socket.
    ['M-43 65C-44 24-91 10-91-52C-91-105-51-145 0-145C51-145 91-105 91-52C91 10 44 24 43 65', 0, 1.3, 2.8],
    ['M-44 65H44L38 106L20 118H-20L-38 106L-44 65M-20 118Q0 134 20 118', .75, .8, 2.4],
    ['M-57-94C-71-80-77-59-72-39M-43-106L-37-109M57-94C68-82 74-67 74-53', 1.05, .65, 1.35],
    ['M-24 65L-29-12C-33-41-56-42-56-22C-56-4-34 2-17-10L0-27L17-10C34 2 56-4 56-22C56-42 33-41 29-12L24 65', 1.45, .8, 1.8],
    ['M-27 29H27M-42 79L42 71M-40 91L40 83M-38 103L38 95M-25 115L33 107', 2.05, .55, 1.2],
    ['M-127-87L-146-96M-79-148L-91-167M0-174V-196M79-148L91-167M127-87L146-96', 2.3, .6, 1.65],
    ['M-145 139H-60C-37 139-31 131-24 128M24 128C31 131 37 139 60 139H145M-47 151H47', 2.65, .55, 1.35],
  ],
  [], // Planning is derived from the saved Higgsfield vector artwork below.
  [
    // A structured application: layered dossier, section lines and budget rows.
    ['M-113-113H-89M-113-113V126H78V108M-100-122H-78M-100-122V114H88V99', 7.05, .75, 1.65],
    ['M-81-138H46L98-86V100H-81V-138M46-138V-86H98', 7.3, 1.05, 2.7],
    ['M-53-108H15M-53-95H-6M-53-68H67M-53-55H46', 8.1, .65, 1.45],
    ['M-53-29H-39V-15H-53V-29M-49-23L-46-20L-42-25M-26-26H65M-26-17H40', 8.7, .65, 1.4],
    ['M-53 2H-39V16H-53V2M-49 8L-46 11L-42 6M-26 5H65M-26 14H51', 9.25, .65, 1.4],
    ['M-53 37H25M-53 49H21M-53 61H7M-53 73H15M-10 37V73', 9.75, .65, 1.3],
    ['M101 39C121 39 136 54 136 74C136 94 121 109 101 109C81 109 66 94 66 74C66 54 81 39 101 39M84 75L96 86L118 62', 10.05, .9, 2.1],
    ['M125-49L155-79L164-70L134-40L122-37L125-49M153-77L161-70M126-48L133-41M129-52L150-73', 10.55, .65, 1.5],
    ['M-163-39C-165-84-144-121-128-135M-139-133L-128-135L-128-123M126 127H159M-143 145H120', 11, .6, 1.3],
  ],
  [], // The final pavilion uses the same architecture, with no human figures.
];


// The same drafting object appears first as a plan/plinth and later as a complete
// exploded pavilion. Transforms recompose the saved vector groups without tracing,
// rasterising or discarding their detail. Time is always the film's single clock.
const artworkScenes = {
  1: {
    transform: 'translate(-244.4 -300.8) scale(.47)',
    parts: [
      { name: 'blueprint', start: 3.05, spread: 2.15, duration: .7, guides: [1, 8] },
      { name: 'floor', transform: 'translate(0 -140)', start: 3.15, spread: 2, duration: .75, guides: [1] },
      { name: 'details', start: 4.5, spread: 1.8, duration: .65, guides: [] },
    ],
  },
  3: {
    transform: 'translate(-228.8 -233.2) scale(.44)',
    parts: [
      { name: 'blueprint', start: 11.05, spread: 1.35, duration: .65, guides: [1] },
      { name: 'floor', start: 11.3, spread: 1.5, duration: .75, guides: [1] },
      { name: 'facade', start: 11.65, spread: 2.4, duration: .85, guides: [0] },
      { name: 'roof', start: 12.05, spread: 2.4, duration: .8, guides: [0] },
      { name: 'details', start: 14.2, spread: 1.5, duration: .6, guides: [] },
    ],
  },
};
function architecturalScene(index, guide = false) {
  const scene = artworkScenes[index];
  let markup = `<g transform="${scene.transform}"${guide ? '' : ' data-artwork-source="higgsfield"'}>`;
  for (const part of scene.parts) {
    const shapes = fundingArtwork.groups[part.name];
    markup += `<g${part.transform ? ` transform="${part.transform}"` : ''}>`;
    shapes.forEach((shape, i) => {
      if (guide && !part.guides.includes(i)) return;
      const attrs = { ...shape.attrs };
      // Source artwork is 1024 square; these compensations keep fine details
      // legible after composing it beside the bulb and dossier on a phone.
      attrs['stroke-width'] = guide ? '2.4' : String(Number(Math.max(1.4, Number(attrs['stroke-width'] || 1) * 1.75).toFixed(3)));
      if (guide) { attrs.fill = 'none'; delete attrs['fill-opacity']; }
      const attributes = Object.entries(attrs).map(([key, value]) => ` ${key}="${value}"`).join('');
      const start = Number((part.start + part.spread * i / Math.max(1, shapes.length - 1)).toFixed(3));
      const role = index === 1 && part.name === 'blueprint' && i === 1 ? ' data-draw-role="planning-outline"' : '';
      const fill = !guide && attrs.fill && attrs.fill !== 'none' ? ` data-fill="${attrs['fill-opacity'] || 1}"` : '';
      const draw = guide ? '' : ` pathLength="1" data-artwork="${part.name}-${i}" data-draw="${start},${part.duration}"${role}${fill}`;
      // Group opacity preserves the source's hierarchy when the draw controller
      // temporarily hides an individual shape. Fills themselves reveal gently.
      markup += `${!guide && shape.opacity < 1 ? `<g opacity="${shape.opacity}">` : ''}<${shape.tag}${attributes}${draw}/>${!guide && shape.opacity < 1 ? '</g>' : ''}`;
    });
    markup += '</g>';
  }
  return `${markup}</g>`;
}

function layout(portrait) {
  return portrait
    ? { width: 800, height: 1000, points: [[220, 370], [580, 370], [220, 690], [580, 690]], zoom: 1.9, sceneScale: .85, focusY: 580 }
    : { width: 1600, height: 900, points: [[230, 470], [610, 470], [990, 470], [1370, 470]], zoom: 2, sceneScale: 1, focusY: 522 };
}
// Connection points belong to the actual illustrated ground planes. In
// particular the blueprint plinth ends above the old people/table baseline.
const scenePorts = [
  { out: [145, 139] },
  { in: [-174.4, 105.3], out: [143.4, 121.3] },
  { in: [-143, 145], out: [120, 145] },
  { in: [-163.2, 147] },
];
function connector(a, b, index, vertical, scale) {
  const from = scenePorts[index].out, to = scenePorts[index + 1].in;
  const x1 = a[0] + from[0] * scale, y1 = a[1] + from[1] * scale;
  const x2 = b[0] + to[0] * scale, y2 = b[1] + to[1] * scale;
  if (vertical) return `M${x1} ${y1}C780 ${y1} 780 535 695 535H126Q33 535 33 612V764Q33 ${y2} ${x2} ${y2}`;
  return `M${x1} ${y1}C${x1 + 50 * scale} ${y1} ${x2 - 45 * scale} ${y2} ${x2} ${y2}`;
}
export function fundingJourneySvg(portrait = false, poster = false) {
  const l = layout(portrait);
  let markup = `<svg xmlns="${NS}" viewBox="0 0 ${l.width} ${l.height}" width="${l.width}" height="${l.height}" fill="none" stroke="#101110" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="#dfff00" stroke="none"/><g data-journey-camera>`;
  // Four quiet construction outlines keep the camera's route legible during
  // drawing and the continuous return. The finished ink has the full detail.
  if (!poster) {
    markup += '<g data-journey-guides opacity=".13" stroke-width="1.15">';
    scenes.forEach((scene, i) => {
      const transform = `translate(${l.points[i].join(' ')}) scale(${l.sceneScale})`;
      const contour = i === 2 ? [scene[1]] : scene.slice(0, 2);
      markup += `<g data-journey-guide="${i}" transform="${transform}">${artworkScenes[i] ? architecturalScene(i, true) : `<path d="${contour.map(path => path[0]).join('')}"/>`}</g>`;
    });
    markup += '</g>';
  }
  markup += '<g data-journey-ink>';
  for (let i = 0; i < scenes.length; i++) {
    markup += `<g data-journey-scene="${i}" transform="translate(${l.points[i].join(' ')}) scale(${l.sceneScale})">`;
    if (artworkScenes[i]) markup += architecturalScene(i);
    else scenes[i].forEach(([d, start, duration, width]) => {
      markup += `<path d="${d}" stroke-width="${Number((width * .86).toFixed(3))}" pathLength="1" data-draw="${start},${duration}"/>`;
    });
    markup += '</g>';
    if (i < scenes.length - 1) markup += `<g data-journey-link="${i}"><path d="${connector(l.points[i], l.points[i + 1], i, portrait && i === 1, l.sceneScale)}" data-journey-connector="${i}" pathLength="1" data-draw="${2.8 + i * 4},1.4" stroke-width="1.2"/></g>`;
  }
  markup += `</g></g><rect width="100%" height="${portrait ? 180 : 150}" fill="#dfff00" stroke="none"/><rect y="${portrait ? 855 : 820}" width="100%" height="${portrait ? 145 : 80}" fill="#dfff00" stroke="none"/></svg>`;
  if (poster) markup = markup.replaceAll(/ data-[a-z-]+(?:="[^"]*")?/g, '');
  return markup;
}

function cameraAt(time, l) {
  const centres = l.points;
  const frames = [
    [0, ...centres[0], l.zoom, l.focusY], [3.1, ...centres[0], l.zoom, l.focusY],
    [4.4, ...centres[1], l.zoom, l.focusY], [7.1, ...centres[1], l.zoom, l.focusY],
    [8.4, ...centres[2], l.zoom, l.focusY], [11.1, ...centres[2], l.zoom, l.focusY],
    [12.4, ...centres[3], l.zoom, l.focusY], [16.65, ...centres[3], l.zoom, l.focusY],
    [18.5, l.width / 2, l.height / 2, 1, l.height / 2],
    [20.2, l.width / 2, l.height / 2, 1, l.height / 2],
    [DURATION, ...centres[0], l.zoom, l.focusY],
  ];
  let i = 0;
  while (i < frames.length - 2 && time > frames[i + 1][0]) i++;
  const a = frames[i], b = frames[i + 1], p = ease((time - a[0]) / (b[0] - a[0]));
  const value = index => Number((a[index] + (b[index] - a[index]) * p).toFixed(3));
  return `translate(${l.width / 2} ${value(4)}) scale(${value(3)}) translate(${-value(1)} ${-value(2)})`;
}

export function installFundingJourney({ signal, menu } = {}) {
  const root = document.querySelector('[data-funding-journey]');
  if (!root) return { dispose() {} };
  const section = root.closest('#funding') || root;
  const canvas = root.querySelector('[data-journey-canvas]');
  const button = root.querySelector('[data-journey-toggle]');
  const replay = root.querySelector('[data-journey-replay]');
  const heading = root.querySelector('[data-journey-heading]');
  const step = root.querySelector('[data-journey-step]');
  const rail = [...root.querySelectorAll('[data-journey-phase]')];
  if (!canvas || !button) return { dispose() {} };
  const life = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 760px) and (orientation: portrait)');
  const connection = navigator.connection;
  let svg, camera, ink, paths, sceneNodes, guides, links, l, frame = 0, time = 0, previous = 0;
  let cameraValue, inkValue, clockValue, playingValue;
  const railValues = [];
  let entered = false, userPaused = false, manual = false, disposed = false, suspended = false, phase = -1;
  const automatic = () => !reduced.matches && !connection?.saveData;
  let automaticValue = automatic();
  const pageReady = () => !document.hidden && !suspended && !menu?.open
    && !document.documentElement.classList.contains('entry-pending')
    && !document.documentElement.classList.contains('cinema-open');
  const allowed = () => !disposed && entered && pageReady() && !userPaused && (automatic() || manual);

  function control() {
    const playing = !!frame;
    button.hidden = false;
    if (replay) replay.hidden = false;
    if (playing !== playingValue) {
      root.dataset.journeyPlaying = String(playing);
      button.setAttribute('aria-pressed', String(playing));
      button.setAttribute('aria-label', `${playing ? 'Metti in pausa' : 'Riproduci'} il percorso dall’idea al progetto`);
      playingValue = playing;
    }
  }
  function paint(at, staticFrame = false) {
    // Avoid repeated SVG/style invalidation for the many held frames and paths
    // that are still waiting or already complete. Geometry quality is unchanged.
    const transform = staticFrame ? '' : cameraAt(at, l);
    if (transform !== cameraValue) { camera.setAttribute('transform', transform); cameraValue = transform; }
    const opacity = staticFrame ? '1' : String(Number((1 - ease((at - 20.2) / 1.35)).toFixed(4)));
    if (opacity !== inkValue) { ink.setAttribute('opacity', opacity); inkValue = opacity; }
    paths.forEach(path => {
      const amount = staticFrame ? 1 : ease((at - path.start) / path.duration);
      const offset = String(Number((1 - amount).toFixed(4)));
      if (offset !== path.offset) { path.element.style.strokeDashoffset = offset; path.offset = offset; }
      const visibility = amount > 0 ? '1' : '0';
      if (visibility !== path.visibility) { path.element.style.opacity = visibility; path.visibility = visibility; }
      if (path.fill != null) {
        const fill = String(Number((path.fill * (staticFrame ? 1 : ease((amount - .08) / .86))).toFixed(4)));
        if (fill !== path.fillValue) { path.element.style.fillOpacity = fill; path.fillValue = fill; }
      }
    });
    sceneNodes.forEach((node, i) => {
      // Only the current story and its incoming neighbour occupy the close-up.
      // All four return for the overview; previous scenes cannot cross a title.
      const focus = i === 0 ? 1 - ease((at - SCENE_ENDS[i]) / 1.1)
        : ease((at - SCENE_STARTS[i] + .35) / .8) * (1 - ease((at - SCENE_ENDS[i]) / 1.1));
      const overview = ease((at - 16.65) / 1.85) * (1 - ease((at - 20.2) / 1.2));
      const returning = i === 0 ? ease((at - 20.2) / 1.2) : 0;
      const value = staticFrame ? '1' : String(Number(Math.max(focus, overview, returning).toFixed(4)));
      if (value !== node.value) {
        node.element.setAttribute('opacity', value);
        guides[i]?.setAttribute('opacity', value);
        node.value = value;
      }
    });
    links.forEach((node, i) => {
      const departure = SCENE_ENDS[i];
      const passing = ease((at - departure + .1) / .5) * (1 - ease((at - departure - .55) / .65));
      const overview = ease((at - 16.65) / 1.85) * (1 - ease((at - 20.2) / 1.2));
      const value = staticFrame ? '1' : String(Number(Math.max(passing, overview).toFixed(4)));
      if (value !== node.value) { node.element.setAttribute('opacity', value); node.value = value; }
    });
    const next = staticFrame || (at >= 18.5 && at < 21.2) ? 4 : at >= 21.2 ? 0 : Math.min(3, Math.floor(at / 4));
    if (next !== phase) {
      phase = next;
      if (heading) heading.textContent = next === 4 ? 'Dall’idea alla realtà.' : phases[next].title;
      if (step) step.textContent = next === 4 ? 'SPACE / Progettazione condivisa' : phases[next].key;
      rail.forEach((item, i) => item.dataset.state = next === 4 || i < next ? 'done' : i === next ? 'active' : 'waiting');
      root.dataset.journeyPhaseIndex = String(next);
    }
    rail.forEach((item, i) => {
      const progress = staticFrame ? '1' : at >= 21.2 ? '0' : String(Number(clamp((at - i * 4) / 4).toFixed(4)));
      if (progress !== railValues[i]) { item.style.setProperty('--journey-progress', progress); railValues[i] = progress; }
    });
    // This diagnostic attribute is not a render clock. Ten updates per second
    // are sufficient for inspection and avoid a mutation on every display frame.
    const clock = (Math.floor(at * 10) / 10).toFixed(1);
    if (clock !== clockValue) { root.dataset.journeyTime = clock; clockValue = clock; }
  }
  function build() {
    l = layout(portrait.matches);
    canvas.innerHTML = fundingJourneySvg(portrait.matches);
    svg = canvas.querySelector('svg');
    camera = svg.querySelector('[data-journey-camera]');
    ink = svg.querySelector('[data-journey-ink]');
    sceneNodes = [...svg.querySelectorAll('[data-journey-scene]')].map(element => ({ element }));
    guides = [...svg.querySelectorAll('[data-journey-guide]')];
    links = [...svg.querySelectorAll('[data-journey-link]')].map(element => ({ element }));
    paths = [...svg.querySelectorAll('[data-draw]')].map(element => {
      const [start, duration] = element.dataset.draw.split(',').map(Number);
      element.style.strokeDasharray = '1';
      const fill = element.dataset.fill == null ? null : Number(element.dataset.fill);
      return { element, start, duration, fill };
    });
    cameraValue = inkValue = undefined;
    phase = -1;
    root.dataset.journeyReady = 'true';
    paint(time, !automatic() && !manual);
  }
  function tick(now) {
    frame = 0;
    // Some browsers deliver preference changes after the next animation frame.
    if (automaticValue !== automatic()) { policyChanged(); return; }
    if (!allowed()) { previous = 0; control(); return; }
    if (previous) time = (time + Math.min(.06, (now - previous) / 1000) * PLAYBACK_RATE) % DURATION;
    previous = now;
    paint(time);
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (allowed()) {
      if (!frame) { previous = 0; frame = requestAnimationFrame(tick); }
    } else { cancelAnimationFrame(frame); frame = 0; previous = 0; }
    control();
  }
  function policyChanged() {
    automaticValue = automatic();
    manual = false;
    userPaused = false;
    if (!automatic()) { time = 0; paint(DURATION - 1, true); }
    sync();
  }
  button.addEventListener('click', () => {
    if (frame) { userPaused = true; manual = false; }
    else { entered = true; userPaused = false; manual = true; }
    sync();
  }, { signal: life.signal });
  function restart(fromControl = false) {
    entered = true;
    time = 0; previous = 0; userPaused = false; manual = fromControl;
    paint(time, !automatic() && !manual);
    sync();
  }
  replay?.addEventListener('click', () => restart(true), { signal: life.signal });
  // Start when the section heading arrives, then keep one continuous clock.
  // Scrolling out, back in, or under a stationary pointer cannot pause/rewind it.
  // Explicit controls and page visibility still own pause and replay.
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !entered) { entered = true; sync(); }
  }, { threshold: 0 });
  observer.observe(section);
  build();
  reduced.addEventListener('change', policyChanged, { signal: life.signal });
  connection?.addEventListener?.('change', policyChanged, { signal: life.signal });
  portrait.addEventListener('change', build, { signal: life.signal });
  document.addEventListener('visibilitychange', sync, { signal: life.signal });
  menu?.addEventListener('toggle', sync, { signal: life.signal });
  const entryObserver = new MutationObserver(sync);
  entryObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('pagehide', event => {
    suspended = true; sync();
    if (!event.persisted) dispose();
  }, { signal: life.signal });
  window.addEventListener('pageshow', () => { suspended = false; sync(); }, { signal: life.signal });
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame); frame = 0;
    observer.disconnect(); entryObserver.disconnect();
    life.abort(); signal?.removeEventListener('abort', dispose);
  }
  signal?.addEventListener('abort', dispose, { once: true });
  if (signal?.aborted) dispose();
  return { dispose, refresh: sync };
}
