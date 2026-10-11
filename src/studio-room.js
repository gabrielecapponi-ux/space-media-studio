import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const INK = "#090b10";
const PAPER = "#f5f5f2";
const LIME = "#dfff00";
const clamp = (n) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };
const phase = (p, from, to) => smooth((p - from) / (to - from));

function roundedShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2, y = -height / 2, r = radius;
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

function screenGeometry(width, height, radius = 0.055) {
  const geometry = new THREE.ShapeGeometry(roundedShape(width, height, radius), 6);
  const positions = geometry.attributes.position, uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(i, positions.getX(i) / width + 0.5, positions.getY(i) / height + 0.5);
  }
  return geometry;
}

function canvas(width, height, draw) {
  const image = document.createElement("canvas");
  image.width = width; image.height = height;
  const context = image.getContext("2d");
  if (!context) throw new Error("Studio artwork requires Canvas 2D");
  draw(context, width, height);
  return image;
}

function text(ctx, value, x, y, size, color = INK, weight = 500, align = "left") {
  ctx.font = `${weight} ${size}px "Space Grotesk", Arial, sans-serif`;
  ctx.textAlign = align; ctx.textBaseline = "alphabetic"; ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function homeArtwork(ctx, width, height, aspect = 16 / 9) {
  ctx.fillStyle = INK; ctx.fillRect(0, 0, width, height);

  function modularSculpture(cx, cy, scale) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(scale, scale);
    const halo = ctx.createRadialGradient(0, 15, 60, 0, 15, 380);
    halo.addColorStop(0, "rgba(223,255,0,0.08)");
    halo.addColorStop(1, "rgba(223,255,0,0)");
    ctx.fillStyle = halo; ctx.fillRect(-410, -390, 820, 780);
    ctx.save(); ctx.translate(20, 253); ctx.scale(1, 0.15);
    const shadow = ctx.createRadialGradient(0, 0, 25, 0, 0, 270);
    shadow.addColorStop(0, "rgba(0,0,0,0.7)"); shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow; ctx.fillRect(-280, -280, 560, 560); ctx.restore();
    ctx.rotate(-0.12); ctx.transform(1, 0.055, 0.07, 1, 0, 0);

    // Eight full cushions mirror the live hero: a dense front face and a
    // visible second layer, rather than thin orbital lines around a product.
    function cushion(x, y, material, behind = false) {
      const size = 202, radius = 69;
      ctx.save(); ctx.translate(x, y);
      let fill;
      if (material === "chrome" || material === "graphite") {
        fill = ctx.createLinearGradient(-101, -101, 101, 101);
        const stops = material === "chrome"
          ? [[0, "#f5fafc"], [0.18, "#dfe6e9"], [0.38, "#68767d"], [0.64, "#e8edef"], [0.85, "#748188"], [1, "#293238"]]
          : [[0, "#7b8a90"], [0.23, "#48575d"], [0.5, "#18232a"], [0.75, "#3b4a52"], [1, "#10171c"]];
        stops.forEach(([position, color]) => fill.addColorStop(position, color));
      } else {
        fill = ctx.createRadialGradient(-50, -65, 6, 5, 15, 165);
        const stops = material === "lime"
          ? [[0, "#f4ffae"], [0.22, "#eaff58"], [0.62, LIME], [0.86, "#b7d100"], [1, "#7e9200"]]
          : [[0, "#ffffff"], [0.35, "#f2f1e8"], [0.75, "#d5d8d0"], [1, "#939c95"]];
        stops.forEach(([position, color]) => fill.addColorStop(position, color));
      }
      ctx.globalAlpha = behind ? 0.8 : 1;
      ctx.shadowColor = "rgba(0,0,0,0.48)"; ctx.shadowBlur = 22;
      ctx.shadowOffsetX = 7; ctx.shadowOffsetY = 13;
      ctx.fillStyle = fill; ctx.beginPath(); ctx.roundRect(-101, -101, size, size, radius); ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(255,255,255,0.22)"; ctx.lineWidth = 1.8; ctx.stroke();
      const edge = ctx.createLinearGradient(0, -97, 0, 97);
      edge.addColorStop(0, "rgba(255,255,255,0.44)");
      edge.addColorStop(0.46, "rgba(255,255,255,0.04)");
      edge.addColorStop(1, "rgba(0,0,0,0.18)");
      ctx.strokeStyle = edge; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.roundRect(-96, -96, 192, 192, radius - 3); ctx.stroke();
      ctx.restore();
    }
    cushion(-48, -154, "graphite", true);
    cushion(161, -154, "lime", true);
    cushion(-48, 55, "chrome", true);
    cushion(161, 55, "graphite", true);
    cushion(-105, -105, "lime");
    cushion(104, -105, "chrome");
    cushion(-105, 104, "ivory");
    cushion(104, 104, "lime");
    ctx.restore();
  }

  // A responsive preview occupies the middle of the physical widescreen on
  // phones. The final camera crops this column with the live site's layout.
  if (aspect < 0.8) {
    const contentWidth = height * aspect, left = (width - contentWidth) / 2;
    const gutter = contentWidth * 0.057;
    ctx.save(); ctx.beginPath(); ctx.rect(left, 0, contentWidth, height); ctx.clip();
    text(ctx, "space", left + gutter, 73, 43, PAPER, 600);
    text(ctx, "media studio", left + gutter + 2, 92, 13, "#a0a7a6");
    ctx.fillStyle = LIME; ctx.beginPath();
    ctx.arc(left + gutter + 119, 56, 4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#5b6159"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(left + contentWidth - gutter - 164, 36, 114, 51, 26); ctx.stroke();
    text(ctx, "Parliamone ↗", left + contentWidth - gutter - 107, 68, 15, PAPER, 500, "center");
    ctx.fillStyle = PAPER;
    ctx.fillRect(left + contentWidth - gutter - 28, 51, 27, 2);
    ctx.fillRect(left + contentWidth - gutter - 28, 61, 27, 2);
    text(ctx, "CREATIVE MARKETING STUDIO · PARMA", left + gutter, 163, 12, "#a0a7a6");
    const titleSize = contentWidth * 0.148;
    text(ctx, "Il tuo brand.", left + gutter - 2, 262, titleSize, PAPER, 500);
    text(ctx, "In un’altra", left + gutter - 2, 262 + titleSize, titleSize, PAPER, 500);
    text(ctx, "dimensione.", left + gutter - 2, 262 + titleSize * 2, titleSize, LIME, 500);
    const bodyTop = Math.max(490, 332 + titleSize * 2), buttonTop = bodyTop + 72;
    text(ctx, "Branding, siti & e-commerce,", left + gutter, bodyTop, 23, "#b2b9b5", 400);
    text(ctx, "contenuti & campagne.", left + gutter, bodyTop + 34, 23, "#b2b9b5", 400);
    ctx.fillStyle = LIME; ctx.beginPath();
    ctx.roundRect(left + gutter, buttonTop, contentWidth - gutter * 2, 62, 31); ctx.fill();
    text(ctx, "Parliamo del tuo progetto  ↗", width / 2, buttonTop + 40, 22, INK, 500, "center");
    modularSculpture(width / 2, buttonTop + 299, Math.min(0.9, contentWidth / 750));
    text(ctx, "STRATEGIA / DESIGN / IMPATTO", left + gutter, 1100, 12, "#8b958c");
    ctx.restore(); return;
  }

  text(ctx, "space", 100, 117, 67, PAPER, 600);
  text(ctx, "media studio", 103, 149, 20, "#a0a7a6");
  ctx.fillStyle = LIME; ctx.beginPath(); ctx.arc(285, 91, 6, 0, Math.PI * 2); ctx.fill();
  text(ctx, "Cosa creiamo", width - 735, 116, 24, PAPER);
  text(ctx, "Lo studio", width - 490, 116, 24, PAPER);
  ctx.strokeStyle = "#5b6159"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(width - 300, 70, 200, 66, 33); ctx.stroke();
  text(ctx, "Parliamone ↗", width - 200, 112, 25, PAPER, 500, "center");
  text(ctx, "CREATIVE MARKETING STUDIO · PARMA", 104, 256, 21, "#a0a7a6");
  text(ctx, "Il tuo brand.", 92, 428, 143, PAPER, 500);
  text(ctx, "In un’altra", 92, 576, 143, PAPER, 500);
  text(ctx, "dimensione.", 92, 724, 143, LIME, 500);
  text(ctx, "Branding, siti & e-commerce,", 104, 822, 32, "#b2b9b5", 400);
  text(ctx, "contenuti & campagne.", 104, 869, 32, "#b2b9b5", 400);
  ctx.fillStyle = LIME; ctx.beginPath(); ctx.roundRect(104, 925, 410, 73, 37); ctx.fill();
  text(ctx, "Parliamo del tuo progetto  ↗", 309, 971, 25, INK, 500, "center");
  modularSculpture(width * 0.74, height * 0.56, 1.25);
  text(ctx, "STRATEGIA / DESIGN / IMPATTO", 104, height - 60, 20, "#8b958c");
  text(ctx, "SCULTURA MODULARE / CONCEPT 3D", width - 100, height - 60, 19, "#8b958c", 400, "right");
}

function brandArtwork(ctx, width, height) {
  ctx.fillStyle = LIME; ctx.fillRect(0, 0, width, height);
  text(ctx, "SPACE", 85, height * 0.43, 205, INK, 600);
  text(ctx, "MEDIA STUDIO", 92, height * 0.54, 33, INK, 500);
  ctx.fillStyle = INK; ctx.fillRect(90, height * 0.64, width - 180, 3);
  text(ctx, "STRATEGIA. DESIGN. IMPATTO.", 92, height * 0.73, 25);
  text(ctx, "PARMA / IT", width - 92, height * 0.88, 24, INK, 500, "right");
  ctx.strokeStyle = INK; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(width - 148, 119, 37, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(width - 171, 119); ctx.lineTo(width - 125, 119);
  ctx.moveTo(width - 148, 96); ctx.lineTo(width - 148, 142); ctx.stroke();
}

/**
 * Original architectural cutaway. The owner supplies both clocks: assembly
 * (0..1), then a finite dolly into the primary display (0..1). No idle loop,
 * downloaded models, external textures, or independent animation clocks.
 */
export function createStudioRoom(container, { reduced = false } = {}) {
  const noop = { setProgress() {}, setZoom() {}, resize() {}, dispose() {} };
  if (!container?.appendChild) return noop;
  const compact = window.matchMedia("(max-width: 760px)").matches;
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const boxGeometries = new Map();
  const tracks = [];
  let scene, camera, renderer, environment, resizeObserver;
  let room, floor, backWall, sideWall, wallPanel, logo, lights, screens;
  let wallMaterial, logoMaterial, glowMaterial, lightMaterial, blueprint, homeMap, artworkAspect = 16 / 9;
  let progress = 0, zoom = 0, appliedProgress = -1, appliedZoom = -1;
  let width = 1, height = 1, pendingFrame = 0, frames = 0;
  let disposed = false, failed = false, initialized = false;
  const screenCenter = new THREE.Vector3(1.78, 2.13, -0.475);
  const screenWidth = 2.66, screenHeight = 1.50;
  const cameraStart = new THREE.Vector3(), cameraEnd = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3(0, 1.55, -0.1);
  const activeTarget = new THREE.Vector3();
  const direction = new THREE.Vector3(0.91, 0.73, 1.52).normalize();
  const wallStartColor = new THREE.Color(0x777c76), wallFinishColor = new THREE.Color(0xe3e6df);
  const ownGeometry = (value) => { geometries.add(value); return value; };
  const ownMaterial = (value) => { materials.add(value); return value; };
  const ownTexture = (value) => { textures.add(value); return value; };

  function state(value) {
    container.dataset.scene = value;
    if (renderer) renderer.domElement.style.visibility = value === "ready" ? "visible" : "hidden";
  }

  function texture(width, height, draw, color = true) {
    const value = ownTexture(new THREE.CanvasTexture(canvas(width, height, draw)));
    if (color) value.colorSpace = THREE.SRGBColorSpace;
    value.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return value;
  }

  function box(w, h, d, material, parent, x = 0, y = 0, z = 0, radius = 0.035, cast = true) {
    const bevel = Math.min(radius, w / 2, h / 2, d / 2);
    // Millimetre strips and fittings have no visible curved silhouette. Keep
    // the smooth bevels on furniture and display housings, rather than
    // subdividing every tiny piece of the architecture into hundreds of faces.
    const detail = bevel <= 0.016 || Math.min(w, h, d) <= 0.045 ? 0
      : compact ? 1 : 2;
    const key = [w, h, d, bevel, detail].join(":");
    let geometry = boxGeometries.get(key);
    if (!geometry) {
      geometry = ownGeometry(detail ? new RoundedBoxGeometry(w, h, d, detail, bevel)
        : new THREE.BoxGeometry(w, h, d));
      boxGeometries.set(key, geometry);
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }

  function plane(w, h, material, parent, x, y, z) {
    const mesh = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(w, h)), material);
    mesh.position.set(x, y, z); parent.add(mesh); return mesh;
  }

  function cylinder(top, bottom, height, material, parent, x, y, z, segments = 16) {
    const mesh = new THREE.Mesh(ownGeometry(new THREE.CylinderGeometry(top, bottom, height, segments)), material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  }

  function track(group, from, to, offset = new THREE.Vector3(0, 0.55, 0), scale = false) {
    tracks.push({ group, from, to, position: group.position.clone(), offset, scale });
    return group;
  }

  function makeEnvironment() {
    const studio = new THREE.Scene();
    studio.background = new THREE.Color(0x303432);
    [
      [-5, 7, 5, 8, 5, 4.5], [6, 4, 5, 3, 6, 3],
      [-5, 2, -5, 4, 5, 1.4], [0, 8, -2, 8, 4, 3.1],
    ].forEach(([x, y, z, w, h, intensity]) => {
      const geometry = new THREE.PlaneGeometry(w, h);
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      material.color.multiplyScalar(intensity);
      const softbox = new THREE.Mesh(geometry, material);
      softbox.position.set(x, y, z); softbox.lookAt(0, 1, 0); studio.add(softbox);
    });
    const pmrem = new THREE.PMREMGenerator(renderer);
    try { return pmrem.fromScene(studio, 0.035, 0.1, 80, { size: compact ? 128 : 256 }); }
    finally {
      studio.traverse((object) => { object.geometry?.dispose(); object.material?.dispose(); });
      pmrem.dispose();
    }
  }

  function build() {
    const grain = texture(128, 128, (ctx, w, h) => {
      const pixels = ctx.createImageData(w, h); let seed = 1147;
      for (let i = 0; i < pixels.data.length; i += 4) {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const n = 117 + (seed >>> 28);
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = n;
        pixels.data[i + 3] = 255;
      }
      ctx.putImageData(pixels, 0, 0);
    }, false);
    grain.wrapS = grain.wrapT = THREE.RepeatWrapping; grain.repeat.set(8, 8);
    const white = ownMaterial(new THREE.MeshStandardMaterial({ color: 0xeceee8, roughness: 0.38,
      metalness: 0, bumpMap: grain, bumpScale: 0.004 }));
    wallMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x777c76, roughness: 0.86,
      metalness: 0, bumpMap: grain, bumpScale: 0.012 }));
    const graphite = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x202527, roughness: 0.57,
      metalness: 0, bumpMap: grain, bumpScale: 0.008 }));
    const black = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x101315, roughness: 0.41, metalness: 0 }));
    const aluminium = ownMaterial(new THREE.MeshStandardMaterial({ color: 0xbfc3c2, metalness: 1, roughness: 0.27 }));
    const darkMetal = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x454b4d, metalness: 1, roughness: 0.31 }));
    const fabric = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x151a1b, metalness: 0,
      roughness: 0.93, bumpMap: grain, bumpScale: 0.016 }));
    const displayBlack = ownMaterial(new THREE.MeshPhysicalMaterial({ color: 0x080a0c, metalness: 0.1,
      roughness: 0.18, clearcoat: 0.65, clearcoatRoughness: 0.17 }));
    glowMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: LIME, emissive: LIME,
      emissiveIntensity: 1.1, roughness: 0.3, metalness: 0, toneMapped: false,
      transparent: true, opacity: 0, depthWrite: false }));
    lightMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: PAPER, toneMapped: false,
      transparent: true, opacity: 0, depthWrite: false }));
    room = new THREE.Group(); scene.add(room);

    // The cutaway has full physical furniture dimensions and two connected
    // walls. The missing front/right walls let the entire assembly stay legible.
    floor = new THREE.Group(); room.add(floor);
    box(9.7, 0.28, 6.6, graphite, floor, 0, -0.18, 0, 0.13);
    const floorMap = texture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = "#d9dcd5"; ctx.fillRect(0, 0, w, h);
      // Large resin panels: nearly invisible joints give the surface a human
      // scale without adding geometry or a downloaded texture.
      ctx.strokeStyle = "rgba(92,104,94,0.15)"; ctx.lineWidth = 1;
      for (let x = 1; x < 4; x++) {
        ctx.beginPath(); ctx.moveTo(x * w / 4, 0); ctx.lineTo(x * w / 4, h); ctx.stroke();
      }
      for (let y = 1; y < 3; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * h / 3); ctx.lineTo(w, y * h / 3); ctx.stroke();
      }
    });
    const floorMaterial = ownMaterial(new THREE.MeshStandardMaterial({ map: floorMap,
      roughness: 0.47, metalness: 0, bumpMap: grain, bumpScale: 0.006 }));
    box(9.35, 0.085, 6.25, floorMaterial, floor, 0, 0.003, 0, 0.045);
    box(9.05, 0.018, 0.032, darkMetal, floor, 0, 0.054, 2.81, 0.008, false);
    box(0.032, 0.018, 5.66, darkMetal, floor, 4.31, 0.054, 0, 0.008, false);
    box(9.15, 0.032, 0.038, glowMaterial, floor, 0, -0.15, 3.292, 0.01, false);
    box(0.038, 0.032, 6.2, glowMaterial, floor, 4.842, -0.15, 0, 0.01, false);

    backWall = new THREE.Group(); backWall.position.set(0, 0.05, -3.02); room.add(backWall);
    box(9.35, 3.9, 0.16, wallMaterial, backWall, 0, 1.95, 0, 0.035);
    box(9.4, 0.14, 0.25, aluminium, backWall, 0, 3.89, 0, 0.035);
    sideWall = new THREE.Group(); sideWall.position.set(-4.60, 0.05, -0.08); room.add(sideWall);
    box(0.16, 3.9, 5.9, wallMaterial, sideWall, 0, 1.95, 0, 0.035);
    box(0.25, 0.14, 5.96, aluminium, sideWall, 0, 3.89, 0, 0.035);

    wallPanel = new THREE.Group(); wallPanel.position.set(-2.72, 0, -2.915); room.add(wallPanel);
    box(6.9, 3.38, 0.055, graphite, wallPanel, 3.45, 2.1, 0, 0.02);
    // Recessed acoustic battens have identical geometry and one draw call.
    const battenGeometry = ownGeometry(new THREE.BoxGeometry(0.05, 3.18, 0.055));
    const battens = new THREE.InstancedMesh(battenGeometry, darkMetal, 11);
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < 11; i++) matrix.makeTranslation(-4.27 + i * 0.105, 2.02, -2.897), battens.setMatrixAt(i, matrix);
    battens.castShadow = false; room.add(battens);
    track(battens, 0.25, 0.49, new THREE.Vector3(-0.4, 0, 0));
    const sideInset = new THREE.Group(); sideInset.position.set(-4.5, 0, 0); room.add(sideInset);
    box(0.03, 2.85, 4.7, graphite, sideInset, 0, 2.02, -0.06, 0.01, false);
    for (let i = 0; i < 3; i++) box(0.04, 2.85, 0.025, darkMetal, sideInset, 0.024, 2.02, -1.6 + i * 1.6, 0.008, false);
    track(sideInset, 0.22, 0.42, new THREE.Vector3(0, 0.18, 0));

    const bounds = container.getBoundingClientRect();
    artworkAspect = bounds.width / Math.max(1, bounds.height);
    homeMap = texture(2048, 1152, (ctx, w, h) => homeArtwork(ctx, w, h, artworkAspect));
    const brandMap = texture(1280, 800, brandArtwork);
    const homeMaterial = ownMaterial(new THREE.MeshBasicMaterial({ map: homeMap, toneMapped: false }));
    const brandMaterial = ownMaterial(new THREE.MeshBasicMaterial({ map: brandMap, toneMapped: false }));
    screens = [homeMaterial, brandMaterial];

    function desk(x, z, size, delay, main) {
      const support = new THREE.Group(); support.position.set(x, 0, z); room.add(support);
      box(0.13, 1.10, 1.22, aluminium, support, -size * 0.37, 0.59, 0, 0.055);
      box(0.13, 1.10, 1.22, aluminium, support, size * 0.37, 0.59, 0, 0.055);
      box(size * 0.72, 0.12, 0.14, darkMetal, support, 0, 0.92, -0.38, 0.035);
      track(support, 0.32 + delay, 0.50 + delay, new THREE.Vector3(0, -0.5, 0));
      const top = new THREE.Group(); top.position.set(x, 1.18, z); room.add(top);
      box(size, 0.13, 1.60, white, top, 0, 0, 0, 0.06);
      box(size - 0.11, 0.028, 1.49, aluminium, top, 0, -0.06, 0, 0.012);
      track(top, 0.39 + delay, 0.60 + delay, new THREE.Vector3(0, 0.8, 0));
      const monitor = new THREE.Group(); monitor.position.set(x, 0, z - 0.34); room.add(monitor);
      const w = main ? screenWidth : 2.32, h = main ? screenHeight : 1.45;
      const center = main ? 2.13 : 2.09;
      box(0.86, 0.055, 0.60, aluminium, monitor, 0, 1.286, 0.05, 0.025);
      box(0.20, 0.48, 0.14, aluminium, monitor, 0, 1.51, -0.025, 0.035);
      box(w + 0.16, h + 0.16, 0.13, aluminium, monitor, 0, center, 0, 0.055);
      box(w + 0.13, h + 0.13, 0.045, displayBlack, monitor, 0, center, 0.068, 0.02);
      const screen = new THREE.Mesh(ownGeometry(screenGeometry(w, h)), main ? homeMaterial : brandMaterial);
      screen.position.set(0, center, 0.093); monitor.add(screen);
      cylinder(0.013, 0.013, 0.006, black, monitor, 0, center + h / 2 + 0.035, 0.095, 8).rotation.x = Math.PI / 2;
      track(monitor, 0.53 + delay, 0.75 + delay, new THREE.Vector3(0, 0.6, -0.24));
      const input = new THREE.Group(); input.position.set(x, 1.275, z + 0.40); room.add(input);
      box(1.3, 0.038, 0.46, aluminium, input, -0.13, 0, 0, 0.018);
      const keyGeometry = boxGeometries.get("keycap") || ownGeometry(new THREE.BoxGeometry(0.058, 0.015, 0.068));
      boxGeometries.set("keycap", keyGeometry);
      const keys = new THREE.InstancedMesh(keyGeometry, black, 64);
      for (let row = 0; row < 4; row++) {
        for (let column = 0; column < 16; column++) {
          matrix.makeTranslation(-0.69 + column * 0.075, 0.026, -0.145 + row * 0.093);
          keys.setMatrixAt(row * 16 + column, matrix);
        }
      }
      input.add(keys);
      box(0.20, 0.065, 0.32, white, input, 0.83, 0.018, 0.02, 0.032);
      box(0.014, 0.017, 0.065, aluminium, input, 0.83, 0.05, -0.035, 0.006, false);
      track(input, 0.65 + delay, 0.81 + delay, new THREE.Vector3(0, 0.25, 0.15));

      const chair = new THREE.Group(); chair.position.set(x + (main ? 0.52 : -0.2), 0, z + 1.65);
      chair.rotation.y = main ? -0.17 : 0.16; room.add(chair);
      cylinder(0.065, 0.075, 0.62, aluminium, chair, 0, 0.36, 0, 12);
      // Five slim spokes and paired castors share static geometry. Their
      // separate instances preserve the construction while drawing one batch.
      const spokeGeometry = boxGeometries.get("chair-spoke") || ownGeometry(new THREE.BoxGeometry(0.085, 0.045, 0.49));
      boxGeometries.set("chair-spoke", spokeGeometry);
      const spokes = new THREE.InstancedMesh(spokeGeometry, darkMetal, 5);
      const castorGeometry = boxGeometries.get("chair-castor") || ownGeometry(new THREE.CylinderGeometry(0.045, 0.045, 0.065, 8));
      boxGeometries.set("chair-castor", castorGeometry);
      const castors = new THREE.InstancedMesh(castorGeometry, black, 5);
      const fitting = new THREE.Object3D();
      for (let i = 0; i < 5; i++) {
        const angle = i / 5 * Math.PI * 2;
        fitting.position.set(Math.sin(angle) * 0.19, 0.10, Math.cos(angle) * 0.19);
        fitting.rotation.set(0, angle, 0); fitting.updateMatrix();
        spokes.setMatrixAt(i, fitting.matrix);
        fitting.position.set(Math.sin(angle) * 0.41, 0.057, Math.cos(angle) * 0.41);
        fitting.rotation.set(0, angle, Math.PI / 2); fitting.updateMatrix();
        castors.setMatrixAt(i, fitting.matrix);
      }
      spokes.castShadow = spokes.receiveShadow = true;
      castors.castShadow = castors.receiveShadow = true;
      chair.add(spokes, castors);
      box(0.79, 0.14, 0.72, fabric, chair, 0, 0.78, 0, 0.065);
      const back = box(0.76, 1.00, 0.14, fabric, chair, 0, 1.26, 0.35, 0.065);
      back.rotation.x = -0.10;
      box(0.06, 0.38, 0.12, aluminium, chair, -0.43, 0.93, 0.1, 0.025);
      box(0.06, 0.38, 0.12, aluminium, chair, 0.43, 0.93, 0.1, 0.025);
      box(0.12, 0.06, 0.45, black, chair, -0.43, 1.12, 0.04, 0.025);
      box(0.12, 0.06, 0.45, black, chair, 0.43, 1.12, 0.04, 0.025);
      track(chair, 0.59 + delay, 0.80 + delay, new THREE.Vector3(main ? 0.35 : -0.35, 0, 0.7));
    }
    desk(1.78, -0.23, 3.44, 0, true);
    desk(-1.98, -0.43, 2.95, 0.035, false);
    // The primary monitor is not rotated: its screen normal is the final
    // camera direction, so entering the display does not skew the website.
    screenCenter.z = -0.23 - 0.34 + 0.093;

    const tower = new THREE.Group(); tower.position.set(-3.86, 0.05, -0.25); room.add(tower);
    box(0.49, 0.92, 0.84, graphite, tower, 0, 0.46, 0, 0.055);
    box(0.035, 0.56, 0.022, glowMaterial, tower, 0.15, 0.49, 0.428, 0.008, false);
    track(tower, 0.66, 0.84, new THREE.Vector3(-0.5, 0, 0));

    lights = new THREE.Group(); room.add(lights);
    box(8.88, 0.045, 0.045, lightMaterial, lights, 0, 3.85, -2.90, 0.014, false);
    box(0.045, 0.045, 5.60, lightMaterial, lights, -4.48, 3.85, -0.1, 0.014, false);
    box(8.98, 0.037, 0.045, glowMaterial, lights, 0, 0.13, -2.91, 0.012, false);
    box(0.045, 2.72, 0.035, glowMaterial, lights, -4.47, 2.02, -1.63, 0.012, false);
    const wallLight = new THREE.PointLight(0xdfff00, 0.75, 6.5, 2);
    wallLight.position.set(0.6, 2.9, -2.32); lights.add(wallLight);

    const logoMap = texture(2048, 512, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      text(ctx, "SPACE", w / 2, 350, 410, LIME, 600, "center");
      text(ctx, "MEDIA STUDIO", w / 2, 464, 70, PAPER, 500, "center");
    });
    logoMaterial = ownMaterial(new THREE.MeshStandardMaterial({ map: logoMap, transparent: true,
      alphaTest: 0.035, color: 0xffffff, roughness: 0.4, emissive: 0xdfff00,
      emissiveMap: logoMap, emissiveIntensity: 0.12, depthWrite: false }));
    logo = new THREE.Group(); logo.position.set(0.57, 3.05, -2.865); room.add(logo);
    plane(3.68, 0.92, logoMaterial, logo, 0, 0, 0);

    const outlineGeometry = ownGeometry(new THREE.EdgesGeometry(new THREE.BoxGeometry(9.7, 3.95, 6.6)));
    const outlineMaterial = ownMaterial(new THREE.LineBasicMaterial({ color: 0xa9b78d,
      transparent: true, opacity: 0.2, depthWrite: false }));
    blueprint = new THREE.LineSegments(outlineGeometry, outlineMaterial);
    blueprint.position.set(0, 1.83, 0); room.add(blueprint);

    // A broad contact shade anchors the platform without another render pass.
    const shade = texture(128, 128, (ctx, w, h) => {
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 8, w / 2, h / 2, w / 2);
      gradient.addColorStop(0, "rgba(0,0,0,0.55)"); gradient.addColorStop(0.55, "rgba(0,0,0,0.3)");
      gradient.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    });
    const shadow = plane(15.5, 11, ownMaterial(new THREE.MeshBasicMaterial({ map: shade,
      transparent: true, depthWrite: false, toneMapped: false })), scene, 0, -0.335, 0);
    shadow.rotation.x = -Math.PI / 2;
  }

  function cameraPose() {
    if (!camera) return;
    const aspect = width / height;
    camera.aspect = aspect;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
    const up = new THREE.Vector3().crossVectors(direction, right).normalize();
    let distance = 0;
    // Project the room's bounding corners into the view basis. This fits the
    // whole cutaway at portrait, landscape, and ultrawide aspect ratios.
    for (const x of [-4.95, 4.95]) for (const y of [-0.35, 4.05]) for (const z of [-3.2, 3.4]) {
      const corner = new THREE.Vector3(x, y, z).sub(cameraTarget);
      const depth = corner.dot(direction);
      distance = Math.max(distance, Math.abs(corner.dot(right)) / (tan * aspect) + depth,
        Math.abs(corner.dot(up)) / tan + depth);
    }
    const margin = aspect < 0.8 ? 1.08 : 1.10;
    cameraStart.copy(cameraTarget).addScaledVector(direction, distance * margin);
    const finalDistance = Math.min(screenHeight / (2 * tan), screenWidth / (2 * tan * aspect)) * 0.975;
    cameraEnd.copy(screenCenter).add(new THREE.Vector3(0, 0, finalDistance));
    const t = smooth(zoom);
    if (reduced) {
      camera.position.copy(zoom >= 1 ? cameraEnd : cameraStart);
      activeTarget.copy(zoom >= 1 ? screenCenter : cameraTarget);
    } else {
      // A restrained camera settle precedes the dolly. The curve is absolute,
      // monotonic, and reaches a front-on screen plane without orbiting it.
      camera.position.lerpVectors(cameraStart, cameraEnd, t);
      camera.position.y += Math.sin(t * Math.PI) * 0.22;
      activeTarget.lerpVectors(cameraTarget, screenCenter, smooth(Math.min(1, t * 1.55)));
    }
    camera.lookAt(activeTarget); camera.updateProjectionMatrix();
  }

  function pose(force = false) {
    if (!initialized || disposed || failed) return;
    if (!force && Math.abs(appliedProgress - progress) < 0.00001 && Math.abs(appliedZoom - zoom) < 0.00001) return;
    // Furniture casts new shadows while assembling. The final camera dolly
    // only changes the view, so reuse the completed shadow map throughout it.
    if (force || Math.abs(appliedProgress - progress) > 0.00001) renderer.shadowMap.needsUpdate = true;
    appliedProgress = progress; appliedZoom = zoom;
    const p = progress;
    const slab = phase(p, 0.0, 0.18);
    floor.visible = slab > 0.0001;
    floor.position.y = reduced ? 0 : mix(-0.45, 0, slab);
    floor.scale.set(mix(0.86, 1, slab), Math.max(0.001, slab), mix(0.86, 1, slab));
    const wall = phase(p, 0.12, 0.36), side = phase(p, 0.16, 0.39);
    backWall.visible = wall > 0.0001; backWall.scale.y = Math.max(0.001, wall);
    sideWall.visible = side > 0.0001; sideWall.scale.y = Math.max(0.001, side);
    wallMaterial.color.copy(wallStartColor).lerp(wallFinishColor, phase(p, 0.16, 0.52));
    const panel = phase(p, 0.25, 0.47);
    wallPanel.visible = panel > 0.0001; wallPanel.scale.x = Math.max(0.001, panel);
    for (const item of tracks) {
      const t = phase(p, item.from, item.to);
      item.group.visible = t > 0.0001;
      item.group.position.copy(item.position);
      if (!reduced) item.group.position.addScaledVector(item.offset, 1 - t);
      if (item.scale) item.group.scale.setScalar(Math.max(0.001, t));
    }
    const screenOn = phase(p, 0.66, 0.85);
    screens.forEach((material) => material.color.setScalar(mix(0.04, 1, screenOn)));
    const illumination = phase(p, 0.71, 0.91);
    lights.visible = illumination > 0.0001;
    lightMaterial.opacity = illumination;
    glowMaterial.opacity = illumination;
    glowMaterial.emissiveIntensity = mix(0.18, 1.1, illumination);
    lights.children.forEach((child) => { if (child.isLight) child.intensity = 0.75 * illumination; });
    const mark = phase(p, 0.79, 0.97);
    logo.visible = mark > 0.0001; logoMaterial.opacity = mark;
    logo.position.y = 3.05 + (reduced ? 0 : (1 - mark) * 0.12);
    blueprint.material.opacity = 0.22 * (1 - phase(p, 0.14, 0.43));
    blueprint.visible = blueprint.material.opacity > 0.001;
    container.dataset.progress = progress.toFixed(4);
    container.dataset.zoom = zoom.toFixed(4);
    cameraPose(); requestPaint();
  }

  function paint() {
    pendingFrame = 0;
    if (disposed || failed || !renderer || document.hidden) return;
    try {
      renderer.render(scene, camera);
      frames++;
      container.dataset.frame = String(frames);
      container.dataset.drawCalls = String(renderer.info.render.calls);
      container.dataset.triangles = String(renderer.info.render.triangles);
      state("ready");
    } catch {
      failed = true; state("fallback");
    }
  }

  function requestPaint() {
    if (!pendingFrame && renderer && !disposed && !failed && !document.hidden) pendingFrame = requestAnimationFrame(paint);
  }

  function resize() {
    if (!renderer || disposed || failed) return;
    const rect = container.getBoundingClientRect();
    width = Math.max(1, rect.width); height = Math.max(1, rect.height);
    const nextAspect = width / height;
    if (homeMap && ((nextAspect < 0.8) !== (artworkAspect < 0.8) ||
      (nextAspect < 0.8 && Math.abs(nextAspect - artworkAspect) > 0.005))) {
      artworkAspect = nextAspect;
      homeMap.image = canvas(2048, 1152, (ctx, w, h) => homeArtwork(ctx, w, h, artworkAspect));
      homeMap.needsUpdate = true;
    }
    const mobile = width <= 760 || (navigator.maxTouchPoints > 0 && width < 1025);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
    renderer.setSize(width, height, false);
    cameraPose(); requestPaint();
  }

  function lost(event) {
    event.preventDefault();
    if (disposed) return;
    if (pendingFrame) cancelAnimationFrame(pendingFrame);
    pendingFrame = 0; failed = true; state("fallback");
  }

  function restored() {
    if (disposed || !renderer) return;
    try {
      environment?.dispose(); environment = makeEnvironment();
      scene.environment = environment.texture;
      failed = false; resize(); pose(true);
    } catch { failed = true; state("fallback"); }
  }

  function visibility() { if (!document.hidden && !disposed && !failed) requestPaint(); }

  function cleanupGPU() {
    if (pendingFrame) cancelAnimationFrame(pendingFrame);
    pendingFrame = 0;
    scene?.traverse((object) => { if (object.isLight) object.shadow?.dispose(); });
    geometries.forEach((item) => item.dispose()); boxGeometries.clear();
    materials.forEach((item) => item.dispose());
    textures.forEach((item) => item.dispose());
    environment?.dispose();
    if (renderer) {
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      renderer.domElement.removeEventListener("webglcontextrestored", restored);
      renderer.dispose(); renderer.domElement.remove();
    }
  }

  state("loading");
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1;
    renderer.setClearColor(INK, 0);
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.domElement.className = "studio-room-canvas";
    renderer.domElement.setAttribute("aria-hidden", "true");
    renderer.domElement.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;visibility:hidden";
    renderer.domElement.addEventListener("webglcontextlost", lost);
    renderer.domElement.addEventListener("webglcontextrestored", restored);
    container.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(39, 1, 0.035, 100);
    environment = makeEnvironment(); scene.environment = environment.texture; scene.environmentIntensity = 0.6;
    scene.add(new THREE.HemisphereLight(0xeaf0f3, 0x34382c, 0.72));
    const key = new THREE.DirectionalLight(0xfff9ee, 2.6);
    key.position.set(-3.8, 8, 7.5); key.target.position.set(0, 0.8, -0.4);
    key.castShadow = true; key.shadow.mapSize.set(compact ? 512 : 1024, compact ? 512 : 1024);
    key.shadow.camera.left = -7; key.shadow.camera.right = 7;
    key.shadow.camera.top = 7; key.shadow.camera.bottom = -5;
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 24;
    key.shadow.normalBias = 0.035; key.shadow.bias = -0.0001;
    key.shadow.radius = compact ? 2.5 : 3.5;
    scene.add(key, key.target);
    const fill = new THREE.DirectionalLight(0xcadced, 0.65); fill.position.set(6, 4, -2); scene.add(fill);
    build(); initialized = true; resize(); pose(true);
    resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container);
    document.addEventListener("visibilitychange", visibility);
  } catch {
    failed = true; state("fallback"); cleanupGPU();
  }

  return {
    setProgress(value) { progress = clamp(value); pose(); },
    setZoom(value) { zoom = clamp(value); pose(); },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true; resizeObserver?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      cleanupGPU(); state("fallback");
    },
  };
}
