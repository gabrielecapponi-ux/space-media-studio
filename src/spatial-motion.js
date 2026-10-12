// Original Space stage motion. Native document scrolling remains the input.
// This module is the sole transform owner of .service-frame while installed.
export function installSpatialMotion({ signal } = {}) {
  const root = document.documentElement;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const connection = navigator.connection;
  const lifetime = new AbortController();
  const ownSignal = lifetime.signal;
  const progress = document.querySelector("[data-stage-progress]");
  const progressTransform = progress?.style.transform || "";
  const stages = [...document.querySelectorAll(".service-chapter")].flatMap((section) => {
    const frame = section.querySelector(".service-frame");
    return frame ? [{
      section,
      frame,
      originalTransform: frame.style.transform,
      visible: false,
      pointerX: 0,
      pointerY: 0,
      current: [0, 0, 0, 0, 1],
      target: [0, 0, 0, 0, 1],
    }] : [];
  });
  let disposed = false;
  let blocked = false;
  let pageHidden = false;
  let request = 0;
  let previousTime = 0;
  let needsMeasure = true;
  let resizeObserver;
  let motionObserver;
  const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
  const reducedMotion = () => reduced.matches || root.dataset.motion === "reduced" || Boolean(connection?.saveData);
  const canMove = () => !disposed && !blocked && !pageHidden && !document.hidden &&
    !reducedMotion() && root.dataset.motion !== "paused";

  function stop() {
    if (request) cancelAnimationFrame(request);
    request = 0;
    previousTime = 0;
  }

  function restoreStage(stage) {
    if (stage.originalTransform) stage.frame.style.transform = stage.originalTransform;
    else stage.frame.style.removeProperty("transform");
  }

  function clearMotion() {
    for (const stage of stages) {
      stage.current = [0, 0, 0, 0, 1];
      stage.target = [0, 0, 0, 0, 1];
      stage.pointerX = stage.pointerY = 0;
      restoreStage(stage);
    }
  }

  function measure() {
    needsMeasure = false;
    const viewport = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    const positions = stages.map((stage) => stage.section.getBoundingClientRect());
    if (progress && positions.length) {
      const travel = positions.at(-1).bottom - positions[0].top - viewport;
      const completion = travel > 0 ? clamp(-positions[0].top / travel, 0, 1) : 0;
      progress.style.transform = `scaleX(${completion.toFixed(5)})`;
    }
    for (let index = 0; index < stages.length; index += 1) {
      const stage = stages[index];
      const rect = positions[index];
      stage.visible = rect.bottom > 0 && rect.top < viewport;
      const position = clamp(((viewport / 2 - rect.top) / Math.max(1, rect.height) - .5) * 2, -1, 1);
      const x = clamp(stage.pointerX, -1, 1);
      const y = clamp(stage.pointerY, -1, 1);
      // Translation remains within 28 px in total, including the pointer.
      stage.target = stage.visible ? [x * 7, clamp(-position * 21 + y * 7, -28, 28), -y * 2, x * 2,
        1 + (1 - Math.abs(position)) * .045] : [0, 0, 0, 0, 1];
      if (!stage.visible && canMove()) {
        stage.current = [...stage.target];
        restoreStage(stage);
      }
    }
  }

  function draw(stage) {
    const [x, y, rotateX, rotateY, scale] = stage.current;
    stage.frame.style.transform = `perspective(1400px) translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, 0) ` +
      `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg) scale(${scale.toFixed(5)})`;
  }

  function tick(time) {
    request = 0;
    if (!canMove()) { previousTime = 0; return; }
    if (needsMeasure) measure();
    const elapsed = previousTime ? clamp(time - previousTime, 8, 40) : 1000 / 60;
    previousTime = time;
    const approach = 1 - Math.exp(-elapsed / 72);
    let settling = false;
    for (const stage of stages) {
      if (!stage.visible) continue;
      for (let index = 0; index < stage.current.length; index += 1) {
        const difference = stage.target[index] - stage.current[index];
        const tolerance = index === 4 ? .00004 : .015;
        if (Math.abs(difference) <= tolerance) stage.current[index] = stage.target[index];
        else {
          stage.current[index] += difference * approach;
          settling = true;
        }
      }
      draw(stage);
    }
    // No idle loop: a fresh input is required once every visible stage settles.
    if (settling) request = requestAnimationFrame(tick);
    else previousTime = 0;
  }

  function refresh() {
    if (disposed) return;
    needsMeasure = true;
    if (!canMove()) {
      stop();
      // Navigation progress is informative even when decorative motion is off.
      // Read it directly; do not schedule animation frames while paused.
      measure();
      if (reducedMotion()) clearMotion();
      return;
    }
    if (!request) request = requestAnimationFrame(tick);
  }

  function resetPointer() {
    for (const stage of stages) stage.pointerX = stage.pointerY = 0;
  }

  function scrollChanged() {
    resetPointer();
    refresh();
  }

  function policyChanged() {
    resetPointer();
    refresh();
  }

  function setBlocked(value) {
    if (disposed || blocked === Boolean(value)) return;
    blocked = Boolean(value);
    resetPointer();
    refresh();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    lifetime.abort();
    resizeObserver?.disconnect();
    motionObserver?.disconnect();
    signal?.removeEventListener("abort", dispose);
    stages.forEach(restoreStage);
    if (progress) {
      if (progressTransform) progress.style.transform = progressTransform;
      else progress.style.removeProperty("transform");
    }
  }

  if (signal?.aborted) {
    disposed = true;
    return { setBlocked, dispose };
  }
  signal?.addEventListener("abort", dispose, { once: true });
  window.addEventListener("scroll", scrollChanged, { passive: true, signal: ownSignal });
  window.addEventListener("resize", refresh, { passive: true, signal: ownSignal });
  document.addEventListener("visibilitychange", policyChanged, { signal: ownSignal });
  window.addEventListener("pagehide", () => { pageHidden = true; stop(); }, { signal: ownSignal });
  window.addEventListener("pageshow", () => { pageHidden = false; policyChanged(); }, { signal: ownSignal });
  reduced.addEventListener("change", policyChanged, { signal: ownSignal });
  finePointer.addEventListener("change", policyChanged, { signal: ownSignal });
  connection?.addEventListener?.("change", policyChanged, { signal: ownSignal });
  for (const stage of stages) {
    stage.frame.addEventListener("pointermove", (event) => {
      if (!canMove() || !finePointer.matches || event.pointerType !== "mouse") return;
      // The chapter is an untransformed reference, avoiding pointer feedback
      // when the film's own transformed bounds move under the cursor.
      const rect = stage.section.getBoundingClientRect();
      stage.pointerX = clamp(((event.clientX - rect.left) / Math.max(1, rect.width) - .5) * 2, -1, 1);
      stage.pointerY = clamp(((event.clientY - rect.top) / Math.max(1, rect.height) - .5) * 2, -1, 1);
      refresh();
    }, { passive: true, signal: ownSignal });
    const pointerLeft = () => {
      if (!stage.pointerX && !stage.pointerY) return;
      stage.pointerX = stage.pointerY = 0;
      refresh();
    };
    stage.frame.addEventListener("pointerleave", pointerLeft, { passive: true, signal: ownSignal });
    stage.frame.addEventListener("pointercancel", pointerLeft, { passive: true, signal: ownSignal });
  }
  if (typeof ResizeObserver === "function") {
    resizeObserver = new ResizeObserver(refresh);
    stages.forEach((stage) => resizeObserver.observe(stage.section));
  }
  if (typeof MutationObserver === "function") {
    motionObserver = new MutationObserver(policyChanged);
    motionObserver.observe(root, { attributes: true, attributeFilter: ["data-motion"] });
  }
  refresh();
  return { setBlocked, dispose };
}
