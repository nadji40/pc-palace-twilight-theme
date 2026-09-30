/*
 * Builds local-preview/fixture.json from the saved PC Palace homepage (../pcpalace-theme/index.html).
 *
 * The reference page embeds each homepage section's settings as JSON. This script turns them into
 * the data a Salla store would provide: component settings for the Twig templates, header/footer
 * menus, and Salla-shaped product objects for the storefront SDK stand-in (sdk-fixture.js).
 * Merchant media keeps its original URLs, exactly as the reference page loads them.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const refHtml = fs.readFileSync(path.resolve(root, '../pcpalace-theme/index.html'), 'utf8');

const decode = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const cdn = url => !url ? '' : url.includes('/cdn-cgi/image/') ? url : `https://media.zid.store/cdn-cgi/image/q=85,f=auto/${url}`;

const sections = [...refHtml.matchAll(/<(main-slider|categories-section|banners-section|products-offers|products-tabs|products-grids|products-columns)\s+id="([^"]+)"\s+settings='([^']*)'/g)]
  .map(([, type, id, json]) => ({type, id, settings: JSON.parse(decode(json))}));

/* ------------------------------------------------------------ products */
const products = {};
const categoryProducts = {};

// Salla option ids are numbers.
let nextOptionId = 700001;
const optionsOf = z => (z.custom_option_fields || []).map(field => ({
  id: nextOptionId++, name: String(field.label || '').trim(), type: field.can_choose_multiple_options ? 'multiple-options' : 'single-option',
  required: !!field.is_required, placeholder: String(field.hint || '').trim(),
  details: (field.choices || []).map(choice => ({id: nextOptionId++, name: choice.name, additional_price: Number(choice.price || 0), is_out: false})),
}));

function productOf(z) {
  const images = (z.images || []).map(i => cdn(i.image?.medium)).filter(Boolean);
  const category = (z.categories || [])[0];
  const onSale = !!z.formatted_sale_price;
  const body = z.badge?.body;
  const short = typeof z.short_description === 'string' ? z.short_description.trim() !== ''
    : !!(z.short_description && Object.values(z.short_description).some(v => v && v.trim() !== ''));
  return {
    id: z.id,
    name: z.name,
    url: z.html_url,
    image: {url: images[0] || '', alt: z.name},
    images: images.map(url => ({url})),
    price: onSale ? z.sale_price : z.price,
    sale_price: onSale ? z.sale_price : 0,
    regular_price: z.price,
    is_on_sale: onSale,
    discount_percentage: z.sale_price ? (z.discount_percentage || Math.round((z.price - z.sale_price) / z.price * 100)) : null,
    promotion_title: body ? (body.ar || body.en || '') : '',
    subtitle: short ? z.short_description : '',
    description: z.description || (short ? z.short_description : ''),
    sku: z.sku || '',
    category: category ? {id: String(category.id), name: typeof category.name === 'object' ? category.name.ar : category.name, url: `https://pcpalace.com.sa/categories/${category.id}/${category.slug || ''}`} : null,
    max_quantity: z.is_infinite ? 99 : Math.max(1, Math.min(99, z.quantity || 1)),
    options: optionsOf(z),
    notify_availability: {channels: ['sms', 'email'], subscribed: false},
    rating: {stars: z.rating?.average || 0, count: z.rating?.total_count || 0},
    is_out_of_stock: !(z.quantity > 0 || z.is_infinite),
    is_available: z.quantity > 0 || z.is_infinite,
    has_options: z.structure !== 'standalone' || !!z.has_fields || !!z.has_options,
    type: 'product',
  };
}

function remember(list) {
  return (list || []).filter(z => z && z.id).map(z => {
    products[z.id] ||= productOf(z);
    return z.id;
  });
}

const listOf = holder => Array.isArray(holder) ? holder : holder?.results || (Array.isArray(holder?.products) ? holder.products : holder?.products?.results) || [];
const categoryOf = c => ({id: c.id, name: c.name, url: c.url || `https://pcpalace.com.sa/categories/${c.id}/${c.slug || ''}`, image: cdn(c.image)});

