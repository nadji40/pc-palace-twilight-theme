# Moodyul Twilight theme

Salla Twilight storefront theme for [Moodyul](https://moodyul.com/) (مودي يول). Its core is the
PC Palace design (layout, components, animations and the blue `#2b3990` palette) reproduced from the
visual reference in `../pcpalace-theme/`; the theme is branded Moodyul in `twilight.json`, the theme
editor and `package.json`. The templates use Salla's data, web components, and storefront SDK. The
Zid HTML/JS capture is a design reference only.

## How the PC Palace design is reproduced

The storefront reuses the reference's own markup and stylesheet instead of approximating them:

- `scripts/import-reference.cjs` builds `src/assets/styles/pcpalace-reference.css` from the saved
  Zid stylesheets (Bootstrap 5, Swiper, animate.css and the Nest template, plus the store's custom
  and inline CSS) and copies the static icons, payment logos and fonts into `src/assets/images/palace/`.
- `scripts/palace-scope.cjs` keeps the two stylesheets apart. Elements inside a `.palace-ref` region
  (header, footer, every PC Palace home section) are styled only by the reference CSS; everything
  else (Salla components, account/cart/product pages) only by `app.css`. The scope is added with
  `:where()`, so specificity and cascade order are unchanged.
- The Twig templates output the same DOM as the reference: `components/header/header.twig`,
  `components/footer/footer.twig` and `components/home/palace-*.twig`.
- `src/assets/js/palace-reference.js` rebuilds the reference behaviour on Salla's SDK: Swiper
  carousels with the same settings, product cards rendered from `salla.product.fetch`, WOW.js
  entrance animations, lazy images, the announcement ticker, sticky header, countdowns, cart
  drawer, search suggestions, category dropdown, mobile drawer, dark mode and scroll-to-top.

## Homepage sections (theme editor)

| Component | Reference section |
| --- | --- |
| `home.palace-hero` | Full-width hero slider |
| `home.palace-categories` | Category carousel (`تسوّق بالاقسام`) and the quick-links row |
| `home.palace-banners` | Rows of four promo banners |
| `home.palace-offers` | Weekly offers carousel with countdown |
| `home.palace-tabs` | `عروض ماتتفوت` category tabs |
| `home.palace-products` | Laptops, new arrivals and best-seller carousels |
| `home.palace-columns` | Four product columns above the footer |
| `home.palace-brands` | Brand tiles (`تصفح من خلال العلامات التجارية`), in the category-card style |
| `home.palace-video` | YouTube video with a poster and play button (loads the player on click) |
| `home.palace-testimonials` | Customer reviews carousel |
| `home.palace-features` | Store features row (Nest `banner-left-icon` blocks) |

The last four were added for Moodyul's own homepage sections (brands, installation video, reviews,
store features) and use the same reference markup and animations as the rest of the page.

Salla's built-in product components (`fixed-products`, `products-slider`, `latest-products`)
render the same carousel; `fixed-products` and `products-slider` read their products from Salla's
`source` / `source-value` attributes. Header/footer content comes from the store (logo, header and
footer menus, social links, VAT number, and the commercial registration / freelance document and
e-commerce certificate through `salla-trust-badges`, always shown when the store has them) and the
`palace_*` theme settings (announcement messages, dark logo, footer logo and colour, working hours,
app links). The footer's two link columns are the top-level items of the footer menu.

## Pages

All pages share the reference header, footer and breadcrumb banner:

| Template | Page |
| --- | --- |
| `pages/index.twig` | Homepage (merchant-configured sections) |
| `pages/product/index.twig` | Category, offers, search and all-products listing: sub-category row, sort, filters, load more |
| `pages/product/single.twig` | Product page: gallery, options with prices, installments, tabs, questions, related products |
| `pages/brands/index.twig`, `pages/brands/single.twig` | Brands grid and a brand's products (full width when there are no filters) |
| `pages/blog/index.twig`, `pages/blog/single.twig` | Blog grid and article (merchant HTML, embedded product cards, comments, related articles) |
| `pages/page-single.twig` | Content pages (about, policies) |
| `pages/cart.twig` | Cart in the reference layout: item rows, quantity, remove, free-shipping progress, coupon, totals, checkout |
| `pages/customer/*` (`layouts/customer.twig`) | Account: profile, orders, order details (reorder, cancel, rate), wishlist, notifications, wallet |

