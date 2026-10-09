import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

const MODES = ["orbit", "explode", "wave"];
// These identifiers belong to the public HTML timeline API.
const PHASES = ["idea", "fragments", "form"];
const DURATION = 9;
const ENVELOPE = 5.4;
const smooth = (value) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// One manufactured component, repeated exactly four times. The concave
// shoulders describe Space Media's four-point spark; the diagonal assembly
// seams and central socket remain legible in both the closed and exploded view.
function makePetalGeometry() {
  const outline = new THREE.Shape();
  outline.moveTo(-0.14, 0.24);
  outline.lineTo(-0.51, 0.57);
  outline.bezierCurveTo(-0.22, 0.94, -0.14, 1.55, -0.055, 1.88);
  outline.bezierCurveTo(-0.045, 1.96, 0.045, 1.96, 0.055, 1.88);
  outline.bezierCurveTo(0.14, 1.55, 0.22, 0.94, 0.51, 0.57);
  outline.lineTo(0.14, 0.24);
  outline.quadraticCurveTo(0, 0.18, -0.14, 0.24);
  outline.closePath();
  const geometry = new THREE.ExtrudeGeometry(outline, {
    depth: 0.3,
    steps: 1,
    curveSegments: 28,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.06,
    bevelSegments: 6,
  });
  geometry.translate(0, 0, -0.15);
  // Smooth the actual bevel and curved silhouette, retaining sharp authored
  // changes of direction. No normal-map imitation of a rounded edge.
  toCreasedNormals(geometry, Math.PI / 3);
  geometry.computeBoundingSphere();
  return geometry;
}

