import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const INK = "#090b10";
const PAPER = "#f5f5f2";
const LIME = "#dfff00";
const clamp = (value) => Math.min(1, Math.max(0, value));
const mix = (a, b, t) => a + (b - a) * t;
const ease = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const phase = (progress, start, end) => ease((progress - start) / (end - start));

function roundedPath(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function cover(context, image, x, y, width, height) {
  if (!image) return;
  const ratio = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / ratio, sourceHeight = height / ratio;
  context.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2,
    sourceWidth, sourceHeight, x, y, width, height);
}

function label(context, text, x, y, size, color = INK, weight = 500, align = "left") {
  context.fillStyle = color;
  context.font = `${weight} ${size}px "Space Grotesk", sans-serif`;
  context.textAlign = align;
  context.textBaseline = "alphabetic";
  context.fillText(text, x, y);
}

function makeCanvas(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D unavailable");
  draw(context, width, height);
  return canvas;
}

function brandArtwork(context, width, height) {
  context.fillStyle = LIME;
  context.fillRect(0, 0, width, height);
  label(context, "SPACE", 88, height * 0.51, 228, INK, 600);
  label(context, "MEDIA STUDIO", 98, height * 0.64, 34, INK, 500);
  context.fillStyle = INK;
  context.fillRect(98, height - 97, width - 196, 2);
  label(context, "STRATEGIA. DESIGN. IMPATTO.", 98, height - 54, 20);
  label(context, "PARMA / IT", width - 98, height - 54, 20, INK, 500, "right");
  context.strokeStyle = INK;
  context.lineWidth = 3;
  context.beginPath();
  context.arc(width - 123, 117, 30, 0, Math.PI * 2);
  context.moveTo(width - 140, 117);
  context.lineTo(width - 106, 117);
  context.moveTo(width - 123, 100);
  context.lineTo(width - 123, 134);
  context.stroke();
}

function websiteArtwork(context, width, height, image) {
  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#e5e5de";
  context.fillRect(0, 0, width, 48);
  [26, 47, 68].forEach((x) => {
    context.beginPath(); context.arc(x, 24, 5, 0, Math.PI * 2);
    context.fillStyle = "#b2b3aa"; context.fill();
  });
  context.fillStyle = "#f7f7f2";
  roundedPath(context, width * 0.32, 10, width * 0.36, 28, 8); context.fill();
  label(context, "forma.studio", width / 2, 30, 15, "#53554b", 500, "center");
  label(context, "FORMA", 64, 120, 38, INK, 600);
  label(context, "Architettura", width - 260, 114, 19);
  label(context, "Studio", width - 105, 114, 19);
  context.fillStyle = "#171916";
  context.fillRect(0, 156, width, height - 156);
  context.save();
  context.filter = "grayscale(1)";
  cover(context, image, width * 0.43, 156, width * 0.57, height - 156);
  context.restore();
  const shade = context.createLinearGradient(width * 0.33, 0, width * 0.74, 0);
  shade.addColorStop(0, "#171916"); shade.addColorStop(1, "rgba(23,25,22,0)");
  context.fillStyle = shade; context.fillRect(0, 156, width, height - 156);
  label(context, "SPAZI DA VIVERE", 64, 233, 17, "#b5b8ac");
  label(context, "La forma", 60, 352, 89, PAPER, 500);
  label(context, "di un’idea.", 60, 448, 89, PAPER, 500);
  label(context, "Architettura essenziale.", 64, 521, 24, "#c9ccbf");
  label(context, "Prospettive nuove.", 64, 555, 24, "#c9ccbf");
  context.fillStyle = LIME;
  roundedPath(context, 64, height - 131, 236, 58, 29); context.fill();
  label(context, "Esplora i progetti   ↗", 86, height - 94, 22);
  label(context, "01 / 03", width - 62, height - 61, 19, PAPER, 500, "right");
}

