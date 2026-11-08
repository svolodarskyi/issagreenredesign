(function () {
  var items = [
    ['About', '/about'], ['Farmers', '/farmers'],
    ['Shop', [['Tea', '/tea-selection'], ['Tea Ware', '#'], ['Pottery', '#']]],
    ['Location', '/location'], ['Events', '#']
  ];
  var header = document.querySelector('header');
  var actions = header && header.querySelector('.header-actions');
  if (!actions) return;

  var path = location.pathname.replace(/\/$/, '').replace(/\.html$/, '');
  var menu = document.createElement('nav');
  menu.className = 'mobile-menu';
  menu.id = 'mobile-menu';
  menu.setAttribute('aria-label', 'Main menu');
  function link(i) {
    return '<a href="' + i[1] + '"' + (i[1] === path ? ' aria-current="page"' : '') + '>' + i[0] + '</a>';
  }
  menu.innerHTML = items.map(function (i) {
    if (typeof i[1] === 'string') return link(i);
    var open = i[1].some(function (c) { return c[1] === path; });
    return '<div class="mm-group' + (open ? ' open' : '') + '">' +
      '<button type="button" class="mm-parent" aria-expanded="' + open + '">' + i[0] + '</button>' +
      '<div class="mm-sub">' + i[1].map(link).join('') + '</div></div>';
  }).join('');
  menu.addEventListener('click', function (e) {
    var p = e.target.closest('.mm-parent');
    if (!p) return;
    var g = p.parentNode, o = !g.classList.contains('open');
    g.classList.toggle('open', o);
    p.setAttribute('aria-expanded', o);
  });

  // Desktop dropdown (hover/focus handled in CSS; click toggles for touch)
  document.querySelectorAll('.nav-parent').forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var g = b.parentNode, o = !g.classList.contains('open');
      g.classList.toggle('open', o);
      b.setAttribute('aria-expanded', o);
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.nav-group.open').forEach(function (g) {
      g.classList.remove('open');
      g.querySelector('.nav-parent').setAttribute('aria-expanded', 'false');
    });
  });

  var btn = document.createElement('button');
  btn.className = 'menu-toggle';
  btn.setAttribute('aria-label', 'Menu');
  btn.setAttribute('aria-controls', 'mobile-menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span></span>';

  function set(open) {
    btn.setAttribute('aria-expanded', open);
    menu.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  }
  btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 768) set(false); });

  actions.appendChild(btn);
  header.appendChild(menu);
})();
