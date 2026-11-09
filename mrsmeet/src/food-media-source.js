// Choose a delivery size before loading a clip; never switch an active stream.
const deliveries = new WeakMap();
const FAST_MBPS = 4;
const SAMPLE_LIFETIME_MS = 30000;

export function selectFoodVideo(entry, view, cssWidth = 0) {
  const fallback = entry?.video;
  if (!fallback || !entry.videoRetina || !view) return fallback;
  if (!(cssWidth * (view.devicePixelRatio || 1) > 720)) return fallback;
  const connection = view.navigator?.connection || view.navigator?.mozConnection || view.navigator?.webkitConnection;
  if (connection?.saveData || /^(slow-2g|2g|3g)$/.test(connection?.effectiveType || '')) return fallback;
  const declared = Number(connection?.downlink);
  const sample = deliveries.get(view);
  const now = view.performance?.now?.() ?? Date.now();
  const measured = sample && now - sample.at < SAMPLE_LIFETIME_MS ? sample.mbps : 0;
  const known = declared > 0 && Number.isFinite(declared) ? declared : 0;
  const speed = known && measured ? Math.min(known, measured) : known || measured;
  return speed >= FAST_MBPS ? entry.videoRetina : fallback;
}

export function recordFoodTransfer(video, view, startedAt) {
  const source = video?.currentSrc || video?.src;
  if (!source || !view?.performance?.getEntriesByName || !Number.isFinite(startedAt)) return;
  const entries = view.performance.getEntriesByName(source);
  const resource = entries.filter(item => item.startTime >= startedAt - 10 && item.responseEnd > item.startTime).at(-1);
  // Cached/304 responses and unavailable Safari timing must not masquerade
  // as a fast mobile connection. Unknown bandwidth keeps the 720px version.
  if (!resource || resource.encodedBodySize < 16384 || resource.transferSize < resource.encodedBodySize) return;
  const mbps = resource.encodedBodySize * 8 / ((resource.responseEnd - resource.startTime) * 1000);
  if (Number.isFinite(mbps) && mbps > 0) {
    deliveries.set(view, {mbps,at:view.performance.now()});
  }
}
