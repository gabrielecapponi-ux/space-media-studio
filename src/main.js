import { createMotion } from "./motion.js";
import { createEntry } from "./entry.js";

document.documentElement.classList.add("js", "motion-ready");
const abort = new AbortController();
const { signal } = abort;
const preference = matchMedia("(prefers-reduced-motion: reduce)");
const motion = createMotion({ initiallyBlocked: true });
const entry = createEntry(motion);
let disposed = false;
document.fonts.ready.then(() => {
  if (!disposed) document.documentElement.classList.add("is-ready");
});

const reveal = new IntersectionObserver((entries) => {
  entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    target.classList.add("is-visible");
    reveal.unobserve(target);
  });
}, { threshold: 0.08 });
document.querySelectorAll(".reveal").forEach((element) => reveal.observe(element));

const menu = document.querySelector("#menu-dialog");
const menuToggle = document.querySelector(".menu-toggle");
const conceptDialog = document.querySelector("#concept-dialog");
const dialogs = [menu, conceptDialog].filter(Boolean);
function openDialog(dialog) {
  if (!dialog || dialog.open) return;
  dialog.showModal();
  document.body.classList.add("dialog-open");
  motion.setBlocked(true);
}
function closeDialog(dialog) { dialog?.close(); }
dialogs.forEach((dialog) => {
  dialog.addEventListener("close", () => {
    if (!dialogs.some((item) => item.open)) {
      document.body.classList.remove("dialog-open");
      motion.setBlocked(false);
    }
    if (dialog === menu) {
      menuToggle?.setAttribute("aria-expanded", String(menu.open));
      menuToggle?.setAttribute("aria-label", menu.open ? "Chiudi menu" : "Apri menu");
    }
  }, { signal });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
  }, { signal });
});
menuToggle?.addEventListener("click", () => {
  if (menu?.open) return closeDialog(menu);
  openDialog(menu);
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Chiudi menu");
}, { signal });
document.querySelector("[data-close-menu]")?.addEventListener("click", () => closeDialog(menu), { signal });
document.querySelector("[data-close-concept]")?.addEventListener("click", () => closeDialog(conceptDialog), { signal });

function navigateFromDialog(event, dialog) {
  const hash = event.currentTarget.getAttribute("href");
  const target = hash?.startsWith("#") && document.querySelector(hash);
  if (!target) return;
  event.preventDefault();
  closeDialog(dialog);
  requestAnimationFrame(() => {
    if (disposed) return;
    target.scrollIntoView({ behavior: preference.matches ? "instant" : "smooth" });
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    history.replaceState(null, "", hash);
  });
}
menu?.querySelectorAll("nav a").forEach((link) => link.addEventListener("click", (event) => navigateFromDialog(event, menu), { signal }));
document.querySelector("#concept-cta")?.addEventListener("click", (event) => navigateFromDialog(event, conceptDialog), { signal });

const concepts = {
  identity: {
    title: "Aura — The quiet ritual",
    image: "./images/muse-skincare.jpg",
    imageAlt: "Still life skincare con flaconi neutri e tessuti naturali",
    wordmark: "aura",
    signature: "A quiet ritual.",
    discipline: "01 / Branding & direzione creativa",
    description: "Una possibile identità per un brand beauty. Packaging, parole e immagini condividono un linguaggio essenziale e riconoscibile, dalla prima impressione a ogni punto di contatto.",
    deliverables: ["Strategia e posizionamento", "Identità visiva e direzione creativa", "Packaging e applicazioni digitali"],
    credit: { name: "Polina / Pexels", url: "https://www.pexels.com/photo/cosmetic-containers-on-gray-textile-8101525/" },
  },
  architecture: {
    title: "Forma — A new perspective",
    image: "./images/forma-architecture.jpg",
    imageAlt: "Architettura geometrica in bianco e nero",
    wordmark: "FORMA",
    signature: "Spaces that inspire.",
    discipline: "02 / Web design & sviluppo",
    description: "Un possibile sito per uno studio di architettura: immagini, tipografia e movimento costruiscono un percorso chiaro, curato su ogni schermo.",
    deliverables: ["Direzione visiva e architettura dei contenuti", "Web design e sviluppo responsive", "Motion design e interazioni"],
    credit: { name: "Alec Doualetas / Pexels", url: "https://www.pexels.com/photo/modern-architectural-concrete-structure-detail-31851512/" },
  },
  content: {
    title: "Reverie — More feeling",
    image: "./images/aura-perfume.jpg",
    imageAlt: "Still life di flaconi senza marchio e forme scultoree",
    wordmark: "RÊVERIE",
    signature: "Less noise. More feeling.",
    discipline: "03 / Contenuti & campagne",
    description: "Una possibile campagna lifestyle. Un unico concept diventa immagini, video, contenuti social e creatività pubblicitarie, mantenendo una direzione coerente.",
    deliverables: ["Concept di campagna", "Direzione di contenuti fotografici e video", "Creatività social e advertising"],
    credit: { name: "Daria Liudnaya / Pexels", url: "https://www.pexels.com/photo/blank-perfume-bottles-8166611/" },
  },
};
document.querySelectorAll("[data-concept]").forEach((card) => card.addEventListener("click", () => {
  const concept = concepts[card.dataset.concept];
  if (!concept) return;
  const image = document.querySelector("#concept-image");
  image.src = new URL(concept.image, document.baseURI).href;
  image.alt = concept.imageAlt;
  conceptDialog.dataset.concept = card.dataset.concept;
  document.querySelector("#concept-wordmark").textContent = concept.wordmark;
  document.querySelector("#concept-signature").textContent = concept.signature;
  document.querySelector("#concept-discipline").textContent = concept.discipline;
  document.querySelector("#concept-title").textContent = concept.title;
  document.querySelector("#concept-description").textContent = concept.description;
  const credit = document.querySelector("#concept-credit");
  const link = document.createElement("a");
  link.href = concept.credit.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = concept.credit.name;
  credit.replaceChildren("Fotografia su licenza: ", link);
  document.querySelector("#concept-deliverables").replaceChildren(...concept.deliverables.map((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  }));
  openDialog(conceptDialog);
}, { signal }));

const year = document.querySelector("#year");
if (year) year.textContent = new Date().getFullYear();

function dispose() {
  if (disposed) return;
  disposed = true;
  abort.abort();
  reveal.disconnect();
  motion.dispose();
  entry.dispose();
}
window.addEventListener("pagehide", (event) => { if (!event.persisted) dispose(); }, { signal });
if (import.meta.hot) import.meta.hot.dispose(dispose);
