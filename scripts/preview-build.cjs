/*
 * Local preview of the actual Twig theme. Renders src/views with Twig.js using the store data in
 * local-preview/fixture.json (moodyul.com by default: scripts/build-moodyul-fixture.cjs), then swaps
 * Salla's runtime for local-preview/sdk-fixture.js. No page markup lives here.
 *
 *   pnpm production && pnpm preview:build
 *   python -m http.server 4173 --bind 127.0.0.1   (from the parent directory)
 *   http://127.0.0.1:4173/salla-pcpalace-theme/local-preview/
 */
const fs = require('fs');
const path = require('path');
const Twig = require('twig');

const root = path.resolve(__dirname, '..');
const views = path.join(root, 'src/views');
const fixturePath = path.join(root, 'local-preview/fixture.json');
if (!fs.existsSync(fixturePath)) require('./build-moodyul-fixture.cjs');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const locales = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/ar.json'), 'utf8'));

const PUBLIC = '/salla-pcpalace-theme/public/';
const PREVIEW = '/salla-pcpalace-theme/local-preview/';
const STORE = fixture.store.url;
const asset = p => PUBLIC + String(p).replace(/^\/+/, '');
// Salla supplies its shared strings (pages.*, common.*, blocks.*) at runtime; the preview carries the Arabic ones the theme uses.
const sallaStrings = {
  'common.elements.email': 'البريد الإلكتروني', 'common.elements.mobile': 'رقم الجوال', 'common.elements.save': 'حفظ', 'common.titles.support': 'الدعم',
  'pages.profile.first_name': 'الاسم الأول', 'pages.profile.last_name': 'الاسم الأخير', 'pages.profile.birthday': 'تاريخ الميلاد', 'pages.profile.gender': 'الجنس',
  'pages.profile.gender_placeholder': 'اختر الجنس', 'pages.profile.male': 'ذكر', 'pages.profile.female': 'أنثى',
  'pages.orders.non_orders': 'لا توجد طلبات', 'pages.brands.non_brands': 'لا توجد ماركات', 'pages.categories.sorting': 'ترتيب',
  'blocks.comments.submit': 'إرسال', 'blocks.home.display_all': 'عرض الكل', 'blocks.home.latest_products': 'أحدث المنتجات', 'blocks.home.testimonials': 'آراء العملاء',
};
const trans = key => key.split('.').reduce((o, k) => o?.[k], locales) ?? sallaStrings[key] ?? key;
// Salla storefront routes, under the preview store URL.
const links = {'cart': 'cart', 'search': 'search', 'offers': 'offers', 'products': 'products', 'categories': 'categories', 'blog': 'blog', 'brands': 'brands',
  'customer.wishlist': 'wishlist', 'customer.profile': 'profile', 'customer.orders': 'orders', 'customer.notifications': 'notifications', 'customer.wallet': 'wallet'};
// Salla's listing sort options (sort_options in Twig).
const sortOptions = [['ourSuggest', 'مقترحاتنا'], ['bestSell', 'الأكثر مبيعاً'], ['topRated', 'الأعلى تقييماً'], ['priceFromTopToLow', 'السعر من الأعلى للأقل'], ['priceFromLowToTop', 'السعر من الأقل للأعلى']]
  .map(([id, name], i) => ({id, name, is_selected: i === 0}));
const arabicDate = new Intl.DateTimeFormat('ar', {day: 'numeric', month: 'long', year: 'numeric', numberingSystem: 'latn'});

let activePage = 'index';
Twig.extendFilter('asset', asset);
Twig.extendFilter('cdn', v => v);
Twig.extendFilter('trans', trans);
Twig.extendFilter('money', n => Number(n?.amount ?? n ?? 0).toLocaleString('en-US') + ' ر.س');
// Salla's |date: a PHP-style format when given ("now"|date('Y')), otherwise a long Arabic date.
Twig.extendFilter('date', (v, args = []) => {
  const d = v == null || v === 'now' ? new Date() : new Date(v);
  if (isNaN(d)) return String(v ?? '');
  if (!args[0]) return arabicDate.format(d);
  const pad = n => String(n).padStart(2, '0');
  const parts = {Y: d.getFullYear(), y: String(d.getFullYear()).slice(2), m: pad(d.getMonth() + 1), n: d.getMonth() + 1, d: pad(d.getDate()), j: d.getDate()};
  return String(args[0]).replace(/[Yymndj]/g, c => parts[c]);
});
Twig.extendFunction('trans', trans);
Twig.extendFunction('link', name => STORE + (links[name] ?? name));
Twig.extendFunction('is_page', slug => slug === activePage);
Twig.extendFunction('pluralize', trans);

