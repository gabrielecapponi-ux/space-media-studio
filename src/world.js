import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// A continuous, rounded doorway, with a real circular crown and straight legs.
class ArchCurve extends THREE.Curve {
  getPoint(t, target = new THREE.Vector3()) {
    const radius = 0.92;
    const leg = 1.22;
    const arc = Math.PI * radius;
    const distance = t * (leg * 2 + arc);
    if (distance < leg) return target.set(-radius, -leg + distance, 0);
    if (distance < leg + arc) {
      const angle = Math.PI - (distance - leg) / radius;
      return target.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
    }
    return target.set(radius, -(distance - leg - arc), 0);
  }
}

class SpringCurve extends THREE.Curve {
  getPoint(t, target = new THREE.Vector3()) {
    const angle = t * Math.PI * 4.6;
    return target.set(Math.cos(angle) * 0.43, (t - 0.5) * 2.35, Math.sin(angle) * 0.43);
  }
}

// TubeGeometry has open ends. Round, closed tips preserve a manufactured surface,
// and merging them into the tube keeps each instanced sculpture in one draw call.
function roundedTube(curve, segments, radius, radialSegments) {
  const tube = new THREE.TubeGeometry(curve, segments, radius, radialSegments, false);
  const tips = [0, 1].map((t) => {
    const point = curve.getPoint(t);
    return new THREE.SphereGeometry(radius, radialSegments, 12).translate(point.x, point.y, point.z);
  });
  const geometry = mergeGeometries([tube, ...tips], false);
  tube.dispose();
  tips.forEach((tip) => tip.dispose());
  geometry.computeBoundingSphere();
  return geometry;
}

