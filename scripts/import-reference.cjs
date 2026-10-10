/*
 * Builds src/assets/styles/pcpalace-reference.css from the saved PC Palace reference
 * (../pcpalace-theme) and copies the static theme assets it needs (icons, payment logos,
 * fonts). Merchant content (logos, banners, products) is not copied: it comes from Salla.
 *
 * Run after the reference capture changes: node scripts/import-reference.cjs
 */
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const {scopeIntoRegions} = require('./palace-scope.cjs');

const root = path.resolve(__dirname, '..');
const ref = path.resolve(root, '../pcpalace-theme');
const images = path.join(root, 'src/assets/images');
const palaceImages = path.join(images, 'palace');
fs.mkdirSync(palaceImages, {recursive: true});

// Captured files carry a content hash suffix: name-0123456789.ext -> name.ext
const unhash = file => file.replace(/-[0-9a-f]{9}(\.[a-z0-9]+)$/i, '$1');
const copied = new Map();
// Not used by the theme (the footer shows Salla's trust badges), or replaced by a lighter file
// (tamara2.svg embeds a 250 KB bitmap; the theme ships tamara2.png). Keeps the theme zip under 2 MB.
const SKIP = new Set(['business_center.png', 'commercial_logo.svg', 'tamara2.svg']);
for (const dir of ['assets/icons', 'assets/fonts', 'assets/images']) {
  for (const file of fs.readdirSync(path.join(ref, dir))) {
    const clean = unhash(file);
    if (dir === 'assets/images' && /^[0-9a-f]{8}-[0-9a-f]{4}-/.test(clean)) continue; // merchant media
    if (/^(tsso|tsst|uicons|regular|medium)/.test(clean)) continue; // fonts handled below
    if (SKIP.has(clean)) continue;
    // Existing files are kept: the PNGs in the theme are palette-optimised copies (size limit).
    if (!fs.existsSync(path.join(palaceImages, clean))) fs.copyFileSync(path.join(ref, dir, file), path.join(palaceImages, clean));
    copied.set(clean, `./images/palace/${clean}`);
  }
}

// Almarai is loaded from Google Fonts by layouts/master.twig (a <link>), not bundled: public
// Salla themes must stay under 1 MB zipped.
const fontFiles = fs.readdirSync(path.join(ref, 'assets/fonts'));
const fonts = '/* Almarai: loaded from Google Fonts in layouts/master.twig */';
const icons = fontFiles.find(f => f.startsWith('uicons-regular-straight'));
fs.copyFileSync(path.join(ref, 'assets/fonts', icons), path.join(images, icons));

// Relative asset URLs in the Zid stylesheet.
const rewriteUrls = css => css.replace(/url\((['"]?)\.\/([^'")?#]+)([?#][^'")]*)?\1\)/g, (match, quote, file, suffix = '') => {
  if (file === 'uicons-regular-straight.woff2') return `url('./images/${icons}')`;
  const local = copied.get(file);
  return local ? `url('${local}${suffix.startsWith('#') ? suffix : ''}')` : match;
});

// Declarations that are about the document, not about a region root.
const DOCUMENT_ONLY = /^(overflow|overflow-x|overflow-y|max-width|position|min-height|height)$/;

// Inline <style> blocks repeat across captured pages; keep each rule once, in first-seen order.
const seenInline = new Set();
const context = node => { let c = ''; for (let p = node.parent; p && p.type !== 'root'; p = p.parent) c = (p.name || '') + (p.params || '') + '>' + c; return c; };

function scoped(file) {
  const ast = postcss.parse(rewriteUrls(fs.readFileSync(path.join(ref, file), 'utf8')), {from: undefined});
  if (file.startsWith('css/inline/')) {
    ast.walkRules(rule => {
      const key = context(rule) + rule.selector.replace(/\s+/g, ' ') + '{' + rule.nodes.map(n => n.toString().replace(/\s+/g, ' ')).join(';');
      if (seenInline.has(key)) rule.remove(); else seenInline.add(key);
    });
    ast.walkAtRules(at => { if (at.nodes && !at.nodes.length) at.remove(); });
  }
  ast.walkRules(rule => {
    if (!/(^|[\s,>+~])body\b/.test(rule.selector)) return;
    // `body { ... }` becomes the region root; drop document scrolling/sizing from it.
    if (rule.selectors.every(s => /^body$/i.test(s.trim()))) rule.walkDecls(d => { if (DOCUMENT_ONLY.test(d.prop)) d.remove(); });
  });
  // Tailwind arbitrary-content classes such as `.before\:content-\[\'\(\'\]` escape quotes in the
  // selector. They are valid CSS but unused here, and Salla's theme check reads the escaped quote
  // as an open string (then reports unbalanced braces), so they are left out.
  ast.walkRules(rule => { if (/\\['"]/.test(rule.selector)) rule.remove(); });
  scopeIntoRegions(ast);
  ast.walkRules(rule => { if (!rule.nodes.length) rule.remove(); });
  return `/* ${file} */\n` + ast.toString();
}

const sources = [
  'css/original/rtl-styles-3bb92c0c5.css', // Zid Nest theme: Bootstrap 5, Swiper, animate.css, template styles
  'css/original/shopping-cart.min-a63a17491.css', // cart page and mini cart
  'css/original/styles-225272ed0.css',     // store custom CSS
  'css/inline/home.css',                   // inline <style> blocks of the storefront pages
  'css/inline/category-laptops.css',       // + category listing (filters, sort, load more)
  'css/inline/products.css',               // + all-products listing
  'css/inline/product-detail.css',         // + product page
];
const out = [
  '/* Generated by scripts/import-reference.cjs from ../pcpalace-theme. Do not edit by hand. */',
  fonts,
  ...sources.map(scoped),
];
fs.writeFileSync(path.join(root, 'src/assets/styles/pcpalace-reference.css'), out.join('\n'));
console.log(`Imported reference CSS (${sources.length} sources) and ${copied.size} static assets.`);
