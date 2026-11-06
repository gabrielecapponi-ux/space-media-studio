import {mountLoader} from './loader.js';

/** Lifecycle adapter for the original film. Events arrive after exit cleanup. */
export function mountOriginalOpening({reducedMotion, onComplete} = {}) {
  const doc = document;
  const Controller = doc.defaultView?.AbortController || AbortController;
  const lifecycle = new Controller();
  let disposed = false, lastCycle = 0;
  const loader = mountLoader({reducedMotion,autoStart:false});
  doc.addEventListener('smeet:entered',event => {
    const detail = event.detail;
    if (disposed || detail?.owner !== loader.id || detail.cycle <= lastCycle) return;
    lastCycle = detail.cycle;
    onComplete?.(detail);
  },{signal:lifecycle.signal});
  const directRoute = doc.getElementById(doc.location.hash.slice(1));
  const phone = doc.defaultView.matchMedia('(max-width: 760px)').matches;
  if (directRoute || phone) {
    // Phones open with today's hours and the menu. The film is available via replay.
    doc.body.classList.add('smeet-has-entered');
    onComplete?.({reason:directRoute ? 'direct-route' : 'mobile-menu'});
  } else {
    loader.start();
  }
  return {
    replay:() => !disposed && loader.replay(),
    finish:() => !disposed && loader.finish({immediate:true,reason:'manual'}),
    dispose() {
      if (disposed) return;
      disposed = true; lifecycle.abort(); loader.dispose();
    },
  };
}