const settings = {get: (key, fallback = null) => key in fixture.settings ? fixture.settings[key] : fallback, set: () => ''};
const guest = {type: 'guest', can_access_wallet: false};
const context = {
  language: {code: 'ar'},
  theme: {is_rtl: true, settings, font: {name: 'Almarai', path: ''}, color: {primary: '#2b3990', darker: () => '#202a70', lighter: () => '#5765b5', reverse_text: '#fff'}},
  store: {...fixture.store, settings: {is_multilingual: true, currencies_enabled: false, tax: fixture.store.tax, cart: {apply_coupon_enabled: true}, blog: {allow_likes_and_comments: false}}},
  user: guest,
};

const registered = new Set();
function register(id) {
  if (registered.has(id)) return;
  registered.add(id);
  let source = fs.readFileSync(path.join(views, id + '.twig'), 'utf8')
    .replace(/{%\s*hook\s+[^%]*%}/g, '')
    .replace(/{%\s*component\s+home\s*%}/g, '{{ preview_home()|raw }}')
    .replace(/{%\s*component\s+['"]([^'"]+)['"]\s*%}/g, (_, name) => `{% include "components/${name.replace(/\./g, '/')}" %}`)
    .replace(/(extends|include)\s+['"]([a-zA-Z0-9_.\/-]+)['"]/g, (_, tag, name) => `${tag} "${name.replace(/\./g, '/')}"`);
  for (const match of source.matchAll(/{%\s*(?:extends|include)\s+"([^"]+)"/g)) register(match[1]);
  Twig.twig({id, data: source, allowInlineIncludes: true, rethrow: true, autoescape: true});
}

// Salla renders each merchant-configured home component with its settings as `component`.
Twig.extendFunction('preview_home', () => fixture.components.map((entry, position) => {
  const id = 'components/' + entry.path.replace(/\./g, '/');
  register(id);
  return Twig.twig({ref: id}).render({...context, component: entry.component, position, componentId: `preview-${position}`});
}).join('\n'));

register('layouts/master');

// Replace Salla's runtime with the local stand-in; keep the theme's own stylesheets and script.
function finish(html, view, title) {
  return html
    .replace(/<script\b(?![^>]*data-palace-keep)[^>]*>[\s\S]*?<\/script>/g, '')
    .replace(/<link[^>]+href="(?:|fonts\/sallaicons\.css)"[^>]*>/g, '')
    .replace('</head>', `<title>${title}</title>
<script defer src="${PREVIEW}sdk-fixture.js"></script>
<script defer src="${asset('palace-reference.js')}"></script>
</head>`)
    .replace('</body>', `<script>document.documentElement.dataset.previewSource = "src/views/${view}.twig";</script>\n</body>`);
}
const storeDir = path.join(root, 'local-preview/store');
const rendered = [];
function page(url, view, data, title) {
  activePage = data.page?.slug || '';
  register(view);
  const html = finish(Twig.twig({ref: view}).render({...context, ...data}), view, title === fixture.store.name ? title : `${title} - ${fixture.store.name}`);
  const rel = decodeURIComponent(url.slice(STORE.length)).replace(/[?#].*$/, '');
  const file = path.join(storeDir, rel, 'index.html');
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, html);
  rendered.push(view);
  return html;
}

fs.rmSync(storeDir, {recursive: true, force: true});

// Home.
const home = page(STORE, 'pages/index', {page: {slug: 'index', title: fixture.store.name}}, fixture.store.name);
fs.writeFileSync(path.join(root, 'local-preview/index.html'), home);
fs.writeFileSync(path.join(root, '../local-preview/index.html'), home); // also served at http://127.0.0.1:4173/local-preview/

// Listings (pages/product/index.twig): categories, offers, latest, all products, search.
const listing = {filters: true, sort_options: sortOptions, search_query: null, category: null};
for (const category of Object.values(fixture.listings.categories)) {
  page(category.url, 'pages/product/index', {...listing, category, page: {slug: 'product.index', id: category.id, title: category.name}}, category.name);
}
for (const [dir, slug, title] of [['offers', 'product.index.offers', 'التخفيضات'], ['latest-products', 'product.index.latest', 'وصل حديثاً'], ['products', 'product.index.latest', trans('palace.all_products_title')], ['search', 'product.index.search', 'نتائج البحث']]) {
  page(STORE + dir, 'pages/product/index', {...listing, page: {slug, id: null, title}}, title);
}

// Products (pages/product/single.twig).
for (const product of Object.values(fixture.products)) {
  page(product.url, 'pages/product/single', {product, page: {slug: 'product.single', id: product.id, title: product.name}}, product.name);
}

// Brands.
const grouped = {};
for (const brand of fixture.brands || []) (grouped[brand.name[0].toUpperCase()] ||= []).push(brand);
page(STORE + 'brands', 'pages/brands/index', {brands: grouped, page: {slug: 'brands.index', title: trans('palace.brands')}}, trans('palace.brands'));
for (const brand of fixture.brands || []) {
  page(brand.url, 'pages/brands/single', {brand: {...brand, description: ''}, sort_options: sortOptions, page: {slug: 'brands.single', id: brand.id, title: brand.name}}, brand.name);
}

// Blog and content pages.
page(STORE + 'blog', 'pages/blog/index', {articles: fixture.blog?.articles || [], categories: [], page: {slug: 'blog.index', title: trans('palace.blog')}}, trans('palace.blog'));
for (const article of fixture.blog?.articles || []) {
  page(article.url, 'pages/blog/single', {article, page: {slug: 'blog.single', title: article.title}}, article.title);
}
for (const content of fixture.pages || []) {
  page(content.url, 'pages/page-single', {page: {...content, slug: 'page-single'}}, content.title);
}

// Cart: a sample cart so the page can be seen (the preview has no cart backend).
const cartProducts = Object.values(fixture.products).filter(p => !p.is_out_of_stock).slice(0, 3);
const items = cartProducts.map((p, i) => ({id: 800001 + i, product_id: p.id, product_name: p.name, product_image: p.image.url, url: p.url, quantity: i + 1,
  price: p.price, total: p.price * (i + 1), max_quantity: 10, is_available: true, options: []}));
const subTotal = items.reduce((sum, item) => sum + item.total, 0);
page(STORE + 'cart', 'pages/cart', {page: {slug: 'cart', title: trans('palace.cart')}, cart: {id: 'preview', items, sub_total: subTotal, discount: 0, total: subTotal, tax_amount: 0, coupon: '',
  is_require_shipping: true, has_shipping: false, free_shipping_bar: {minimum_amount: 2000, percent: Math.min(100, Math.round(subTotal / 20)), remaining: Math.max(0, 2000 - subTotal), has_free_shipping: subTotal >= 2000}}}, trans('palace.cart'));

// Account pages, as a signed-in sample customer.
if (fixture.customer) {
const customer = {user: {...fixture.customer.user, can_access_wallet: false}};
page(STORE + 'profile', 'pages/customer/profile', {...customer, custom_fields: [], page: {slug: 'customer.profile', title: trans('palace.profile')}}, trans('palace.profile'));
page(STORE + 'orders', 'pages/customer/orders/index', {...customer, orders: fixture.customer.orders, page: {slug: 'customer.orders', title: trans('palace.orders')}}, trans('palace.orders'));
for (const order of fixture.customer.orders) {
  page(order.url, 'pages/customer/orders/single', {...customer, order: {...order, sub_total: order.total, can_reorder: true, can_rate: true}, page: {slug: 'customer.orders', title: trans('palace.orders')}}, trans('palace.orders'));
}
page(STORE + 'wishlist', 'pages/customer/wishlist', {...customer, page: {slug: 'customer.wishlist', title: trans('palace.wishlist')}}, trans('palace.wishlist'));
page(STORE + 'notifications', 'pages/customer/notifications', {...customer, notifications: [
  {is_new: true, url: fixture.customer.orders[1].url, title: 'تم شحن طلبك #' + fixture.customer.orders[1].reference_id, sub_title: 'طلبك في الطريق إليك', date: 'منذ ساعتين'},
  {is_new: false, url: fixture.customer.orders[0].url, title: 'تم تنفيذ طلبك #' + fixture.customer.orders[0].reference_id, sub_title: 'شكراً لتسوقك معنا', date: 'منذ 12 يوم'},
], page: {slug: 'customer.notifications', title: trans('palace.notifications')}}, trans('palace.notifications'));
}

fs.writeFileSync(path.join(root, 'local-preview/render-report.json'), JSON.stringify({
  store: fixture.source,
  templates: [...new Set(rendered)].map(v => `src/views/${v}.twig`),
  pages: rendered.length,
  styles: ['public/app.css', 'public/palace-reference.css'],
  scripts: ['public/palace-reference.js', 'local-preview/sdk-fixture.js'],
  data: 'local-preview/fixture.json',
  builtAt: new Date().toISOString(),
}, null, 2));
console.log(`Rendered the Twig theme: ${rendered.length} pages (${[...new Set(rendered)].length} templates) -> local-preview/store/`);
