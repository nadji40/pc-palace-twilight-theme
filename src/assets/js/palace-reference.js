/*
 * PC Palace storefront behaviour, rebuilt for Salla from the saved reference
 * (../pcpalace-theme). The markup rendered here matches the reference DOM so the
 * reference stylesheet (pcpalace-reference.css) applies unchanged.
 */
import Swiper from 'swiper';
import {Autoplay, FreeMode, Navigation, Pagination, Thumbs} from 'swiper/modules';

const html = document.documentElement;
const isRtl = () => html.dir === 'rtl' || document.body.classList.contains('rtl');
const lang = () => (html.lang || 'ar').slice(0, 2);
// UI text comes from the theme locales (window.palace.i18n, written by layouts/master.twig with
// trans()) or from Salla's own strings; no text is hard-coded here.
const t = key => {
  const own = window.palace?.i18n?.[key];
  if (own) return own;
  const value = window.salla?.lang?.get?.(key);
  return value && value !== key ? value : '';
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const loader = () => window.palace?.loader || '';
const sallaReady = () => (window.salla?.onReady ? window.salla.onReady() : Promise.resolve());

const labels = () => ({
  addToCart: t('palace.add_to_cart'),
  multiple: t('palace.multiple_options'),
  outOfStock: t('palace.out_of_stock'),
  notifyMe: t('palace.notify_me'),
  quickView: t('palace.quick_view'),
  addToFav: t('palace.add_to_wishlist'),
  day: t('palace.day'),
  hour: t('palace.hour'),
  mins: t('palace.minutes'),
  secs: t('palace.seconds'),
});

/* ------------------------------------------------------------------ icons */
const ICONS = {
  eye: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="23px" height="19.5px" viewBox="0 0 23 19.5" xml:space="preserve" style="fill: var(--main-color);"><defs></defs><g><g><path d="M11.9,2.4c4.3,0,7.3,2.2,9.6,5.7c0.2,0.4,0.5,0.8,0.7,1.2c0.3,0.6,0.3,1.2,0,1.8c-2,4.1-5.7,7.1-10.7,6.9 c-4.1-0.2-7-2.3-9.2-5.6c-1-1.5-1.1-2.9,0-4.4c1.9-2.8,4.3-4.9,7.8-5.6C10.7,2.4,11.3,2.4,11.9,2.4z M11.8,4.3 c-0.6,0-1.2,0-1.8,0.1C7.3,5,5.5,6.7,4,8.9c-0.7,1-0.6,1.7,0,2.7c2,3.3,5.5,5.1,9.2,4.6c3.4-0.5,5.6-2.6,7.2-5.6 c0.1-0.2,0.1-0.4,0-0.7C18.8,6.9,15.9,4.1,11.8,4.3z"></path><path d="M16.3,10.3c0,2.4-1.9,4.4-4.3,4.4c-2.5,0-4.5-2-4.5-4.4c0-2.4,2-4.4,4.4-4.4C14.2,5.8,16.3,7.9,16.3,10.3z M14.4,10.3 c0-1.5-1-2.6-2.5-2.6c-1.5,0-2.5,1.1-2.5,2.6c0,1.5,1.2,2.6,2.6,2.5C13.4,12.8,14.4,11.7,14.4,10.3z"></path></g></g></svg>',
  heart: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="154px" height="141px" viewBox="0 0 154 141" xml:space="preserve" class="outlined" style="fill: var(--main-color);"><defs></defs><g><g><path d="M149.1,45.1c0,12.7-5.1,23.7-12.1,33.8c-14.3,20.4-32.2,37.2-52.3,51.7c-2.8,2-5,2.3-8,0.1 c-19.4-14.3-37.2-30.3-51.3-50.1c-7.9-11-13.9-22.9-13.3-36.9c0.6-15.4,7.8-27.1,21.6-34C47.2,3,60.2,5.4,72.2,14.1 c2.5,1.8,4.4,4.1,6.1,6.6c1.5,2.3,2.8,2.5,4.4,0.1c9-13.1,27.5-18.1,41.4-12.7C139,14,149,28.6,149.1,45.1z M24.2,46.4 c0.2,6.3,2.4,13.1,6,19.4c11.9,20.6,29.2,36.1,47.4,50.9c2.9,2.3,4.8,0.8,7-0.9c11.4-8.8,21.7-18.8,31.3-29.4 c7.7-8.5,14.6-17.8,18.7-28.7c5.3-14.4,1.1-28.2-10.9-36.2c-14.5-9.6-35,1.7-36.5,20.2c-0.3,3.8-1.4,5.4-5.3,5.3 c-6.5-0.1-6.9-0.3-7.8-6.8c-1.8-13-14.5-23.4-27.2-22.1C35,19.3,24.2,32.2,24.2,46.4z"></path></g></g></svg>',
  heartFilled: '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32px" height="29.9px" viewBox="0 0 32 29.9" class="filled" style="fill: var(--main-color);"><defs></defs><path class="fill-main" d="M23.4,0c-1.6,0.1-3,0.5-4.3,1.3s-2.3,1.8-3,3.2c-0.7-1.4-1.7-2.4-3-3.2s-2.8-1.2-4.4-1.2C7,0.1,5.5,0.6,4.2,1.4 S1.8,3.5,1,4.9s-1.1,3-1,4.6c0,2.6,1.3,5.7,3.8,9.1C5.7,21,8.1,23.5,11,26c1.6,1.3,3,2.4,4.3,3.3l0.7,0.5l0.7-0.5 c1.3-0.9,2.7-2,4.3-3.3c2.9-2.6,5.3-5,7.1-7.5c2.6-3.4,3.8-6.4,3.8-9.1c0.1-1.6-0.3-3.2-1-4.6s-1.8-2.6-3.1-3.5 C26.5,0.6,25,0.1,23.4,0L23.4,0z"></path></svg>',
  starOff: '<svg xmlns="http://www.w3.org/2000/svg" class="inline-block fill-current w-6 h-6 text-disabled-500 w-[1.5em] h-[1.5em]" viewBox="0 0 24 24" data-testid="star" aria-hidden="true"><path d="m8.85 17.825 3.15-1.9 3.15 1.925-.825-3.6 2.775-2.4-3.65-.325-1.45-3.4-1.45 3.375-3.65.325 2.775 2.425-.825 3.575Zm3.15.45-4.15 2.5a.908.908 0 0 1-.575.15.966.966 0 0 1-.525-.2 1.2 1.2 0 0 1-.35-.437.876.876 0 0 1-.05-.588l1.1-4.725L3.775 11.8a.955.955 0 0 1-.312-.513.99.99 0 0 1 .037-.562 1.07 1.07 0 0 1 .3-.45c.133-.117.317-.192.55-.225l4.85-.425 1.875-4.45c.083-.2.213-.35.388-.45.175-.1.354-.15.537-.15.183 0 .363.05.538.15.175.1.304.25.387.45l1.875 4.45 4.85.425c.233.033.417.108.55.225.133.117.233.267.3.45a.961.961 0 0 1-.275 1.075l-3.675 3.175 1.1 4.725a.875.875 0 0 1-.05.588 1.2 1.2 0 0 1-.35.437.966.966 0 0 1-.525.2.908.908 0 0 1-.575-.15l-4.15-2.5Z"></path></svg>',
  starOn: '<svg xmlns="http://www.w3.org/2000/svg" class="inline-block fill-current w-6 h-6 w-[1.5em] h-[1.5em]" viewBox="0 0 24 24" data-testid="star-filled" aria-hidden="true"><path d="m12 18.275-4.15 2.5a.908.908 0 0 1-.575.15.966.966 0 0 1-.525-.2 1.2 1.2 0 0 1-.35-.437.876.876 0 0 1-.05-.588l1.1-4.725L3.775 11.8a.955.955 0 0 1-.312-.513.99.99 0 0 1 .037-.562 1.07 1.07 0 0 1 .3-.45c.133-.117.317-.192.55-.225l4.85-.425 1.875-4.45c.083-.2.213-.35.388-.45.175-.1.354-.15.537-.15.183 0 .363.05.538.15.175.1.304.25.387.45l1.875 4.45 4.85.425c.233.033.417.108.55.225.133.117.233.267.3.45a.961.961 0 0 1-.275 1.075l-3.675 3.175 1.1 4.725a.875.875 0 0 1-.05.588 1.2 1.2 0 0 1-.35.437.966.966 0 0 1-.525.2.908.908 0 0 1-.575-.15l-4.15-2.5Z"></path></svg>',
  riyal: (w, h) => `<svg class="riyal-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="${w}" height="${h}" style="display:inline-block;vertical-align:-0.125em"><path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"></path><path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"></path></svg>`,
};

/* ----------------------------------------------------------------- prices */
function currency() {
  const code = window.salla?.config?.get?.('user.currency_code') || window.palace?.currency || 'SAR';
  return String(code).toUpperCase();
}

// Same number format as the reference: 1,234.00 from a thousand up, 390 below.
function amount(value) {
  const n = Number(value || 0);
  return n >= 1000
    ? n.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})
    : n.toLocaleString('en-US');
}

