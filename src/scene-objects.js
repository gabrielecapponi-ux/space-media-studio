import * as THREE from 'three';

const TAU = Math.PI * 2;
const clamp = (n) => Math.min(1, Math.max(0, n));
const ease = (n) => { const t = clamp(n); return t * t * (3 - 2 * t); };

/** Original, addressable models for Space's four creative disciplines. */
export function buildCinematicExhibits({ ownGeometry, ownMaterial, canvasTexture, surface, browserTexture, roundedShape, architecture }) {
  const mesh = (geometry, material) => {
    const result = new THREE.Mesh(ownGeometry(geometry), material);
    result.castShadow = true;
    result.receiveShadow = true;
    return result;
  };
  const physical = (options) => ownMaterial(new THREE.MeshPhysicalMaterial(options));
  const yellow = physical({ color: '#e8ff00', roughness: .22, metalness: .12, clearcoat: 1, clearcoatRoughness: .14 });
  const chrome = physical({ color: '#bcc0bd', roughness: .19, metalness: 1, clearcoat: .35 });
  const graphite = physical({ color: '#161a18', roughness: .25, metalness: .82 });
  const paper = physical({ color: '#f2efe5', roughness: .82, metalness: 0 });
  const box = (width, height, depth, material, radius = .09) => {
    const geometry = new THREE.ExtrudeGeometry(roundedShape(width - radius * 2, height - radius * 2, radius), {
      depth: Math.max(.01, depth - radius * 2), bevelEnabled: true, bevelSize: radius,
      bevelThickness: radius, bevelSegments: 4, curveSegments: 10, steps: 1,
    });
    geometry.translate(0, 0, -(depth - radius * 2) / 2);
    return mesh(geometry, material);
  };
  const typeTexture = ({ title, subtitle = '', background = '#151817', ink = '#e8ff00', width = 1200, height = 800 }) => canvasTexture(width, height, (ctx) => {
    ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = ink;
    const lines = title.split('\n');
    const size = Math.min(width * .2, height * .64 / lines.length);
    ctx.font = `500 ${size}px "Space Grotesk", sans-serif`;
    lines.forEach((line, i) => ctx.fillText(line, width * .07, height * .2 + size * (i + .75)));
    ctx.font = `${width * .021}px "DM Mono", monospace`;
    ctx.fillText(subtitle, width * .075, height * .91);
  });
  const exhibits = [];

  // A tactile version of the actual Space compass. Four addressable quadrants
  // separate, turn and lock back into one mark, rather than orbiting aimlessly.
  {
    const root = new THREE.Group();
    const mark = new THREE.Group();
    const quadrants = [];
    const quadrant = new THREE.Shape();
    quadrant.moveTo(.15, 2.18);
    quadrant.quadraticCurveTo(.18, 2.35, .24, 2.12);
    quadrant.lineTo(.65, .76);
    quadrant.quadraticCurveTo(.68, .69, .76, .65);
    quadrant.lineTo(2.12, .24);
    quadrant.quadraticCurveTo(2.35, .18, 2.18, .15);
    quadrant.lineTo(.5, .15);
    quadrant.quadraticCurveTo(.48, .45, .15, .5);
    quadrant.closePath();
    const geometry = ownGeometry(new THREE.ExtrudeGeometry(quadrant, {
      depth: .68, steps: 1, bevelEnabled: true, bevelThickness: .13,
      bevelSize: .105, bevelSegments: 6, curveSegments: 16,
    }));
    geometry.translate(0, 0, -.34);
    for (let index = 0; index < 4; index++) {
      const part = new THREE.Group();
      const body = new THREE.Mesh(geometry, [yellow, chrome]);
      body.castShadow = true; body.receiveShadow = true;
      body.rotation.z = index * Math.PI / 2;
      part.add(body); mark.add(part); quadrants.push(part);
    }
    root.add(mark);
    const identity = surface(typeTexture({ title: 'space', subtitle: 'IDENTITÀ CHE PRENDONO FORMA', height: 600, background: '#101412', ink: '#e8ff00' }), 2.8, 1.4, { edge: '#252a26', depth: .12, radius: .06 });
    identity.position.set(1.8, -1.65, .95); identity.rotation.set(-.12, -.25, .055); root.add(identity);
    const swatches = new THREE.Group();
    [paper, graphite, yellow].forEach((material, index) => {
      const sample = box(.62, .86, .055, material, .025);
      sample.position.set((index - 1) * .65, 0, 0);
      sample.rotation.z = (index - 1) * -.075;
      swatches.add(sample);
    });
    swatches.position.set(-1.45, -1.8, -.65); root.add(swatches);
    exhibits.push({ root, width: 6.8, height: 7.0, animate(time, intro, departure, mobile) {
      const phase = time % 11;
      const unfold = phase < 3.2 ? 0 : phase < 4.9 ? ease((phase - 3.2) / 1.7) : phase < 6.0 ? 1 : phase < 7.7 ? 1 - ease((phase - 6.0) / 1.7) : 0;
      const spread = Math.max(intro, unfold * .7, departure * .6);
      mark.rotation.set(.15 + Math.sin(time * .38) * .08, -.29 + Math.sin(time * .31) * .36, -.1 + Math.sin(time * .23) * .08);
      mark.position.y = .05 + Math.sin(time * .6) * .08;
      quadrants.forEach((part, index) => {
        const angle = index * Math.PI / 2 + Math.PI / 4;
        part.position.set(Math.cos(angle) * spread * .72, Math.sin(angle) * spread * .72, Math.sin(index * 1.8) * spread * .38);
        part.rotation.set(Math.sin(index * 1.5) * spread * .28, Math.cos(index * 1.3) * spread * .38, 0);
      });
      identity.visible = !mobile; swatches.visible = !mobile;
      identity.position.z = .95 + Math.sin(time * .5) * .08;
    } });
  }

  // A site becomes a dimensional system: desktop, mobile, navigation and a
  // content module retain their relationship while the layout assembles.
  {
    const root = new THREE.Group();
    const desktop = surface(browserTexture(architecture.image), 6.5, 4.13, { edge: '#494e48', depth: .14, radius: .13, metallic: true });
    const mobile = surface(browserTexture(architecture.image, true), 1.47, 2.77, { edge: '#a8ada5', depth: .105, radius: .12, metallic: true });
    const button = surface(typeTexture({ title: 'Esplora ↗', subtitle: 'DESIGN / BUILD / LAUNCH', background: '#e8ff00', ink: '#101412', height: 500 }), 2.3, .95, { edge: '#b4c81b', depth: .07, radius: .06 });
    root.add(desktop, mobile, button);
    exhibits.push({ root, width: 8.6, height: 5.5, animate(time, intro, departure) {
      const breath = (1 - Math.cos(time * .58)) * .5;
      desktop.position.set(-.3, .25, -.15 - departure * .4);
      desktop.rotation.set(.02 + Math.sin(time * .4) * .035, -.12 + Math.sin(time * .29) * .14, -.025);
      mobile.position.set(2.15 + intro * .7 + departure * .5, -.6, .85 + breath * .3 + intro * 1.1);
      mobile.rotation.set(.015, -.18 - breath * .15, .045 + intro * .15);
      button.position.set(-1.25, -1.65 - intro * .45, .7 + breath * .2);
      button.rotation.set(.02, -.08 + breath * .1, -.055);
    } });
  }

  // Original product geometry with a solid glass silhouette, separate liquid,
  // collar, cap, label and display base. No product photograph is the mesh.
  {
    const root = new THREE.Group();
    const bottle = new THREE.Group();
    const glass = physical({ color: '#fffaf0', roughness: .075, metalness: 0, transmission: .96, thickness: .5, ior: 1.46, clearcoat: 1, attenuationColor: '#fff0cd', attenuationDistance: 5 });
    const amber = physical({ color: '#d8a340', roughness: .16, metalness: 0, clearcoat: 1, clearcoatRoughness: .08 });
    const body = box(2.15, 2.85, 1.22, glass, .17); body.position.y = -.28; bottle.add(body);
    const liquid = box(1.79, 2.03, .87, amber, .12); liquid.position.y = -.52; bottle.add(liquid);
    const shoulder = mesh(new THREE.CylinderGeometry(.3, .36, .39, 40), glass); shoulder.position.y = 1.28; bottle.add(shoulder);
    const collar = mesh(new THREE.CylinderGeometry(.315, .315, .17, 40), chrome); collar.position.y = 1.43; bottle.add(collar);
    const pump = mesh(new THREE.CylinderGeometry(.19, .19, .22, 32), graphite); pump.position.y = 1.59; bottle.add(pump);
    const cap = box(1.05, .63, .96, graphite, .07); bottle.add(cap);
    const label = surface(canvasTexture(900, 650, (ctx, width, height) => {
      ctx.fillStyle = '#f4eedf'; ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#252820'; ctx.textAlign = 'center';
      ctx.font = '500 270px "Space Grotesk", sans-serif'; ctx.fillText('ORA', width / 2, 335);
      ctx.font = '29px "DM Mono", monospace'; ctx.fillText('EAU DE PARFUM', width / 2, 434);
      ctx.font = '22px "DM Mono", monospace'; ctx.fillText('50 ML — CONCEPT 01', width / 2, 548);
    }), 1.35, .98, { edge: '#f4eedf', depth: .012, radius: .012 });
    label.position.set(0, -.23, .645); bottle.add(label);
    const base = mesh(new THREE.CylinderGeometry(1.9, 1.94, .16, 80), graphite); base.position.y = -2.14; root.add(base);
    root.add(bottle);
    const barMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: '#f7f3df', toneMapped: false }));
    const bars = [-1, 1].map((side) => { const bar = box(.055, 3.3, .055, barMaterial, .015); bar.position.set(side * 2.13, .1, -1.1); root.add(bar); return bar; });
    exhibits.push({ root, width: 5.3, height: 5.8, animate(time, intro, departure, mobile) {
      const cycle = time % 9;
      const reveal = cycle < 1.4 ? ease(cycle / 1.4) : cycle < 3.9 ? 1 : cycle < 5.5 ? 1 - ease((cycle - 3.9) / 1.6) : 0;
      bottle.rotation.set(.025 + Math.sin(time * .45) * .025, -.24 + Math.sin(time * .38) * .29, -.025 + Math.sin(time * .21) * .035);
      bottle.position.y = -.25 + Math.sin(time * .55) * .045;
      cap.position.set(0, 1.88 + Math.max(reveal * .6, intro * .65, departure * .35), 0);
      cap.rotation.set(0, reveal * .14, 0);
      bars.forEach((bar, index) => { bar.position.z = -1.15 + Math.sin(time * .35 + index) * .2; bar.visible = !mobile; });
    } });
  }

  // Three physical ribbons carry a motion language from a single poster into
  // different formats. Their controlled choreography gives the campaign life.
  {
    const root = new THREE.Group();
    const poster = surface(typeTexture({ title: 'MAKE\nIT MOVE.', subtitle: 'SPACE / MOTION DESIGN', width: 1000, height: 1200 }), 3.05, 3.66, { edge: '#222820', depth: .12, radius: .045 });
    root.add(poster);
    const ribbons = [];
    const paths = [
      [[-2.8,-1.35,.2],[-2.35,.55,.35],[-.6,1.8,-.6],[1.8,1.35,-.75],[2.65,-.3,.65]],
      [[-2.5,.6,-.45],[-1.75,-1.6,.5],[.3,-1.85,.8],[2.45,-.8,-.3],[2.25,1.3,-.8]],
      [[-2.35,1.4,-.75],[-.2,2.12,.4],[2.15,.9,.8],[1.45,-1.45,.25],[-1,-1.95,-.7]],
    ];
    paths.forEach((points, index) => {
      const curve = new THREE.CatmullRomCurve3(points.map(point => new THREE.Vector3(...point)));
      const section = roundedShape(index === 2 ? .19 : .34, .065, .025);
      const ribbon = mesh(new THREE.ExtrudeGeometry(section, { steps: 76, bevelEnabled: false, extrudePath: curve, curveSegments: 4 }), index === 1 ? chrome : yellow);
      root.add(ribbon); ribbons.push(ribbon);
    });
    exhibits.push({ root, width: 7.0, height: 5.8, animate(time, intro, departure) {
      poster.position.set(0, 0, -.18);
      poster.rotation.set(Math.sin(time * .36) * .035, -.06 + Math.sin(time * .29) * .1, -.035);
      ribbons.forEach((ribbon, index) => {
        const direction = index === 1 ? -1 : 1;
        ribbon.rotation.set(Math.sin(time * .42 + index) * .075, Math.sin(time * .6 + index) * .3 + intro * direction * .45, Math.sin(time * .5 + index * 1.5) * .22 + departure * direction * .24);
        ribbon.position.set(0, Math.sin(time * .7 + index) * .1, Math.sin(time * .5 + index) * .15 + intro * (index - 1) * .6);
      });
    } });
  }
  return exhibits;
}
