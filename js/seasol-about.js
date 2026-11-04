/* Seasol Maritime - About page: world map moves with scroll (up when scrolling up, down when scrolling down) */
(function () {
  'use strict';
  var map = document.querySelector('.ab-map');
  if (!map || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) { return; }
  var ticking = false, SPEED = 0.22, MAX = 90;
  function update() {
    ticking = false;
    var host = map.parentNode.getBoundingClientRect();
    var offset = (host.top + host.height / 2) - window.innerHeight / 2; // + when below centre, - when above
    var y = Math.max(-MAX, Math.min(MAX, -offset * SPEED));
    map.style.translate = '0 ' + y.toFixed(1) + 'px';
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
})();
