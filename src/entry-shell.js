import './entry.css';

/**
 * Presentation only. The entry controller owns asset loading, camera timing,
 * background inertness, focus restoration and removal of the overlay.
 * Progress is expressed as a percentage in the inclusive range 0–100.
 */
export function createEntryShell() {
  const root = document.createElement('section');
  root.id = 'studio-entry';
  root.className = 'studio-entry';
  root.dataset.state = 'loading';
  root.dataset.stage = '0';
  root.setAttribute('role', 'dialog');
  root.setAttribute('aria-modal', 'true');
  root.setAttribute('aria-labelledby', 'studio-entry-title');
  root.innerHTML = `
    <div class="entry-scene" data-scene="loading" aria-hidden="true"></div>
    <div class="entry-fallback" aria-hidden="true">
      <div class="entry-fallback-room">
        <div class="entry-room-back"></div>
        <div class="entry-room-left"></div>
        <div class="entry-room-right"></div>
        <div class="entry-room-floor"></div>
        <div class="entry-room-light"></div>
        <div class="entry-room-panel"></div>
        <div class="entry-room-wordmark">SPACE<span>MEDIA STUDIO</span></div>
        <div class="entry-room-desk entry-room-desk-secondary">
          <div class="entry-room-monitor"><i></i><span></span></div>
          <div class="entry-room-desk-top"></div><div class="entry-room-desk-leg"></div>
        </div>
        <div class="entry-room-desk entry-room-desk-primary">
          <div class="entry-room-monitor"><i></i><span>SPACE</span></div>
          <div class="entry-room-desk-top"></div><div class="entry-room-desk-leg"></div>
        </div>
        <div class="entry-room-floor-light"></div>
      </div>
    </div>
    <div class="entry-vignette" aria-hidden="true"></div>
    <header class="entry-header entry-chrome">
      <h2 class="entry-brand" id="studio-entry-title">
        <svg class="entry-brand-symbol" viewBox="0 0 48 48" aria-hidden="true"><path d="M24 2 30 18 46 24 30 30 24 46 18 30 2 24 18 18Z" fill="currentColor"/><circle cx="24" cy="24" r="5.5" fill="#090b10"/></svg>
        <span>SPACE<small>MEDIA STUDIO</small></span>
      </h2>
      <span class="entry-location">PARMA, ITALIA</span>
    </header>
    <footer class="entry-footer entry-chrome">
      <div class="entry-loading" role="progressbar" aria-label="Caricamento del sito" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
        <div class="entry-number" aria-hidden="true"><span class="entry-number-value">0</span><span class="entry-number-unit">%</span></div>
        <div class="entry-progress-copy"><span class="entry-caption">Il tuo prossimo inizio.</span><span class="entry-phase">Prepariamo lo spazio</span></div>
      </div>
      <button class="entry-skip" type="button"><span>Entra subito</span><svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="M4 10h11m-4-4 4 4-4 4" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
      <div class="entry-progress-track" aria-hidden="true"><span></span></div>
    </footer>
    <p class="entry-status" role="status" aria-live="polite" aria-atomic="true">Prepariamo lo spazio</p>
  `;

  const sceneHost = root.querySelector('.entry-scene');
  const progress = root.querySelector('.entry-loading');
  const number = root.querySelector('.entry-number-value');
  const phase = root.querySelector('.entry-phase');
  const skip = root.querySelector('.entry-skip');
  const status = root.querySelector('.entry-status');
  const fill = root.querySelector('.entry-progress-track > span');
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let disposed = false;
  let announced = phase.textContent;

  function syncPreference() {
    root.classList.toggle('is-reduced', preference.matches);
  }
  syncPreference();
  preference.addEventListener('change', syncPreference);
  document.body.append(root);

  function update(value, label) {
    if (disposed) return;
    const numeric = Number(value);
    const percent = Math.max(0, Math.min(100, Number.isFinite(numeric) ? numeric : 0));
    const rounded = Math.floor(percent);
    number.textContent = String(rounded);
    progress.setAttribute('aria-valuenow', String(rounded));
    progress.setAttribute('aria-valuetext', `${rounded} percento`);
    fill.style.transform = `scaleX(${percent / 100})`;
    // Five coherent construction milestones; no independent animation clock.
    root.dataset.stage = String(percent >= 94 ? 5 : percent >= 75 ? 4 : percent >= 52 ? 3 : percent >= 28 ? 2 : percent >= 8 ? 1 : 0);
    root.dataset.progress = String(rounded);
    if (typeof label === 'string' && label.trim()) {
      phase.textContent = label;
      if (label !== announced) {
        status.textContent = label;
        announced = label;
      }
    }
  }

  function setState(state) {
    if (disposed) return;
    root.dataset.state = state;
    root.classList.toggle('is-zooming', state === 'zoom');
    root.classList.toggle('is-exiting', state === 'exiting' || state === 'done' || state === 'complete');
    if (state === 'done' || state === 'complete') root.setAttribute('aria-hidden', 'true');
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    preference.removeEventListener('change', syncPreference);
    root.remove();
  }

  return { root, sceneHost, progress, phase, skip, status, update, setState, dispose };
}
