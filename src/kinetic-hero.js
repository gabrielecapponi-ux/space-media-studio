import * as THREE from 'three';

const TAU = Math.PI * 2;
const ARC_ANGLE = TAU / 3 - 0.1;
const HELIX_RISE = 0.24;
const LIME = '#dfff00';
const clamp = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a, b, t) => a + (b - a) * t;

// A beveled arc is one authored part, reused for the sculpture and the product collar.
function createArc() {
  const arc = ARC_ANGLE;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, 1, 0, arc, false);
  shape.lineTo(Math.cos(arc) * 0.72, Math.sin(arc) * 0.72);
  shape.absarc(0, 0, 0.72, arc, 0, true);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.115, steps: 1, curveSegments: 28,
    bevelEnabled: true, bevelSegments: 3, bevelSize: 0.026, bevelThickness: 0.026,
  });
  geometry.translate(0, 0, -0.0575);
  geometry.rotateX(Math.PI / 2);
  // Bend the same machined part into a true rising arc. The original flat topology
  // remains shared; a GPU morph supplies a continuous helix without per-frame edits.
  const positions = geometry.attributes.position.clone();
  const normals = geometry.attributes.normal.clone();
  const normal = new THREE.Vector3();
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index), z = positions.getZ(index);
    const angle = Math.atan2(z, x);
    positions.setY(index, positions.getY(index) + angle / ARC_ANGLE * HELIX_RISE);
    // The inverse-transpose of this bend preserves the authored smooth bevel normals.
    const slope = HELIX_RISE / ARC_ANGLE / (x * x + z * z);
    const ny = normals.getY(index);
    normal.set(normals.getX(index) + slope * z * ny, ny, normals.getZ(index) - slope * x * ny).normalize();
    normals.setXYZ(index, normal.x, normal.y, normal.z);
  }
  geometry.morphAttributes.position = [positions];
  geometry.morphAttributes.normal = [normals];
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

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

// One complete sequence: an orbital idea becomes a woven structure, then a product.
// Every boundary shares its endpoint pose; looping never resets an object's transform.
function choreography(time) {
  const phase = ((time + 15.55) % 18 + 18) % 18;
  const hold = (form) => ({ from: form, to: form, progress: 0, product: form === 'product' ? 1 : 0 });
  const transition = (from, to, progress) => ({
    from, to, progress,
    product: to === 'product' ? smooth(progress) : from === 'product' ? 1 - smooth(progress) : 0,
  });
  if (phase < 2.2) return hold('orbit');
  if (phase < 3.65) return transition('orbit', 'spread', (phase - 2.2) / 1.45);
  if (phase < 5.6) return transition('spread', 'helix', (phase - 3.65) / 1.95);
  if (phase < 7.75) return hold('helix');
  if (phase < 9.15) return transition('helix', 'spread', (phase - 7.75) / 1.4);
  if (phase < 11.2) return transition('spread', 'product', (phase - 9.15) / 2.05);
  if (phase < 13.95) return hold('product');
  if (phase < 15.55) return transition('product', 'spread', (phase - 13.95) / 1.6);
  return transition('spread', 'orbit', (phase - 15.55) / 2.45);
}

