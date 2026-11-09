/** Original Space line film. Geometry, drawing order and camera are the editable master. */
const DURATION = 22;
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
// empty stage. These are original drawings, not a collection of stock icons.
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
  [
    // Two distinct collaborators, their hands meeting over the same plan.
    ['M-175 86L135 86L173 103H-139L-175 86M-139 103V146M140 103V146M-165 91V134', 3.05, .85, 2.4],
    ['M-144-59C-157-69-159-97-147-118C-136-139-103-145-85-124C-73-112-74-95-71-86L-60-70L-73-66V-51C-74-33-95-29-113-38L-116-16M-143-61L-145-26', 3.25, .9, 2.6],
    ['M-148-91C-138-84-121-89-113-102C-105-89-88-85-74-91M-145-79C-159-86-159-65-146-62M-90-75H-88M-78-53L-91-51', 4.1, .75, 1.4],
    ['M-145-26L-165-8C-178 7-174 43-161 77M-115-16L-97-7L-80 24L-41 44M-145-9L-122 20L-89 47L-43 59M-158 47L-150 81M-121 34L-112 81', 3.55, .85, 2.4],
    ['M-41 44L-28 43L-14 49L-18 54L-30 50L-38 53L-28 58L-30 63L-43 59M-123-6L-111 8L-99-5M-154 105L-148 144M-108 104L-112 144', 4.8, .7, 1.6],
    ['M79-88C59-119 79-145 108-145C143-148 161-126 154-103C166-85 156-51 145-40L146-17M95-37L95-22M81-105C99-103 111-119 114-127C123-108 139-102 151-101', 3.3, .95, 2.6],
    ['M79-88L70-72L82-68V-54C83-36 103-30 117-39M140-82C153-90 157-69 142-65M92-79H94M85-54L99-52M127-126C140-123 148-114 146-103', 4.6, .7, 1.4],
    ['M95-22L77-9L61 19L31 42M146-17L164 1C179 20 174 59 161 83M140-2L117 34L84 56L42 62M141 42L130 82M105 44L97 82M111-22L123-6L140-15', 3.7, .85, 2.4],
    ['M31 42L19 43L8 54L12 58L23 50L33 52L24 59L29 64L42 62M19 46L6 18L11 16L25 44M125 105L122 145M165 106L170 144', 5.2, .7, 1.6],
    ['M-67 78L-47 59H37L65 78H-67M-33 63H2M-42 70H-4M17 64L30 70L21 75L8 69L17 64M-95 73H-78M77 72H93', 5.45, .8, 1.35],
    ['M-38-111Q0-131 38-111M28-121L38-111L27-104M-26-102L-37-111L-26-118', 7, .55, 1.3],
  ],
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
  [
    // A civic building in perspective: an idea becomes a shared, inhabited place.
    ['M-181 143H181M-122 128L33 148L146 117M-122 119L33 139L146 108', 11.05, .75, 1.45],
    ['M-114 117V-56L26-105L26 136M26-105L131-63V112M-114-56L-123-64L25-119L142-72L131-63M-114-45L26-92L131-51', 11.3, 1, 2.6],
    ['M-121-64V-78L25-133L142-86V-72M-105-81L25-128L127-88', 12.05, .75, 1.4],
    ['M-96-34L-72-42V-6L-96 2V-34M-54-48L-30-56V-20L-54-12V-48M-12-62L11-70V-34L-12-26V-62M-84-38V-2M-42-52V-16M0-66V-30', 12.55, .95, 1.65],
    ['M45-77L68-68V-32L45-41V-77M88-60L112-51V-15L88-24V-60M56-73V-37M100-56V-20', 13.05, .8, 1.65],
    ['M-96 25L-72 17V56L-96 63V25M-54 11L-30 3V42L-54 50V11M-96 38L-72 30M-54 24L-30 16M45-15L68-6V29L45 20V-15M88 2L112 11V47L88 38V2', 13.5, .95, 1.55],
    ['M-17 130V44C-17 25 11 16 11 35V134M-3 32V132M1 79V88M43 134V64L68 73V126M55 69V130M84 119V80L112 91V112', 14.1, .8, 1.9],
    ['M-165 135V49M-165 86C-187 83-196 68-185 55C-202 37-187 11-169 20C-157 0-133 11-135 29C-113 33-116 59-134 63C-129 80-146 89-165 86M-165 68L-178 55M-165 62L-149 43', 14.55, .9, 1.75],
    ['M151 112L154 83Q160 75 168 83L172 108M157 68A7 7 0 1 1 171 68A7 7 0 1 1 157 68M154 88L141 97M168 90L179 82M158 113L156 132M167 110L172 129', 15, .85, 1.9],
    ['M-64 125L-61 98Q-55 90-48 98L-44 126M-59 83A7 7 0 1 1-45 83A7 7 0 1 1-59 83M-61 103L-73 111M-47 104L-35 96M-59 127L-62 140M-49 127L-44 142', 15.35, .85, 1.8],
    ['M-93 92L-80 88M-78 100L-65 96M55-150V-168M70-141L83-154M34-148L24-160', 15.8, .7, 1.25],
  ],
];

