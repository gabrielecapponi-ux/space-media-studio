import * as THREE from 'three';

export const SOFT_PART_COUNT = 8;
export const SOFT_CYCLE_SECONDS = 18;
const clamp = (value) => Math.max(0, Math.min(1, value));
const smooth = (value) => { const t = clamp(value); return t * t * t * (t * (t * 6 - 15) + 10); };
const signedPower = (value, power) => Math.sign(value) * Math.abs(value) ** power;

/**
 * Original convex superellipsoid: a full, inflated cushion with no holes.
 * The analytic normal avoids lighting seams at the duplicated UV vertices.
 * All dimensions and silhouettes are authored here; no external model is used.
 */
export function createSoftBlockGeometry({ exponent = 0.64, segments = 48, rings = 32 } = {}) {
  const geometry = new THREE.SphereGeometry(0.5, segments, rings);
  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;
  const surfacePower = 2 / exponent;
  const direction = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    const x = signedPower(position.getX(index) * 2, exponent);
    const y = signedPower(position.getY(index) * 2, exponent);
    const z = signedPower(position.getZ(index) * 2, exponent);
    position.setXYZ(index, x * 0.5, y * 0.5, z * 0.5);
    direction.set(signedPower(x, surfacePower - 1), signedPower(y, surfacePower - 1), signedPower(z, surfacePower - 1)).normalize();
    normal.setXYZ(index, direction.x, direction.y, direction.z);
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

const pose = (position, rotation, scale) => ({
  position: new THREE.Vector3(...position),
  quaternion: new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)),
  scale: new THREE.Vector3(...scale),
});

export function createSoftPartPoses(index) {
  const x = index & 1 ? 1 : -1;
  const y = index & 2 ? 1 : -1;
  const z = index & 4 ? 1 : -1;
  // Keep upper/lower pairs in their own half while the depth pairs become rows.
  const row = (index & 2 ? 2 : 0) + (index & 4 ? 1 : 0);
  const offset = row % 2 ? 1 : -1;
  return {
    // Small real gaps retain the individual, inflated modules in the assembled form.
    cushion: pose([x * 0.64, y * 0.64, z * 0.64], [0, 0, 0], [1.23, 1.23, 1.23]),
    spread: pose([x * (1.37 + (z > 0 ? 0.08 : 0)), y * 1.32, z * 0.84],
      [y * 0.21, x * 0.3, x * y * 0.13], [1.02, 1.02, 1.02]),
    // Four generous pairs become a softly stepped architectural totem.
    stack: pose([x * 0.59 + offset * 0.13, -1.20 + row * 0.8, offset * 0.12],
      [0, offset * 0.12, 0], [1.1, 0.73, 1.25]),
    // The same eight volumes converge inside the finished bottle before fading.
    product: pose([x * 0.38, y * 0.4625 - 0.2, z * 0.205], [0, 0, 0], [0.74, 0.905, 0.39]),
  };
}

export function softChoreography(time) {
  // First visit opens on a recognisable solid sculpture, then shows the assembly.
  const phase = ((time + 0.55) % SOFT_CYCLE_SECONDS + SOFT_CYCLE_SECONDS) % SOFT_CYCLE_SECONDS;
  const hold = (form) => ({ from: form, to: form, progress: 0, product: form === 'product' ? 1 : 0 });
  const transition = (from, to, progress) => ({ from, to, progress,
    product: to === 'product' ? smooth(progress) : from === 'product' ? 1 - smooth(progress) : 0,
  });
  if (phase < 2.6) return hold('cushion');
  if (phase < 4.05) return transition('cushion', 'spread', (phase - 2.6) / 1.45);
  if (phase < 6.1) return transition('spread', 'stack', (phase - 4.05) / 2.05);
  if (phase < 8.1) return hold('stack');
  if (phase < 9.5) return transition('stack', 'spread', (phase - 8.1) / 1.4);
  if (phase < 11.65) return transition('spread', 'product', (phase - 9.5) / 2.15);
  if (phase < 14.05) return hold('product');
  if (phase < 15.6) return transition('product', 'spread', (phase - 14.05) / 1.55);
  return transition('spread', 'cushion', (phase - 15.6) / 2.4);
}

export function softFormAmount(state, form) {
  if (state.from === form && state.to === form) return 1;
  if (state.to === form) return smooth(state.progress);
  if (state.from === form) return 1 - smooth(state.progress);
  return 0;
}