/* ---------------------------------------------------------- components */
const components = sections.map(({type, id, settings: s}, index) => {
  // A category can appear in several sections with different product lists; key the preview lists per section.
  const keyed = category => ({...category, id: `${category.id}@${index}`});
  switch (type) {
    case 'main-slider':
      return {path: 'home.palace-hero', component: {autoplay: !!s.autoplay, full_width: !!s.full_width,
        slides: s.slider.map(x => ({image: cdn(x.image), mobile_image: x.image_mobile ? cdn(x.image_mobile) : '', url: x.link || '', title: x.title || ''}))}};
    case 'categories-section':
      return {path: 'home.palace-categories', component: {title: s.title || '', autoplay: !!s.autoplay,
        categories: s.categories.filter(x => x.category).map(x => ({...categoryOf(x.category), image: x.image ? cdn(x.image) : cdn(x.category.image)}))}};
    case 'banners-section':
      return {path: 'home.palace-banners', component: {columns: s.display_type === 'full' ? 1 : s.display_type === 'two_columns' ? 2 : s.display_type === 'three_columns' ? 3 : 4,
        horizontal_mobile: s.options_design === 'horizantal', banners: s.ads.map(x => ({image: cdn(x.image), url: x.link || '', title: x.title || '', subtitle: x.subtitle || ''}))}};
    case 'products-offers': {
      const ids = remember(s.products.map(x => x.product));
      s.products.forEach(x => { if (x.product?.id) products[x.product.id].discount_ends = x.offer_date; });
      return {path: 'home.palace-offers', component: {title: s.title, products: ids.map(i => ({id: i})), display_all_url: s.display_more ? s.more_url : '',
        more_text: s.more_text, offer_end: s.products[0]?.offer_date || '', hide_offer_date: !!s.products[0]?.hide_offer_date, autoplay: !!s.autoplay, limit: ids.length}};
    }
    case 'products-tabs':
      return {path: 'home.palace-tabs', component: {title: s.title, limit: s.categories[0]?.max || 10, more_text: s.categories[0]?.more_text || 'عرض الكل',
        categories: s.categories.map(x => {
          const category = keyed(categoryOf(x.category));
          categoryProducts[category.id] = remember(listOf(x.category.products));
          return {...category, url: x.more_url || category.url};
        })}};
    case 'products-grids': {
      const holder = s.products || {};
      let category = null;
      if (holder.id) { category = keyed(categoryOf(holder)); categoryProducts[category.id] = remember(listOf(holder.products)); }
      const ids = holder.id ? [] : remember(listOf(holder));
      return {path: 'home.palace-products', component: {title: s.title, products: ids.map(i => ({id: i})), category, display_all_url: s.display_more ? s.more_url : '',
        more_text: s.more_text, per_row: s.products_count || 'five', autoplay: !!s.autoplay, limit: 24}};
    }
    case 'products-columns':
      return {path: 'home.palace-columns', component: {limit: s.max || 3, categories: s.nest.map(x => {
        const category = keyed(categoryOf(x.products));
        categoryProducts[category.id] = remember(listOf(x.products.products));
        return category;
      })}};
  }
});

