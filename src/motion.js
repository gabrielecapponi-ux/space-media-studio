// Absolute scroll owns the product. Native video decoding owns the water.
export function createMotion({ initiallyBlocked = false } = {}) {
  const abort = new AbortController();
  const { signal } = abort;
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const video = document.querySelector("#water-film");
  const stage = document.querySelector(".water-stage");
  const story = document.querySelector("#esperienza");
  const sceneContainer = document.querySelector("#showcase-scene");
  const toggle = document.querySelector("#motion-toggle");
  const replay = document.querySelector("#film-replay");
  const filmProgress = document.querySelector(".water-progress > span");
  const tabs = [...document.querySelectorAll("button[data-showcase-step]")];
  const copies = [...document.querySelectorAll("[data-showcase-copy]")];
  const connection = navigator.connection;
  let paused = false;
  let blocked = Boolean(initiallyBlocked);
  let disposed = false;
  let movieVisible = false;
  let storyVisible = false;
  let movieLoaded = false;
  let movieComplete = false;
  let movieFailed = false;
  let playPending = false;
  let attempt = 0;
  let explicitPlay = false;
  let scene;
  let scenePromise;
  let target = 0;
  let progress = 0;
  let selected = -1;
  let frame = 0;
  let previous = 0;
  let scrollFrame = 0;
  let staticStep = 0;
  let hasScenePosition = false;
  let videoFrame = null;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const portrait = () => matchMedia("(max-width: 760px) and (orientation: portrait)").matches;
  const url = (path) => new URL(path, document.baseURI).href;
  function updatePoster() {
    if (!video || movieLoaded) return;
    const mobile = portrait();
    const still = preference.matches || (connection?.saveData && !explicitPlay);
    const path = still
      ? mobile ? "./images/water-mobile.jpg" : "./images/water-desktop.jpg"
      : mobile ? "./images/water-start-mobile.jpg" : "./images/water-start-desktop.jpg";
    video.poster = url(`${path}?v=refined-20261010`);
  }
  function controls() {
    const reduced = preference.matches;
    if (toggle) {
      toggle.disabled = reduced;
      toggle.setAttribute("aria-pressed", String(paused || reduced));
      toggle.setAttribute("aria-label", reduced ? "Movimento ridotto attivo" : paused ? "Riprendi le animazioni" : "Metti in pausa le animazioni");
      const label = toggle.querySelector(".motion-label");
      const icon = toggle.querySelector(".motion-icon");
      if (label) label.textContent = reduced ? "Movimento ridotto" : paused ? "Riprendi" : "Pausa";
      if (icon) icon.textContent = paused || reduced ? "▷" : "Ⅱ";
    }
    if (replay) {
      replay.disabled = reduced;
      replay.setAttribute("aria-label", movieFailed ? "Riprova a caricare il film" : "Riproduci il film dall’inizio");
    }
    document.documentElement.dataset.motion = reduced ? "reduced" : paused ? "paused" : "running";
  }
  const canPlay = () => !disposed && !blocked && !paused && !preference.matches && !document.hidden && movieVisible && !movieComplete && !movieFailed;
  function updateFilmProgress() {
    if (filmProgress && video && Number.isFinite(video.duration) && video.duration > 0) {
      filmProgress.style.transform = `scaleX(${clamp(video.currentTime / video.duration)})`;
    }
  }
  function cancelVideoFrame() {
    if (videoFrame !== null) video?.cancelVideoFrameCallback?.(videoFrame);
    videoFrame = null;
  }
  function trackVideo() {
    if (!video?.requestVideoFrameCallback || videoFrame !== null || video.paused || !canPlay()) return;
    videoFrame = video.requestVideoFrameCallback(() => {
      videoFrame = null;
      if (disposed || !canPlay() || video.paused) return;
      updateFilmProgress();
      trackVideo();
    });
  }
  function syncMovie() {
    updatePoster();
    if (!video) return;
    if (!canPlay() || (connection?.saveData && !explicitPlay)) {
      attempt += 1;
      playPending = false;
      video.pause();
      cancelVideoFrame();
      if (movieLoaded && !movieFailed && !movieComplete) video.dataset.state = "paused";
      return;
    }
    if (!movieLoaded) {
      const mobile = portrait();
      const path = mobile ? video.dataset.srcMobile : video.dataset.srcDesktop;
      if (!path) return;
      movieLoaded = true;
      video.dataset.aspect = mobile ? "portrait" : "wide";
      video.dataset.state = "loading";
      video.src = url(path);
      video.load();
    }
    if (playPending || !video.paused) return;
    playPending = true;
    const token = ++attempt;
    video.play().then(() => {
      if (token !== attempt || disposed) return;
      playPending = false;
      if (!canPlay()) { video.pause(); return; }
      video.dataset.state = "playing";
      stage?.classList.add("is-playing");
      trackVideo();
    }).catch(() => {
      if (token !== attempt || disposed || !canPlay()) return;
      playPending = false;
      video.dataset.state = "blocked";
      video.poster = url(portrait() ? "./images/water-mobile.jpg" : "./images/water-desktop.jpg");
    });
  }
  video?.addEventListener("ended", () => {
    movieComplete = true;
    cancelVideoFrame();
    updateFilmProgress();
    video.dataset.state = "ended";
    stage?.classList.add("is-complete");
  }, { signal });
  video?.addEventListener("error", () => {
    movieFailed = true;
    video.dataset.state = "fallback";
    video.poster = url(portrait() ? "./images/water-mobile.jpg" : "./images/water-desktop.jpg");
    controls();
  }, { signal });
  video?.addEventListener("canplay", syncMovie, { signal });
  video?.addEventListener("pause", cancelVideoFrame, { signal });
  video?.addEventListener("timeupdate", updateFilmProgress, { signal });
  video?.addEventListener("seeked", updateFilmProgress, { signal });
  video?.addEventListener("playing", trackVideo, { signal });
  if (video) {
    video.muted = true;
    video.playsInline = true;
    video.loop = false;
    video.dataset.state = "idle";
  }
  replay?.addEventListener("click", () => {
    if (preference.matches || !video) return;
    explicitPlay = true;
    paused = false;
    movieComplete = false;
    if (movieFailed) { movieLoaded = false; movieFailed = false; }
    attempt += 1;
    playPending = false;
    video.currentTime = 0;
    stage?.classList.remove("is-complete");
    scene?.setPaused(blocked);
    syncMovie();
    readScroll();
    controls();
  }, { signal });

  function chapter(p) {
    const index = p < 0.25 ? 0 : p < 0.75 ? 1 : 2;
    if (selected === index) return;
    selected = index;
    if (story) story.dataset.showcaseStep = String(index);
    tabs.forEach((tab) => tab.setAttribute("aria-pressed", String(Number(tab.dataset.showcaseStep) === index)));
    copies.forEach((copy) => {
      const active = Number(copy.dataset.showcaseCopy) === index;
      copy.classList.toggle("is-active", active);
      copy.setAttribute("aria-hidden", String(!active));
      copy.inert = !active;
    });
  }
  async function ensureScene() {
    if (!sceneContainer || disposed || scenePromise) return scenePromise;
    sceneContainer.dataset.scene = "loading";
    scenePromise = Promise.all([import("./showcase.js"), document.fonts.ready]).then(([{ createShowcase }]) => {
      if (disposed) return;
      scene = createShowcase(sceneContainer);
      scene.setProgress(progress);
      scene.setPaused(paused || blocked);
      return scene;
    }).catch(() => { if (!disposed) sceneContainer.dataset.scene = "fallback"; });
    return scenePromise;
  }
  function render(time) {
    frame = 0;
    if (disposed || blocked || paused || document.hidden || !storyVisible || preference.matches) return;
    const dt = previous ? Math.min(48, time - previous) : 16;
    previous = time;
    progress += (target - progress) * (1 - Math.exp(-dt / 115));
    if (Math.abs(target - progress) < 0.00008) progress = target;
    scene?.setProgress(progress);
    if (story) story.dataset.progress = progress.toFixed(4);
    chapter(progress);
    if (progress !== target) frame = requestAnimationFrame(render);
    else previous = 0;
  }
  function request() {
    if (!frame && storyVisible && !blocked && !paused && !preference.matches && !document.hidden) frame = requestAnimationFrame(render);
  }
  function readScroll() {
    scrollFrame = 0;
    if (disposed || blocked) return;
    if (story && !preference.matches && !paused) {
      const rect = story.getBoundingClientRect();
      target = clamp(-rect.top / Math.max(1, rect.height - innerHeight));
      if (!hasScenePosition || !storyVisible) {
        hasScenePosition = true;
        progress = target;
        scene?.setProgress(progress);
        chapter(progress);
      }
      request();
    }
    if (stage && !preference.matches && !paused) {
      const rect = stage.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < innerHeight) {
        const emphasis = clamp((innerHeight - rect.top) / (innerHeight + rect.height));
        stage.style.setProperty("--film-scale", (1 + emphasis * 0.025).toFixed(4));
      }
    }
  }
  const onScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(readScroll); };
  window.addEventListener("scroll", onScroll, { passive: true, signal });
  window.addEventListener("resize", () => { updatePoster(); onScroll(); }, { passive: true, signal });
  tabs.forEach((tab) => tab.addEventListener("click", () => {
    const index = Number(tab.dataset.showcaseStep);
    const value = index / 2;
    staticStep = index;
    if (preference.matches || paused) {
      target = progress = value;
      if (paused) scene?.setPaused(false);
      scene?.setProgress(value);
      if (paused) scene?.setPaused(true);
      chapter(value);
      ensureScene();
    } else if (story) {
      const start = story.getBoundingClientRect().top + scrollY;
      scrollTo({ top: start + value * Math.max(1, story.offsetHeight - innerHeight), behavior: "smooth" });
    }
  }, { signal }));
  toggle?.addEventListener("click", () => {
    if (preference.matches) return;
    paused = !paused;
    scene?.setPaused(paused || blocked);
    if (paused) { cancelAnimationFrame(frame); frame = 0; previous = 0; }
    syncMovie();
    controls();
    if (!paused) readScroll();
  }, { signal });
  const visibility = new IntersectionObserver((entries) => entries.forEach(({ target: element, isIntersecting }) => {
    if (element === video) {
      movieVisible = isIntersecting;
      stage?.classList.toggle("is-in-view", isIntersecting);
      syncMovie();
    }
    if (element === story) {
      storyVisible = isIntersecting;
      if (isIntersecting && !blocked) { ensureScene(); readScroll(); }
      else { cancelAnimationFrame(frame); frame = 0; previous = 0; }
    }
  }), { threshold: 0.08 });
  if (video) visibility.observe(video);
  if (story) visibility.observe(story);
  const lazy = new IntersectionObserver((entries) => {
    if (!blocked && entries.some((e) => e.isIntersecting)) { ensureScene(); lazy.disconnect(); }
  }, { rootMargin: "350px 0px" });
  if (story) lazy.observe(story);
  function preferenceChange() {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    if (preference.matches) {
      staticStep = Math.max(0, selected);
      progress = target = staticStep / 2;
      if (paused) scene?.setPaused(false);
      scene?.setProgress(progress);
      if (paused) scene?.setPaused(true);
      chapter(progress);
      stage?.style.removeProperty("--film-scale");
    } else readScroll();
    syncMovie();
    controls();
  }
  preference.addEventListener("change", preferenceChange, { signal });
  document.addEventListener("visibilitychange", () => {
    syncMovie();
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previous = 0; }
    else readScroll();
  }, { signal });
  chapter(0);
  controls();
  updatePoster();
  readScroll();
  return {
    setBlocked(value) {
      if (disposed) return;
      blocked = Boolean(value);
      if (!blocked) scene?.cancelPrepare?.();
      scene?.setPaused(paused || blocked);
      if (blocked) {
        cancelAnimationFrame(frame);
        cancelAnimationFrame(scrollFrame);
        frame = scrollFrame = previous = 0;
      } else {
        readScroll();
        if (storyVisible) ensureScene();
      }
      syncMovie();
    },
    adoptPreparedVideo({ url: sourceUrl, aspect, poster } = {}) {
      if (!video || disposed || !sourceUrl) return false;
      attempt += 1;
      playPending = false;
      movieLoaded = true;
      movieComplete = movieFailed = false;
      video.pause();
      cancelVideoFrame();
      stage?.classList.remove("is-complete", "is-playing");
      video.dataset.aspect = aspect === "portrait" ? "portrait" : "wide";
      if (poster) video.poster = url(poster);
      const absoluteSource = url(sourceUrl);
      video.preload = "auto";
      if (video.src !== absoluteSource) {
        video.src = absoluteSource;
        video.load();
      }
      video.dataset.state = "prepared";
      updateFilmProgress();
      return true;
    },
    async prepareShowcase() {
      const startedBlocked = blocked;
      const preparedScene = await ensureScene();
      if (disposed || !preparedScene) return { state: "fallback" };
      if (startedBlocked && !blocked) return { state: "cancelled" };
      return preparedScene.prepare?.() ?? { state: sceneContainer?.dataset.scene ?? "fallback" };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(scrollFrame);
      visibility.disconnect();
      lazy.disconnect();
      cancelVideoFrame();
      video?.pause();
      scene?.dispose();
    },
  };
}
