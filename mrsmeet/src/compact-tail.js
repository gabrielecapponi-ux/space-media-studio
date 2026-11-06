/** Keep the full board and story accessible from links as well as their summaries. */
const panels = [...document.querySelectorAll('details[data-tail-disclosure]')];
const phone = window.matchMedia('(max-width: 760px)');
const phoneState = new Map();

function reveal(hash) {
  const panel = panels.find(
    (element) => `#${element.dataset.tailDisclosure}` === hash,
  );
  if (panel) panel.open = true;
}

function setLayout() {
  for (const panel of panels) {
    panel.open = !phone.matches || Boolean(phoneState.get(panel));
  }
  reveal(location.hash);
}

for (const panel of panels) {
  panel.addEventListener('toggle', () => {
    if (phone.matches) phoneState.set(panel, panel.open);
  });
}

setLayout();
phone.addEventListener('change', setLayout);
window.addEventListener('hashchange', () => reveal(location.hash));
document.addEventListener('click', (event) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const link = event.target.closest?.('a[href^="#"]');
  if (link) reveal(link.hash);
});
