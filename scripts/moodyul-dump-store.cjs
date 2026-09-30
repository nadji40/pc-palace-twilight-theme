// Dump the public moodyul.com Salla storefront (store, menus, categories, products, home sections, blog, pages).
const puppeteer = require('puppeteer-core');
const fs = require('fs');
(async () => {
  const b = await puppeteer.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new'});
  const p = await b.newPage();
  await p.setViewport({width: 1440, height: 900});
  await p.goto('https://moodyul.com/ar', {waitUntil: 'networkidle2', timeout: 120000});
  await new Promise(r => setTimeout(r, 4000));
  const home = await p.evaluate(async () => {
    const s = window.salla;
    await s.onReady();
    const safe = async f => { try { return await f(); } catch (e) { return {error: String(e && e.message || e)}; } };
    const out = {};
    out.store = s.config.get('store');
    out.theme = s.config.get('theme');
    out.header = await safe(async () => (await s.api.component.getMenus('header')).data);
    out.footer = await safe(async () => (await s.api.component.getMenus('footer')).data);
    out.categories = await safe(async () => (await s.product.api.categories()).data);
    const fetchAll = async params => {
      let res = await s.product.api.fetch({...params, per_page: 60, with: ['images']});
      let all = res.data || [];
      let next = res.cursor && res.cursor.next, n = 0;
      while (next && n++ < 6) { res = await s.api.request(next); all = all.concat(res.data || []); next = res.cursor && res.cursor.next; }
      return all;
    };
    out.latest = await safe(() => fetchAll({source: 'latest'}));
    out.offers = await safe(() => fetchAll({source: 'offers'}));
    out.reviews = await safe(async () => (await s.api.component.getReviews({source: 'store', limit: 20})).data);
    // Home sections as rendered by the store's current theme.
    out.sections = [...document.querySelectorAll('[component-id]')].map(sec => {
      const imgs = [...sec.querySelectorAll('img')].map(i => ({src: i.currentSrc || i.src || i.dataset.src, alt: i.alt, href: i.closest('a') && i.closest('a').href})).filter(i => i.src && !i.src.startsWith('data:'));
      const bg = [...sec.querySelectorAll('[style*="background-image"]')].map(e => (e.getAttribute('style').match(/url\(["']?([^"')]+)/) || [])[1]).filter(Boolean);
      const lists = [...sec.querySelectorAll('salla-products-list, salla-products-slider')].map(l => ({tag: l.tagName.toLowerCase(), source: l.getAttribute('source'), value: l.getAttribute('source-value'), limit: l.getAttribute('limit'), title: l.getAttribute('block-title')}));
      return {id: sec.getAttribute('component-id'), class: sec.className, title: (sec.querySelector('h2, h3, .s-block__title h2') || {}).textContent, text: sec.innerText.slice(0, 3000), imgs: imgs.slice(0, 40), bg, lists,
        links: [...sec.querySelectorAll('a[href]')].slice(0, 40).map(a => ({href: a.href, text: a.textContent.trim().slice(0, 80)})),
        youtube: [...sec.querySelectorAll('[videoid], lite-youtube, iframe')].map(v => v.getAttribute('videoid') || v.src)};
    });
    out.faq = [...document.querySelectorAll('details, .faq-item, [class*=faq] [class*=item]')].map(d => d.innerText.trim()).slice(0, 20);
    return out;
  });
  // Product details (images, options, description) for every product seen.
  const ids = [...new Set([...(home.latest.map ? home.latest : []), ...(home.offers.map ? home.offers : [])].map(x => x.id))];
  home.details = await p.evaluate(async ids => {
    const out = {};
    for (const id of ids) {
      try { out[id] = (await window.salla.product.api.getDetails(id, ['images', 'options', 'rating', 'category', 'brand', 'tags'])).data; } catch (e) { out[id] = {error: String(e.message || e)}; }
    }
    return out;
  }, ids);
  // Category products.
  home.categoryProducts = await p.evaluate(async cats => {
    const out = {};
    const flat = [];
    (function walk(list) { (list || []).forEach(c => { flat.push(c); walk(c.sub_categories || c.children); }); })(cats);
    for (const c of flat) {
      try { out[c.id] = ((await window.salla.product.api.fetch({source: 'categories', source_value: [c.id], per_page: 40})).data || []).map(x => x.id); } catch (e) { out[c.id] = []; }
    }
    return out;
  }, Array.isArray(home.categories) ? home.categories : []);
  fs.writeFileSync('moody-home.json', JSON.stringify(home, null, 1));
  // Blog and one content page (HTML).
  const pages = {};
  for (const path of ['https://moodyul.com/ar/blog', 'https://moodyul.com/ar/categories']) {
    try { await p.goto(path, {waitUntil: 'networkidle2', timeout: 90000}); pages[path] = await p.evaluate(() => ({title: document.title, main: (document.querySelector('main') || document.body).innerHTML})); } catch (e) { pages[path] = {error: String(e)}; }
  }
  fs.writeFileSync('moody-pages.json', JSON.stringify(pages));
  console.log('products', ids.length, 'categories', Array.isArray(home.categories) ? home.categories.length : home.categories, 'sections', home.sections.length);
  await b.close();
})();
