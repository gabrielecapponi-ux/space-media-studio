import { installIdeaBriefs } from './idea-briefs.js';
import { installCinemaViewer } from './cinema-viewer.js';
import { createMobileStudio } from './atelier-mobile-entry.js';
import { createAtelierEntry } from './atelier-entry.js';
import { installAtelierCinema } from './atelier-cinema.js';
import './atelier-cinema.css';
import { installWebReel } from './web-reel.js';
import { installFundingJourney } from './funding-journey.js';
import { installOskenMotion } from './atelier-osken-motion.js';
import './funding-journey.css';
import { installMobileNavigation } from './mobile-navigation.js';
import './mobile-polish.css';
import './cinematic-polish.css';

const lifetime = new AbortController();
const { signal } = lifetime;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
const portrait = matchMedia('(max-width: 1024px) and (orientation: portrait)');
const film = document.querySelector('#atelier-film');
const toggle = document.querySelector('#atelier-film-toggle');
const replay = document.querySelector('#atelier-film-replay');
const startFilm = document.querySelector('[data-water-start]');
const stage = document.querySelector('.flagship-water-stage');
const menu = document.querySelector('.atelier-mobile-menu');
const hero = document.querySelector('.atelier-hero');
const base = import.meta.env.BASE_URL;
let entryFinished = false;
let heroHandoffComplete = false;
let inHero = !location.hash;
let userPaused = false;
let manualPlayback = false;
let playPending = false;
let playInterrupted = false;
let autoplayBlocked = false;
let heroVisit = 0;
let resumeTime = 0;
let disposed = false;
let suspended = false;
let entry;
installMobileNavigation({ signal, menu });
installAtelierCinema({ signal, menu });
installWebReel({ signal });
installFundingJourney({ signal, menu });