function campaignArtwork(context, width, height, image, social = false) {
  context.fillStyle = PAPER;
  context.fillRect(0, 0, width, height);
  if (social) {
    context.fillStyle = INK;
    context.fillRect(0, 0, width, 94);
    label(context, "REVERIE", 38, 61, 31, PAPER, 600);
    context.save(); context.filter = "grayscale(1)";
    cover(context, image, 0, 94, width, height * 0.63);
    context.restore();
    context.fillStyle = LIME;
    context.fillRect(0, height * 0.71, width, height * 0.29);
    label(context, "Il tuo prossimo", 36, height * 0.81, 38, INK, 500);
    label(context, "rituale.", 36, height * 0.89, 38, INK, 500);
    label(context, "SCOPRI LA COLLEZIONE   ↗", 38, height - 28, 17);
    return;
  }
  label(context, "9:41", 39, 52, 22, INK, 600);
  context.fillStyle = INK;
  roundedPath(context, width - 75, 35, 35, 16, 4); context.fill();
  label(context, "REVERIE", width / 2, 145, 44, INK, 600, "center");
  label(context, "IL TUO RITUALE, OGNI GIORNO.", width / 2, 185, 14, INK, 500, "center");
  context.save(); context.filter = "grayscale(1)";
  cover(context, image, 0, 225, width, height * 0.47);
  context.restore();
  context.fillStyle = LIME;
  context.fillRect(28, 244, 111, 35);
  label(context, "ESSENTIALS", 40, 268, 15, INK, 600);
  label(context, "Meno rumore.", 38, height * 0.78, 40, INK, 500);
  label(context, "Più essenza.", 38, height * 0.835, 40, INK, 500);
  context.fillStyle = INK;
  roundedPath(context, 36, height - 115, width - 72, 58, 29); context.fill();
  label(context, "Scopri REVERIE   ↗", width / 2, height - 77, 23, PAPER, 500, "center");
  context.fillStyle = INK;
  roundedPath(context, width * 0.36, height - 25, width * 0.28, 5, 3); context.fill();
}

function roundedShape(width, height, radius) {
  const shape = new THREE.Shape();
  const left = -width / 2, bottom = -height / 2;
  shape.moveTo(left + radius, bottom);
  shape.lineTo(left + width - radius, bottom);
  shape.quadraticCurveTo(left + width, bottom, left + width, bottom + radius);
  shape.lineTo(left + width, bottom + height - radius);
  shape.quadraticCurveTo(left + width, bottom + height, left + width - radius, bottom + height);
  shape.lineTo(left + radius, bottom + height);
  shape.quadraticCurveTo(left, bottom + height, left, bottom + height - radius);
  shape.lineTo(left, bottom + radius);
  shape.quadraticCurveTo(left, bottom, left + radius, bottom);
  return shape;
}

function roundedSolid(width, height, depth, radius, segments = 10, bevel = 0.015) {
  const geometry = new THREE.ExtrudeGeometry(roundedShape(width - bevel * 2, height - bevel * 2,
    Math.max(0.01, radius - bevel)), {
    depth: depth - bevel * 2, steps: 1, curveSegments: segments,
    bevelEnabled: true, bevelSegments: 3, bevelSize: bevel, bevelThickness: bevel,
  });
  geometry.translate(0, 0, -depth / 2 + bevel);
  geometry.computeBoundingSphere();
  return geometry;
}

function roundedSurface(width, height, radius, segments) {
  const geometry = new THREE.ShapeGeometry(roundedShape(width, height, radius), segments);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let index = 0; index < positions.count; index++) {
    uv.setXY(index, positions.getX(index) / width + 0.5, positions.getY(index) / height + 0.5);
  }
  geometry.computeBoundingSphere();
  return geometry;
}

/** A single physical identity grows into a website, then into a campaign.
 * The caller owns scroll damping: every transform here is an absolute pose.
 */