function money(value, small, fixed) {
  const code = currency();
  const symbol = code === 'SAR' ? ICONS.riyal(small ? 13 : 16, small ? 14 : 18) : esc(code);
  const text = fixed ? Number(value || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : amount(value);
  return `${text}  ${symbol}`;
}

/* ---------------------------------------------------------- product model */
function normalize(p) {
  const images = (p.images || []).map(i => i?.url || i?.image?.medium || i).filter(x => typeof x === 'string');
  const main = p.image?.url || images[0] || p.thumbnail || '';
  const regular = Number(p.regular_price ?? p.price ?? 0);
  const sale = Number(p.sale_price || 0);
  const onSale = !!(p.is_on_sale && sale && sale < regular);
  const pct = p.discount_percentage != null && p.discount_percentage !== ''
    ? Math.round(parseFloat(p.discount_percentage))
    : onSale ? Math.round((regular - sale) / regular * 100) : 0;
  const rating = p.rating?.stars ?? p.rating?.average ?? 0;
  return {
    id: p.id,
    name: p.name,
    url: p.url,
    image: main,
    hover: images.find(src => src !== main) || main,
    images: images.length ? images : (main ? [main] : []),
    onSale,
    price: onSale ? sale : Number(p.price ?? regular),
    regular,
    discount: pct,
    tag: p.promotion_title || '',
    info: !!p.subtitle,
    rating: Number(rating) || 0,
    outOfStock: !!p.is_out_of_stock,
    multiple: !!(p.has_options || p.has_custom_form || (p.options && p.options.length)),
    endsAt: p.discount_ends ? toDate(p.discount_ends) : null,
    inWishlist: !!p.is_in_wishlist,
  };
}

function toDate(value) {
  if (!value) return null;
  if (typeof value === 'number') return new Date(value < 1e12 ? value * 1000 : value);
  const d = new Date(String(value).replace(/-/g, '/'));
  return isNaN(d) ? null : d;
}

/* ----------------------------------------------------------- card markup */
function stars(rating) {
  const value = Math.round(rating * 20 * 100) / 100;
  const full = Math.round(rating);
  return `<div role="img" aria-label="${value} out of 5" title="${value} out of 5" class="inline-flex items-center text-warning-500 text-base product-card-rating" data-testid="rating">${
    [0, 1, 2, 3, 4].map(i => i < full ? ICONS.starOn : ICONS.starOff).join('')}</div>`;
}

function ratingCount(rating) {
  return rating ? String(Math.round(rating * 100) / 100) : '0';
}

function priceBlock(p) {
  return p.onSale
    ? `<div class="mb-10 product-price"><div style="display: flex; flex-direction: column;"><span style="color: rgb(222, 53, 11);">${money(p.price)}</span><span class="old-price">${money(p.regular, true)}</span></div></div>`
    : `<div class="mb-10 product-price"><span class="new-price">${money(p.price)}</span></div>`;
}

function countdown(end) {
  const L = labels();
  const diff = end ? end - new Date() : 0;
  const parts = diff > 0 ? [Math.floor(diff / 864e5), Math.floor(diff / 36e5 % 24), Math.floor(diff / 6e4 % 60), Math.floor(diff / 1e3 % 60)] : ['', '', '', ''];
  return `<div class="deals-countdown">${[L.day, L.hour, L.mins, L.secs].map((label, i) =>
    `<span class="countdown-section"><span class="countdown-amount">${parts[i]}</span> <span class="countdown-period">${label}</span></span>`).join('')}</div>`;
}

function cardHTML(product, {offer = false, slider = false, index = 0, endDate = null, hideDate = false} = {}) {
  const p = normalize(product);
  const L = labels();
  const name = esc(p.name);
  const url = esc(p.url);
  const end = endDate || p.endsAt;
  const cartButton = offer
    ? (p.multiple
      ? `<a class="btn w-100" href="#" data-html_url="${url}" data-palace-options><i class="mr-5 fi-rs-shopping-cart"></i>${L.multiple}</a>`
      : `<div class="flex w-full add-to-cart-main-wrapper"><a class=" btn w-100    w-full" type="button" href="javascript:void(0)" data-palace-add="${p.id}"><i class="mr-5 fi-rs-shopping-cart"></i>${L.addToCart}</a></div>`)
    : (p.multiple
      ? `<a class="add quick-view-react" href="#" data-html_url="${url}" data-palace-options><i class="mr-5 fi-rs-shopping-cart"></i>${L.multiple}</a>`
      : `<div class="flex w-full add-to-cart-main-wrapper"><a class="add  add-btn-react   w-full" type="button" href="javascript:void(0)" data-palace-add="${p.id}"><i class="mr-5 fi-rs-shopping-cart"></i>${L.addToCart}</a></div>`);
  const soldOut = `<i class="mr-5 fi-rs-exclamation"></i><span class="hide-onhover">${L.outOfStock}</span><span class="show-onhover">${L.notifyMe}</span>`;
  return `<div class="product-cart-wrap ${slider ? '' : 'mb-30'} wow animate__animated animate__fadeIn ${p.outOfStock ? 'product-out-of-stock' : ''}" data-wow-delay=".${index}s">
<div class="product-img-action-wrap">
<div class="product-img product-img-zoom">${!slider && p.images.length > 1
    ? `<div class="carsoul-wrapper"><div class="swiper" data-palace-gallery><div class="swiper-wrapper">${p.images.map(src => `<div class="swiper-slide"><div class="w-full item"><a href="${url}" class="img-carsoul-wrapper"><img class="default-img lazyload" src="${loader()}" data-src="${esc(src)}" alt="${name}"></a></div></div>`).join('')}</div></div></div>`
    : `<a href="${url}"><img class="default-img lazyload" src="${loader()}" data-src="${esc(p.image)}" alt="${name}"><img class="hover-img lazyload" src="${loader()}" data-src="${esc(p.hover)}" alt="${name}"></a>`}</div>
<div class="product-action-1"><button aria-label="${L.quickView}" type="button" class="action-btn quick-view-react" data-html_url="${url}">${ICONS.eye}</button><button aria-label="${L.addToFav}" type="button" data-fav-id="${p.id}" class="action-btn add-to-fav-react ${p.inWishlist ? 'active' : ''} ">${p.inWishlist ? ICONS.heartFilled : ICONS.heart}</button></div>
${p.onSale ? `<div class="product-badges product-badges-position product-badges-mrg"><span class="best">${p.discount}%</span></div>` : ''}
${p.tag || p.info ? `<div class="product-tags-wrapper "><div class="card product-tags ">${p.tag ? `<span>${esc(p.tag)}</span>` : ''}</div></div>` : ''}
</div>
<div class="product-content-wrap ${offer ? 'offer-card' : 'main-card'}">
<h2 class="truncate-2-lines"><a href="${url}">${name}</a></h2>
${p.info ? '<div class=" "><div class="card product-info-label "></div></div>' : ''}
<div class="product-rate-cover"><div class="product-rate-wrapper">${stars(p.rating)}<span class="font-small ml-5 text-muted">(${ratingCount(p.rating)})</span></div><div class="product-card-bundle-offer" data-bundle-offer-product-id="${p.id}"></div></div>
${offer
    ? `${priceBlock(p)}${hideDate ? '' : `<div class="deals-countdown-wrap mb-15" data-palace-countdown="${end ? end.getTime() : ''}">${countdown(end)}</div>`}${p.outOfStock ? `<p class="btn w-100 hover-up out-of-stock">${soldOut}</p>` : cartButton}`
    : `<div class="product-card-bottom">${priceBlock(p)}<div class="add-cart">${p.outOfStock ? `<p class="add out-of-stock">${soldOut}</p>` : cartButton}</div></div>`}
</div>
</div>`;
}

function smallCardHTML(product) {
  const p = normalize(product);
  const name = esc(p.name);
  const url = esc(p.url);
  const price = p.onSale
    ? `<div style="display: flex; flex-direction: column;"><span style="color: rgb(222, 53, 11);">${money(p.price)}</span><span class="old-price">${money(p.regular, true)}</span></div>`
    : `<span>${money(p.price)}</span>`;
  return `<article class="row align-items-center hover-up">
<figure class="mb-0 col-md-4"><a href="${url}"><img class="small-product-img lazyload" src="${loader()}" data-src="${esc(p.image)}" alt="${name}"></a></figure>
<div class="mb-0 col-md-8"><h6 class="truncate-2-lines"><a href="${url}">${name}</a></h6>
<div class="product-rate-cover"><div class="product-rate-wrapper">${stars(p.rating)}<span class="font-small ml-5 text-muted">(${ratingCount(p.rating)})</span></div></div>
<div class="product-price">${price}${p.discount ? `<div class="discount-percent-badge d-inline-block">${p.discount}%</div>` : ''}</div>
</div></article>`;
}

/* --------------------------------------------------------- product data */
async function fetchProducts({source, value, limit}) {
  await sallaReady();
  if (source === 'selected' && (!value || !value.length)) return [];
  const query = {source, limit};
  if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && !value.length)) query.source_value = sourceValue(source, value);
  const response = await productApi().fetch({...query, with: ['images']});
  return response?.data || [];
}

