// A congested Wi-Fi connection can still be reported as "4g". The studio
// model is large enough to measure the current navigation's actual transfer.
let studioMbps;
export function limitedFilmBandwidth(minimumMbps = 6) {
  const connection = navigator.connection;
  if (connection?.saveData || ['slow-2g', '2g', '3g'].includes(connection?.effectiveType)) return true;
  if (studioMbps === undefined) {
    const sample = window.performance?.getEntriesByType('resource').find(entry =>
      entry.name.endsWith('/models/studio-space-20261105.glb') &&
      entry.transferSize > 1000 && entry.encodedBodySize >= 300000 && entry.responseEnd >= entry.responseStart);
    if (sample) studioMbps = sample.encodedBodySize * .008 / Math.max(1, sample.responseEnd - sample.responseStart);
  }
  const mbps = studioMbps ?? connection?.downlink;
  return mbps > 0 && mbps < minimumMbps;
}

export function chooseFilmSource(video, portrait) {
  if (portrait) return video.dataset.srcMobile;
  if (video.dataset.srcCompact && limitedFilmBandwidth()) return video.dataset.srcCompact;
  if (video.dataset.srcHd && limitedFilmBandwidth(12)) return video.dataset.srcHd;
  return video.dataset.srcDesktop;
}
