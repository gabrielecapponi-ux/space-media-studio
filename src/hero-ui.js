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
      label: "Tutto parte da un’idea.",
      announcement: "Prima fase, Idea: quattro moduli raccolgono un’intuizione.",
    },
    {
      name: "fragments",
      label: "Ogni parte trova il suo senso.",
      announcement: "Seconda fase, Struttura: i quattro moduli si separano in una vista esplosa ordinata.",
    },
    {
      name: "form",
      label: "Un’idea. Un’identità.",
      announcement:
        "Terza fase, Identità: i moduli si uniscono nella scintilla di Space Media Studio.",
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
    const sceneReady = container.dataset.scene === "ready";
    const film = document.querySelector("#hero-film");
    const ready = sceneReady || (film?.readyState >= 2 && film.dataset.state !== "fallback");
    replay.disabled = !ready || preference.matches;
    replay.hidden = !ready || preference.matches;
    modeButtons.forEach((button) => {
      button.disabled = !sceneReady;
    });
    hero.classList.toggle("is-hero-ready", sceneReady);
    if (sceneReady || container.dataset.clock === "media") setPhase({ progress: Number(container.dataset.progress || 0) });
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
  document.addEventListener("filmavailabilitychange", setAvailability, { signal });
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
