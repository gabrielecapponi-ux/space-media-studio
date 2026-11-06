const clamp = value => Math.min(1, Math.max(0, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
/** A complete pose from absolute scroll progress, never cumulative transforms. */
export function parmaPose(progress, settled = false) {
  const p = settled ? 1 : clamp(progress);
  return {
    progress: p,
    arrival: ease((p - .06) / .54),
    assembly: ease((p - .10) / .54),
    sauce: ease((p - .48) / .28),
    pool: ease((p - .66) / .24),
    focus: ease((p - .20) / .70),
    chapter: p < .32 ? 0 : p < .72 ? 1 : 2,
  };
}
