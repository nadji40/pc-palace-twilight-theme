/*
 * Local stand-in for the Salla storefront SDK (window.salla), used only by the local preview.
 * It answers like Salla's products API (source/source_value, sort, filters, cursor paging) from
 * fixture.json, serves the store menus and keeps the sample cart in memory. Checkout, wishlist
 * and login need a Salla store.
 */
(function () {
  const ready = fetch('/salla-pcpalace-theme/local-preview/fixture.json').then(r => r.json());

  function notice(text) {
    let box = document.querySelector('[data-preview-notice]');
    if (!box) {
      box = document.createElement('dialog');
      box.dataset.previewNotice = '';
      box.style.cssText = 'padding:28px;border:1px solid #ddd;border-radius:10px;max-width:420px;font:16px Almarai,sans-serif;line-height:1.8;text-align:center;direction:rtl';
      document.body.append(box);
    }
    box.replaceChildren(document.createTextNode(text));
    const close = document.createElement('button');
    close.textContent = 'إغلاق';
    close.style.cssText = 'display:block;margin:18px auto 0;color:#2b3990';
    close.onclick = () => box.close();
    box.append(close);
    box.showModal();
  }
  const local = what => notice(`معاينة محلية: ${what} يعمل على متجر سلة.`);

  const sorts = {
    topRated: (a, b) => (b.rating?.stars || 0) - (a.rating?.stars || 0),
    priceFromTopToLow: (a, b) => b.price - a.price,
    priceFromLowToTop: (a, b) => a.price - b.price,
  };

  // GET /products?source=…&source_value=…&sort=…&filters[…]&page=…
  async function products(params) {
    const d = await ready;
    const {source, source_value: value, sort, filters = {}, filterable} = params;
    const perPage = Number(params.per_page || params.limit || 20);
    const pageNo = Number(params.page || 1);
    const ids = Array.isArray(value) ? value : value == null ? [] : [value];
    const byId = id => d.products[id];
    let list, filterSet = null;
    if (source === 'selected') list = ids.map(byId);
    else if (source === 'brands') list = ids.flatMap(id => d.listings.products[id] || []).map(byId);
    else if (source === 'wishlist') list = d.listings.all.slice(0, 6).map(byId);
    else if (source === 'categories') {
      list = ids.flatMap(id => d.listings.products[id] || d.categoryProducts[id] || []).map(byId);
      filterSet = d.listings.filters[ids[0]];
    } else {
      list = d.listings.all.map(byId);
      if (source === 'offers') list = list.filter(p => p && p.is_on_sale);
      if (source === 'search') { const q = String(value || '').toLowerCase(); list = list.filter(p => p && p.name.toLowerCase().includes(q)); }
      filterSet = d.listings.filters.all;
    }
    list = list.filter(Boolean);
    // Attribute values are matched against product names; the price range against the price.
    for (const [key, chosen] of Object.entries(filters)) {
      if (key === 'price') list = list.filter(p => p.price >= Number(chosen.min || 0) && p.price <= Number(chosen.max || Infinity));
      else if (Array.isArray(chosen) && chosen.length) list = list.filter(p => chosen.some(v => p.name.toLowerCase().includes(String(v).toLowerCase())));
    }
    if (sorts[sort]) list = [...list].sort(sorts[sort]);
    const total = list.length;
    const data = list.slice((pageNo - 1) * perPage, pageNo * perPage);
    const next = pageNo * perPage < total ? 'preview-api:products?' + encodeURIComponent(JSON.stringify({...params, page: pageNo + 1})) : null;
    const response = {status: 200, success: true, data, cursor: {current: pageNo, previous: pageNo > 1 ? pageNo - 1 : null, next, count: data.length, total}};
    if (filterable) response.filters = filterSet || [{key: 'price', label: 'السعر', type: 'range', values: {min: 0, max: 1000}}];
    return response;
  }

  // <salla-installment>: on a Salla store it loads the store's Tamara/Tabby widgets. The preview
  // draws the two summaries the reference page shows (Tamara 24 months, Tabby 12 payments).
  customElements.define('salla-installment', class extends HTMLElement {
    connectedCallback() {
      const price = Number(this.getAttribute('price') || 0);
      const riyal = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1124.14 1256.39" width="11" height="12" style="display:inline-block;vertical-align:-0.1em"><path fill="currentColor" d="M699.62,1113.02h0c-20.06,44.48-33.32,92.75-38.4,143.37l424.51-90.24c20.06-44.47,33.31-92.75,38.4-143.37l-424.51,90.24Z"/><path fill="currentColor" d="M1085.73,895.8c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.33v-135.2l292.27-62.11c20.06-44.47,33.32-92.75,38.4-143.37l-330.68,70.27V66.13c-50.67,28.45-95.67,66.32-132.25,110.99v403.35l-132.25,28.11V0c-50.67,28.44-95.67,66.32-132.25,110.99v525.69l-295.91,62.88c-20.06,44.47-33.33,92.75-38.42,143.37l334.33-71.05v170.26l-358.3,76.14c-20.06,44.47-33.32,92.75-38.4,143.37l375.04-79.7c30.53-6.35,56.77-24.4,73.83-49.24l68.78-101.97v-.02c7.14-10.55,11.3-23.27,11.3-36.97v-149.98l132.25-28.11v270.4l424.53-90.28Z"/></svg>';
      const fmt = v => v.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      const box = 'border:1px solid #dcdcdc;border-radius:10px;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;gap:14px;font:14px/1.6 Almarai,sans-serif;color:inherit;text-align:right';
      this.innerHTML = `<div style="${box};margin-top:0"><div>بدءًا من <b>${fmt(price * 1.17 / 24)} ${riyal}</b><br>شهريًا حتى 24 شهر، بدون رسوم تأخير، متوافق مع الشريعة الإسلامية.<br><u>تعرف على خياراتك</u></div><img src="/salla-pcpalace-theme/public/images/palace/tamara2.png" alt="tamara" style="width:92px;flex:none"></div>`
        + `<div style="${box};margin-top:15px"><div>ابتداءً من <b>${fmt(price / 12)} ${riyal}/شهر</b> على ما يصل إلى 12 دفعة شهرية. متوافق مع أحكام الشريعة.<br><span style="color:#3167eb">لمعرفة المزيد</span></div><img src="/salla-pcpalace-theme/public/images/palace/tabby2.svg" alt="tabby" style="width:70px;flex:none"></div>`;
    }
  });

  // The cart page's sample cart (same items as scripts/preview-build.cjs), kept in memory so
  // quantity, remove and totals work on the page.
  let cartState = null;
  async function sampleCart() {
    if (cartState) return cartState;
    const d = await ready;
    const items = Object.values(d.products).filter(p => !p.is_out_of_stock).slice(0, 3)
      .map((p, i) => ({id: 800001 + i, product_id: p.id, product_name: p.name, product_image: p.image.url, url: p.url, price: p.price, quantity: i + 1, total: p.price * (i + 1)}));
    return (cartState = {items});
  }
  function cartResponse(cart) {
    cart.items.forEach(item => { item.total = item.price * item.quantity; });
    const total = cart.items.reduce((sum, item) => sum + item.total, 0);
    return {data: {cart: {...cart, sub_total: total, total, count: cart.items.reduce((n, item) => n + item.quantity, 0)}}};
  }

  // <salla-tel-input>: a plain phone field in the preview (Salla's has the country picker).
  customElements.define('salla-tel-input', class extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `<input type="tel" name="mobile" dir="ltr" value="${this.getAttribute('phone') || ''}" style="width:100%;height:45px;padding:0 20px;border:1px solid #ececec;border-radius:10px;font-size:16px;text-align:right;background:transparent;color:inherit">`;
    }
  });

  // <salla-product-card-embed>: a product the merchant embedded in an article or page. Salla draws
  // its own card; the preview draws a similar one from fixture.json.
  customElements.define('salla-product-card-embed', class extends HTMLElement {
    async connectedCallback() {
      const p = (await ready).products[this.getAttribute('product-id')];
      if (!p) return;
      const price = v => Number(v).toLocaleString('en-US') + ' ر.س';
      this.innerHTML = `<a href="${p.url}" style="display:flex;gap:18px;align-items:center;max-width:520px;margin:24px auto;padding:14px;border:1px solid var(--palace-embed-border,#ececec);border-radius:15px;text-decoration:none;color:#253d4e;background:var(--palace-embed-bg,#fff)">
        <img src="${p.image.url}" alt="" style="width:110px;height:110px;object-fit:contain;flex:none;border-radius:10px">
        <span style="display:block;text-align:start"><b style="display:block;font-size:15px;line-height:1.6">${p.name}</b>
        <span style="display:block;margin-top:6px;color:#2b3990;font-weight:700">${price(p.price)}${p.is_on_sale ? ` <del style="color:#adadad;font-weight:400;font-size:13px">${price(p.regular_price)}</del>` : ''}</span></span></a>`;
    }
  });

  // ------------------------------------------------------------------------------------------
  // Preview stand-ins for Salla web components. On a Salla store the real components load from
  // Salla; here they draw a simplified version so the pages can be seen.
  const listeners = {};
  const bus = {
    on: (name, cb) => { (listeners[name] ||= []).push(cb); },
    emit: (name, data) => { (listeners[name] || []).forEach(cb => cb(data)); },
  };
  const css = (el, text) => { el.style.cssText = text; return el; };
  const brand = 'var(--main-color, #2b3990)';
  const riyal = v => Number(v || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) + ' ر.س';
  const define = (name, cls) => { if (!customElements.get(name)) customElements.define(name, cls); };

  define('salla-quantity-input', class extends HTMLElement {
    connectedCallback() {
      if (this.querySelector('input')) return;
      const max = Number(this.getAttribute('max')) || 99;
      this.className += ' s-quantity-input';
      this.innerHTML = `<div style="display:flex;align-items:center;border:1px solid #d9d9d9;border-radius:10px;height:50px;overflow:hidden;background:#fff">
        <button type="button" data-up style="width:40px;height:100%;font-size:20px;color:${brand}">+</button>
        <input class="s-quantity-input-input" name="${this.getAttribute('name') || 'quantity'}" value="${this.getAttribute('value') || 1}" inputmode="numeric" style="width:44px;text-align:center;border:0;font-weight:700;color:${brand};background:transparent">
        <button type="button" data-down style="width:40px;height:100%;font-size:20px;color:${brand}">−</button></div>`;
      const input = this.querySelector('input');
      const set = v => { input.value = Math.max(1, Math.min(max, Number(v) || 1)); this.dispatchEvent(new Event('change', {bubbles: true})); };
      this.querySelector('[data-up]').onclick = () => set(Number(input.value) + 1);
      this.querySelector('[data-down]').onclick = () => set(Number(input.value) - 1);
      input.onchange = () => set(input.value);
    }
    async setValue(v) { const input = this.querySelector('input'); if (input) input.value = v; return this; }
  });

  define('salla-cart-summary', class extends HTMLElement {
    async connectedCallback() {
      const icon = this.querySelector('[slot=icon]');
      css(this, 'position:relative;display:inline-flex;align-items:center;cursor:pointer');
      const badge = css(document.createElement('span'), `position:absolute;top:-8px;inset-inline-end:-8px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:${brand};color:#fff;font-size:11px;line-height:18px;text-align:center`);
      this.append(badge);
      const draw = cart => { badge.textContent = cart.items.reduce((n, i) => n + i.quantity, 0); };
      draw(await sampleCart());
      bus.on('cart::updated', draw);
      this.onclick = () => { window.location.href = '/salla-pcpalace-theme/local-preview/store/cart/'; };
      if (icon) icon.style.display = 'inline-flex';
    }
  });

  define('salla-user-menu', class extends HTMLElement {
    connectedCallback() {
      const signedIn = /\/(profile|orders|wishlist|notifications)\//.test(location.pathname);
      this.innerHTML = `<button type="button" title="${signedIn ? 'حسابي' : 'تسجيل الدخول'}" style="width:38px;height:38px;border-radius:50%;background:#eef0f8;color:${brand};display:flex;align-items:center;justify-content:center"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></button>`;
      this.querySelector('button').onclick = () => (signedIn ? (location.href = '/salla-pcpalace-theme/local-preview/store/profile/') : local('تسجيل الدخول'));
    }
  });

  define('salla-filters', class extends HTMLElement {
    connectedCallback() {
      bus.on('filters::fetched', ({filters}) => this.draw(filters || []));
      this.addEventListener('change', () => this.apply());
    }
    draw(filters) {
      const chosen = this.read();
      this.innerHTML = filters.map(f => {
        if (f.key === 'price' || f.type === 'range') return `<div style="padding:14px 0;border-bottom:1px solid #eee"><b style="display:block;margin-bottom:10px">${f.label || 'السعر'}</b><div style="display:flex;gap:8px"><input data-min type="number" placeholder="${Math.floor(f.values?.min || 0)}" style="width:50%;height:38px;border:1px solid #ddd;border-radius:8px;padding:0 8px"><input data-max type="number" placeholder="${Math.ceil(f.values?.max || 1000)}" style="width:50%;height:38px;border:1px solid #ddd;border-radius:8px;padding:0 8px"></div></div>`;
        if (!Array.isArray(f.values) || !f.values.length) return '';
        return `<div style="padding:14px 0;border-bottom:1px solid #eee"><b style="display:block;margin-bottom:10px">${f.label}</b>${f.values.slice(0, 8).map(v => {
          const value = typeof v === 'object' ? (v.key ?? v.value) : v;
          const label = typeof v === 'object' ? v.value : v;
          return `<label style="display:flex;gap:8px;align-items:center;margin:6px 0;cursor:pointer"><input type="checkbox" data-key="${f.key}" value="${value}" ${(chosen[f.key] || []).includes(String(value)) ? 'checked' : ''}><span>${label}</span>${v.count != null ? `<small style="color:#999">(${v.count})</small>` : ''}</label>`;
        }).join('')}</div>`;
      }).join('');
    }
    read() {
      const data = {};
      this.querySelectorAll('input[type=checkbox]:checked').forEach(i => (data[i.dataset.key] ||= []).push(i.value));
      const min = this.querySelector('[data-min]')?.value, max = this.querySelector('[data-max]')?.value;
      if (min || max) data.price = {min: min || 0, max: max || 999999};
      return data;
    }
    apply() { bus.emit('salla-filters::changed', this.read()); }
  });

  define('salla-cart-coupons', class extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `<b style="display:block;margin-bottom:10px">كوبون الخصم</b><div style="display:flex;gap:8px"><input placeholder="أضف كوبون الخصم" style="flex:1;height:44px;border:1px solid #ddd;border-radius:10px;padding:0 12px;background:transparent;color:inherit"><button type="button" style="padding:0 18px;border-radius:10px;background:${brand};color:#fff">تفعيل</button></div>`;
      this.querySelector('button').onclick = () => local('كوبون الخصم');
    }
  });

  define('salla-cart-summary-card', class extends HTMLElement {
    async connectedCallback() {
      const draw = cart => {
        const total = cart.items.reduce((n, i) => n + i.price * i.quantity, 0);
        const row = (label, value, strong) => `<div style="display:flex;justify-content:space-between;margin:10px 0;${strong ? `font-size:18px;font-weight:700;color:${brand}` : ''}"><span>${label}</span><span>${riyal(value)}</span></div>`;
        this.innerHTML = `<div style="margin:18px 0">${row('مجموع المنتجات', total)}${row('الإجمالي', total, true)}</div><button type="button" style="width:100%;height:50px;border-radius:10px;background:${brand};color:#fff;font-weight:700">إتمام الطلب</button>`;
        this.querySelector('button').onclick = () => local('إتمام الطلب');
      };
      draw(await sampleCart());
      bus.on('cart::updated', draw);
    }
  });

  define('salla-orders', class extends HTMLElement {
    async connectedCallback() {
      const orders = (await ready).customer?.orders || [];
      this.innerHTML = `<table style="width:100%;border-collapse:collapse"><thead><tr>${['رقم الطلب', 'التاريخ', 'الحالة', 'الإجمالي', ''].map(h => `<th style="text-align:start;padding:12px;border-bottom:1px solid #eee">${h}</th>`).join('')}</tr></thead><tbody>${orders.map(o => `<tr><td style="padding:12px">#${o.reference_id}</td><td style="padding:12px">${o.created_at}</td><td style="padding:12px"><span style="color:${o.status.color};font-weight:700">${o.status.name}</span></td><td style="padding:12px">${riyal(o.total.amount)}</td><td style="padding:12px"><a href="${o.url}" style="color:${brand}">عرض</a></td></tr>`).join('')}</tbody></table>`;
    }
  });

  define('salla-notifications', class extends HTMLElement {
    async connectedCallback() {
      const orders = (await ready).customer?.orders || [];
      this.innerHTML = orders.map((o, i) => `<a href="${o.url}" style="display:block;padding:16px 4px;border-bottom:1px solid #eee;color:inherit"><b>${i ? 'تم تنفيذ طلبك' : 'تم شحن طلبك'} #${o.reference_id}</b><div style="color:#888;font-size:13px">${i ? 'منذ 12 يوم' : 'منذ ساعتين'}</div></a>`).join('');
    }
  });

  define('salla-order-totals-card', class extends HTMLElement {
    async connectedCallback() {
      const id = (location.pathname.match(/order\/(\d+)/) || [])[1];
      const order = ((await ready).customer?.orders || []).find(o => String(o.id) === id);
      if (!order) return;
      this.innerHTML = `<div style="border:1px solid #eee;border-radius:15px;padding:20px"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><span>مجموع المنتجات</span><span>${riyal(order.total.amount)}</span></div><div style="display:flex;justify-content:space-between;font-weight:700;font-size:18px;color:${brand}"><span>الإجمالي</span><span>${riyal(order.total.amount)}</span></div></div>`;
    }
  });

  define('salla-trust-badges', class extends HTMLElement {
    async connectedCallback() {
      const trust = (await ready).store.trust || {};
      const badge = (label, value) => value ? `<div style="display:flex;align-items:center;gap:8px;font-size:13px"><span style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center">✓</span><div><div style="opacity:.8">${label}</div><b>${value}</b></div></div>` : '';
      this.innerHTML = `<div style="display:flex;gap:24px;flex-wrap:wrap;color:${this.hasAttribute('dark') ? '#fff' : 'inherit'}">${badge('السجل التجاري', trust.commercial_number)}${badge('التجارة الإلكترونية', trust.ecommerce_number)}</div>`;
    }
  });

  const productApi = {fetch: products};
  window.salla = {
    onReady: () => ready.then(sampleCart).then(() => undefined),
    config: {get: key => (key === 'user.currency_code' ? 'SAR' : null), isGuest: () => true},
    lang: {get: key => key, onLoaded: cb => { cb && cb(); return Promise.resolve(); }},
    product: {...productApi, api: productApi, availabilitySubscribe: () => { local('إشعار التوفر'); return Promise.resolve(); }},
    api: {
      component: {getMenus: name => ready.then(d => ({data: d.menus[name] || []})), getReviews: () => Promise.resolve({data: []})},
      request: url => (String(url).startsWith('preview-api:products?') ? products(JSON.parse(decodeURIComponent(url.split('?')[1]))) : Promise.reject(new Error('preview'))),
    },
    cart: {
      details: async () => cartResponse(await sampleCart()),
      addItem: () => { local('الإضافة إلى السلة'); return Promise.resolve(); },
      updateItem: async ({id, quantity}) => { const cart = await sampleCart(); const item = cart.items.find(i => i.id === id); if (item) item.quantity = quantity; bus.emit('cart::updated', cart); return cartResponse(cart); },
      deleteItem: async id => { const cart = await sampleCart(); cart.items = cart.items.filter(i => i.id !== id); bus.emit('cart::updated', cart); return cartResponse(cart); },
      addCoupon: () => { local('كوبون الخصم'); return Promise.reject(new Error('preview')); },
      deleteCoupon: () => Promise.reject(new Error('preview')),
      submit: () => local('إتمام الطلب'),
      event: {onUpdated() {}},
    },
    comment: {
      getProductComments: () => Promise.resolve({data: []}),
      add: () => { local('إضافة سؤال'); return Promise.reject(new Error('preview')); },
    },
    notify: {error: text => notice(text)},
    form: {onSubmit: (action, event) => { event?.preventDefault(); local('حفظ البيانات'); return false; }},
    url: {get: name => (name === 'cart' ? '/salla-pcpalace-theme/local-preview/store/cart' : '/salla-pcpalace-theme/local-preview/store/')},
    wishlist: {toggle: () => { local('المفضلة'); return Promise.reject(new Error('preview')); }},
    event: {...bus, dispatch: name => local(name === 'login::open' ? 'تسجيل الدخول' : 'تغيير اللغة والدولة')},
    storage: {get: (key, fallback) => (key === 'cart.summary.count' && cartState ? cartState.items.reduce((n, item) => n + item.quantity, 0) : fallback)},
    auth: {logout: () => Promise.resolve()},
    order: {
      createCartFromOrder: () => { local('إعادة الطلب'); return Promise.reject(new Error('preview')); },
      cancel: () => { local('إلغاء الطلب'); return Promise.reject(new Error('preview')); },
    },
  };
})();