export function createShowcase(container) {
  const empty = { setProgress() {}, setPaused() {}, cancelPrepare() {}, prepare: async () => ({ state: "fallback" }), dispose() {} };
  if (!container?.appendChild) return empty;
  container.dataset.scene = "loading";
  const fallback = container.querySelector(".showcase-fallback");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const compactQuery = window.matchMedia("(max-width: 760px)");
  const lowDetail = compactQuery.matches || navigator.maxTouchPoints > 0;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  let renderer, scene, camera, environment, group, display, phone, social;
  let identityMaterial, websiteMaterial, phoneScreen, socialScreen;
  let shadow, floor, initialized = false, disposed = false, failed = false;
  let visible = false, paused = false, reduced = motionQuery.matches;
  let progress = 0, appliedProgress = -1, renderFrame = 0, frames = 0;
  let architectureImage = null, campaignImage = null;
  let width = 1, height = 1;
  let textureBrand, textureWebsite, texturePhone, textureSocial;
  let preparing = false, preparationCancelled = false, preparationPromise, cancelPreparation;
  const imageTasks = [], imageWaiters = new Set();
  const fontReady = document.fonts?.load('500 32px "Space Grotesk"').catch(() => []) ?? Promise.resolve([]);
  const ownGeometry = (value) => { geometries.add(value); return value; };
  const ownMaterial = (value) => { materials.add(value); return value; };
  const ownTexture = (value) => { textures.add(value); return value; };
  const diagnostics = { draws: 0, drawCalls: 0, triangles: 0, frames: 0, progress: 0, dpr: 1, state: "loading" };
  container.showcaseDiagnostics = diagnostics;

  function setState(state) {
    container.dataset.scene = state;
    diagnostics.state = state;
    if (fallback) fallback.hidden = state === "ready";
    if (renderer) renderer.domElement.style.visibility = state === "ready" ? "visible" : "hidden";
  }

  function makeEnvironment() {
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x252723);
    const boxes = [
      [-4, 5, 5, 4.5, 6, 5.2], [5, 2.2, 3, 1.2, 5.8, 4.6],
      [0, 6, -3, 5, 2.2, 4], [-3, -2, 4, 5.5, 1, 1.25],
      [2.5, 0, -5, 3, 5, 2.8],
    ];
    boxes.forEach(([x, y, z, w, h, intensity]) => {
      const geometry = new THREE.PlaneGeometry(w, h);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      material.color.multiplyScalar(intensity);
      const card = new THREE.Mesh(geometry, material);
      card.position.set(x, y, z);
      card.lookAt(0, 0, 0);
      studio.add(card);
    });
    const pmrem = new THREE.PMREMGenerator(renderer);
    try { return pmrem.fromScene(studio, 0.04, 0.1, 100, { size: lowDetail ? 128 : 256 }); }
    finally {
      studio.traverse((object) => { object.geometry?.dispose(); object.material?.dispose(); });
      pmrem.dispose();
    }
  }

  function canvasTexture(width, height, draw) {
    const texture = ownTexture(new THREE.CanvasTexture(makeCanvas(width, height, draw)));
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return texture;
  }

  function buildArtwork() {
    if (!initialized || disposed || failed) return;
    const replace = (texture, canvas) => {
      texture.image = canvas;
      texture.needsUpdate = true;
    };
    replace(textureBrand, makeCanvas(1280, 800, brandArtwork));
    replace(textureWebsite, makeCanvas(1280, 800,
      (context, w, h) => websiteArtwork(context, w, h, architectureImage)));
    replace(texturePhone, makeCanvas(512, 1100,
      (context, w, h) => campaignArtwork(context, w, h, campaignImage)));
    replace(textureSocial, makeCanvas(640, 800,
      (context, w, h) => campaignArtwork(context, w, h, campaignImage, true)));
    requestPaint();
  }

  function mesh(geometry, material, parent, x = 0, y = 0, z = 0, cast = true) {
    const object = new THREE.Mesh(ownGeometry(geometry), material);
    object.position.set(x, y, z);
    object.castShadow = cast;
    parent.add(object);
    return object;
  }

  function initialize() {
    if (initialized || disposed || failed) return;
    initialized = true;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowDetail ? 1.35 : 1.6));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.NeutralToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.setClearColor(0x000000, 0);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.VSMShadowMap;
      renderer.domElement.className = "showcase-canvas";
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;visibility:hidden";
      renderer.domElement.addEventListener("webglcontextlost", onContextLost);
      renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);
      container.appendChild(renderer.domElement);
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(32, 1, 0.1, 70);
      environment = makeEnvironment();
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.85;
      scene.add(new THREE.HemisphereLight(0xffffff, 0x55564d, 2));
      const key = new THREE.DirectionalLight(0xffffff, 3.8);
      key.position.set(-4, 7, 6);
      key.castShadow = true;
      key.shadow.mapSize.set(lowDetail ? 512 : 1024, lowDetail ? 512 : 1024);
      key.shadow.camera.left = -7; key.shadow.camera.right = 7;
      key.shadow.camera.top = 6; key.shadow.camera.bottom = -5;
      key.shadow.camera.near = 0.5; key.shadow.camera.far = 20;
      key.shadow.normalBias = 0.025; key.shadow.bias = -0.0001;
      key.shadow.radius = lowDetail ? 9 : 18;
      key.shadow.blurSamples = 8;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xffffff, 1.6);
      fill.position.set(5, 0, 3); scene.add(fill);

      const metal = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x252722, metalness: 1, roughness: 0.28 }));
      const edge = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x85887e, metalness: 1, roughness: 0.22 }));
      const bezel = ownMaterial(new THREE.MeshPhysicalMaterial({ color: 0x070807, metalness: 0, roughness: 0.2,
        clearcoat: 0.8, clearcoatRoughness: 0.14 }));
      const black = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x050604, roughness: 0.46, metalness: 0 }));
      const lens = ownMaterial(new THREE.MeshPhysicalMaterial({ color: 0x171b15, metalness: 0.15, roughness: 0.1,
        clearcoat: 1, clearcoatRoughness: 0.08 }));
      const button = ownMaterial(new THREE.MeshStandardMaterial({ color: 0xd4d8be, metalness: 0.8, roughness: 0.25 }));
      textureBrand = canvasTexture(1280, 800, brandArtwork);
      textureWebsite = canvasTexture(1280, 800, (context, w, h) => websiteArtwork(context, w, h, architectureImage));
      texturePhone = canvasTexture(512, 1100, (context, w, h) => campaignArtwork(context, w, h, campaignImage));
      textureSocial = canvasTexture(640, 800, (context, w, h) => campaignArtwork(context, w, h, campaignImage, true));
      identityMaterial = ownMaterial(new THREE.MeshBasicMaterial({ map: textureBrand, toneMapped: false }));
      websiteMaterial = ownMaterial(new THREE.MeshBasicMaterial({ map: textureWebsite, transparent: true,
        opacity: 0, depthWrite: false, toneMapped: false }));
      phoneScreen = ownMaterial(new THREE.MeshBasicMaterial({ map: texturePhone, toneMapped: false }));
      socialScreen = ownMaterial(new THREE.MeshBasicMaterial({ map: textureSocial, toneMapped: false }));
      group = new THREE.Group(); scene.add(group);
      display = new THREE.Group(); group.add(display);
      const corners = lowDetail ? 3 : 5;
      mesh(new RoundedBoxGeometry(6.12, 3.92, 0.21, corners, 0.095), metal, display, 0, 0, 0);
      mesh(new RoundedBoxGeometry(6.09, 3.89, 0.058, corners, 0.028), edge, display, 0, 0, 0.083);
      mesh(new RoundedBoxGeometry(6.04, 3.84, 0.055, corners, 0.026), bezel, display, 0, 0, 0.11);
      mesh(roundedSurface(5.82, 3.64, 0.13, 10), identityMaterial, display, 0, 0, 0.142, false);
      mesh(roundedSurface(5.82, 3.64, 0.13, 10), websiteMaterial, display, 0, 0, 0.144, false);
      mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.008, 12), lens, display, 0, 1.875, 0.145, false)
        .rotation.x = Math.PI / 2;
      mesh(new RoundedBoxGeometry(0.22, 0.025, 0.012, 2, 0.006), black, display, 0, -1.875, 0.143, false);

      phone = new THREE.Group(); group.add(phone);
      mesh(roundedSolid(1.57, 3.2, 0.19, 0.225, 10, 0.025), metal, phone);
      mesh(roundedSolid(1.55, 3.18, 0.05, 0.215, 10, 0.012), edge, phone, 0, 0, 0.081);
      mesh(roundedSolid(1.505, 3.135, 0.053, 0.195, 10, 0.012), bezel, phone, 0, 0, 0.102);
      mesh(roundedSurface(1.405, 3.035, 0.16, 12), phoneScreen, phone, 0, 0, 0.132, false);
      mesh(roundedSurface(0.41, 0.1, 0.05, 8), black, phone, 0, 1.39, 0.137, false);
      mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.008, 12), lens, phone, 0.145, 1.39, 0.145, false)
        .rotation.x = Math.PI / 2;
      mesh(new RoundedBoxGeometry(0.029, 0.33, 0.058, 2, 0.012), button, phone, 0.787, 0.58, -0.005, false);
      mesh(new RoundedBoxGeometry(0.029, 0.21, 0.058, 2, 0.012), button, phone, -0.787, 0.6, -0.005, false);
      social = new THREE.Group(); group.add(social);
      mesh(new RoundedBoxGeometry(1.83, 2.31, 0.085, corners, 0.04), metal, social);
      mesh(roundedSurface(1.75, 2.23, 0.075, 8), socialScreen, social, 0, 0, 0.046, false);

      const shadowMaterial = ownMaterial(new THREE.ShadowMaterial({ color: 0x15190a, transparent: true, opacity: 0.11 }));
      floor = mesh(new THREE.PlaneGeometry(45, 45), shadowMaterial, scene, 0, -2.3, 0, false);
      floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
      // A soft, bounded contact shade also reads on dark sections, without an
      // extra camera, framebuffer, or permanently running blur pass.
      const shadowTexture = canvasTexture(128, 128, (context, w, h) => {
        const gradient = context.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gradient.addColorStop(0, "rgba(18,21,9,0.2)");
        gradient.addColorStop(0.52, "rgba(18,21,9,0.08)");
        gradient.addColorStop(1, "rgba(18,21,9,0)");
        context.fillStyle = gradient; context.fillRect(0, 0, w, h);
      });
      shadow = mesh(new THREE.PlaneGeometry(8.5, 2.4), ownMaterial(new THREE.MeshBasicMaterial({
        map: shadowTexture, transparent: true, depthWrite: false, toneMapped: false,
      })), scene, 0, -2.29, 0, false);
      shadow.rotation.x = -Math.PI / 2;
      resize();
      applyPose(true);
      setState("ready");
      requestPaint();
      fontReady.then(() => { if (!preparing) buildArtwork(); });
    } catch (error) {
      failed = true;
      setState("fallback");
      cleanupGPU();
    }
  }

  function applyPose(force = false, requestedProgress = progress) {
    if (!group || disposed || failed) return;
    const pose = reduced ? (requestedProgress < 0.3 ? 0 : requestedProgress < 0.72 ? 0.5 : 1) : requestedProgress;
    if (!force && Math.abs(pose - appliedProgress) < 0.00001) return;
    appliedProgress = pose;
    const expand = phase(pose, 0.12, 0.47);
    const campaign = phase(pose, 0.62, 0.94);
    const webReveal = phase(pose, 0.2, 0.48);
    const displayScale = mix(mix(0.61, 1, expand), 0.79, campaign);
    display.scale.set(displayScale, displayScale, 1);
    display.position.set(mix(0.1, -0.77, campaign), mix(0.12, 0.25, campaign), mix(0.25, -0.3, campaign));
    display.rotation.set(mix(-0.11, 0.025, expand), mix(mix(-0.31, -0.12, expand), 0.14, campaign),
      mix(mix(-0.045, 0.015, expand), -0.025, campaign));
    websiteMaterial.opacity = webReveal;
    websiteMaterial.visible = webReveal > 0.0001;
    identityMaterial.visible = webReveal < 0.9999;
    phone.visible = campaign > 0.0001;
    social.visible = campaign > 0.03;
    phone.position.set(mix(0.7, 1.92, campaign), mix(-0.2, -0.09, campaign), mix(-0.57, 0.82, campaign));
    phone.rotation.set(mix(0.02, -0.025, campaign), mix(-0.36, -0.15, campaign), mix(0.02, 0.055, campaign));
    phone.scale.setScalar(mix(0.87, 1, campaign));
    social.position.set(mix(0.85, 2.5, campaign), mix(-0.2, -0.22, campaign), mix(-0.85, -0.25, campaign));
    social.rotation.set(0.02, mix(-0.3, -0.13, campaign), mix(0, -0.075, campaign));
    social.scale.setScalar(mix(0.82, 1, campaign));
    // Camera movement stays restrained and shares the scroll clock. No idle
    // spin, independent sine motion, or cumulative position changes.
    group.rotation.y = mix(0.035, -0.02, campaign);
    shadow.scale.set(mix(0.72, 1, expand), 1, 1);
    diagnostics.progress = pose;
    container.dataset.progress = pose.toFixed(4);
    updateCamera();
  }

  function updateCamera() {
    if (!camera) return;
    const aspect = width / height;
    camera.aspect = aspect;
    // Fit the full campaign envelope at every orientation; never crop a
    // portrait source to approximate responsive framing.
    const pose = Math.max(0, appliedProgress);
    const expand = phase(pose, 0.12, 0.47);
    const campaign = phase(pose, 0.62, 0.94);
    const envelopeWidth = mix(mix(4.65, 6.8, expand), 7.5, campaign);
    const envelopeHeight = mix(mix(3.8, 4.55, expand), 5.15, campaign);
    const vertical = Math.max(envelopeHeight, envelopeWidth / aspect);
    const distance = vertical / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.position.set(0.1, 0.46, distance);
    camera.lookAt(0.1, -0.05, 0);
    camera.updateProjectionMatrix();
  }

  function resize() {
    if (!renderer || disposed || failed) return;
    const rect = container.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    diagnostics.dpr = renderer.getPixelRatio();
    updateCamera();
    requestPaint();
  }

  function paint() {
    renderFrame = 0;
    if (!renderer || !scene || disposed || failed || preparing || !visible || document.hidden) return;
    drawFrame();
  }

  function drawFrame() {
    renderer.render(scene, camera);
    frames++;
    diagnostics.draws = renderer.info.render.calls;
    diagnostics.drawCalls = diagnostics.draws;
    diagnostics.triangles = renderer.info.render.triangles;
    diagnostics.frames = frames;
    container.dataset.drawCalls = String(diagnostics.draws);
    container.dataset.triangles = String(diagnostics.triangles);
    container.dataset.renderedFrames = String(frames);
  }

  function requestPaint() {
    if (!renderFrame && renderer && !disposed && !failed && !preparing && visible && !document.hidden) {
      renderFrame = requestAnimationFrame(paint);
    }
  }

  function onContextLost(event) {
    event.preventDefault();
    if (disposed) return;
    if (renderFrame) cancelAnimationFrame(renderFrame);
    renderFrame = 0;
    failed = true;
    setState("fallback");
  }

  function onContextRestored() {
    if (disposed || !renderer) return;
    try {
      environment?.dispose();
      environment = makeEnvironment();
      scene.environment = environment.texture;
      failed = false;
      resize();
      buildArtwork();
      setState("ready");
      applyPose(true);
      requestPaint();
    } catch {
      failed = true;
      setState("fallback");
    }
  }

  function onMotionChange() {
    reduced = motionQuery.matches;
    if (!paused && !preparing) { applyPose(true); requestPaint(); }
  }

  function onVisibilityChange() {
    if (document.hidden) {
      if (renderFrame) cancelAnimationFrame(renderFrame);
      renderFrame = 0;
    } else if (visible && !preparing) { applyPose(true); requestPaint(); }
  }

  function loadImage(path, assign) {
    const image = new Image();
    image.decoding = "async";
    imageTasks.push(new Promise((resolve) => {
      let settled = false;
      const cancel = () => finish(false);
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        imageWaiters.delete(cancel);
        resolve(ok);
      };
      imageWaiters.add(cancel);
      image.onload = async () => {
        try { await image.decode?.(); } catch { /* A loaded image can still be drawn when decode() rejects. */ }
        if (disposed) { finish(false); return; }
        assign(image);
        buildArtwork();
        finish(true);
      };
      image.onerror = () => finish(false);
    }));
    image.src = `${import.meta.env.BASE_URL}${path}`;
    return image;
  }
  const architecture = loadImage("images/forma-architecture.jpg", (image) => { architectureImage = image; });
  const campaign = loadImage("images/aura-perfume.jpg", (image) => { campaignImage = image; });
  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) { initialize(); if (!paused && !preparing) applyPose(true); requestPaint(); }
    else if (renderFrame) { cancelAnimationFrame(renderFrame); renderFrame = 0; }
  }, { threshold: 0.01 });
  intersection.observe(container);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  motionQuery.addEventListener("change", onMotionChange);
  document.addEventListener("visibilitychange", onVisibilityChange);

  function prepare() {
    if (disposed) return Promise.resolve({ state: "disposed" });
    if (preparationPromise) return preparationPromise;
    preparing = true;
    container.dataset.prewarm = "loading";
    if (renderFrame) cancelAnimationFrame(renderFrame);
    renderFrame = 0;
    const cancelled = new Promise((resolve) => { cancelPreparation = (state = "disposed") => resolve({ state }); });
    const work = (async () => {
      try {
        await Promise.allSettled([...imageTasks, fontReady]);
        if (disposed) return { state: "disposed" };
        if (preparationCancelled) return { state: "cancelled" };
        initialize();
        if (!renderer || failed) {
          container.dataset.prewarm = "fallback";
          return { state: "fallback" };
        }
        buildArtwork();
        // Prepare all screen and device variants without changing the caller's
        // absolute progress. A scroll or pause arriving during compilation is
        // retained and becomes the final pose when preparation finishes.
        for (const pose of [0, 0.5, 1]) {
          if (disposed) return { state: "disposed" };
          if (preparationCancelled) return { state: "cancelled" };
          if (failed) throw new Error("Showcase context unavailable");
          applyPose(true, pose);
          if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
          else renderer.compile(scene, camera);
          if (disposed) return { state: "disposed" };
          if (preparationCancelled) return { state: "cancelled" };
          if (failed) throw new Error("Showcase context unavailable");
          drawFrame();
        }
        applyPose(true);
        drawFrame();
        container.dataset.prewarm = "ready";
        return { state: "ready" };
      } catch {
        if (disposed) return { state: "disposed" };
        if (preparationCancelled) return { state: "cancelled" };
        failed = true;
        setState("fallback");
        container.dataset.prewarm = "fallback";
        return { state: "fallback" };
      } finally {
        if (!preparationCancelled) {
          preparing = false;
          if (!disposed && !failed) {
            applyPose(true);
            if (!paused) requestPaint();
          }
        }
      }
    })();
    preparationPromise = Promise.race([work, cancelled]);
    return preparationPromise;
  }

  function cancelPrepare() {
    if (!preparing || disposed) return;
    preparationCancelled = true;
    preparing = false;
    cancelPreparation?.("cancelled");
    container.dataset.prewarm = "cancelled";
    // Cancellation can happen while compileAsync is pending. Restore the
    // user's actual pose now; its eventual completion never draws a warmup.
    applyPose(true);
    requestPaint();
  }

  function cleanupGPU() {
    if (renderFrame) cancelAnimationFrame(renderFrame);
    renderFrame = 0;
    scene?.traverse((object) => { if (object.isLight) object.shadow?.dispose(); });
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    environment?.dispose();
    if (renderer) {
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      renderer.dispose();
      renderer.domElement.remove();
    }
  }

  return {
    prepare,
    cancelPrepare,
    setProgress(value) {
      const next = clamp(Number.isFinite(value) ? value : 0);
      if (Math.abs(next - progress) < 0.00001) return;
      progress = next;
      if (paused || disposed || failed || preparing) return;
      applyPose();
      requestPaint();
    },
    setPaused(value) {
      const next = Boolean(value);
      if (paused === next || disposed) return;
      paused = next;
      if (!paused && !preparing) { applyPose(true); requestPaint(); }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelPreparation?.();
      imageWaiters.forEach((cancel) => cancel());
      imageWaiters.clear();
      intersection.disconnect();
      resizeObserver.disconnect();
      motionQuery.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      architecture.onload = architecture.onerror = campaign.onload = campaign.onerror = null;
      setState("fallback");
      cleanupGPU();
      delete container.showcaseDiagnostics;
    },
  };
}
