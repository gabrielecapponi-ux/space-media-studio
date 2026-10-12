// Four original Blender films, one decoder playing at a time.
// Native scrolling and all service copy remain available without this module.
export function createServiceFilms({ initiallyBlocked = true } = {}) {
  const abort = new AbortController();
  const { signal } = abort;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width: 1024px)");
  const connection = navigator.connection;
  const toggle = document.querySelector("#motion-toggle");
  const qualityToggle = document.querySelector("#quality-toggle");
  const rail = [...document.querySelectorAll("[data-chapter-link]")];
  const supportLink = document.querySelector('.projects-nav');
  const support = document.querySelector('#progetti');
  const contact = document.querySelector('#contatti');
  const chapters = [...document.querySelectorAll(".service-chapter")].map((section) => ({
    section,
    video: section.querySelector(".service-film"),
    media: section.querySelector(".service-media"),
    button: section.querySelector("[data-play-film]"),
    explicit: false,
    source: "",
    token: 0,
    pending: false,
    failed: false,
    denied: false,
    fallbackHD: false,
    resumeAt: null,
  }));
  let active = 0;
  let inSupplement = false;
  let paused = false;
  let blocked = initiallyBlocked;
  let disposed = false;
  let frame = 0;
  let ultra = !connection?.saveData && !/^(slow-2g|2g|3g)$/.test(connection?.effectiveType || "");
  let qualityExplicit = false;
  const absolute = (path) => new URL(path, document.baseURI).href;
  const variant = (item) => mobile.matches ? "mobile" : ultra && !item.fallbackHD ? "ultra" : "desktop";
  const canAutoload = (item) => !reduced.matches && (!connection?.saveData || item.explicit);
  function inView(item) {
    const rect = item.section.getBoundingClientRect();
    return rect.bottom > 80 && rect.top < innerHeight;
  }
  function updateControls() {
    const stopped = reduced.matches || paused;
    if (toggle) {
      toggle.disabled = reduced.matches;
      toggle.setAttribute("aria-pressed", String(stopped));
      toggle.setAttribute("aria-label", reduced.matches ? "Movimento ridotto attivo" : paused ? "Riprendi le animazioni" : "Metti in pausa le animazioni");
      const label = toggle.querySelector(".motion-label");
      if (label) label.textContent = reduced.matches ? "Movimento ridotto" : paused ? "Riprendi" : "Pausa";
      const icon = toggle.querySelector(".motion-icon");
      if (icon) icon.textContent = stopped ? "▶" : "Ⅱ";
    }
    document.documentElement.dataset.motion = reduced.matches ? "reduced" : paused ? "paused" : "running";
    if (qualityToggle) {
      const is4K = ultra && !mobile.matches && !chapters[active]?.fallbackHD;
      qualityToggle.setAttribute("aria-pressed", String(is4K));
      qualityToggle.setAttribute("aria-label", is4K ? "Qualità 4K attiva. Torna a Full HD" : "Attiva qualità 4K");
      qualityToggle.title = is4K ? "4K / 60 fps · torna a Full HD" : "Attiva 4K / 60 fps";
    }
    for (const item of chapters) {
      if (!item.button) continue;
      const state = item.video?.dataset.state;
      const hidden = reduced.matches || !(item.failed || item.denied || state === "blocked" || (connection?.saveData && !item.explicit));
      // A successful manual start removes its fallback control. Keep keyboard
      // focus in the same service instead of dropping it onto the document.
      if (hidden && document.activeElement === item.button) {
        const heading = item.section.querySelector("h1, h2");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }
      }
      item.button.hidden = hidden;
      item.button.textContent = item.failed ? "Riprova il film" : "Riproduci il film";
    }
  }
  function stop(item) {
    item.token += 1;
    item.pending = false;
    item.video?.pause();
    if (item.video?.dataset.state === "playing") item.video.dataset.state = "paused";
  }
  function ensureSource(item, preload = "auto") {
    const video = item.video;
    if (!video || !canAutoload(item) || disposed) return false;
    const key = variant(item);
    const path = video.dataset[key];
    if (!path) return false;
    const src = absolute(path);
    video.preload = preload;
    video.dataset.aspect = key;
    if (item.source === src) return true;
    // Desktop, mobile and 4K exports share the same timeline. Preserve the
    // current shot when a resize or quality change replaces the media source.
    // Keep a pending seek across rapid switches before metadata has loaded.
    if (item.resumeAt === null && (item.source || video.currentSrc)) item.resumeAt = video.currentTime;
    stop(item);
    item.source = src;
    item.failed = false;
    item.media?.classList.remove("is-playing");
    video.dataset.state = "loading";
    video.src = src;
    video.load();
    return true;
  }
  function restoreTime(item) {
    const video = item.video;
    if (!video || video.readyState < 1 || !Number.isFinite(item.resumeAt)) return;
    const end = Number.isFinite(video.duration) && video.duration > 0 ? Math.max(0, video.duration - 1 / 60) : item.resumeAt;
    try {
      video.currentTime = Math.min(Math.max(0, item.resumeAt), end);
      item.resumeAt = null;
    } catch {
      // Some engines cannot seek until canplay; retain the offset for that event.
    }
  }
  function allowed(item, index) {
    return !disposed && !blocked && !inSupplement && !paused && !reduced.matches && !document.hidden &&
      index === active && inView(item) && canAutoload(item) && !item.failed && !item.denied;
  }
  function sync() {
    if (disposed) return;
    chapters.forEach((item, index) => {
      const video = item.video;
      if (!video) return;
      const nextSource = video.dataset[variant(item)];
      if (item.failed && nextSource && item.source !== absolute(nextSource)) {
        item.failed = false;
        item.source = "";
      }
      video.poster = absolute(video.dataset[mobile.matches ? "posterMobile" : "posterDesktop"] || video.getAttribute("poster"));
      if (!allowed(item, index)) { stop(item); return; }
      if (!ensureSource(item) || item.pending || !video.paused) return;
      restoreTime(item);
      item.pending = true;
      const token = ++item.token;
      video.play().then(() => {
        if (disposed || token !== item.token) return;
        item.pending = false;
        if (!allowed(item, index)) { stop(item); return; }
        video.dataset.state = "playing";
        item.media?.classList.add("is-playing");
        updateControls();
      }).catch(() => {
        if (disposed || token !== item.token) return;
        item.pending = false;
        if (!allowed(item, index)) return;
        item.denied = true;
        video.dataset.state = "blocked";
        item.media?.classList.remove("is-playing");
        updateControls();
      });
    });
    if (!blocked && !inSupplement && !paused && !document.hidden && chapters[active + 1]) ensureSource(chapters[active + 1], "metadata");
    updateControls();
  }
  function readPosition() {
    frame = 0;
    if (disposed || !chapters.length) return;
    const line = innerHeight * 0.48;
    let chosen = 0;
    let distance = Infinity;
    chapters.forEach((item, index) => {
      const rect = item.section.getBoundingClientRect();
      const value = rect.top <= line && rect.bottom >= line ? 0 : Math.min(Math.abs(rect.top - line), Math.abs(rect.bottom - line));
      if (value < distance) { distance = value; chosen = index; }
    });
    active = chosen;
    chapters.forEach((item, index) => item.section.classList.toggle("is-current", index === active));
    document.documentElement.dataset.chapter = chapters[active].section.dataset.chapter;
    const containsLine = (element) => {
      const bounds = element?.getBoundingClientRect();
      return bounds && bounds.top <= line && bounds.bottom >= line;
    };
    const inSupport = containsLine(support);
    const inContact = containsLine(contact);
    inSupplement = inSupport || inContact;
    document.documentElement.dataset.theme = inSupport || inContact ? "light" : chapters[active].section.dataset.theme || (active % 2 ? "dark" : "light");
    rail.forEach((link) => {
      const selected = !inSupport && !inContact && link.getAttribute("href") === `#${chapters[active].section.id}`;
      if (selected) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    if (inSupport) supportLink?.setAttribute('aria-current', 'location');
    else supportLink?.removeAttribute('aria-current');
    const indicator = document.querySelector("[data-current-chapter]");
    if (indicator) indicator.textContent = String(active + 1).padStart(2, "0");
    sync();
  }
  function requestRead() { if (!frame && !disposed) frame = requestAnimationFrame(readPosition); }
  // Native idea boxes can change chapter height without a window resize.
  const layoutObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(requestRead) : null;
  chapters.forEach((item) => layoutObserver?.observe(item.section));
  if (support) layoutObserver?.observe(support);
  chapters.forEach((item) => {
    const video = item.video;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.dataset.state = "poster";
    video.addEventListener("error", () => {
      // Retry once in Full HD when the 4K source cannot be decoded or fetched.
      if (video.dataset.aspect === "ultra") {
        item.fallbackHD = true;
        item.source = "";
        item.failed = false;
        item.denied = false;
        sync();
        return;
      }
      item.failed = true;
      stop(item);
      video.dataset.state = "fallback";
      item.media?.classList.remove("is-playing");
      updateControls();
    }, { signal });
    video.addEventListener("loadedmetadata", () => restoreTime(item), { signal });
    video.addEventListener("canplay", () => { restoreTime(item); if (!item.pending) sync(); }, { signal });
    item.button?.addEventListener("click", () => {
      if (reduced.matches) return;
      item.explicit = true;
      item.denied = false;
      paused = false;
      if (item.failed) { item.source = ""; item.failed = false; }
      if (chapters[active] !== item) item.section.scrollIntoView({ behavior: "smooth", block: "start" });
      readPosition();
    }, { signal });
  });
  toggle?.addEventListener("click", () => {
    if (reduced.matches) return;
    paused = !paused;
    sync();
  }, { signal });
  qualityToggle?.addEventListener("click", () => {
    ultra = !(ultra && !chapters[active]?.fallbackHD);
    qualityExplicit = true;
    if (chapters[active]) {
      chapters[active].fallbackHD = false;
      chapters[active].explicit = true;
      chapters[active].denied = false;
      chapters[active].failed = false;
      chapters[active].source = "";
    }
    sync();
  }, { signal });
  window.addEventListener("scroll", requestRead, { passive: true, signal });
  window.addEventListener("resize", requestRead, { passive: true, signal });
  document.addEventListener("visibilitychange", sync, { signal });
  reduced.addEventListener("change", () => {
    if (reduced.matches) chapters.forEach((item) => item.media?.classList.remove("is-playing"));
    sync();
  }, { signal });
  mobile.addEventListener("change", sync, { signal });
  connection?.addEventListener?.("change", () => {
    if (!qualityExplicit) ultra = !connection.saveData && !/^(slow-2g|2g|3g)$/.test(connection.effectiveType || "");
    sync();
  }, { signal });
  readPosition();
  return {
    setBlocked(value) { blocked = Boolean(value); readPosition(); },
    async prepareFirst({ onProgress = () => {}, timeoutMs = 4500 } = {}) {
      const item = chapters[0];
      if (disposed) return { state: "cancelled" };
      if (!item?.video || !canAutoload(item)) return { state: "poster" };
      if (!ensureSource(item)) return { state: "poster" };
      const video = item.video;
      if (video.readyState >= 2) return { state: "ready" };
      return new Promise((resolve) => {
        let timer;
        let finished = false;
        const finish = (state) => {
          if (finished) return;
          finished = true;
          clearTimeout(timer);
          video.removeEventListener("loadeddata", ready);
          video.removeEventListener("progress", progress);
          video.removeEventListener("error", failed);
          reduced.removeEventListener("change", preferenceChanged);
          connection?.removeEventListener?.("change", preferenceChanged);
          signal.removeEventListener("abort", cancelled);
          resolve({ state });
        };
        const ready = () => finish("ready");
        const failed = () => finish("poster");
        const cancelled = () => finish("cancelled");
        const preferenceChanged = () => { if (!canAutoload(item)) finish("poster"); };
        const progress = () => {
          if (Number.isFinite(video.duration) && video.duration > 0 && video.buffered.length) onProgress(Math.min(1, video.buffered.end(video.buffered.length - 1) / video.duration));
        };
        video.addEventListener("loadeddata", ready, { once: true });
        video.addEventListener("progress", progress);
        video.addEventListener("error", failed, { once: true });
        reduced.addEventListener("change", preferenceChanged);
        connection?.addEventListener?.("change", preferenceChanged);
        signal.addEventListener("abort", cancelled, { once: true });
        timer = setTimeout(() => finish("poster"), timeoutMs);
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      abort.abort();
      layoutObserver?.disconnect();
      cancelAnimationFrame(frame);
      chapters.forEach((item) => {
        stop(item);
        item.video?.removeAttribute("src");
        item.video?.load();
      });
    },
  };
}