export function createScene(container) {
  if (!container) return { setMode() {}, setPaused() {}, playIntro() {}, dispose() {} };
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touchDevice = window.matchMedia("(pointer: coarse)").matches;
  let reducedMotion = motionPreference.matches;
  let mode = reducedMotion ? "wave" : "orbit";
  let phaseIndex = reducedMotion ? 2 : 0;
  let playing = !reducedMotion;
  let introTime = reducedMotion ? DURATION : 0;
  let lastAnnouncement = "";
  const emitMode = () => {
    container.dataset.mode = mode;
    container.dispatchEvent(new CustomEvent("modechange", { detail: { mode }, bubbles: true }));
  };
  const announce = (force = false) => {
    const progress = introTime / DURATION;
    container.dataset.phase = PHASES[phaseIndex];
    container.dataset.progress = progress.toFixed(4);
    container.dataset.playing = String(playing);
    const state = `${phaseIndex}:${playing}`;
    if (force || state !== lastAnnouncement) {
      lastAnnouncement = state;
      container.dispatchEvent(new CustomEvent("herophasechange", {
        detail: { index: phaseIndex, phase: PHASES[phaseIndex], progress, playing },
        bubbles: true,
      }));
    }
  };
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: true,
    });
  } catch {
    container.dataset.scene = "fallback";
    playing = false;
    phaseIndex = 2;
    mode = "wave";
    introTime = DURATION;
    emitMode();
    announce(true);
    return { setMode() {}, setPaused() {}, playIntro() {}, dispose() {} };
  }
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "pointer-events:none;display:block;width:100%;height:100%;";
  container.appendChild(canvas);
  container.dataset.scene = "ready";
  container.dataset.quality = "high";
  container.dataset.sceneSubject = "space-mark";
  container.dataset.sceneModules = "4";
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // Only the requested finite animation/pointer frames update the shadow pass.
  renderer.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 0, 10);
  const makeEnvironment = () => {
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      return pmrem.fromScene(room, 0.07);
    } finally {
      room.dispose();
      pmrem.dispose();
    }
  };
  let environment = makeEnvironment();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.82;
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0x2536ff,
    metalness: 0,
    roughness: 0.25,
    clearcoat: 0.78,
    clearcoatRoughness: 0.16,
    envMapIntensity: 0.85,
    dithering: true,
  });
  const lacquer = new THREE.MeshPhysicalMaterial({
    color: 0xff48b6,
    metalness: 0,
    roughness: 0.2,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.85,
    dithering: true,
  });
  const chrome = new THREE.MeshStandardMaterial({
    color: 0xf0f2f6,
    metalness: 1,
    roughness: 0.27,
    envMapIntensity: 1.15,
    dithering: true,
  });
  const materials = [ceramic, lacquer, chrome];
  const petalGeometry = makePetalGeometry();
  const coreGeometry = new RoundedBoxGeometry(0.24, 0.24, 0.32, 4, 0.075);
  const geometries = [petalGeometry, coreGeometry];
  const position = new THREE.Group();
  const rig = new THREE.Group();
  scene.add(position);
  position.add(rig);
  const modules = Array.from({ length: 4 }, (_, index) => {
    const pivot = new THREE.Group();
    pivot.rotation.z = -index * Math.PI / 2;
    const mesh = new THREE.Mesh(petalGeometry, index % 2 ? lacquer : ceramic);
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    pivot.add(mesh);
    rig.add(pivot);
    return mesh;
  });
  const core = new THREE.Mesh(coreGeometry, chrome);
  core.rotation.z = Math.PI / 4;
  core.position.z = 0.01;
  core.castShadow = core.receiveShadow = true;
  rig.add(core);
  const ambient = new THREE.HemisphereLight(0xffffff, 0x74715c, 0.48);
  const key = new THREE.DirectionalLight(0xfffaf2, 2.6);
  key.castShadow = true;
  key.shadow.bias = -0.00018;
  const fill = new THREE.DirectionalLight(0xe4edff, 0.75);
  const edge = new THREE.DirectionalLight(0xffffff, 1.45);
  scene.add(ambient, key, key.target, fill, fill.target, edge, edge.target);

  let paused = false;
  let inView = true;
  let disposed = false;
  let contextLost = false;
  let frame = 0;
  let lastTime = 0;
  let activeTime = 0;
  let width = 1;
  let height = 1;
  let compact = false;
  let fpsLimit = touchDevice ? 30 : 60;
  let sceneScale = 1;
  let centerX = 0;
  let centerY = 0;
  let qualityScale = 1;
  let frameTotal = 0;
  let frameSamples = 0;
  let renderedFrames = 0;
  let lastProgressEvent = 0;
  let transition = null;
  const pose = { explore: 0, connect: reducedMotion ? 1 : 0 };
  const pointer = { x: 0, y: 0 };
  const easedPointer = { x: 0, y: 0 };
  const surface = container.closest(".hero") || container.parentElement;
  const canRender = () => !disposed && !contextLost && inView && !document.hidden;
  const canAnimate = () => canRender() && !paused && !reducedMotion;
  const wantsFrame = () => playing || transition ||
    Math.abs(pointer.x - easedPointer.x) + Math.abs(pointer.y - easedPointer.y) > 0.001;

  const updatePose = () => {
    if (playing) {
      // Readable holds bookend two deliberate movements: inspect, then assemble.
      pose.explore = smooth((introTime - 1.4) / 1.9);
      pose.connect = smooth((introTime - 4.6) / 3);
      const nextPhase = introTime < 1.4 ? 0 : introTime < 4.6 ? 1 : 2;
      if (nextPhase !== phaseIndex) {
        phaseIndex = nextPhase;
        mode = MODES[phaseIndex];
        emitMode();
      }
      if (introTime >= DURATION) {
        playing = false;
        pose.explore = 0;
        pose.connect = 1;
      }
    } else if (transition) {
      const blend = smooth(transition.elapsed / transition.duration);
      pose.explore = THREE.MathUtils.lerp(transition.from.explore, transition.to.explore, blend);
      pose.connect = THREE.MathUtils.lerp(transition.from.connect, transition.to.connect, blend);
      if (blend === 1) transition = null;
    }
    const open = pose.explore * (1 - pose.connect);
    modules.forEach((mesh, index) => {
      // A short ordered stagger follows the same assembly axis. Absolute pose
      // math makes reversal, manual selection and replay deterministic.
      const explored = smooth((pose.explore - index * 0.035) / 0.895);
      const assembled = smooth((pose.connect - index * 0.025) / 0.925);
      const separated = explored * (1 - assembled);
      mesh.position.set(0, 0.015 + separated * 0.56, separated * (index % 2 ? -0.06 : 0.12));
      mesh.rotation.set(separated * 0.13, separated * (index % 2 ? -0.16 : 0.16), 0);
      mesh.scale.set(1, 1, 1);
    });
    core.scale.setScalar(1 + open * 0.12);
    rig.scale.setScalar(0.96 + pose.connect * 0.2);
    rig.rotation.set(
      -0.16 + pose.connect * 0.05 + easedPointer.y * 0.07,
      -0.31 + open * 0.1 + easedPointer.x * 0.15,
      -0.19 + open * 0.12 + pose.connect * 0.15,
    );
    position.position.set(centerX + easedPointer.x * 0.02, centerY - easedPointer.y * 0.015, 0);
    position.scale.setScalar(sceneScale);
    const sweep = smooth((introTime - 7.6) / 1.4);
    key.position.set(centerX + (-4.2 + sweep * 1.2) * sceneScale, centerY + 6.2 * sceneScale, 8 * sceneScale);
    key.target.position.set(centerX, centerY, 0);
    fill.position.set(centerX + 5 * sceneScale, centerY + 0.5 * sceneScale, 4 * sceneScale);
    fill.target.position.set(centerX, centerY, 0);
    edge.position.set(centerX + 2 * sceneScale, centerY + 5 * sceneScale, -4 * sceneScale);
    edge.target.position.set(centerX, centerY, 0);
    renderer.shadowMap.needsUpdate = true;
    announce();
  };
  const render = () => {
    if (!canRender()) return;
    renderer.render(scene, camera);
    renderedFrames += 1;
    container.dataset.sceneFrames = String(renderedFrames);
    container.dataset.sceneCalls = String(renderer.info.render.calls);
    container.dataset.sceneTriangles = String(renderer.info.render.triangles);
  };
  const applyPixelRatio = () => {
    // MSAA protects the narrow silhouette without rendering an iPhone's full
    // DPR3 framebuffer. The dedicated mobile art box further bounds GPU work.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5) * qualityScale);
    renderer.setSize(width, height, false);
    container.dataset.sceneDpr = renderer.getPixelRatio().toFixed(2);
    container.dataset.sceneFpsLimit = String(fpsLimit);
  };
  const tick = (now) => {
    frame = 0;
    if (!canAnimate()) return;
    // RAF may run at 120Hz on ProMotion. Only update/render at the selected cap;
    // simulation time is still elapsed time, not the number of frames.
    if (lastTime && now - lastTime < 1000 / fpsLimit - 0.75) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const delta = lastTime ? Math.min(0.1, Math.max(0, (now - lastTime) / 1000)) : 0;
    lastTime = now;
    activeTime += delta;
    if (playing) introTime = Math.min(DURATION, introTime + delta);
    if (transition) transition.elapsed += delta;
    const damping = 1 - Math.exp(-delta * 6);
    easedPointer.x += (pointer.x - easedPointer.x) * damping;
    easedPointer.y += (pointer.y - easedPointer.y) * damping;
    updatePose();
    render();
    if (now - lastProgressEvent >= 1000 / 30 || !playing) {
      lastProgressEvent = now;
      container.dispatchEvent(new CustomEvent("heroprogress", {
        detail: { progress: introTime / DURATION }, bubbles: true,
      }));
    }
    if (playing && delta > 0) {
      frameTotal += delta;
      frameSamples += 1;
      // Compare with the intentional cap; a healthy 30fps phone should never
      // be mistaken for a slow 60fps desktop merely because of its frame time.
      if (activeTime > 3 && frameSamples > fpsLimit && qualityScale === 1 &&
          frameTotal / frameSamples > 1.6 / fpsLimit) {
        qualityScale = 0.8;
        container.dataset.quality = "balanced";
        resize();
        container.dispatchEvent(new CustomEvent("scenequalitychange", {
          detail: { quality: "balanced" }, bubbles: true,
        }));
      }
    }
    if (wantsFrame()) frame = requestAnimationFrame(tick);
    else lastTime = 0;
  };
  const syncLoop = () => {
    if (canAnimate() && wantsFrame()) {
      if (!frame) {
        lastTime = 0;
        frame = requestAnimationFrame(tick);
      }
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      updatePose();
      render();
    }
  };
  const resize = () => {
    if (disposed) return;
    const rect = container.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    compact = width < 760;
    fpsLimit = compact || touchDevice ? 30 : 60;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    applyPixelRatio();
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 10;
    const visibleWidth = visibleHeight * camera.aspect;
    // Portrait and short landscape CSS provide a dedicated artwork box. Its
    // own center is the composition origin, with no text-area offset inside it.
    centerX = compact ? 0 : visibleWidth * 0.23;
    centerY = compact ? 0 : visibleHeight * 0.015;
    const diameter = compact
      ? Math.min(height * 0.92, width * 0.92)
      : Math.min(height * 0.78, width * 0.5);
    sceneScale = (diameter * visibleHeight) / (height * ENVELOPE);
    const shadowSize = compact || touchDevice || qualityScale < 1 ? 512 : 1024;
    if (key.shadow.mapSize.x !== shadowSize) {
      key.shadow.map?.dispose();
      key.shadow.map = null;
      key.shadow.mapSize.set(shadowSize, shadowSize);
    }
    const shadowCamera = key.shadow.camera;
    const shadowExtent = sceneScale * 3.1;
    shadowCamera.left = shadowCamera.bottom = -shadowExtent;
    shadowCamera.right = shadowCamera.top = shadowExtent;
    shadowCamera.near = sceneScale * 0.5;
    shadowCamera.far = sceneScale * 16;
    shadowCamera.updateProjectionMatrix();
    key.shadow.normalBias = sceneScale * 0.012;
    updatePose();
    render();
  };
  const setMode = (nextMode) => {
    if (disposed || !MODES.includes(nextMode)) return;
    playing = false;
    mode = nextMode;
    phaseIndex = MODES.indexOf(mode);
    introTime = (phaseIndex / 2) * DURATION;
    const to = mode === "orbit" ? { explore: 0, connect: 0 }
      : mode === "explode" ? { explore: 1, connect: 0 }
        : { explore: 0, connect: 1 };
    if (paused || reducedMotion) {
      Object.assign(pose, to);
      transition = null;
    } else {
      transition = { from: { ...pose }, to, elapsed: 0, duration: 1.45 };
    }
    emitMode();
    announce(true);
    updatePose();
    syncLoop();
  };
  const playIntro = () => {
    if (disposed) return;
    transition = null;
    introTime = reducedMotion ? DURATION : 0;
    activeTime = 0;
    frameTotal = 0;
    frameSamples = 0;
    playing = !reducedMotion;
    phaseIndex = reducedMotion ? 2 : 0;
    mode = MODES[phaseIndex];
    Object.assign(pose, { explore: 0, connect: reducedMotion ? 1 : 0 });
    emitMode();
    announce(true);
    updatePose();
    render();
    syncLoop();
  };
  const resetPointer = () => {
    if (pointer.x === 0 && pointer.y === 0 && easedPointer.x === 0 && easedPointer.y === 0) return;
    pointer.x = pointer.y = 0;
    syncLoop();
  };
  const onPointer = (event) => {
    if (compact || touchDevice || reducedMotion || paused || event.pointerType === "touch") return;
    const rect = container.getBoundingClientRect();
    if (event.clientX < rect.left + width * 0.42 || event.target.closest?.("a, button, input, textarea")) {
      resetPointer();
      return;
    }
    pointer.x = THREE.MathUtils.clamp(((event.clientX - rect.left) / width - 0.73) * 3, -1, 1);
    pointer.y = THREE.MathUtils.clamp(((event.clientY - rect.top) / height - 0.5) * 2, -1, 1);
    syncLoop();
  };
  const onMotion = (event) => {
    reducedMotion = event.matches;
    if (reducedMotion) {
      playing = false;
      introTime = DURATION;
      mode = "wave";
      phaseIndex = 2;
      transition = null;
      Object.assign(pose, { explore: 0, connect: 1 });
      pointer.x = pointer.y = easedPointer.x = easedPointer.y = 0;
      emitMode();
      announce(true);
    }
    syncLoop();
  };
  const onContextLost = (event) => {
    event.preventDefault();
    contextLost = true;
    container.dataset.scene = "fallback";
    canvas.style.visibility = "hidden";
    syncLoop();
  };
  const onContextRestored = () => {
    if (disposed) return;
    const previousEnvironment = environment;
    environment = makeEnvironment();
    scene.environment = environment.texture;
    previousEnvironment.dispose();
    contextLost = false;
    container.dataset.scene = "ready";
    canvas.style.visibility = "";
    resize();
    syncLoop();
  };
  const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  resizeObserver?.observe(container);
  const intersectionObserver = typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      syncLoop();
    }, { rootMargin: "30px" }) : null;
  intersectionObserver?.observe(container);
  window.addEventListener("resize", resize, { passive: true });
  surface?.addEventListener("pointermove", onPointer, { passive: true });
  surface?.addEventListener("pointerleave", resetPointer, { passive: true });
  document.addEventListener("visibilitychange", syncLoop);
  motionPreference.addEventListener("change", onMotion);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  emitMode();
  announce(true);
  resize();
  syncLoop();
  return {
    setMode,
    playIntro,
    setPaused(value) {
      paused = Boolean(value);
      if (paused) pointer.x = pointer.y = easedPointer.x = easedPointer.y = 0;
      syncLoop();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener("resize", resize);
      surface?.removeEventListener("pointermove", onPointer);
      surface?.removeEventListener("pointerleave", resetPointer);
      document.removeEventListener("visibilitychange", syncLoop);
      motionPreference.removeEventListener("change", onMotion);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      key.shadow.dispose();
      environment.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
