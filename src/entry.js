import { createEntryShell } from "./entry-shell.js";

const clamp = (n) => Math.max(0, Math.min(1, n));
const phases = [
  [0, "Diamo spazio alle idee"],
  [18, "Le pareti prendono forma"],
  [38, "Prepariamo le postazioni"],
  [62, "Accendiamo le connessioni"],
  [82, "La nostra visione, a colori"],
  [96, "Benvenuto in Space"],
];

// The displayed counter follows completed/streamed work; elapsed time only
// smooths its presentation and gives the architectural sequence a clear pace.
export function createEntry(motion) {
  const shell = createEntryShell();
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const abort = new AbortController();
  const { signal } = abort;
  const html = document.documentElement;
  const background = [...document.body.children].filter((node) => node !== shell.root);
  const inertBefore = background.map((node) => node.inert);
  const focusBefore = document.activeElement;
  const ownedURLs = new Set();
  const images = [];
  const records = new Map();
  // Reopening the studio keeps the real asset check, with a shorter assembly.
  let returning = false;
  try { returning = sessionStorage.getItem("space-studio-ready") === "1"; } catch {}
  const assemblyRate = returning ? 0.055 : 0.022;
  const zoomDuration = returning ? 1050 : 1450;
  let room;
  let finished = false;
  let disposed = false;
  let settled = false;
  let target = 0;
  let displayed = 0;
  let frame = 0;
  let lastTime = 0;
  let zoomStart = 0;
  let arrivalStart = 0;
  let hiddenAt = 0;
  let phase = "loading";
  let exitTimer;
  let resolveReady;
  const ready = new Promise((resolve) => { resolveReady = resolve; });
  html.classList.add("entry-pending");
  html.dataset.entryState = "loading";
  background.forEach((node) => { node.inert = true; });
  shell.root.tabIndex = -1;
  shell.root.focus({ preventScroll: true });

  function label(percent) {
    return phases.reduce((result, [at, text]) => percent >= at ? text : result, phases[0][1]);
  }
  function request() {
    if (!frame && !finished && !disposed && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function updateRecord(key, value) {
    if (finished || disposed) return;
    const record = records.get(key);
    if (!record) return;
    record.value = Math.max(record.value, clamp(value));
    const total = [...records.values()].reduce((n, item) => n + item.weight, 0);
    target = 99 * [...records.values()].reduce((n, item) => n + item.weight * item.value, 0) / total;
    shell.root.dataset.loaded = target.toFixed(2);
    request();
  }
  function task(key, weight, work) {
    records.set(key, { weight, value: 0 });
    return Promise.resolve().then(() => work((value) => updateRecord(key, value))).catch((error) => {
      if (error?.name !== "AbortError" && !finished && !disposed) {
        shell.root.dataset.fallback = String(Number(shell.root.dataset.fallback || 0) + 1);
      }
    }).finally(() => updateRecord(key, 1));
  }
  function release(result) {
    if (finished || disposed) return;
    finished = true;
    cancelAnimationFrame(frame);
    frame = 0;
    clearTimeout(deadline);
    abort.abort();
    shell.setState("exiting");
    html.dataset.entryState = result;
    if (result === "ready") {
      try { sessionStorage.setItem("space-studio-ready", "1"); } catch {}
    }
    exitTimer = setTimeout(() => {
      if (disposed) return;
      room?.dispose();
      room = null;
      background.forEach((node, index) => { if (node.isConnected) node.inert = inertBefore[index]; });
      html.classList.remove("entry-pending");
      shell.dispose();
      motion.setBlocked(false);
      const focus = focusBefore?.isConnected && focusBefore !== document.body
        ? focusBefore : document.querySelector("#main");
      focus?.focus({ preventScroll: true });
      resolveReady(result);
    }, preference.matches ? 130 : 560);
  }
  function tick(time) {
    frame = 0;
    if (finished || disposed || document.hidden) return;
    const dt = lastTime ? Math.min(200, time - lastTime) : 16;
    lastTime = time;
    if (phase === "loading") {
      displayed = preference.matches ? target : Math.min(target, displayed + dt * assemblyRate);
      if (settled && displayed > 98.98) displayed = 99;
      shell.update(displayed, label(displayed));
      room?.setProgress(displayed / 99);
      if (settled && displayed >= 99) {
        phase = "arrival";
        arrivalStart = time;
        shell.root.dataset.ready = "true";
      }
    } else if (phase === "arrival" && time - arrivalStart >= (preference.matches ? 80 : 320)) {
      shell.update(100, "Il tuo spazio è pronto");
      if (preference.matches) return release("ready");
      phase = "zoom";
      zoomStart = time;
      shell.setState("zoom");
      html.dataset.entryState = "zoom";
    } else if (phase === "zoom") {
      const progress = clamp((time - zoomStart) / zoomDuration);
      room?.setZoom(progress);
      shell.root.style.setProperty("--entry-zoom", progress.toFixed(4));
      if (progress === 1) return release("ready");
    }
    if (phase !== "loading" || displayed < target) request();
    else lastTime = 0;
  }
  shell.skip.addEventListener("click", () => release("skipped"), { signal });
  shell.root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") { event.preventDefault(); release("skipped"); }
    if (event.key === "Tab") {
      event.preventDefault();
      shell.skip.focus({ preventScroll: true });
    }
  }, { signal });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = performance.now();
      cancelAnimationFrame(frame); frame = 0; lastTime = 0;
    } else {
      const hiddenFor = hiddenAt ? performance.now() - hiddenAt : 0;
      if (zoomStart) zoomStart += hiddenFor;
      if (arrivalStart) arrivalStart += hiddenFor;
      hiddenAt = 0;
      request();
    }
  }, { signal });
  preference.addEventListener("change", () => {
    if (preference.matches) { room?.dispose(); room = null; }
    request();
  }, { signal });
  document.addEventListener("space:entry-timeout", () => release("timeout"), { signal });
  const deadline = setTimeout(() => release("timeout"), 20000);
  const absolute = (path) => new URL(path, document.baseURI).href;
  function preloadImage(path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      images.push(image);
      const cleanup = () => {
        image.onload = image.onerror = null;
        signal.removeEventListener("abort", cancelled);
      };
      const cancelled = () => { cleanup(); reject(new DOMException("Entry ended", "AbortError")); };
      image.onload = async () => { try { await image.decode(); } catch {} cleanup(); resolve(); };
      image.onerror = () => { cleanup(); reject(new Error("Image unavailable")); };
      signal.addEventListener("abort", cancelled, { once: true });
      image.decoding = "async";
      image.src = absolute(path);
    });
  }
  const fonts = task("fonts", 5, async () => {
    await Promise.all([document.fonts.load('500 32px "Space Grotesk"'), document.fonts.load('400 16px "DM Mono"')]);
    await document.fonts.ready;
  });
  const imagePaths = ["./images/muse-skincare.jpg", "./images/forma-architecture.jpg", "./images/aura-perfume.jpg"];
  const mobile = matchMedia("(max-width: 760px) and (orientation: portrait)").matches;
  const still = preference.matches || navigator.connection?.saveData;
  imagePaths.push(`./images/water-${still ? "" : "start-"}${mobile ? "mobile" : "desktop"}.jpg?v=refined-20261010`);
  const pictures = Promise.all(imagePaths.map((path, index) => task(`image-${index}`, 4, () => preloadImage(path))));
  const roomTask = task("room", 12, async () => {
    if (preference.matches) return;
    const [{ createStudioRoom }] = await Promise.all([import("./studio-room.js"), fonts]);
    if (finished || disposed || preference.matches) return;
    room = createStudioRoom(shell.sceneHost, { reduced: preference.matches });
    room.setProgress(displayed / 99);
  });
  const videoTask = task("film", 57, async (report) => {
    if (preference.matches || navigator.connection?.saveData) return;
    const video = document.querySelector("#water-film");
    if (!video) return;
    const path = mobile ? video.dataset.srcMobile : video.dataset.srcDesktop;
    const response = await fetch(absolute(path), { signal, cache: "force-cache" });
    if (!response.ok) throw new Error("Film unavailable");
    const length = Number(response.headers.get("Content-Length"));
    const reader = response.body?.getReader();
    let blob;
    if (reader) {
      const chunks = [];
      let received = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.byteLength;
        if (length > 0) report(Math.min(0.94, received / length * 0.94));
      }
      blob = new Blob(chunks, { type: response.headers.get("Content-Type") || "video/mp4" });
    } else blob = await response.blob();
    if (finished || disposed) return;
    const blobURL = URL.createObjectURL(blob);
    ownedURLs.add(blobURL);
    const decoded = new Promise((resolve, reject) => {
      const cleanup = () => {
        video.removeEventListener("loadeddata", loaded);
        video.removeEventListener("error", failed);
        signal.removeEventListener("abort", cancelled);
      };
      const loaded = () => { cleanup(); resolve(); };
      const failed = () => { cleanup(); reject(new Error("Film decode unavailable")); };
      const cancelled = () => { cleanup(); reject(new DOMException("Entry ended", "AbortError")); };
      video.addEventListener("loadeddata", loaded, { once: true });
      video.addEventListener("error", failed, { once: true });
      signal.addEventListener("abort", cancelled, { once: true });
    });
    motion.adoptPreparedVideo({ url: blobURL, aspect: mobile ? "portrait" : "wide", poster: absolute(imagePaths.at(-1)) });
    report(0.97);
    await decoded;
    video.dataset.entryVideo = "complete";
  });
  const showcaseTask = task("showcase", 10, async () => {
    await Promise.all([pictures, fonts]);
    if (!finished && !disposed) await motion.prepareShowcase();
  });
  Promise.all([fonts, pictures, roomTask, videoTask, showcaseTask]).then(() => {
    if (finished || disposed) return;
    settled = true;
    target = 99;
    request();
  });
  request();
  return { ready, dispose() {
    if (disposed) return;
    disposed = true;
    abort.abort();
    clearTimeout(deadline);
    clearTimeout(exitTimer);
    cancelAnimationFrame(frame);
    room?.dispose();
    shell.dispose();
    background.forEach((node, index) => { if (node.isConnected) node.inert = inertBefore[index]; });
    html.classList.remove("entry-pending");
    ownedURLs.forEach((url) => URL.revokeObjectURL(url));
    ownedURLs.clear();
    images.forEach((image) => { image.onload = image.onerror = null; });
    resolveReady("disposed");
  } };
}
