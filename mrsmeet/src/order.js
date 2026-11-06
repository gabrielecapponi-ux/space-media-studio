import products from '../data/menu.json';
import {mountOpeningHours} from './opening-hours.js';
import './cart-feedback.css';
import presentation from '../data/menu-presentation.json';
import {mountOriginalOpening} from './original-opening.js';
import {mountServiceMotion} from './service-motion.js';
import {mountCart, GLOVO_URL, PICKUP_PHONE} from './cart.js';

const launchers = [...document.querySelectorAll('[data-cart-open]')];
const feedback = document.querySelector('[data-order-feedback]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let cart, serviceMotion;
const openingHours = mountOpeningHours();
const intro = mountOriginalOpening({reducedMotion,onComplete:() => {serviceMotion ||= mountServiceMotion({root:document,reducedMotion});}});

try {
  cart = mountCart({
    products, presentation,
    channels: {
      glovo: {verified:true, url:GLOVO_URL},
      pickup: {verified:true, phone:PICKUP_PHONE},
      whatsapp: null,
    },
    reducedMotion,
    menuHref: document.querySelector('[data-order-feedback] a')?.getAttribute('href') || './index.html#menu',
  });
  launchers.forEach(button => {button.disabled = false;});
} catch {
  if (feedback) feedback.hidden = false;
}

window.addEventListener('pagehide', event => {
  if (!event.persisted) {intro.dispose(); serviceMotion?.dispose(); cart?.dispose(); openingHours.dispose();}
});
