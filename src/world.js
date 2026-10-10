import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

// Closed, bevelled manufactured parts: no open tube ends or intersecting shells.
function ringGeometry(outer, inner, depth, segments, bevel = 0.025) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth, steps: 1, curveSegments: segments,
    bevelEnabled: true, bevelSegments: 3,
    bevelThickness: bevel, bevelSize: bevel,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

function mergeParts(parts) {
  const compatible = parts.map((geometry) => geometry.index ? geometry.toNonIndexed() : geometry);
  const merged = mergeGeometries(compatible, false);
  compatible.forEach((geometry) => geometry.dispose());
  parts.forEach((geometry, index) => {
    if (geometry !== compatible[index]) geometry.dispose();
  });
  if (!merged) throw new Error("World geometry could not be merged.");
  merged.computeBoundingSphere();
  return merged;
}

export function createWorld(container, section) {
  const empty = { setPaused() {}, setChapter() {}, dispose() {} };
  if (!container || !section) return empty;
  const mobileQuery = window.matchMedia("(max-width: 760px)");
  const touchQuery = window.matchMedia("(pointer: coarse)");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactViewport = () => mobileQuery.matches || (window.innerWidth <= 1100 && window.innerHeight <= 500);
  const economical = () => compactViewport() || touchQuery.matches || navigator.maxTouchPoints > 0;
  const lowDetail = economical();
  const segments = lowDetail ? 40 : 64;
  const tubeSegments = lowDetail ? 12 : 20;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true, antialias: true,
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
  renderer.shadowMap.autoUpdate = false;
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
  const physical = (color, roughness, coat = 0.7) => ownMaterial(new THREE.MeshPhysicalMaterial({
    color, metalness: 0, roughness, clearcoat: coat,
    clearcoatRoughness: 0.13, ior: 1.46, envMapIntensity: 0.86,
  }));
  const cream = physical(0xf2f0e8, 0.3, 0.45);
  const opalGlass = ownMaterial(new THREE.MeshPhysicalMaterial({
    color: 0xfff5dc, metalness: 0, roughness: 0.19,
    transmission: lowDetail ? 0.45 : 0.6, thickness: 0.18, ior: 1.47,
    clearcoat: 0.35, clearcoatRoughness: 0.1, envMapIntensity: 1.05,
    attenuationColor: 0xffebc4, attenuationDistance: 3, dithering: true,
  }));
  const opticalGlass = ownMaterial(new THREE.MeshPhysicalMaterial({
    color: 0x715898, metalness: 0, roughness: 0.055,
    transmission: lowDetail ? 0.1 : 0.28, thickness: 0.22, ior: 1.51,
    clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.55,
    iridescence: 0.8, iridescenceIOR: 1.32, iridescenceThicknessRange: [180, 320],
    dithering: true,
  }));
  const filamentMaterial = ownMaterial(new THREE.MeshStandardMaterial({
    color: 0xffb14b, emissive: 0xff8f25, emissiveIntensity: 3.2,
    metalness: 0, roughness: 0.36, toneMapped: false,
  }));
  const cobalt = physical(0x2536ff, 0.2, 1);
  const pink = physical(0xff48b6, 0.21, 0.95);
  const orange = physical(0xff6138, 0.24, 0.85);
  const lime = physical(0xdfff45, 0.26, 0.8);
  const metal = ownMaterial(new THREE.MeshStandardMaterial({
    color: 0xe1e5ed, metalness: 1, roughness: 0.23, envMapIntensity: 1.2,
  }));
  const dark = ownMaterial(new THREE.MeshStandardMaterial({
    color: 0x111821, metalness: 0, roughness: 0.39, envMapIntensity: 0.7,
  }));
  function mesh(geometry, material, parent, castShadow = true) {
    const object = new THREE.Mesh(ownGeometry(geometry), material);
    object.castShadow = castShadow;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function instanced(geometry, material, count, parent) {
    const object = new THREE.InstancedMesh(ownGeometry(geometry), material, count);
    object.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    object.frustumCulled = false;
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    instances.push(object);
    return object;
  }
  function lathe(points, count = segments) {
    return new THREE.LatheGeometry(points.map(([radius, y]) => new THREE.Vector2(radius, y)), count);
  }
  function makeEnvironment() {
    // Product-photography softboxes give curved glass and machined edges
    // distinct, continuous highlights. The cards are baked once into PMREM.
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x363e51);
    const cardGeometry = new THREE.PlaneGeometry(1, 1);
    const cardMaterials = [];
    [
      { at: [-4, 4, 4], size: [2.8, 5.5], power: 4.4, color: 0xfff8ee },
      { at: [4, 1.5, 1], size: [0.8, 5], power: 3.8, color: 0xe4edff },
      { at: [0, 5, -2], size: [4, 2.2], power: 3.4, color: 0xffffff },
      { at: [-1.5, 0.5, 5], size: [1.8, 3], power: 2.8, color: 0xf0e9ff },
      { at: [-3, -2, -3], size: [2.2, 3.8], power: 1.5, color: 0xdbe4ff },
    ].forEach(({ at, size, power, color }) => {
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(power), side: THREE.DoubleSide,
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
      return pmrem.fromScene(studio, 0.055);
    } finally {
      cardGeometry.dispose();
      cardMaterials.forEach((material) => material.dispose());
      pmrem.dispose();
    }
  }
  let environment = makeEnvironment();
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.92;
  scene.add(new THREE.HemisphereLight(0xe8efff, 0x303754, 0.45));
  const key = new THREE.DirectionalLight(0xfff2dd, 2.25);
  key.castShadow = true;
  key.shadow.mapSize.set(lowDetail ? 512 : 1024, lowDetail ? 512 : 1024);
  key.shadow.bias = -0.00012;
  key.shadow.normalBias = 0.009;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 18;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xd5e4ff, 1.1);
  rim.position.set(4, 2, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(3, -2, 5);
  scene.add(fill);

  // One warm signal links the three chapters: an idea becomes focus,
  // then reaches the target. It bridges changes without unrelated spinning.
  const signal = mesh(new THREE.SphereGeometry(0.14, lowDetail ? 20 : 32, 16), filamentMaterial, position, false);
  const bulbGlow = new THREE.PointLight(0xffb149, 1.8, 3.2, 2);
  bulbGlow.position.set(0, 0.4, 0);
  sculptures[0].add(bulbGlow);

  // SCINTILLA — frosted optical glass, a supported filament and a true screw thread.
  const bulbProfile = new THREE.CatmullRomCurve3([
    [0, -0.56], [0.31, -0.56], [0.42, -0.42], [0.48, -0.18],
    [0.68, 0.06], [0.88, 0.33], [1.02, 0.67], [1.06, 1.02],
    [0.96, 1.35], [0.72, 1.61], [0.4, 1.79], [0, 1.86],
  ].map(([r, y]) => new THREE.Vector3(r, y - 0.3, 0)));
  const bulbEnvelope = mesh(new THREE.LatheGeometry(bulbProfile.getPoints(lowDetail ? 36 : 56)
    .map((point) => new THREE.Vector2(Math.max(0, point.x), point.y)), segments), opalGlass, sculptures[0], false);
  bulbEnvelope.receiveShadow = false;
  mesh(lathe([
    [0, -1.52], [0.22, -1.52], [0.31, -1.49], [0.38, -1.43],
    [0.42, -1.36], [0.42, -0.94], [0.38, -0.86], [0, -0.86],
  ]), cobalt, sculptures[0]);
  const socketSleeve = mesh(lathe([
    [0.36, -1.45], [0.4, -1.45], [0.4, -0.96], [0.36, -0.96], [0.36, -1.45],
  ]), metal, sculptures[0]);
  socketSleeve.receiveShadow = false;
  const screwCurve = new THREE.Curve();
  screwCurve.getPoint = (t, result = new THREE.Vector3()) => {
    const angle = t * Math.PI * 2 * 4.1;
    return result.set(Math.cos(angle) * 0.407, -1.425 + t * 0.465, Math.sin(angle) * 0.407);
  };
  const threadEnds = [0, 1].map((t) => {
    const point = screwCurve.getPoint(t);
    return new THREE.SphereGeometry(0.034, 10, 6).translate(point.x, point.y, point.z);
  });
  mesh(mergeParts([
    new THREE.TubeGeometry(screwCurve, lowDetail ? 130 : 190, 0.034, 6, false), ...threadEnds,
  ]), metal, sculptures[0]);
  const stem = mesh(new THREE.CapsuleGeometry(0.048, 0.55, 4, 12), cream, sculptures[0], false);
  stem.position.y = -0.48;
  const supportParts = [-1, 1].map((sign) => new THREE.CylinderGeometry(0.012, 0.012, 0.94, 8)
    .translate(sign * 0.3, -0.05, 0));
  mesh(mergeParts(supportParts), metal, sculptures[0], false);
  const coilCurve = new THREE.Curve();
  coilCurve.getPoint = (t, result = new THREE.Vector3()) => result.set(
    (t - 0.5) * 0.6, 0.42 + Math.sin(t * Math.PI * 2 * 9) * 0.027,
    Math.cos(t * Math.PI * 2 * 9) * 0.027,
  );
  mesh(new THREE.TubeGeometry(coilCurve, lowDetail ? 72 : 108, 0.012, 5, false), filamentMaterial, sculptures[0], false);
  const collar = mesh(new THREE.TorusGeometry(0.425, 0.046, tubeSegments, segments), orange, sculptures[0]);
  collar.rotation.x = Math.PI / 2;
  collar.position.y = -0.86;
  const contact = mesh(new THREE.SphereGeometry(0.15, lowDetail ? 20 : 28, 12), dark, sculptures[0]);
  contact.scale.set(1, 0.35, 1);
  contact.position.y = -1.53;

  // ESPLORA — six precision iris leaves, coated optical glass and a lens mount.
  const lens = sculptures[1];
  mesh(ringGeometry(1.61, 1.2, 0.3, segments, 0.045), cobalt, lens);
  const rear = mesh(ringGeometry(1.53, 0.86, 0.26, segments, 0.035), dark, lens);
  rear.position.z = -0.22;
  const trim = mesh(new THREE.TorusGeometry(1.22, 0.035, tubeSegments, segments), metal, lens);
  trim.position.z = 0.205;
  const innerTrim = mesh(new THREE.TorusGeometry(1.55, 0.022, lowDetail ? 8 : 12, segments), metal, lens);
  innerTrim.position.z = 0.13;
  const lensBack = mesh(lathe([[0, -0.025], [1.15, -0.025], [1.15, 0.025], [0, 0.025]]), dark, lens);
  lensBack.rotation.x = Math.PI / 2;
  lensBack.position.z = -0.36;
  const opticalCentre = mesh(new THREE.SphereGeometry(0.83, segments, lowDetail ? 20 : 28), opticalGlass, lens, false);
  opticalCentre.receiveShadow = false;
  opticalCentre.scale.z = 0.22;
  opticalCentre.position.z = -0.12;
  const bladeShape = new THREE.Shape();
  bladeShape.absarc(0, 0, 1.205, -Math.PI / 6, Math.PI / 6, false);
  bladeShape.lineTo(Math.cos(Math.PI / 6 + 0.32) * 0.47, Math.sin(Math.PI / 6 + 0.32) * 0.47);
  bladeShape.lineTo(Math.cos(-Math.PI / 6 + 0.32) * 0.47, Math.sin(-Math.PI / 6 + 0.32) * 0.47);
  bladeShape.closePath();
  const bladeGeometry = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.055, steps: 1, curveSegments: lowDetail ? 10 : 16,
    bevelEnabled: true, bevelSegments: 2, bevelThickness: 0.008, bevelSize: 0.008,
  });
  const blades = instanced(bladeGeometry, metal, 6, lens);
  const tickParts = Array.from({ length: 24 }, (_, i) => {
    const angle = i / 24 * Math.PI * 2;
    const length = i % 3 === 0 ? 0.095 : 0.048;
    return new THREE.BoxGeometry(0.012, length, 0.008)
      .translate(0, 1.41, 0.2).rotateZ(angle);
  });
  mesh(mergeParts(tickParts), cream, lens, false);
  const gripCount = lowDetail ? 32 : 48;
  const grip = instanced(new THREE.BoxGeometry(0.027, 0.062, 0.19), dark, gripCount, lens);
  const bolts = instanced(new THREE.CylinderGeometry(0.033, 0.033, 0.016, 12), metal, 6, lens);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < gripCount; i++) {
    const angle = i / gripCount * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * 1.612, Math.sin(angle) * 1.612, -0.015);
    dummy.rotation.set(0, 0, angle - Math.PI / 2);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    grip.setMatrixAt(i, dummy.matrix);
  }
  grip.instanceMatrix.needsUpdate = true;
  grip.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  for (let i = 0; i < 6; i++) {
    const angle = i / 6 * Math.PI * 2 + Math.PI / 6;
    dummy.position.set(Math.cos(angle) * 1.49, Math.sin(angle) * 1.49, 0.19);
    dummy.rotation.set(Math.PI / 2, 0, angle);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bolts.setMatrixAt(i, dummy.matrix);
  }
  bolts.instanceMatrix.needsUpdate = true;
  bolts.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const screwSlots = Array.from({ length: 6 }, (_, i) => {
    const angle = i / 6 * Math.PI * 2 + Math.PI / 6;
    return new THREE.BoxGeometry(0.043, 0.007, 0.003)
      .rotateZ(angle).translate(Math.cos(angle) * 1.49, Math.sin(angle) * 1.49, 0.2);
  });
  mesh(mergeParts(screwSlots), dark, lens, false);

  // CONNESSIONE — a solid enamel target in a metal case, struck by a real dart.
  const target = sculptures[2];
  const backplate = mesh(lathe([
    [0, -0.2], [0.37, -0.2], [0.42, -0.15], [0.8, -0.15],
    [0.83, -0.05], [1.19, -0.05], [1.23, 0.04], [1.6, 0.04],
    [1.62, 0.08], [1.58, 0.22], [0, 0.22],
  ]), dark, target);
  backplate.rotation.x = -Math.PI / 2;
  const targetRim = mesh(new THREE.TorusGeometry(1.64, 0.028, tubeSegments, segments), metal, target);
  targetRim.position.z = 0.035;
  const targetRings = [
    mesh(ringGeometry(1.63, 1.25, 0.16, segments, 0.035), cream, target),
    mesh(ringGeometry(1.16, 0.84, 0.16, segments, 0.03), pink, target),
    mesh(ringGeometry(0.75, 0.43, 0.16, segments, 0.025), orange, target),
  ];
  targetRings.forEach((ring, i) => { ring.position.z = i * 0.09; });
  const bullseye = mesh(lathe([
    [0, -0.08], [0.29, -0.08], [0.325, -0.05],
    [0.325, 0.05], [0.29, 0.08], [0, 0.08],
  ]), lime, target);
  bullseye.rotation.x = Math.PI / 2;
  bullseye.position.z = 0.28;
  const arrow = new THREE.Group();
  target.add(arrow);
  const shaft = mesh(new THREE.CapsuleGeometry(0.035, 1.3, 5, lowDetail ? 12 : 20), metal, arrow);
  shaft.position.y = 1.08;
  const barrel = mesh(lathe([
    [0, 0.31], [0.052, 0.35], [0.073, 0.42], [0.073, 0.91], [0.052, 0.98], [0, 1.0],
  ]), cobalt, arrow);
  barrel.receiveShadow = false;
  const point = mesh(new THREE.ConeGeometry(0.052, 0.34, lowDetail ? 16 : 24), metal, arrow);
  point.rotation.z = Math.PI;
  point.position.y = 0.17;
  const barrelGrooves = Array.from({ length: 5 }, (_, i) => new THREE.TorusGeometry(0.074, 0.009, 6, lowDetail ? 20 : 32)
    .rotateX(Math.PI / 2).translate(0, 0.45 + i * 0.09, 0));
  mesh(mergeParts(barrelGrooves), dark, arrow);
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 1.42);
  tailShape.lineTo(0.27, 1.7);
  tailShape.lineTo(0.27, 2.05);
  tailShape.lineTo(0, 1.91);
  tailShape.closePath();
  const tailGeometry = new THREE.ExtrudeGeometry(tailShape, {
    depth: 0.022, steps: 1, bevelEnabled: true, bevelSegments: 2,
    bevelThickness: 0.006, bevelSize: 0.008,
  });
  tailGeometry.translate(0, 0, -0.011);
  const tails = [0, Math.PI * 2 / 3, Math.PI * 4 / 3].map((angle) => tailGeometry.clone().rotateY(angle));
  tailGeometry.dispose();
  mesh(mergeParts(tails), lime, arrow);
  arrow.rotation.set(0.83, 0, -0.72);
  const dartApproach = new THREE.Vector3(0, 1, 0).applyEuler(arrow.rotation);

  const pointer = new THREE.Vector2();
  const easedPointer = new THREE.Vector2();
  const rayPointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let compact = compactViewport();
  let progress = 0, easedProgress = 0, chapter = -1, forcedChapter = null;
  let paused = false, reducedMotion = motionQuery.matches, visible = false;
  let disposed = false, contextLost = false, frame = 0, previousTime = 0, lastPaint = 0;
  let width = 1, height = 1, objectScale = 1, centerX = 0, centerY = 0, pulse = 0;
  let renderedFrames = 0;
  const poseProgress = () => forcedChapter === null ? progress : forcedChapter / 2;
  const needsPose = () => Math.abs(easedProgress - poseProgress()) > 0.0001
    || easedPointer.distanceToSquared(pointer) > 0.000001 || pulse > 0.001;
  const canAnimate = () => !disposed && !contextLost && visible && !paused
    && !reducedMotion && !document.hidden && needsPose();
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

  function pose() {
    const p = easedProgress;
    // Sequential reveals keep full-scale objects apart. The warm central signal
    // remains continuous as the bulb becomes an iris and the iris becomes a target.
    const a = smooth(p, 0.22, 0.41);
    const b = smooth(p, 0.59, 0.79);
    const exitA = smooth(a, 0, 0.54), enterA = smooth(a, 0.46, 1);
    const exitB = smooth(b, 0, 0.54), enterB = smooth(b, 0.46, 1);
    const weights = [1 - exitA, enterA * (1 - exitB), enterB];
    const activePointer = reducedMotion || paused ? 0 : 1;
    position.position.set(centerX, centerY, 0);
    position.scale.setScalar(objectScale * (1 + pulse * 0.015));
    sculptures.forEach((group, i) => {
      const weight = weights[i];
      group.visible = weight > 0.001;
      group.scale.setScalar(Math.max(0.001, Math.pow(weight, 0.7)));
      group.position.set(0, (1 - weight) * -0.07, -(1 - weight) * 1.1);
      group.rotation.set(
        (i === 0 ? -0.04 : 0.09) + easedPointer.y * 0.045 * activePointer,
        (i === 0 ? -0.16 : i === 1 ? -0.46 : -0.42) + easedPointer.x * 0.075 * activePointer + (1 - weight) * 0.16,
        i === 0 ? -0.16 + smooth(p, 0, 0.22) * 0.05 : (i === 1 ? -0.055 : 0.025),
      );
    });
    const bridge = Math.max(Math.sin(a * Math.PI), Math.sin(b * Math.PI));
    signal.visible = bridge > 0.01;
    signal.scale.setScalar(0.55 + bridge * 0.45);
    signal.position.set(0, 0, 0.06);
    bulbGlow.intensity = 1.5 + smooth(p, 0, 0.2) * 1.1;
    // Six iris leaves rotate about their seats to focus the same warm signal.
    const aperture = smooth(p, 0.35, 0.56);
    for (let i = 0; i < 6; i++) {
      const angle = i / 6 * Math.PI * 2;
      const offset = (1 - aperture) * 0.075;
      dummy.position.set(Math.cos(angle + 0.25) * offset, Math.sin(angle + 0.25) * offset, 0.075 + i * 0.002);
      dummy.rotation.set(0, 0, angle + (aperture - 0.5) * 0.2);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      blades.setMatrixAt(i, dummy.matrix);
    }
    blades.instanceMatrix.needsUpdate = true;
    // Raised rings seat into the solid backplate before the dart reaches centre.
    targetRings.forEach((ring, i) => {
      ring.position.z = i * 0.09 + (1 - smooth(p, 0.71 + i * 0.018, 0.82 + i * 0.018)) * (0.18 + i * 0.06);
    });
    const connection = smooth(p, 0.8, 0.95);
    const travel = (1 - connection) * 1.15;
    arrow.position.set(dartApproach.x * travel, dartApproach.y * travel, 0.32 + dartApproach.z * travel);
    // The camera makes a restrained editorial dolly, with no idle orbit.
    camera.position.z = 10 + Math.sin(a * Math.PI) * 0.18 + Math.sin(b * Math.PI) * 0.18;
    camera.updateMatrixWorld();
  }

  function render() {
    if (disposed || contextLost || document.hidden || !visible) return;
    pose();
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    renderedFrames++;
    container.dataset.worldFrames = String(renderedFrames);
    container.dataset.worldCalls = String(renderer.info.render.calls);
    container.dataset.worldTriangles = String(renderer.info.render.triangles);
    container.dataset.worldSubject = ["lightbulb", "aperture", "target"][chapter < 0 ? 0 : chapter];
  }
  function tick(now) {
    frame = 0;
    if (!canAnimate()) return;
    const minInterval = economical() ? 1000 / 30 : 1000 / 60;
    if (lastPaint && now - lastPaint < minInterval - 0.5) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const dt = previousTime ? Math.min((now - previousTime) / 1000, 0.08) : minInterval / 1000;
    previousTime = now;
    lastPaint = now;
    easedProgress = THREE.MathUtils.lerp(easedProgress, poseProgress(), 1 - Math.exp(-dt * 9));
    easedPointer.lerp(pointer, 1 - Math.exp(-dt * 7));
    pulse = Math.max(0, pulse - dt * 1.4);
    if (Math.abs(easedProgress - poseProgress()) <= 0.0001) easedProgress = poseProgress();
    if (easedPointer.distanceToSquared(pointer) <= 0.000001) easedPointer.copy(pointer);
    if (pulse <= 0.001) pulse = 0;
    render();
    if (canAnimate()) frame = requestAnimationFrame(tick);
  }
  function syncLoop() {
    if (canAnimate()) {
      if (!frame) {
        previousTime = 0;
        lastPaint = 0;
        frame = requestAnimationFrame(tick);
      }
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      lastPaint = 0;
      render();
    }
  }
  function resize() {
    if (disposed || contextLost) return;
    const rect = container.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    compact = compactViewport();
    const dpr = Math.min(window.devicePixelRatio || 1, economical() ? 1.5 : 1.75);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    container.dataset.worldDpr = String(dpr);
    container.dataset.worldFpsLimit = economical() ? "30" : "60";
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const worldHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 10;
    const worldWidth = worldHeight * camera.aspect;
    const diameter = compact ? Math.min(height * 0.92, width * 0.86) : Math.min(height * 0.72, width * 0.46);
    objectScale = ((diameter / height) * worldHeight) / 4.25;
    centerX = compact ? 0 : worldWidth * 0.19;
    centerY = compact ? 0 : -worldHeight * 0.025;
    const shadowExtent = Math.max(0.8, objectScale * 2.7);
    key.position.set(centerX - 4, centerY + 5, 6);
    key.target.position.set(centerX, centerY, 0);
    key.shadow.mapSize.set(economical() ? 512 : 1024, economical() ? 512 : 1024);
    key.shadow.normalBias = Math.max(0.004, objectScale * 0.009);
    Object.assign(key.shadow.camera, { left: -shadowExtent, right: shadowExtent, top: shadowExtent, bottom: -shadowExtent });
    key.shadow.camera.updateProjectionMatrix();
    readProgress();
    if (reducedMotion) easedProgress = poseProgress();
    render();
    syncLoop();
  }
  function onScroll() {
    if (reducedMotion || motionQuery.matches) return;
    forcedChapter = null;
    readProgress();
    if (paused) easedProgress = poseProgress();
    syncLoop();
  }
  function onPointer(event) {
    if (!visible || reducedMotion || paused || economical()) return;
    const rect = container.getBoundingClientRect();
    pointer.set(
      THREE.MathUtils.clamp(((event.clientX - rect.left) / width) * 2 - 1, -1, 1),
      THREE.MathUtils.clamp(((event.clientY - rect.top) / height) * 2 - 1, -1, 1),
    );
    syncLoop();
  }
  function onLeave() { pointer.set(0, 0); syncLoop(); }
  function onClick(event) {
    if (!visible || contextLost || reducedMotion || paused || event.target.closest("a, button, input, textarea, select")) return;
    const rect = container.getBoundingClientRect();
    rayPointer.set(((event.clientX - rect.left) / width) * 2 - 1, -(((event.clientY - rect.top) / height) * 2 - 1));
    raycaster.setFromCamera(rayPointer, camera);
    if (raycaster.intersectObjects(sculptures.filter((group) => group.visible), true).length) {
      pulse = 1;
      syncLoop();
    }
  }
  function onMotion(event) {
    forcedChapter = event.matches ? (forcedChapter ?? Math.max(0, chapter)) : null;
    reducedMotion = event.matches;
    pointer.set(0, 0);
    easedPointer.set(0, 0);
    pulse = 0;
    readProgress();
    easedProgress = poseProgress();
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
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    readProgress();
    if (!visible || reducedMotion) easedProgress = poseProgress();
    syncLoop();
  }, { rootMargin: "0px" });
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
    setPaused(value) {
      paused = Boolean(value);
      if (paused) { pointer.set(0, 0); easedPointer.set(0, 0); pulse = 0; }
      syncLoop();
    },
    setChapter(index) {
      if (!Number.isFinite(index)) return;
      forcedChapter = THREE.MathUtils.clamp(Math.round(index), 0, 2);
      readProgress();
      if (paused || reducedMotion) easedProgress = poseProgress();
      syncLoop();
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
      ["world", "worldCalls", "worldTriangles", "worldSubject", "worldFrames", "worldDpr", "worldFpsLimit"].forEach((key) => { delete container.dataset[key]; });
    },
  };
}
