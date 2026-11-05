/** Original Space line film. SVG geometry and motion are authored here; no stock assets. */
const DURATION = 22;
const NS = 'http://www.w3.org/2000/svg';
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * t * (10 + t * (-15 + 6 * t)); };
const phases = [
  { start: 0, title: 'Ogni progetto comincia così.', key: '01 / L’idea' },
  { start: 4, title: 'La scriviamo. Insieme.', key: '02 / La progettazione' },
  { start: 8, title: 'Le diamo una direzione.', key: '03 / La candidatura' },
  { start: 12, title: 'Per farla diventare reale.', key: '04 / Il progetto' },
];

// Each path has its own drawing order: the line becomes a recognisable scene,
// rather than revealing a complete icon with an opacity crossfade.
const scenes = [
  [
    ['M-48 59C-48 20-89 11-89-49C-89-105-49-143 0-143C50-143 89-105 89-49C89 11 48 20 48 59', .35, 1.45],
    ['M-47 59H47V77H-47V59M-44 89H44M-36 102H36M-21 114Q0 130 21 114', 1.35, .65],
    ['M-22 57V-12C-22-35-53-44-53-20C-53 7-10 9 0-8C10 9 53 7 53-20C53-44 22-35 22-12V57', 1.9, .75],
    ['M-122-96L-140-111M-64-165L-71-188M0-179V-203M64-165L71-188M122-96L140-111', 2.4, .5],
    ['M-127 122C-112 132-97 133-76 133M76 133C97 133 112 132 127 122', 2.8, .45],
  ],
  [
    ['M-172 90H172M-145 91V133M145 91V133', 4.05, .65],
    ['M-152-21C-164-53-156-96-127-107C-100-117-71-100-75-72L-65-54L-77-50V-37C-77-19-96-11-112-16M-145-82Q-119-72-78-80M-143-20L-152 2', 4.5, .9],
    ['M-152 2C-174 25-164 68-155 90M-110-9L-105 14L-61 38L-18 61M-151 22L-119 57L-64 69L-22 69M-74 46L-88 82', 5.15, .75],
    ['M152-21C164-53 156-96 127-107C100-117 71-100 75-72L65-54L77-50V-37C77-19 96-11 112-16M77-81Q112-115 149-75M143-20L152 2', 5.6, .8],
    ['M152 2C174 25 164 68 155 90M110-9L105 14L61 38L18 61M151 22L119 57L64 69L22 69M74 46L88 82', 6.1, .7],
    ['M-63 78L-42 33H39L63 78H-63M-38 39L-20 77M39 39L20 77M-13 62Q-7 54-1 61Q5 68 11 59M-6 46L-28 10M6 46L28 10', 6.6, .8],
    ['M-43-132C-21-156 20-156 43-132M-23-132L0-111L23-132', 7.2, .45],
  ],
  [
    ['M-120 15V112H120V15M-120 15L0 88L120 15M-119 110L-40 63M119 110L40 63', 8.05, .8],
    ['M-81 36V-124H48L81-91V36M48-124V-91H81', 8.65, .8],
    ['M-50-74H43M-50-52H24M-50-30H43M-50-8H7', 9.35, .8],
    ['M-21 15L-5 31L26 0', 10.1, .45],
    ['M-153-87C-156-143-102-180-52-179M122-127C167-104 179-58 164-13', 10.55, .55],
    ['M122-127L127-104M122-127L145-133M164-13L148-31M164-13L184-26', 11.1, .45],
    ['M-76 136H76', 11.5, .25],
  ],
  [
    ['M-176 129H176', 12.15, .5],
    ['M-112 127V-49L0-111L112-49V127M-112-49H112M-125-43L0-130L125-43', 12.6, 1.05],
    ['M-22 127V51H22V127M-77-23H-42V14H-77V-23M42-23H77V14H42V-23M-77 51H-42V88H-77V51M42 51H77V88H42V51', 13.5, 1.1],
    ['M-23-53Q0-80 23-53Q0-29-23-53M0-67V-39', 14.2, .6],
    ['M-150 125V36M-150 79C-191 69-192 43-167 33C-191 7-164-16-150-3C-132-21-105 9-128 29C-103 49-121 73-150 79', 14.75, .7],
    ['M131 129L134 96Q143 82 151 96L155 129M136 77A9 9 0 1 1 154 77A9 9 0 1 1 136 77M129 104L111 112M158 103L174 93', 15.2, .65],
    ['M-55 128Q-61 109-51 97Q-44 90-36 98L-29 128M-54 81A9 9 0 1 1-36 81A9 9 0 1 1-54 81M-58 104L-72 96', 15.75, .65],
    ['M-35-165L-19-181M0-177V-201M35-165L51-181', 16.2, .45],
  ],
];

