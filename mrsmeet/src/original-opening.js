import {mountLoader} from './opening-film.js';

/** The original dressing film starts on entry and remains explicitly replayable. */
export function mountOriginalOpening({reducedMotion, onComplete} = {}) {
  const doc = document;
  const view = doc.defaultView;
  const lifecycle = new view.AbortController();
  const control = doc.getElementById('replay-intro');
  let disposed = false, lastCycle = 0;
  // Subscribe before starting, including when cached assets and reduced motion
  // let the original loader complete without its normal film duration.
  const loader = mountLoader({reducedMotion, autoStart:false});
  doc.addEventListener('smeet:entered', ({detail}) => {
    if (disposed || detail?.owner !== loader.id || detail.cycle <= lastCycle) return;
    lastCycle = detail.cycle;
    onComplete?.(detail);
  }, {signal:lifecycle.signal});
  loader.start();
  return {
    replay() {
      if (disposed) return false;
      control?.focus({preventScroll:true});
      return loader.replay();
    },
    finish() {return !disposed && loader.finish({immediate:true, reason:'manual'});},
    dispose() {
      if (disposed) return;
      disposed = true;
      lifecycle.abort();
      loader.dispose();
    },
  };
}
