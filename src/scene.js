import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

const MODES = ["orbit", "explode", "wave"];
// These identifiers belong to the public HTML timeline API.
const PHASES = ["idea", "fragments", "form"];
const DURATION = 11;
const ENVELOPE = 5.9;
const smooth = (value) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// The same four engineered modules unfold from a compact, deep enclosure
// into the Space Media spark. Rounded cross-sections are real closed geometry;
// their continuous normals catch softbox reflections without cap triangulation.
function makePetalGeometry(compact) {
  const profile = new THREE.CatmullRomCurve3([
    [0.12, 0.22, 0.10], [0.22, 0.31, 0.19], [0.37, 0.44, 0.25],
    [0.50, 0.57, 0.28], [0.34, 0.74, 0.28], [0.215, 1.02, 0.25],
    [0.145, 1.35, 0.20], [0.10, 1.65, 0.145], [0.054, 1.87, 0.075],
    [0, 1.96, 0],
  ].map((point) => new THREE.Vector3(...point)), false, "centripetal");
  const rows = compact ? 56 : 80;
  const radial = compact ? 24 : 32;
  const samples = profile.getPoints(rows);
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let row = 0; row < rows; row += 1) {
    const section = samples[row];
    for (let side = 0; side < radial; side += 1) {
      const angle = side / radial * Math.PI * 2;
      positions.push(section.x * Math.cos(angle), section.y, section.z * Math.sin(angle));
      uvs.push(side / radial, row / rows);
      if (row < rows - 1) {
        const a = row * radial + side;
        const b = a + radial;
        const d = row * radial + (side + 1) % radial;
        const c = d + radial;
        indices.push(a, b, d, b, c, d);
      }
    }
  }
  const base = positions.length / 3;
  positions.push(0, samples[0].y, 0);
  uvs.push(0.5, 0);
  const tip = positions.length / 3;
  positions.push(0, 1.96, 0);
  uvs.push(0.5, 1);
  for (let side = 0; side < radial; side += 1) {
    const next = (side + 1) % radial;
    indices.push(base, side, next);
    indices.push(tip, (rows - 1) * radial + next, (rows - 1) * radial + side);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeChassisGeometry(compact) {
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
    depth: 0.1, steps: 1, curveSegments: compact ? 20 : 28,
    bevelEnabled: true, bevelSize: 0.025, bevelThickness: 0.025,
    bevelSegments: compact ? 4 : 6,
  });
  geometry.translate(0, 0, -0.36);
  toCreasedNormals(geometry, Math.PI / 3);
  // Chassis caps are truly planar. Preserve their normals instead of averaging
  // a long triangulated cap with the small radius of the surrounding bevel.
  const normals = geometry.attributes.normal;
  const vertices = geometry.attributes.position;
  geometry.groups.filter((group) => group.materialIndex === 0).forEach((group) => {
    for (let index = group.start; index < group.start + group.count; index += 1) {
      normals.setXYZ(index, 0, 0, vertices.getZ(index) > -0.31 ? 1 : -1);
    }
  });
  geometry.computeBoundingSphere();
  return geometry;
}

