// Ordinary opening hours published by Mr Smeet; this is not a live store feed.
export const HOURS_SOURCE = 'https://mrsmeet.it/wp-content/uploads/2025/11/orari-mrsmeet.jpg';
export const OPENING_HOURS = Object.freeze({
  Mon:[], Tue:[[720,870],[1140,1350]], Wed:[[720,870],[1140,1350]],
  Thu:[[720,870],[1140,1350]], Fri:[[720,870],[1140,1410]],
  Sat:[[720,870],[1140,1410]], Sun:[[1140,1380]],
});
const weekdays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const italian = ['lunedì','martedì','mercoledì','giovedì','venerdì','sabato','domenica'];
const clock = minutes => `${String(Math.floor(minutes / 60)).padStart(2,'0')}:${String(minutes % 60).padStart(2,'0')}`;
const localTime = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
export function openingStatus(date = new Date()) {
  const parts = Object.fromEntries(localTime.formatToParts(date).map(part => [part.type,part.value]));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute), index = weekdays.indexOf(parts.weekday);
  const today = OPENING_HOURS[parts.weekday] || [];
  const hoursToday = today.map(([start,end]) => `${clock(start)}–${clock(end)}`).join(' · ');
  for (const [start,end] of today) if (minutes >= start && minutes < end) return {hoursToday,open:true,label:'Aperto ora',detail:`Fino alle ${clock(end)}`};
  const next = today.find(([start]) => start > minutes);
  if (next) return {hoursToday,open:false,label:'Ci vediamo oggi',detail:`Dalle ${clock(next[0])}`};
  for (let offset=1;offset<=7;offset++) {
    const day = (index + offset) % 7, slots = OPENING_HOURS[weekdays[day]];
    if (slots.length) return {hoursToday,open:false,label:'Ci vediamo presto',detail:`${offset===1?'Domani':italian[day]} ${clock(slots[0][0])}`};
  }
  return {hoursToday,open:false,label:'I nostri orari',detail:'Scopri le aperture'};
}
// The header reserves its expanded height. As its top passes the viewport,
// the glass and wordmark fit the remaining visible area without moving content.
function mountScrollLogo(doc) {
  const header = doc.querySelector('.route-header');
  if (!header || header.hasAttribute('data-persistent-header')) return () => {};
  const view = doc.defaultView;
  let raf = 0, previous = -1, cutoff = 0, pinned = false;
  header.setAttribute('data-scroll-logo', '');
  function paint() {
    raf = 0;
    const rect = header.getBoundingClientRect();
    const height = Math.round(rect.height + Math.min(0, rect.top));
    if (height !== previous) {
      header.style.setProperty('--route-glass-height', `${height}px`);
      previous = height;
    }
    header.toggleAttribute('data-pinned', rect.top <= 0);
    cutoff = rect.height * 3;
    pinned = view.scrollY > cutoff;
  }
  function schedule() {
    // After the masthead is pinned, ordinary page scrolling changes nothing.
    if (pinned && view.scrollY > cutoff) return;
    if (!raf) raf = view.requestAnimationFrame(paint);
  }
  function resize() { pinned = false; schedule(); }
  paint();
  view.addEventListener('scroll', schedule, {passive:true});
  view.addEventListener('resize', resize, {passive:true});
  view.addEventListener('pageshow', resize);
  return () => {
    view.removeEventListener('scroll', schedule);
    view.removeEventListener('resize', resize);
    view.removeEventListener('pageshow', resize);
    view.cancelAnimationFrame(raf);
  };
}

export function mountOpeningHours({doc=document}={}) {
  const nodes = [...doc.querySelectorAll('[data-opening-status]')], view = doc.defaultView;
  if (!nodes.length) return {dispose(){}};
  const disposeLogo = mountScrollLogo(doc);
  const update = () => {
    const state = openingStatus();
    for (const node of nodes) {
      node.dataset.open = String(state.open);
      const label = state.open ? 'Aperto ora' : (state.hoursToday ? 'Chiuso ora' : 'Oggi chiuso');
      const hours = state.hoursToday ? `Oggi ${state.hoursToday}` : state.detail;
      node.querySelector('[data-opening-label]').textContent = label;
      node.querySelector('[data-opening-detail]').textContent = hours;
      node.setAttribute('aria-label',`${label}. ${hours}. ${state.hoursToday ? state.detail+'. ' : ''}Vedi tutti gli orari ordinari.`);
    }
  };
  update();
  const timer=view.setInterval(()=>{if(!doc.hidden)update();},60000);
  doc.addEventListener('visibilitychange',update);
  view.addEventListener('pageshow',update);
  return {dispose(){disposeLogo();view.clearInterval(timer);doc.removeEventListener('visibilitychange',update);view.removeEventListener('pageshow',update);}};
}
