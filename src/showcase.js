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

function drawProduct(context, x, y, size = 1) {
  context.save(); context.translate(x, y); context.scale(size, size);
  const body = context.createLinearGradient(-90, 0, 90, 0);
  body.addColorStop(0, "#474c54"); body.addColorStop(0.15, "#dfe3e7");
  body.addColorStop(0.4, "#a2a9b0"); body.addColorStop(0.75, "#f2f2ef"); body.addColorStop(1, "#535b64");
  context.fillStyle = body; roundedPath(context, -88, -110, 176, 248, 20); context.fill();
  const face = context.createLinearGradient(-78, -102, 78, 132);
  face.addColorStop(0, "#39414b"); face.addColorStop(0.42, "#14191f"); face.addColorStop(1, "#292f38");
  context.fillStyle = face; roundedPath(context, -80, -102, 160, 232, 14); context.fill();
  context.fillStyle = "#181b20"; roundedPath(context, -49, -197, 98, 86, 12); context.fill();
  context.fillStyle = LIME; context.fillRect(-50, -124, 100, 8);
  context.fillStyle = LIME; roundedPath(context, -66, -49, 132, 116, 2); context.fill();
  label(context, "AURA", 0, -9, 40, INK, 600, "center");
  label(context, "EXTRAIT 01", 0, 21, 11, INK, 500, "center");
  label(context, "50 ML / PARFUM", 0, 48, 9, INK, 500, "center");
  context.restore();
}

function productLabel(context, width, height) {
  context.fillStyle = LIME; context.fillRect(0, 0, width, height);
  label(context, "AURA", width / 2, height * 0.35, width * 0.26, INK, 600, "center");
  label(context, "EXTRAIT 01", width / 2, height * 0.53, width * 0.07, INK, 500, "center");
  context.fillStyle = INK; context.fillRect(width * 0.12, height * 0.64, width * 0.76, 2);
  label(context, "50 ML / PARFUM", width / 2, height * 0.76, width * 0.05, INK, 500, "center");
  label(context, "A SPACE CONCEPT", width / 2, height * 0.88, width * 0.036, INK, 500, "center");
}

function brandArtwork(context, width, height) {
  context.fillStyle = LIME; context.fillRect(0, 0, width, height);
  label(context, "AURA", 75, height * 0.49, 260, INK, 600);
  label(context, "UN’IDENTITÀ. IN OGNI DIMENSIONE.", 88, height * 0.64, 25);
  context.fillStyle = INK; context.fillRect(88, height - 100, width - 176, 2);
  label(context, "BRANDING / PRODUCT DESIGN / 3D", 88, height - 56, 21);
  label(context, "SPACE CONCEPT 01", width - 88, height - 56, 21, INK, 500, "right");
}

function websiteArtwork(context, width, height) {
  context.fillStyle = PAPER; context.fillRect(0, 0, width, height);
  context.fillStyle = "#e4e5df"; context.fillRect(0, 0, width, 42);
  [24, 44, 64].forEach((x) => { context.beginPath(); context.arc(x, 21, 5, 0, Math.PI * 2); context.fillStyle = "#a9aca3"; context.fill(); });
  label(context, "aura.store / concept", width / 2, 28, 15, "#53554b", 500, "center");
  label(context, "AURA", 58, 123, 47, INK, 600);
  label(context, "La collezione", width - 280, 113, 20);
  label(context, "Bag (0)", width - 122, 113, 20);
  context.fillStyle = "#eceee5"; roundedPath(context, width * 0.51, 175, width * 0.45, height - 220, 26); context.fill();
  const halo = context.createRadialGradient(width * 0.73, height * 0.5, 0, width * 0.73, height * 0.5, 280);
  halo.addColorStop(0, "#e3f89c"); halo.addColorStop(1, "rgba(236,238,229,0)");
  context.fillStyle = halo; context.fillRect(width * 0.51, 175, width * 0.45, height - 220);
  drawProduct(context, width * 0.735, height * 0.58, 1.35);
  label(context, "EXTRAIT DE PARFUM / 01", 59, 228, 18, "#64685d");
  label(context, "Lascia", 54, 342, 91, INK, 500);
  label(context, "il segno.", 54, 438, 91, INK, 500);
  label(context, "AURA 01. La tua nuova essenza.", 59, 503, 24);
  label(context, "50 ml · Eau de parfum", 59, 543, 20, "#64685d");
  label(context, "Edizione 01", 58, 608, 32, INK, 500);
  context.fillStyle = INK; roundedPath(context, 58, height - 129, 366, 61, 30); context.fill();
  label(context, "Aggiungi al carrello   +", 84, height - 89, 25, LIME, 500);
  label(context, "E-COMMERCE CONCEPT / SPACE", width - 54, height - 34, 15, "#64685d", 500, "right");
}

