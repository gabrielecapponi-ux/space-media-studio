export function createHeroUI({ getScene, getPaused, onTogglePause }) {
  const hero = document.querySelector(".hero-cinematic");
  const container = document.querySelector("#hero-scene");
  const replay = document.querySelector("#hero-replay");
  const modeButtons = [...document.querySelectorAll("[data-hero-mode]")];
  const track = document.querySelector(".hero-timeline-fill");
  const number = document.querySelector("#hero-phase-number");
  const label = document.querySelector("#hero-phase-label");
  const status = document.querySelector("#hero-status");
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const abort = new AbortController();
  const { signal } = abort;
  const phases = [
    {
      name: "idea",
      label: "Il primo impulso.",
      announcement: "Prima fase: un totem di forme e colori.",
    },
    {
      name: "fragments",
      label: "Fuori dagli schemi.",
      announcement: "Seconda fase: le forme si aprono in una nuova composizione.",
    },
    {
      name: "form",
      label: "Le idee fanno connessione.",
      announcement:
        "Terza fase: tubi e colori si intrecciano in una nuova connessione.",
    },
  ];
  let lastPhase = -1;

  const setProgress = (progress) => {
    track.style.transform = `scaleX(${Math.max(0, Math.min(1, progress || 0))})`;
  };
  const setPhase = (detail = {}) => {
    const index = Math.max(
      0,
      Math.min(
        2,
        detail.index ??
          phases.findIndex((p) => p.name === container.dataset.phase),
      ),
    );
    const phase = phases[index];
    hero.dataset.phase = phase.name;
    number.textContent = `0${index + 1} / 03`;
    label.textContent = phase.label;
    if (lastPhase !== index) status.textContent = phase.announcement;
    lastPhase = index;
    if (detail.progress !== undefined) setProgress(detail.progress);
  };
  const setAvailability = () => {
    const ready = container.dataset.scene === "ready";
    replay.disabled = !ready || preference.matches;
    replay.hidden = !ready || preference.matches;
    modeButtons.forEach((button) => {
      button.disabled = !ready;
    });
    hero.classList.toggle("is-hero-ready", ready);
    if (ready) setPhase({ progress: Number(container.dataset.progress || 0) });
    else setPhase({ index: 2, progress: 1 });
  };
  container.addEventListener(
    "herophasechange",
    (event) => setPhase(event.detail),
    { signal },
  );
  container.addEventListener(
    "heroprogress",
    (event) => setProgress(event.detail.progress),
    { signal },
  );
  replay.addEventListener(
    "click",
    () => {
      if (getPaused()) onTogglePause();
      getScene()?.playIntro();
    },
    { signal },
  );
  preference.addEventListener("change", setAvailability, { signal });
  const observer = new MutationObserver(setAvailability);
  observer.observe(container, {
    attributes: true,
    attributeFilter: ["data-scene"],
  });
  setPhase({ index: 0, progress: 0 });
  setAvailability();

  return {
    ready() {
      setAvailability();
      setPhase({ progress: Number(container.dataset.progress || 0) });
    },
    dispose() {
      abort.abort();
      observer.disconnect();
    },
  };
}
