/* Seasol Maritime - Core Values expanding panels (vanilla JS) */
(function () {
  'use strict';
  var root = document.querySelector('.cv');
  if (!root) { return; }
  var items = Array.prototype.slice.call(root.querySelectorAll('.cv-item'));
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var idx = 0, timer = null;

  function show(i) {
    idx = (i + items.length) % items.length;
    items.forEach(function (el, n) {
      el.classList.toggle('is-active', n === idx);
      el.setAttribute('aria-expanded', n === idx ? 'true' : 'false');
    });
  }
  function start() {
    if (reduce) { return; }
    stop();
    root.classList.remove('is-paused');
    timer = setInterval(function () { show(idx + 1); }, 3000);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }
  function pause() { stop(); root.classList.add('is-paused'); }

  items.forEach(function (el, n) {
    el.addEventListener('mouseenter', function () { pause(); show(n); });
    el.addEventListener('click', function () { pause(); show(n); });
    el.addEventListener('focus', function () { pause(); show(n); });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); pause(); show(n + 1); items[idx].focus(); }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); pause(); show(n - 1); items[idx].focus(); }
    });
  });
  var list = root.querySelector('.cv__list');
  list.addEventListener('mouseleave', start);
  list.addEventListener('focusout', function () { setTimeout(function () { if (!list.contains(document.activeElement)) { start(); } }, 0); });

  show(0);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { en[0].isIntersecting ? start() : stop(); }, { threshold: 0.3 }).observe(root);
  } else { start(); }
})();