// Salla's SDK rejects a single id for these sources ("SourceValue type error. Expected an array.").
const LIST_SOURCES = ['categories', 'brands', 'tags', 'selected'];
const sourceValue = (source, value) => (LIST_SOURCES.includes(source) && !Array.isArray(value) ? [value] : value);

const productApi = () => window.salla?.product?.api || window.salla?.product || window.salla?.api?.product;

/* -------------------------------------------------------------- sliders */
function arrows(container, swiper, hero) {
  if (!container) return;
  const button = (dir, icon) => {
    const span = document.createElement('span');
    span.className = `slider-btn slider-${dir}${container.dataset.plain === undefined ? ' slick-arrow' : ''}`;
    span.innerHTML = `<i class="${icon}"></i>`;
    span.addEventListener('click', () => (dir === 'prev' ? swiper.slidePrev() : swiper.slideNext()));
    return span;
  };
  const target = hero ? container.querySelector('.hero-slider-1-arrow') || container : container;
  target.replaceChildren();
  if (swiper.allowSlidePrev) target.append(button('prev', hero ? 'fi-rs-angle-left' : 'fi-rs-arrow-small-left'));
  if (swiper.allowSlideNext) target.append(button('next', hero ? 'fi-rs-angle-right' : 'fi-rs-arrow-small-right'));
}

// Swiper's loop with slidesPerView 'auto' does not recover when the slide widths change on a resize
// (desktop five per row -> mobile two): the slider stops on one card or runs into empty space.
// Each slider is built again once its width has changed.
const sliderSetups = new Map();
let sliderResize;
window.addEventListener('resize', () => {
  clearTimeout(sliderResize);
  sliderResize = setTimeout(() => sliderSetups.forEach((setup, el) => {
    if (!el.isConnected) { sliderSetups.delete(el); return; }
    if (Math.abs(el.clientWidth - setup.width) < 2) return;
    el.swiper?.destroy(true, true);
    slider(el, setup.options);
  }), 250);
});

function slider(el, options = {}) {
  if (!el || el.swiper) return el?.swiper;
  sliderSetups.set(el, {options, width: el.clientWidth});
  const {autoplay = false, pagination = false, arrowsEl = null, hero = false} = options;
  const modules = [];
  const params = {spaceBetween: 0, loop: true, slidesPerView: 'auto'};
  if (autoplay) { modules.push(Autoplay); params.autoplay = {delay: 2500, disableOnInteraction: false, pauseOnMouseEnter: true}; }
  if (pagination) {
    modules.push(Pagination);
    let dots = el.querySelector(':scope > .swiper-pagination');
    if (!dots) { dots = document.createElement('div'); dots.className = 'swiper-pagination'; el.append(dots); }
    params.pagination = {el: dots, clickable: true};
  }
  params.modules = modules;
  const swiper = new Swiper(el, params);
  el.classList.toggle('center-items-slider', !(swiper.allowSlideNext || swiper.allowSlidePrev));
  arrows(arrowsEl, swiper, hero);
  swiper.on('lock unlock', () => {
    el.classList.toggle('center-items-slider', !(swiper.allowSlideNext || swiper.allowSlidePrev));
    arrows(arrowsEl, swiper, hero);
  });
  return swiper;
}

