// Products per moodyul category (numeric ids from category URLs), plus brands and the blog list.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
(async () => {
  const home = JSON.parse(fs.readFileSync('moody-home.json', 'utf8'));
  const ids = [];
  (function walk(list) { (list || []).forEach(c => { const m = String(c.url || '').match(/\/c(\d+)$/); if (m) ids.push(Number(m[1])); walk(c.sub_categories || c.children); }); })(home.categories);
  const b = await puppeteer.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new'});
  const p = await b.newPage();
  await p.goto('https://moodyul.com/ar', {waitUntil: 'networkidle2', timeout: 120000});
  await p.evaluate(() => window.salla.onReady());
  home.categoryProducts = await p.evaluate(async ids => {
    const out = {};
    for (const id of ids) {
      try {
        let res = await window.salla.product.api.fetch({source: 'categories', source_value: [id], per_page: 40, with: ['images']});
        out[id] = res.data || [];
      } catch (e) { out[id] = {error: String(e.message || e)}; }
    }
    return out;
  }, ids);
  home.filters = await p.evaluate(async id => {
    try { return (await window.salla.product.api.fetch({source: 'categories', source_value: [id], per_page: 1, filterable: 1})).filters; } catch (e) { return String(e.message || e); }
  }, ids[0]);
  fs.writeFileSync('moody-home.json', JSON.stringify(home, null, 1));
  // Brands page and a blog article.
  const pages = JSON.parse(fs.readFileSync('moody-pages.json', 'utf8'));
  for (const url of ['https://moodyul.com/ar/brands']) {
    await p.goto(url, {waitUntil: 'networkidle2', timeout: 90000});
    pages[url] = await p.evaluate(() => ({title: document.title, main: (document.querySelector('main') || document.body).innerHTML}));
  }
  fs.writeFileSync('moody-pages.json', JSON.stringify(pages));
  console.log(Object.entries(home.categoryProducts).map(([k, v]) => k + ':' + (v.length ?? v.error)).join(' '));
  await b.close();
})();
