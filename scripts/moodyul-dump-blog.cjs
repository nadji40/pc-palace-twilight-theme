// Blog articles of moodyul.com (list from /blog, then each article page).
const puppeteer = require('puppeteer-core');
const fs = require('fs');
(async () => {
  const b = await puppeteer.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new'});
  const p = await b.newPage();
  await p.setViewport({width: 1440, height: 900});
  await p.goto('https://moodyul.com/ar/blog', {waitUntil: 'networkidle2', timeout: 120000});
  const list = await p.evaluate(() => {
    const seen = new Map();
    document.querySelectorAll('a[href*="/a-"]').forEach(a => {
      const card = a.closest('article, .post-entry, [class*=blog], [class*=article], li, div');
      const href = a.href;
      if (seen.has(href)) return;
      const img = card && card.querySelector('img');
      seen.set(href, {url: href, title: (a.textContent || '').trim(), image: img ? (img.currentSrc || img.src || img.dataset.src) : '', text: card ? card.innerText.trim().slice(0, 400) : ''});
    });
    const cats = [...document.querySelectorAll('a[href*="/c-"]')].map(a => ({url: a.href, name: a.textContent.trim()}));
    return {articles: [...seen.values()], categories: cats};
  });
  const articles = [];
  for (const a of list.articles.slice(0, 12)) {
    try {
      await p.goto(a.url, {waitUntil: 'networkidle2', timeout: 90000});
      articles.push({...a, ...(await p.evaluate(() => {
        const main = document.querySelector('main') || document.body;
        const content = main.querySelector('.article-content, .article__content, [class*=article-content], .entry-content, .blog-content, article') || main;
        const h1 = main.querySelector('h1');
        const img = main.querySelector('article img, .article img, main img');
        const tags = [...main.querySelectorAll('a[href*="/tag-"]')].map(t => t.textContent.trim());
        const date = (main.innerText.match(/\d{1,2}\s+\S+\s+\d{4}|\d{4}-\d{2}-\d{2}/) || [''])[0];
        return {title: h1 ? h1.textContent.trim() : document.title, cover: img ? (img.currentSrc || img.src) : '', content: content.innerHTML, tags, date};
      }))});
    } catch (e) { articles.push({...a, error: String(e)}); }
  }
  fs.writeFileSync('moody-blog.json', JSON.stringify({categories: list.categories, articles}, null, 1));
  console.log('articles', articles.length, articles.map(a => a.title.slice(0, 40) + ' ' + (a.content || '').length).join(' | '));
  await b.close();
})();
