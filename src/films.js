// Original Higgsfield films are a progressive enhancement of the live 3D scene.
// Native video decoding needs no animation loop and stops outside the viewport.
export function createFilms({ getPaused, onTogglePause }) {
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const portrait = matchMedia("(max-width: 760px) and (orientation: portrait)");
  const connection = navigator.connection;
  const abort = new AbortController();
  const { signal } = abort;
  const hero = document.querySelector(".hero-cinematic");
  const controls = [...document.querySelectorAll("[data-film-motion]")];
  let disposed = false;
  let explicitPlay = false;
  const records = [...document.querySelectorAll("#hero-film, #portal-film")].map((video) => ({
    video,
    hero: video.id === "hero-film",
    visible: false,
    loaded: false,
    failed: false,
    playPending: false,
    complete: false,
  }));

  const allowed = () => !getPaused() && !preference.matches && !document.hidden;
  const source = (video) => portrait.matches ? video.dataset.srcMobile : video.dataset.srcDesktop;
  const notify = () => document.dispatchEvent(new Event("filmavailabilitychange"));
  const completeHero = () => {
    hero?.classList.remove("is-film-playing", "is-film-loading");
    hero?.classList.add("is-film-complete");
  };
  function syncControls() {
    const deferred = connection?.saveData && !explicitPlay && !getPaused();
    controls.forEach((button) => {
      button.disabled = preference.matches;
      button.setAttribute("aria-pressed", String(getPaused() || preference.matches));
      button.setAttribute("aria-label", deferred ? "Riproduci il filmato" : getPaused() ? "Riprendi tutte le animazioni 3D" : "Metti in pausa tutte le animazioni 3D");
      const label = button.querySelector(".film-toggle-label");
      const icon = button.querySelector(".film-toggle-icon");
      if (label) label.textContent = preference.matches ? "Movimento ridotto" : deferred ? "Riproduci" : getPaused() ? "Riprendi" : "Pausa";
      if (icon) icon.textContent = preference.matches || getPaused() || deferred ? "▷" : "Ⅱ";
    });
  }
  function ensure(record) {
    if (record.loaded || record.failed || !source(record.video)) return;
    if (connection?.saveData && !explicitPlay) return;
    record.loaded = true;
    record.video.dataset.state = "loading";
    if (record.hero) hero?.classList.add("is-film-loading");
    record.video.src = new URL(source(record.video), document.baseURI).href;
    record.video.load();
  }
  function sync(record) {
    if (disposed) return;
    const { video } = record;
    if (!allowed() || !record.visible || record.failed || record.complete || video.ended) {
      video.pause();
      if (video.ended) video.dataset.state = "ended";
      else if (record.loaded && !record.failed) video.dataset.state = "paused";
      return;
    }
    ensure(record);
    if (!record.loaded || record.playPending || !video.paused) return;
    record.playPending = true;
    video.play().then(() => {
      record.playPending = false;
      // Preferences or visibility can change while autoplay is being resolved.
      if (!allowed() || !record.visible || disposed || record.complete) return video.pause();
      video.dataset.state = "playing";
      if (record.hero) {
        hero?.classList.remove("is-film-loading");
        hero?.classList.remove("is-film-complete");
        hero?.classList.add("is-film-playing");
      }
    }).catch(() => {
      record.playPending = false;
      if (disposed || !allowed() || !record.visible) return;
      video.dataset.state = "blocked";
      if (record.hero) completeHero();
    });
  }
  const syncAll = () => {
    records.forEach(sync);
    syncControls();
    if (preference.matches) completeHero();
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const record = records.find((item) => item.video === entry.target);
      record.visible = entry.isIntersecting;
      sync(record);
    });
  }, { threshold: 0.05 });

  records.forEach((record) => {
    const { video } = record;
    video.muted = true;
    video.playsInline = true;
    video.loop = !record.hero;
    video.dataset.state = "idle";
    video.addEventListener("canplay", () => {
      video.dataset.state = video.paused ? "ready" : "playing";
      notify();
      sync(record);
    }, { signal });
    video.addEventListener("ended", () => {
      record.complete = true;
      video.dataset.state = "ended";
      if (record.hero) completeHero();
    }, { signal });
    video.addEventListener("error", () => {
      record.failed = true;
      video.dataset.state = "fallback";
      if (record.hero) completeHero();
      notify();
    }, { signal });
    observer.observe(video);
  });
  document.querySelector("#hero-replay")?.addEventListener("click", () => {
    if (preference.matches) return;
    explicitPlay = true;
    const record = records.find((item) => item.hero);
    if (!record || record.failed) return;
    record.complete = false;
    record.video.currentTime = 0;
    hero?.classList.remove("is-film-complete");
    sync(record);
  }, { signal });
  document.querySelectorAll("[data-hero-mode]").forEach((button) => button.addEventListener("click", () => {
    const record = records.find((item) => item.hero);
    if (!record) return;
    record.complete = true;
    record.video.pause();
    if (Number.isFinite(record.video.duration)) record.video.currentTime = record.video.duration;
    record.video.dataset.state = "ended";
    completeHero();
  }, { signal }));
  controls.forEach((button) => button.addEventListener("click", () => {
    const deferred = connection?.saveData && !explicitPlay && !getPaused();
    explicitPlay = true;
    if (deferred) syncAll();
    else onTogglePause();
  }, { signal }));
  document.addEventListener("visibilitychange", syncAll, { signal });
  preference.addEventListener("change", syncAll, { signal });
  syncControls();

  return {
    get available() { return records.some(({ loaded, failed, video }) => loaded && !failed && video.readyState >= 2); },
    setPaused: syncAll,
    dispose() {
      disposed = true;
      abort.abort();
      observer.disconnect();
      records.forEach(({ video }) => { video.pause(); video.removeAttribute("src"); video.load(); });
    },
  };
}