installIdeaBriefs({ signal });
installCinemaViewer({ signal });
installOskenMotion({ signal, menu });
document.querySelectorAll('[data-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });
const automaticMotion = () => !reduced.matches && !connection?.saveData;
const scrollRestorationBefore = history.scrollRestoration;
if (automaticMotion()) {
  history.scrollRestoration = 'manual';
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}
const selectedPoster = () => `${base}images/director-water-${portrait.matches ? 'mobile' : 'desktop'}.webp`;
function syncPoster() {
  const next = new URL(selectedPoster(), document.baseURI).href;
  if (film.poster !== next) film.poster = next;
}
syncPoster();
film.muted = true; film.defaultMuted = true;
film.playsInline = true; film.autoplay = false;

function selectedProfile() {
  // Keep the photographic master on desktop even when the browser window is
  // smaller than 4K. High-density portrait screens use the native UHD crop.
  if (portrait.matches) return 'mobile';
  return matchMedia('(pointer: coarse)').matches ? 'hd' : 'desktop';
}

const entryProfile = selectedProfile();
function ensureSource(profile = heroHandoffComplete ? selectedProfile() : entryProfile) {
  if (film.getAttribute('src') && film.dataset.profile === profile) return;
  if (film.readyState >= 1) resumeTime = film.currentTime;
  if (playPending) playInterrupted = true;
  film.dataset.profile = profile;
  film.src = profile === 'phone' ? `${base}films/director-water-mobile.mp4` : `${base}films/flagship-water-${profile}.mp4`;
  film.preload = 'auto';
  film.load();
}

function syncControl() {
  const failed = Boolean(film.error);
  const playing = !failed && !film.paused && !film.ended;
  const loading = !failed && playPending && film.readyState < 2;
  if (toggle.hidden !== !entryFinished) toggle.hidden = !entryFinished;
  if (replay.hidden !== !entryFinished) replay.hidden = !entryFinished;
  const startHidden = !entryFinished || !autoplayBlocked || playing;
  if (startFilm && startFilm.hidden !== startHidden) startFilm.hidden = startHidden;
  const label = failed ? 'Riprova a riprodurre il film' : loading ? 'Interrompi il caricamento del film' : playing ? 'Metti in pausa il film' : 'Riproduci il film';
  if (toggle.getAttribute('aria-label') !== label) toggle.setAttribute('aria-label', label);
  if (toggle.getAttribute('aria-pressed') !== String(playing)) toggle.setAttribute('aria-pressed', String(playing));
  const symbol = toggle.querySelector('[data-film-symbol]');
  const caption = toggle.querySelector('[data-film-label]');
  const nextSymbol = failed ? '↻' : playing || loading ? 'Ⅱ' : '▷';
  const nextCaption = failed ? 'Riprova' : loading ? 'Attendi' : playing ? 'Pausa' : 'Riproduci';
  if (symbol.textContent !== nextSymbol) symbol.textContent = nextSymbol;
  if (caption.textContent !== nextCaption) caption.textContent = nextCaption;
}

const mayPlayHero = () => !disposed && entryFinished && !suspended && !document.hidden && inHero
  && !menu.open && !document.documentElement.classList.contains('cinema-open')
  && !userPaused && (automaticMotion() || manualPlayback);

async function syncPlayback() {
  if (disposed) return;
  const permitted = mayPlayHero();
  const autoplay = Boolean(permitted && automaticMotion() && !autoplayBlocked && !film.error);
  if (film.autoplay !== autoplay) film.autoplay = autoplay;
  if (!permitted) {
    if (playPending) playInterrupted = true;
    film.pause(); syncControl(); return;
  }
  if (autoplayBlocked || film.error) { syncControl(); return; }
  if (playPending || !film.paused) {
    if (playPending && film.paused) playInterrupted = true;
    syncControl(); return;
  }
  ensureSource();
  // Keep native muted autoplay armed through metadata discovery. A manual
  // request still calls play() in the originating user gesture.
  if (!manualPlayback && film.readyState < 2) { syncControl(); return; }
  playPending = true; playInterrupted = false;
  const attempt = heroVisit;
  try { await film.play(); }
  catch (error) {
    if (attempt === heroVisit) autoplayBlocked = error?.name === 'NotAllowedError';
    if (autoplayBlocked) film.autoplay = false;
  }
  finally {
    playPending = false;
    const resume = playInterrupted && mayPlayHero() && film.paused && !autoplayBlocked && !film.error;
    playInterrupted = false;
    if (!mayPlayHero()) film.pause();
    if (!disposed) syncControl();
    if (resume) syncPlayback();
  }
}

film.addEventListener('play', () => {
  if (!mayPlayHero()) film.pause();
  syncControl();
}, { signal });
for (const type of ['pause', 'ended']) film.addEventListener(type, syncControl, { signal });
for (const type of ['loadeddata', 'canplay']) film.addEventListener(type, () => {
  const ready = String(film.readyState >= 2 && !film.error);
  if (hero.dataset.frame !== ready) hero.dataset.frame = ready;
  syncPlayback();
}, { signal });
for (const type of ['emptied', 'error']) film.addEventListener(type, () => {
  if (type === 'error') { film.autoplay = false; film.pause(); }
  hero.dataset.frame = 'false';
  syncControl();
}, { signal });

// Impact is frame 25 of the 24 fps edit. Follow the presented media clock on
// playback and replay so timeupdate coalescing cannot delay the title.
const impactTime = 25 / 24;
let impactCallback = 0;
function cancelImpact() {
  if (impactCallback) film.cancelVideoFrameCallback(impactCallback);
  impactCallback = 0;
}
function markImpact(time) {
  if (time + .001 >= impactTime && entryFinished && automaticMotion() && hero.dataset.impact !== 'true') hero.dataset.impact = 'true';
}
function watchImpact() {
  if (impactCallback || !film.requestVideoFrameCallback || !automaticMotion() ||
      film.paused || hero.dataset.impact === 'true') return;
  impactCallback = film.requestVideoFrameCallback((_, frame) => {
    impactCallback = 0;
    markImpact(frame.mediaTime);
    watchImpact();
  });
}
film.addEventListener('playing', watchImpact, { signal });
film.addEventListener('playing', () => {
  if (!entryFinished || heroHandoffComplete) return;
  heroHandoffComplete = true;
  scheduleProfileCheck();
}, { signal });
film.addEventListener('seeked', watchImpact, { signal });
film.addEventListener('pause', cancelImpact, { signal });
film.addEventListener('emptied', cancelImpact, { signal });
if (!film.requestVideoFrameCallback) film.addEventListener('timeupdate', () => markImpact(film.currentTime), { signal });
function restartHero(manual = false) {
  if (!entryFinished || (!manual && !automaticMotion())) return;
  heroVisit++;
  manualPlayback = manual;
  userPaused = false;
  autoplayBlocked = false;
  if (playPending) playInterrupted = true;
  film.pause();
  cancelImpact();
  hero.dataset.impact = 'false';
  if (film.error) film.load();
  ensureSource();
  resumeTime = 0;
  if (film.readyState >= 1 && film.currentTime !== 0) film.currentTime = 0;
  syncPlayback();
}
replay.addEventListener('click', () => restartHero(true), { signal });
startFilm?.addEventListener('click', () => restartHero(true), { signal });
stage.addEventListener('pointerover', event => {
  // Keep the blocked-play affordance stable until its actual click/tap.
  if (autoplayBlocked || stage.contains(event.relatedTarget) || event.target.closest?.('button')) return;
  if (['mouse', 'pen'].includes(event.pointerType)) restartHero();
}, { signal });
function recoverHeroFromGesture(event) {
  if (!event.isTrusted || !autoplayBlocked || !mayPlayHero()) return;
  if (event.target?.closest?.('[data-media-toggle], .atelier-cinema-open, #atelier-film-toggle, #atelier-film-replay, [data-water-start]')) return;
  autoplayBlocked = false;
  manualPlayback = true;
  syncPlayback();
}
document.addEventListener('pointerdown', recoverHeroFromGesture, { signal });
document.addEventListener('keydown', recoverHeroFromGesture, { signal });
toggle.addEventListener('click', () => {
  // A failed WebKit resource may still report paused=false. Error recovery
  // takes precedence so one click retries the film in this trusted gesture.
  if (!film.error && (!film.paused || playPending)) { userPaused = true; manualPlayback = false; }
  else {
    userPaused = false; manualPlayback = true; autoplayBlocked = false;
    if (film.error) film.load();
  }
  syncPlayback();
}, { signal });
menu.addEventListener('toggle', syncPlayback, { signal });
film.addEventListener('loadedmetadata', () => {
  if (resumeTime > 0 && Number.isFinite(film.duration)) {
    film.currentTime = Math.min(resumeTime, Math.max(0, film.duration - .05));
    resumeTime = 0;
  }
}, { signal });
let profileTimer = 0;
function scheduleProfileCheck() {
  clearTimeout(profileTimer);
  profileTimer = setTimeout(() => {
    syncPoster();
    // The decoded frame approved by the loader must survive the handoff.
    // Apply a rotation/resize only after that film has actually started.
    if (!entryFinished || !heroHandoffComplete) return;
    if (!film.getAttribute('src') || (!mayPlayHero() && (entryFinished || !automaticMotion()))) return;
    const next = selectedProfile();
    if (film.dataset.profile === next) return;
    ensureSource(next);
    syncPlayback();
  }, 180);
}
const apertureObserver = new ResizeObserver(scheduleProfileCheck);
apertureObserver.observe(stage);
portrait.addEventListener('change', scheduleProfileCheck, { signal });
window.addEventListener('resize', scheduleProfileCheck, { signal });
function policyChanged() {
  manualPlayback = false;
  if (!automaticMotion()) cancelImpact();
  syncPlayback();
}
reduced.addEventListener('change', policyChanged, { signal });
connection?.addEventListener?.('change', policyChanged, { signal });
document.addEventListener('visibilitychange', syncPlayback, { signal });
const playbackObserver = new MutationObserver(syncPlayback);
playbackObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

const visibility = new IntersectionObserver(([item]) => {
  const wasVisible = inHero;
  inHero = item.isIntersecting && item.intersectionRatio > (inHero ? .025 : .14);
  if (inHero && !wasVisible && entryFinished) restartHero();
  else syncPlayback();
}, { threshold: [0, .025, .14, .5] });
visibility.observe(stage);

function openIdeaFromHash() {
  let key;
  try { key = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const target = document.getElementById(key);
  if (target?.matches('details.atelier-brief')) target.open = true;
}
window.addEventListener('hashchange', openIdeaFromHash, { signal });
openIdeaFromHash();

// Sample the real masthead and aperture once, when painting the studio monitor.
// Its final framing follows the same responsive layout as the incoming page.
function drawScreen(ctx, width, height, aspect, poster) {
  ctx.fillStyle = '#090b0b';
  ctx.fillRect(0, 0, width, height);
  const visibleWidth = Math.min(width, height * aspect);
  const visibleHeight = visibleWidth / aspect;
  const left = (width - visibleWidth) / 2;
  const textureTop = (height - visibleHeight) / 2;
  const scale = visibleWidth / hero.clientWidth;
  const top = hero.getBoundingClientRect().top;
  ctx.save();
  ctx.beginPath();
  ctx.rect(left, textureTop, visibleWidth, visibleHeight);
  ctx.clip();
  ctx.translate(left, textureTop);
  ctx.scale(scale, scale);
  ctx.translate(0, -top);
  const aperture = stage.getBoundingClientRect();
  ctx.fillStyle = getComputedStyle(stage).backgroundColor;
  ctx.fillRect(aperture.x, aperture.y, aperture.width, aperture.height);
  if (poster?.naturalWidth) {
    const factor = Math.min(aperture.width / poster.naturalWidth, aperture.height / poster.naturalHeight);
    const w = poster.naturalWidth * factor;
    const h = poster.naturalHeight * factor;
    const x = aperture.x + (aperture.width - w) / 2;
    const y = aperture.y + (aperture.height - h) / 2;
    ctx.drawImage(poster, x, y, w, h);
  }
  const brandIcon = document.querySelector('.atelier-symbol').getBoundingClientRect();
  ctx.save();
  ctx.translate(brandIcon.x, brandIcon.y);
  ctx.scale(brandIcon.width / 48, brandIcon.height / 48);
  ctx.fillStyle = '#dfff00';
  ctx.fill(new Path2D('M24 2 30 18 46 24 30 30 24 46 18 30 2 24 18 18Z'));
  ctx.fillStyle = '#090b0b';
  ctx.beginPath(); ctx.arc(24, 24, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  const contact = document.querySelector('.atelier-contact-link').getBoundingClientRect();
  if (contact.width) {
    ctx.fillStyle = '#dfff00';
    ctx.beginPath();
    ctx.roundRect(contact.x, contact.y, contact.width, contact.height, contact.height / 2);
    ctx.fill();
  }
  // Draw individual text runs so the logo and headline use their live spacing.
  for (const selector of ['.atelier-brand > span', '.atelier-brand small', '.flagship-location',
    '#atelier-title > *', '.atelier-nav a', '.atelier-contact-link', '.atelier-mobile-menu summary span', '.atelier-hero-promise']) {
    for (const el of document.querySelectorAll(selector)) {
      const run = [...el.childNodes].find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if (!run || !el.getClientRects().length) continue;
      const range = document.createRange();
      range.selectNodeContents(run);
      const rects = range.getClientRects();
      if (rects.length !== 1) continue;
      const rect = rects[0];
      const style = getComputedStyle(el);
      ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      ctx.fillStyle = style.color;
      ctx.textBaseline = 'alphabetic';
      const metrics = ctx.measureText(run.textContent.trim());
      const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * .82;
      const descent = metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * .18;
      const baseline = rect.y + (rect.height + ascent - descent) / 2;
      ctx.save();
      ctx.translate(rect.x, baseline);
      ctx.scale(rect.width / Math.max(1, metrics.width), 1);
      ctx.fillText(run.textContent.trim(), 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}

function revealPage() {
  if (disposed) return;
  document.documentElement.classList.remove('entry-boot');
  clearTimeout(window.__spaceEntryWatchdog);
  entryFinished = true;
  // A deep link still receives the complete entrance, then opens its target.
  window.__spaceRestoreEntryHash?.();
  openIdeaFromHash();
  if (location.hash) {
    try { document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ behavior: 'instant' }); } catch {}
  }
  syncPlayback();
}

try {
  const touch = matchMedia('(pointer: coarse)').matches;
  if (!automaticMotion()) {
    document.documentElement.dataset.entryState = 'ready';
    revealPage();
  } else if (portrait.matches || touch) {
    entry = createMobileStudio({
      signal, video: film, stage, controls: document.querySelector('.flagship-film-controls'), base, preference: reduced, portrait,
      prepareWater: ensureSource, onComplete: revealPage,
    });
  } else {
    entry = createAtelierEntry({
      signal, video: film, startAt: 0, drawScreen, prepareVideo: ensureSource,
      poster: `${base}images/flagship-water-entry-desktop.jpg`, onComplete: revealPage,
      async loadModel(signal) {
        const response = await fetch(`${base}models/studio-space-20261105.glb`, { signal });
        if (!response.ok) throw new Error('Studio model unavailable');
        return response.arrayBuffer();
      },
    });
  }
} catch {
  revealPage();
}
window.addEventListener('pageshow', () => { suspended = false; syncPlayback(); }, { signal });
window.addEventListener('pagehide', event => {
  history.scrollRestoration = scrollRestorationBefore;
  suspended = true;
  if (playPending) playInterrupted = true;
  film.autoplay = false; film.pause();
  if (event.persisted) return;
  disposed = true;
  cancelImpact();
  entry?.dispose();
  clearTimeout(profileTimer);
  apertureObserver.disconnect();
  visibility.disconnect();
  playbackObserver.disconnect();
  lifetime.abort();
}, { signal });
syncControl();
