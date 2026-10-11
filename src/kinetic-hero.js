import * as THREE from 'three';

import { createSoftBlockGeometry, createSoftPartPoses, softChoreography, softFormAmount, SOFT_PART_COUNT } from './soft-sculpture.js';

const LIME = '#dfff00';
const clamp = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;

function canvasTexture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D unavailable');
  paint(context, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function makeLabel() {
  return canvasTexture(768, 768, (context, width, height) => {
    context.fillStyle = '#0e1011'; context.fillRect(0, 0, width, height);
    context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillStyle = LIME;
    context.font = '500 138px "Space Grotesk", sans-serif';
    context.fillText('AURA', width / 2, height * 0.36);
    context.fillRect(width * 0.4, height * 0.52, width * 0.2, 3);
    context.fillStyle = '#f4f3e9';
    context.font = '400 34px "DM Mono", monospace';
    context.fillText('EAU DE PARFUM', width / 2, height * 0.65);
    context.font = '400 24px "DM Mono", monospace';
    context.fillStyle = '#aaad9e';
    context.fillText('01  /  CONCEPT BY SPACE', width / 2, height * 0.81);
  });
}

function createEnvironment(renderer) {
  const environment = new THREE.Scene();
  environment.background = new THREE.Color('#11151b');
  const geometries = [], materials = [];
  const addBox = (width, height, color, intensity, position, rotation) => {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
    const panel = new THREE.Mesh(geometry, material);
    panel.position.set(...position); panel.rotation.set(...rotation);
    environment.add(panel); geometries.push(geometry); materials.push(material);
  };
  addBox(4.5, 8, '#ffffff', 4, [-4, 2, 2], [0, Math.PI / 2, 0]);
  addBox(1.4, 8, '#eef3ff', 3, [3.6, 1, 1], [0, -Math.PI / 2, 0]);
  addBox(7, 2, '#ffffff', 3, [0, 5, 0], [Math.PI / 2, 0, 0]);
  addBox(3.2, 5, '#ffffff', 1.5, [0, 1, -5], [0, 0, 0]);
  addBox(1.2, 5, '#dfff00', 0.8, [3, 0, -3], [0, -0.6, 0]);
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(environment, 0.035, 0.1, 100, { size: 128 });
  generator.dispose(); geometries.forEach((geometry) => geometry.dispose());
  materials.forEach((material) => material.dispose());
  return target;
}

function roundedLabelShape(width, height, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2, y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

export function createKineticHero(container) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const root = new THREE.Group();
  const product = new THREE.Group();
  const parts = [], geometries = new Set(), materials = new Set(), textures = new Set();
  const pointer = new THREE.Vector2();
  const easedPointer = new THREE.Vector2();
  let renderer, environment, disposed = false, blocked = true, visible = false, lost = false;
  let frame = 0, lastTime = 0, elapsed = 0, width = 1, height = 1, phone = false;
  let scrollProgress = 0, preparePromise, prepared = false, previousForm = '';
  let label, currentLabelTexture;
  scene.add(root); root.add(product);

  const ownGeometry = (geometry) => { geometries.add(geometry); return geometry; };
  const ownMaterial = (material) => { materials.add(material); return material; };
  const ownTexture = (texture) => { textures.add(texture); return texture; };
  const chrome = ownMaterial(new THREE.MeshStandardMaterial({ color: '#e7ebee', metalness: 1, roughness: 0.17, envMapIntensity: 1.1 }));
  const satin = ownMaterial(new THREE.MeshPhysicalMaterial({ color: '#dfff00', metalness: 0, roughness: 0.26,
    clearcoat: 0.4, clearcoatRoughness: 0.22, envMapIntensity: 0.6 }));
  const ivory = ownMaterial(new THREE.MeshStandardMaterial({ color: '#f3f2e9', metalness: 0, roughness: 0.29, envMapIntensity: 0.7 }));
  const darkChrome = ownMaterial(new THREE.MeshStandardMaterial({ color: '#252b2d', metalness: 1, roughness: 0.23, envMapIntensity: 1.0 }));
  const blockGeometry = ownGeometry(createSoftBlockGeometry());
  const palette = [chrome, satin, satin, chrome, darkChrome, chrome, ivory, satin];
  for (let index = 0; index < SOFT_PART_COUNT; index += 1) {
    const mesh = new THREE.Mesh(blockGeometry, palette[index]);
    root.add(mesh);
    parts.push({ mesh, index, ...createSoftPartPoses(index) });
  }

  const bodyMaterial = ownMaterial(new THREE.MeshPhysicalMaterial({
    color: '#151a17', metalness: 0, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.12,
    transparent: true, opacity: 0, envMapIntensity: 1.15,
  }));
  const capMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#cdd0ce', metalness: 1, roughness: 0.19, transparent: true, opacity: 0 }));
  const body = new THREE.Mesh(blockGeometry, bodyMaterial);
  body.scale.set(1.52, 1.85, 0.82); body.position.y = -0.2; product.add(body);
  const cap = new THREE.Mesh(blockGeometry, capMaterial);
  cap.scale.set(0.72, 0.44, 0.62); cap.position.y = 0.96; product.add(cap);
  currentLabelTexture = ownTexture(makeLabel());
  const labelMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.65, metalness: 0,
    map: currentLabelTexture, transparent: true, opacity: 0 }));
  label = new THREE.Mesh(ownGeometry(new THREE.ShapeGeometry(roundedLabelShape(0.88, 0.88, 0.045))), labelMaterial);
  // ShapeGeometry UVs are in local units; explicitly fit the printed label to the physical plate.
  const labelUV = label.geometry.attributes.uv;
  for (let index = 0; index < labelUV.count; index += 1) {
    labelUV.setXY(index, labelUV.getX(index) / 0.88 + 0.5, labelUV.getY(index) / 0.88 + 0.5);
  }
  labelUV.needsUpdate = true;
  label.position.set(0, -0.18, 0.425); product.add(label);
  const floorTexture = ownTexture(canvasTexture(256, 256, (context, size) => {
    const gradient = context.createRadialGradient(size / 2, size / 2, 12, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,0.65)'); gradient.addColorStop(0.6, 'rgba(0,0,0,0.25)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)'); context.fillStyle = gradient; context.fillRect(0, 0, size, size);
  }));
  const floor = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(5.5, 5.5)),
    ownMaterial(new THREE.MeshBasicMaterial({ map: floorTexture, transparent: true, opacity: 0.6, depthWrite: false })));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.92; root.add(floor);
  const pedestal = new THREE.Mesh(blockGeometry,
    ownMaterial(new THREE.MeshStandardMaterial({ color: '#202622', metalness: 0.65, roughness: 0.35, transparent: true, opacity: 0 })));
  pedestal.scale.set(2.5, 0.08, 1.6);
  pedestal.position.y = -1.29; root.add(pedestal);
  scene.add(new THREE.HemisphereLight('#eef4ff', '#101714', 0.9));
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-3.5, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight('#e8f4ff', 1.6); rim.position.set(4, 1, -3); scene.add(rim);
  const limeLight = new THREE.PointLight(LIME, 1.4, 6, 2); limeLight.position.set(3, -0.7, 1); scene.add(limeLight);

  function formName(state) {
    if (state.product > 0.8) return 'product';
    if (state.from === state.to) return state.from === 'stack' ? 'stack' : 'sculpture';
    return 'assembly';
  }

  function pose(time) {
    const state = reduced.matches ? { from: 'cushion', to: 'cushion', progress: 0, product: 0 } : softChoreography(time);
    const productAmount = state.product;
    for (const part of parts) {
      const from = part[state.from], to = part[state.to];
      const stagger = (part.index % 4) / 3 * 0.09;
      const amount = smooth((state.progress - stagger) / (1 - stagger));
      part.mesh.position.copy(from.position).lerp(to.position, amount);
      const stacking = state.from === 'spread' && state.to === 'stack';
      const unstacking = state.from === 'stack' && state.to === 'spread';
      // Establish vertical clearance before closing the front/back depth pairs.
      const vertical = stacking ? smooth(amount / 0.7)
        : unstacking ? smooth((amount - 0.3) / 0.7) : amount;
      const depth = stacking ? smooth((amount - 0.3) / 0.7)
        : unstacking ? smooth(amount / 0.7) : amount;
      part.mesh.position.y = lerp(from.position.y, to.position.y, vertical);
      part.mesh.position.z = lerp(from.position.z, to.position.z, depth);
      part.mesh.quaternion.copy(from.quaternion).slerp(to.quaternion, amount);
      part.mesh.scale.copy(from.scale).lerp(to.scale, amount);
      part.mesh.scale.y = lerp(from.scale.y, to.scale.y, vertical);
      // The finished product replaces the converged modules as one clean surface.
      part.mesh.scale.multiplyScalar(1 - smooth((productAmount - 0.36) / 0.58));
      part.mesh.visible = productAmount < 0.96;
    }
    const orbitAmount = 1 - productAmount;
    const stackAmount = softFormAmount(state, 'stack');
    const spreadAmount = softFormAmount(state, 'spread');
    root.rotation.x = lerp(0.2, 0.025, productAmount) - stackAmount * 0.07 + easedPointer.y * 0.065;
    const sculpturalTurn = 0.5 + Math.sin(time * 0.22) * 0.3 + scrollProgress * 0.26;
    root.rotation.y = lerp(sculpturalTurn, Math.sin(time * 0.28) * 0.1, productAmount) + easedPointer.x * 0.11;
    root.rotation.z = (-0.07 + Math.sin(time * 0.28) * 0.025) * orbitAmount + stackAmount * 0.04;
    root.position.x = phone ? 0 : camera.aspect * 4.95 * 0.23;
    root.position.y = (phone ? (height < 700 ? -1.65 : -1.45) : -0.05)
      + Math.sin(time * 0.58) * 0.025 * orbitAmount;
    const fitScale = phone ? lerp(height < 700 ? 0.8 : 0.86, height < 700 ? 0.69 : 0.73, spreadAmount)
      : lerp(0.95, 0.76, spreadAmount);
    root.scale.setScalar(fitScale * (1 + Math.sin(time * 0.65) * 0.009 * orbitAmount));
    product.visible = productAmount > 0.002;
    const solid = smooth((productAmount - 0.12) / 0.76);
    bodyMaterial.opacity = solid;
    capMaterial.opacity = solid;
    labelMaterial.opacity = smooth((productAmount - 0.43) / 0.53);
    pedestal.material.opacity = solid * 0.55;
    floor.material.opacity = lerp(0.32, 0.8, solid);
    floor.position.y = lerp(-1.92, -1.31, solid);
    const form = formName(state);
    if (form !== previousForm) { container.dataset.form = form; previousForm = form; }
    container.dataset.sculpture = 'soft-modules';
    container.dataset.motionTime = time.toFixed(2);
  }

  function paint() {
    if (disposed || !renderer || lost) return;
    pose(elapsed); renderer.render(scene, camera);
    container.dataset.drawCalls = String(renderer.info.render.calls);
    container.dataset.triangles = String(renderer.info.render.triangles);
  }

  function canAnimate() { return !disposed && renderer && !lost && !blocked && visible && !document.hidden && !reduced.matches; }
  function stop() { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function tick(now) {
    frame = 0;
    if (!canAnimate()) return;
    const dt = lastTime ? Math.min((now - lastTime) / 1000, 0.07) : 0;
    lastTime = now; elapsed += dt;
    easedPointer.lerp(pointer, 1 - Math.exp(-dt * 4));
    paint(); frame = requestAnimationFrame(tick);
  }
  function request() {
    if (canAnimate() && !frame) frame = requestAnimationFrame(tick);
    else if (!canAnimate()) { stop(); if (!blocked) paint(); }
  }
  function resize() {
    if (disposed || !renderer) return;
    const rect = container.getBoundingClientRect();
    width = Math.max(1, Math.round(rect.width)); height = Math.max(1, Math.round(rect.height));
    phone = width < 760;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.4 : 1.6));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    const viewHeight = phone ? (height < 700 ? 9 : 8.2) : Math.max(4.95, 8.8 / camera.aspect);
    camera.position.set(0, 0.24, viewHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
    camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
    paint();
  }
  function contextLost(event) {
    event.preventDefault(); lost = true; stop(); container.dataset.scene = 'fallback';
    if (renderer) renderer.domElement.style.opacity = '0';
  }
  function contextRestored() {
    if (disposed || !renderer) return;
    environment?.dispose(); environment = createEnvironment(renderer); scene.environment = environment.texture;
    lost = false; renderer.domElement.style.opacity = '1'; container.dataset.scene = 'ready'; resize(); request();
  }
  function pointerMove(event) {
    if (coarse.matches || reduced.matches) return;
    const rect = container.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width - 0.5) * 2, ((event.clientY - rect.top) / rect.height - 0.5) * 2);
  }
  function pointerLeave() { pointer.set(0, 0); }
  function preferenceChange() { stop(); paint(); request(); }
  function visibilityChange() { if (document.hidden) stop(); else request(); }
  const observer = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting); request();
  }, { threshold: 0.01 });
  observer.observe(container);
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container);
  container.addEventListener('pointermove', pointerMove, { passive: true });
  container.addEventListener('pointerleave', pointerLeave);
  document.addEventListener('visibilitychange', visibilityChange);
  reduced.addEventListener('change', preferenceChange);

  async function prepare() {
    if (preparePromise) return preparePromise;
    preparePromise = (async () => {
      if (disposed) return { cancelled: true };
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.02;
        renderer.setClearColor('#090b10', 0);
        renderer.domElement.setAttribute('aria-hidden', 'true');
        renderer.domElement.className = 'kinetic-canvas';
        renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;pointer-events:none';
        renderer.domElement.addEventListener('webglcontextlost', contextLost);
        renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
        container.prepend(renderer.domElement);
        environment = createEnvironment(renderer); scene.environment = environment.texture;
        resize();
        try { await document.fonts?.ready; } catch { /* The system font is a complete printable fallback. */ }
        if (disposed) return { cancelled: true };
        const texture = ownTexture(makeLabel());
        labelMaterial.map = texture; labelMaterial.needsUpdate = true;
        textures.delete(currentLabelTexture); currentLabelTexture.dispose(); currentLabelTexture = texture;
        // Compile both product and abstract materials while the entry scene is on screen.
        pose(12); product.visible = true;
        if (renderer.compileAsync) await renderer.compileAsync(scene, camera);
        if (disposed) return { cancelled: true };
        if (lost) return { fallback: true };
        prepared = true; container.dataset.scene = 'ready'; container.dataset.prewarm = 'ready';
        paint(); request(); return { ready: true };
      } catch (error) {
        if (!disposed) { lost = true; stop(); container.dataset.scene = 'fallback'; renderer?.domElement.remove(); }
        return { fallback: true };
      }
    })();
    return preparePromise;
  }

  return {
    prepare,
    setBlocked(value) { blocked = Boolean(value); if (blocked) stop(); else { if (!prepared && !preparePromise) void prepare(); request(); } },
    setProgress(value) { scrollProgress = clamp(value); if (!frame && !blocked) paint(); },
    dispose() {
      if (disposed) return; disposed = true; stop();
      observer.disconnect(); resizeObserver.disconnect();
      container.removeEventListener('pointermove', pointerMove); container.removeEventListener('pointerleave', pointerLeave);
      document.removeEventListener('visibilitychange', visibilityChange); reduced.removeEventListener('change', preferenceChange);
      if (renderer) {
        renderer.domElement.removeEventListener('webglcontextlost', contextLost);
        renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
        renderer.domElement.remove(); renderer.dispose();
      }
      geometries.forEach((geometry) => geometry.dispose()); materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose()); environment?.dispose(); scene.clear();
    },
  };
}
