/** Readable HTML menu; optional filters and product-photo dialogs. */
export function mountSimpleMenu({root, onOpenProduct} = {}) {
  if (!root) return {dispose() {}};
  const buttons = [...root.querySelectorAll('[data-menu-filter]')];
  const groups = [...root.querySelectorAll('[data-menu-group]')];
  const status = root.querySelector('.simple-filter-status');
  const productLinks = [...root.querySelectorAll('[data-product-photo]')];
  const controller = new AbortController();
  let disposed = false;
  const render = (category, announce = true) => {
    root.dataset.menuView = category;
    let count = 0;
    groups.forEach(group => {
      const show = category === 'all' || group.dataset.menuGroup === category;
      group.hidden = !show;
      if (show) count += group.querySelectorAll('[data-menu-product]').length;
    });
    buttons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.menuFilter === category)));
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
