/** Finite mobile entrances. HTML is visible before JS and no scrolling is intercepted. */
export function mountMobileFinish({reducedMotion} = {}) {
  const mobile = matchMedia('(max-width:760px)');
  const lifecycle = new AbortController();
  const {signal} = lifecycle;
  const seen = new WeakSet(), visible = new Set(), animations = new Map();
  const nav = document.querySelector('.mobile-quick-nav');
  const links = [...(nav?.querySelectorAll('a[href^="#"]') || [])];
  const sections = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  let paused = true, disposed = false;
  const stopped = () => disposed || paused || !mobile.matches || reducedMotion?.matches || document.hidden || navigator.connection?.saveData;
  function cancel() { for (const animation of animations.values()) animation.cancel(); animations.clear(); }
  function animate(element,frames,duration) {
    if (!element?.animate || stopped()) return;
    animations.get(element)?.cancel();
    const animation = element.animate(frames,{duration,easing:'cubic-bezier(.22,1,.36,1)'});
    animations.set(element,animation);
    animation.finished.then(() => {if (animations.get(element) === animation) animations.delete(element);},() => {});
  }
  function enter(element) {
    if (seen.has(element) || stopped()) return;
    seen.add(element);
    animate(element,[{transform:'translateY(14px)',opacity:.8},{transform:'none',opacity:1}],440);
  }
  const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) {visible.add(entry.target);enter(entry.target);}
      else {visible.delete(entry.target);animations.get(entry.target)?.cancel();animations.delete(entry.target);}
    }
  },{threshold:.12}) : null;
  document.querySelectorAll('.brand-story-heading,.truck-copy').forEach(element => observer?.observe(element));
  const sectionState = new Map();
  const navObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    for (const entry of entries) sectionState.set(entry.target,entry.isIntersecting);
    const active = sections.find(section => sectionState.get(section));
    for (const link of links) {
      if (active && link.hash === `#${active.id}`) link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
  },{rootMargin:'-20% 0px -35% 0px'}) : null;
  sections.forEach(section => navObserver?.observe(section));
  function sync() {
    if (stopped()) cancel();
    else visible.forEach(enter);
  }
  mobile.addEventListener('change',sync,{signal});
  reducedMotion?.addEventListener('change',sync,{signal});
  navigator.connection?.addEventListener('change',sync,{signal});
  document.addEventListener('visibilitychange',sync,{signal});
  return {
    setPaused(value) {paused = Boolean(value);sync();},
    dispose() {disposed = true;lifecycle.abort();observer?.disconnect();navObserver?.disconnect();cancel();visible.clear();links.forEach(link => link.removeAttribute('aria-current'));},
  };
}