/* ------------------------------------------------------------- sections */
const sections = {
  hero(section) {
    const el = section.querySelector('.swiper');
    slider(el, {autoplay: section.dataset.autoplay === 'true', pagination: true, arrowsEl: section.querySelector('.carausel-4-columns-arrow'), hero: true});
  },
  categories(section) {
    slider(section.querySelector('.swiper'), {autoplay: section.dataset.autoplay === 'true', arrowsEl: section.querySelector('.section-title .slider-arrow')});
  },
  async offers(section) {
    const cfg = JSON.parse(section.dataset.palaceProducts || '{}');
    const products = await fetchProducts(cfg);
    if (!products.length) { section.hidden = true; return; }
    const wrapper = section.querySelector('.swiper-wrapper');
    const endDate = toDate(cfg.endDate);
    wrapper.innerHTML = products.map((p, i) =>
      `<div class="swiper-slide ${esc(cfg.slideClass)}">${cardHTML(p, {offer: true, slider: true, index: i, endDate, hideDate: cfg.hideDate})}</div>`).join('');
    ready(wrapper);
    slider(section.querySelector('.swiper'), {autoplay: cfg.autoplay, arrowsEl: section.querySelector('.carausel-4-columns-arrow')});
  },
  async grid(section) {
    const cfg = JSON.parse(section.dataset.palaceProducts || '{}');
    // Salla's product components pass the source as source / source-value attributes.
    if (section.hasAttribute('source')) {
      cfg.source = section.getAttribute('source');
      try { cfg.value = JSON.parse(section.getAttribute('source-value') || 'null'); } catch (e) { cfg.value = section.getAttribute('source-value'); }
    }
    const products = await fetchProducts(cfg);
    if (!products.length) { section.hidden = true; return; }
    const wrapper = section.querySelector('.swiper-wrapper');
    wrapper.innerHTML = products.map((p, i) =>
      `<div class="swiper-slide ${esc(cfg.slideClass)}"><div>${cardHTML(p, {slider: true, index: i})}</div></div>`).join('');
    ready(wrapper);
    slider(section.querySelector('.swiper'), {autoplay: cfg.autoplay, arrowsEl: section.querySelector('.carausel-4-columns-arrow')});
  },
  tabs(section) {
    const buttons = [...section.querySelectorAll('[data-palace-tab]')];
    const pane = section.querySelector('.tab-pane');
    const grid = pane.querySelector('.product-grid-4');
    const more = pane.querySelector('.more-content');
    const load = async button => {
      buttons.forEach(b => b.classList.toggle('active', b === button));
      const cfg = JSON.parse(button.dataset.palaceTab);
      grid.innerHTML = '';
      more.innerHTML = cfg.moreUrl ? `<a href="${esc(cfg.moreUrl)}" class="btn">${esc(cfg.moreText)}</a>` : '';
      const products = await fetchProducts(cfg);
      if (!button.classList.contains('active')) return;
      grid.innerHTML = products.slice(0, cfg.limit).map((p, i) =>
        `<div class="col-lg-1-5 col-md-4 col-6">${cardHTML(p, {index: i})}</div>`).join('');
      ready(grid);
    };
    buttons.forEach(b => b.addEventListener('click', () => load(b)));
    if (buttons[0]) load(buttons[0]);
  },
  async columns(section) {
    await Promise.all([...section.querySelectorAll('[data-palace-column]')].map(async column => {
      const cfg = JSON.parse(column.dataset.palaceColumn);
      const products = await fetchProducts(cfg);
      column.querySelector('.product-list-small').innerHTML = products.slice(0, cfg.limit).map(smallCardHTML).join('');
      lazy(column);
    }));
  },
};

// Newly rendered markup gets the WOW entrance (WOW.js runs in live mode), lazy images and
// the image sliders of grid cards (no autoplay, as product_disable_auto_play in the reference).
function ready(root) {
  wow(root);
  lazy(root);
  root.querySelectorAll('[data-palace-gallery]').forEach(el => {
    if (el.swiper) return;
    const dots = document.createElement('div');
    dots.className = 'swiper-pagination';
    el.append(dots);
    new Swiper(el, {modules: [Pagination], slidesPerView: 1, pagination: {el: dots, clickable: true}});
  });
}

/* ----------------------------------------------------------------- WOW.js */
// Same visible result as WOW.js 1.x: hidden until scrolled into view, then the
// animate.css animation runs with its data-wow-delay.
let wowObserver;
function wow(root = document) {
  wowObserver ||= new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    wowObserver.unobserve(el);
    const name = [...el.classList].find(c => c.startsWith('animate__') && c !== 'animate__animated')?.slice(9);
    if (el.dataset.wowDelay) el.style.animationDelay = /s$/.test(el.dataset.wowDelay) ? el.dataset.wowDelay : el.dataset.wowDelay + 's';
    el.style.visibility = 'visible';
    if (name) el.style.animationName = name;
    el.classList.add('animated');
    el.addEventListener('animationend', function done(e) {
      if (e.target !== el) return;
      el.removeEventListener('animationend', done);
      el.className = el.className.replace('animated', '').trim();
    });
  }), {rootMargin: '0px'});
  const nodes = root.matches?.('.wow') ? [root] : [];
  nodes.push(...root.querySelectorAll('.wow'));
  nodes.forEach(el => {
    if (el.dataset.wowInit) return;
    el.dataset.wowInit = '1';
    el.style.visibility = 'hidden';
    wowObserver.observe(el);
  });
}

/* ---------------------------------------------------------------- lazyload */
let lazyObserver;
function lazy(root = document) {
  lazyObserver ||= new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    lazyObserver.unobserve(el);
    el.classList.add('lazyloading');
    if (el.dataset.srcset) el.srcset = el.dataset.srcset;
    const done = () => { el.classList.remove('lazyload', 'lazyloading'); el.classList.add('lazyloaded'); };
    if (el.tagName === 'IMG' && el.dataset.src) {
      el.addEventListener('load', done, {once: true});
      el.addEventListener('error', done, {once: true});
      el.src = el.dataset.src;
    } else done();
  }), {rootMargin: '400px 0px'});
  root.querySelectorAll('.lazyload').forEach(el => lazyObserver.observe(el));
}

/* ------------------------------------------------------------- countdowns */
function tickCountdowns() {
  document.querySelectorAll('[data-palace-countdown]').forEach(wrap => {
    const end = wrap.dataset.palaceCountdown ? new Date(Number(wrap.dataset.palaceCountdown)) : null;
    const diff = end ? end - new Date() : 0;
    if (diff <= 0) return;
    const values = [Math.floor(diff / 864e5), Math.floor(diff / 36e5 % 24), Math.floor(diff / 6e4 % 60), Math.floor(diff / 1e3 % 60)];
    wrap.querySelectorAll('.countdown-amount').forEach((el, i) => { el.textContent = values[i]; });
  });
}

/* ----------------------------------------------------------------- header */
// jQuery vTicker (showItems: 1, animation: fade, speed 500, pause 3000): every item gets
// the tallest item's height and the box shows one item.
function ticker(box) {
  const list = box?.querySelector('ul');
  if (!list || list.children.length < 2) return;
  const items = [...list.children];
  const size = () => {
    items.forEach(li => { li.style.height = ''; });
    const height = Math.max(...items.map(li => li.getBoundingClientRect().height));
    items.forEach(li => { li.style.height = height + 'px'; });
    box.style.height = height + 'px';
  };
  size();
  window.addEventListener('resize', size);
  setInterval(() => {
    list.style.transition = 'opacity 500ms';
    list.style.opacity = '0';
    setTimeout(() => {
      list.append(list.firstElementChild);
      list.style.top = '0px';
      list.style.opacity = '1';
    }, 500);
  }, 3500);
}

function stickyHeader() {
  const bars = document.querySelectorAll('.sticky-bar');
  const update = () => bars.forEach(bar => bar.classList.toggle('stick', window.scrollY >= 200));
  window.addEventListener('scroll', update, {passive: true});
  update();
}

