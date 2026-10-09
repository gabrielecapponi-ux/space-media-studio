export function createExperience({ getHero, getPaused, onTogglePause }) {
  const section = document.querySelector("#dimensioni");
  const container = document.querySelector("#world-scene");
  const chapterButtons = [...section.querySelectorAll("[data-world-chapter]")];
  const modeButtons = [...document.querySelectorAll("[data-hero-mode]")];
  const copies = [...section.querySelectorAll("[data-world-copy]")];
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const compactViewport = window.matchMedia("(max-width: 760px), (pointer: coarse)");
  const worldPause = document.querySelector("#world-motion");
  const status = document.querySelector("#world-status");
  const abort = new AbortController();
  const { signal } = abort;
  const chapterNames = ["Scintilla", "Esplora", "Connessione"];
  let world;
  let loading;
  let disposed = false;
  let chapter = 0;
  let tiltFrame = 0;
  let progressFrame = 0;
  const resetCards = [];

  function syncChapter(index, progress = index / 2) {
    index = Math.max(0, Math.min(2, index));
    section.dataset.chapter = String(index);
    section.style.setProperty("--world-progress", String(progress));
    chapterButtons.forEach((button, i) =>
      button.setAttribute("aria-pressed", String(i === index)),
    );
    copies.forEach((copy, i) =>
      copy.setAttribute("aria-hidden", String(i !== index)),
    );
    if (chapter !== index)
      status.textContent = `Capitolo ${index + 1}: ${chapterNames[index]}`;
    chapter = index;
  }
  section.addEventListener(
    "chapterchange",
    (event) => {
      syncChapter(event.detail.index, event.detail.progress);
    },
    { signal },
  );
  syncChapter(0);
  const updateProgress = () => {
    progressFrame = 0;
    if (preference.matches) return;
    const rect = section.getBoundingClientRect();
    const progress = Math.max(
      0,
      Math.min(1, -rect.top / Math.max(1, rect.height - innerHeight)),
    );
    if (container.dataset.world !== "ready") {
      syncChapter(Math.min(2, Math.floor(progress * 3)), progress);
    } else {
      section.style.setProperty("--world-progress", String(progress));
    }
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!progressFrame) progressFrame = requestAnimationFrame(updateProgress);
    },
    { passive: true, signal },
  );

  function syncPause() {
    const reduced = preference.matches;
    const paused = getPaused();
    const ready = container.dataset.world === "ready";
    const unavailable = container.dataset.world === "fallback";
    world?.setPaused(paused);
    worldPause.disabled = reduced || !ready;
    worldPause.setAttribute("aria-pressed", String(paused || reduced));
    worldPause.setAttribute(
      "aria-label",
      reduced
        ? "Animazione statica: movimento ridotto"
        : !ready
          ? unavailable
            ? "Vista statica: animazione 3D non disponibile"
            : "Caricamento dell’esperienza 3D"
          : paused
            ? "Riprendi tutte le animazioni 3D"
            : "Metti in pausa tutte le animazioni 3D",
    );
    worldPause.querySelector(".world-motion-label").textContent = reduced
      ? "Movimento ridotto"
      : !ready
        ? unavailable
          ? "Vista statica"
          : "Caricamento 3D…"
        : paused
          ? "Riprendi 3D"
          : "Pausa 3D";
    worldPause.querySelector(".world-motion-icon").textContent =
      paused || reduced ? "▷" : "Ⅱ";
  }
  worldPause.addEventListener("click", onTogglePause, { signal });
  preference.addEventListener("change", syncPause, { signal });
  const worldStateObserver = new MutationObserver(syncPause);
  worldStateObserver.observe(container, {
    attributes: true,
    attributeFilter: ["data-world"],
  });
  syncPause();

  async function ensureWorld() {
    if (world || disposed) return world;
    if (!loading) {
      container.dataset.world = "loading";
      loading = import("./world.js")
        .then(({ createWorld }) => {
          if (disposed) return;
          world = createWorld(container, section);
          world.setPaused(getPaused());
          return world;
        })
        .catch(() => {
          container.dataset.world = "fallback";
        });
    }
    return loading;
  }
  const lazyObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        ensureWorld();
        lazyObserver.disconnect();
      }
    },
    // On phones, keep the second WebGL context out of the opening sequence.
    // Chapter controls can still request it directly before it enters view.
    { rootMargin: compactViewport.matches ? "0px" : "300px 0px" },
  );
  lazyObserver.observe(section);

  chapterButtons.forEach((button) =>
    button.addEventListener(
      "click",
      async () => {
        const index = Number(button.dataset.worldChapter);
        const currentWorld = await ensureWorld();
        if (disposed) return;
        if (preference.matches) {
          currentWorld?.setChapter(index);
          syncChapter(index);
          return;
        }
        const start = section.getBoundingClientRect().top + window.scrollY;
        const range = Math.max(0, section.offsetHeight - window.innerHeight);
        window.scrollTo({
          top: start + (range * index) / 2,
          behavior: "smooth",
        });
      },
      { signal },
    ),
  );

  function syncMode(mode) {
    modeButtons.forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.heroMode === mode),
      ),
    );
  }
  modeButtons.forEach((button) =>
    button.addEventListener(
      "click",
      () => {
        getHero()?.setMode(button.dataset.heroMode);
        syncMode(button.dataset.heroMode);
      },
      { signal },
    ),
  );
  document
    .querySelector("#hero-scene")
    .addEventListener("modechange", (event) => syncMode(event.detail.mode), {
      signal,
    });

  document.querySelectorAll(".concept-card").forEach((card) => {
    const art = card.querySelector(".concept-art");
    const reset = () => {
      cancelAnimationFrame(tiltFrame);
      card.classList.remove("is-tilting");
      art.style.removeProperty("--card-rx");
      art.style.removeProperty("--card-ry");
      art.style.removeProperty("--card-shine");
    };
    resetCards.push(reset);
    card.addEventListener(
      "pointermove",
      (event) => {
        if (!finePointer.matches || preference.matches || getPaused()) return;
        const rect = art.getBoundingClientRect();
        const x = Math.max(
          0,
          Math.min(1, (event.clientX - rect.left) / rect.width),
        );
        const y = Math.max(
          0,
          Math.min(1, (event.clientY - rect.top) / rect.height),
        );
        cancelAnimationFrame(tiltFrame);
        tiltFrame = requestAnimationFrame(() => {
          card.classList.add("is-tilting");
          art.style.setProperty("--card-rx", `${(0.5 - y) * 8}deg`);
          art.style.setProperty("--card-ry", `${(x - 0.5) * 10}deg`);
          art.style.setProperty("--card-px", `${x * 100}%`);
          art.style.setProperty("--card-py", `${y * 100}%`);
          art.style.setProperty("--card-shine", "1");
        });
      },
      { signal },
    );
    card.addEventListener("pointerleave", reset, { signal });
    card.addEventListener("pointercancel", reset, { signal });
    preference.addEventListener("change", reset, { signal });
  });

  return {
    setPaused() {
      syncPause();
      if (getPaused()) resetCards.forEach((reset) => reset());
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      abort.abort();
      lazyObserver.disconnect();
      worldStateObserver.disconnect();
      cancelAnimationFrame(tiltFrame);
      world?.dispose();
      cancelAnimationFrame(progressFrame);
    },
  };
}
