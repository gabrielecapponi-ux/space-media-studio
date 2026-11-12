import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createStudioRoom as createLegacyRoom } from './studio-room.js';

const clamp = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => { const t = clamp(value); return t * t * (3 - 2 * t); };
const phase = (value, from, to) => smooth((value - from) / (to - from));

/** Blender-authored studio; the entry controller remains its only clock. */
export function createStudioRoom(container, { reduced = false, drawScreen, modelBytes } = {}) {
  if (!container?.appendChild) return { setProgress() {}, setZoom() {}, resize() {}, dispose() {} };
  let disposed = false;
  let failed = false;
  let progress = 0;
  let zoom = 0;
  let width = 1;
  let height = 1;
  let paintFrame = 0;
  let renderer;
  let observer;
  let model;
  let fallback;
  let environment;
  let heroTexture;
  let heroScreen;
  let screenViewportWidth = 0;
  let screenViewportHeight = 0;
  let frames = 0;
  let startDistance = 1, endDistance = 1;
  const sightline = new THREE.Vector3();
  const tracks = [];
  const materials = new Set();
  const geometries = new Set();
  const textures = new Set();
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(39, 1, .035, 100);
  const screenCenter = new THREE.Vector3(1.78, 2.13, -.477);
  const screenWidth = 2.66;
  const screenHeight = 1.5;
  const target = new THREE.Vector3(0, 1.55, -.1);
  const direction = new THREE.Vector3(.91, .73, 1.52).normalize();
  const cameraForward = new THREE.Vector3(0, 0, 1);
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const look = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const cameraRight = new THREE.Vector3().crossVectors(worldUp, direction).normalize();
  const cameraUp = new THREE.Vector3().crossVectors(direction, cameraRight).normalize();
  const corner = new THREE.Vector3();
  let secondaryScreen;

  function state(value) {
    container.dataset.scene = value;
    if (renderer) renderer.domElement.style.visibility = value === 'ready' ? 'visible' : 'hidden';
  }

  function ownCanvas(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Studio screen context unavailable');
    draw(context, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    textures.add(texture);
    return texture;
  }

  function repaintHero() {
    if (!heroScreen) return;
    const aspect = width / height;
    // A proportional resize can cross a responsive breakpoint without changing
    // aspect. The monitor must still repaint the incoming page's real layout.
    if (heroTexture && width === screenViewportWidth && height === screenViewportHeight) return;
    screenViewportWidth = width;
    screenViewportHeight = height;
    const previous = heroTexture;
    heroTexture = ownCanvas(2048, 1152, (ctx, w, h) => {
      ctx.fillStyle = '#080909'; ctx.fillRect(0, 0, w, h);
      if (drawScreen) drawScreen(ctx, w, h, aspect);
      else {
        ctx.fillStyle = '#dfff00'; ctx.font = '600 230px sans-serif';
        ctx.fillText('SPACE', 130, 630);
      }
    });
    heroScreen.material.map = heroTexture;
    heroScreen.material.needsUpdate = true;
    previous?.dispose();
    if (previous) textures.delete(previous);
  }

  function frameCamera() {
    const aspect = width / height;
    camera.aspect = aspect;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let distance = 0;
    for (const x of [-4.95, 4.95]) for (const y of [-.35, 4.05]) for (const z of [-3.2, 3.4]) {
      corner.set(x, y, z).sub(target);
      const depth = corner.dot(direction);
      distance = Math.max(distance, Math.abs(corner.dot(cameraRight)) / (tan * aspect) + depth,
        Math.abs(corner.dot(cameraUp)) / tan + depth);
    }
    start.copy(target).addScaledVector(direction, distance * (aspect < .8 ? 1.08 : 1.1));
    const finalDistance = Math.min(screenHeight / (2 * tan), screenWidth / (2 * tan * aspect)) * .9995;
    end.copy(screenCenter);
    end.z += finalDistance;
    startDistance = start.distanceTo(target);
    endDistance = end.distanceTo(screenCenter);
    camera.updateProjectionMatrix();
  }

  function cameraPose() {
    const t = reduced ? (zoom === 1 ? 1 : 0) : smooth(zoom);
    // Constant apparent magnification through the push. Linear translation
    // otherwise bunches most of the visual acceleration against the display.
    look.lerpVectors(target, screenCenter, smooth(Math.min(1, t * 1.32)));
    sightline.copy(direction).lerp(cameraForward, t).normalize();
    camera.position.copy(look).addScaledVector(sightline, startDistance * (endDistance / startDistance) ** t);
    camera.lookAt(look);
  }

  function pose() {
    if (!model || disposed || failed) return;
    for (const item of tracks) {
      const t = phase(progress, item.from, item.to);
      item.object.visible = t > .0001;
      item.object.position.copy(item.position);
      item.object.scale.copy(item.scale);
      if (!reduced) item.object.position.addScaledVector(item.offset, 1 - t);
      if (item.axis) item.object.scale[item.axis] *= Math.max(.001, t);
    }
    const light = phase(progress, .66, .85);
    for (const item of [heroScreen, secondaryScreen]) {
      if (item) item.material.color.setScalar(.04 + .96 * light);
    }
    container.dataset.progress = progress.toFixed(4);
    container.dataset.zoom = zoom.toFixed(4);
    cameraPose();
    requestPaint();
  }

  function paint() {
    paintFrame = 0;
    if (disposed || failed || !model || document.hidden) return;
    try {
      renderer.render(scene, camera);
      container.dataset.frame = String(++frames);
      container.dataset.drawCalls = String(renderer.info.render.calls);
      container.dataset.triangles = String(renderer.info.render.triangles);
      state('ready');
    } catch { useFallback(); }
  }

  function requestPaint() {
    if (!paintFrame && renderer && model && !disposed && !failed && !document.hidden) {
      paintFrame = requestAnimationFrame(paint);
    }
  }

  function resize() {
    if (fallback) return fallback.resize();
    if (!renderer || disposed || failed) return;
    const bounds = container.getBoundingClientRect();
    width = Math.max(1, bounds.width); height = Math.max(1, bounds.height);
    const mobile = width <= 760 || (navigator.maxTouchPoints > 0 && width < 1025);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
    renderer.setSize(width, height, false);
    frameCamera(); repaintHero(); cameraPose(); requestPaint();
  }

  function releaseModel(value) {
    const maps = new Set(); const mats = new Set(); const geo = new Set();
    value?.traverse((object) => {
      if (object.geometry) geo.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) {
        mats.add(material);
        for (const prop of Object.values(material)) if (prop?.isTexture) maps.add(prop);
      }
    });
    geo.forEach(item => item.dispose()); mats.forEach(item => item.dispose()); maps.forEach(item => item.dispose());
  }

  function cleanup() {
    cancelAnimationFrame(paintFrame); paintFrame = 0;
    observer?.disconnect(); observer = undefined;
    document.removeEventListener('visibilitychange', visibility);
    releaseModel(model); model = undefined;
    textures.forEach(item => item.dispose()); textures.clear();
    materials.forEach(item => item.dispose()); materials.clear();
    geometries.forEach(item => item.dispose()); geometries.clear();
    environment?.dispose(); environment = undefined;
    scene.traverse(object => { if (object.isLight) object.shadow?.dispose(); });
    if (renderer) {
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      renderer.dispose(); renderer.domElement.remove(); renderer = undefined;
    }
  }

  function useFallback() {
    if (disposed || failed) return;
    failed = true; cleanup();
    container.dataset.source = 'procedural-fallback';
    try {
      fallback = createLegacyRoom(container, { reduced, drawScreen });
      fallback.setProgress(progress); fallback.setZoom(zoom);
    } catch { state('fallback'); }
  }

  function contextLost(event) { event.preventDefault(); useFallback(); }
  function visibility() { if (!document.hidden) requestPaint(); }

  state('loading');
  container.dataset.source = 'blender-glb';
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setClearColor(0x090b10, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.shadowMap.autoUpdate = false;
    renderer.domElement.className = 'studio-room-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;visibility:hidden';
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    container.append(renderer.domElement);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnvironment = new RoomEnvironment();
    environment = pmrem.fromScene(roomEnvironment, .04);
    roomEnvironment.dispose(); pmrem.dispose();
    scene.environment = environment.texture;
    scene.environmentIntensity = .45;
    scene.add(new THREE.HemisphereLight(0xf7f1e2, 0x363d36, .8));
    const key = new THREE.DirectionalLight(0xfff4db, 2.7);
    key.position.set(-3.8, 8, 7.5); key.target.position.set(0, .8, -.4);
    key.castShadow = true;
    const compact = matchMedia('(max-width: 760px)').matches;
    key.shadow.mapSize.set(compact ? 512 : 1024, compact ? 512 : 1024);
    Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -5, near: .5, far: 24 });
    key.shadow.normalBias = .025; key.shadow.bias = -.0001;
    key.shadow.radius = 3;
    scene.add(key, key.target);
    const fill = new THREE.DirectionalLight(0xc8dce5, .65);
    fill.position.set(6, 4, -2); scene.add(fill);
    const groundGeo = new THREE.PlaneGeometry(40, 40); geometries.add(groundGeo);
    const groundMat = new THREE.ShadowMaterial({ opacity: .2 }); materials.add(groundMat);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.325; ground.receiveShadow = true;
    scene.add(ground);
    observer = new ResizeObserver(resize); observer.observe(container);
    document.addEventListener('visibilitychange', visibility);
    resize();
    const url = new URL(`${import.meta.env.BASE_URL}models/studio-space-20261105.glb`, document.baseURI).href;
    const loader = new GLTFLoader();
    const modelReady = modelBytes ? loader.parseAsync(modelBytes, new URL('.', url).href) : loader.loadAsync(url);
    modelReady.then(gltf => {
      if (disposed || failed) { releaseModel(gltf.scene); return; }
      try {
        model = gltf.scene;
        model.traverse(object => {
          if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
          if (Number.isFinite(object.userData.entryFrom)) {
            tracks.push({ object, position: object.position.clone(), scale: object.scale.clone(),
              from: object.userData.entryFrom, to: object.userData.entryTo,
              offset: new THREE.Vector3(...object.userData.entryOffset), axis: object.userData.entryScaleAxis });
          }
        });
        heroScreen = model.getObjectByName('Screen_Hero');
        const secondary = secondaryScreen = model.getObjectByName('Screen_Secondary');
        if (!heroScreen || !secondary || tracks.length < 14) throw new Error('Incomplete studio model');
        const replacedDisplays = new Set([heroScreen.material, secondary.material]);
        heroScreen.material = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
        materials.add(heroScreen.material);
        heroScreen.castShadow = secondary.castShadow = false;
        const identity = ownCanvas(1280, 800, (ctx, w, h) => {
          ctx.fillStyle = '#dfff00'; ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = '#101110'; ctx.font = '600 180px "Space Grotesk", sans-serif';
          ctx.fillText('SPACE', 78, 400);
          ctx.font = '24px "DM Mono", monospace'; ctx.fillText('CREATIVE STUDIO / PARMA', 85, 467);
          ctx.fillRect(85, 630, 1100, 2);
          ctx.font = '23px "DM Mono", monospace'; ctx.fillText('BRAND. WEB. MOTION.', 85, 691);
        });
        secondary.material = new THREE.MeshBasicMaterial({ map: identity, toneMapped: false });
        materials.add(secondary.material);
        replacedDisplays.forEach(material => material.dispose());
        scene.add(model); repaintHero();
        renderer.shadowMap.needsUpdate = true;
        pose();
      } catch { useFallback(); }
    }).catch(useFallback);
  } catch { useFallback(); }

  return {
    setProgress(value) {
      const next = clamp(value);
      if (progress === next) return;
      progress = next;
      if (fallback) return fallback.setProgress(progress);
      if (renderer) renderer.shadowMap.needsUpdate = true;
      pose();
    },
    setZoom(value) {
      zoom = clamp(value);
      if (fallback) return fallback.setZoom(zoom);
      container.dataset.zoom = zoom.toFixed(4);
      cameraPose();
      requestPaint();
    },
    resize,
    dispose() {
      if (disposed) return;
      disposed = true;
      fallback?.dispose(); fallback = undefined;
      cleanup(); state('fallback');
    },
  };
}
