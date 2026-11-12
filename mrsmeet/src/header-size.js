/** Publish the masthead's actual border-box height, including the safe area.
 * The sticky hero and menu consume this value; scrolling does not measure it. */
export function mountHeaderSize({root} = {}) {
  const doc = root?.ownerDocument, view = doc?.defaultView;
  if (!root || !view) return {dispose() {}};
  const style = doc.documentElement.style;
  const previous = {value:style.getPropertyValue('--header-height'),priority:style.getPropertyPriority('--header-height')};
  const life = new view.AbortController(), {signal} = life;
  let disposed = false, frame = null, written = '';
  function measure() {
    frame = null;
    if (disposed) return;
    const height = Math.ceil(root.getBoundingClientRect().height);
    if (height <= 0) return;
    const next = `${height}px`;
    if (next === written) return;
    written = next;
    style.setProperty('--header-height', next);
    view.dispatchEvent(new view.CustomEvent('smeet:header-resize', {detail:{height}}));
  }
  const schedule = () => {if (!disposed && frame == null) frame = view.requestAnimationFrame(measure);};
  const observer = typeof view.ResizeObserver === 'function' ? new view.ResizeObserver(schedule) : null;
  observer?.observe(root);
  view.addEventListener('resize', schedule, {passive:true,signal});
  view.addEventListener('pageshow', schedule, {signal});
  doc.fonts?.addEventListener?.('loadingdone', schedule, {signal});
  doc.fonts?.ready?.then(schedule, () => {});
  measure();
  return {dispose() {
    if (disposed) return;
    disposed = true; life.abort(); observer?.disconnect();
    if (frame != null) view.cancelAnimationFrame(frame);
    if (style.getPropertyValue('--header-height') === written) {
      if (previous.value) style.setProperty('--header-height', previous.value, previous.priority);
      else style.removeProperty('--header-height');
    }
  }};
}