function scrollUp() {
  const up = document.createElement('a');
  up.id = 'scrollUp';
  up.href = '#top';
  up.className = 'palace-ref';
  up.style.cssText = 'position: fixed; z-index: 2147483647; display: none;';
  up.innerHTML = '<i class="fi-rs-arrow-small-up"></i>';
  document.body.append(up);
  let visible = false;
  const fade = show => {
    visible = show;
    up.style.transition = 'opacity 200ms';
    if (show) { up.style.display = 'block'; up.style.opacity = '0'; requestAnimationFrame(() => { up.style.opacity = '1'; }); }
    else { up.style.opacity = '0'; setTimeout(() => { if (!visible) up.style.display = 'none'; }, 200); }
  };
  window.addEventListener('scroll', () => { if ((window.scrollY > 300) !== visible) fade(!visible); }, {passive: true});
  up.addEventListener('click', e => {
    e.preventDefault();
    const start = window.scrollY, begin = performance.now();
    const step = now => {
      const k = Math.min(1, (now - begin) / 900);
      window.scrollTo(0, start * (1 - k));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

// Footer columns: each top-level footer menu item with children is a column (its title
// replaces the column heading); single links go to the first column.
function footerMenu() {
  const columns = [...document.querySelectorAll('[data-palace-footer-column]')];
  if (!columns.length) return;
  sallaReady()
    .then(() => window.salla.api.component.getMenus('footer'))
    .then(({data}) => {
      const items = data || [];
      const groups = items.filter(i => i.children?.length);
      const singles = items.filter(i => !i.children?.length);
      const link = i => `<li><a href="${esc(i.url || '#')}">${esc(i.title)}</a></li>`;
      columns.forEach((column, index) => {
        const group = groups[index];
        if (group) column.querySelector('.widget-title').textContent = group.title;
        const links = [...(group ? group.children : []), ...(index === 0 ? singles : [])];
        column.querySelector('.footer-list').innerHTML = links.map(link).join('');
        column.hidden = !links.length;
      });
      // Cookie preferences link, as salla-menu's with-cookie-preferences adds to the footer menu.
      if ((window.salla.config.get('store.features') || []).includes('website-cookies')) {
        const list = columns[0].querySelector('.footer-list');
        list.insertAdjacentHTML('beforeend', `<li><a href="#cookies-settings" data-palace-cookies>${esc(t('common.cookies.settings'))}</a></li>`);
        list.querySelector('[data-palace-cookies]').addEventListener('click', e => { e.preventDefault(); window.salla.event.emit('salla-cookies-bar::open'); });
        columns[0].hidden = false;
      }
    })
    .catch(error => console.error('PC Palace: unable to load the footer menu', error));
}

function menus() {
  footerMenu();
  const nav = document.querySelector('[data-palace-menu]');
  const mobile = document.querySelector('[data-palace-mobile-menu]');
  const dropdown = document.querySelector('[data-palace-categories]');
  if (!nav && !mobile && !dropdown) return;
  sallaReady()
    .then(() => window.salla.api.component.getMenus('header'))
    .then(({data}) => {
      const items = data || [];
      const hot = nav?.querySelector('.hot-deals');
      const mobileTail = mobile ? [...mobile.querySelectorAll(':scope > [data-palace-static]')] : [];
      items.forEach(item => {
        if (nav) {
          const li = document.createElement('li');
          li.innerHTML = `\n<a href="${esc(item.url || '#')}">${esc(item.title)}\t\t\t\t\t</a>\n`;
          nav.insertBefore(li, hot);
        }
        if (mobile) {
          const li = document.createElement('li');
          li.className = 'menu-item-has-children';
          li.innerHTML = `<a href="${esc(item.url || '#')}">${esc(item.title)}</a>`;
          mobile.insertBefore(li, mobileTail[0] || null);
        }
      });
      if (dropdown) {
        const list = items.filter(i => i.children?.length).flatMap(i => [i, ...i.children]).concat(items.filter(i => !i.children?.length));
        dropdown.innerHTML = `<div class="categori-dropdown-inner"><ul>${list.slice(0, 20).map(i =>
          `<li><a href="${esc(i.url || '#')}">${i.image ? `<img src="${esc(i.image)}" alt="">` : ''}${esc(i.title)}</a></li>`).join('')}</ul></div>`;
      }
    })
    .catch(error => console.error('PC Palace: unable to load the header menu', error));
}

function headerActions() {
  document.querySelectorAll('.categories-button-active').forEach(button => button.addEventListener('click', e => {
    e.preventDefault();
    const open = !button.classList.contains('open');
    button.classList.toggle('open', open);
    button.parentElement.querySelector('.categories-dropdown-active-large')?.classList.toggle('open', open);
  }));

  const mobile = document.querySelector('.mobile-header-active');
  const close = () => { mobile?.classList.remove('sidebar-visible'); document.body.classList.remove('mobile-menu-active'); };
  document.querySelectorAll('.burger-icon').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    mobile?.classList.add('sidebar-visible');
    document.body.classList.add('mobile-menu-active');
  }));
  document.querySelectorAll('.mobile-menu-close, .body-overlay-1').forEach(b => b.addEventListener('click', close));

  const drawers = [...document.querySelectorAll('.drawer-list')];
  document.querySelectorAll('.mini-cart-icon').forEach((icon, i) => icon.addEventListener('click', e => {
    e.preventDefault();
    drawers[i]?.classList.add('show-cart-drawer');
    renderMiniCart();
  }));
  document.querySelectorAll('.close-cart').forEach((b, i) => b.addEventListener('click', () => drawers[i]?.classList.remove('show-cart-drawer')));

  document.querySelectorAll('[data-palace-dark-mode]').forEach(b => b.addEventListener('click', () => {
    const body = document.body;
    const dark = body.classList.contains('main--light');
    body.classList.toggle('main--light', !dark);
    body.classList.toggle('main--dark', dark);
    try { dark ? localStorage.setItem('palace-dark-mode', 'dark') : localStorage.removeItem('palace-dark-mode'); } catch (e) { /* storage unavailable */ }
  }));

  document.querySelectorAll('[data-palace-localization]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    window.salla?.event?.dispatch?.('localization::open');
    document.querySelector('salla-localization-modal')?.open?.();
  }));
  document.querySelectorAll('[data-palace-href]').forEach(b => b.addEventListener('click', () => { window.location.href = b.dataset.palaceHref; }));
  document.querySelectorAll('[data-palace-login]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    window.salla?.event?.dispatch?.('login::open');
  }));
  document.querySelectorAll('[data-palace-logout]').forEach(b => b.addEventListener('click', e => {
    e.preventDefault();
    Promise.resolve(window.salla?.auth?.logout?.()).then(() => { window.location.href = window.salla?.url?.get?.('') || '/'; }).catch(() => {});
  }));
}

/* ---------------------------------------------------------------- search */
function search() {
  const wrapper = document.getElementById('header-search-wrapper');
  if (!wrapper) return;
  const input = wrapper.querySelector('.header-search-input');
  const results = wrapper.querySelector('#dynamic-search-results');
  let timer, token = 0;
  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearTimeout(timer);
    if (q.length < 3) { results.classList.remove('show'); results.innerHTML = ''; return; }
    timer = setTimeout(async () => {
      const current = ++token;
      results.innerHTML = '<div class="search-loading-spinner"><svg class="spinner" viewBox="0 0 50 50"><circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle></svg></div>';
      results.classList.add('show');
      try {
        const products = await fetchProducts({source: 'search', value: q, limit: 8});
        if (current !== token) return;
        if (!products.length) { results.innerHTML = `<div class="search-no-results">${esc(t('palace.no_search_results'))}</div>`; return; }
        results.innerHTML = `<ul class="search-results-list">${products.map(product => {
          const p = normalize(product);
          return `<li class="search-result-item" data-url="${esc(p.url)}"><div class="search-result-img"><img src="${esc(p.image)}" alt="${esc(p.name)}"></div><div class="search-result-info"><h4 class="search-result-name">${esc(p.name)}</h4><div class="search-result-price">${money(p.price)} ${p.onSale ? `<span class="search-result-price-before">${money(p.regular, true)}</span>` : ''}</div></div>${p.discount ? `<span class="search-discount-badge">-${p.discount}%</span>` : ''}</li>`;
        }).join('')}</ul><a href="${esc(wrapper.querySelector('form').action)}?q=${encodeURIComponent(q)}" class="search-view-all">${esc(t('palace.view_all_results'))}</a>`;
      } catch (error) {
        results.classList.remove('show');
      }
    }, 300);
  });
  results.addEventListener('click', e => {
    const item = e.target.closest('.search-result-item');
    if (item?.dataset.url) window.location.href = item.dataset.url;
  });
  document.addEventListener('click', e => { if (!e.target.closest('#header-search-wrapper')) results.classList.remove('show'); });
}

