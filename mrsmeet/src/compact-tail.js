/** Keep the story accessible from links; the price board is always visible. */
// Accept the earlier HTML as well, without allowing mobile layout to fold the
// main price board away. Newly generated pages contain the panel directly.
for (const board of document.querySelectorAll('details[data-tail-disclosure="menu-board"]')) {
  board.open = true;
  board.querySelector(':scope > summary')?.remove();
}
const panels = [...document.querySelectorAll('details[data-tail-disclosure]:not([data-tail-disclosure="menu-board"])')];
const phone = window.matchMedia('(max-width: 760px)');
const phoneState = new Map();

// Native lazy-loading on a slow network can fetch the whole street photo
// several screens early. Keep a small real preview until the section is near.
const previews = document.querySelectorAll('picture[data-section-photo] > source');
if ('IntersectionObserver' in window) {
  const nearby = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.querySelector('picture[data-section-photo] > source')?.remove();
      nearby.unobserve(entry.target);
    }
  }, {rootMargin: '240px 0px'});
  previews.forEach(source => nearby.observe(source.closest('picture').parentElement));
} else {
  previews.forEach(source => source.remove());
}

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
