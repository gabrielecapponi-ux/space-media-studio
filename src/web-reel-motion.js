/** Native 60 fps reel; quintic easing keeps velocity and acceleration continuous. */
export const WEB_REEL = Object.freeze({ fps: 60, scenes: ['shift', 'vela', 'nude', 'basilico', 'oltre'], sceneFrames: 120, transitionFrames: 36, frames: 600 });
export function webReelFrame(frame) {
  const f = ((Math.floor(Number.isFinite(frame) ? frame : 0) % WEB_REEL.frames) + WEB_REEL.frames) % WEB_REEL.frames;
  const index = Math.floor(f / WEB_REEL.sceneFrames);
  const local = f % WEB_REEL.sceneFrames;
  const p = Math.max(0, (local - (WEB_REEL.sceneFrames - WEB_REEL.transitionFrames)) / WEB_REEL.transitionFrames);
  const ease = p * p * p * (p * (p * 6 - 15) + 10);
  const next = (index + 1) % WEB_REEL.scenes.length;
  return { frame: f, index, next, local, ease, primary: ease >= .5 ? next : index };
}
