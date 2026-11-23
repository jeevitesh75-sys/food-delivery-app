/* Builds the sidebar + mobile top bar on every admin page. */
(function () {
  var I = {
    dash:  '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    orders:'<path d="M6 3h12l2 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z"/><path d="M4 7h16"/><path d="M9 11a3 3 0 0 0 6 0"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.7 2.7 2.3 3 4.7"/>',
    bike:  '<circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17l4-8h5l4 8M9.5 9L8 6H6"/>',
    store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9"/><path d="M5 12v8h14v-8"/>',
    menu:  '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 21V3c-2.5 1.5-3.5 4.5-3.5 8H17"/>',
    offer: '<path d="M3 11v2a1 1 0 0 0 1 1h3l8 5V5L7 10H4a1 1 0 0 0-1 1z"/><path d="M18.5 9a4 4 0 0 1 0 6"/>',
    money: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5v.01M17.5 14.5v.01"/>',
    cog:   '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    out:   '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>'
  };
  var NAV = [
    ['index.html', 'Dashboard', 'dash'], ['orders.html', 'Orders', 'orders'], ['customers.html', 'Customers', 'users'],
    ['deliveryboys.html', 'Delivery Boys', 'bike'], ['restaurants.html', 'Restaurants', 'store'], ['menu.html', 'Menu', 'menu'],
    ['offers.html', 'Offers', 'offer'], ['earnings.html', 'Earnings', 'money'], ['settings.html', 'Settings', 'cog']
  ];
  function svg(k) { return '<svg viewBox="0 0 24 24">' + I[k] + '</svg>'; }
  window.__adminIcon = svg;

  function build() {
    var page = (location.pathname.split('/').pop() || 'index.html');
    var title = document.title.replace(/\s*[-|–].*$/, '');
    var nav = NAV.map(function (n) {
      return '<a class="nav-link' + (n[0] === page ? ' active' : '') + '" href="' + n[0] + '">' + svg(n[2]) + '<span>' + n[1] + '</span></a>';
    }).join('');
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="overlay" id="overlay"></div>' +
      '<aside class="sidebar" id="sidebar"><div class="brand"><div class="brand-mark">E</div><div><div class="brand-name">Eluru Foods</div><div class="brand-sub">Admin panel</div></div></div>' +
      '<nav class="nav">' + nav + '<button class="nav-link logout" id="logoutBtn">' + svg('out') + '<span>Logout</span></button></nav></aside>' +
      '<header class="topbar"><button id="menuBtn" aria-label="Menu"><svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button><span class="topbar-title">' + title + '</span></header>';
    while (wrap.lastChild) document.body.insertBefore(wrap.lastChild, document.body.firstChild);
    var close = function () { document.body.classList.remove('nav-open'); };
    document.getElementById('menuBtn').onclick = function () { document.body.classList.toggle('nav-open'); };
    document.getElementById('overlay').onclick = close;
    document.getElementById('logoutBtn').onclick = function () { if (window.logout) window.logout(); else location.href = 'login.html'; };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
