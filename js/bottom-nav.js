/* Shared bottom navigation — one component, used by every customer screen. */
(function () {
  if (window.__eluruBottomNav) return;
  window.__eluruBottomNav = true;

  const ITEMS = [
    { href: "home.html",    key: "home",    label: "Home" },
    { href: "explore.html", key: "explore", label: "Explore" },
    { href: "tracking.html",key: "orders",  label: "Orders" },
    { href: "profile.html", key: "profile", label: "Profile" },
    { href: "cart.html",    key: "cart",    label: "Cart" },
  ];

  const ICONS = {
    home: '<path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/>',
    explore: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5 5-2Z"/>',
    orders: '<path d="M9 5h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H9"/><path d="M4 7h6v13H4z"/><path d="M7 12h6"/>',
    profile: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>',
    cart: '<circle cx="9" cy="21" r="1.4"/><circle cx="18" cy="21" r="1.4"/><path d="M2.5 3h2.5l2.5 12.5h10L20 7H6"/>',
  };

  function cartCount() {
    try {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      return cart.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    } catch {
      return 0;
    }
  }

  function markActive() {
    const path = window.location.pathname.split("/").pop() || "";
    document.querySelectorAll(".bottom-nav .nav-item").forEach((link) => {
      const href = link.getAttribute("href") || "";
      let active = false;
      if (href === "home.html") active = path === "home.html" || path === "" || path === "index.html";
      else if (href === "explore.html") active = path === "explore.html" || path === "restaurant.html" || path === "details.html";
      else if (href === "tracking.html") active = path === "tracking.html" || path === "checkout.html";
      else active = href === path;
      link.classList.toggle("active", active);
    });
  }

  function updateBadge() {
    const count = cartCount();
    document.querySelectorAll(".bottom-nav [data-cart-badge]").forEach((badge) => {
      badge.textContent = count > 0 ? String(count) : "";
      badge.style.display = count > 0 ? "block" : "none";
    });
  }

  function render() {
    const host = document.getElementById("bottom-nav");
    if (!host) return;
    const nav = document.createElement("nav");
    nav.className = "bottom-nav";
    nav.setAttribute("aria-label", "Main navigation");

    nav.innerHTML = ITEMS.map((item) => {
      const badge = item.key === "cart"
        ? '<span class="nav-icon-wrap"><svg class="icon" viewBox="0 0 24 24">' + ICONS[item.key] + '</svg><span id="cart-count" data-cart-badge></span></span>'
        : '<svg class="icon" viewBox="0 0 24 24">' + ICONS[item.key] + "</svg>";
      return '<a href="' + item.href + '" class="nav-item" data-nav="' + item.key + '">' + badge + "<span>" + item.label + "</span></a>";
    }).join("");

    host.innerHTML = "";
    host.appendChild(nav);
    markActive();
    updateBadge();
  }

  window.refreshCartBadge = updateBadge;
  render();

  // Keep the badge in sync when returning to the page from cache.
  window.addEventListener("pageshow", () => {
    render();
    window.dispatchEvent(new CustomEvent("eluru:cartchange"));
  });
  window.addEventListener("storage", (event) => {
    if (event.key === "cart") updateBadge();
  });
  document.addEventListener("cartchange", updateBadge);
})();