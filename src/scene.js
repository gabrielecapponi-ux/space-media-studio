import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const MODES = ["orbit", "explode", "wave"];
// Keep the public phase identifiers stable for the HTML timeline controller.
const PHASES = ["idea", "fragments", "form"];
const DURATION = 10;
const PALETTE = [0x2536ff, 0xff48b6, 0xff6138, 0xdfff45, 0xfff9df];
const smooth = (value) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// Three differently shaped, continuous tubes. Each target has identical
// topology, so the geometry can bend between compositions on the GPU. These
// are authored paths rather than a shattered object or a pre-rendered movie.
function loopPoint(subject, state, t) {
  const c = Math.cos(t);
  const s = Math.sin(t);
  const double = Math.sin(t * 2);
  let x;
  let y;
  let z;
  if (state === 0) {
    if (subject === 0) {
      x = 0.83 * c - 0.13;
      y = 1.15 * s - 0.06;
      z = 0.22 * double - 0.14;
    } else if (subject === 1) {
      x = 0.68 * c + 0.27;
      y = 0.53 * s + 1.14;
      z = 0.34 * c + 0.12;
    } else {
      x = 1.11 * c - 0.04;
      y = 0.39 * s - 1.16;
      z = 0.47 * s + 0.12;
    }
  } else if (state === 1) {
    if (subject === 0) {
      x = 0.7 * c - 1.02;
      y = 0.76 * s + 0.74;
      z = 0.22 * double;
    } else if (subject === 1) {
      x = 0.67 * c + 1.03;
      y = 0.64 * s + 0.72;
      z = 0.4 * c + 0.17;
    } else {
      x = 0.92 * c + 0.09;
      y = 0.55 * s - 1.11;
      z = 0.35 * s - 0.08;
    }
  } else {
    if (subject === 0) {
      x = 1.39 * c - 0.38 * s;
      y = 0.57 * c + 0.88 * s;
      z = 0.64 * double - 0.08;
    } else if (subject === 1) {
      x = 0.88 * c + 0.25 * s;
      y = 1.47 * s - 0.12 * c;
      z = 0.68 * Math.cos(t * 2) + 0.08;
    } else {
      x = 1.12 * c + 0.3 * s;
      y = 0.81 * s - 0.61 * c;
      z = 0.83 * c - 0.14;
    }
  }
  return new THREE.Vector3(x, y, z);
}

function makeLoopGeometry(subject) {
  const paths = [0, 1, 2].map((state) => {
    const points = Array.from({ length: 48 }, (_, index) =>
      loopPoint(subject, state, (index / 48) * Math.PI * 2),
    );
    const curve = new THREE.CatmullRomCurve3(points, true, "centripetal");
    return new THREE.TubeGeometry(curve, 128, subject === 0 ? 0.255 : 0.24, 24, true);
  });
  const geometry = paths[0];
  geometry.morphAttributes.position = paths.slice(1).map((target) =>
    target.attributes.position.clone(),
  );
  geometry.morphAttributes.normal = paths.slice(1).map((target) =>
    target.attributes.normal.clone(),
  );
  geometry.morphTargetsRelative = false;
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 3.1);
  paths.slice(1).forEach((target) => target.dispose());
  return geometry;
}

const solid = (color, positions, rotations, scales) => ({
  color,
  positions: positions.map((values) => new THREE.Vector3(...values)),
  rotations: rotations.map((values) =>
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...values)),
  ),
  scales: scales.map((values) => new THREE.Vector3(...values)),
});

function makeSolids() {
  return {
    capsules: [
      solid(1, [[-0.64, 0.14, 0.45], [-1.63, -0.51, 0.2], [-1.49, -0.76, 0.17]],
        [[0, 0, 1.34], [0.4, 0.1, -0.65], [0.2, 0.3, -0.71]],
        [[0.75, 0.68, 0.75], [0.71, 0.63, 0.71], [0.59, 0.55, 0.59]]),
      solid(2, [[0.64, 0.13, 0.18], [1.68, -0.52, 0.03], [1.48, 0.87, -0.02]],
        [[0.15, -0.2, -0.38], [0.3, 0.7, 0.64], [-0.2, 0.3, 0.82]],
        [[0.75, 0.77, 0.75], [0.69, 0.7, 0.69], [0.55, 0.57, 0.55]]),
      solid(4, [[-0.51, 1.67, -0.12], [-0.19, 1.92, -0.16], [-0.75, 1.59, -0.1]],
        [[0.3, 0.1, -0.55], [0.2, 0.5, 1.12], [0.1, 0.4, 0.74]],
        [[0.5, 0.52, 0.5], [0.56, 0.53, 0.56], [0.42, 0.41, 0.42]]),
    ],
    cubes: [
      solid(0, [[0.07, -0.22, 0.51], [-0.08, 0.08, 0.68], [0.2, 0.1, 0.45]],
        [[0.2, 0.3, -0.12], [0.51, -0.31, 0.35], [0.48, 0.3, 0.1]],
        [[0.95, 0.96, 0.92], [0.85, 0.85, 0.85], [0.64, 0.64, 0.64]]),
      solid(3, [[0.69, 0.75, 0.31], [0.8, -1.86, 0.02], [1.04, -1.24, 0.26]],
        [[0.12, -0.3, 0.28], [0.6, 0.2, -0.3], [0.3, -0.2, 0.38]],
        [[0.55, 0.55, 0.55], [0.66, 0.66, 0.66], [0.53, 0.53, 0.53]]),
      solid(2, [[-0.68, -0.82, 0.02], [-1.21, -1.56, -0.11], [-1.25, 0.99, -0.15]],
        [[0.3, 0.2, -0.38], [0.4, 0.6, -0.58], [0.2, 0.6, -0.33]],
        [[0.52, 0.52, 0.52], [0.57, 0.57, 0.57], [0.4, 0.4, 0.4]]),
    ],
  };
}

