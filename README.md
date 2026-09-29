# PC Palace Twilight theme

Salla Twilight storefront theme built from the PC Palace visual reference in
`../pcpalace-theme/`. The templates use Salla's data, web components, and
storefront SDK. The Zid HTML/JS capture is a design reference only.

## Implemented surfaces

| Surface | Twilight template |
| --- | --- |
| Shared shell, search, menu, login entry, cart/wishlist indicators | `src/views/layouts/master.twig`, `src/views/components/header/header.twig`, `src/views/components/footer/footer.twig` |
| Home and merchant-editable image banners/tiles/products | `src/views/pages/index.twig`, `src/views/components/home/`, `twilight.json` |
| Category, offers, search, filters, product cards | `src/views/pages/product/index.twig`, `src/assets/js/partials/product-card.js` |
| Product gallery, variants, availability, add to cart | `src/views/pages/product/single.twig` |
| Cart and native checkout handoff | `src/views/pages/cart.twig` |
| Customer profile, orders, wishlist, notifications, loyalty | `src/views/layouts/customer.twig`, `src/views/pages/customer/`, `src/views/pages/loyalty.twig` |
| Blog, information pages, order confirmation | `src/views/pages/blog/`, `src/views/pages/page-single.twig`, `src/views/pages/thank-you.twig` |

The product and cart behavior uses Salla's forms, options, quantity handling,
coupons, checkout submission, hooks, and account web components. The header
SVGs and Arabic Almarai font are copied from the saved reference, and the
footer uses the reference's dark blue layout. Set `palace_footer_logo` to a
light version of the store logo in the theme editor.

## Homepage component order for the PC Palace layout

The home page renders `{% component home %}`. In the Salla theme editor, add
and arrange the components in this order; product and category data comes from
the merchant's Salla catalog:

1. `home.enhanced-slider` — wide hero carousel.
2. `home.main-links` — category tiles, titled `تسوّق بالاقسام`.
3. A second `home.main-links` — four quick category links.
4. `home.enhanced-square-banners` — eight image tiles in two rows of four.
5. `home.fixed-products` — `العروض الإسبوعية`, with selected offer products.
6. `home.featured-products-style1` — tabbed `عروض ماتتفوت` products.
7. `home.fixed-banner` — wide campaign banner.
8. `home.fixed-products` — `الكمبيوتر المحمول | لابتوب`, linked to a laptop category.
9. `home.latest-products` — `وصل حديثا`.
10. `home.fixed-products` — `الأكثر طلباً`, sourced from top sellers.
11. `home.brands` or `home.square-photos` — the final brand/category highlight.

The editor allows merchants to replace images and selections without changing
Twig. The component order and actual merchant content have not yet been set in
the `moodyul` demo store, so the built theme is not a verified pixel match.

## Local build

Requires Node 22.18+ or 24.11+ and pnpm. From this directory:

```sh
pnpm install --frozen-lockfile
pnpm run production
```

The compiled assets are in `public/`. Do not copy the 51 MB Zid reference into
this theme; merchant imagery is configured in Salla. Arabic and English theme
strings are in `src/locales/`.

## Connect to Salla and preview

1. Connect a Salla Partners account to the private GitHub repository at
   `https://github.com/nadji40/pc-palace-twilight-theme`. The public support
   address is `support@skylightad.com` in `twilight.json`.
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