export function createWorld(container, section) {
  const empty = { setPaused() {}, setChapter() {}, dispose() {} };
  if (!container || !section) return empty;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      failIfMajorPerformanceCaveat: true,
    });
  } catch {
    container.dataset.world = "fallback";
    return empty;
  }

  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { width: "100%", height: "100%", display: "block", pointerEvents: "none" });
  container.appendChild(canvas);
  container.dataset.world = "ready";
  renderer.setClearColor(0x2536ff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.96;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 50);
  camera.position.set(0, 0, 10);
  const position = new THREE.Group();
  scene.add(position);
  const sculptures = Array.from({ length: 3 }, () => {
    const group = new THREE.Group();
    position.add(group);
    return group;
  });
  const geometries = new Set();
  const materials = new Set();
  const instances = [];
  const ownGeometry = (geometry) => { geometries.add(geometry); return geometry; };
  const ownMaterial = (material) => { materials.add(material); return material; };
  const palette = [0xdfff45, 0xff48b6, 0xff6138, 0x2536ff, 0xfff8e8];
  const colors = palette.map((hex) => new THREE.Color(hex));
  const plastic = ownMaterial(new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.3,
    clearcoat: 0.9,
    clearcoatRoughness: 0.14,
    ior: 1.46,
    envMapIntensity: 0.86,
  }));
  const lacquer = ownMaterial(new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.2,
    clearcoat: 1, clearcoatRoughness: 0.1, ior: 1.48,
    envMapIntensity: 0.94,
  }));
  const satin = ownMaterial(new THREE.MeshStandardMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.38,
    envMapIntensity: 0.75,
  }));
  const coral = ownMaterial(new THREE.MeshPhysicalMaterial({
    color: palette[2], metalness: 0, roughness: 0.17,
    clearcoat: 1, clearcoatRoughness: 0.09, ior: 1.48,
    envMapIntensity: 0.94,
  }));
  function instance(geometry, count, parent, colorIndices, material = plastic) {
    const object = new THREE.InstancedMesh(ownGeometry(geometry), material, count);
    object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    object.frustumCulled = false;
    colorIndices.forEach((index, i) => object.setColorAt(i, colors[index]));
    object.instanceColor.needsUpdate = true;
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    instances.push(object);
    return object;
  }
  function makeEnvironment() {
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const target = pmrem.fromScene(room, 0.04);
    room.dispose();
    pmrem.dispose();
    return target;
  }
  let environment = makeEnvironment();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.82;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x5b5d85, 0.62));
  const key = new THREE.DirectionalLight(0xfff5e9, 3.0);
  key.position.set(-4, 5, 6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.bias = -0.00012;
  key.shadow.normalBias = 0.012;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 18;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 1.45);
  rim.position.set(4, 2, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.65);
  fill.position.set(3, -2, 5);
  scene.add(fill);

  // 01 — A tactile bunch of oversized, candy-coloured capsules. One draw call.
  const podCount = 17;
  const pods = instance(new THREE.CapsuleGeometry(0.31, 0.69, 12, 32), podCount, sculptures[0],
    [0, 1, 2, 4, 0, 1, 2, 0, 4, 1, 0, 2, 1, 4, 2, 0, 3]);
  const podSeeds = Array.from({ length: podCount }, (_, i) => {
    const latitude = Math.acos(1 - (2 * (i + 0.5)) / podCount);
    const angle = i * 2.399963;
    return {
      position: new THREE.Vector3(Math.sin(latitude) * Math.cos(angle), Math.sin(latitude) * Math.sin(angle), Math.cos(latitude)),
      angle, latitude, size: 0.88 + (i % 4) * 0.08,
    };
  });

  // 02 — A small impossible architecture: three doorways, a staircase and a spring.
  const arches = instance(roundedTube(new ArchCurve(), 72, 0.255, 24), 3, sculptures[1], [0, 1, 4], lacquer);
  const blocks = instance(new RoundedBoxGeometry(1, 1, 1, 4, 0.13), 7, sculptures[1], [2, 2, 2, 1, 1, 4, 4], satin);
  const spring = new THREE.Mesh(ownGeometry(roundedTube(new SpringCurve(), 112, 0.14, 20)), coral);
  spring.castShadow = true;
  spring.receiveShadow = true;
  sculptures[1].add(spring);

  // 03 — Interwoven loops with a choreographed constellation of solid beads.
  const loops = instance(new THREE.TorusGeometry(1.28, 0.235, 24, 96), 3, sculptures[2], [0, 1, 2], lacquer);
  const beadCount = 9;
  const beads = instance(new THREE.SphereGeometry(1, 20, 14), beadCount, sculptures[2], [4, 0, 1, 4, 2, 0, 4, 1, 2]);
  const centre = new THREE.Mesh(ownGeometry(new RoundedBoxGeometry(0.7, 0.7, 0.7, 3, 0.15)), plastic);
  centre.castShadow = true;
  centre.receiveShadow = true;
  sculptures[2].add(centre);

  const mobileQuery = window.matchMedia("(max-width: 760px)");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const dummy = new THREE.Object3D();
  const pointer = new THREE.Vector2();
  const easedPointer = new THREE.Vector2();
  const rayPointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let mobile = mobileQuery.matches;
  let progress = 0, chapter = -1, forcedChapter = null;
  let paused = false, reducedMotion = motionQuery.matches, visible = false;
  let disposed = false, contextLost = false, frame = 0, previousTime = 0, elapsed = 0;
  let width = 1, height = 1, objectScale = 1, centerX = 0, centerY = 0, pulse = 0;
  const canAnimate = () => !disposed && !contextLost && visible && !paused && !reducedMotion && !document.hidden;
  const smooth = THREE.MathUtils.smoothstep;

  function readProgress() {
    if (reducedMotion || motionQuery.matches) {
      forcedChapter ??= Math.max(0, chapter);
      progress = forcedChapter / 2;
    } else {
      const rect = section.getBoundingClientRect();
      progress = THREE.MathUtils.clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
    }
    const next = forcedChapter ?? Math.min(2, Math.floor(progress * 3));
    if (next !== chapter) {
      chapter = next;
      section.dataset.chapter = String(chapter);
      section.dispatchEvent(new CustomEvent("chapterchange", { detail: { index: chapter, progress } }));
    }
  }

  function matrix(object, index, x, y, z, rx, ry, rz, sx, sy = sx, sz = sx) {
    dummy.position.set(x, y, z);
    dummy.rotation.set(rx, ry, rz);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    object.setMatrixAt(index, dummy.matrix);
  }

  function pose() {
    const p = forcedChapter === null ? progress : forcedChapter / 2;
    const a = smooth(p, 0.22, 0.44);
    const b = smooth(p, 0.56, 0.78);
    const weights = [1 - a, a * (1 - b), b];
    const activePointer = reducedMotion || paused ? 0 : 1;
    const time = elapsed;
    const breathing = Math.sin(time * 0.75) * 0.045;
    position.position.set(centerX, centerY, 0);
    position.scale.setScalar(objectScale * (1 + pulse * 0.065));
    sculptures.forEach((group, i) => {
      const weight = weights[i];
      group.visible = weight > 0.001;
      group.scale.setScalar(Math.max(0.001, weight));
      group.position.set((i - p * 2) * (1 - weight) * 0.55, (1 - weight) * -0.35, 0);
      group.rotation.set(
        0.12 + easedPointer.y * 0.1 * activePointer + (i === 2 ? 0.12 : 0),
        -0.28 + Math.sin(time * 0.14) * 0.12 + easedPointer.x * 0.16 * activePointer + (1 - weight) * 0.6,
        (i === 1 ? -0.05 : -0.16) + Math.sin(time * 0.2) * 0.035,
      );
    });

    if (sculptures[0].visible) {
      podSeeds.forEach((seed, i) => {
        const drift = Math.sin(time * 0.7 + i * 0.8) * 0.075;
        const radius = 1.08 + breathing + drift;
        const point = seed.position;
        matrix(pods, i, point.x * radius, point.y * radius * 1.1, point.z * radius,
          seed.latitude * 0.8 + Math.sin(time * 0.3 + i) * 0.08,
          seed.angle * 0.5, seed.angle + Math.sin(time * 0.26 + i) * 0.1,
          seed.size, seed.size * (1.05 + (i % 3) * 0.12), seed.size);
      });
      pods.instanceMatrix.needsUpdate = true;
    }

    if (sculptures[1].visible) {
      const float = Math.sin(time * 0.65) * 0.06;
      matrix(arches, 0, -0.58, 0.28 + float, 0.1, -0.03, -0.18, 0.08, 1.12);
      matrix(arches, 1, 0.68, -0.1 - float, -0.62, 0.03, 0.63, -0.24, 0.85);
      matrix(arches, 2, -0.36, -1.25, 0.7, 0, 0.15, Math.PI / 2, 0.44);
      arches.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 5; i++) {
        matrix(blocks, i, -1.36 + i * 0.49, -1.52 + i * 0.17, 0.8,
          0, 0.08, 0, 0.5, 0.28 + i * 0.025, 0.68);
      }
      matrix(blocks, 5, 0.95, 1.43 + Math.sin(time * 0.8) * 0.09, 0.17,
        0.25, 0.5 + time * 0.12, 0.15, 0.57);
      matrix(blocks, 6, -1.48, 0.95 - float, 0.42,
        0.4, -0.4, -0.25, 0.33);
      blocks.instanceMatrix.needsUpdate = true;
      spring.position.set(1.27, -0.04, 0.63);
      spring.rotation.set(0.15, time * 0.18, -0.24);
      spring.scale.setScalar(0.86 + breathing * 0.4);
    }

    if (sculptures[2].visible) {
      matrix(loops, 0, -0.47, 0.27, 0, 0.66, 0.1, -0.32 + Math.sin(time * 0.35) * 0.07, 1);
      matrix(loops, 1, 0.5, -0.02, -0.12, 0.16, 1.03, 0.58 + Math.sin(time * 0.3 + 1) * 0.08, 1);
      matrix(loops, 2, 0.02, -0.5, 0.2, 1.25, 0.43, 0.3 + Math.sin(time * 0.28 + 2) * 0.08, 1);
      loops.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < beadCount; i++) {
        const angle = (i / beadCount) * Math.PI * 2 + time * 0.15;
        const radius = 2.12 + Math.sin(time * 0.4 + i) * 0.07;
        const size = 0.1 + (i % 3) * 0.055;
        matrix(beads, i, Math.cos(angle) * radius, Math.sin(angle) * radius * 0.83,
          Math.sin(angle * 2 + i) * 0.7, 0, 0, 0, size);
      }
      beads.instanceMatrix.needsUpdate = true;
      centre.rotation.set(0.3 + time * 0.13, -0.6 + time * 0.11, 0.4);
    }
    camera.updateMatrixWorld();
  }

  function render() {
    if (disposed || contextLost || document.hidden || !visible) return;
    pose();
    renderer.render(scene, camera);
    container.dataset.worldCalls = String(renderer.info.render.calls);
    container.dataset.worldTriangles = String(renderer.info.render.triangles);
    container.dataset.worldSubject = ["capsules", "architecture", "loops"][chapter < 0 ? 0 : chapter];
  }
  function tick(now) {
    frame = 0;
    if (!canAnimate()) return;
    const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.05) : 0;
    previousTime = now;
    elapsed += dt;
    easedPointer.lerp(pointer, 1 - Math.exp(-dt * 5));
    pulse = Math.max(0, pulse - dt * 1.5);
    render();
    frame = requestAnimationFrame(tick);
  }
  function syncLoop() {
    if (canAnimate()) {
      if (!frame) {
        previousTime = 0;
        frame = requestAnimationFrame(tick);
      }
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      render();
    }
  }
  function resize() {
    if (disposed || contextLost) return;
    const rect = container.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    mobile = mobileQuery.matches || width < 700;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.15 : 1.4));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const worldHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 10;
    const worldWidth = worldHeight * camera.aspect;
    const diameter = mobile ? Math.min(height * 0.56, width * 0.9) : Math.min(height * 0.78, width * 0.49);
    objectScale = ((diameter / height) * worldHeight) / 5.25;
    centerX = mobile ? 0 : worldWidth * 0.17;
    centerY = mobile ? -worldHeight * 0.13 : -worldHeight * 0.025;
    // Keep shadow texels concentrated on the sculptures as the responsive layout
    // moves and scales them. A single light provides all mutual/contact shadows.
    const shadowExtent = Math.max(0.8, objectScale * 3.5);
    key.position.set(centerX - 4, centerY + 5, 6);
    key.target.position.set(centerX, centerY, 0);
    key.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
    key.shadow.normalBias = Math.max(0.005, objectScale * 0.012);
    Object.assign(key.shadow.camera, {
      left: -shadowExtent, right: shadowExtent,
      top: shadowExtent, bottom: -shadowExtent,
    });
    key.shadow.camera.updateProjectionMatrix();
    readProgress();
    render();
  }
  function onScroll() {
    if (reducedMotion || motionQuery.matches) return;
    forcedChapter = null;
    readProgress();
    if (!canAnimate()) render();
  }
  function onPointer(event) {
    if (!visible || reducedMotion || paused || mobile) return;
    const rect = container.getBoundingClientRect();
    pointer.set(
      THREE.MathUtils.clamp(((event.clientX - rect.left) / width) * 2 - 1, -1, 1),
      THREE.MathUtils.clamp(((event.clientY - rect.top) / height) * 2 - 1, -1, 1),
    );
  }
  function onLeave() { pointer.set(0, 0); }
  function onClick(event) {
    if (!visible || contextLost || reducedMotion || paused || event.target.closest("a, button, input, textarea, select")) return;
    const rect = container.getBoundingClientRect();
    rayPointer.set(((event.clientX - rect.left) / width) * 2 - 1, -(((event.clientY - rect.top) / height) * 2 - 1));
    raycaster.setFromCamera(rayPointer, camera);
    const activeGroup = sculptures.filter((group) => group.visible);
    if (raycaster.intersectObjects(activeGroup, true).length) {
      pulse = 1;
      render();
    }
  }
  function onMotion(event) {
    forcedChapter = event.matches ? (forcedChapter ?? Math.max(0, chapter)) : null;
    reducedMotion = event.matches;
    pointer.set(0, 0);
    easedPointer.set(0, 0);
    readProgress();
    syncLoop();
  }
  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    container.dataset.world = "fallback";
    canvas.style.visibility = "hidden";
    syncLoop();
  }
  function onContextRestored() {
    contextLost = false;
    const restoredEnvironment = makeEnvironment();
    scene.environment = restoredEnvironment.texture;
    environment.dispose();
    environment = restoredEnvironment;
    container.dataset.world = "ready";
    canvas.style.visibility = "";
    resize();
    syncLoop();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    readProgress();
    syncLoop();
  }, { rootMargin: "100px" });
  observer.observe(container);
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  section.addEventListener("pointermove", onPointer, { passive: true });
  section.addEventListener("pointerleave", onLeave, { passive: true });
  section.addEventListener("click", onClick);
  document.addEventListener("visibilitychange", syncLoop);
  motionQuery.addEventListener("change", onMotion);
  canvas.addEventListener("webglcontextlost", onContextLost);
  canvas.addEventListener("webglcontextrestored", onContextRestored);
  resize();

  return {
    setPaused(value) { paused = Boolean(value); syncLoop(); },
    setChapter(index) {
      forcedChapter = THREE.MathUtils.clamp(Math.round(index), 0, 2);
      readProgress();
      render();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      section.removeEventListener("pointermove", onPointer);
      section.removeEventListener("pointerleave", onLeave);
      section.removeEventListener("click", onClick);
      document.removeEventListener("visibilitychange", syncLoop);
      motionQuery.removeEventListener("change", onMotion);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      instances.forEach((object) => object.dispose());
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      scene.environment = null;
      environment.dispose();
      key.shadow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      delete container.dataset.world;
      delete container.dataset.worldCalls;
      delete container.dataset.worldTriangles;
      delete container.dataset.worldSubject;
    },
  };
}