/* -------------------------------------------------------------- menus */
const decodeText = s => decode(s).replace(/\s+/g, ' ').trim();
const nav = refHtml.slice(refHtml.indexOf('<div class="main-menu'), refHtml.indexOf('</nav>', refHtml.indexOf('<div class="main-menu')));
const headerMenu = [...nav.matchAll(/<li>\s*<a href="([^"]*)">([^<]*)<\/a>\s*<\/li>/g)].map(([, url, title]) => ({title: decodeText(title), url, children: []}));
const footerColumns = [...refHtml.matchAll(/<h4 class="widget-title">([^<]*)<\/h4>\s*<ul class="footer-list[^"]*">([\s\S]*?)<\/ul>/g)]
  .map(([, title, list]) => ({title: decodeText(title), url: '#', children: [...list.matchAll(/<a href="([^"]*)">([^<]*)<\/a>/g)].map(([, url, t]) => ({title: decodeText(t), url}))}));

/* ------------------------------------------------------------ listings */
// Category pages: every category object embedded in the reference, with its sub-categories,
// and the products the reference shows for it. The laptops and all-products pages were captured
// in full (pages/category-laptops.html, pages/products.html), including their filters.
const categories = {};
const listingProducts = {};
const addTo = (id, ids) => { listingProducts[id] = [...new Set([...(listingProducts[id] || []), ...ids])]; };
const subOf = c => ({id: String(c.id), name: c.name, url: c.url || `https://pcpalace.com.sa/categories/${c.id}/${c.slug || ''}`, image: c.image || ''});
(function walk(node) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) return node.forEach(walk);
  if (node.id && node.name && 'sub_categories' in node && 'slug' in node) {
    const id = String(node.id);
    const known = categories[id] || {};
    const subs = (node.sub_categories || []).map(subOf);
    // The same category is embedded several times, not always with its description and children.
    categories[id] = {...known, id, name: node.name, slug: node.slug, url: node.url || `https://pcpalace.com.sa/categories/${id}/${node.slug}`,
      description: node.description || known.description || '', image: node.image || known.image || '',
      sub_categories: subs.length ? subs : (known.sub_categories || [])};
    (node.sub_categories || []).forEach(sub => { categories[String(sub.id)] ||= {...subOf(sub), slug: sub.slug, description: sub.description || '', sub_categories: []}; });
    const list = listOf(node.products);
    if (list.length) addTo(id, remember(list));
  }
  Object.values(node).forEach(walk);
})(sections.map(s => s.settings));

const pageCards = file => {
  const page = fs.readFileSync(path.resolve(root, '../pcpalace-theme/pages', file), 'utf8');
  const ids = remember([...page.matchAll(/<product-card\s+[^>]*?product='([^']*)'/g)].map(m => JSON.parse(decode(m[1]))));
  const data = JSON.parse(decode(page.match(/data-filters='([^']*)'/)?.[1] || '{"filters":{}}'));
  const filters = (data.filters.attributes || []).map(a => ({key: a.slug, label: a.name, type: 'values', values: a.data.map(v => ({key: v.value, value: v.value, count: v.count}))}));
  filters.push({key: 'price', label: 'السعر', type: 'range', values: {min: 0, max: 1000}});
  return {ids, filters, total: Number(page.match(/<strong class="text-brand">(\d+)<\/strong>/)?.[1] || ids.length)};
};
const detailPage = fs.readFileSync(path.resolve(root, '../pcpalace-theme/pages/product-detail.html'), 'utf8');
const detail = JSON.parse(decode(detailPage.match(/<product-gallery[^>]*?product='([^']*)'/)[1]));
products[detail.id] = {...productOf(detail), description: detailPage.match(/id="Description">\s*<pre>([\s\S]*?)<\/pre>/)?.[1].trim() || detail.description};
const laptops = pageCards('category-laptops.html');
listingProducts['412823'] = [...new Set([...laptops.ids, ...(listingProducts['412823'] || [])])];
const all = pageCards('products.html');
const listingFilters = {'412823': laptops.filters, all: all.filters};
// Links in the header menu name categories that no captured page describes.
for (const item of headerMenu) {
  const m = item.url.match(/\/categories\/(\d+)/);
  if (m && !categories[m[1]]) categories[m[1]] = {id: m[1], name: item.title, slug: '', url: item.url, description: '', image: '', sub_categories: []};
}
const listings = {
  categories,
  products: listingProducts,
  filters: listingFilters,
  all: [...new Set([...all.ids, ...Object.keys(products)])],
};

/* -------------------------------------------------------------- store */
const store = JSON.parse(refHtml.match(/window\.__vitrinStoreSettings = (\{[\s\S]*?\});\s*\n/)?.[1] || '{}');
const text = re => decodeText(refHtml.match(re)?.[1] || '');
const fixture = {
  source: '../pcpalace-theme/index.html',
  store: {
    name: store.name || 'شركة قصر الحاسبات التجارية',
    logo: 'https://media.zid.store/e4aadd21-62d3-4ecb-b286-5cfefed6d23c/cfed4e6c-ba78-41aa-8475-554a8670d533.png',
    description: text(/<p class="font-lg text-heading">([\s\S]*?)<\/p>/),
    social: {facebook: 'https://www.facebook.com/pcpalace', twitter: 'https://www.twitter.com/pcpalace2', instagram: 'https://www.instagram.com/pcpalace', snapchat: 'https://www.snapchat.com/add/pcpalace', tiktok: 'https://www.tiktok.com/@pcpalace.com'},
    contacts: {whatsapp: '966126500017'},
    tax: {number: text(/<div class="vat-number">\s*<span>[^<]*<\/span>\s*<span>([^<]*)<\/span>/), certificate: 'https://media.zid.store/e4aadd21-62d3-4ecb-b286-5cfefed6d23c/5b0c0a3d-9215-46ce-a8df-6d6cff7a9e26.png'},
  },
  settings: {
    palace_announcements: [...refHtml.matchAll(/<div id="news-flash"[\s\S]*?<\/ul>/g)][0][0].match(/<li[^>]*>([^<]*)<\/li>/g).map(li => decodeText(li.replace(/<[^>]+>/g, ''))).join('\n'),
    palace_logo_dark: 'https://media.zid.store/e4aadd21-62d3-4ecb-b286-5cfefed6d23c/c44ddeb9-6dd6-41de-9a8c-b3d191512d57.png',
    palace_footer_logo: 'https://media.zid.store/e4aadd21-62d3-4ecb-b286-5cfefed6d23c/2724067a-e1d0-4f87-b121-aa86160eeb5d.png',
    palace_footer_color: '#2b3990',
    palace_working_hours: text(/<strong>اوقات العمل:<\/strong>\s*<span>([^<]*)<\/span>/),
    palace_country_code: 'SA',
    palace_app_store_url: 'https://apps.apple.com/app/id6737545437',
    palace_google_play_url: 'https://play.google.com/store/apps/details?id=com.appsbunches.pcpalace',
    palace_cr_number: text(/<div class="commercial_registration_number">\s*<span>[^<]*<\/span>\s*<span>([^<]*)<\/span>/),
    palace_ecommerce_number: text(/certificateRefID=(\d+)/),
  },
  menus: {header: headerMenu, footer: footerColumns},
  components,
  products,
  categoryProducts,
  listings,
};

/* ---------------------------------------------------- Salla data model */
// The preview is a Salla store: numeric product ids, Salla category objects and Salla routes
// (/{slug}/c{id}, /{slug}/p{id}, /offers, /search, /{slug}/page-{id}) under the preview store URL.
const STORE = '/salla-pcpalace-theme/local-preview/store/';
const productIds = new Map(Object.keys(products).map((uuid, i) => [uuid, 1000001 + i]));
const productBySlug = new Map(Object.entries(products).map(([uuid, p]) => [decodeURIComponent(p.url.split('/products/')[1] || ''), productIds.get(uuid)]));
const pageIds = new Map();

function sallaUrl(url) {
  if (typeof url !== 'string') return url;
  const m = url.match(/^(?:https?:\/\/pcpalace\.com\.sa)?(\/[^?#]*)?(\?[^#]*)?$/);
  if (!m || (!m[1] && !url.startsWith('https://pcpalace.com.sa'))) return url;
  const route = (m[1] || '/').replace(/^\/(?:ar|en)(?:-[a-z]{2})?(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  const query = m[2] || '';
  let r;
  if (route === '/') return STORE;
  if (route === '/categories') return STORE + 'categories';
  if ((r = route.match(/^\/categories\/(\d+)(?:\/([^/]+))?$/))) {
    const slug = categories[r[1]]?.slug || r[2] || 'category';
    return `${STORE}${slug}/c${r[1]}`;
  }
  if (route === '/products') return STORE + (/on_sale=on/.test(query) ? 'offers' : 'products');
  if ((r = route.match(/^\/products\/(.+)$/))) {
    const slug = decodeURIComponent(r[1]);
    return `${STORE}${slug}/p${productBySlug.get(slug) || 1000000}`;
  }
  if ((r = route.match(/^\/(?:pages|blogs)\/(.+)$/))) {
    const slug = decodeURIComponent(r[1]).trim().replace(/\s+/g, '-');
    if (!pageIds.has(slug)) pageIds.set(slug, /^\d+$/.test(slug) ? Number(slug) : 500001 + pageIds.size);
    return `${STORE}${slug}/page-${pageIds.get(slug)}`;
  }
  return STORE + route.slice(1) + query;
}

const salla = JSON.parse(JSON.stringify(fixture), (key, value) => {
  if (['url', 'display_all_url'].includes(key)) return sallaUrl(value);
  if (key === 'id' && productIds.has(value)) return productIds.get(value);
  if (Array.isArray(value)) return value.map(v => (productIds.has(v) ? productIds.get(v) : v));
  return value;
});
salla.products = Object.fromEntries(Object.values(salla.products).map(p => [p.id, p]));
// Salla category objects: {id, name, url, description, image, sub_categories[]}.
salla.listings.categories = Object.fromEntries(Object.values(salla.listings.categories).map(c => [c.id, {
  id: Number(c.id), name: c.name, slug: c.slug || 'category', url: c.url, description: c.description, image: c.image,
  sub_categories: c.sub_categories.map(sub => ({id: Number(sub.id), name: sub.name, url: sub.url, image: sub.image})),
}]));
salla.store.url = STORE;

fs.writeFileSync(path.join(root, 'local-preview/fixture.json'), JSON.stringify(salla));
console.log(`Preview fixture: ${components.length} sections, ${Object.keys(products).length} products, ${Object.keys(categories).length} categories, ${headerMenu.length} header links, ${footerColumns.length} footer columns.`);
