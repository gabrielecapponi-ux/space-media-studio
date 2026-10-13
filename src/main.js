import { installIdeaBriefs } from './idea-briefs.js';

const root = document.documentElement;
const lifetime = new AbortController();
const { signal } = lifetime;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;
const menu = document.querySelector('#menu-dialog');
const menuToggle = document.querySelector('.menu-toggle');
const motionToggle = document.querySelector('#motion-toggle');
const projectDialog = document.querySelector('#project-dialog');
const projectContent = document.querySelector('[data-project-content]');
const stage = document.querySelector('#launch-stage');
const sections = [...document.querySelectorAll('[data-launch-chapter]')];
const links = [...document.querySelectorAll('[data-chapter-link]')];
const progressLine = document.querySelector('[data-page-progress]');
let room;
let starting = false;
let roomFailed = false;
let suspended = false;
let paused = false;
let scrollFrame = 0;
let projectOpener;
let reveal;
let disposed = false;

root.classList.add('js');
menuToggle.hidden = false;
installIdeaBriefs({ signal });
const preferredStatic = () => reduced.matches || Boolean(connection?.saveData);

function syncBlocking() {
  const open = Boolean(menu?.open || projectDialog?.open);
  document.body.classList.toggle('dialog-open', open);
  menuToggle.setAttribute('aria-expanded', String(Boolean(menu?.open)));
  menuToggle.setAttribute('aria-label', menu?.open ? 'Chiudi menu' : 'Apri menu');
  room?.setBlocked(open || suspended || document.hidden);
  room?.setPaused(paused || Boolean(document.querySelector('.idea-box[open]')));
  motionToggle.hidden = !room || roomFailed || preferredStatic();
  motionToggle.setAttribute('aria-pressed', String(paused));
  motionToggle.setAttribute('aria-label', paused ? 'Riprendi le animazioni' : 'Metti in pausa le animazioni');
  motionToggle.firstElementChild.textContent = paused ? '▷' : 'Ⅱ';
}

async function startRoom() {
  if (starting || room || roomFailed || preferredStatic() || disposed) return;
  starting = true;
  try {
    const { createLaunchRoom } = await import('./launch-room.js');
    if (disposed) return;
    room = createLaunchRoom({ signal, onReady: syncBlocking, onError() {
      roomFailed = true;
      root.classList.remove('launch-ready');
      motionToggle.hidden = true;
    } });
    syncBlocking();
  } catch (error) {
    roomFailed = true;
    root.classList.remove('launch-ready');
    stage.dataset.launchState = 'fallback';
    motionToggle.hidden = true;
  } finally { starting = false; }
}

