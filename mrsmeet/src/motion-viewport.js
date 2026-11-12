/** The area a customer can actually read between the persistent header and dock. */
export function motionViewport(doc, view = doc?.defaultView) {
  const height = view?.innerHeight || doc?.documentElement?.clientHeight || 0;
  let top = 0, bottom = height;
  const header = doc?.querySelector('.route-header');
  const headerBox = header?.getBoundingClientRect();
  if (headerBox?.width > 0 && headerBox.height > 0 && headerBox.top <= 1 && headerBox.bottom > 0) {
    top = Math.min(height, headerBox.bottom);
  }
  const dock = doc?.querySelector('.mobile-quick-nav');
  const dockBox = dock?.getBoundingClientRect();
  if (dockBox?.width > 0 && dockBox.height > 0 && dockBox.bottom > 0 && dockBox.top < height
    && view?.getComputedStyle?.(dock).position === 'fixed') bottom = Math.max(top, dockBox.top);
  return {top, bottom, height: Math.max(0, bottom - top), center: (top + bottom) / 2};
}

export function motionExposure(box, area) {
  if (!box || box.width <= 0 || box.height <= 0 || area.height <= 0) return 0;
  const exposed = Math.max(0, Math.min(box.bottom, area.bottom) - Math.max(box.top, area.top));
  return exposed / Math.min(box.height, area.height);
}
