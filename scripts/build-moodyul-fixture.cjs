/*
 * Builds local-preview/fixture.json from the public moodyul.com Salla store
 * (local-preview/data/moodyul/*.json, captured by scripts/moodyul-dump-*.cjs).
 *
 * The preview shows moodyul's own content (logo, menus, categories, products, blog, brands,
 * homepage sections) in the PC Palace design. Everything is already in Salla's data model;
 * only URLs are moved under the preview store URL.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const data = file => JSON.parse(fs.readFileSync(path.join(root, 'local-preview/data/moodyul', file), 'utf8'));
const src = data('store.json');
const blogSrc = data('blog.json');
const pagesSrc = data('pages.json');

const STORE = '/salla-pcpalace-theme/local-preview/store/';
const ORIGIN = /^https?:\/\/moodyul\.com\/(?:ar|en)\/?/;
const local = url => (typeof url === 'string' && ORIGIN.test(url) ? STORE + decodeURIComponent(url.replace(ORIGIN, '')).replace(/^\/+/, '') : url);

/* ------------------------------------------------------------- products */
const products = {};
function productOf(p) {
  const d = src.details[p.id] && !src.details[p.id].error ? src.details[p.id] : {};
  const images = (d.images || []).filter(i => i.type !== 'video').map(i => ({url: i.url, alt: i.alt}));
  const image = p.image?.url ? {url: p.image.url, alt: p.name} : images[0] || {url: '', alt: p.name};
  return {
    id: Number(p.id), name: p.name, url: local(p.url), type: p.type || 'product',
    price: Number(p.price), sale_price: Number(p.sale_price || 0), regular_price: Number(p.regular_price ?? p.price),
    is_on_sale: !!p.is_on_sale, discount_ends: p.discount_ends || d.discount_ends || null,
    discount_percentage: p.is_on_sale && p.regular_price ? String(Math.round((p.regular_price - p.price) / p.regular_price * 100)) : null,
    promotion_title: p.promotion_title || '', subtitle: p.subtitle || d.subtitle || '',
    rating: p.rating || d.rating ? {stars: (p.rating || d.rating).stars || 0, count: (p.rating || d.rating).count || 0} : {stars: 0, count: 0},
    image, images: images.length ? images : [image],
    is_out_of_stock: !!p.is_out_of_stock, is_available: p.is_available !== false,
    has_options: !!(p.has_options || (d.options && d.options.length)),
    options: d.options || [], description: d.description || '', sku: d.sku || p.sku || '',
    max_quantity: d.max_quantity || 99, quantity: p.quantity ?? null,
    category: d.category ? {id: d.category.id, name: d.category.name, url: local(d.category.url)} : null,
    brand: d.brand ? {id: Number((String(d.brand.url).match(/brand-(\d+)/) || [])[1]), name: d.brand.name, url: local(d.brand.url), logo: d.brand.logo} : null,
    notify_availability: {channels: ['email'], subscribed: false},
  };
}
const remember = list => (Array.isArray(list) ? list : []).filter(p => p && p.id).map(p => (products[Number(p.id)] ||= productOf(p), Number(p.id)));
remember(src.latest);
remember(src.offers);
const categoryProducts = {};
for (const [id, list] of Object.entries(src.categoryProducts)) categoryProducts[id] = remember(list);

/* ----------------------------------------------------------- categories */
const catId = url => Number((String(url).match(/\/c(\d+)$/) || [])[1]);
const categories = {};
(function walk(list, parent) {
  (list || []).forEach(c => {
    const id = catId(c.url);
    if (!id) return;
    const subs = (c.sub_categories || c.children || []).filter(s => catId(s.url));
    categories[id] = {id, name: c.name, slug: decodeURIComponent(String(c.url).replace(ORIGIN, '')).split('/')[0], url: local(c.url), image: c.image || '', description: '',
      sub_categories: subs.map(s => ({id: catId(s.url), name: s.name, url: local(s.url), image: s.image || ''}))};
    walk(subs, id);
  });
})(src.categories);
const allCategories = Object.values(categories);
const category = id => categories[id];

/* --------------------------------------------------------------- brands */
const brandsHtml = pagesSrc['https://moodyul.com/ar/brands'].main;
const brands = [...brandsHtml.matchAll(/<a[^>]+href="(https:\/\/moodyul\.com\/ar\/[^"]*brand-(\d+))"[\s\S]*?<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"/g)]
  .map(([, url, id, logo, name]) => ({id: Number(id), name, url: local(url), logo, slug: decodeURIComponent(url.replace(ORIGIN, '')).split('/')[0]}))
  .filter((b, i, all) => all.findIndex(x => x.id === b.id) === i);
