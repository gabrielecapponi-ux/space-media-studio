import { installIdeaBriefs } from './idea-briefs.js';
import { createAtelierEntry } from './atelier-entry.js';
import { installAtelierCinema } from './atelier-cinema.js';
import './atelier-cinema.css';

const lifetime = new AbortController();
const { signal } = lifetime;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
const portrait = matchMedia('(max-width: 760px) and (orientation: portrait)');
const film = document.querySelector('#atelier-film');
const toggle = document.querySelector('#atelier-film-toggle');
const menu = document.querySelector('.atelier-mobile-menu');
const hero = document.querySelector('.atelier-hero');
const base = import.meta.env.BASE_URL;
let entryFinished = false;
let inHero = true;
let userPaused = false;
let manualPlayback = false;
let playPending = false;
let disposed = false;
let suspended = false;
let entry;
installAtelierCinema({ signal, menu });

installIdeaBriefs({ signal });
document.querySelectorAll('[data-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });
const automaticMotion = () => !reduced.matches && !connection?.saveData;
const selectedPoster = () => `${base}images/atelier-water-${portrait.matches ? 'mobile' : 'desktop'}.jpg`;
film.poster = selectedPoster();
film.muted = true;

function ensureSource() {
  if (film.getAttribute('src')) return;
  film.src = `${base}films/atelier-water-${portrait.matches ? 'mobile' : 'desktop'}.mp4`;
  film.preload = 'auto';
  film.load();
}
if (automaticMotion()) ensureSource();

function syncControl() {
  const playing = !film.paused && !film.ended;
  toggle.hidden = !entryFinished;
  toggle.setAttribute('aria-label', playing ? 'Metti in pausa il film' : 'Riproduci il film');
  toggle.setAttribute('aria-pressed', String(playing));
  toggle.querySelector('[data-film-symbol]').textContent = playing ? 'Ⅱ' : '▷';
  toggle.querySelector('[data-film-label]').textContent = playing ? 'Pausa' : 'Riproduci';
}

async function syncPlayback() {
  if (disposed) return;
  const permitted = entryFinished && !suspended && !document.hidden && inHero
    && !menu.open && !userPaused && (automaticMotion() || manualPlayback);
  if (!permitted) { film.pause(); syncControl(); return; }
  if (playPending || !film.paused) { syncControl(); return; }
  ensureSource();
  playPending = true;
  try { await film.play(); }
  catch { /* Autoplay refusal keeps the real poster and the manual control. */ }
  finally {
    playPending = false;
    if (disposed || !entryFinished || suspended || document.hidden || !inHero || menu.open || userPaused
      || !(automaticMotion() || manualPlayback)) film.pause();
    if (!disposed) syncControl();
  }
}

for (const type of ['play', 'pause', 'ended', 'error']) film.addEventListener(type, syncControl, { signal });
film.addEventListener('loadedmetadata', () => {
  // Entry prepares this frame for automatic motion. A later explicit play
  // from a static arrival gets the same starting composition.
  if (entryFinished && !film.dataset.entryPreparedAt && Number.isFinite(film.duration)) {
    try { film.currentTime = Math.min(4.6, Math.max(0, film.duration - .05)); }
    catch { /* Keep the native media controls usable if seeking is refused. */ }
  }
}, { signal });
toggle.addEventListener('click', () => {
  if (!film.paused || playPending) { userPaused = true; manualPlayback = false; }
  else { userPaused = false; manualPlayback = true; }
  syncPlayback();
}, { signal });
menu.addEventListener('toggle', syncPlayback, { signal });
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }, { signal }));
portrait.addEventListener('change', () => { if (!film.getAttribute('src')) film.poster = selectedPoster(); }, { signal });
function policyChanged() {
  manualPlayback = false;
  syncPlayback();
}
reduced.addEventListener('change', policyChanged, { signal });
connection?.addEventListener?.('change', policyChanged, { signal });
document.addEventListener('visibilitychange', syncPlayback, { signal });

