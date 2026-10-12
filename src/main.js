import { createServiceFilms } from "./four-films.js";

const root = document.documentElement;
root.classList.add("js");
document.querySelectorAll("#motion-toggle, #quality-toggle, .menu-toggle").forEach((control) => { control.hidden = false; });
const abort = new AbortController();
const { signal } = abort;
const preference = matchMedia("(prefers-reduced-motion: reduce)");
const films = createServiceFilms({ initiallyBlocked: true });
const entry = document.querySelector("#studio-entry");
const entryProgress = document.querySelector("#entry-progress");
const entryPercentage = document.querySelector("#entry-percentage");
const entrySkip = document.querySelector("#entry-skip");
const menu = document.querySelector("#menu-dialog");
const menuToggle = document.querySelector(".menu-toggle");
const underlay = [...document.body.children].filter((element) => element !== entry && !["SCRIPT", "STYLE", "LINK"].includes(element.tagName));
const initialInert = new Map(underlay.map((element) => [element, element.inert]));
let opened = !entry;
let disposed = false;
let completed = 0;
let deadline;
let dismissTimer;
let progress = 0;
const chapterCopies = [...document.querySelectorAll(".chapter-copy")];
const revealedCopies = new WeakSet();
const copyAnimations = new Set();
let copyObserver;
let pageSuspended = false;
function cancelCopyReveals(disconnect = false) {
  if (disconnect) copyObserver?.disconnect();
  for (const animation of copyAnimations) animation.cancel();
  copyAnimations.clear();
}
function startCopyReveals() {
  if (!opened || disposed || pageSuspended || typeof IntersectionObserver !== "function" || !chapterCopies.some((copy) => typeof copy.animate === "function")) return;
  if (!copyObserver) {
    copyObserver = new IntersectionObserver((entries) => {
      for (const { target: copy, isIntersecting } of entries) {
        if (!isIntersecting || revealedCopies.has(copy) || pageSuspended || disposed) continue;
        revealedCopies.add(copy);
        copyObserver.unobserve(copy);
        if (preference.matches || root.dataset.motion === "paused" || menu?.open || document.hidden || copy.contains(document.activeElement)) continue;
        [...copy.children].slice(0, 6).forEach((element, index) => {
          if (typeof element.animate !== "function") return;
          try {
            const animation = element.animate([
              { opacity: 0, transform: "translateY(18px)" },
              { opacity: 1, transform: "translateY(0)" },
            ], { duration: 560, delay: index * 45, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" });
            if (typeof animation.finished?.then !== "function") { animation.cancel(); return; }
            copyAnimations.add(animation);
            const release = () => {
              copyAnimations.delete(animation);
              // Final presentation always comes from the ordinary DOM/CSS.
              animation.cancel();
            };
            animation.finished.then(release, release);
          } catch {
            // Unsupported animation options leave the native content visible.
          }
        });
      }
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
  }
  chapterCopies.forEach((copy) => { if (!revealedCopies.has(copy)) copyObserver.observe(copy); });
}
preference.addEventListener("change", () => {
  if (preference.matches) cancelCopyReveals();
}, { signal });
document.querySelector("#motion-toggle")?.addEventListener("click", () => {
  if (root.dataset.motion === "paused") cancelCopyReveals();
}, { signal });
document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelCopyReveals();
}, { signal });
document.addEventListener("focusin", (event) => {
  if (chapterCopies.some((copy) => copy.contains(event.target))) cancelCopyReveals();
}, { signal });
function setProgress(value) {
  if (opened || disposed) return;
  progress = Math.max(progress, Math.min(100, Math.round(value)));
  if (entryPercentage) entryPercentage.textContent = `${String(progress).padStart(2, "0")}%`;
  if (entryProgress) {
    if (entryProgress.tagName === "PROGRESS") entryProgress.value = progress;
    else entryProgress.setAttribute("aria-valuenow", String(progress));
    entryProgress.style.setProperty("--load", `${progress}%`);
  }
}
function openSite() {
  if (opened || disposed) return;
  const entryFocused = entry?.contains(document.activeElement);
  setProgress(100);
  opened = true;
  clearTimeout(deadline);
  root.classList.remove("is-loading");
  root.classList.add("is-ready");
  underlay.forEach((element) => { element.inert = initialInert.get(element); });
  if (entry) {
    entry.classList.add("is-complete");
    entry.inert = true;
    entry.setAttribute("aria-hidden", "true");
    dismissTimer = setTimeout(() => { entry.hidden = true; }, preference.matches ? 0 : 450);
  }
  if (entryFocused) {
    const target = document.querySelector("main");
    target?.setAttribute("tabindex", "-1");
    target?.focus({ preventScroll: true });
  }
  films.setBlocked(Boolean(menu?.open));
  startCopyReveals();
}
entrySkip?.addEventListener("click", openSite, { signal });
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !opened) openSite();
}, { signal });
if (entry) {
  entry.hidden = false;
  entry.removeAttribute("aria-hidden");
  root.classList.add("is-loading");
  underlay.forEach((element) => { element.inert = true; });
  entrySkip?.focus({ preventScroll: true });
  deadline = setTimeout(openSite, 5000);
  const mark = (weight) => { completed += weight; setProgress(completed); };
  const fonts = Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 1800))])
    .then(() => mark(10));
  const poster = document.querySelector(".service-poster");
  const picture = (poster?.decode ? poster.decode().catch(() => {}) : Promise.resolve()).then(() => mark(25));
  const film = films.prepareFirst({
    timeoutMs: 4500,
    onProgress(value) { setProgress(completed + value * 60); },
  }).then(() => mark(65));
  Promise.all([fonts, picture, film]).then(openSite);
} else {
  root.classList.add("is-ready");
  films.setBlocked(false);
  startCopyReveals();
}

function menuState() {
  const open = Boolean(menu?.open);
  menuToggle?.setAttribute("aria-expanded", String(open));
  menuToggle?.setAttribute("aria-label", open ? "Chiudi menu" : "Apri menu");
  document.body.classList.toggle("dialog-open", open);
  root.classList.toggle("menu-open", open);
  films.setBlocked(!opened || open);
  if (open) cancelCopyReveals();
}
menuToggle?.addEventListener("click", () => {
  if (!menu) return;
  if (menu.open) menu.close();
  else menu.showModal();
  menuState();
}, { signal });
menu?.addEventListener("close", menuState, { signal });
document.querySelector("[data-close-menu]")?.addEventListener("click", () => menu?.close(), { signal });
menu?.addEventListener("click", (event) => {
  if (event.target !== menu) return;
  const rect = menu.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) menu.close();
}, { signal });
menu?.querySelectorAll('a[href^="#"]').forEach((link) => link.addEventListener("click", (event) => {
  const hash = link.getAttribute("href");
  const target = hash && document.getElementById(hash.slice(1));
  if (!target) return;
  event.preventDefault();
  menu.close();
  requestAnimationFrame(() => {
    if (disposed) return;
    history.pushState(null, "", hash);
    target.scrollIntoView({ behavior: preference.matches ? "instant" : "smooth" });
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });
}, { signal }));

window.addEventListener("pagehide", (event) => {
  pageSuspended = true;
  cancelCopyReveals(true);
  if (event.persisted) { films.setBlocked(true); return; }
  disposed = true;
  clearTimeout(deadline);
  clearTimeout(dismissTimer);
  films.dispose();
  abort.abort();
}, { signal });
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    pageSuspended = false;
    films.setBlocked(!opened || Boolean(menu?.open));
    startCopyReveals();
  }
}, { signal });