export function createScene(container, { mediaTime = null } = {}) {
  if (!container) return { setMode() {}, setPaused() {}, playIntro() {}, setMediaTime() {}, releaseMediaClock() {}, dispose() {} };
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touchDevice = window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0;
  const economicalGeometry = touchDevice || window.innerWidth <= 760;
  let reducedMotion = motionPreference.matches;
  let mode = reducedMotion ? "wave" : "orbit";
  let phaseIndex = reducedMotion ? 2 : 0;
  let playing = !reducedMotion;
  let introTime = reducedMotion ? DURATION : 0;
  // The prerendered film and the live sculpture share one absolute timeline.
  // While media owns it, native decoding drives the UI without a hidden GL loop.
  let mediaClock = !reducedMotion && Number.isFinite(mediaTime);
  if (mediaClock) introTime = THREE.MathUtils.clamp(mediaTime, 0, DURATION);
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
    container.dataset.clock = mediaClock ? "media" : "live";
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
    return {
      setMode() {}, setPaused() {}, playIntro() {}, dispose() {},
      setMediaTime(seconds) {
        if (motionPreference.matches || !Number.isFinite(seconds)) return;
        mediaClock = true;
        introTime = THREE.MathUtils.clamp(seconds, 0, DURATION);
        playing = introTime < DURATION;
        phaseIndex = introTime < 1.5 ? 0 : introTime < 5.1 ? 1 : 2;
        mode = MODES[phaseIndex];
        emitMode();
        announce();
        container.dispatchEvent(new CustomEvent("heroprogress", {
          detail: { progress: introTime / DURATION }, bubbles: true,
        }));
      },
      releaseMediaClock() {
        if (!mediaClock) return;
        mediaClock = false;
        // Without a GL context the existing illustration is the final identity.
        playing = false;
        introTime = DURATION;
        phaseIndex = 2;
        mode = "wave";
        emitMode();
        announce(true);
        container.dispatchEvent(new CustomEvent("heroprogress", {
          detail: { progress: 1 }, bubbles: true,
        }));
      },
    };
  }
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "pointer-events:none;display:block;width:100%;height:100%;";
  container.appendChild(canvas);
  container.dataset.scene = "ready";
  container.dataset.quality = "high";
  container.dataset.sceneSubject = "space-sculpture";
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
    // A photographic studio authored for this sculpture: broad key card,
    // narrow edge card and overhead card. These are only baked into PMREM,
    // never additional live draw calls or fetched HDR assets.
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x252937);
    const cardGeometry = new THREE.PlaneGeometry(1, 1);
    const cardMaterials = [];
    const cards = [
      { at: [-3, 4, 5], size: [3.5, 5], power: 4 },
      { at: [-5, 0, 2], size: [0.9, 6], power: 3.5 },
      { at: [4, 1, -2], size: [1.5, 5], power: 3.2 },
      { at: [0, 5, 0], size: [3, 2], power: 2.5 },
    ];
    cards.forEach(({ at, size, power }) => {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffffff).multiplyScalar(power), side: THREE.DoubleSide,
      });
      cardMaterials.push(material);
      const card = new THREE.Mesh(cardGeometry, material);
      card.position.set(...at);
      card.scale.set(size[0], size[1], 1);
      card.lookAt(0, 0, 0);
      studio.add(card);
    });
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      return pmrem.fromScene(studio, 0.05);
    } finally {
      cardGeometry.dispose();
      cardMaterials.forEach((material) => material.dispose());
      pmrem.dispose();
    }
  };
  let environment = makeEnvironment();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.95;
  const ceramic = new THREE.MeshPhysicalMaterial({
    color: 0x2536ff,
    metalness: 0,
    roughness: 0.21,
    clearcoat: 0.9,
    clearcoatRoughness: 0.13,
    envMapIntensity: 0.85,
    dithering: true,
  });
  const lacquer = new THREE.MeshPhysicalMaterial({
    color: 0xff48b6,
    metalness: 0,
    roughness: 0.19,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.85,
    dithering: true,
  });
  const chrome = new THREE.MeshStandardMaterial({
    color: 0xf0f2f6,
    metalness: 1,
    roughness: 0.24,
    envMapIntensity: 1.2,
    dithering: true,
  });
  const orange = new THREE.MeshPhysicalMaterial({
    color: 0xff6138, metalness: 0, roughness: 0.19,
    clearcoat: 1, clearcoatRoughness: 0.1, dithering: true,
  });
  const materials = [ceramic, lacquer, chrome, orange];
  const petalGeometry = makePetalGeometry(economicalGeometry);
  const chassisGeometry = makeChassisGeometry(economicalGeometry);
  const coreGeometry = new RoundedBoxGeometry(0.24, 0.24, 0.32, 4, 0.075);
  const insetGeometry = new THREE.SphereGeometry(0.085, economicalGeometry ? 20 : 28, 16);
  const geometries = [petalGeometry, chassisGeometry, coreGeometry, insetGeometry];
  const position = new THREE.Group();
  const rig = new THREE.Group();
  scene.add(position);
  position.add(rig);
  const modules = Array.from({ length: 4 }, (_, index) => {
    const pivot = new THREE.Group();
    pivot.rotation.z = -index * Math.PI / 2;
    const component = new THREE.Group();
    const body = new THREE.Mesh(petalGeometry, index % 2 ? lacquer : ceramic);
    const chassis = new THREE.Mesh(chassisGeometry, chrome);
    [body, chassis].forEach((mesh) => {
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.frustumCulled = false;
      component.add(mesh);
    });
    pivot.add(component);
    rig.add(pivot);
    return component;
  });
  const core = new THREE.Group();
  const coreHousing = new THREE.Mesh(coreGeometry, chrome);
  coreHousing.rotation.z = Math.PI / 4;
  const coreInset = new THREE.Mesh(insetGeometry, orange);
  coreInset.scale.z = 0.58;
  coreInset.position.z = 0.195;
  [coreHousing, coreInset].forEach((mesh) => {
    mesh.castShadow = mesh.receiveShadow = true;
    core.add(mesh);
  });
  rig.add(core);
  const ambient = new THREE.HemisphereLight(0xffffff, 0x29324d, 0.5);
  const key = new THREE.DirectionalLight(0xfffaf2, 2.9);
  key.castShadow = true;
  key.shadow.bias = -0.00018;
  const fill = new THREE.DirectionalLight(0xe4edff, 0.8);
  const edge = new THREE.DirectionalLight(0xffffff, 1.8);
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
  const canRender = () => !disposed && !contextLost && !mediaClock && inView && !document.hidden;
  const canAnimate = () => canRender() && !paused && !reducedMotion;
  const wantsFrame = () => playing || transition ||
    Math.abs(pointer.x - easedPointer.x) + Math.abs(pointer.y - easedPointer.y) > 0.001;

  const updatePose = () => {
    if (playing || mediaClock) {
      // The camera first studies the folded object, then its construction,
      // then the finished mark. A finite final hold lets the last image breathe.
      pose.explore = smooth((introTime - 1.5) / 2.3);
      pose.connect = smooth((introTime - 5.1) / 3.5);
      const nextPhase = introTime < 1.5 ? 0 : introTime < 5.1 ? 1 : 2;
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
    const unfurled = Math.max(pose.explore, pose.connect);
    modules.forEach((component, index) => {
      // Each module travels on its own assembly axis. In the first pose the
      // forward fold reveals meaningful depth; sufficient radial clearance
      // keeps the four solid shoulders apart throughout the choreography.
      const explored = smooth((pose.explore - index * 0.035) / 0.895);
      const assembled = smooth((pose.connect - index * 0.025) / 0.925);
      const separated = explored * (1 - assembled);
      const opened = Math.max(explored, assembled);
      const radius = THREE.MathUtils.lerp(0.52, 0.015, opened) + separated * 0.82;
      component.position.set(0, radius, separated * (index % 2 ? -0.10 : 0.20));
      component.rotation.set((1 - opened) * 0.92 + separated * 0.11,
        separated * (index % 2 ? -0.13 : 0.13), 0);
      component.scale.set(1, 1, 1);
    });
    core.scale.setScalar(THREE.MathUtils.lerp(3.4, 1, smooth(unfurled)));
    core.rotation.y = open * 0.3;
    rig.scale.setScalar(1.04 - open * 0.08 + pose.connect * 0.22);
    rig.rotation.set(
      -0.22 + pose.connect * 0.09 + easedPointer.y * 0.07,
      -0.67 + open * 0.36 + pose.connect * 0.16 + easedPointer.x * 0.15,
      -0.28 + open * 0.22 + pose.connect * 0.21,
    );
    camera.position.set(easedPointer.x * 0.035, easedPointer.y * 0.02,
      10 + open * 0.3 - pose.connect * 0.16);
    position.position.set(centerX + easedPointer.x * 0.02, centerY - easedPointer.y * 0.015, 0);
    position.scale.setScalar(sceneScale);
    const sweep = smooth((introTime - 8.6) / 2.4);
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
      ? Math.min(height * 0.98, width * 0.98)
      : Math.min(height * 0.84, width * 0.55);
    sceneScale = (diameter * visibleHeight) / (height * ENVELOPE);
    const shadowSize = compact || touchDevice || qualityScale < 1 ? 512 : 1024;
    if (key.shadow.mapSize.x !== shadowSize) {
      key.shadow.map?.dispose();
      key.shadow.map = null;
      key.shadow.mapSize.set(shadowSize, shadowSize);
    }
    const shadowCamera = key.shadow.camera;
    const shadowExtent = sceneScale * 3.4;
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
    mediaClock = false;
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
    mediaClock = false;
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
    if (compact || touchDevice || reducedMotion || paused || mediaClock || event.pointerType === "touch") return;
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
      mediaClock = false;
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
    setMediaTime(seconds) {
      if (disposed || reducedMotion || !Number.isFinite(seconds)) return;
      mediaClock = true;
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      transition = null;
      pointer.x = pointer.y = easedPointer.x = easedPointer.y = 0;
      introTime = THREE.MathUtils.clamp(seconds, 0, DURATION);
      playing = introTime < DURATION;
      updatePose();
      container.dispatchEvent(new CustomEvent("heroprogress", {
        detail: { progress: introTime / DURATION }, bubbles: true,
      }));
    },
    releaseMediaClock({ complete = false } = {}) {
      if (disposed || !mediaClock) return;
      mediaClock = false;
      lastTime = 0;
      if (complete) {
        introTime = DURATION;
        playing = false;
        phaseIndex = 2;
        mode = "wave";
        transition = null;
        Object.assign(pose, { explore: 0, connect: 1 });
        emitMode();
      }
      announce(true);
      container.dispatchEvent(new CustomEvent("heroprogress", {
        detail: { progress: introTime / DURATION }, bubbles: true,
      }));
      syncLoop();
    },
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