const brandProducts = Object.fromEntries(brands.map(b => [b.id, Object.values(products).filter(p => p.brand && Number(p.brand.id) === b.id).map(p => p.id)]));

/* ----------------------------------------------------------------- blog */
// "١٢ سبتمبر ٢٠٢٦" -> "2026-09-12" (Salla gives the theme a date the |date filter formats).
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function isoDate(text) {
  const m = String(text).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
  const month = m ? MONTHS.indexOf(m[2]) : -1;
  return month < 0 ? '' : `${m[3]}-${String(month + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}
// The dump holds Salla's hydrated embeds; the article body Salla gives the theme has the bare tag.
const unhydrate = html => String(html || '').replace(/<salla-product-card-embed([^>]*?)\sclass="hydrated"([^>]*)>[\s\S]*?<\/salla-product-card-embed>/g, '<salla-product-card-embed$1$2></salla-product-card-embed>')
  .replace(/ xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/g, '');
const articles = blogSrc.articles.filter(a => !a.error).map(a => {
  const id = Number((a.url.match(/a-(\d+)/) || [])[1]);
  return {id, title: a.title, url: local(a.url), image: {url: a.cover || a.image || '', alt: a.title}, has_image: !!(a.cover || a.image),
    summary: (a.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180), body: unhydrate(a.content),
    created_at: isoDate((a.text.match(/^[^\n]+/) || [''])[0]), author: {name: src.store.name, url: STORE + 'blog'},
    tags: (a.tags || []).map(name => ({name, url: STORE + 'blog'}))};
});
articles.forEach(a => { a.related = articles.filter(x => x.id !== a.id).slice(0, 3).map(({related, body, ...rest}) => rest); });

// Salla gives the footer the store description as plain text.
const plain = html => String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

/* ---------------------------------------------------------------- menus */
const menu = items => (items || []).map(m => ({title: m.title, url: local(m.url), image: m.image || '', children: menu(m.children)}));
const header = menu(src.header);
const footerItems = menu(src.footer).filter(m => m.title);
const about = {id: 500001, title: 'عن المتجر', slug: 'about', url: STORE + 'about/page-500001', content: src.store.description};
footerItems.forEach(m => { if (m.title === 'عن المتجر') m.url = about.url; });
const half = Math.ceil(footerItems.length / 2);
const footer = [{title: 'روابط مهمة', url: '#', children: footerItems.slice(0, half)}, {title: 'خدمة العملاء', url: '#', children: footerItems.slice(half)}];

/* ------------------------------------------------------ home sections */
const section = id => src.sections.find(s => String(s.id) === String(id)) || {};
const selected = id => JSON.parse((section(id).lists || [])[0]?.value || '[]').map(Number).filter(i => products[i]);
const firstLine = id => (section(id).text || '').split('\n').map(s => s.trim()).filter(Boolean);
const hero = section('2126745300');
const testimonials = section('1471184653');
const featureLines = firstLine('101600930');
const onSale = (categoryProducts[1851351371] || []).filter(i => products[i].is_on_sale);
const cameraTabs = [476253540, 951809260, 143148531, 40332069].filter(id => category(id) && (categoryProducts[id] || []).length);

const components = [
  {path: 'home.palace-hero', component: {autoplay: true, full_width: true, slides: hero.imgs.map(i => ({image: i.src, url: local(i.href) || '', title: ''}))}},
  {path: 'home.palace-categories', component: {title: 'تسوّق بالاقسام', autoplay: false, categories: allCategories.filter(c => c.image)}},
  {path: 'home.palace-offers', component: {title: 'عروض اليوم الوطني', products: onSale.map(id => ({id})), display_all_url: category(1851351371)?.url, more_text: 'عرض الكل',
    offer_end: '', hide_offer_date: !onSale.some(id => products[id].discount_ends), autoplay: true, limit: 14}},
  {path: 'home.palace-products', component: {title: firstLine('1416843563')[0] || 'كاميرات الطاقة الشمسية', products: selected('1416843563').map(id => ({id})),
    display_all_url: category(476253540)?.url, more_text: 'عرض الكل', per_row: 'five', autoplay: true, limit: 24}},
  {path: 'home.palace-tabs', component: {title: 'تسوق حسب الفئة', limit: 10, more_text: 'عرض الكل', categories: cameraTabs.map(category)}},
  {path: 'home.palace-products', component: {title: firstLine('153441385')[0] || 'باقات Hivision', products: selected('153441385').map(id => ({id})), display_all_url: '', per_row: 'four', autoplay: false, limit: 8}},
  {path: 'home.palace-video', component: {title: 'شاهد فريقنا أثناء التركيب', youtube: (section('154579371').youtube || [])[0] || ''}},
  {path: 'home.palace-products', component: {title: firstLine('28208001')[0] || 'باقات wifi', products: selected('28208001').map(id => ({id})), display_all_url: '', per_row: 'four', autoplay: false, limit: 8}},
  {path: 'home.palace-brands', component: {title: 'تصفح من خلال العلامات التجارية', brands, display_all_url: STORE + 'brands'}},
  {path: 'home.palace-testimonials', component: {title: 'آراء العملاء', items: testimonials.imgs.map((img, i) => ({name: img.alt, avatar: img.src, stars: 5,
    text: ['من أفضل متاجر المراقبة، توصيل سريع والتركيب تم في نفس اليوم', 'تجربة ممتازة وخدمة احترافية، الفريق شرح لي تشغيل الكاميرات من الجوال', 'أسعار مناسبة والكاميرات بجودة عالية، أنصح بالتعامل معهم'][i % 3]}))}},
  {path: 'home.palace-columns', component: {limit: 3, categories: [309152175, 476253540, 621191203, 562953594].map(category).filter(Boolean)}},
  {path: 'home.palace-features', component: {items: [0, 2, 4].map((i, n) => ({title: featureLines[i] || '', text: featureLines[i + 1] || '', icon: ['brands', 'team', 'delivery'][n]}))}},
];

/* ------------------------------------------------ sample account data */
// Preview only: a signed-in customer so the account pages can be seen. No real customer data.
const sampleItems = Object.values(products).slice(0, 3);
const orders = [
  {id: 900001, reference_id: 245871, created_at: '2026-09-18', total: {amount: sampleItems[0].price + sampleItems[1].price}, status: {name: 'تم التنفيذ', color: '#29a56c'}, items: sampleItems.slice(0, 2)},
  {id: 900002, reference_id: 245903, created_at: '2026-09-26', total: {amount: sampleItems[2].price}, status: {name: 'جاري التوصيل', color: '#f59e0b'}, items: sampleItems.slice(2, 3)},
].map(o => ({...o, url: STORE + 'orders/order/' + o.id, items: o.items.map(p => ({name: p.name, image: p.image.url, quantity: 1, price: {amount: p.price}, total: {amount: p.price}, product: {url: p.url}}))}));

const listingFilters = {all: src.filters || []};
for (const id of Object.keys(categoryProducts)) listingFilters[id] = src.filters || [];

const fixture = {
  source: 'https://moodyul.com/ (public Salla storefront)',
  store: {
    name: src.store.name, logo: src.store.logo, url: STORE, description: plain(src.store.description),
    social: {twitter: src.store.social?.twitter, youtube: src.store.social?.youtube},
    contacts: {whatsapp: src.store.contacts?.whatsapp, mobile: src.store.contacts?.mobile, email: src.store.contacts?.email},
    tax: {number: src.store.settings?.tax?.number, certificate: src.store.settings?.tax?.certificate},
  },
  settings: {
    palace_announcements: ['مرخص من الهيئة العليا للأمن الصناعي', 'توصيل لكل المناطق داخل المملكة', 'ضمان معتمد على جميع الأنظمة'].join('\n'),
    palace_logo_dark: src.store.logo,
    palace_footer_logo: src.store.logo,
    palace_footer_logo_white: false, // the moodyul logo has an opaque background
    palace_footer_color: '#2b3990',
    palace_working_hours: '9 صباحاً حتى 11 مساءً',
    palace_country_code: 'SA',
    palace_cr_number: src.store.settings?.commercial_number || '',
    palace_ecommerce_number: src.store.settings?.certificate?.id || '',
  },
  menus: {header, footer},
  components,
  products,
  categoryProducts,
  listings: {categories, products: {...categoryProducts, ...brandProducts}, filters: listingFilters, all: Object.keys(products).map(Number)},
  blog: {articles},
  brands,
  pages: [about],
  customer: {user: {type: 'user', first_name: 'عبدالله', last_name: 'الأحمد', email: 'customer@example.com', mobile: '+966500000000', avatar: ''}, orders},
};
fs.writeFileSync(path.join(root, 'local-preview/fixture.json'), JSON.stringify(fixture));
console.log(`Moodyul fixture: ${components.length} sections, ${Object.keys(products).length} products, ${allCategories.length} categories, ${brands.length} brands, ${articles.length} articles.`);
