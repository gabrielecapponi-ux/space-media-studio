import * as THREE from "three";

const SECTION_IDS = ["universo", "servizi", "studio", "contatti"];
const SUBJECTS = ["optical-system", "continuous-ribbon", "shared-orbits", "connected-links"];
const TAU = Math.PI * 2;

class EllipsePath extends THREE.Curve {
  constructor(rx, ry) { super(); this.rx = rx; this.ry = ry; }
  getPoint(t, target = new THREE.Vector3()) {
    return target.set(Math.cos(t * TAU) * this.rx, Math.sin(t * TAU) * this.ry, 0);
  }
}

// A revolved, filleted rectangular section reads as a manufactured component;
// a torus alone tends to make every subject look like an inflated toy.
function machinedRingGeometry(outer, inner, depth, bevel, segments) {
  const points = [];
  const corners = [
    [outer - bevel, depth / 2 - bevel, 0],
    [inner + bevel, depth / 2 - bevel, Math.PI / 2],
    [inner + bevel, -depth / 2 + bevel, Math.PI],
    [outer - bevel, -depth / 2 + bevel, Math.PI * 1.5],
  ];
  corners.forEach(([x, y, angle]) => {
    for (let step = 0; step <= 4; step++) {
      const a = angle + step / 4 * Math.PI / 2;
      points.push(new THREE.Vector2(x + Math.cos(a) * bevel, y + Math.sin(a) * bevel));
    }
  });
  points.push(points[0].clone());
  const geometry = new THREE.LatheGeometry(points, segments);
  geometry.rotateX(Math.PI / 2);
  geometry.computeBoundingSphere();
  return geometry;
}

