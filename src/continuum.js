import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const SECTION_IDS = ["universo", "servizi", "studio", "contatti"];
const SUBJECTS = ["optical-system", "continuous-ribbon", "shared-orbits", "connected-links"];
const TAU = Math.PI * 2;

class EllipsePath extends THREE.Curve {
  constructor(rx, ry) { super(); this.rx = rx; this.ry = ry; }
  getPoint(t, target = new THREE.Vector3()) {
    return target.set(Math.cos(t * TAU) * this.rx, Math.sin(t * TAU) * this.ry, 0);
  }
}

// A closed solid ribbon with one complete, orientable twist. The elliptical
// cross-section gives the ribbon a real, softly rounded edge and thickness.
function ribbonGeometry(rows, columns) {
  const positions = [], uvs = [], indices = [];
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  for (let row = 0; row <= rows; row++) {
    const u = row / rows * TAU;
    tangent.set(-1.45 * Math.sin(u), 0.98 * Math.cos(u), 0.36 * Math.cos(u * 2)).normalize();
    normal.set(Math.cos(u), Math.sin(u), 0);
    normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
    binormal.crossVectors(tangent, normal).normalize();
    const twist = u;
    for (let column = 0; column <= columns; column++) {
      const v = column / columns * TAU;
      const crossX = Math.cos(v) * 0.37;
      const crossY = Math.sin(v) * 0.075;
      const n = crossX * Math.cos(twist) - crossY * Math.sin(twist);
      const b = crossX * Math.sin(twist) + crossY * Math.cos(twist);
      positions.push(
        Math.cos(u) * 1.45 + normal.x * n + binormal.x * b,
        Math.sin(u) * 0.98 + normal.y * n + binormal.y * b,
        Math.sin(u * 2) * 0.18 + normal.z * n + binormal.z * b,
      );
      uvs.push(row / rows, column / columns);
      if (row < rows && column < columns) {
        const a = row * (columns + 1) + column;
        const next = a + columns + 1;
        indices.push(a, a + 1, next, next, a + 1, next + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  const join = (a, b) => {
    normal.fromBufferAttribute(normals, a);
    binormal.fromBufferAttribute(normals, b);
    normal.add(binormal).normalize();
    normals.setXYZ(a, normal.x, normal.y, normal.z);
    normals.setXYZ(b, normal.x, normal.y, normal.z);
  };
  for (let row = 0; row <= rows; row++) join(row * (columns + 1), row * (columns + 1) + columns);
  for (let column = 0; column <= columns; column++) join(column, rows * (columns + 1) + column);
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * One decorative, demand-rendered Three.js canvas shared by the four lower
 * sections. Each section supplies an aria-hidden [data-continuum-slot].
 * Import continuum.css after the site's styles, then call createContinuum().
 * The caller owns the returned { setPaused(value), dispose() } lifecycle.
 */
export function createContinuum({ root = document.querySelector("main") || document.body, paused = false } = {}) {
  const empty = { setPaused() {}, dispose() {} };
  if (!root?.querySelector) return empty;
  const sections = SECTION_IDS.map((id) => root.querySelector(`#${id}`)).filter(Boolean);
  const entries = sections.map((section) => ({
    section, slot: section.querySelector("[data-continuum-slot]"),
    index: SECTION_IDS.indexOf(section.id),
  })).filter((entry) => entry.slot);
  if (!entries.length) return empty;

  const host = document.createElement("div");
  host.className = "continuum-layer";
  host.setAttribute("aria-hidden", "true");
  host.dataset.active = "false";
  host.dataset.state = "pending";
  host.innerHTML = `<svg class="continuum-fallback" viewBox="0 0 400 400" focusable="false" aria-hidden="true"><g fill="none" stroke-linecap="round"><ellipse cx="200" cy="200" rx="126" ry="81" transform="rotate(-28 200 200)" stroke="#2536ff" stroke-width="18"/><ellipse cx="200" cy="200" rx="126" ry="81" transform="rotate(43 200 200)" stroke="#ff48b6" stroke-width="14"/><circle cx="200" cy="200" r="24" fill="#fff8e8" stroke="#2536ff" stroke-width="3"/></g></svg>`;
  document.body.appendChild(host);
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touchQuery = window.matchMedia("(pointer: coarse)");
  const compactQuery = window.matchMedia("(max-width: 760px)");
  const economical = () => touchQuery.matches || compactQuery.matches || navigator.maxTouchPoints > 0;
  const lowDetail = economical();
  const radial = lowDetail ? 12 : 20;
  const segments = lowDetail ? 48 : 72;
  const geometries = new Set();
  const materials = new Set();
  let renderer = null, scene = null, camera = null, environment = null, rig = null;
  let groups = [], nodes = [];
  let active = null, activeIndex = -1, visible = false;
  let disposed = false, contextLost = false, failed = false;
  let isPaused = Boolean(paused), reducedMotion = motionQuery.matches;
  let targetProgress = 0.5, easedProgress = 0.5, entrance = 1;
  let frame = 0, lastTime = 0, lastPaint = 0, renderedFrames = 0;
  let width = 1, height = 1, sceneScale = 1;
  const canRender = () => renderer && !disposed && !contextLost && visible && !document.hidden;
  const needsFrame = () => Math.abs(targetProgress - easedProgress) > 0.0001 || entrance < 1;
  const canAnimate = () => canRender() && !isPaused && !reducedMotion && needsFrame();
  const ownGeometry = (geometry) => { geometries.add(geometry); return geometry; };
  const ownMaterial = (material) => { materials.add(material); return material; };

  function makeEnvironment() {
    const room = new RoomEnvironment();
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      return pmrem.fromScene(room, 0.06, 0.1, 100, { size: 128 });
    } finally {
      room.dispose();
      pmrem.dispose();
    }
  }
  function initialize() {
    if (renderer || failed || disposed) return;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true, antialias: true, powerPreference: "low-power",
        failIfMajorPerformanceCaveat: true,
      });
      const canvas = renderer.domElement;
      canvas.className = "continuum-canvas";
      canvas.setAttribute("aria-hidden", "true");
      host.appendChild(canvas);
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 0.94;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
      camera.position.z = 8;
      environment = makeEnvironment();
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.8;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x565f8d, 0.65));
      const key = new THREE.DirectionalLight(0xfff6ec, 2.8);
      key.position.set(-3.5, 4, 6);
      const edge = new THREE.DirectionalLight(0xdbe7ff, 1.6);
      edge.position.set(4, 1, -3);
      scene.add(key, edge);
      const plastic = (color, roughness = 0.23) => ownMaterial(new THREE.MeshPhysicalMaterial({
        color, metalness: 0, roughness, clearcoat: 0.8,
        clearcoatRoughness: 0.15, envMapIntensity: 0.85,
      }));
      const cobalt = plastic(0x2536ff);
      const pink = plastic(0xff48b6);
      const cream = plastic(0xfff8e8, 0.28);
      const lime = plastic(0xdfff45, 0.27);
      const metal = ownMaterial(new THREE.MeshStandardMaterial({
        color: 0xe5e9f0, metalness: 1, roughness: 0.28, envMapIntensity: 1.1,
      }));
      rig = new THREE.Group();
      scene.add(rig);
      groups = Array.from({ length: 4 }, () => {
        const group = new THREE.Group();
        rig.add(group);
        return group;
      });
      const add = (geometry, material, group) => {
        const object = new THREE.Mesh(ownGeometry(geometry), material);
        group.add(object);
        return object;
      };
      // Portfolio: a small exploded optical assembly, with an opaque opal lens.
      add(new THREE.TorusGeometry(1.24, 0.09, radial, segments), metal, groups[0]);
      const front = add(new THREE.TorusGeometry(0.97, 0.14, radial, segments), cobalt, groups[0]);
      front.position.z = 0.15;
      const opal = add(new THREE.SphereGeometry(0.8, lowDetail ? 28 : 40, lowDetail ? 18 : 26), cream, groups[0]);
      opal.scale.z = 0.2;
      const focus = add(new THREE.SphereGeometry(0.35, 24, 16), pink, groups[0]);
      focus.scale.z = 0.3;
      focus.position.z = 0.18;
      const rear = add(new THREE.TorusGeometry(1.08, 0.055, radial, segments), cobalt, groups[0]);
      rear.position.z = -0.42;
      // Services: one closed, solid, twisting ribbon instead of loose fragments.
      add(ribbonGeometry(lowDetail ? 72 : 112, lowDetail ? 14 : 20), cobalt, groups[1]);
      const ribbonJoin = add(new THREE.SphereGeometry(0.16, 24, 16), cream, groups[1]);
      ribbonJoin.position.set(1.45, 0, 0.08);
      // Studio: two distinct orbits with a shared centre, mirroring two founders.
      const ellipse = ownGeometry(new THREE.TubeGeometry(new EllipsePath(1.42, 0.92), segments, 0.055, radial, true));
      const orbitA = new THREE.Mesh(ellipse, metal);
      orbitA.rotation.x = 0.55;
      groups[2].add(orbitA);
      const orbitB = new THREE.Mesh(ellipse, cobalt);
      orbitB.rotation.set(-0.25, 0.7, 0.78);
      groups[2].add(orbitB);
      add(new THREE.SphereGeometry(0.29, 24, 16), pink, groups[2]);
      nodes = [
        add(new THREE.SphereGeometry(0.17, 20, 14), cream, orbitA),
        add(new THREE.SphereGeometry(0.2, 20, 14), lime, orbitB),
      ];
      // Contact: two genuine interlinked solid rings with generous clearance.
      const linkA = add(new THREE.TorusGeometry(0.98, 0.19, radial, segments), lime, groups[3]);
      linkA.position.x = -0.58;
      const linkB = add(new THREE.TorusGeometry(0.98, 0.19, radial, segments), cream, groups[3]);
      linkB.position.x = 0.58;
      linkB.rotation.x = Math.PI / 2;
      canvas.addEventListener("webglcontextlost", onContextLost);
      canvas.addEventListener("webglcontextrestored", onContextRestored);
      host.dataset.state = "ready";
    } catch {
      failed = true;
      host.dataset.state = "fallback";
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement.remove();
        renderer = null;
      }
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      geometries.clear();
      materials.clear();
      environment?.dispose();
      environment = null;
    }
  }
  function pose() {
    const p = reducedMotion ? 0.5 : easedProgress;
    const enter = THREE.MathUtils.smootherstep(entrance, 0, 1);
    const baseScale = [1.2, 1, 1.1, 1.03][activeIndex] || 1;
    rig.scale.setScalar(sceneScale * baseScale * (0.93 + enter * 0.07));
    rig.rotation.set(-0.16 + (p - 0.5) * 0.18, -0.35 + (p - 0.5) * 0.5, -0.12 + (p - 0.5) * 0.16);
    groups.forEach((group, index) => { group.visible = index === activeIndex; });
    if (activeIndex === 2) {
      nodes.forEach((node, index) => {
        const angle = (index ? 0.62 : 2.9) + (p - 0.5) * 0.7;
        node.position.set(Math.cos(angle) * 1.42, Math.sin(angle) * 0.92, 0);
      });
    }
    if (activeIndex === 3) rig.rotation.x += 0.42;
  }
  function render() {
    if (!canRender()) return;
    pose();
    renderer.render(scene, camera);
    renderedFrames++;
    host.dataset.frames = String(renderedFrames);
    host.dataset.calls = String(renderer.info.render.calls);
    host.dataset.triangles = String(renderer.info.render.triangles);
  }
  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = lastPaint = 0;
  }
  function tick(now) {
    frame = 0;
    if (!canAnimate()) return;
    const interval = 1000 / (economical() ? 30 : 60);
    if (lastPaint && now - lastPaint < interval - 0.5) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.08) : interval / 1000;
    lastTime = lastPaint = now;
    entrance = Math.min(1, entrance + dt / 0.65);
    easedProgress = THREE.MathUtils.lerp(easedProgress, targetProgress, 1 - Math.exp(-dt * 8));
    if (Math.abs(targetProgress - easedProgress) <= 0.0001) easedProgress = targetProgress;
    render();
    if (canAnimate()) frame = requestAnimationFrame(tick);
    else lastTime = lastPaint = 0;
  }
  function schedule() {
    if (canAnimate()) {
      if (!frame) {
        lastTime = lastPaint = 0;
        frame = requestAnimationFrame(tick);
      }
    } else stop();
  }
  function resizeCanvas(nextWidth, nextHeight) {
    width = Math.max(1, nextWidth);
    height = Math.max(1, nextHeight);
    if (!renderer || contextLost) return;
    const dpr = Math.min(window.devicePixelRatio || 1, economical() ? 1.15 : 1.4);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const worldHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 8;
    sceneScale = Math.min(width, height) * 0.91 * worldHeight / (height * 4);
    host.dataset.dpr = dpr.toFixed(2);
    host.dataset.fpsLimit = economical() ? "30" : "60";
  }
  function readLayout(force = false) {
    if (disposed) return;
    let best = null, bestScore = 0, bestRect = null;
    entries.forEach((entry) => {
      const rect = entry.slot.getBoundingClientRect();
      const shown = Math.max(0, Math.min(window.innerHeight, rect.bottom) - Math.max(0, rect.top));
      const shownWidth = Math.max(0, Math.min(window.innerWidth, rect.right) - Math.max(0, rect.left));
      const score = shown * shownWidth;
      if (score > bestScore && rect.width > 2 && rect.height > 2) {
        best = entry; bestRect = rect; bestScore = score;
      }
    });
    visible = Boolean(best) && !document.hidden;
    host.dataset.active = String(visible);
    if (!visible) { stop(); return; }
    const changed = active !== best;
    active = best;
    activeIndex = best.index;
    host.dataset.section = best.section.id;
    host.dataset.subject = SUBJECTS[activeIndex];
    host.style.width = `${bestRect.width}px`;
    host.style.height = `${bestRect.height}px`;
    host.style.transform = `translate3d(${bestRect.left}px,${bestRect.top}px,0)`;
    const sectionRect = best.section.getBoundingClientRect();
    const topClip = Math.max(0, sectionRect.top - bestRect.top);
    const bottomClip = Math.max(0, bestRect.bottom - sectionRect.bottom);
    host.style.clipPath = `inset(${topClip}px 0 ${bottomClip}px 0)`;
    targetProgress = THREE.MathUtils.clamp((window.innerHeight - bestRect.top) / (window.innerHeight + bestRect.height), 0, 1);
    initialize();
    if (changed) {
      easedProgress = targetProgress;
      entrance = isPaused || reducedMotion ? 1 : 0;
    }
    const sizeChanged = Math.abs(width - bestRect.width) > 0.5 || Math.abs(height - bestRect.height) > 0.5;
    if (sizeChanged || changed || force) resizeCanvas(bestRect.width, bestRect.height);
    if (reducedMotion) { easedProgress = 0.5; entrance = 1; }
    if (changed || sizeChanged || force) render();
    schedule();
  }
  function onVisibility() {
    if (document.hidden) { visible = false; stop(); }
    else readLayout(true);
  }
  const onScroll = () => readLayout();
  const onResize = () => readLayout(true);
  function onMotion(event) {
    reducedMotion = event.matches;
    if (reducedMotion) { easedProgress = 0.5; entrance = 1; }
    readLayout(true);
  }
  function onContextLost(event) {
    event.preventDefault();
    contextLost = true;
    host.dataset.state = "fallback";
    stop();
  }
  function onContextRestored() {
    if (disposed) return;
    try {
      const restored = makeEnvironment();
      scene.environment = restored.texture;
      environment.dispose();
      environment = restored;
      contextLost = false;
      host.dataset.state = "ready";
      readLayout(true);
    } catch {
      host.dataset.state = "fallback";
    }
  }
  const observer = new IntersectionObserver(() => readLayout(), { rootMargin: "0px", threshold: [0, 0.1, 0.5, 1] });
  entries.forEach((entry) => observer.observe(entry.slot));
  const resizeObserver = new ResizeObserver(() => readLayout(true));
  entries.forEach((entry) => resizeObserver.observe(entry.slot));
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  motionQuery.addEventListener("change", onMotion);
  readLayout(true);

  return {
    setPaused(value) {
      isPaused = Boolean(value);
      if (isPaused) { entrance = 1; stop(); render(); }
      else schedule();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery.removeEventListener("change", onMotion);
      if (renderer) {
        renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
        renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      }
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      if (scene) scene.environment = null;
      environment?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      host.remove();
    },
  };
}

export default createContinuum;
