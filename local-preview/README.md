# Local preview of the Twig theme

The preview renders the theme's real templates with Twig.js, using the built `public/app.css`,
`public/palace-reference.css` and `public/palace-reference.js`. There is no separate preview markup
or stylesheet. It shows the Moodyul store (logo, menus, categories, products, homepage sections,
blog and brands from the public https://moodyul.com/ storefront) in the PC Palace design.

```sh
pnpm production                          # after CSS/JS changes
node scripts/build-moodyul-fixture.cjs   # after the Moodyul data dump changes
pnpm preview:build                       # after Twig changes (also builds fixture.json if missing)
```

Serve the parent folder (`D:\downloads\pcpalace`) with
`python -m http.server 4173 --bind 127.0.0.1` and open
http://127.0.0.1:4173/salla-pcpalace-theme/local-preview/store/ (the homepage is also written to
`local-preview/index.html` and http://127.0.0.1:4173/local-preview/). The PC Palace reference is
at http://127.0.0.1:4173/pcpalace-theme/index.html.

## Pages

The preview behaves as a Salla store whose URL is `/salla-pcpalace-theme/local-preview/store/`, with
Salla's routes. 184 pages are rendered:

| Route | Template |
| --- | --- |
| `store/` | `pages/index.twig` with the 12 homepage sections |
| `store/{slug}/c{id}/` (13), `offers/`, `latest-products/`, `products/`, `search/?q=` | `pages/product/index.twig` |
| `store/p{id}-{slug}/` (143) | `pages/product/single.twig` |
| `store/brands/`, `store/{brand}/brand-{id}/` (7) | `pages/brands/index.twig`, `pages/brands/single.twig` |
| `store/blog/`, `store/blog/{slug}/a-{id}/` (6) | `pages/blog/index.twig`, `pages/blog/single.twig` |
| `store/about/page-500001/` | `pages/page-single.twig` |
| `store/cart/` | `pages/cart.twig` with a sample cart of three products |
| `store/profile/`, `orders/`, `orders/order/{id}/`, `wishlist/`, `notifications/` | `pages/customer/*` as a signed-in sample customer |

The sample cart and customer (name, two orders, notifications) exist only in the preview so the
cart and account pages can be seen; they are not Moodyul data. Dark mode: use the moon toggle in
the top bar (remembered in `localStorage`).

## Files

| File | Purpose |
| --- | --- |
| `data/moodyul/*.json` | Raw dump of the public moodyul.com storefront (`scripts/moodyul-dump-*.cjs`, puppeteer): store, menus, categories, products, homepage sections, blog and pages. |
| `fixture.json` | Built from the dump by `scripts/build-moodyul-fixture.cjs` in Salla's data model: homepage component settings, menus, theme settings, categories, products, brands, articles, pages and the sample customer. |
| `sdk-fixture.js` | Local stand-in for `window.salla`: `product.api.fetch` (categories, brands, offers, search, wishlist sources, Salla sort ids, `filters[...]`, cursor paging), menus, the sample cart (quantity and remove update totals), and preview versions of `<salla-installment>`, `<salla-tel-input>` and `<salla-product-card-embed>`. Checkout, coupons, wishlist, login, reorder and cancel show a notice; they need a Salla store. |
| `store/` | Generated pages (rebuilt by `pnpm preview:build`). |
| `render-report.json` | Which templates, styles and data produced the pages. |

Salla's shared strings (`pages.*`, `common.*`) come from Salla at runtime; the preview carries the
Arabic ones the theme uses. Merchant media keeps its original `cdn.salla.sa` URLs, so the preview
needs internet access for images. `scripts/build-preview-fixture.cjs` still builds the original PC
Palace data from the Zid capture, for comparing the homepage with the reference pixel by pixel.
