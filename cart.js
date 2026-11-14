/* Issa Green cart — front-end cart + drawer.
   Storage is localStorage for now. To connect Wix later, replace the
   `store` object below (load/save) and set window.ISSA_CHECKOUT_URL or
   implement `startCheckout()`. Shipping and tax are never calculated here. */
(function () {
  var KEY = 'issa-cart-v1';
  var MAX_QTY = 10; // per-line cap until inventory comes from the catalog
  var SOLD_OUT = ['gyokuro-loose-tea-30g', 'oolong-loose-tea-32g', 'kazuho-whisk', '100-prongs-black-white'];

  var mem = [];
  var store = {
    load: function () {
      try { var v = JSON.parse(localStorage.getItem(KEY)); return Array.isArray(v) ? v : []; } catch (e) { return mem; }
    },
    save: function (lines) {
      mem = lines;
      try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) {}
    }
  };

  var lines = store.load();
  var demo = new URLSearchParams(location.search).get('cart-demo'); // summary-error | checkout-error
  var pending = false;
  var lastFocus = null;

  function money(n) { return '$' + (Math.round(n * 100) / 100).toFixed(2); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function count() { return lines.reduce(function (n, l) { return n + l.qty; }, 0); }
  function available(l) { return SOLD_OUT.indexOf(l.id) === -1; }

  /* ---------- header badge ---------- */
  var toggles = [];
  function findToggles() {
    document.querySelectorAll('.header-actions button[aria-label^="Cart"], .header-actions a[href="/cart"]').forEach(function (el) {
      if (toggles.indexOf(el) === -1) { toggles.push(el); el.setAttribute('aria-haspopup', 'dialog'); el.addEventListener('click', function (e) { e.preventDefault(); open(el); }); }
    });
  }
  function renderBadge() {
    var n = count(), label = n > 99 ? '99+' : String(n);
    toggles.forEach(function (el) {
      var span = el.querySelector('span');
      if (span) { span.classList.add('cart-count'); span.textContent = label; span.hidden = n === 0; }
      el.setAttribute('aria-label', 'Cart (' + n + (n === 1 ? ' item)' : ' items)'));
    });
  }

  /* ---------- drawer DOM ---------- */
  var overlay = document.createElement('div'); overlay.className = 'cart-overlay';
  var drawer = document.createElement('aside');
  drawer.className = 'cart-drawer'; drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); drawer.setAttribute('aria-labelledby', 'cart-title');
  drawer.innerHTML =
    '<div class="cart-head"><h2 id="cart-title">Your cart <small data-cart-n></small></h2>' +
    '<button class="cart-close" type="button" aria-label="Close cart"><svg viewBox="0 0 24 24"><line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg></button></div>' +
    '<div class="cart-body" data-cart-body></div><div class="cart-foot" data-cart-foot></div>' +
    '<div class="cart-sr" role="status" aria-live="polite" data-cart-live></div>';

  function live(msg) { var el = drawer.querySelector('[data-cart-live]'); el.textContent = ''; setTimeout(function () { el.textContent = msg; }, 30); }

  function lineHTML(l) {
    var un = !available(l), atMax = l.qty >= MAX_QTY;
    var unit = l.was ? '<s>' + money(l.was) + '</s><span class="cart-sr">Regular price. Now </span>' + money(l.price) : money(l.price);
    var msg = un ? '<p class="cl-msg error" role="alert">This item is no longer available. Please remove it to continue.</p>'
      : (atMax ? '<p class="cl-msg">Maximum ' + MAX_QTY + ' per order.</p>' : '') + (l.error ? '<p class="cl-msg error" role="alert">' + esc(l.error) + '</p>' : '');
    var img = l.img ? '<img src="' + esc(l.img) + '" alt="">' : '';
    return '<li class="cart-line' + (un ? ' unavailable' : '') + '" data-id="' + esc(l.id) + '">' +
      '<div class="cl-img">' + img + '</div><div class="cl-main">' +
      '<div class="cl-top"><div><p class="cl-name">' + esc(l.name) + '</p>' + (l.variant ? '<p class="cl-opts">' + esc(l.variant) + '</p>' : '') +
      '<p class="cl-unit">' + unit + '</p></div>' +
      '<button class="cl-remove" type="button" data-remove aria-label="Remove ' + esc(l.name + (l.variant ? ', ' + l.variant : '')) + '">Remove</button></div>' +
      (un ? '' : '<div class="cl-bottom"><div class="qty" role="group" aria-label="Quantity">' +
        '<button type="button" data-dec aria-label="Decrease quantity"' + (l.qty <= 1 ? ' disabled' : '') + '>−</button><output aria-live="polite">' + l.qty + '</output>' +
        '<button type="button" data-inc aria-label="Increase quantity"' + (atMax ? ' disabled' : '') + '>+</button></div>' +
        '<span class="cl-total">' + money(l.price * l.qty) + '</span></div>') + msg + '</div></li>';
  }

  function totals() {
    var sub = 0, was = 0;
    lines.forEach(function (l) { if (available(l)) { sub += l.price * l.qty; was += (l.was || l.price) * l.qty; } });
    return { sub: sub, discount: 0 };
  }

  var checkoutState = 'idle'; // idle | redirecting | failed
  function render() {
    var body = drawer.querySelector('[data-cart-body]'), foot = drawer.querySelector('[data-cart-foot]');
    var n = count();
    drawer.querySelector('[data-cart-n]').textContent = n ? '(' + n + (n === 1 ? ' item)' : ' items)') : '';
    if (!lines.length) {
      body.innerHTML = '<div class="cart-empty"><h3>Your cart is empty</h3><p>Find something to sip — tea straight from Japanese farmers, and tea ware to prepare it.</p>' +
        '<a class="cart-btn" href="/shop-tea">Shop tea</a><a class="cart-btn secondary" href="/tea-ware">Shop tea ware</a></div>';
      foot.hidden = true; renderBadge(); return;
    }
    foot.hidden = false;
    body.innerHTML = '<ul class="cart-lines">' + lines.map(lineHTML).join('') + '</ul>';
    var t = totals(), blocked = lines.some(function (l) { return !available(l); });
    var summary;
    if (demo === 'summary-error') {
      summary = '<p class="cart-summary-error" role="alert">We couldn\'t update your order summary just now. Your items are saved — you can still continue to checkout.</p>';
    } else {
      summary = (t.discount > 0 ? '<div class="cart-row discount"><span>Discount</span><strong>−' + money(t.discount) + '</strong></div>' : '') +
        '<div class="cart-row subtotal"><span>Subtotal</span><strong>' + money(t.sub - t.discount) + ' CAD</strong></div>';
    }
    var btnLabel = checkoutState === 'redirecting' ? 'Redirecting to checkout…' : 'Continue to secure checkout';
    foot.innerHTML = summary + '<p class="cart-note">Shipping and taxes calculated at checkout.</p>' +
      '<button class="cart-btn" type="button" data-checkout' + ((pending || blocked || checkoutState === 'redirecting') ? ' disabled' : '') + (checkoutState === 'redirecting' ? ' aria-busy="true"' : '') + '>' + btnLabel + '</button>' +
      '<button class="cart-btn secondary" type="button" data-continue>Continue shopping</button>' +
      (checkoutState === 'failed' ? '<p class="cart-checkout-err" role="alert">We couldn\'t open checkout. Your cart is saved. <button type="button" data-checkout>Try again</button></p>' : '');
    renderBadge();
  }

  /* ---------- mutations (async-shaped so a real API can slot in) ---------- */
  function mutate(fn, id) {
    pending = true;
    var el = id && drawer.querySelector('.cart-line[data-id="' + id + '"]');
    if (el) el.classList.add('updating');
    drawer.querySelectorAll('[data-checkout]').forEach(function (b) { b.disabled = true; });
    setTimeout(function () { fn(); pending = false; store.save(lines); render(); }, 220);
  }
  function find(id) { return lines.filter(function (l) { return l.id === id; })[0]; }

  function addItem(d, n) {
    n = n || 1;
    var ex = find(d.id);
    if (ex) { ex.qty = Math.min(MAX_QTY, ex.qty + n); delete ex.error; }
    else lines.push({ id: d.id, name: d.name, variant: d.variant, price: d.price, was: d.was, img: d.img, qty: Math.min(MAX_QTY, n) });
    store.save(lines); render();
  }

  /* ---------- open / close ---------- */
  function open(from) {
    lastFocus = from || document.activeElement;
    checkoutState = 'idle'; render();
    overlay.classList.add('open'); drawer.classList.add('open'); document.body.classList.add('cart-open');
    setTimeout(function () { drawer.querySelector('.cart-close').focus(); }, 50);
  }
  function close() {
    overlay.classList.remove('open'); drawer.classList.remove('open'); document.body.classList.remove('cart-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  window.IssaCart = { add: function (d, n, from) { addItem(d, n); open(from); }, max: MAX_QTY, open: open, close: close, count: count, clear: function () { lines = []; store.save(lines); render(); } };

  function startCheckout() {
    checkoutState = 'redirecting'; render();
    setTimeout(function () {
      var url = window.ISSA_CHECKOUT_URL;
      if (url && demo !== 'checkout-error') { location.href = url; return; }
      checkoutState = 'failed'; render();
    }, 900);
  }

  drawer.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('.cart-close') || t.closest('[data-continue]')) return close();
    if (t.closest('[data-checkout]')) return startCheckout();
    var li = t.closest('.cart-line'); if (!li) return;
    var l = find(li.getAttribute('data-id')); if (!l) return;
    if (t.closest('[data-remove]')) return mutate(function () { lines = lines.filter(function (x) { return x !== l; }); live(l.name + ' removed'); }, l.id);
    if (t.closest('[data-inc]') && l.qty < MAX_QTY) return mutate(function () { l.qty++; live('Quantity ' + l.qty); }, l.id);
    if (t.closest('[data-dec]') && l.qty > 1) return mutate(function () { l.qty--; live('Quantity ' + l.qty); }, l.id);
  });
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (!drawer.classList.contains('open')) return;
    if (e.key === 'Escape') return close();
    if (e.key === 'Tab') { // keep focus inside the drawer
      var f = drawer.querySelectorAll('button:not(:disabled), a[href]'); if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  window.addEventListener('storage', function (e) { if (e.key === KEY) { lines = store.load(); render(); } });

  /* ---------- add-to-cart buttons on product cards ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.add-btn'); if (!btn || btn.disabled || btn.classList.contains('is-loading')) return;
    var card = btn.closest('.product-card'); if (!card || !card.dataset.id || !card.dataset.price) return;
    var label = btn.textContent;
    btn.classList.add('is-loading'); btn.setAttribute('aria-busy', 'true'); btn.textContent = 'Adding…';
    setTimeout(function () {
      btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy');
      btn.classList.add('is-added'); btn.textContent = 'Added ✓';
      addItem({ id: card.dataset.id, name: card.dataset.name, variant: card.dataset.variant, price: parseFloat(card.dataset.price), was: card.dataset.was ? parseFloat(card.dataset.was) : 0, img: card.dataset.img });
      open(btn);
      setTimeout(function () { btn.classList.remove('is-added'); btn.textContent = label; }, 1400);
    }, 380);
  });

  document.body.appendChild(overlay); document.body.appendChild(drawer);
  findToggles(); render();
  if (new URLSearchParams(location.search).get('cart') === 'open') open();
})();
