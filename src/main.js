import { createExperience } from "./experience.js";
import { createHeroUI } from "./hero-ui.js";

document.documentElement.classList.add("js");

const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const sceneContainer = document.querySelector("#hero-scene");
const motionButton = document.querySelector("#motion-toggle");
sceneContainer.dataset.scene = "loading";
let scene;
let experience;
let userPaused = false;
const heroUI = createHeroUI({
  getScene: () => scene,
  getPaused: () => userPaused,
  onTogglePause: toggleMotion,
});

function updateMotionControl() {
  const reduced = motionPreference.matches;
  const ready = sceneContainer.dataset.scene === "ready";
  const unavailable = sceneContainer.dataset.scene === "fallback";
  motionButton.disabled = reduced || !ready;
  motionButton.setAttribute("aria-pressed", String(userPaused || reduced));
  motionButton.setAttribute(
    "aria-label",
    reduced
      ? "Animazione statica: movimento ridotto"
      : !ready
        ? unavailable
          ? "Vista statica: animazione 3D non disponibile"
          : "Caricamento dell’animazione 3D"
        : userPaused
          ? "Riprendi tutte le animazioni 3D"
          : "Metti in pausa tutte le animazioni 3D",
  );
  motionButton.querySelector(".motion-label").textContent = reduced
    ? "Movimento ridotto"
    : !ready
      ? unavailable
        ? "Vista statica"
        : "Caricamento 3D…"
      : userPaused
        ? "Riprendi 3D"
        : "Pausa 3D";
  motionButton.querySelector(".motion-icon").textContent =
    reduced || userPaused ? "▷" : "Ⅱ";
}
function toggleMotion() {
  userPaused = !userPaused;
  scene?.setPaused(userPaused);
  experience?.setPaused(userPaused);
  updateMotionControl();
}
motionButton.addEventListener("click", toggleMotion);
motionPreference.addEventListener("change", updateMotionControl);
const sceneStateObserver = new MutationObserver(updateMotionControl);
sceneStateObserver.observe(sceneContainer, {
  attributes: true,
  attributeFilter: ["data-scene"],
});

// Keep the document and navigation available while the optional 3D engine loads.
import("./scene.js")
  .then(({ createScene }) => {
    scene = createScene(sceneContainer);
    scene.setPaused(userPaused);
    heroUI.ready();
    updateMotionControl();
  })
  .catch(() => {
    sceneContainer.dataset.scene = "fallback";
    motionButton.hidden = true;
  });
updateMotionControl();
experience = createExperience({
  getHero: () => scene,
  getPaused: () => userPaused,
  onTogglePause: toggleMotion,
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08 },
);
document
  .querySelectorAll(".reveal")
  .forEach((element) => revealObserver.observe(element));

const menu = document.querySelector("#menu-dialog");
const menuToggle = document.querySelector(".menu-toggle");
const conceptDialog = document.querySelector("#concept-dialog");
const dialogs = [menu, conceptDialog];

function openDialog(dialog) {
  dialog.showModal();
  document.body.classList.add("dialog-open");
}
function closeDialog(dialog) {
  dialog.close();
}
dialogs.forEach((dialog) => {
  dialog.addEventListener("close", () => {
    if (!dialogs.some((item) => item.open))
      document.body.classList.remove("dialog-open");
    if (dialog === menu) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Apri menu");
    }
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      closeDialog(dialog);
  });
});
menuToggle.addEventListener("click", () => {
  if (menu.open) return closeDialog(menu);
  openDialog(menu);
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Chiudi menu");
});
document
  .querySelector("[data-close-menu]")
  .addEventListener("click", () => closeDialog(menu));
document
  .querySelector("[data-close-concept]")
  .addEventListener("click", () => closeDialog(conceptDialog));

function navigateFromDialog(event, dialog) {
  const target = document.querySelector(
    event.currentTarget.getAttribute("href"),
  );
  if (!target) return;
  event.preventDefault();
  closeDialog(dialog);
  // Let native dialog focus restoration finish before orienting the page.
  requestAnimationFrame(() => {
    target.scrollIntoView({
      behavior: motionPreference.matches ? "instant" : "smooth",
    });
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    history.replaceState(null, "", `#${target.id}`);
  });
}
menu
  .querySelectorAll("nav a")
  .forEach((link) =>
    link.addEventListener("click", (event) => navigateFromDialog(event, menu)),
  );
