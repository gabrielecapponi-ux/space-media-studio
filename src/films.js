// Native decoding drives the same finite choreography as the live sculpture.
// The hidden WebGL scene follows the media clock without rendering any frames.
export function createFilms({ getScene, getPaused, onTogglePause }) {
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
    playAttempt: 0,
    complete: false,
    blocked: false,
    clockOwned: false,
    frameCallback: null,
  }));

  const allowed = () => !getPaused() && !preference.matches && !document.hidden;
  const source = (video) => portrait.matches ? video.dataset.srcMobile : video.dataset.srcDesktop;
  const notify = () => document.dispatchEvent(new Event("filmavailabilitychange"));
  function cancelMediaFrame(record) {
    if (record.frameCallback === null) return;
    record.video.cancelVideoFrameCallback?.(record.frameCallback);
    record.frameCallback = null;
  }
  function syncHeroClock(record, time = record.video.currentTime) {
    if (record.hero && record.clockOwned && !disposed) getScene?.()?.setMediaTime(time || 0);
  }
  function holdHeroClock(record) {
    if (!record.hero) return;
    record.clockOwned = true;
    syncHeroClock(record);
  }
  function releaseHeroClock(record, complete = false) {
    cancelMediaFrame(record);
    if (!record.hero || !record.clockOwned) return;
    record.clockOwned = false;
    getScene?.()?.releaseMediaClock({ complete });
  }
  function queueMediaFrame(record) {
    const { video } = record;
    if (!record.hero || !record.clockOwned || record.frameCallback !== null ||
        !video.requestVideoFrameCallback || video.paused || !allowed() || !record.visible) return;
    record.frameCallback = video.requestVideoFrameCallback((_, metadata) => {
      record.frameCallback = null;
      if (disposed || !record.clockOwned || !allowed() || !record.visible || video.paused) return;
      syncHeroClock(record, metadata.mediaTime);
      queueMediaFrame(record);
    });
  }
  const completeHero = (record, complete = false) => {
    if (record) releaseHeroClock(record, complete);
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
    if (record.hero) {
      holdHeroClock(record);
      hero?.classList.add("is-film-loading");
    }
    record.video.src = new URL(source(record.video), document.baseURI).href;
    record.video.load();
  }
  function sync(record) {
    if (disposed) return;
    const { video } = record;
    if (!allowed() || !record.visible || record.failed || record.blocked || record.complete || video.ended) {
      // Invalidating the request prevents a canceled play() promise from
      // turning a rapid pause/resume into an autoplay failure later.
      record.playAttempt += 1;
      record.playPending = false;
      video.pause();
      cancelMediaFrame(record);
      if (preference.matches) completeHero(record, true);
      else syncHeroClock(record);
      if (video.ended) video.dataset.state = "ended";
      else if (record.loaded && !record.failed && !record.blocked && !record.complete) video.dataset.state = "paused";
      return;
    }
    ensure(record);
    if (!record.loaded) return;
    holdHeroClock(record);
    if (record.playPending || !video.paused) {
      queueMediaFrame(record);
      return;
    }
    record.playPending = true;
    const attempt = ++record.playAttempt;
    video.play().then(() => {
      if (attempt !== record.playAttempt) return;
      record.playPending = false;
      // Preferences or visibility can change while autoplay is being resolved.
      if (!allowed() || !record.visible || disposed || record.complete) return video.pause();
      video.dataset.state = "playing";
      holdHeroClock(record);
      queueMediaFrame(record);
      if (record.hero) {
        hero?.classList.remove("is-film-loading");
        hero?.classList.remove("is-film-complete");
        hero?.classList.add("is-film-playing");
      }
    }).catch(() => {
      if (attempt !== record.playAttempt) return;
      record.playPending = false;
      if (disposed || record.failed || !allowed() || !record.visible) return;
      record.blocked = true;
      video.dataset.state = "blocked";
      if (record.hero) completeHero(record);
    });
  }
  const syncAll = () => {
    records.forEach(sync);
    syncControls();
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
    if (portrait.matches && video.dataset.posterMobile) video.poster = new URL(video.dataset.posterMobile, document.baseURI).href;
    video.loop = !record.hero;
    video.dataset.state = "idle";
    video.addEventListener("canplay", () => {
      if (disposed || record.failed || record.blocked || record.complete) return;
      video.dataset.state = video.paused ? "ready" : "playing";
      notify();
      sync(record);
    }, { signal });
    ["timeupdate", "seeked", "loadedmetadata"].forEach((event) => video.addEventListener(event, () => {
      syncHeroClock(record);
    }, { signal }));
    video.addEventListener("playing", () => {
      if (!allowed() || !record.visible || record.complete || disposed) return video.pause();
      holdHeroClock(record);
      queueMediaFrame(record);
    }, { signal });
    video.addEventListener("pause", () => {
      cancelMediaFrame(record);
      syncHeroClock(record);
    }, { signal });
    video.addEventListener("ended", () => {
      record.complete = true;
      video.dataset.state = "ended";
      if (record.hero) completeHero(record, true);
    }, { signal });
    video.addEventListener("error", () => {
      record.failed = true;
      video.dataset.state = "fallback";
      if (record.hero) completeHero(record);
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
    record.blocked = false;
    record.playAttempt += 1;
    record.playPending = false;
    record.video.currentTime = 0;
    hero?.classList.remove("is-film-complete");
    sync(record);
  }, { signal });
  document.querySelectorAll("[data-hero-mode]").forEach((button) => button.addEventListener("click", () => {
    const record = records.find((item) => item.hero);
    if (!record) return;
    record.complete = true;
    record.playAttempt += 1;
    record.playPending = false;
    // setMode() has already relinquished media ownership before its transition.
    // Do not seek to the film's end and overwrite the selected live pose.
    releaseHeroClock(record);
    record.video.pause();
    record.video.dataset.state = "ended";
    completeHero(record);
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
    get heroTime() {
      const record = records.find((item) => item.hero);
      // A slow WebGL import may finish after the media has ended or failed.
      // Preserve that time so it cannot restart an unrelated intro at zero.
      return record?.loaded && (record.clockOwned || record.video.ended || record.failed || record.blocked)
        ? record.video.currentTime : null;
    },
    syncScene() {
      const record = records.find((item) => item.hero);
      if (!record) return;
      if (record.clockOwned) syncHeroClock(record);
      else if (record.loaded && (record.video.ended || record.failed || record.blocked)) {
        getScene?.()?.setMediaTime(record.video.currentTime);
        getScene?.()?.releaseMediaClock({ complete: record.video.ended });
      }
    },
    setPaused: syncAll,
    dispose() {
      disposed = true;
      abort.abort();
      observer.disconnect();
      records.forEach((record) => {
        releaseHeroClock(record);
        record.video.pause();
        record.video.removeAttribute("src");
        record.video.load();
      });
    },
  };
}