function formAmount(state, form) {
  if (state.from === form && state.to === form) return 1;
  if (state.to === form) return smooth(state.progress);
  if (state.from === form) return 1 - smooth(state.progress);
  return 0;
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
  const chrome = ownMaterial(new THREE.MeshStandardMaterial({ color: '#e3e7e9', metalness: 1, roughness: 0.15, envMapIntensity: 1.05 }));
  const satin = ownMaterial(new THREE.MeshStandardMaterial({ color: '#cfff00', metalness: 0, roughness: 0.32, envMapIntensity: 0.32 }));
  const darkChrome = ownMaterial(new THREE.MeshStandardMaterial({ color: '#3c4143', metalness: 1, roughness: 0.21, envMapIntensity: 1.0 }));
  const arcGeometry = ownGeometry(createArc());
  const sectorRotation = new THREE.Quaternion();
  for (let index = 0; index < 24; index += 1) {
    const layer = Math.floor(index / 3), sector = index % 3;
    const mesh = new THREE.Mesh(arcGeometry, layer === 2 || layer === 6 ? satin : layer === 0 ? darkChrome : chrome);
    root.add(mesh);
    // Parallel rotor layers share one axis, leaving a physical gap between parts.
    // The changing radius gives the assembled object a deliberate spindle silhouette.
    const orbitQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0, 0.1));
    sectorRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), sector * TAU / 3 + layer * 0.2);
    orbitQuaternion.multiply(sectorRotation);
    const angle = index * TAU / 24;
    const spreadQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      Math.sin(angle * 2) * 0.4 + 0.65, -angle + 0.4, Math.cos(angle) * 0.7,
    ));
    // Two rising, interleaved ribbons retain evenly spaced joints and constant radius.
    const strand = Math.floor(index / 12), helixStep = index % 12;
    const helixAngle = helixStep * TAU / 3 + strand * Math.PI;
    const helixQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -helixAngle);
    const helixRadius = 0.98;
    const rotorRadius = 0.92 + Math.sin(layer / 7 * Math.PI) * 0.53;
    const productQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), sector * TAU / 3 + 0.025);
    const radius = layer < 6 ? 0.9 : layer === 6 ? 0.5 : 0.44;
    const productY = layer < 6 ? -1.1 + layer * 0.27 : layer === 6 ? 0.72 : 1.04;
    parts.push({ mesh, index,
      orbit: { position: new THREE.Vector3(0, -1.225 + layer * 0.35, 0), quaternion: orbitQuaternion,
        scale: new THREE.Vector3(rotorRadius, 1, rotorRadius) },
      spread: { position: new THREE.Vector3(Math.cos(angle) * 1.58, Math.sin(angle) * 1.52,
        Math.sin(angle * 3 + 0.3) * 0.72), quaternion: spreadQuaternion, scale: new THREE.Vector3(0.63, 0.9, 0.63) },
      helix: { position: new THREE.Vector3(0, -1.44 + helixStep * HELIX_RISE, 0),
        quaternion: helixQuaternion, scale: new THREE.Vector3(helixRadius, 1, helixRadius) },
      product: { position: new THREE.Vector3(0, productY, 0), quaternion: productQuaternion,
        scale: new THREE.Vector3(radius, layer === 7 ? 1.7 : 1, radius) },
    });
  }

  const bodyMaterial = ownMaterial(new THREE.MeshPhysicalMaterial({
    color: '#151a17', metalness: 0.48, roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08,
    transparent: true, opacity: 0, envMapIntensity: 1.15,
  }));
  const capMaterial = ownMaterial(new THREE.MeshStandardMaterial({ color: '#cdd0ce', metalness: 1, roughness: 0.19, transparent: true, opacity: 0 }));
  const profile = [[0, -1.25], [0.74, -1.25], [0.85, -1.22], [0.875, -1.13], [0.875, 0.34],
    [0.86, 0.43], [0.78, 0.53], [0.46, 0.69], [0.38, 0.73], [0.38, 0.91], [0, 0.91]];
  const body = new THREE.Mesh(ownGeometry(new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 64)), bodyMaterial);
  product.add(body);
  const cap = new THREE.Mesh(ownGeometry(new THREE.CylinderGeometry(0.42, 0.42, 0.32, 48, 1)), capMaterial);
  cap.position.y = 1.03; product.add(cap);
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
  label.position.set(0, -0.18, 0.95); product.add(label);
  const floorTexture = ownTexture(canvasTexture(256, 256, (context, size) => {
    const gradient = context.createRadialGradient(size / 2, size / 2, 12, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,0.65)'); gradient.addColorStop(0.6, 'rgba(0,0,0,0.25)');
    gradient.addColorStop(1, 'rgba(0,0,0,0)'); context.fillStyle = gradient; context.fillRect(0, 0, size, size);
  }));
  const floor = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(5.5, 5.5)),
    ownMaterial(new THREE.MeshBasicMaterial({ map: floorTexture, transparent: true, opacity: 0.6, depthWrite: false })));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.31; root.add(floor);
  const pedestal = new THREE.Mesh(ownGeometry(new THREE.CylinderGeometry(1.28, 1.32, 0.08, 64)),
    ownMaterial(new THREE.MeshStandardMaterial({ color: '#202622', metalness: 0.65, roughness: 0.35, transparent: true, opacity: 0 })));
  pedestal.position.y = -1.29; root.add(pedestal);
  scene.add(new THREE.HemisphereLight('#eef4ff', '#101714', 0.9));
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-3.5, 6, 5); scene.add(key);
  const rim = new THREE.DirectionalLight('#e8f4ff', 1.6); rim.position.set(4, 1, -3); scene.add(rim);
  const limeLight = new THREE.PointLight(LIME, 1.4, 6, 2); limeLight.position.set(3, -0.7, 1); scene.add(limeLight);

  function formName(state) {
    if (state.product > 0.8) return 'product';
    if (state.from === state.to) return state.from === 'helix' ? 'helix' : 'sculpture';
    return 'assembly';
  }

  function pose(time) {
    const state = reduced.matches ? { from: 'orbit', to: 'orbit', progress: 0, product: 0 } : choreography(time);
    const productAmount = state.product;
    for (const part of parts) {
      const from = part[state.from], to = part[state.to];
      const stagger = (part.index % 6) / 5 * 0.12;
      const amount = smooth((state.progress - stagger) / (1 - stagger));
      part.mesh.position.copy(from.position).lerp(to.position, amount);
      // A shallow, authored flight arc makes reassembly read as a single gesture.
      const flight = Math.sin(amount * Math.PI);
      part.mesh.position.x += Math.sin(part.index * 0.73) * 0.15 * flight;
      part.mesh.position.y += Math.cos(part.index * 0.67) * 0.1 * flight;
      part.mesh.position.z += Math.sin(part.index * 0.61) * 0.28 * flight;
      part.mesh.quaternion.copy(from.quaternion).slerp(to.quaternion, amount);
      part.mesh.scale.copy(from.scale).lerp(to.scale, amount);
      part.mesh.morphTargetInfluences[0] = state.from === 'helix' ? 1 - amount : state.to === 'helix' ? amount : 0;
    }
    const orbitAmount = 1 - productAmount;
    const helixAmount = formAmount(state, 'helix');
    const spreadAmount = formAmount(state, 'spread');
    root.rotation.x = lerp(0.16, 0.04, productAmount) - helixAmount * 0.07 + easedPointer.y * 0.08;
    const orbitalTurn = 0.55 + Math.sin(time * 0.24) * 0.7 + scrollProgress * 0.6;
    const sculpturalTurn = lerp(orbitalTurn, 0.28 + Math.sin(time * 0.22) * 0.32, helixAmount);
    root.rotation.y = lerp(sculpturalTurn, Math.sin(time * 0.28) * 0.12, productAmount) + easedPointer.x * 0.12;
    root.rotation.z = Math.sin(time * 0.28) * 0.05 * orbitAmount + helixAmount * 0.12;
    root.position.x = phone ? 0 : camera.aspect * 4.95 * 0.23;
    root.position.y = (phone ? (height < 700 ? -1.65 : -1.45) : -0.05)
      + Math.sin(time * 0.58) * 0.025 * orbitAmount;
    const fitScale = phone ? lerp(height < 700 ? 0.87 : 0.94, height < 700 ? 0.75 : 0.79, spreadAmount) : 1;
    root.scale.setScalar(fitScale * (1 + Math.sin(time * 0.65) * 0.009 * orbitAmount));
    product.visible = productAmount > 0.002;
    const solid = smooth((productAmount - 0.12) / 0.76);
    bodyMaterial.opacity = solid;
    capMaterial.opacity = solid;
    labelMaterial.opacity = smooth((productAmount - 0.43) / 0.53);
    pedestal.material.opacity = solid;
    floor.material.opacity = lerp(0.32, 0.8, solid);
    const form = formName(state);
    if (form !== previousForm) { container.dataset.form = form; previousForm = form; }
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
        pose(14); product.visible = true;
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