document
  .querySelector("#concept-cta")
  .addEventListener("click", (event) =>
    navigateFromDialog(event, conceptDialog),
  );

const concepts = {
  identity: {
    title: "Aura — The quiet ritual",
    description:
      "Una possibile direzione per un brand beauty: essenziale, naturale, riconoscibile. Fotografia, parole e un linguaggio visivo coerente costruiscono il racconto di un rituale quotidiano.",
    deliverables: [
      "Strategia e posizionamento del brand",
      "Logo, palette e linguaggio tipografico",
      "Packaging, materiali e applicazioni digitali",
    ],
    credit: {
      name: "Polina / Pexels",
      url: "https://www.pexels.com/photo/cosmetic-containers-on-gray-textile-8101525/",
    },
  },
  architecture: {
    title: "Forma — A new perspective",
    description:
      "Un possibile sito per uno studio di architettura. Un’esperienza editoriale dove la geometria diventa racconto, le immagini respirano e ogni dettaglio invita a scoprire una nuova prospettiva.",
    deliverables: [
      "Posizionamento e direzione editoriale",
      "Web design e sviluppo responsive",
      "Animazioni e narrazione dei progetti",
    ],
    credit: {
      name: "Alec Doualetas / Pexels",
      url: "https://www.pexels.com/photo/modern-architectural-concrete-structure-detail-31851512/",
    },
  },
  content: {
    title: "Reverie — More feeling",
    description:
      "Una possibile campagna lifestyle che sceglie di abbassare il rumore e lasciare spazio alle sensazioni. Still life, copy essenziale e una direzione visiva da declinare tra social, advertising e contenuti editoriali.",
    deliverables: [
      "Concept creativo e piano dei contenuti",
      "Fotografia, video e motion design",
      "Declinazioni social e creatività advertising",
    ],
    credit: {
      name: "Daria Liudnaya / Pexels",
      url: "https://www.pexels.com/photo/blank-perfume-bottles-8166611/",
    },
  },
  digital: {
    title: "Play — Make some noise",
    description:
      "Un playground digitale per il brand. Forme morbide, colori pieni e interazioni tridimensionali trasformano il sito in un’esperienza da esplorare e ricordare.",
    deliverables: [
      "Direzione visiva e design dell’esperienza",
      "Sito responsive e interazioni su misura",
      "Scene 3D, animazione e percorsi digitali",
    ],
  },
};
document.querySelectorAll("[data-concept]").forEach((card) =>
  card.addEventListener("click", () => {
    const concept = concepts[card.dataset.concept];
    document.querySelector("#concept-title").textContent = concept.title;
    document.querySelector("#concept-description").textContent =
      concept.description;
    const credit = document.querySelector("#concept-credit");
    credit.replaceChildren();
    if (concept.credit) {
      credit.append("Fotografia su licenza: ");
      const link = document.createElement("a");
      link.href = concept.credit.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = concept.credit.name;
      credit.append(link);
    }
    const list = document.querySelector("#concept-deliverables");
    list.replaceChildren(
      ...concept.deliverables.map((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        return li;
      }),
    );
    openDialog(conceptDialog);
  }),
);

// Native details retain keyboard and no-JavaScript operation.
document.querySelectorAll(".service").forEach((detail) =>
  detail.addEventListener("toggle", () => {
    if (!detail.open) return;
    document.querySelectorAll(".service").forEach((other) => {
      if (other !== detail) other.open = false;
    });
  }),
);

document.querySelector("#year").textContent = new Date().getFullYear();
window.addEventListener("pagehide", (event) => {
  if (!event.persisted) {
    scene?.dispose();
    experience?.dispose();
    heroUI.dispose();
    sceneStateObserver.disconnect();
    revealObserver.disconnect();
    motionPreference.removeEventListener("change", updateMotionControl);
  }
});
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    scene?.dispose();
    experience?.dispose();
    heroUI.dispose();
    sceneStateObserver.disconnect();
    revealObserver.disconnect();
  });
