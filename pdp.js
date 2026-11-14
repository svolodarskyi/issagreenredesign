/* Product detail page behaviour. Data comes from window.PDP (set in the page);
   when the Wix catalog is connected, build the same object from the API. */
(function () {
  var D = window.PDP; if (!D) return;
  var V = D.variants, multi = V.length > 1;
  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return '$' + n.toFixed(2); };
  var sel = null, qty = 1, MAX = (window.IssaCart && window.IssaCart.max) || 10;
  var allSold = V.every(function (v) { return v.soldout; });
  var main = $('pdp-main'), thumbs = $('pdp-thumbs');

  /* ----- gallery ----- */
  var imgs = []; V.forEach(function (v) { v.imgs.forEach(function (i) { if (imgs.indexOf(i) === -1) imgs.push(i); }); });
  function show(src) {
    if (!src) return; main.src = src;
    thumbs.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-current', b.dataset.src === src ? 'true' : 'false'); });
  }
  if (imgs.length > 1) {
    imgs.forEach(function (src, i) {
      var b = document.createElement('button'); b.type = 'button'; b.dataset.src = src; b.setAttribute('aria-label', 'Show image ' + (i + 1));
      b.innerHTML = '<img src="' + src + '" alt="">'; b.addEventListener('click', function () { show(src); }); thumbs.appendChild(b);
    });
    show(main.getAttribute('src'));
  } else thumbs.hidden = true;

  /* ----- price ----- */
  function priceHTML() {
    var v = sel;
    if (allSold) return '<span>Out of stock</span>';
    if (v) {
      return (v.was ? '<span class="was"><span>Regular price</span><s>' + money(v.was) + '</s></span>' : '') +
        '<span class="' + (v.was ? 'sale' : '') + '">' + money(v.price) + '</span><span class="cur">CAD</span>';
    }
    var ps = V.filter(function (x) { return !x.soldout; }).map(function (x) { return x.price; });
    var lo = Math.min.apply(null, ps), hi = Math.max.apply(null, ps);
    return '<span>' + (lo === hi ? money(lo) : money(lo) + ' – ' + money(hi)) + '</span><span class="cur">CAD</span>';
  }

  /* ----- options ----- */
  var opt = $('pdp-opt');
  function renderOpt() {
    if (!multi) return;
    var h = '<p class="opt-label" id="opt-l">' + D.optname + (sel ? ': <b>' + sel.label + '</b>' : '') + '</p><div class="pills" role="radiogroup" aria-labelledby="opt-l">';
    V.forEach(function (v, i) {
      h += '<button class="pill" type="button" role="radio" data-i="' + i + '" aria-checked="' + (sel === v) + '"' + (v.soldout ? ' disabled title="Out of stock"' : '') + '>' +
        v.label + (v.soldout ? '<small>Sold out</small>' : '') + '</button>';
    });
    opt.innerHTML = h + '</div>';
  }
  opt.addEventListener('click', function (e) {
    var b = e.target.closest('.pill'); if (!b || b.disabled) return;
    sel = V[+b.dataset.i]; hideMsg(); update();
    if (sel.imgs[0]) show(sel.imgs[0]);
  });

  /* ----- qty + add ----- */
  var add = $('pdp-add'), msg = $('pdp-msg'), qd = $('q-dec'), qi = $('q-inc'), qo = $('q-out');
  function hideMsg() { msg.hidden = true; }
  function showMsg(t, info) { msg.textContent = t; msg.className = 'pdp-msg' + (info ? ' info' : ''); msg.hidden = false; }
  function update() {
    $('pdp-price').innerHTML = priceHTML();
    renderOpt();
    qo.textContent = qty; qd.disabled = qty <= 1 || allSold; qi.disabled = qty >= MAX || allSold;
    if (qty >= MAX) showMsg('Maximum ' + MAX + ' per order.', true); else if (msg.classList.contains('info')) hideMsg();
    if (allSold) { add.disabled = true; add.textContent = 'Sold out'; }
    else if (!sel) { add.disabled = true; add.textContent = 'Choose a ' + (D.optname || 'option').toLowerCase(); }
    else { add.disabled = false; add.textContent = 'Add to cart — ' + money(sel.price * qty); }
  }
  qd.addEventListener('click', function () { if (qty > 1) { qty--; update(); } });
  qi.addEventListener('click', function () { if (qty < MAX) { qty++; update(); } });
  add.addEventListener('click', function () {
    if (add.disabled || add.classList.contains('is-loading')) return;
    var label = add.textContent, v = sel;
    add.classList.add('is-loading'); add.setAttribute('aria-busy', 'true'); add.textContent = 'Adding…';
    setTimeout(function () {
      add.classList.remove('is-loading'); add.removeAttribute('aria-busy'); add.classList.add('is-added'); add.textContent = 'Added ✓';
      if (window.IssaCart) window.IssaCart.add({ id: v.id, name: v.name, variant: v.variant || (multi ? v.label : ''), price: v.price, was: v.was || 0, img: v.img }, qty, add);
      else showMsg('The cart is unavailable right now. Please try again.');
      setTimeout(function () { add.classList.remove('is-added'); update(); }, 1400);
    }, 380);
  });

  /* ----- accordions (max-height) ----- */
  document.querySelectorAll('.acc-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var p = document.getElementById(b.getAttribute('aria-controls')), open = b.getAttribute('aria-expanded') === 'true';
      b.setAttribute('aria-expanded', !open); p.style.maxHeight = open ? '0' : p.scrollHeight + 'px';
    });
  });
  var first = document.querySelector('.acc-btn'); if (first && first.textContent.indexOf('Shipping') === -1) first.click();

  /* ----- initial selection: single variant, or ?v=<id> from a list page ----- */
  var want = new URLSearchParams(location.search).get('v');
  if (!multi) sel = V[0];
  else if (want) { var m = V.filter(function (v) { return v.id === want && !v.soldout; })[0]; if (m) sel = m; }
  if (sel && sel.imgs[0]) show(sel.imgs[0]);
  update();
})();
