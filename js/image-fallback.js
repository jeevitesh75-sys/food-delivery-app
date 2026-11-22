/* Shared image fallback: replaces broken item photos with a branded placeholder. */
(function () {
  if (window.__eluruImageFallback) return;
  window.__eluruImageFallback = true;

  var FALLBACK = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#249B55"/><stop offset="1" stop-color="#146B3A"/></linearGradient></defs>` +
    `<rect width="600" height="400" fill="url(#g)"/>` +
    `<circle cx="300" cy="188" r="92" fill="#ffffff" opacity="0.95"/>` +
    `<circle cx="300" cy="188" r="66" fill="none" stroke="#d8ecdf" stroke-width="8"/>` +
    `<path d="M255 138v100M243 138v40a12 12 0 0 0 24 0v-40M340 138c-19 12-28 31-28 52h28v48" fill="none" stroke="#249B55" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<text x="300" y="348" fill="#ffffff" font-family="Arial,sans-serif" font-size="28" font-weight="bold" text-anchor="middle">Eluru Foods</text>` +
    `</svg>`
  );

  document.addEventListener("error", function (event) {
    var el = event.target;
    if (el && el.tagName === "IMG" && el.src !== FALLBACK) el.src = FALLBACK;
  }, true);
})();
