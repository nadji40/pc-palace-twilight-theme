/*
 * Keeps the PC Palace reference stylesheet and the Salla/Tailwind stylesheet apart.
 *
 * Elements inside a `.palace-ref` region are styled only by the reference CSS. Every
 * other element is styled only by app.css. The scope is added to the selector's subject
 * with :where(), so specificity and the reference's own cascade order are unchanged, and
 * ancestor parts such as `.rtl .header-top` keep matching body-level classes.
 */
const selectorParser = require(require.resolve('postcss-selector-parser', {paths: [require.resolve('tailwindcss')]}));

const REGION = '.palace-ref';
// A `.salla-island` inside a region hosts Salla web components: it is styled by app.css again.
// Product cards the merchant embeds in article or page content (salla-product-card-embed) are islands too.
const ISLANDS = ['.salla-island', 'salla-product-card-embed'].flatMap(s => [s, `${s} *`]).join(',');
const INSIDE = `:where(${REGION},${REGION} *):where(:not(${ISLANDS}))`;
const OUTSIDE = `:where(:not(${REGION},${REGION} *),${ISLANDS})`;
const PSEUDO_ELEMENTS = /^::?(before|after|first-line|first-letter|selection|placeholder|marker|backdrop|file-selector-button|cue|part|slotted|-webkit-|-moz-|-ms-)/i;

// The subject compound is everything after the last combinator.
function subjectNodes(selector) {
  const nodes = selector.nodes;
  let start = 0;
  nodes.forEach((node, i) => { if (node.type === 'combinator') start = i + 1; });
  return nodes.slice(start);
}

function isRootSubject(subject) {
  return subject.some(n => (n.type === 'tag' && n.value.toLowerCase() === 'html') || (n.type === 'pseudo' && n.value === ':root'));
}

function insertScope(selector, scope) {
  const subject = subjectNodes(selector);
  const pseudoElement = subject.find(n => n.type === 'pseudo' && PSEUDO_ELEMENTS.test(n.value));
  const node = selectorParser.pseudo({value: scope});
  if (pseudoElement) selector.insertBefore(pseudoElement, node);
  else selector.insertAfter(subject[subject.length - 1], node);
}

// Classes the theme puts on <body> (see layouts/master.twig). Rules whose subject is one of
// these style the page itself, e.g. `.main--dark { background }` for dark mode.
const BODY_STATE = new Set(['main-body', 'main--light', 'main--dark', 'enable-darkmode', 'mobile-menu-active', 'home-page', 'category-page', 'products-page', 'product-page', 'inner-page', 'rtl', 'ltr']);
const isBodyState = subject => subject.some(n => n.type === 'class' && BODY_STATE.has(n.value))
  && subject.every(n => n.type !== 'tag' || n.value.toLowerCase() === 'body');

// Reference CSS: apply only inside regions. `body` rules style the region root instead.
const intoRegions = selectorParser(selectors => {
  selectors.each(selector => {
    const subject = subjectNodes(selector);
    if (!subject.length || isRootSubject(subject) || isBodyState(subject)) return;
    const body = subject.find(n => n.type === 'tag' && n.value.toLowerCase() === 'body');
    if (body) { body.replaceWith(selectorParser.className({value: REGION.slice(1)})); return; }
    insertScope(selector, INSIDE);
  });
});

// Salla CSS: never apply inside regions.
const outOfRegions = selectorParser(selectors => {
  selectors.each(selector => {
    const subject = subjectNodes(selector);
    if (!subject.length || isRootSubject(subject)) return;
    if (subject.some(n => n.type === 'tag' && n.value.toLowerCase() === 'body')) return;
    insertScope(selector, OUTSIDE);
  });
});

function inKeyframes(rule) {
  for (let p = rule.parent; p; p = p.parent) if (p.type === 'atrule' && /keyframes$/i.test(p.name)) return true;
  return false;
}

function transformRoot(root, processor) {
  root.walkRules(rule => {
    if (inKeyframes(rule)) return;
    try { rule.selector = processor.processSync(rule.selector); }
    catch (error) { /* leave selectors the parser cannot read untouched */ }
  });
  return root;
}

const excludeRegionsPlugin = () => ({
  postcssPlugin: 'palace-exclude-regions',
  OnceExit(root) { transformRoot(root, outOfRegions); },
});
excludeRegionsPlugin.postcss = true;

module.exports = {REGION, scopeIntoRegions: root => transformRoot(root, intoRegions), excludeRegionsPlugin};