function campaignArtwork(context, width, height, unused, social = false) {
  context.fillStyle = social ? LIME : PAPER; context.fillRect(0, 0, width, height);
  if (social) {
    label(context, "AURA", 38, 98, 74, INK, 600);
    label(context, "LASCIA IL SEGNO.", 40, 143, 22);
    drawProduct(context, width * 0.53, height * 0.59, 1.28);
    context.fillStyle = INK; roundedPath(context, 35, height - 108, width - 70, 61, 30); context.fill();
    label(context, "SCOPRI AURA 01   ↗", width / 2, height - 69, 24, LIME, 500, "center");
    return;
  }
  label(context, "9:41", 39, 52, 22, INK, 600);
  context.fillStyle = INK; roundedPath(context, width - 75, 35, 35, 16, 4); context.fill();
  label(context, "AURA", width / 2, 156, 62, INK, 600, "center");
  label(context, "LASCIA IL SEGNO.", width / 2, 196, 19, INK, 500, "center");
  context.fillStyle = "#e7eade"; roundedPath(context, 26, 232, width - 52, height * 0.48, 26); context.fill();
  drawProduct(context, width / 2, height * 0.49, 1.3);
  label(context, "AURA 01", 39, height * 0.775, 39, INK, 600);
  label(context, "Extrait de parfum · 50 ml", 39, height * 0.815, 20, "#656a60");
  label(context, "01", width - 39, height * 0.775, 31, INK, 500, "right");
  context.fillStyle = INK; roundedPath(context, 36, height - 122, width - 72, 64, 32); context.fill();
  label(context, "Aggiungi al carrello   +", width / 2, height - 80, 24, LIME, 500, "center");
  context.fillStyle = INK; roundedPath(context, width * 0.36, height - 25, width * 0.28, 5, 3); context.fill();
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
    bevelEnabled: true, bevelSegments: 2, bevelSize: bevel, bevelThickness: bevel,
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
 * Scroll owns the absolute poses. A separate, bounded clock adds studio motion.
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
  let renderer, scene, camera, environment, group, display, phone, social, product, pedestal, keyLight, rimLight;
  const fragments = [];
  const baseTransforms = new Map();
  let identityMaterial, websiteMaterial, phoneScreen, socialScreen;
  let shadow, initialized = false, disposed = false, failed = false;
  let visible = false, paused = false, reduced = motionQuery.matches;
  let progress = 0, appliedProgress = -1, renderFrame = 0, frames = 0;
  let motionTime = 0, previousTick = 0, nextDraw = 0, arrivalStart = -10, arrivalDirection = 1;
  let renderWindowStart = 0, renderWindowFrames = 0;
  const frameInterval = 1000 / (lowDetail ? 30 : 45);
  let width = 1, height = 1;
  let textureBrand, textureWebsite, texturePhone, textureSocial, textureLabel;
  let preparing = false, preparationCancelled = false, preparationPromise, cancelPreparation;
  const fontReady = document.fonts?.load('500 32px "Space Grotesk"').catch(() => []) ?? Promise.resolve([]);
  const ownGeometry = (value) => { geometries.add(value); return value; };
  const ownMaterial = (value) => { materials.add(value); return value; };
  const ownTexture = (value) => { textures.add(value); return value; };
  const diagnostics = { draws: 0, drawCalls: 0, triangles: 0, frames: 0, progress: 0, dpr: 1,
    state: "loading", animation: "stopped", targetFps: lowDetail ? 30 : 45, cpuRenderMs: 0, motionTime: 0 };
  container.showcaseDiagnostics = diagnostics;
  container.dataset.targetFps = String(diagnostics.targetFps);
  container.dataset.frameBudgetMs = frameInterval.toFixed(1);

  function animationState(state) {
    if (diagnostics.animation === state && container.dataset.animation === state) return;
    diagnostics.animation = state;
    container.dataset.animation = state;
  }

  function stopLoop(state) {
    if (renderFrame) cancelAnimationFrame(renderFrame);
    renderFrame = previousTick = nextDraw = 0;
    renderWindowStart = renderWindowFrames = 0;
    animationState(state);
  }

  function setState(state) {
    container.dataset.scene = state;
    diagnostics.state = state;
    if (fallback) fallback.hidden = state === "ready";
    if (renderer) renderer.domElement.style.visibility = state === "ready" ? "visible" : "hidden";
  }

  function makeEnvironment() {
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x202329);
    const boxes = [
      [-4, 5, 5, 4.5, 6, 5.2], [5, 2.2, 3, 1.2, 5.8, 4.6],
      [0, 6, -3, 5, 2.2, 4], [-3, -2, 4, 5.5, 1, 1.25],
      [2.5, 0, -5, 3, 5, 2.8],
    ];
    boxes.forEach(([x, y, z, w, h, intensity], index) => {
      const geometry = new THREE.PlaneGeometry(w, h);
      const material = new THREE.MeshBasicMaterial({
        color: index === 1 ? 0xe7eeff : 0xfffbf3, side: THREE.DoubleSide,
      });
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
    replace(textureLabel, makeCanvas(512, 512, productLabel));
    replace(textureWebsite, makeCanvas(1280, 800,
      websiteArtwork));
    replace(texturePhone, makeCanvas(512, 1100,
      campaignArtwork));
    replace(textureSocial, makeCanvas(640, 800,
      (context, w, h) => campaignArtwork(context, w, h, null, true)));
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
      scene.environmentIntensity = 0.8;
      scene.add(new THREE.HemisphereLight(0xf6f8ff, 0x303640, 0.7));
      const key = new THREE.DirectionalLight(0xfffbf4, 3.4);
      key.position.set(-4, 7, 6);
      keyLight = key;
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xe2ebff, 0.7);
      fill.position.set(5, 0, 3); scene.add(fill);
      const rim = new THREE.DirectionalLight(0xe3ff80, 2.2);
      rim.position.set(3, 4, -4); scene.add(rim);
      rimLight = rim;

      const metal = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x41454c, metalness: 1, roughness: 0.31 }));
      const edge = ownMaterial(new THREE.MeshStandardMaterial({ color: 0xb7bec7, metalness: 1, roughness: 0.24 }));
      const bezel = ownMaterial(new THREE.MeshPhysicalMaterial({ color: 0x080a0e, metalness: 0, roughness: 0.24,
        clearcoat: 0.65, clearcoatRoughness: 0.18 }));
      const black = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x050609, roughness: 0.48, metalness: 0 }));
      const lens = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x111a24, metalness: 0, roughness: 0.1 }));
      const button = ownMaterial(new THREE.MeshStandardMaterial({ color: 0xaeb6c0, metalness: 1, roughness: 0.28 }));
      const lime = ownMaterial(new THREE.MeshPhysicalMaterial({ color: 0xdfff00, roughness: 0.24,
        metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.12 }));
      const chrome = ownMaterial(new THREE.MeshStandardMaterial({ color: 0xc7cdd2, metalness: 1, roughness: 0.16 }));
      textureBrand = canvasTexture(1280, 800, brandArtwork);
      textureWebsite = canvasTexture(1280, 800, websiteArtwork);
      texturePhone = canvasTexture(512, 1100, campaignArtwork);
      textureSocial = canvasTexture(640, 800, (context, w, h) => campaignArtwork(context, w, h, null, true));
      identityMaterial = ownMaterial(new THREE.MeshBasicMaterial({ map: textureBrand, toneMapped: false }));
      websiteMaterial = ownMaterial(new THREE.MeshBasicMaterial({ map: textureWebsite, transparent: true,
        opacity: 0, depthWrite: false, toneMapped: false }));
      phoneScreen = ownMaterial(new THREE.MeshBasicMaterial({ map: texturePhone, toneMapped: false }));
      socialScreen = ownMaterial(new THREE.MeshBasicMaterial({ map: textureSocial, toneMapped: false }));
      group = new THREE.Group(); scene.add(group);
      product = new THREE.Group(); group.add(product);
      const bottleMetal = ownMaterial(new THREE.MeshPhysicalMaterial({ color: 0xb5bcc4,
        metalness: 1, roughness: 0.24, clearcoat: 0.32, clearcoatRoughness: 0.18 }));
      mesh(new RoundedBoxGeometry(1.5, 2.15, 0.95, lowDetail ? 3 : 4, 0.14), bottleMetal, product, 0, -0.05, 0);
      mesh(new RoundedBoxGeometry(1.36, 0.08, 0.82, 2, 0.035), black, product, 0, -1.15, 0);
      mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.22, 24), chrome, product, 0, 1.06, 0);
      const capProfile = [[0, -0.34], [0.43, -0.34], [0.47, -0.3], [0.47, 0.28],
        [0.44, 0.34], [0, 0.34]].map(([x, y]) => new THREE.Vector2(x, y));
      mesh(new THREE.LatheGeometry(capProfile, lowDetail ? 32 : 48), bezel, product, 0, 1.4, 0);
      mesh(new THREE.CylinderGeometry(0.475, 0.475, 0.045, 32), lime, product, 0, 1.11, 0);
      textureLabel = canvasTexture(512, 512, productLabel);
      const labelMaterial = ownMaterial(new THREE.MeshStandardMaterial({ map: textureLabel, roughness: 0.7,
        metalness: 0, envMapIntensity: 0.45 }));
      mesh(roundedSurface(1.18, 1.04, 0.015, 2), labelMaterial, product, 0, -0.03, 0.481, false);
      pedestal = new THREE.Group(); product.add(pedestal);
      mesh(new THREE.CylinderGeometry(1.3, 1.4, 0.24, lowDetail ? 32 : 48), metal, pedestal, 0, -1.32, 0);
      const pedestalRing = mesh(new THREE.TorusGeometry(1.305, 0.025, 8, lowDetail ? 40 : 64), lime, pedestal, 0, -1.21, 0, false);
      pedestalRing.rotation.x = Math.PI / 2;
      const fragmentGeometry = new RoundedBoxGeometry(0.21, 1.04, 0.24, 2, 0.09);
      for (let index = 0; index < 12; index++) {
        const material = index % 3 === 0 ? chrome : index % 3 === 1 ? lime : metal;
        fragments.push(mesh(fragmentGeometry, material, group));
      }
      const glowTexture = canvasTexture(128, 128, (context, w, h) => {
        const glow = context.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        glow.addColorStop(0, "rgba(170,205,40,0.16)");
        glow.addColorStop(0.4, "rgba(170,205,40,0.055)");
        glow.addColorStop(1, "rgba(170,205,40,0)");
        context.fillStyle = glow; context.fillRect(0, 0, w, h);
      });
      mesh(new THREE.PlaneGeometry(8, 8), ownMaterial(new THREE.MeshBasicMaterial({ map: glowTexture,
        transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending,
      })), group, 0, 0, -2.7, false);
      display = new THREE.Group(); group.add(display);
      const corners = lowDetail ? 2 : 3;
      mesh(new RoundedBoxGeometry(6.12, 3.92, 0.21, corners, 0.095), metal, display, 0, 0, 0);
      mesh(new RoundedBoxGeometry(6.09, 3.89, 0.058, corners, 0.028), edge, display, 0, 0, 0.083);
      mesh(new RoundedBoxGeometry(6.04, 3.84, 0.055, corners, 0.026), bezel, display, 0, 0, 0.11);
      const displaySurface = roundedSurface(5.82, 3.64, 0.13, 10);
      mesh(displaySurface, identityMaterial, display, 0, 0, 0.142, false);
      mesh(displaySurface, websiteMaterial, display, 0, 0, 0.144, false);
      mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.008, 12), lens, display, 0, 1.875, 0.145, false)
        .rotation.x = Math.PI / 2;
      mesh(new RoundedBoxGeometry(0.22, 0.025, 0.012, 1, 0.006), black, display, 0, -1.875, 0.143, false);

      phone = new THREE.Group(); group.add(phone);
      mesh(roundedSolid(1.57, 3.2, 0.19, 0.225, 10, 0.025), metal, phone);
      mesh(roundedSolid(1.55, 3.18, 0.05, 0.215, 10, 0.012), edge, phone, 0, 0, 0.081);
      mesh(roundedSolid(1.505, 3.135, 0.053, 0.195, 10, 0.012), bezel, phone, 0, 0, 0.102);
      mesh(roundedSurface(1.405, 3.035, 0.16, 12), phoneScreen, phone, 0, 0, 0.132, false);
      mesh(roundedSurface(0.41, 0.1, 0.05, 8), black, phone, 0, 1.39, 0.137, false);
      mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.008, 12), lens, phone, 0.145, 1.39, 0.145, false)
        .rotation.x = Math.PI / 2;
      mesh(new RoundedBoxGeometry(0.029, 0.33, 0.058, 1, 0.012), button, phone, 0.787, 0.58, -0.005, false);
      mesh(new RoundedBoxGeometry(0.029, 0.21, 0.058, 1, 0.012), button, phone, -0.787, 0.6, -0.005, false);
      social = new THREE.Group(); group.add(social);
      mesh(new RoundedBoxGeometry(1.83, 2.31, 0.085, corners, 0.04), metal, social);
      mesh(roundedSurface(1.75, 2.23, 0.075, 8), socialScreen, social, 0, 0, 0.046, false);

      // A broad studio softbox produces a diffuse footprint beneath these
      // floating devices. The bounded gradient avoids hard planar silhouettes
      // and needs no additional shadow camera or blur framebuffer.
      const shadowTexture = canvasTexture(128, 128, (context, w, h) => {
        const gradient = context.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        gradient.addColorStop(0, "rgba(9,11,16,0.2)");
        gradient.addColorStop(0.24, "rgba(9,11,16,0.13)");
        gradient.addColorStop(0.48, "rgba(9,11,16,0.065)");
        gradient.addColorStop(0.7, "rgba(9,11,16,0.022)");
        gradient.addColorStop(1, "rgba(9,11,16,0)");
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
    const expand = phase(pose, 0.1, 0.52);
    const campaign = phase(pose, 0.63, 0.96);
    const webReveal = phase(pose, 0.17, 0.46);
    const portrait = width / height < 0.9;
    const spread = portrait ? 0.7 : 1;
    const displayScale = mix(mix(0.36, portrait ? 0.7 : 0.83, expand), portrait ? 0.49 : 0.62, campaign);
    display.visible = expand > 0.025;
    display.scale.set(displayScale, displayScale, 1);
    display.position.set(mix(-0.65, 0.18, campaign) * spread, mix(0.18, 0.36, campaign), mix(-0.5, -0.92, campaign));
    display.rotation.set(mix(-0.04, 0.02, expand), mix(mix(0.38, -0.17, expand), 0.16, campaign),
      mix(-0.025, 0.025, campaign));
    websiteMaterial.opacity = webReveal;
    websiteMaterial.visible = webReveal > 0.0001;
    identityMaterial.visible = webReveal < 0.9999;

    const productScale = mix(mix(1.12, 0.86, expand), portrait ? 0.95 : 1.02, campaign);
    product.scale.setScalar(productScale);
    product.position.set(mix(mix(0, 1.35, expand), -1.45, campaign) * spread,
      mix(0.02, -0.13, expand), mix(mix(0.4, 1.35, expand), 1.05, campaign));
    product.rotation.set(mix(-0.025, 0.025, campaign), mix(mix(-0.27, -0.1, expand), 0.24, campaign),
      mix(mix(-0.035, 0.025, expand), -0.045, campaign));

    phone.visible = campaign > 0.0001;
    social.visible = campaign > 0.12;
    phone.position.set(mix(1.12, 2.0, campaign) * spread, mix(-0.28, -0.04, campaign), mix(-0.7, 1.25, campaign));
    phone.rotation.set(-0.025, mix(-0.35, -0.15, campaign), mix(-0.08, 0.05, campaign));
    phone.scale.setScalar(mix(0.56, portrait ? 0.9 : 1, campaign));
    social.position.set(mix(0.2, 0.14, campaign) * spread, mix(0, 0.31, campaign), mix(-1.2, -0.4, campaign));
    social.rotation.set(0.025, -0.22, mix(0.12, -0.1, campaign));
    social.scale.setScalar(mix(0.4, 0.76, campaign));

    const turn = new THREE.Euler();
    const target = new THREE.Vector3();
    const mobileTarget = new THREE.Vector3();
    fragments.forEach((fragment, index) => {
      const fragmentExpand = phase(pose, 0.08 + index * 0.004, 0.455 + index * 0.004);
      const fragmentCampaign = phase(pose, 0.63 + index * 0.004, 0.91 + index * 0.004);
      const burst = Math.sin(fragmentExpand * Math.PI);
      const transfer = Math.sin(fragmentCampaign * Math.PI);
      const angle = index / fragments.length * Math.PI * 2 + 0.12;
      const side = Math.floor(index / 3), slot = index % 3 - 1;
      const horizontal = side < 2;
      const frameX = horizontal ? slot * 2.12 : (side === 2 ? -3.18 : 3.18);
      const frameY = horizontal ? (side === 0 ? 2.06 : -2.06) : slot * 1.37;
      target.set(frameX * displayScale, frameY * displayScale, 0.06)
        .applyEuler(display.rotation).add(display.position);
      const phoneScale = phone.scale.x;
      const phoneX = horizontal ? slot * 0.595 : (side === 2 ? -0.9 : 0.9);
      const phoneY = horizontal ? (side === 0 ? 1.72 : -1.72) : slot * 1.145;
      mobileTarget.set(phoneX * phoneScale, phoneY * phoneScale, 0.04)
        .applyEuler(phone.rotation).add(phone.position);
      target.lerp(mobileTarget, fragmentCampaign);
      const ringX = Math.cos(angle) * 2.31;
      const ringY = Math.sin(angle) * 2.25 + 0.12;
      const ringZ = Math.sin(angle * 2) * 0.62;
      fragment.position.set(mix(ringX, target.x, fragmentExpand) + Math.cos(angle) * burst * 0.72,
        mix(ringY, target.y, fragmentExpand) + Math.sin(angle) * burst * 0.62 + transfer * Math.sin(angle) * 0.18,
        mix(ringZ, target.z, fragmentExpand) + Math.sin(angle * 2) * burst * 1.45 + transfer * Math.cos(angle) * 0.72);
      const frameAngle = (horizontal ? Math.PI / 2 : 0) + mix(display.rotation.z, phone.rotation.z, fragmentCampaign);
      turn.set(mix(Math.sin(angle) * 0.52, mix(display.rotation.x, phone.rotation.x, fragmentCampaign), fragmentExpand),
        mix(Math.cos(angle) * 0.58, mix(display.rotation.y, phone.rotation.y, fragmentCampaign), fragmentExpand) + transfer * 0.24,
        mix(angle, frameAngle, fragmentExpand) + burst * 0.58);
      fragment.rotation.copy(turn);
      const length = mix((horizontal ? 2.04 : 1.28) * displayScale,
        (horizontal ? 0.55 : 1.08) * phoneScale, fragmentCampaign);
      fragment.scale.set(mix(1, mix(0.65, 0.42, fragmentCampaign), fragmentExpand), mix(1, length / 1.04, fragmentExpand), 1);
    });
    group.rotation.y = mix(0.035, -0.02, campaign);
    shadow.scale.set(mix(mix(0.58, 0.93, expand), 1, campaign),
      mix(mix(1.1, 0.72, expand), 0.85, campaign), 1);
    shadow.material.opacity = mix(mix(0.5, 0.78, expand), 0.68, campaign);
    shadow.position.x = mix(0.05, 0.14, campaign);
    diagnostics.progress = pose;
    container.dataset.progress = pose.toFixed(4);
    rememberBasePose();
    updateCamera();
  }

  function rememberBasePose() {
    for (const object of [group, product, display, phone, social, ...fragments]) {
      let base = baseTransforms.get(object);
      if (!base) {
        base = { position: object.position.clone(), rotation: object.rotation.clone(), scale: object.scale.clone() };
        baseTransforms.set(object, base);
      } else {
        base.position.copy(object.position); base.rotation.copy(object.rotation); base.scale.copy(object.scale);
      }
    }
  }

  function applyStudioMotion(time) {
    for (const [object, base] of baseTransforms) {
      object.position.copy(base.position); object.rotation.copy(base.rotation); object.scale.copy(base.scale);
    }
    scene.environmentRotation.y = 0;
    keyLight.position.set(-4, 7, 6);
    rimLight.position.set(3, 4, -4);
    if (reduced || preparing) return;
    const expand = phase(Math.max(0, appliedProgress), 0.1, 0.52);
    const arrivalProgress = clamp((time - arrivalStart) / 1.25);
    const arrival = Math.sin(arrivalProgress * Math.PI) * (1 - arrivalProgress) ** 2;
    const float = Math.sin(time * 0.86);
    product.position.y += float * 0.07 + arrival * 0.1;
    product.position.z += arrival * 0.13;
    product.rotation.y += Math.sin(time * 0.48) * 0.055 + arrival * arrivalDirection * 0.03;
    product.rotation.z += Math.sin(time * 0.63) * 0.012;
    // Interface orientation remains fixed; only its height breathes slightly.
    display.position.y += Math.sin(time * 0.74 + 0.7) * 0.018;
    phone.position.y += Math.sin(time * 0.74 + 1.5) * 0.022;
    social.position.y += Math.sin(time * 0.74 + 2.1) * 0.025;
    fragments.forEach((fragment, index) => {
      const angle = index / fragments.length * Math.PI * 2 + 0.12;
      const wave = Math.sin(time * 0.9 + index * 0.48);
      const freedom = mix(1, 0.14, expand);
      fragment.position.x += Math.cos(angle) * wave * 0.075 * freedom;
      fragment.position.y += Math.sin(angle) * wave * 0.075 * freedom;
      fragment.position.z += Math.sin(time * 0.68 + index * 0.62) * 0.11 * freedom;
      fragment.rotation.y += wave * 0.055 * freedom;
      fragment.rotation.z += Math.sin(time * 0.55 + index * 0.4) * 0.045 * freedom;
    });
    scene.environmentRotation.y = Math.sin(time * 0.22) * 0.06;
    keyLight.position.x += Math.sin(time * 0.32) * 1.15;
    rimLight.position.x += Math.sin(time * 0.41 + 0.3) * 0.75;
  }

  function updateCamera() {
    if (!camera) return;
    const aspect = width / height;
    camera.aspect = aspect;
    const pose = Math.max(0, appliedProgress);
    const expand = phase(pose, 0.1, 0.52);
    const campaign = phase(pose, 0.63, 0.96);
    const portrait = aspect < 0.9;
    const envelopeWidth = mix(mix(5.8, portrait ? 5.7 : 7.2, expand), portrait ? 5.8 : 7.1, campaign);
    const envelopeHeight = mix(5.35, 5.6, campaign);
    const vertical = Math.max(envelopeHeight, envelopeWidth / aspect);
    const distance = vertical / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.position.set(0.04, 0.62, distance);
    camera.lookAt(0.04, 0.02, 0);
    camera.updateProjectionMatrix();
  }

  function resize() {
    if (!renderer || disposed || failed) return;
    const rect = container.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    renderer.setSize(width, height, false);
    diagnostics.dpr = renderer.getPixelRatio();
    applyPose(true);
    requestPaint();
  }

  function paint(timestamp) {
    renderFrame = 0;
    if (!renderer || !scene || disposed || failed || preparing || !visible || document.hidden) return;
    const animated = !paused && !reduced;
    if (animated) {
      const elapsed = previousTick ? Math.min(80, timestamp - previousTick) : 0;
      previousTick = timestamp;
      motionTime += elapsed / 1000;
      animationState("running");
    } else {
      previousTick = nextDraw = 0;
      animationState(reduced ? "reduced" : "paused");
    }
    if (!animated || timestamp >= nextDraw) {
      applyStudioMotion(motionTime);
      drawFrame();
      const overrun = nextDraw ? Math.max(0, timestamp - nextDraw) % frameInterval : 0;
      nextDraw = timestamp + frameInterval - overrun;
    }
    if (animated) requestPaint();
  }

  function drawFrame() {
    const started = performance.now();
    renderer.render(scene, camera);
    const renderMs = performance.now() - started;
    frames++;
    diagnostics.draws = renderer.info.render.calls;
    diagnostics.drawCalls = diagnostics.draws;
    diagnostics.triangles = renderer.info.render.triangles;
    diagnostics.frames = frames;
    diagnostics.cpuRenderMs = Number(((diagnostics.cpuRenderMs || renderMs) * 0.85 + renderMs * 0.15).toFixed(2));
    diagnostics.motionTime = Number(motionTime.toFixed(2));
    if (!renderWindowStart) renderWindowStart = started;
    renderWindowFrames++;
    if (started - renderWindowStart >= 1000) {
      diagnostics.observedFps = Number(((renderWindowFrames - 1) * 1000 / (started - renderWindowStart)).toFixed(1));
      renderWindowStart = started;
      renderWindowFrames = 1;
      container.dataset.observedFps = String(diagnostics.observedFps);
    }
    container.dataset.drawCalls = String(diagnostics.draws);
    container.dataset.triangles = String(diagnostics.triangles);
    container.dataset.renderedFrames = String(frames);
    container.dataset.cpuRenderMs = String(diagnostics.cpuRenderMs);
    container.dataset.motionTime = String(diagnostics.motionTime);
  }

  function requestPaint() {
    if (!renderFrame && renderer && !disposed && !failed && !preparing && visible && !document.hidden) {
      renderFrame = requestAnimationFrame(paint);
    }
  }

  function onContextLost(event) {
    event.preventDefault();
    if (disposed) return;
    stopLoop("context-lost");
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
    stopLoop(reduced ? "reduced" : paused ? "paused" : "stopped");
    if (!paused && !preparing) { applyPose(true); requestPaint(); }
  }

  function onVisibilityChange() {
    if (document.hidden) {
      stopLoop("hidden");
    } else if (visible && !preparing) { applyPose(true); requestPaint(); }
  }

  const intersection = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible) { initialize(); if (!paused && !preparing) applyPose(true); requestPaint(); }
    else stopLoop("offscreen");
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
    stopLoop("preparing");
    const cancelled = new Promise((resolve) => { cancelPreparation = (state = "disposed") => resolve({ state }); });
    const work = (async () => {
      try {
        await fontReady;
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
          previousTick = nextDraw = renderWindowStart = renderWindowFrames = 0;
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
    stopLoop("disposed");
    baseTransforms.clear();
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
      const previousChapter = progress < 0.25 ? 0 : progress < 0.75 ? 1 : 2;
      const nextChapter = next < 0.25 ? 0 : next < 0.75 ? 1 : 2;
      if (previousChapter !== nextChapter && !paused && !reduced && !preparing) {
        arrivalStart = motionTime;
        arrivalDirection = nextChapter > previousChapter ? 1 : -1;
      }
      progress = next;
      if (paused || disposed || failed || preparing) return;
      applyPose();
      requestPaint();
    },
    setPaused(value) {
      const next = Boolean(value);
      if (paused === next || disposed) return;
      paused = next;
      if (paused) {
        stopLoop("paused");
        if (renderer && !failed && !preparing && visible && !document.hidden) {
          applyPose(true);
          applyStudioMotion(motionTime);
          drawFrame();
        }
      } else if (!preparing) { previousTick = nextDraw = 0; applyPose(true); requestPaint(); }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelPreparation?.();
      intersection.disconnect();
      resizeObserver.disconnect();
      motionQuery.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      setState("fallback");
      cleanupGPU();
      delete container.showcaseDiagnostics;
    },
  };
}