const visibility = new IntersectionObserver(([item]) => {
  inHero = item.isIntersecting && item.intersectionRatio > .18;
  syncPlayback();
}, { threshold: [0, .18, .5] });
visibility.observe(hero);

function openIdeaFromHash() {
  let key;
  try { key = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(key);
  if (target?.matches('details.atelier-brief')) target.open = true;
}
window.addEventListener('hashchange', openIdeaFromHash, { signal });
openIdeaFromHash();

// The monitor shows the same photographic direction as the incoming page.
// It remains an illustration of this fictional studio, not a real office.
function drawScreen(ctx, width, height, aspect, poster) {
  ctx.fillStyle = '#080909'; ctx.fillRect(0, 0, width, height);
  const viewWidth = Math.min(width, height * aspect);
  const left = (width - viewWidth) / 2;
  const narrow = innerWidth <= 640;
  ctx.save(); ctx.beginPath(); ctx.rect(left, 0, viewWidth, height); ctx.clip();
  if (poster?.naturalWidth) {
    const scale = Math.max(viewWidth / poster.naturalWidth, height / poster.naturalHeight);
    const enlargement = narrow ? 1 : 1.12;
    const w = poster.naturalWidth * scale * enlargement, h = poster.naturalHeight * scale * enlargement;
    ctx.globalAlpha = .8;
    ctx.drawImage(poster, left + (viewWidth - w) / 2 + (narrow ? 0 : viewWidth * .09), (height - h) / 2, w, h);
    ctx.globalAlpha = 1;
  }
  const shade = ctx.createLinearGradient(0, 0, 0, height);
  shade.addColorStop(0, '#08090955'); shade.addColorStop(.3, '#08090900'); shade.addColorStop(1, '#080909ee');
  ctx.fillStyle = shade; ctx.fillRect(left, 0, viewWidth, height);
  const gutter = viewWidth * (narrow ? .0615 : .047);
  ctx.fillStyle = '#efeee8'; ctx.font = `600 ${viewWidth * .038}px "Space Grotesk", Arial, sans-serif`;
  ctx.fillText('space', left + gutter, height * .085);
  ctx.font = `${Math.max(10, viewWidth * .011)}px "DM Mono", monospace`;
  ctx.fillText('STUDIO CREATIVO / PARMA', left + gutter, height * (narrow ? .58 : .39));
  let size = viewWidth * (narrow ? .154 : .105);
  ctx.font = `500 ${size}px "Space Grotesk", Arial, sans-serif`;
  while (ctx.measureText('Brand. Web.').width > viewWidth - gutter * 2) {
    size -= 1; ctx.font = `500 ${size}px "Space Grotesk", Arial, sans-serif`;
  }
  const titleY = height * (narrow ? .665 : .57);
  ctx.fillText('Brand. Web.', left + gutter, titleY);
  ctx.fillStyle = '#dfff00'; ctx.fillText('Motion.', left + gutter, titleY + size * (narrow ? .91 : .88));
  ctx.fillStyle = '#efeee8'; ctx.font = `${Math.max(16, viewWidth * .016)}px "Space Grotesk", Arial, sans-serif`;
  ctx.fillText('Identità, siti ed esperienze digitali.', left + gutter, height * (narrow ? .795 : .82));
  ctx.restore();
}

try {
  entry = createAtelierEntry({
    signal, video: film, poster: film.poster, drawScreen,
    onComplete() { if (!disposed) { entryFinished = true; syncPlayback(); } },
  });
} catch {
  entryFinished = true;
  syncPlayback();
}
window.addEventListener('pageshow', () => { suspended = false; syncPlayback(); }, { signal });
window.addEventListener('pagehide', event => {
  suspended = true;
  film.pause();
  if (event.persisted) return;
  disposed = true;
  entry?.dispose();
  visibility.disconnect();
  lifetime.abort();
}, { signal });
syncControl();