/* ------------------------------------------------------------- cart/fav */
async function renderMiniCart() {
  const lists = document.querySelectorAll('.result-cart');
  if (!lists.length || !window.salla?.cart) return;
  try {
    const {data} = await window.salla.cart.details();
    const cart = data?.cart || data || {};
    const items = cart.items || [];
    lists.forEach(list => {
      list.innerHTML = items.map(item => `<li><div class="shopping-cart-img"><a href="${esc(item.url)}"><img alt="" src="${esc(item.product_image || item.image)}"></a></div><div class="shopping-cart-title"><h4><a href="${esc(item.url)}">${esc(item.product_name || item.name)}</a></h4><h4><span>${item.quantity} × </span>${money(item.price?.amount ?? item.price, true)}</h4></div></li>`).join('');
    });
    const total = Number(cart.total?.amount ?? cart.total ?? 0);
    if (items.length) document.querySelectorAll('.cart-count').forEach(el => { el.textContent = items.reduce((n, item) => n + Number(item.quantity || 0), 0); });
    document.querySelectorAll('.summary-total-price').forEach(el => { el.innerHTML = total ? money(total, true) : '0'; });
  } catch (error) { /* cart unavailable */ }
}

function updateCounts() {
  const count = window.salla?.storage?.get?.('cart.summary.count') ?? window.salla?.cart?.summary?.count ?? 0;
  document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count || 0; });
}

function productActions() {
  document.addEventListener('click', async e => {
    const add = e.target.closest('[data-palace-add]');
    if (add) {
      e.preventDefault();
      add.classList.add('loading');
      try {
        await window.salla.cart.addItem({id: Number(add.dataset.palaceAdd), quantity: 1});
      } catch (error) {
        const url = add.closest('.product-cart-wrap')?.querySelector('h2 a')?.href;
        if (url && error?.response?.status === 422) window.location.href = url;
      } finally { add.classList.remove('loading'); }
      return;
    }
    const options = e.target.closest('[data-palace-options], .quick-view-react');
    if (options?.dataset.html_url) { e.preventDefault(); window.location.href = options.dataset.html_url; return; }
    const fav = e.target.closest('.add-to-fav-react');
    if (fav) {
      e.preventDefault();
      try {
        await window.salla.wishlist.toggle(Number(fav.dataset.favId));
        const on = !fav.classList.contains('active');
        fav.classList.toggle('active', on);
        fav.innerHTML = on ? ICONS.heartFilled : ICONS.heart;
      } catch (error) { /* login required: the SDK opens the login modal */ }
    }
  });
  sallaReady().then(() => {
    updateCounts();
    window.salla?.cart?.event?.onUpdated?.(summary => {
      document.querySelectorAll('.cart-count').forEach(el => { el.textContent = summary?.count ?? summary?.cart?.count ?? 0; });
    });
  });
}

/* --------------------------------------------------------------- listing */
// Slick 1.8 layout of the reference's sub-category row (.carausel-8-columns in main-rtl.js):
// rtl, infinite, 300 ms ease; 8 / 7 / 4 / 3 / 2.5 slides above 1480 / 1025 / 768 / 480 / below.
function slickRow(root) {
  const cards = [...root.children];
  if (!cards.length) return;
  const arrows = document.getElementById(root.id + '-arrows');
  let index = 0, count = 0, show = 0, scroll = 1, width = 0, listWidth = 0, clones = 0, track = null, busy = false;
  const settings = () => {
    const w = window.innerWidth;
    if (w <= 480) return {show: 2.5, scroll: 1, rows: 1};
    if (w <= 768) return {show: 3, scroll: 3, rows: 1};
    if (w <= 1025) return {show: 4, scroll: 1, rows: 1};
    return w <= 1480 ? {show: 7, scroll: 1, rows: 1} : {show: 8, scroll: 1, rows: 1};
  };

  function place(animate) {
    track.style.transition = animate ? 'transform 300ms ease' : '';
    track.style.transform = `translate3d(${(isRtl() ? 1 : -1) * (index * width + (count > show ? show * width : 0))}px, 0px, 0px)`;
    const slides = [...track.children];
    const first = index + (count > show ? clones : 0);
    slides.forEach((slide, i) => {
      slide.classList.toggle('slick-current', i === first);
      slide.classList.toggle('slick-active', i >= first && i < first + Math.floor(show));
    });
  }

  function build() {
    const cfg = settings();
    show = cfg.show; scroll = cfg.scroll;
    let slides = cards;
    if (cfg.rows > 1) {
      slides = [];
      for (let i = 0; i < cards.length; i += cfg.rows) {
        const slide = document.createElement('div');
        cards.slice(i, i + cfg.rows).forEach(card => {
          const row = document.createElement('div');
          card.style.cssText = 'width: 100%; display: inline-block;';
          row.append(card);
          slide.append(row);
        });
        slides.push(slide);
      }
    } else cards.forEach(card => { card.style.cssText = ''; });
    count = slides.length;
    index = 0;
    const list = document.createElement('div');
    list.className = 'slick-list draggable';
    track = document.createElement('div');
    track.className = 'slick-track';
    const clone = slide => { const c = slide.cloneNode(true); c.classList.add('slick-cloned'); c.id = ''; c.setAttribute('aria-hidden', 'true'); return c; };
    clones = Math.ceil(show);
    const all = count > show ? [...slides.slice(-clones).map(clone), ...slides, ...slides.slice(0, clones + 1).map(clone)] : slides;
    all.forEach(slide => { slide.classList.add('slick-slide'); track.append(slide); });
    list.append(track);
    root.replaceChildren(list);
    root.classList.add('slick-initialized', 'slick-slider');
    listWidth = list.getBoundingClientRect().width;
    width = Math.ceil(listWidth / show);
    track.style.opacity = '1';
    track.style.width = Math.ceil(width * all.length) + 'px';
    [...track.children].forEach(slide => {
      const cs = getComputedStyle(slide);
      // jQuery .width() on border-box slides: only the margins come off the slide width.
      slide.style.width = (width - parseFloat(cs.marginLeft) - parseFloat(cs.marginRight)) + 'px';
    });
    place(false);
    lazy(root);
    if (arrows) {
      arrows.replaceChildren();
      if (count > show) {
        [['prev', 'fi-rs-arrow-small-left', -1], ['next', 'fi-rs-arrow-small-right', 1]].forEach(([dir, icon, step]) => {
          const span = document.createElement('span');
          span.className = `slider-btn slider-${dir} slick-arrow`;
          span.setAttribute('style', '');
          span.innerHTML = `<i class="${icon}"></i>`;
          span.addEventListener('click', () => go(step * scroll));
          arrows.append(span);
        });
      }
    }
  }

  function go(step) {
    if (busy || count <= show) return;
    busy = true;
    index += step;
    place(true);
    setTimeout(() => {
      if (index >= count) index -= count;
      if (index < 0) index += count;
      place(false);
      busy = false;
    }, 300);
  }

  let startX = null;
  root.addEventListener('pointerdown', e => { startX = e.clientX; });
  root.addEventListener('pointerup', e => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 40) go((dx > 0) === isRtl() ? scroll : -scroll);
  });
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => { if (window.innerWidth !== lastWidth) { lastWidth = window.innerWidth; build(); } });
  build();
}

