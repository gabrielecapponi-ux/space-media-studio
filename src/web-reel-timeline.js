/** Shared absolute timeline for the native showreel render and its HTML chapter labels. */
export const WEB_REEL = Object.freeze({ fps: 30, scenes: ['shift', 'vela', 'nude', 'basilico', 'oltre'], sceneFrames: 60, transitionFrames: 12, frames: 300 });
export function webReelFrame(frame) {
  const f = ((Math.floor(Number.isFinite(frame) ? frame : 0) % WEB_REEL.frames) + WEB_REEL.frames) % WEB_REEL.frames;
  const index = Math.floor(f / WEB_REEL.sceneFrames);
  const local = f % WEB_REEL.sceneFrames;
  const progress = Math.max(0, (local - (WEB_REEL.sceneFrames - WEB_REEL.transitionFrames)) / WEB_REEL.transitionFrames);
  const ease = 1 - (1 - progress) ** 3;
  const next = (index + 1) % WEB_REEL.scenes.length;
  return { frame: f, index, next, local, ease, primary: ease >= .5 ? next : index };
}
