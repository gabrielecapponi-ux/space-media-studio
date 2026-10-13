import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, value));
const mix = (a, b, amount) => a + (b - a) * amount;
const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const BASE = import.meta.env.BASE_URL;
const STATION_GAP = 10.4;
const BACKGROUNDS = ['#f2f0eb', '#0b0d0d', '#101112', '#e8ff00'];
const IMAGES = ['brand', 'architecture', 'product', 'campaign'];

/**
 * A cinematic exhibition of original artwork, not a simulation of the depicted
 * products. All principal motion is an absolute pose derived from native scroll.
 * HTML owns the content, poster fallback, navigation and user controls.
 */
export function createLaunchRoom({ signal, onReady, onError } = {}) {
  const setupStart = performance.now();
  const mount = document.querySelector('#launch-stage');
  const sections = [...document.querySelectorAll('[data-launch-chapter]')].slice(0, 4);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const connection = navigator.connection;
  const controller = new AbortController();
  const listenerSignal = controller.signal;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  const stations = [];
  let renderer;
  let environmentTarget;
  let scene;
  let camera;
  let floor;
  let keyLight;
  let frame = 0;
  let disposed = false;
  let initialized = false;
  let blocked = true;
  let paused = false;
  let errored = false;
  let inRoom = true;
  let mobile = false;
  let viewportWidth = 1;
  let viewportHeight = 1;
  let anchors = [];
  let mobileSlots = [];
  let roomEnd = Infinity;
  let targetProgress = 0;
  let progress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let currentPointerX = 0;
  let currentPointerY = 0;
  let lastTime = 0;
  let lastPaint = 0;
  let elapsed = 0;
  let introElapsed = 0;
  let resizeObserver;
  let resolveReady;
  let renderCount = 0;
  let lastDiagnosticTime = -Infinity;
  const ready = new Promise((resolve) => { resolveReady = resolve; });
  const backgroundColors = BACKGROUNDS.map((color) => new THREE.Color(color));
  const lookTarget = new THREE.Vector3();
  const visualCenter = new THREE.Vector3();

  const ownGeometry = (geometry) => { geometries.add(geometry); return geometry; };
  const ownMaterial = (material) => { materials.add(material); return material; };
  const ownTexture = (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    textures.add(texture);
    return texture;
  };
  const preferredFallback = () => reduced.matches || Boolean(connection?.saveData);

  function reportError(error) {
    if (disposed || errored) return;
    errored = true;
    dispose({ preserveTheme: true });
    mount?.setAttribute('data-launch-state', 'fallback');
    document.documentElement.classList.remove('launch-ready');
    onError?.(error);
  }

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  }

  function mayAnimate() {
    return initialized && !disposed && !errored && !blocked && !paused
      && !document.hidden && !preferredFallback() && inRoom;
  }

  function schedule() {
    if (!frame && mayAnimate()) frame = requestAnimationFrame(tick);
  }

  function updateVisibility() {
    if (!renderer || disposed) return;
    const visible = initialized && !errored && !paused && !preferredFallback() && inRoom;
    const opacity = visible ? '1' : '0';
    const state = visible ? 'ready' : 'fallback';
    if (renderer.domElement.style.opacity !== opacity) renderer.domElement.style.opacity = opacity;
    if (mount.dataset.launchState !== state) mount.dataset.launchState = state;
    document.documentElement.classList.toggle('launch-ready', visible);
    if (!mayAnimate()) stop();
    else schedule();
  }

  function roundedShape(width, height, radius = 0.06) {
    const x = -width / 2;
    const y = -height / 2;
    const r = Math.min(radius, width / 2, height / 2);
    const shape = new THREE.Shape();
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

  function artworkGeometry(width, height, radius) {
    const geometry = ownGeometry(new THREE.ShapeGeometry(roundedShape(width, height, radius), 6));
    const positions = geometry.attributes.position;
    const uvs = geometry.attributes.uv;
    for (let index = 0; index < positions.count; index += 1) {
      uvs.setXY(index, positions.getX(index) / width + 0.5, positions.getY(index) / height + 0.5);
    }
    return geometry;
  }

  function surface(texture, width, height, { edge = '#ebe8df', depth = 0.075, radius = 0.055, metallic = false } = {}) {
    const group = new THREE.Group();
    const shape = roundedShape(width, height, radius);
    const bodyGeometry = ownGeometry(new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: Math.min(0.018, depth / 4),
      bevelThickness: Math.min(0.018, depth / 4),
      bevelSegments: 2,
      curveSegments: 6,
      steps: 1,
    }));
    bodyGeometry.translate(0, 0, -depth / 2);
    const bodyMaterial = ownMaterial(new THREE.MeshStandardMaterial({
      color: edge, roughness: metallic ? 0.29 : 0.55, metalness: metallic ? 0.85 : 0,
    }));
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    group.add(body);
    // Screen/print imagery retains the original photograph's colour; the edge,
    // back and room are lit PBR geometry. No photographic product is a mesh.
    const frontMaterial = ownMaterial(new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
    const front = new THREE.Mesh(artworkGeometry(width - 0.012, height - 0.012, radius), frontMaterial);
    front.position.z = depth / 2 + 0.022;
    group.add(front);
    return group;
  }

  function canvasTexture(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Impossibile preparare le superfici dello studio.');
    draw(context, width, height);
    return ownTexture(new THREE.CanvasTexture(canvas));
  }

  function drawContained(context, image, x, y, width, height) {
    const ratio = Math.min(width / image.width, height / image.height);
    const drawWidth = image.width * ratio;
    const drawHeight = image.height * ratio;
    context.drawImage(image, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  function typePoster({ background, ink, eyebrow, title, footer }) {
    return canvasTexture(800, 1200, (ctx, width, height) => {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = ink;
      ctx.font = '22px "DM Mono", monospace';
      ctx.fillText(eyebrow, 58, 75);
      ctx.fillRect(58, 119, width - 116, 2);
      ctx.font = '500 160px "Space Grotesk", sans-serif';
      title.split('\n').forEach((line, index) => ctx.fillText(line, 49, 385 + index * 158));
      ctx.font = '21px "DM Mono", monospace';
      footer.split('\n').forEach((line, index) => ctx.fillText(line, 58, height - 110 + index * 33));
    });
  }

  function captionTexture(title, detail, background = '#161817', ink = '#e8ff00') {
    return canvasTexture(1200, 450, (ctx, width, height) => {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = ink;
      let titleSize = 110;
      ctx.font = `500 ${titleSize}px "Space Grotesk", sans-serif`;
      while (ctx.measureText(title).width > width - 122 && titleSize > 60) {
        titleSize -= 2;
        ctx.font = `500 ${titleSize}px "Space Grotesk", sans-serif`;
      }
      ctx.fillText(title, 61, 203);
      ctx.fillRect(65, 274, width - 130, 2);
      ctx.font = '24px "DM Mono", monospace';
      ctx.fillText(detail, 65, 350);
    });
  }

  function browserTexture(image, portrait = false) {
    const width = portrait ? 700 : 1700;
    const height = portrait ? 1320 : 1080;
    return canvasTexture(width, height, (ctx) => {
      ctx.fillStyle = '#f3f0e8';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#deddd8';
      ctx.fillRect(0, 0, width, 54);
      [25, 47, 69].forEach((x, index) => {
        ctx.beginPath();
        ctx.fillStyle = ['#aaa9a4', '#b9b8b2', '#c6c5be'][index];
        ctx.arc(x, 27, 5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = '#eeede8';
      ctx.fillRect(width * 0.26, 14, width * 0.48, 26);
      ctx.fillStyle = '#696b64';
      ctx.font = '15px "DM Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('avant.example', width / 2, 33);
      ctx.textAlign = 'left';
      const padding = portrait ? 40 : 75;
      ctx.fillStyle = '#20241e';
      ctx.font = `500 ${portrait ? 38 : 43}px "Space Grotesk", sans-serif`;
      ctx.fillText('AVANT', padding, 123);
      ctx.font = `${portrait ? 17 : 19}px "DM Mono", monospace`;
      ctx.textAlign = 'right';
      ctx.fillText(portrait ? 'MENU +' : 'PROGETTI     STUDIO     CONTATTI ↗', width - padding, 119);
      ctx.textAlign = 'left';
      if (portrait) {
        ctx.font = '500 79px "Space Grotesk", sans-serif';
        ctx.fillText('Spazi per', padding, 260);
        ctx.fillText('vivere meglio.', padding, 343);
        drawContained(ctx, image, 0, 400, width, 480);
        ctx.font = '500 33px "Space Grotesk", sans-serif';
        ctx.fillText('Casa nella luce', padding, 977);
        ctx.font = '19px "DM Mono", monospace';
        ctx.fillText('ARCHITETTURA / RESIDENZIALE', padding, 1033);
        ctx.fillRect(padding, 1100, width - padding * 2, 2);
        ctx.fillText('ESPLORA IL PROGETTO', padding, 1190);
        ctx.textAlign = 'right';
        ctx.fillText('↗', width - padding, 1190);
      } else {
        ctx.font = '500 95px "Space Grotesk", sans-serif';
        ctx.fillText('Spazi per vivere meglio.', padding, 265);
        drawContained(ctx, image, padding, 315, width - padding * 2, 655);
        ctx.font = '18px "DM Mono", monospace';
        ctx.fillText('CASA NELLA LUCE / PROGETTO 01', padding, 1031);
        ctx.textAlign = 'right';
        ctx.fillText('ESPLORA ↗', width - padding, 1031);
      }
    });
  }

  function campaignFormat(image) {
    return canvasTexture(700, 1120, (ctx, width, height) => {
      ctx.fillStyle = '#111413';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#e8ff00';
      ctx.font = '20px "DM Mono", monospace';
      ctx.fillText('SPACE / CAMPAIGN STUDY', 43, 62);
      drawContained(ctx, image, 0, 126, width, 500);
      ctx.font = '500 112px "Space Grotesk", sans-serif';
      ctx.fillText('MAKE', 39, 778);
      ctx.fillText('IT MOVE.', 39, 889);
      ctx.fillRect(43, 972, width - 86, 2);
      ctx.font = '20px "DM Mono", monospace';
      ctx.fillText('UN’IDEA. OGNI FORMATO.', 43, height - 65);
    });
  }

  function curvedBillboard(texture, width, height) {
    const geometry = ownGeometry(new THREE.PlaneGeometry(width, height, 48, 1));
    const positions = geometry.attributes.position;
    const radius = 12;
    for (let index = 0; index < positions.count; index += 1) {
      const angle = positions.getX(index) / radius;
      positions.setX(index, Math.sin(angle) * radius);
      positions.setZ(index, (Math.cos(angle) - 1) * radius);
    }
    geometry.computeVertexNormals();
    const group = new THREE.Group();
    const backMaterial = ownMaterial(new THREE.MeshStandardMaterial({
      color: '#262924', metalness: 0.8, roughness: 0.32, side: THREE.DoubleSide,
    }));
    const back = new THREE.Mesh(geometry, backMaterial);
    back.position.z = -0.045;
    back.castShadow = true;
    group.add(back);
    const frontMaterial = ownMaterial(new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
    const front = new THREE.Mesh(geometry, frontMaterial);
    group.add(front);
    // A pair of slender, curved aluminum rails makes the billboard's physical
    // depth legible without adding an unrelated decorative object.
    const railMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#44483e', metalness: 0.9, roughness: 0.27 }));
    [-1, 1].forEach((side) => {
      const points = [];
      for (let index = 0; index <= 48; index += 1) {
        const angle = mix(-width / 2, width / 2, index / 48) / radius;
        points.push(new THREE.Vector3(Math.sin(angle) * radius, side * (height / 2 + 0.012), (Math.cos(angle) - 1) * radius - 0.012));
      }
      const rail = new THREE.Mesh(ownGeometry(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 48, 0.025, 6, false)), railMaterial);
      group.add(rail);
    });
    return group;
  }

  function addStation(index, pieces) {
    const group = new THREE.Group();
    group.position.x = index * STATION_GAP;
    pieces.forEach((piece) => group.add(piece));
    scene.add(group);
    const mainGeometry = pieces[0].children[1].geometry;
    mainGeometry.computeBoundingBox();
    const size = new THREE.Vector3();
    mainGeometry.boundingBox.getSize(size);
    stations.push({ group, pieces, width: size.x, height: size.y });
  }

  function buildStations(artwork) {
    const photoRatio = (texture) => texture.image.width / texture.image.height;
    const brandPoster = typePoster({ background: '#e8ff00', ink: '#151715', eyebrow: 'IDENTITY / 01', title: 'FOR\nMA.', footer: 'COFFEE HOUSE\nA BRAND, IN EVERY DETAIL.' });
    addStation(0, [
      surface(artwork[0], 6.9, 6.9 / photoRatio(artwork[0]), { edge: '#e9e5d9', depth: 0.09 }),
      surface(brandPoster, 1.8, 2.7, { edge: '#d2de1c', depth: 0.05 }),
      surface(captionTexture('Forma.', 'IDENTITÀ / PACKAGING / DIREZIONE ARTISTICA'), 2.8, 1.05, { edge: '#20251d', depth: 0.05 }),
    ]);
    addStation(1, [
      surface(browserTexture(artwork[1].image), 7.4, 7.4 * 1080 / 1700, { edge: '#323936', depth: 0.12, radius: 0.13, metallic: true }),
      surface(browserTexture(artwork[1].image, true), 1.7, 1.7 * 1320 / 700, { edge: '#666b60', depth: 0.075, radius: 0.105, metallic: true }),
      surface(captionTexture('Il tuo spazio digitale.', 'DESKTOP / MOBILE / ESPERIENZA', '#e8ff00', '#111413'), 2.8, 1.05, { edge: '#d7e629', depth: 0.05 }),
    ]);
    const productPoster = typePoster({ background: '#151817', ink: '#e3e1d9', eyebrow: 'ART DIRECTION / 03', title: 'ORA.', footer: 'MATERIA. LUCE. DESIDERIO.\nPRODUCT VISUAL STUDY.' });
    addStation(2, [
      surface(artwork[2], 7.1, 7.1 / photoRatio(artwork[2]), { edge: '#353a36', depth: 0.085, radius: 0.035, metallic: true }),
      surface(productPoster, 1.8, 2.7, { edge: '#323630', depth: 0.055, metallic: true }),
      surface(captionTexture('Il dettaglio è desiderio.', 'IMMAGINI / FILM / LANCIO', '#ede9de', '#181b17'), 2.8, 1.05, { edge: '#c4c0b6', depth: 0.05 }),
    ]);
    addStation(3, [
      curvedBillboard(artwork[3], 7.5, 7.5 / photoRatio(artwork[3])),
      surface(campaignFormat(artwork[3].image), 1.8, 2.88, { edge: '#262b22', depth: 0.07 }),
      surface(captionTexture('Make it move.', 'REEL / SOCIAL / CAMPAGNE', '#111413', '#e8ff00'), 2.8, 1.05, { edge: '#272c20', depth: 0.05 }),
    ]);
  }

  function readScroll() {
    const scroll = window.scrollY;
    if (anchors.length !== 4) return;
    let next = 3;
    for (let index = 0; index < anchors.length - 1; index += 1) {
      if (scroll < anchors[index + 1]) {
        next = index + clamp((scroll - anchors[index]) / Math.max(1, anchors[index + 1] - anchors[index]));
        break;
      }
    }
    targetProgress = clamp(next, 0, 3);
    inRoom = scroll < roomEnd - Math.min(80, viewportHeight * 0.08);
    const sceneIndex = String(Math.round(targetProgress));
    if (document.documentElement.dataset.launchScene !== sceneIndex) document.documentElement.dataset.launchScene = sceneIndex;
    updateVisibility();
  }

  function measure() {
    if (disposed || !renderer) return;
    const bounds = mount.getBoundingClientRect();
    viewportWidth = Math.max(1, bounds.width || window.innerWidth);
    viewportHeight = Math.max(1, bounds.height || window.innerHeight);
    mobile = viewportWidth <= 760;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.6));
    renderer.setSize(viewportWidth, viewportHeight, false);
    camera.aspect = viewportWidth / viewportHeight;
    camera.fov = mobile ? 38 : 34;
    camera.setViewOffset(viewportWidth, viewportHeight, mobile ? 0 : -viewportWidth * 0.17, 0, viewportWidth, viewportHeight);
    camera.updateProjectionMatrix();
    floor.visible = !mobile;
    // Native hash navigation lands the section at document top. Its CSS padding
    // reserves header space; subtracting the header a second time drifts poses.
    anchors = sections.map((section) => Math.max(0, section.getBoundingClientRect().top + window.scrollY));
    mobileSlots = sections.map((section) => {
      const sectionBounds = section.getBoundingClientRect();
      const visualBounds = section.querySelector('.fallback-visual')?.getBoundingClientRect();
      return visualBounds && visualBounds.height > 1 ? {
        centerY: visualBounds.top - sectionBounds.top + visualBounds.height / 2,
        width: visualBounds.width,
        height: visualBounds.height,
      } : { centerY: viewportHeight * 0.51, width: viewportWidth * 0.87, height: viewportWidth * 0.87 * 9 / 16 };
    });
    const last = sections[sections.length - 1];
    roomEnd = last.getBoundingClientRect().bottom + window.scrollY;
    readScroll();
    if (initialized && !document.hidden && !blocked && !preferredFallback()) {
      pose();
      paint();
    }
  }

  function pose() {
    const lower = Math.floor(progress);
    const upper = Math.min(3, lower + 1);
    const blend = smooth(progress - lower);
    scene.background.copy(backgroundColors[lower]).lerp(backgroundColors[upper], blend);
    const intro = 1 - smooth(introElapsed / 1.3);
    const introWeight = intro * (1 - clamp(progress / 0.45));
    const stageX = progress * STATION_GAP;
    const cameraZ = mix([10.8, 11.5, 10.4, 11.9][lower], [10.8, 11.5, 10.4, 11.9][upper], blend);
    const frustumHeight = 2 * cameraZ * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const frustumWidth = frustumHeight * camera.aspect;
    const ambient = Math.sin(elapsed * 0.28);
    camera.position.set(stageX + currentPointerX * 0.3 + introWeight * 1.8, mobile ? 0.1 : mix(0.45, 0.1, blend), cameraZ + introWeight * 1.3);
    lookTarget.set(stageX, mobile ? 0.05 : 0.15 + currentPointerY * 0.12, 0);
    camera.lookAt(lookTarget);
    keyLight.position.set(stageX - 3 + Math.sin(elapsed * 0.17) * 0.8, 7, 7);
    keyLight.target.position.set(stageX, 0, 0);
    stations.forEach(({ group, pieces, width, height }, index) => {
      const distance = progress - index;
      const departure = clamp(Math.abs(distance), 0, 1.3);
      const direction = Math.sign(distance) || 1;
      group.visible = Math.abs(distance) < 0.97;
      const slot = mobileSlots[index];
      const exhibitScale = mobile ? Math.min(
        frustumWidth * (slot.width / viewportWidth) / width,
        frustumHeight * (slot.height / viewportHeight) / height,
      ) * 0.94 : 0.8;
      group.scale.setScalar(exhibitScale);
      group.position.set(index * STATION_GAP, 0, -departure * 0.55);
      group.rotation.set(0, -distance * 0.12, 0);
      const float = ambient * 0.035 * (1 - Math.min(1, departure));
      const principal = pieces[0];
      principal.position.set(0, mobile ? -0.15 + float : 0.05 + float, 0.24);
      principal.rotation.set(mobile ? -0.015 : -0.025 + currentPointerY * 0.018, -0.12 + direction * departure * 0.5 + introWeight * 1.05 + ambient * 0.012, -0.035 + currentPointerX * 0.012);
      const vertical = pieces[1];
      vertical.visible = !mobile;
      vertical.position.set(mobile ? 1.8 : -2.65 - departure * 0.8, mobile ? 1.45 : 0.72 + departure * 0.35, mobile ? -1.1 : -0.75 - departure * 1.1);
      vertical.rotation.set(0.015, mobile ? -0.2 : 0.2 - direction * departure * 0.8 - introWeight * 0.65, mobile ? -0.09 : -0.075);
      const caption = pieces[2];
      caption.visible = !mobile;
      caption.position.set(mobile ? -0.8 : 0.95 + departure * 1.3, mobile ? -2.55 : -1.7 - departure * 0.5, mobile ? 0.65 : 0.8 + departure * 0.4);
      caption.rotation.set(-0.03, -0.22 + direction * departure * 0.65 + introWeight * 0.4, mobile ? 0.045 : 0.055);
    });
    if (mobile && mobileSlots.length === 4) {
      // The HTML reserves a genuine image slot between heading and offer. Use
      // its measured centre and bounds, including on shorter iPhones, rather
      // than a viewport percentage that could collide with wrapped text.
      camera.setViewOffset(viewportWidth, viewportHeight, 0, 0, viewportWidth, viewportHeight);
      camera.updateMatrixWorld(true);
      const station = stations[Math.round(progress)];
      station.group.updateMatrixWorld(true);
      station.pieces[0].getWorldPosition(visualCenter);
      visualCenter.project(camera);
      const projectedCenterY = (1 - visualCenter.y) * viewportHeight / 2;
      const desiredCenterY = mix(mobileSlots[lower].centerY, mobileSlots[upper].centerY, blend);
      camera.setViewOffset(viewportWidth, viewportHeight, 0, projectedCenterY - desiredCenterY, viewportWidth, viewportHeight);
    }
  }

  function paint() {
    const start = performance.now();
    renderer.render(scene, camera);
    const end = performance.now();
    renderCount += 1;
    if (end - lastDiagnosticTime >= 1000) {
      lastDiagnosticTime = end;
      mount.dataset.launchDraws = String(renderer.info.render.calls);
      mount.dataset.launchTriangles = String(renderer.info.render.triangles);
      mount.dataset.launchBuffer = `${renderer.domElement.width}x${renderer.domElement.height}`;
      mount.dataset.launchFrameCount = String(renderCount);
      mount.dataset.launchCpuMs = (end - start).toFixed(2);
      mount.dataset.launchProgress = progress.toFixed(3);
      mount.dataset.launchTarget = targetProgress.toFixed(3);
    }
  }

  function tick(time) {
    frame = 0;
    if (!mayAnimate()) return;
    const delta = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 0;
    lastTime = time;
    elapsed += delta;
    introElapsed = Math.min(1.3, introElapsed + delta);
    const damping = 1 - Math.exp(-delta * 11);
    progress += (targetProgress - progress) * damping;
    if (Math.abs(targetProgress - progress) < 0.0003) progress = targetProgress;
    currentPointerX += (pointerX - currentPointerX) * damping;
    currentPointerY += (pointerY - currentPointerY) * damping;
    const transitioning = Math.abs(targetProgress - progress) > 0.001 || introElapsed < 1.3
      || Math.abs(pointerX - currentPointerX) + Math.abs(pointerY - currentPointerY) > 0.001;
    // Scroll and entrance paint at native rAF. A settled, slowly moving exhibit
    // paints at 24/30 Hz, and only while its four-chapter room is visible.
    const interval = transitioning ? 0 : 1000 / (mobile ? 24 : 30);
    if (time - lastPaint >= interval) {
      try {
        pose();
        paint();
        lastPaint = time;
      } catch (error) { reportError(error); return; }
    }
    schedule();
  }

  function dispose({ preserveTheme = false } = {}) {
    if (disposed) return;
    disposed = true;
    stop();
    controller.abort();
    resizeObserver?.disconnect();
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    environmentTarget?.dispose();
    keyLight?.shadow.map?.dispose();
    renderer?.dispose();
    renderer?.domElement.remove();
    if (mount) delete mount.dataset.launchState;
    if (mount) ['launchDraws', 'launchTriangles', 'launchBuffer', 'launchFrameCount', 'launchCpuMs', 'launchProgress', 'launchTarget', 'launchReadyMs', 'launchSetupMs'].forEach((key) => { delete mount.dataset[key]; });
    document.documentElement.classList.remove('launch-ready');
    if (!preserveTheme) delete document.documentElement.dataset.launchScene;
    resolveReady(false);
  }

  const api = {
    ready,
    setBlocked(value) { blocked = Boolean(value); updateVisibility(); },
    setPaused(value) {
      if (disposed) return;
      const wasPaused = paused;
      paused = Boolean(value);
      if (paused) { stop(); progress = targetProgress; }
      // Rejoin the photographed fallback at the visitor's current chapter.
      if (wasPaused && !paused && initialized && !errored && !blocked && !document.hidden && !preferredFallback() && inRoom) {
        progress = targetProgress;
        introElapsed = 1.3;
        try { pose(); paint(); } catch (error) { reportError(error); return; }
      }
      updateVisibility();
    },
    dispose,
  };

  if (!mount || sections.length !== 4 || signal?.aborted) {
    resolveReady(false);
    return api;
  }
  signal?.addEventListener('abort', dispose, { once: true });
  listenerSignal.addEventListener('abort', () => signal?.removeEventListener('abort', dispose), { once: true });

  async function initialize() {
    if (preferredFallback()) {
      mount.dataset.launchState = 'fallback';
      return;
    }
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFShadowMap;
      renderer.domElement.setAttribute('aria-hidden', 'true');
      renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;opacity:0;pointer-events:none;';
      mount.append(renderer.domElement);
      renderer.domElement.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        reportError(new Error('La scena 3D non è disponibile: rimangono le immagini e tutti i contenuti.'));
      }, { signal: listenerSignal });
      scene = new THREE.Scene();
      scene.background = backgroundColors[0].clone();
      camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
      const environment = new RoomEnvironment();
      const pmrem = new THREE.PMREMGenerator(renderer);
      environmentTarget = pmrem.fromScene(environment, 0.035, 0.1, 100);
      scene.environment = environmentTarget.texture;
      scene.environmentIntensity = 0.7;
      environment.dispose();
      pmrem.dispose();
      scene.add(new THREE.HemisphereLight('#ffffff', '#5c6652', 1.5));
      keyLight = new THREE.DirectionalLight('#fff9e9', 2.8);
      keyLight.position.set(-3, 7, 7);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.left = -11;
      keyLight.shadow.camera.right = 11;
      keyLight.shadow.camera.top = 7;
      keyLight.shadow.camera.bottom = -7;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 30;
      keyLight.shadow.radius = 4;
      keyLight.shadow.bias = -0.0006;
      keyLight.shadow.normalBias = 0.025;
      scene.add(keyLight, keyLight.target);
      const fill = new THREE.DirectionalLight('#dce9ff', 1.1);
      fill.position.set(6, 2, 3);
      scene.add(fill);
      floor = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(80, 28)), ownMaterial(new THREE.ShadowMaterial({ color: '#141812', opacity: 0.11 })));
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(STATION_GAP * 1.5, -2.75, -1);
      floor.receiveShadow = true;
      scene.add(floor);
      const loader = new THREE.TextureLoader();
      const artwork = await Promise.all(IMAGES.map(async (name) => {
        const texture = await loader.loadAsync(`${BASE}images/launch-${name}.jpg`);
        if (disposed) { texture.dispose(); throw new DOMException('Aborted', 'AbortError'); }
        return ownTexture(texture);
      }));
      await document.fonts?.ready;
      if (disposed) return;
      buildStations(artwork);
      measure();
      progress = targetProgress;
      introElapsed = targetProgress > 0.45 ? 1.3 : 0;
      pose();
      paint();
      const readyAt = performance.now();
      mount.dataset.launchReadyMs = readyAt.toFixed(1);
      mount.dataset.launchSetupMs = (readyAt - setupStart).toFixed(1);
      initialized = true;
      resizeObserver = new ResizeObserver(measure);
      resizeObserver.observe(mount);
      sections.forEach((section) => resizeObserver.observe(section));
      window.addEventListener('scroll', readScroll, { passive: true, signal: listenerSignal });
      window.addEventListener('resize', measure, { passive: true, signal: listenerSignal });
      window.addEventListener('pointermove', (event) => {
        if (!finePointer.matches || event.pointerType !== 'mouse') return;
        pointerX = clamp(event.clientX / viewportWidth * 2 - 1, -1, 1);
        pointerY = clamp(event.clientY / viewportHeight * 2 - 1, -1, 1);
        schedule();
      }, { passive: true, signal: listenerSignal });
      document.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; }, { passive: true, signal: listenerSignal });
      document.addEventListener('visibilitychange', updateVisibility, { signal: listenerSignal });
      window.addEventListener('pageshow', measure, { signal: listenerSignal });
      reduced.addEventListener('change', updateVisibility, { signal: listenerSignal });
      finePointer.addEventListener('change', () => { pointerX = 0; pointerY = 0; }, { signal: listenerSignal });
      connection?.addEventListener('change', updateVisibility, { signal: listenerSignal });
      updateVisibility();
      resolveReady(true);
      onReady?.();
    } catch (error) { reportError(error); }
  }

  // A visitor can enable animation after arriving with reduced-motion enabled.
  // No renderer or photograph is downloaded until their preference allows it.
  if (preferredFallback()) {
    mount.dataset.launchState = 'fallback';
    const tryInitialize = () => { if (!renderer && !preferredFallback() && !disposed) initialize(); };
    reduced.addEventListener('change', tryInitialize, { signal: listenerSignal });
    connection?.addEventListener('change', tryInitialize, { signal: listenerSignal });
  } else initialize();
  return api;
}