The pages use Salla's Twilight components where Salla expects them, inside the PC Palace layout:

| Where | Components |
| --- | --- |
| Header | `salla-cart-summary`, `salla-user-menu` |
| Footer | `salla-trust-badges` |
| Listing | `salla-filters` (the PC Palace grid sends it each fetch's filters and reloads on `salla-filters::changed`) |
| Product page | `salla-quantity-input`, `salla-installment`, `salla-metadata`, `salla-gifting`, `salla-quick-order`, `salla-comments` |
| Cart | `salla-cart-item-offers`, `salla-cart-coupons`, `salla-cart-summary-card`, `salla-tiered-offer`, `salla-gifting`, `salla-loyalty-panel`, `salla-conditional-offer` |
| Orders | `salla-orders`, `salla-edit-order-button`, `salla-order-details`, `salla-review-order-item`, `salla-order-totals-card`, `salla-rating-modal` |
| Account | `salla-notifications`, `salla-wallet`, `salla-tel-input`, `salla-user-settings` |

Hooks include `product.single.before_customer_reviews`, `product.index.after_testimonials` and
`information_page.information_page` (pages built with Salla's page builder). Each component sits in a
`.salla-island`, which gives it back Salla's own styling inside a PC Palace region.

Theme zip limit: a private theme must stay under 2 MB zipped, so the preview data
(`local-preview/data/`, `local-preview/fixture.json`) is not committed.

## Dark mode

The header toggle switches `main--light` / `main--dark` on the body and remembers the choice. The
reference's own dark rules cover the page body and product cards; `src/assets/styles/palace-extras.css`
completes them for the header, search, menus, banners, category and brand tiles, filters, sort,
forms, cart, account pages, blog cards, product tabs and options, and merchant HTML (which often
carries inline black text). Brand-coloured text uses a light tint of the store colour on dark.

## Local build

Requires Node 22.18+ or 24.11+ and pnpm. From this directory:

```sh
pnpm install --frozen-lockfile
pnpm run production
```

The compiled assets are in `public/`. Do not copy the Zid merchant media into
this theme; merchant imagery is configured in Salla. Arabic and English theme
strings are in `src/locales/`. After the reference capture changes, run
`node scripts/import-reference.cjs`. The preview data comes from `node scripts/build-moodyul-fixture.cjs`.
See `local-preview/README.md` for the local preview.

## Connect to Salla and preview

1. Connect a Salla Partners account to the private GitHub repository at
   `https://github.com/nadji40/pc-palace-twilight-theme`. The public support
   email is `support@skylightad.com` (`author_email`) and the support website is https://skylightchat.com/ (`support_url`), both in `twilight.json` (set from the Partners Portal support details).
2. Import this repository as a theme in Partners Portal, or use the Salla CLI
   theme flow. Use `salla login`, then `salla theme preview --store=<demo-store>`.
3. In the demo store set the main color to PC Palace blue (`#2d398f`), upload a
   store logo, hero banners, category pictures, and products. The banner,
   quick-link, promo-tile, and product sections are configured through the
   Salla theme editor. Defaults inherited from Raed are placeholders until
   replaced with licensed demo media.
4. Check Arabic RTL and English LTR at desktop and mobile widths. Test cart,
   coupons, native checkout, OTP login, profile updates, orders, wishlist, and
   the thank-you page with a test purchase. Lighthouse and merchant editor
   tests must run against the Salla demo store before marketplace submission.

The checkout/payment UI and login modal internals are Salla controlled. The
customer account screenshots in the reference are unauthenticated handoffs,
so authenticated account visual fidelity needs verification on the demo store.
The Salla CLI has been signed in and the requested demo store name is
`moodyul`. The repository has not yet been imported into the Partners theme
list, so the Twig output has not been previewed or tested on that store.

Salla references: [Twilight pages](https://docs.salla.dev/422556m0),
[CLI preview](https://docs.salla.dev/422776m0),
[public-theme requirements](https://docs.salla.dev/421886m0).