function forgedLinkGeometry(segments) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, 1.02, 0.76, 0, TAU, false, 0);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, 0.76, 0.5, 0, TAU, true, 0);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.17, steps: 1, curveSegments: segments / 2,
    bevelEnabled: true, bevelSegments: 4, bevelSize: 0.055, bevelThickness: 0.055,
  });
  geometry.translate(0, 0, -0.085);
  geometry.computeBoundingSphere();
  return geometry;
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
  const textures = new Set();
  let renderer = null, scene = null, camera = null, environment = null, rig = null;
  let groups = [], nodes = [], opticalParts = [], processDetails = [], sharedParts = [], links = [];
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
    // A consistent photographic light tent gives all four objects the same
    // reflection language, independent of their section's background colour.
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x282b35);
    const cards = [
      [-4, 4, 4, 4, 6, 0xfff9f2, 5.8],
      [4, 2, 2, 1.1, 6, 0xe7edff, 3.4],
      [0, 6, -2, 6, 2, 0xffffff, 4.4],
      [-2, -4, 3, 5, 2, 0xdce1ef, 1.15],
      [2, 1, -5, 3, 4, 0xffffff, 3.2],
    ];
    cards.forEach(([x, y, z, w, h, color, intensity]) => {
      const panel = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
      );
      panel.material.color.multiplyScalar(intensity);
      panel.position.set(x, y, z);
      panel.lookAt(0, 0, 0);
      studio.add(panel);
    });
    const pmrem = new THREE.PMREMGenerator(renderer);
    try {
      return pmrem.fromScene(studio, 0.04, 0.1, 100, { size: 128 });
    } finally {
      studio.traverse((object) => {
        object.geometry?.dispose();
        object.material?.dispose();
      });
      pmrem.dispose();
    }
  }

  function machiningTexture() {
    const size = 128;
    const bytes = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Concentric lathe marks appear through roughness, never as painted
        // colour stripes. The deterministic, very fine variation stays quiet.
        const value = Math.round(228 + 11 * Math.sin(y * 2.7) + 5 * Math.sin(x * 1.3 + y * 0.2));
        const offset = (y * size + x) * 4;
        bytes[offset] = bytes[offset + 1] = bytes[offset + 2] = value;
        bytes[offset + 3] = 255;
      }
    }
    const texture = new THREE.DataTexture(bytes, size, size);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.repeat.set(3, 2);
    texture.needsUpdate = true;
    textures.add(texture);
    return texture;
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
      renderer.toneMappingExposure = 0.92;
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30);
      camera.position.z = 8;
      environment = makeEnvironment();
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.94;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x414b6b, 0.38));
      const key = new THREE.DirectionalLight(0xfff6ec, 2.1);
      key.position.set(-3.5, 4, 6);
      const edge = new THREE.DirectionalLight(0xdbe7ff, 1.1);
      edge.position.set(4, 1, -3);
      scene.add(key, edge);
      const porcelain = (color, roughness = 0.24) => ownMaterial(new THREE.MeshPhysicalMaterial({
        color, metalness: 0, roughness, clearcoat: 0.65,
        clearcoatRoughness: 0.12, envMapIntensity: 0.95,
      }));
      const surface = machiningTexture();
      const cobalt = ownMaterial(new THREE.MeshPhysicalMaterial({
        color: 0x364bff, metalness: 1, roughness: 0.32, roughnessMap: surface,
        clearcoat: 0.22, clearcoatRoughness: 0.2, envMapIntensity: 1.05,
      }));
      const pink = porcelain(0xff48b6);
      const cream = porcelain(0xf4f3ec, 0.21);
      const lime = porcelain(0xdfff45, 0.25);
      const metal = ownMaterial(new THREE.MeshStandardMaterial({
        color: 0xd6dce3, metalness: 1, roughness: 0.25, roughnessMap: surface, envMapIntensity: 1.05,
      }));
      const graphite = ownMaterial(new THREE.MeshStandardMaterial({
        color: 0x242833, metalness: 1, roughness: 0.34, roughnessMap: surface,
      }));
      const opticalCoating = ownMaterial(new THREE.MeshPhysicalMaterial({
        color: 0x101c31, metalness: 0, roughness: 0.09,
        clearcoat: 1, clearcoatRoughness: 0.06,
        iridescence: 0.85, iridescenceIOR: 1.35,
        iridescenceThicknessRange: [160, 330], envMapIntensity: 1.4,
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
      // Portfolio: a focusing lens registers into a machined optical barrel.
      const barrel = add(machinedRingGeometry(1.19, 0.79, 0.38, 0.055, segments), graphite, groups[0]);
      const front = add(machinedRingGeometry(1.24, 0.88, 0.16, 0.035, segments), cobalt, groups[0]);
      const trim = add(machinedRingGeometry(0.9, 0.84, 0.06, 0.012, segments), metal, front);
      trim.position.z = 0.11;
      const lens = add(new THREE.SphereGeometry(0.82, lowDetail ? 32 : 48, lowDetail ? 20 : 30), opticalCoating, groups[0]);
      lens.scale.z = 0.2;
      const rear = add(machinedRingGeometry(1.13, 0.91, 0.09, 0.022, segments), metal, groups[0]);
      opticalParts = [barrel, front, lens, rear];
      const screwGeometry = ownGeometry(new THREE.CylinderGeometry(0.042, 0.042, 0.016, 12));
      screwGeometry.rotateX(Math.PI / 2);
      const screws = new THREE.InstancedMesh(screwGeometry, metal, 6);
      const screwTransform = new THREE.Object3D();
      for (let index = 0; index < 6; index++) {
        const angle = index / 6 * TAU;
        screwTransform.position.set(Math.cos(angle) * 1.065, Math.sin(angle) * 1.065, 0.092);
        screwTransform.rotation.z = angle;
        screwTransform.updateMatrix();
        screws.setMatrixAt(index, screwTransform.matrix);
      }
      front.add(screws);
      // Services: one continuous metal strip, connecting thought and execution.
      const ribbon = add(ribbonGeometry(lowDetail ? 80 : 128, lowDetail ? 16 : 24), cobalt, groups[1]);
      const seam = add(machinedRingGeometry(0.13, 0.08, 0.04, 0.012, segments / 2), metal, groups[1]);
      seam.rotation.y = Math.PI / 2;
      seam.position.set(1.45, 0, 0.02);
      processDetails = [ribbon, seam];
      // Studio: two precision tracks share a single centre and hold two founders.
      const ellipse = ownGeometry(new THREE.TubeGeometry(new EllipsePath(1.42, 0.92), segments, 0.065, radial, true));
      const orbitA = new THREE.Mesh(ellipse, metal);
      orbitA.rotation.x = 0.55;
      groups[2].add(orbitA);
      const orbitB = new THREE.Mesh(ellipse, cobalt);
      orbitB.rotation.set(-0.25, 0.7, 0.78);
      groups[2].add(orbitB);
      const centre = add(machinedRingGeometry(0.36, 0.19, 0.18, 0.035, segments / 2), graphite, groups[2]);
      const centreInsert = add(new THREE.SphereGeometry(0.185, 24, 16), pink, centre);
      centreInsert.scale.z = 0.45;
      sharedParts = [orbitA, orbitB, centre];
      nodes = [
        add(new THREE.SphereGeometry(0.16, 24, 16), cream, orbitA),
        add(new THREE.SphereGeometry(0.16, 24, 16), pink, orbitB),
      ];
      // Contact: two forged links hold a real, topologically coherent connection.
      const linkGeometry = ownGeometry(forgedLinkGeometry(segments));
      const linkA = new THREE.Mesh(linkGeometry, lime);
      const linkB = new THREE.Mesh(linkGeometry, metal);
      groups[3].add(linkA, linkB);
      linkA.position.x = -0.57;
      linkB.position.x = 0.57;
      linkB.rotation.x = Math.PI / 2;
      links = [linkA, linkB];
      canvas.addEventListener("webglcontextlost", onContextLost);
      canvas.addEventListener("webglcontextrestored", onContextRestored);
      host.dataset.state = "ready";
    } catch {
      failed = true;
      host.dataset.state = "fallback";
      host.style.opacity = "1";
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
      textures.forEach((texture) => texture.dispose());
      textures.clear();
      environment?.dispose();
      environment = null;
    }
  }
  function pose() {
    const p = reducedMotion ? 0.5 : easedProgress;
    const enter = THREE.MathUtils.smootherstep(entrance, 0, 1);
    const baseScale = [1.15, 1.2, 1.45, 1.32][activeIndex] || 1;
    host.style.opacity = String(reducedMotion ? 1 : THREE.MathUtils.smoothstep(entrance, 0, 0.72));
    host.dataset.progress = p.toFixed(3);
    rig.scale.setScalar(sceneScale * baseScale * (0.96 + enter * 0.04));
    rig.position.y = (1 - enter) * -0.08;
    rig.rotation.set(-0.14 + (p - 0.5) * 0.14, -0.32 + (p - 0.5) * 0.4, -0.12 + (p - 0.5) * 0.13);
    groups.forEach((group, index) => { group.visible = index === activeIndex; });
    if (activeIndex === 0) {
      const focus = THREE.MathUtils.smootherstep(p, 0.12, 0.78);
      opticalParts[0].position.z = -0.13;
      opticalParts[1].position.z = 0.14 + (1 - focus) * 0.22;
      opticalParts[2].position.z = 0.04 + (1 - focus) * 0.12;
      opticalParts[3].position.z = -0.36 - (1 - focus) * 0.16;
      groups[0].rotation.y = 0.11 + (1 - enter) * -0.14;
    }
    if (activeIndex === 1) {
      // A short, measured presentation arc shows the strip's true thickness.
      groups[1].rotation.set(0.06, 0.14 + (p - 0.5) * 0.26, -0.15 + (p - 0.5) * 0.2);
      processDetails[1].rotation.x = (p - 0.5) * 0.08;
    }
    if (activeIndex === 2) {
      sharedParts[0].rotation.x = 0.55 + (p - 0.5) * 0.06;
      sharedParts[1].rotation.set(-0.25, 0.7 + (p - 0.5) * 0.08, 0.78);
      nodes.forEach((node, index) => {
        const angle = (index ? 0.62 : 2.9) + (p - 0.5) * 0.56;
        node.position.set(Math.cos(angle) * 1.42, Math.sin(angle) * 0.92, 0);
      });
    }
    if (activeIndex === 3) {
      const tension = THREE.MathUtils.smootherstep(p, 0.15, 0.75);
      links[0].position.x = -0.55 - tension * 0.045;
      links[1].position.x = 0.55 + tension * 0.045;
      rig.rotation.x += 0.32;
      groups[3].rotation.z = -0.17 + tension * 0.1;
    }
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
    entrance = Math.min(1, entrance + dt / 0.85);
    easedProgress = THREE.MathUtils.lerp(easedProgress, targetProgress, 1 - Math.exp(-dt * 7));
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
    host.style.opacity = "1";
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
      textures.forEach((texture) => texture.dispose());
      if (scene) scene.environment = null;
      environment?.dispose();
      renderer?.dispose();
      renderer?.forceContextLoss();
      host.remove();
    },
  };
}

export default createContinuum;