function updateNavigation() {
  scrollFrame = 0;
  const positions = sections.map((section) => section.getBoundingClientRect());
  let active = 0;
  let nearest = Infinity;
  positions.forEach((rect, index) => {
    const distance = Math.abs(rect.top);
    if (distance < nearest) { nearest = distance; active = index; }
  });
  sections.forEach((section, index) => {
    const fade = stage.dataset.launchState === 'ready' && !preferredStatic() && !paused
      && !section.contains(document.activeElement) && !section.querySelector('.idea-box[open]')
      ? Math.max(0, 1 - Math.abs(positions[index].top) / (innerHeight * .36)) : 1;
    section.style.setProperty('--copy-opacity', fade.toFixed(3));
  });
  const inRoom = positions.length && positions.at(-1).bottom > innerHeight * .25;
  if (stage.dataset.launchState !== 'ready') root.dataset.launchScene = inRoom ? String(active) : '0';
  if (!inRoom && document.querySelector('#contatti').getBoundingClientRect().top < innerHeight * .5) root.dataset.launchScene = '2';
  links.forEach((link) => {
    if (inRoom && link.getAttribute('href') === `#${sections[active].id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  if (progressLine && positions.length) {
    const travel = positions.at(-1).top - positions[0].top;
    const fraction = travel > 0 ? Math.max(0, Math.min(1, -positions[0].top / travel)) : 0;
    progressLine.style.transform = `scaleX(${fraction})`;
  }
}
function requestNavigation() {
  if (!scrollFrame && !disposed) scrollFrame = requestAnimationFrame(updateNavigation);
}
window.addEventListener('scroll', requestNavigation, { passive: true, signal });
window.addEventListener('resize', requestNavigation, { passive: true, signal });
const stageObserver = new MutationObserver(requestNavigation);
stageObserver.observe(stage, { attributes: true, attributeFilter: ['data-launch-state'] });
const layoutObserver = new ResizeObserver(requestNavigation);
sections.forEach((section) => layoutObserver.observe(section));

motionToggle.addEventListener('click', () => { paused = !paused; syncBlocking(); requestNavigation(); }, { signal });
function policyChanged() { startRoom(); syncBlocking(); requestNavigation(); }
reduced.addEventListener('change', policyChanged, { signal });
connection?.addEventListener?.('change', policyChanged, { signal });
document.addEventListener('visibilitychange', syncBlocking, { signal });
document.addEventListener('focusin', requestNavigation, { signal });
document.addEventListener('focusout', requestNavigation, { signal });
document.querySelectorAll('.idea-box').forEach((details) => details.addEventListener('toggle', () => { syncBlocking(); requestNavigation(); }, { signal }));

menuToggle.addEventListener('click', () => {
  if (menu.open) menu.close();
  else menu.showModal();
  syncBlocking();
}, { signal });
document.querySelector('[data-close-menu]').addEventListener('click', () => menu.close(), { signal });
menu.addEventListener('close', syncBlocking, { signal });
menu.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener('click', (event) => {
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  event.preventDefault();
  menu.close();
  syncBlocking();
  history.pushState(null, '', link.hash);
  target.scrollIntoView({ behavior: preferredStatic() ? 'auto' : 'smooth', block: 'start' });
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}, { signal }));

function cancelReveal() { reveal?.cancel(); reveal = undefined; }
function openProject(key, opener) {
  const template = document.querySelector(`#project-${key}[data-project-template]`);
  if (!template) return;
  cancelReveal();
  projectOpener = opener;
  projectContent.replaceChildren(template.content.cloneNode(true));
  if (!projectDialog.open) projectDialog.showModal();
  projectDialog.scrollTop = 0;
  syncBlocking();
  if (!preferredStatic() && !paused && typeof projectContent.animate === 'function') {
    reveal = projectContent.animate([{ opacity: .2, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 280, easing: 'cubic-bezier(.22,1,.36,1)' });
  }
}
document.querySelectorAll('[data-open-project]').forEach((button) => {
  button.hidden = false;
  button.addEventListener('click', () => openProject(button.dataset.openProject, button), { signal });
});
document.querySelector('[data-close-project]').addEventListener('click', () => projectDialog.close(), { signal });
projectDialog.addEventListener('cancel', cancelReveal, { signal });
projectDialog.addEventListener('keydown', cancelReveal, { signal });
projectDialog.addEventListener('close', () => {
  if (projectDialog.open) return;
  cancelReveal();
  projectContent.replaceChildren();
  syncBlocking();
  projectOpener?.focus({ preventScroll: true });
}, { signal });
projectContent.addEventListener('click', (event) => {
  const button = event.target.closest('[data-project-idea]');
  if (!button) return;
  const details = document.querySelector(`#idea-${button.dataset.projectIdea}`);
  projectOpener = undefined;
  projectDialog.close();
  syncBlocking();
  if (details) {
    details.open = true;
    history.pushState(null, '', `#${details.id}`);
    details.scrollIntoView({ behavior: preferredStatic() ? 'auto' : 'smooth', block: 'center' });
    details.querySelector('textarea')?.focus({ preventScroll: true });
  }
}, { signal });
reduced.addEventListener('change', cancelReveal, { signal });
connection?.addEventListener?.('change', cancelReveal, { signal });
window.addEventListener('pageshow', () => { suspended = false; syncBlocking(); requestNavigation(); }, { signal });
window.addEventListener('pagehide', (event) => {
  suspended = true;
  cancelReveal();
  if (event.persisted) { syncBlocking(); return; }
  disposed = true;
  cancelAnimationFrame(scrollFrame);
  stageObserver.disconnect();
  layoutObserver.disconnect();
  lifetime.abort();
  room?.dispose();
}, { signal });

document.querySelectorAll('[data-year]').forEach((element) => { element.textContent = String(new Date().getFullYear()); });
updateNavigation();
startRoom();
