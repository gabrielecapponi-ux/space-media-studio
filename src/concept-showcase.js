// Native, keyboard-accessible viewing room for the four original Blender films.
export function installConceptShowcase({ signal, onOpenChange = () => {} } = {}) {
  const dialog = document.querySelector("#concept-dialog");
  const video = dialog?.querySelector("#concept-film");
  const poster = dialog?.querySelector("img[data-concept-poster]");
  const content = dialog?.querySelector("[data-concept-content]");
  const title = dialog?.querySelector("#concept-title");
  const noop = { isOpen: () => false, close() {}, dispose() {} };
  if (signal?.aborted || !dialog || !video || !poster || !content || !title || typeof dialog.showModal !== "function") return noop;

  const keys = ["identity", "web", "cgi", "campaigns"];
  const concepts = keys.map((key) => ({
    key,
    template: document.querySelector(`template[data-concept-template="${key}"]`),
    original: document.querySelector(`#film-${key}`),
  })).filter((item) => item.template?.content && item.original);
  if (!concepts.length) return noop;

  const abort = new AbortController();
  const options = { signal: abort.signal };
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 1024px)");
  const connection = navigator.connection;
  const quality = document.querySelector("#quality-toggle");
  const play = dialog.querySelector("[data-concept-play]");
  const scrub = dialog.querySelector("[data-concept-scrub]");
  const progress = dialog.querySelector("[data-concept-progress]");
  const next = dialog.querySelector("[data-concept-next]");
  const number = dialog.querySelector("[data-concept-number]");
  const category = dialog.querySelector("[data-concept-category]");
  const qualityLabel = dialog.querySelector("[data-concept-quality]");
  const openers = [...document.querySelectorAll("[data-open-concept]")]
    .filter((button) => concepts.some((item) => item.key === button.dataset.openConcept));
  const originalHidden = new Map(openers.map((button) => [button, button.hidden]));
  let current;
  let opener;
  let opened = false;
  let disposed = false;
  let suspended = false;
  let source = "";
  let playToken = 0;
  let pending = false;
  let pendingRatio = null;
  let fallbackHD = false;
  let failed = false;
  let denied = false;
  let hasFrame = false;
  let wantsPlay = false;
  let explicit = false;
  let userPaused = false;
  let backdropPointer = false;
  let openingAnimation;
  const absolute = (path) => path ? new URL(path, document.baseURI).href : "";
  const clamp = (value) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  const duration = () => Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
  const ratio = () => duration() ? clamp(video.currentTime / duration()) : 0;
  const automatic = () => !reduced.matches && !connection?.saveData && document.documentElement.dataset.motion !== "paused";
  const canPlay = () => opened && !disposed && !suspended && !document.hidden && wantsPlay && (explicit || automatic());
  const variant = (fallback = fallbackHD) => mobile.matches ? "mobile" : quality?.getAttribute("aria-pressed") === "true" && !fallback ? "ultra" : "desktop";
  function sourceFor(item, key = variant()) {
    const data = item.original.dataset;
    const override = `concept${key[0].toUpperCase()}${key.slice(1)}`;
    if (data[override]) return { src: absolute(data[override]), key };
    if (data.conceptDesktop) return { src: absolute(data.conceptDesktop), key: "desktop" };
    if (data[key]) return { src: absolute(data[key]), key };
    return { src: absolute(data.desktop), key: "desktop" };
  }
  function inheritPosition(item) {
    const original = item.original;
    if (item.key === "identity" && ["conceptDesktop", "conceptMobile", "conceptUltra"].some((key) => original.dataset[key])) return 0;
    const selected = sourceFor(item, variant(false));
    const originalSource = absolute(original.currentSrc || original.getAttribute("src"));
    if (!selected.src || selected.src !== originalSource || (original.dataset.aspect && original.dataset.aspect !== selected.key)) return 0;
    return Number.isFinite(original.duration) && original.duration > 0 ? clamp(original.currentTime / original.duration) : 0;
  }
  function cancelOpeningAnimation() {
    const animation = openingAnimation;
    openingAnimation = undefined;
    animation?.cancel();
  }
  function openingRect(item) {
    if (!automatic() || document.hidden || typeof dialog.animate !== "function") return null;
    const frame = item.original.closest(".service-media")?.querySelector(".service-frame");
    const rect = frame?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return null;
    const section = item.original.closest(".service-chapter")?.getBoundingClientRect();
    const width = document.documentElement.clientWidth || innerWidth;
    const left = Math.max(0, rect.left, section?.left ?? 0);
    const top = Math.max(0, rect.top, section?.top ?? 0);
    const right = Math.min(width, rect.right, section?.right ?? width);
    const bottom = Math.min(innerHeight, rect.bottom, section?.bottom ?? innerHeight);
    return right - left > 1 && bottom - top > 1 ? { left, top, right, bottom } : null;
  }
  function revealDialog(rect) {
    if (!rect || !opened || !automatic()) return;
    const bounds = dialog.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const top = Math.max(0, Math.min(bounds.height, rect.top - bounds.top));
    const left = Math.max(0, Math.min(bounds.width, rect.left - bounds.left));
    const right = Math.max(0, Math.min(bounds.width, bounds.right - rect.right));
    const bottom = Math.max(0, Math.min(bounds.height, bounds.bottom - rect.bottom));
    let animation;
    try {
      animation = dialog.animate([
        { clipPath: `inset(${top}px ${right}px ${bottom}px ${left}px round 12px)` },
        { clipPath: "inset(0px 0px 0px 0px round 0px)" },
      ], { duration: 300, easing: "cubic-bezier(.22,1,.36,1)", fill: "none" });
      if (typeof animation.finished?.then !== "function") { animation.cancel(); return; }
      openingAnimation = animation;
      const release = () => {
        if (openingAnimation === animation) openingAnimation = undefined;
        if (animation.playState !== "idle") animation.cancel();
      };
      animation.finished.then(release, release);
    } catch {
      animation?.cancel();
    }
  }
  function state(value) {
    dialog.dataset.filmState = value;
    video.dataset.state = value;
  }
  function updateControls() {
    const playing = wantsPlay && !video.paused && !failed && !denied;
    video.hidden = !hasFrame;
    poster.hidden = hasFrame;
    if (play) {
      play.disabled = false;
      play.setAttribute("aria-pressed", String(playing));
      play.setAttribute("aria-label", failed ? "Riprova il film" : wantsPlay && pending ? "Metti in pausa il caricamento" : playing ? "Metti in pausa il film" : "Riproduci il film");
      play.textContent = failed ? "Riprova il film" : wantsPlay && pending ? "Caricamento…" : playing ? "Pausa" : "Riproduci";
    }
    const percent = Math.round((pendingRatio ?? ratio()) * 1000) / 10;
    if (scrub) {
      scrub.disabled = !duration() || video.readyState < 1 || failed;
      scrub.value = String(percent);
      const seconds = duration();
      scrub.setAttribute("aria-valuetext", seconds ? `${Math.round(percent)}% · ${(seconds * percent / 100).toFixed(1).replace(".", ",")} di ${seconds.toFixed(1).replace(".", ",")} secondi` : "Film non ancora caricato");
    }
    if (progress) progress.textContent = `${Math.round(percent)}%`;
    if (qualityLabel) qualityLabel.textContent = (source ? video.dataset.aspect : current ? sourceFor(current).key : variant()) === "ultra" ? "4K / 60 fps" : "Full HD / 60 fps";
  }
  function pause() {
    playToken += 1;
    pending = false;
    video.pause();
    if (video.dataset.state === "playing") state("paused");
  }
  function restorePosition() {
    if (pendingRatio === null || video.readyState < 1 || !duration()) return;
    try {
      video.currentTime = clamp(pendingRatio) * duration();
      pendingRatio = null;
    } catch {
      // Metadata can precede a seekable range on some mobile browsers.
    }
  }
  function updatePoster() {
    if (!current) return;
    const data = current.original.dataset;
    const override = data[mobile.matches ? "conceptPosterMobile" : "conceptPosterDesktop"] || data.conceptPosterDesktop;
    const path = override || data[mobile.matches ? "posterMobile" : "posterDesktop"];
    const image = current.original.closest(".service-media")?.querySelector(".service-poster");
    const src = absolute(path || image?.currentSrc || image?.getAttribute("src"));
    if (src) { poster.src = src; video.poster = src; }
    poster.alt = (!override && image?.alt) || `Concept originale: ${current.template.dataset.title || current.key}`;
  }
  function ensureSource() {
    if (!opened || !current || disposed) return false;
    const { src, key } = sourceFor(current);
    if (!src) { failed = true; state("error"); updateControls(); return false; }
    if (src === source) return true;
    if (pendingRatio === null && source) pendingRatio = ratio();
    pause();
    source = src;
    failed = false;
    denied = false;
    hasFrame = false;
    state("loading");
    video.dataset.aspect = key;
    video.preload = "auto";
    video.src = src;
    video.load();
    updateControls();
    return true;
  }
  function playback() {
    if (!canPlay()) { pause(); updateControls(); return; }
    if (failed || denied || !ensureSource() || pending || !video.paused) { updateControls(); return; }
    restorePosition();
    pending = true;
    const token = ++playToken;
    updateControls();
    let attempt;
    try { attempt = video.play(); } catch (error) { attempt = Promise.reject(error); }
    Promise.resolve(attempt).then(() => {
      if (disposed || token !== playToken) return;
      pending = false;
      if (!canPlay()) { pause(); updateControls(); return; }
      hasFrame = video.readyState >= 2;
      state("playing");
      updateControls();
    }, () => {
      if (disposed || token !== playToken) return;
      pending = false;
      denied = true;
      wantsPlay = false;
      hasFrame = false;
      state("blocked");
      updateControls();
    });
  }
  function clearSource() {
    pause();
    source = "";
    pendingRatio = null;
    hasFrame = false;
    video.removeAttribute("src");
    video.preload = "none";
    video.load();
    state("poster");
    updateControls();
  }
  function finishClose(restoreFocus = true) {
    if (!opened) return;
    cancelOpeningAnimation();
    opened = false;
    wantsPlay = false;
    clearSource();
    document.body.classList.remove("concept-open");
    onOpenChange(false);
    if (restoreFocus && opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  }
  function close(restoreFocus = true) {
    if (!opened) return;
    cancelOpeningAnimation();
    // Release the decoder before the callback can resume the main-page film.
    pause();
    if (dialog.open) dialog.close();
    finishClose(restoreFocus);
  }
  function select(item, initialRatio = 0) {
    cancelOpeningAnimation();
    pause();
    current = item;
    fallbackHD = false;
    failed = false;
    denied = false;
    explicit = false;
    pendingRatio = 0;
    hasFrame = false;
    wantsPlay = !userPaused && automatic();
    clearSource();
    pendingRatio = clamp(initialRatio);
    content.replaceChildren(item.template.content.cloneNode(true));
    title.textContent = item.template.dataset.title || item.key;
    video.setAttribute("aria-label", `${title.textContent} · Film 3D originale`);
    if (number) number.textContent = `${String(keys.indexOf(item.key) + 1).padStart(2, "0")} / 04`;
    if (category) category.textContent = item.template.dataset.category || "Concept originale";
    dialog.dataset.concept = item.key;
    const following = concepts[(concepts.indexOf(item) + 1) % concepts.length];
    next?.setAttribute("aria-label", `Concept successivo: ${following.template.dataset.title || following.key}`);
    updatePoster();
    updateControls();
    playback();
  }
  function open(item, button) {
    if (disposed || suspended) return;
    cancelOpeningAnimation();
    const wasOpen = opened;
    const rect = !wasOpen ? openingRect(item) : null;
    const initialRatio = inheritPosition(item);
    if (!opened) {
      opener = button;
      userPaused = false;
      opened = true;
      // The caller blocks the main films synchronously, before any modal play.
      onOpenChange(true);
      try { dialog.showModal(); } catch { finishClose(); return; }
      document.body.classList.add("concept-open");
    }
    select(item, initialRatio);
    revealDialog(rect);
  }
  function refreshSource() {
    if (!opened || disposed) return;
    updatePoster();
    if (source) ensureSource();
    playback();
  }
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.loop = true;
  video.preload = "none";
  video.hidden = true;
  title.setAttribute("aria-live", "polite");
  scrub?.setAttribute("aria-controls", "concept-film");
  video.addEventListener("loadedmetadata", () => {
    if (!opened || !source) return;
    restorePosition();
    updateControls();
  }, options);
  video.addEventListener("loadeddata", () => {
    if (!opened || !source || failed) return;
    hasFrame = true;
    if (!wantsPlay) state("paused");
    updateControls();
  }, options);
  video.addEventListener("canplay", () => {
    if (!opened || !source) return;
    restorePosition();
    playback();
  }, options);
  video.addEventListener("timeupdate", updateControls, options);
  video.addEventListener("error", () => {
    if (!opened || !source) return;
    if (video.dataset.aspect === "ultra" && !fallbackHD) {
      fallbackHD = true;
      if (pendingRatio === null) pendingRatio = ratio();
      ensureSource();
      playback();
      return;
    }
    failed = true;
    wantsPlay = false;
    hasFrame = false;
    pause();
    state("error");
    updateControls();
  }, options);
  play?.addEventListener("click", () => {
    if (!opened) return;
    if (wantsPlay && (!video.paused || pending)) {
      userPaused = true;
      wantsPlay = false;
      pause();
      updateControls();
      return;
    }
    explicit = true;
    userPaused = false;
    wantsPlay = true;
    denied = false;
    if (failed) { failed = false; source = ""; }
    playback();
  }, options);
  scrub?.addEventListener("input", () => {
    if (!opened || scrub.disabled) return;
    wantsPlay = false;
    userPaused = true;
    pause();
    pendingRatio = clamp(Number(scrub.value) / 100);
    restorePosition();
    state("paused");
    updateControls();
  }, options);
  next?.addEventListener("click", () => {
    if (opened && current) select(concepts[(concepts.indexOf(current) + 1) % concepts.length]);
  }, options);
  dialog.querySelector("[data-concept-idea]")?.addEventListener("click", () => {
    if (!current) return;
    const details = document.getElementById(`idea-${current.key}`);
    close(false);
    if (!details) return;
    details.open = true;
    details.scrollIntoView({ behavior: reduced.matches || document.documentElement.dataset.motion === "paused" ? "instant" : "smooth", block: "center" });
    const target = details.querySelector("summary") || details;
    if (target === details) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  }, options);
  dialog.querySelectorAll("[data-concept-close]").forEach((button) => button.addEventListener("click", () => close(), options));
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); }, options);
  dialog.addEventListener("keydown", cancelOpeningAnimation, options);
  dialog.addEventListener("close", () => { if (!dialog.open) finishClose(); }, options);
  dialog.addEventListener("pointerdown", (event) => { backdropPointer = event.target === dialog; }, options);
  dialog.addEventListener("pointercancel", () => { backdropPointer = false; }, options);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog && (backdropPointer || event.detail === 0)) close();
    backdropPointer = false;
  }, options);
  openers.forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", () => {
      const item = concepts.find((candidate) => candidate.key === button.dataset.openConcept);
      if (item) open(item, button);
    }, options);
  });
  mobile.addEventListener("change", refreshSource, options);
  reduced.addEventListener("change", () => {
    if (!opened || !reduced.matches) return;
    cancelOpeningAnimation();
    wantsPlay = false;
    userPaused = true;
    explicit = false;
    pause();
    updateControls();
  }, options);
  connection?.addEventListener?.("change", () => {
    if (opened && connection.saveData) {
      cancelOpeningAnimation();
      if (explicit) return;
      wantsPlay = false;
      userPaused = true;
      pause();
      updateControls();
    }
  }, options);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelOpeningAnimation();
    playback();
  }, options);
  window.addEventListener("pagehide", (event) => {
    suspended = true;
    cancelOpeningAnimation();
    pause();
    updateControls();
    if (!event.persisted) dispose();
  }, options);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) { suspended = false; playback(); }
  }, options);
  let observer;
  if (typeof MutationObserver === "function") {
    observer = new MutationObserver((changes) => {
      if (!opened) return;
      if (changes.some((change) => change.target === quality)) refreshSource();
      if (changes.some((change) => change.target === document.documentElement) && document.documentElement.dataset.motion === "paused") {
        cancelOpeningAnimation();
        wantsPlay = false;
        userPaused = true;
        pause();
        updateControls();
      }
    });
    if (quality) observer.observe(quality, { attributes: true, attributeFilter: ["aria-pressed"] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
  }
  function dispose() {
    if (disposed) return;
    cancelOpeningAnimation();
    close();
    disposed = true;
    observer?.disconnect();
    abort.abort();
    signal?.removeEventListener("abort", dispose);
    openers.forEach((button) => { button.hidden = originalHidden.get(button); });
  }
  signal?.addEventListener("abort", dispose, { once: true });
  updateControls();
  return { isOpen: () => opened, close: () => close(), dispose };
}
