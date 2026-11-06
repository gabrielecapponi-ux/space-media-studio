import './parma-map.css';
let experience = null, controller = null, revision = 0;
function close(button) {
  revision++;
  controller?.abort(); experience?.dispose(); experience = null;
  button.setAttribute('aria-expanded','false');
  button.textContent = 'ESPLORA LA MAPPA ANIMATA ↗';
  document.querySelector('#optional-map-content').replaceChildren();
  document.querySelector('[data-map-status]').textContent = '';
}
export async function toggleOptionalMap(button) {
  if (button.getAttribute('aria-expanded') === 'true') {close(button); return;}
  const request = ++revision;
  controller = new AbortController();
  const signal = controller.signal;
  button.setAttribute('aria-expanded','true');
  button.textContent = 'CHIUDI LA MAPPA ×';
  const host = document.querySelector('#optional-map-content');
  const status = document.querySelector('[data-map-status]');
  host.append(document.querySelector('#optional-map-template').content.cloneNode(true));
  status.textContent = 'Apertura della mappa. Le indicazioni stradali sono già disponibili qui sotto.';
  try {
    const {mountParmaMap} = await import('./parma-map.js');
    if (signal.aborted) return;
    const next = await mountParmaMap({root:host.querySelector('.parma-journey'),signal});
    if (signal.aborted || revision !== request) {next.dispose();return;}
    experience = next;
    status.textContent = !next.ready
      ? 'Resta disponibile la mappa illustrata. Usa “Portami da Mr Smeet” per le indicazioni.'
      : next.markerReady
        ? 'Scorri per esplorare Parma oppure chiudi per tornare al sito.'
        : 'Mappa aperta con un segnaposto semplice. Scorri per esplorare Parma oppure usa le indicazioni qui sotto.';
  } catch {
    if (!signal.aborted) status.textContent = 'Resta disponibile la mappa illustrata. Usa “Portami da Mr Smeet” per le indicazioni.';
  }
}
window.addEventListener('pagehide',event=>{if(!event.persisted){controller?.abort();experience?.dispose();}});
