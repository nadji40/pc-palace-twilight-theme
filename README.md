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

The product and cart behavior is inherited from the current Raed starter and
restyled. This keeps Salla's forms, options, quantity handling, coupons,
checkout submission, hooks, and account web components intact.

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
No Salla Partner credentials or demo store are available in this local workspace;
this checkout has not been published or tested against a live Salla store.

Salla references: [Twilight pages](https://docs.salla.dev/422556m0),
[CLI preview](https://docs.salla.dev/422776m0),
[public-theme requirements](https://docs.salla.dev/421886m0).