function layout(portrait) {
  return portrait
    ? { width: 800, height: 1000, points: [[220, 370], [580, 370], [220, 690], [580, 690]], zoom: 1.9, sceneScale: .85, focusY: 580 }
    : { width: 1600, height: 900, points: [[230, 470], [610, 470], [990, 470], [1370, 470]], zoom: 2, sceneScale: 1, focusY: 522 };
}
function connector(a, b, vertical, scale) {
  if (vertical) return `M${a[0] + 173 * scale} ${a[1] + 103 * scale}C780 ${a[1] + 103 * scale} 780 535 695 535H126Q33 535 33 612V764Q33 ${b[1] + 145 * scale} ${b[0] - 143 * scale} ${b[1] + 145 * scale}`;
  return `M${a[0] + 145 * scale} ${a[1] + 139 * scale}C${a[0] + 195 * scale} ${a[1] + 139 * scale} ${b[0] - 210 * scale} ${b[1] + 143 * scale} ${b[0] - 175 * scale} ${b[1] + 143 * scale}`;
}
export function fundingJourneySvg(portrait = false, poster = false) {
  const l = layout(portrait);
  let markup = `<svg xmlns="${NS}" viewBox="0 0 ${l.width} ${l.height}" width="${l.width}" height="${l.height}" fill="none" stroke="#101110" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="#dfff00" stroke="none"/><g data-journey-camera>`;
  // Four quiet construction outlines keep the camera's route legible during
  // drawing and the continuous return. The finished ink has the full detail.
  if (!poster) {
    markup += '<g data-journey-guides opacity=".13" stroke-width="1.15">';
    scenes.forEach((scene, i) => {
      const contour = i === 1 ? [scene[0], scene[1], scene[5]] : i === 2 ? [scene[1]] : i === 3 ? [scene[1]] : [scene[0], scene[1]];
      markup += `<path data-journey-guide="${i}" transform="translate(${l.points[i].join(' ')}) scale(${l.sceneScale})" d="${contour.map(path => path[0]).join('')}"/>`;
    });
    markup += '</g>';
  }
  markup += '<g data-journey-ink>';
  for (let i = 0; i < scenes.length; i++) {
    markup += `<g data-journey-scene="${i}" transform="translate(${l.points[i].join(' ')}) scale(${l.sceneScale})">`;
    scenes[i].forEach(([d, start, duration, width]) => {
      markup += `<path d="${d}" stroke-width="${width}" pathLength="1" data-draw="${start},${duration}"/>`;
    });
    markup += '</g>';
    if (i < scenes.length - 1) markup += `<g data-journey-link="${i}"><path d="${connector(l.points[i], l.points[i + 1], portrait && i === 1, l.sceneScale)}" data-journey-connector="${i}" pathLength="1" data-draw="${2.8 + i * 4},1.4" stroke-width="1.2"/></g>`;
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
  let visible = false, userPaused = false, manual = false, disposed = false, suspended = false, phase = -1;
  const automatic = () => !reduced.matches && !connection?.saveData;
  const pageReady = () => !document.hidden && !suspended && !menu?.open
    && !document.documentElement.classList.contains('entry-pending')
    && !document.documentElement.classList.contains('cinema-open');
  const allowed = () => !disposed && visible && pageReady() && !userPaused && (automatic() || manual);

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
      return { element, start, duration };
    });
    cameraValue = inkValue = undefined;
    phase = -1;
    root.dataset.journeyReady = 'true';
    paint(time, !automatic() && !manual);
  }
  function tick(now) {
    frame = 0;
    if (!allowed()) { previous = 0; control(); return; }
    if (previous) time = (time + Math.min(.06, (now - previous) / 1000)) % DURATION;
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
    manual = false;
    userPaused = false;
    if (!automatic()) { time = 0; paint(DURATION - 1, true); }
    sync();
  }
  button.addEventListener('click', () => {
    if (frame) { userPaused = true; manual = false; }
    else { userPaused = false; manual = true; }
    sync();
  }, { signal: life.signal });
  function restart(fromControl = false) {
    time = 0; previous = 0; userPaused = false; manual = fromControl;
    paint(time, !automatic() && !manual);
    sync();
  }
  replay?.addEventListener('click', () => restart(true), { signal: life.signal });
  // A new visit starts a new drawing. Tiny scroll movements at the viewport
  // edge do not continually reset the scene, and a pause remains in force
  // for the current visit (including opening the menu or changing tabs).
  const observer = new IntersectionObserver(([entry]) => {
    const next = entry.isIntersecting && entry.intersectionRatio > (visible ? .025 : .14);
    if (next && !visible) {
      visible = true;
      restart();
      return;
    }
    visible = next;
    sync();
  }, { threshold: [0, .025, .14, .5, 1] });
  observer.observe(root);
  build();
  // pointerover exposes the actual hit target, so entering through a transport
  // button does not start playback immediately before that button toggles it.
  root.addEventListener('pointerover', event => {
    if (!visible || !automatic() || !['mouse', 'pen'].includes(event.pointerType)
      || root.contains(event.relatedTarget) || event.target.closest?.('button')) return;
    restart();
  }, { signal: life.signal });
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
