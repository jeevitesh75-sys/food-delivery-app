/* Shared light/dark theme. The switcher lives only in the account (profile) section. */
(function () {
  if (window.__eluruTheme) return;
  window.__eluruTheme = true;

  var KEY = "appTheme";
  var CHOSEN = "appThemeChosen";

  function read() {
    try { return localStorage.getItem(KEY) === "dark" ? "dark" : "light"; } catch { return "light"; }
  }

  function chosen() {
    try { return localStorage.getItem(CHOSEN) === "1"; } catch { return false; }
  }

  function initialTheme() {
    return chosen() ? read() : "light";
  }

  function syncSelect(dark) {
    document.querySelectorAll("[data-theme-select]").forEach(function (select) {
      select.value = dark ? "dark" : "light";
    });
  }

  function apply(theme) {
    var dark = theme === "dark";
    var root = document.documentElement;
    root.classList.toggle("dark", dark);
    root.classList.toggle("light", !dark);
    root.setAttribute("data-theme", dark ? "dark" : "light");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#111814" : "#249B55");
    syncSelect(dark);
    try { if (window.AccountMenu && window.AccountMenu.setTheme) window.AccountMenu.setTheme(theme); } catch {}
  }

  function set(theme) {
    var value = theme === "dark" ? "dark" : "light";
    try {
      localStorage.setItem(KEY, value);
      localStorage.setItem(CHOSEN, "1");
    } catch {}
    apply(value);
  }

  function init() {
    document.querySelectorAll("[data-theme-select]").forEach(function (select) {
      if (select.dataset.themeWired) return;
      select.dataset.themeWired = "1";
      select.addEventListener("change", function () { set(select.value); });
    });
    apply(initialTheme());
  }

  window.setAppTheme = set;
  window.getAppTheme = initialTheme;

  apply(initialTheme());
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  window.addEventListener("storage", function (event) {
    if (event.key === KEY || event.key === CHOSEN) apply(initialTheme());
  });
})();
