// Fetches product details (images, options, description) that local-preview/data/moodyul/store.json lacks.
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const file = path.resolve(__dirname, '../local-preview/data/moodyul/store.json');
(async () => {
  const store = JSON.parse(fs.readFileSync(file, 'utf8'));
  const ids = [...new Set(Object.values(store.categoryProducts).filter(Array.isArray).flat().map(p => String(p.id)))].filter(id => !store.details[id]);
  const b = await puppeteer.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new'});
  const p = await b.newPage();
  await p.goto('https://moodyul.com/ar', {waitUntil: 'networkidle2', timeout: 120000});
  const details = await p.evaluate(async ids => {
    await window.salla.onReady();
    const out = {};
    for (const id of ids) {
      try { out[id] = (await window.salla.product.api.getDetails(Number(id), ['images', 'options', 'rating', 'category', 'brand', 'tags'])).data; } catch (e) { out[id] = {error: String(e.message || e)}; }
    }
    return out;
  }, ids);
  Object.assign(store.details, details);
  fs.writeFileSync(file, JSON.stringify(store, null, 1));
  console.log('fetched', Object.keys(details).length);
  await b.close();
})();
