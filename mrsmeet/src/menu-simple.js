/** Readable HTML menu; optional filters and product-photo dialogs. */
export function mountSimpleMenu({root, onOpenProduct} = {}) {
  if (!root) return {dispose() {}};
  const buttons = [...root.querySelectorAll('[data-menu-filter]')];
  const groups = [...root.querySelectorAll('[data-menu-group]')];
  const status = root.querySelector('.simple-filter-status');
  const tools = root.querySelector('.catalog-tools');
  const grid = root.querySelector('#simple-menu-groups');
  const view = root.ownerDocument.defaultView;
  const desktop = view.matchMedia?.('(min-width: 761px)');
  const productCounts = new Map(groups.map(group => [group.dataset.menuGroup, group.querySelectorAll('[data-menu-product]').length]));
  const productLinks = [...root.querySelectorAll('[data-product-photo]')];
  const controller = new AbortController();
  let disposed = false;
  const render = (category, announce = true) => {
    if (category === root.dataset.menuView || (category !== 'all' && !productCounts.has(category))) return;
    // A pinned filter may be activated far down a long list. Start the new
    // category at its first dish. When the first row is in view, keep it still.
    const previousFirst = announce && desktop?.matches && tools
      ? root.querySelector('.simple-menu-group:not([hidden]) .product-card') : null;
    const barBottom = previousFirst && tools?.getBoundingClientRect().bottom;
    const firstPassed = previousFirst && tools && previousFirst.getBoundingClientRect().bottom < barBottom;
    root.dataset.menuView = category;
    let count = 0;
    groups.forEach(group => {
      const show = category === 'all' || group.dataset.menuGroup === category;
      if (group.hidden === show) group.hidden = !show;
      if (show) count += productCounts.get(group.dataset.menuGroup);
    });
    buttons.forEach(button => {
      const pressed = String(button.dataset.menuFilter === category);
      if (button.getAttribute('aria-pressed') !== pressed) button.setAttribute('aria-pressed',pressed);
    });
    if (firstPassed && grid) {
      // Shrinking the list can temporarily push the sticky bar above the
      // viewport. Its position before the change is the visible anchor.
      const delta = grid.getBoundingClientRect().top - barBottom;
      if (delta < -1) view.scrollBy({top:delta,behavior:'instant'});
    }
    if (status && announce) {
      const label = buttons.find(button => button.dataset.menuFilter === category)?.childNodes[0]?.textContent.trim() || 'Menu';
      status.textContent = `${label}: ${count} ${count === 1 ? 'prodotto visibile' : 'prodotti visibili'}.`;
    }
  };
  buttons.forEach(button => {button.disabled = false;});
  const nativeDialog = typeof HTMLDialogElement !== 'undefined' && typeof HTMLDialogElement.prototype.showModal === 'function';
  if (nativeDialog && typeof onOpenProduct === 'function') productLinks.forEach(link => link.setAttribute('aria-haspopup','dialog'));
  root.addEventListener('click', event => {
    if (disposed || event.defaultPrevented) return;
    const filter = event.target.closest('[data-menu-filter]');
    if (filter && root.contains(filter)) {
      render(filter.dataset.menuFilter);
      return;
    }
    const photo = event.target.closest('[data-product-photo]');
    if (!photo || !root.contains(photo) || typeof onOpenProduct !== 'function') return;
    // Keep ordinary link navigation for modified clicks.
    if (event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const opened = onOpenProduct(photo.dataset.productPhoto, photo);
    if (opened !== false) event.preventDefault();
  }, {signal:controller.signal});
  const firstCategory = groups[0]?.dataset.menuGroup;
  render(firstCategory || 'all',false);
  return {dispose() {
    if (disposed) return;
    disposed = true;
    delete root.dataset.menuView;
    controller.abort();
    groups.forEach(group => {group.hidden = false;});
    buttons.forEach(button => {button.disabled = true;button.setAttribute('aria-pressed',String(button.dataset.menuFilter === 'all'));});
    productLinks.forEach(link => link.removeAttribute('aria-haspopup'));
    if (status) status.textContent = '';
  }};
}
