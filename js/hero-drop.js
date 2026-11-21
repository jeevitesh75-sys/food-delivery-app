(function() {
  const wrap = document.createElement('div');
  wrap.id = 'hero-wrap';
  wrap.innerHTML = `<img id="hero-figure" src="/assets/hero-drop.png" alt="">`;
  document.body.appendChild(wrap);

  setTimeout(() => { wrap.remove(); }, 16000);
})();