// A restrained, repeatable finish rather than perfectly uniform CG plastic.
// The channels stay near white: this only breaks up the specular reflection,
// without introducing visible dirt or a coarse procedural pattern.
function makeSurfaceTexture() {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 137;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grain = (seed / 4294967296 - 0.5) * 0.3 +
        Math.sin((x / size) * Math.PI * 12) * Math.sin((y / size) * Math.PI * 10) * 0.2 + 0.5;
      const value = Math.round(241 + grain * 12);
      const offset = (y * size + x) * 4;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = value;
      pixels[offset + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function createScene(container) {
  if (!container) return { setMode() {}, setPaused() {}, playIntro() {}, dispose() {} };
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
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
      antialias: window.devicePixelRatio < 1.5,
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
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // The shadow pass follows the finite animation and pointer interaction.
  // It is not refreshed by an independent, permanently running render loop.
  renderer.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 0, 10);
  const makeEnvironment = () => {
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      return pmrem.fromScene(room, 0.06);
    } finally {
      room.dispose();
      pmrem.dispose();
    }
  };
  let environment = makeEnvironment();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.8;
  const surfaceTexture = makeSurfaceTexture();
  const glossy = (color, finish) => new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0,
    roughnessMap: surfaceTexture,
    bumpMap: surfaceTexture,
    bumpScale: 0.006,
    envMapIntensity: 0.8,
    ...finish,
  });
  const position = new THREE.Group();
  const rig = new THREE.Group();
  scene.add(position);
  position.add(rig);
  const geometries = [];
  const materials = [];
  const loops = [0, 1, 2].map((index) => {
    const geometry = makeLoopGeometry(index);
    const material = glossy(PALETTE[index], {
      roughness: 0.3,
      clearcoat: 0.72,
      clearcoatRoughness: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.castShadow = mesh.receiveShadow = true;
    geometries.push(geometry);
    materials.push(material);
    rig.add(mesh);
    return mesh;
  });
  const solidDefinitions = makeSolids();
  const instancedGroups = Object.entries(solidDefinitions).map(([kind, definitions]) => {
    const geometry = kind === "capsules"
      ? new THREE.CapsuleGeometry(0.3, 0.66, 12, 32, 1)
      : new RoundedBoxGeometry(0.92, 0.92, 0.92, 5, 0.145);
    const material = glossy(0xffffff, kind === "capsules" ? {
      roughness: 0.22,
      clearcoat: 0.95,
      clearcoatRoughness: 0.12,
    } : {
      roughness: 0.2,
      clearcoat: 0.82,
      clearcoatRoughness: 0.1,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, definitions.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    mesh.castShadow = mesh.receiveShadow = true;
    definitions.forEach((item, index) => mesh.setColorAt(index, new THREE.Color(PALETTE[item.color])));
    mesh.instanceColor.needsUpdate = true;
    geometries.push(geometry);
    materials.push(material);
    rig.add(mesh);
    return { mesh, definitions };
  });
  const ambient = new THREE.HemisphereLight(0xffffff, 0x74715c, 0.55);
  const key = new THREE.DirectionalLight(0xfffaf2, 2.65);
  key.castShadow = true;
  key.shadow.bias = -0.00018;
  const fill = new THREE.DirectionalLight(0xe4edff, 0.65);
  const edge = new THREE.DirectionalLight(0xffffff, 1.35);
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
  let mobile = false;
  let sceneScale = 1;
  let centerX = 0;
  let centerY = 0;
  let qualityScale = 1;
  let frameTotal = 0;
  let frameSamples = 0;
  let lastProgressEvent = 0;
  let transition = null;
  const pose = { explore: 0, connect: reducedMotion ? 1 : 0 };
  const pointer = { x: 0, y: 0 };
  const easedPointer = { x: 0, y: 0 };
  const dummy = new THREE.Object3D();
  const startQuaternion = new THREE.Quaternion();
  const startPosition = new THREE.Vector3();
  const startScale = new THREE.Vector3();
  const surface = container.closest(".hero") || container.parentElement;
  const canRender = () => !disposed && !contextLost && inView && !document.hidden;
  const canAnimate = () => canRender() && !paused && !reducedMotion;
  const wantsFrame = () => playing || transition ||
    Math.abs(pointer.x - easedPointer.x) + Math.abs(pointer.y - easedPointer.y) > 0.001;

  const updatePose = () => {
    if (playing) {
      pose.explore = smooth((introTime - 1.3) / 2.7);
      pose.connect = smooth((introTime - 4.8) / 3.7);
      const nextPhase = introTime < 1.3 ? 0 : introTime < 4.8 ? 1 : 2;
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
    const exploreWeight = pose.explore * (1 - pose.connect);
    loops.forEach((loop) => {
      loop.morphTargetInfluences[0] = exploreWeight;
      loop.morphTargetInfluences[1] = pose.connect;
    });
    instancedGroups.forEach(({ mesh, definitions }) => {
      definitions.forEach((item, index) => {
        startPosition.lerpVectors(item.positions[0], item.positions[1], pose.explore);
        dummy.position.lerpVectors(startPosition, item.positions[2], pose.connect);
        startScale.lerpVectors(item.scales[0], item.scales[1], pose.explore);
        dummy.scale.lerpVectors(startScale, item.scales[2], pose.connect);
        startQuaternion.slerpQuaternions(item.rotations[0], item.rotations[1], pose.explore);
        dummy.quaternion.slerpQuaternions(startQuaternion, item.rotations[2], pose.connect);
        // A small, finite flourish during the voyage, derived from the pose so
        // reversing or retargeting a transition never accumulates rotation.
        const flourish = Math.sin(pose.explore * Math.PI) * (1 - pose.connect);
        dummy.position.z += flourish * (index % 2 ? -0.18 : 0.18);
        dummy.updateMatrix();
        mesh.setMatrixAt(index, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    });
    rig.rotation.set(
      -0.08 + easedPointer.y * 0.09,
      -0.12 + pose.connect * 0.18 + easedPointer.x * 0.18,
      -0.09 + exploreWeight * 0.13 - pose.connect * 0.03,
    );
    position.position.set(centerX + easedPointer.x * 0.025, centerY - easedPointer.y * 0.02, 0);
    position.scale.setScalar(sceneScale);
    const sweep = smooth((introTime - 8.5) / 1.5);
    key.position.set(centerX + (-4.2 + sweep * 1.1) * sceneScale, centerY + 6.2 * sceneScale, 8 * sceneScale);
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
    container.dataset.sceneCalls = String(renderer.info.render.calls);
    container.dataset.sceneTriangles = String(renderer.info.render.triangles);
  };
  const applyPixelRatio = () => {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.4) * qualityScale);
    renderer.setSize(width, height, false);
  };
  const tick = (now) => {
    frame = 0;
    if (!canAnimate()) return;
    const delta = lastTime ? Math.min(0.08, Math.max(0, (now - lastTime) / 1000)) : 0;
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
      if (activeTime > 3 && frameSamples > 80 && qualityScale === 1 && frameTotal / frameSamples > 0.028) {
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
    mobile = width < 760;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    applyPixelRatio();
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 10;
    const visibleWidth = visibleHeight * camera.aspect;
    centerX = mobile ? 0 : visibleWidth * 0.23;
    centerY = mobile ? -visibleHeight * 0.11 : visibleHeight * 0.015;
    const diameter = mobile
      ? Math.min(height * 0.42, width * 0.82)
      : Math.min(height * 0.74, width * 0.49);
    // The complete exploratory arrangement fits inside a 4.8-unit envelope.
    sceneScale = (diameter * visibleHeight) / (height * 4.8);
    const shadowSize = mobile || qualityScale < 1 ? 512 : 1024;
    if (key.shadow.mapSize.x !== shadowSize) {
      key.shadow.map?.dispose();
      key.shadow.map = null;
      key.shadow.mapSize.set(shadowSize, shadowSize);
    }
    const shadowCamera = key.shadow.camera;
    const shadowExtent = sceneScale * 3.15;
    shadowCamera.left = shadowCamera.bottom = -shadowExtent;
    shadowCamera.right = shadowCamera.top = shadowExtent;
    shadowCamera.near = sceneScale * 0.5;
    shadowCamera.far = sceneScale * 16;
    shadowCamera.updateProjectionMatrix();
    key.shadow.normalBias = sceneScale * 0.018;
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
    pointer.x = pointer.y = 0;
    syncLoop();
  };
  const onPointer = (event) => {
    if (mobile || reducedMotion || paused || event.pointerType === "touch") return;
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
      instancedGroups.forEach(({ mesh }) => mesh.dispose());
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      surfaceTexture.dispose();
      key.shadow.dispose();
      environment.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