// jQuery theia-sticky-sidebar: a sidebar taller than the window scrolls with the page until
// its end is visible, then stays; a shorter one sticks to the top. Desktop only.
function stickySidebar(column) {
  const inner = column?.querySelector('.theiaStickySidebar');
  if (!inner) return;
  let offset = 0, lastY = window.scrollY;
  const update = () => {
    if (window.innerWidth < 992) { inner.removeAttribute('style'); column.style.minHeight = ''; return; }
    const content = column.parentElement;
    const height = inner.offsetHeight;
    const top = column.getBoundingClientRect().top + window.scrollY;
    const available = Math.max(content.getBoundingClientRect().height, height);
    column.style.cssText = `position: relative; overflow: visible; box-sizing: border-box; min-height: ${available}px;`;
    const y = window.scrollY, view = window.innerHeight;
    if (height <= view) offset = y - top;
    else if (y > lastY) { if (top + offset + height < y + view) offset = y + view - height - top; }
    else if (top + offset > y) offset = y - top;
    offset = Math.min(Math.max(offset, 0), available - height);
    lastY = y;
    inner.style.cssText = `padding-top: 0px; padding-bottom: 1px; position: absolute; transform: translateY(${offset}px); width: ${column.clientWidth - parseFloat(getComputedStyle(column).paddingLeft) - parseFloat(getComputedStyle(column).paddingRight)}px; top: 0px;`;
  };
  window.addEventListener('scroll', update, {passive: true});
  window.addEventListener('resize', update);
  new ResizeObserver(update).observe(column.parentElement);
  update();
}

function readFilters(params) {
  const filters = {};
  for (const [name, value] of params) {
    const m = name.match(/^filters\[([^\]]+)\](?:\[([^\]]*)\])?$/);
    if (!m) continue;
    const [, key, sub] = m;
    if (sub === '') (filters[key] = [].concat(filters[key] || [])).push(value);
    else if (sub) (filters[key] = typeof filters[key] === 'object' && !Array.isArray(filters[key]) ? filters[key] : {})[sub] = value;
    else filters[key] = value;
  }
  return filters;
}

// Filters come from Salla's <salla-filters>: the listing hands it the filters of each fetch
// ('filters::fetched') and reloads the grid when the shopper changes them ('salla-filters::changed').
async function listing(section) {
  const cfg = JSON.parse(section.dataset.palaceListing || '{}');
  const grid = section.querySelector('#category_more_wrapper');
  const more = section.querySelector('#load-more-button');
  const total = section.querySelector('[data-palace-total]');
  const params = new URLSearchParams(window.location.search);
  const sort = params.get('sort') || params.get('by') || cfg.sort || '';
  if (cfg.source === 'search' && !cfg.value) cfg.value = params.get('q') || '';
  let filters = readFilters(params);
  let next = null, token = 0;

  // Four cards a row beside the filter sidebar, five on a full-width listing (no filters, e.g. brands).
  const column = grid.clientWidth > 1100 ? 'col-lg-1-5' : 'col-lg-3';
  const render = (products, append) => {
    const html = products.map((p, i) => `<div class="${column} col-md-4 col-6"><product-card>${cardHTML(p, {index: i + 1})}</product-card></div>`).join('');
    if (append) grid.insertAdjacentHTML('beforeend', html); else grid.innerHTML = html || `<p class="text-center w-100">${esc(t('palace.no_products'))}</p>`;
    ready(grid);
  };
  const page = async reset => {
    const current = ++token;
    more.hidden = true;
    await sallaReady();
    let response;
    if (reset || !next) {
      const query = {source: cfg.source, limit: cfg.limit || 24, per_page: cfg.limit || 24, filterable: 1, with: ['images']};
      if (cfg.value !== null && cfg.value !== undefined && cfg.value !== '') query.source_value = sourceValue(cfg.source, cfg.value);
      if (sort) query.sort = sort;
      if (Object.keys(filters).length) query.filters = filters;
      response = await productApi().fetch(query);
    } else response = await window.salla.api.request(next);
    if (current !== token) return;
    render(response?.data || [], !reset);
    next = response?.cursor?.next || null;
    more.hidden = !next;
    if (total && response?.cursor?.total != null) total.textContent = response.cursor.total;
    if (reset && response?.filters) {
      window.salla?.event?.emit?.('filters::fetched', {filters: response.filters});
      stickySidebar(section.querySelector('.sticky-sidebar'));
    }
  };

  more.addEventListener('click', () => page(false));

  await sallaReady();
  window.salla?.event?.on?.('salla-filters::changed', data => { filters = {...(data || {})}; page(true); });

  const sortArea = section.querySelector('.sort-by-product-area');
  if (sortArea) {
    const dropdown = sortArea.querySelector('.sort-by-dropdown');
    const setOpen = open => { sortArea.classList.toggle('show', open); dropdown.classList.toggle('show', open); };
    sortArea.querySelector('.sort-by-product-wrap').addEventListener('click', e => { e.preventDefault(); setOpen(!sortArea.classList.contains('show')); });
    sortArea.querySelector('.btn-close')?.addEventListener('click', () => setOpen(false));
    document.addEventListener('click', e => { if (!e.target.closest('.sort-by-product-area')) setOpen(false); });
  }

  section.querySelectorAll('[data-palace-slick]').forEach(slickRow);
  stickySidebar(section.querySelector('.sticky-sidebar'));
  await page(true);
}
sections.listing = listing;

/* --------------------------------------------------------------- product */
function product(section) {
  const cfg = JSON.parse(section.dataset.palaceProduct || '{}');
  const form = section.querySelector('[data-palace-product-form]');
  section.querySelectorAll('[data-palace-money]').forEach(el => { el.innerHTML = money(el.dataset.palaceMoney, el.hasAttribute('data-small') || el.hasAttribute('data-palace-live-old'), el.hasAttribute('data-fixed')); });

  // Gallery: main slider with thumbnails (reference: product-gallery, Swiper Thumbs + FreeMode).
  const main = section.querySelector('.mySwiper2');
  const thumbsEl = section.querySelector('.mySwiper');
  if (main && thumbsEl) {
    const thumbs = new Swiper(thumbsEl, {modules: [FreeMode], spaceBetween: 10, slidesPerView: 4, freeMode: true, watchSlidesProgress: true});
    new Swiper(main, {modules: [Navigation, Thumbs], spaceBetween: 10, navigation: {nextEl: main.querySelector('.swiper-button-next'), prevEl: main.querySelector('.swiper-button-prev'), addIcons: false}, thumbs: {swiper: thumbs}});
    section.querySelector('[data-palace-zoom]')?.addEventListener('click', () => {
      const img = main.querySelector('.swiper-slide-active img') || main.querySelector('img');
      if (!img) return;
      const box = document.createElement('div');
      box.className = 'palace-ref';
      box.style.cssText = 'position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;cursor:zoom-out';
      box.innerHTML = `<img src="${esc(img.src)}" alt="" style="max-width:92vw;max-height:92vh;object-fit:contain">`;
      box.addEventListener('click', () => box.remove());
      document.body.append(box);
    });
  }

  // Options are Salla's <salla-product-options> inside the form: once every required option is
  // valid the form asks Salla for the price, and the price block follows (as in Raed's product.js).
  form?.addEventListener('change', () => {
    const complete = [...form.elements].every(el => !el.willValidate || el.validity.valid);
    if (complete) window.salla?.product?.getPrice?.(new FormData(form));
  });
  sallaReady().then(() => window.salla?.product?.event?.onPriceUpdated?.(res => {
    const data = res?.data || {};
    section.querySelectorAll('[data-palace-live-price]').forEach(el => { el.innerHTML = money(data.price); });
    section.querySelectorAll('[data-palace-live-old]').forEach(el => { el.innerHTML = money(data.regular_price, true); });
  }));

  // Quantity: Salla's <salla-quantity-input> in both button bars (main and sticky), kept in sync.
  const qtys = [...section.querySelectorAll('salla-quantity-input[data-palace-qty]')];
  const quantity = () => Number(qtys[0]?.querySelector('input')?.value || qtys[0]?.getAttribute('value') || 1);
  qtys.forEach(box => box.addEventListener('change', () => {
    const value = box.querySelector('input')?.value;
    qtys.forEach(other => {
      if (other === box) return;
      if (other.setValue) other.setValue(value, false);
      else if (other.querySelector('input')) other.querySelector('input').value = value;
    });
  }));

  // The form carries the product id, Salla's options and the quantity; Salla validates the options.
  const add = async (button, checkout) => {
    const data = new FormData(form);
    data.set('quantity', String(quantity() || 1));
    button.classList.add('loading');
    try {
      await window.salla.cart.addItem(data);
      if (checkout) window.location.href = window.salla.url?.get?.('cart') || section.dataset.cartUrl || '/cart';
    } catch (error) { /* the SDK shows the error */ } finally { button.classList.remove('loading'); }
  };
  section.querySelectorAll('[data-palace-add-product]').forEach(b => b.addEventListener('click', () => add(b, false)));
  section.querySelectorAll('[data-palace-buy-now]').forEach(b => b.addEventListener('click', () => add(b, true)));
  section.querySelector('[data-palace-notify]')?.addEventListener('click', e => window.salla?.product?.availabilitySubscribe?.(Number(e.currentTarget.dataset.palaceNotify)));
  section.querySelector('[data-palace-share]')?.addEventListener('click', e => {
    e.preventDefault();
    const url = e.currentTarget.dataset.palaceShare;
    if (navigator.share) navigator.share({url}).catch(() => {}); else navigator.clipboard?.writeText(url);
  });

  // Tabs (reference: Bootstrap tabs).
  const links = [...section.querySelectorAll('[data-palace-tab-link]')];
  links.forEach(link => link.addEventListener('click', e => {
    e.preventDefault();
    links.forEach(l => l.classList.toggle('active', l === link));
    section.querySelectorAll('.tab-content > .tab-pane').forEach(pane => {
      const on = '#' + pane.id === link.getAttribute('href');
      pane.classList.toggle('active', on);
      pane.classList.toggle('show', on);
    });
  }));
  // Reviews and questions: Salla's <salla-comments> in the Reviews tab.
}
sections.product = product;