function layout(portrait) {
  return portrait
    ? { width: 800, height: 1000, points: [[220, 370], [580, 370], [220, 700], [580, 700]], zoom: 1.95, sceneScale: .85 }
    : { width: 1600, height: 900, points: [[230, 470], [610, 470], [990, 470], [1370, 470]], zoom: 2, sceneScale: 1 };
}
function connector(a, b, vertical, scale) {
  if (vertical) return `M${a[0] + 130 * scale} ${a[1] + 133 * scale}C770 ${a[1] + 133 * scale} 775 500 700 500H120Q20 500 20 600V720Q20 ${b[1] + 90 * scale} ${b[0] - 172 * scale} ${b[1] + 90 * scale}`;
  return `M${a[0] + 127 * scale} ${a[1] + 133 * scale}C${a[0] + 190 * scale} ${a[1] + 133 * scale} ${b[0] - 210 * scale} ${b[1] + 90 * scale} ${b[0] - 172 * scale} ${b[1] + 90 * scale}`;
}
export function fundingJourneySvg(portrait = false, poster = false) {
  const l = layout(portrait);
  let markup = `<svg xmlns="${NS}" viewBox="0 0 ${l.width} ${l.height}" width="${l.width}" height="${l.height}" fill="none" stroke="#101110" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect width="100%" height="100%" fill="#dfff00" stroke="none"/><g data-journey-camera>`;
  for (let i = 0; i < scenes.length; i++) {
    const point = l.points[i];
    markup += `<g data-journey-scene="${i}" transform="translate(${point.join(' ')}) scale(${l.sceneScale})">`;
    scenes[i].forEach(([d, start, duration]) => {
      markup += `<path d="${d}" pathLength="1" data-draw="${start},${duration}"/>`;
    });
    markup += '</g>';
    if (i < scenes.length - 1) markup += `<path d="${connector(point, l.points[i + 1], portrait && i === 1, l.sceneScale)}" data-journey-connector="${i}" pathLength="1" data-draw="${3.35 + i * 4},1.05" stroke-width="1.5"/>`;
  }
  markup += '</g></svg>';
  if (poster) markup = markup.replaceAll(/ data-[a-z-]+(?:="[^"]*")?/g, '');
  return markup;
}

function cameraAt(time, l) {
  const centres = l.points;
  const frames = [
    [0, ...centres[0], l.zoom], [3.15, ...centres[0], l.zoom],
    [4.55, ...centres[1], l.zoom], [7.15, ...centres[1], l.zoom],
    [8.55, ...centres[2], l.zoom], [11.15, ...centres[2], l.zoom],
    [12.55, ...centres[3], l.zoom], [16.65, ...centres[3], l.zoom],
    [18.5, l.width / 2, l.height / 2, 1], [DURATION, l.width / 2, l.height / 2, 1],
  ];
  let i = 0;
  while (i < frames.length - 2 && time > frames[i + 1][0]) i++;
  const a = frames[i], b = frames[i + 1], p = ease((time - a[0]) / (b[0] - a[0]));
  const x = a[1] + (b[1] - a[1]) * p, y = a[2] + (b[2] - a[2]) * p, z = a[3] + (b[3] - a[3]) * p;
  const screenY = l.height * (.58 - .08 * ease((time - 16.65) / 1.85));
  return `translate(${l.width / 2} ${screenY}) scale(${z}) translate(${-x} ${-y})`;
}

export function installFundingJourney({ signal, menu } = {}) {
  const root = document.querySelector('[data-funding-journey]');
  if (!root) return { dispose() {} };
  const canvas = root.querySelector('[data-journey-canvas]');
  const button = root.querySelector('[data-journey-toggle]');
  const heading = root.querySelector('[data-journey-heading]');
  const step = root.querySelector('[data-journey-step]');
  const rail = [...root.querySelectorAll('[data-journey-phase]')];
  if (!canvas || !button) return { dispose() {} };
  const life = new AbortController();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const portrait = matchMedia('(max-width: 760px) and (orientation: portrait)');
  const connection = navigator.connection;
  let svg, camera, paths, l, frame = 0, time = 0, previous = 0;
  let visible = false, userPaused = false, manual = false, disposed = false, suspended = false, phase = -1;
  const automatic = () => !reduced.matches && !connection?.saveData;
  const pageReady = () => !document.hidden && !suspended && !menu?.open && !document.documentElement.classList.contains('entry-pending');
  const allowed = () => !disposed && visible && pageReady() && !userPaused && (automatic() || manual);

  function control() {
    const playing = !!frame;
    button.hidden = false;
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', `${playing ? 'Metti in pausa' : 'Riproduci'} il percorso dall’idea al progetto`);
    button.querySelector('[data-journey-symbol]').textContent = playing ? 'Ⅱ' : '▷';
  }
  function paint(at, staticFrame = false) {
    const fade = staticFrame ? 1 : 1 - ease((at - 21.1) / .9);
    camera.setAttribute('opacity', fade.toFixed(4));
    camera.setAttribute('transform', staticFrame ? '' : cameraAt(at, l));
    paths.forEach(({ element, start, duration }) => {
      const amount = staticFrame ? 1 : ease((at - start) / duration);
      element.style.strokeDashoffset = String(1 - amount);
      element.style.opacity = amount > 0 ? '1' : '0';
    });
    const next = staticFrame || at >= 18.5 ? 4 : Math.min(3, Math.floor(at / 4));
    if (next !== phase) {
      phase = next;
      if (heading) heading.textContent = next === 4 ? 'Dall’idea alla realtà.' : phases[next].title;
      if (step) step.textContent = next === 4 ? 'SPACE / Progettazione condivisa' : phases[next].key;
      rail.forEach((item, i) => item.dataset.state = next === 4 || i < next ? 'done' : i === next ? 'active' : 'waiting');
      root.dataset.journeyPhaseIndex = String(next);
    }
    rail.forEach((item, i) => item.style.setProperty('--journey-progress', staticFrame ? '1' : clamp((at - i * 4) / 4).toFixed(4)));
    root.dataset.journeyTime = at.toFixed(2);
  }
  function build() {
    l = layout(portrait.matches);
    canvas.innerHTML = fundingJourneySvg(portrait.matches);
    svg = canvas.querySelector('svg');
    camera = svg.querySelector('[data-journey-camera]');
    paths = [...svg.querySelectorAll('[data-draw]')].map(element => {
      const [start, duration] = element.dataset.draw.split(',').map(Number);
      element.style.strokeDasharray = '1';
      return { element, start, duration };
    });
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
    if (!automatic()) { time = 0; paint(DURATION - 1, true); }
    sync();
  }
  button.addEventListener('click', () => {
    if (frame) { userPaused = true; manual = false; }
    else { userPaused = false; manual = true; }
    sync();
  }, { signal: life.signal });
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio > .14;
    sync();
  }, { threshold: [0, .14, .5, 1] });
  observer.observe(root);
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