/* ------------------------------------------------------------------ cart */
function cart(section) {
  const busy = el => el?.closest('.cart-product-row-wrapper')?.classList.toggle('palace-busy');
  const refreshTotals = response => {
    const data = response?.data?.cart || response?.cart || response?.data || {};
    const count = (data.items || []).reduce((n, item) => n + Number(item.quantity || 0), 0);
    section.querySelectorAll('[data-palace-total]').forEach(el => {
      const value = data[el.dataset.palaceTotal];
      if (value !== undefined) el.innerHTML = money(value?.amount ?? value);
    });
    (data.items || []).forEach(item => {
      const el = section.querySelector(`[data-palace-item-total="${item.id}"]`);
      if (el) el.innerHTML = money(item.total?.amount ?? item.total);
    });
    if (data.items) document.querySelectorAll('[data-palace-cart-count], .cart-count').forEach(el => { el.textContent = count; });
    if (data.items && !data.items.length) {
      section.querySelectorAll('.cart-details').forEach(el => el.classList.add('d-none'));
      section.querySelector('[data-palace-cart-empty]')?.classList.remove('d-none');
    }
  };
  // Salla's <salla-quantity-input> fires a bubbling change event from its input. The component copies
  // its attributes onto that input, so only the component itself is selected (the input would report
  // the event again, without a quantity, and reset the item to 1).
  section.querySelectorAll('salla-quantity-input[data-palace-cart-qty]').forEach(box => box.addEventListener('change', async event => {
    const id = Number(box.dataset.palaceCartQty);
    const quantity = Number(event.detail?.quantity || box.querySelector('input')?.value) || 1;
    busy(box);
    try {
      refreshTotals(await window.salla.cart.updateItem({id, quantity}));
      section.querySelector(`[data-palace-item-each="${id}"]`)?.classList.toggle('d-none', quantity < 2);
    } catch (e) { /* the SDK reports it */ }
    busy(box);
  }));
  section.querySelectorAll('[data-palace-remove]').forEach(link => link.addEventListener('click', async e => {
    e.preventDefault();
    busy(link);
    try {
      const response = await window.salla.cart.deleteItem(Number(link.dataset.palaceRemove));
      link.closest('.cart-product-row-wrapper').remove();
      refreshTotals(response);
    } catch (error) { busy(link); }
  }));
  section.querySelector('[data-palace-coupon]')?.addEventListener('click', async e => {
    const button = e.currentTarget;
    const code = section.querySelector('[data-palace-coupon-code]').value.trim();
    try {
      if (button.dataset.palaceCoupon === 'remove') await window.salla.cart.deleteCoupon();
      else if (code) await window.salla.cart.addCoupon(code);
      window.location.reload();
    } catch (error) { /* the SDK reports invalid coupons */ }
  });
  section.querySelector('[data-palace-checkout]')?.addEventListener('click', e => { e.preventDefault(); window.salla.cart.submit(); });
}
sections.cart = cart;

/* --------------------------------------------------------- other blocks */
function videos() {
  document.querySelectorAll('[data-palace-video]').forEach(frame => frame.addEventListener('click', () => {
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(frame.dataset.palaceVideo)}?autoplay=1&rel=0" title="video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    frame.classList.add('is-playing');
  }, {once: true}));
}

function orderActions() {
  document.querySelectorAll('[data-palace-reorder]').forEach(b => b.addEventListener('click', async () => {
    try { await window.salla.order.createCartFromOrder(Number(b.dataset.palaceReorder)); window.location.href = window.salla.url.get('cart'); } catch (e) { /* the SDK reports it */ }
  }));
  document.querySelectorAll('[data-palace-cancel-order]').forEach(b => b.addEventListener('click', async () => {
    if (!window.confirm(t('palace.cancel_confirm'))) return;
    try { await window.salla.order.cancel(Number(b.dataset.palaceCancelOrder)); window.location.reload(); } catch (e) { /* the SDK reports it */ }
  }));
}

function fillMoney(root = document) {
  root.querySelectorAll('[data-palace-money]').forEach(el => {
    if (el.dataset.palaceMoneyDone) return;
    el.dataset.palaceMoneyDone = '1';
    el.innerHTML = money(el.dataset.palaceMoney, el.hasAttribute('data-small'), el.hasAttribute('data-fixed'));
  });
}

/* ------------------------------------------------------------------ boot */
function boot() {
  try { if (localStorage.getItem('palace-dark-mode') === 'dark') { document.body.classList.remove('main--light'); document.body.classList.add('main--dark'); } } catch (e) { /* storage unavailable */ }
  ticker(document.getElementById('news-flash'));
  ticker(document.getElementById('news-flash-mobile'));
  stickyHeader();
  scrollUp();
  menus();
  headerActions();
  search();
  productActions();
  document.querySelectorAll('[data-palace-section]').forEach(section => {
    const init = sections[section.dataset.palaceSection];
    if (init) Promise.resolve(init(section)).catch(error => console.error('PC Palace section failed', section.dataset.palaceSection, error));
  });
  fillMoney();
  videos();
  orderActions();
  wow(document);
  lazy(document);
  setInterval(tickCountdowns, 1000);
  document.getElementById('zeyada-preloader-active')?.remove();
}

window.palace = Object.assign(window.palace || {}, {cardHTML, smallCardHTML, ready});
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
