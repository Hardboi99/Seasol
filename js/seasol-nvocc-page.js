/*
 * Seasol Maritime - NVOCC & ISO Tanks page: interactive ISO tank explorer.
 * Hotspots on the tank illustration drive the info card; it auto-cycles until the visitor interacts.
 */
(function () {
  'use strict';

  var stage = document.getElementById('nv-stage');
  if (!stage) { return; }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dots = Array.prototype.slice.call(stage.querySelectorAll('.nv-dot'));
  var info = document.getElementById('nv-info');
  var body = document.getElementById('nv-info-body');
  var navBox = document.getElementById('nv-info-nav');
  var counter = document.getElementById('nv-info-no');
  var current = -1, timer = null, userTouched = false;

  // pager bars
  var bars = dots.map(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Show part ' + (i + 1));
    b.addEventListener('click', function () { userTouched = true; stop(); show(i); });
    navBox.appendChild(b);
    return b;
  });

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function show(i) {
    if (i === current) { return; }
    current = i;
    var d = dots[i];
    dots.forEach(function (x, k) { x.classList.toggle('is-active', k === i); x.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    bars.forEach(function (x, k) { x.classList.toggle('is-active', k === i); });
    counter.textContent = 'Part ' + (i + 1) + ' of ' + dots.length;
    body.innerHTML = '<div class="nv-info__ico"><i class="fa-solid ' + esc(d.getAttribute('data-icon')) + '"></i></div>' +
      '<h3>' + esc(d.getAttribute('data-title')) + '</h3><p>' + esc(d.getAttribute('data-text')) + '</p>';
    body.style.animation = 'none';
    void body.offsetWidth;
    body.style.animation = '';
  }

  function start() {
    if (reduce || userTouched || timer) { return; }
    timer = setInterval(function () { show((current + 1) % dots.length); }, 5000);
  }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  dots.forEach(function (d, i) {
    d.addEventListener('click', function () { userTouched = true; stop(); show(i); });
    d.addEventListener('mouseenter', function () { stop(); show(i); });
    d.addEventListener('focus', function () { stop(); show(i); });
  });
  stage.addEventListener('mouseleave', start);
  info.addEventListener('mouseenter', stop);
  info.addEventListener('mouseleave', start);

  // only cycle while the section is on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { start(); } else { stop(); } });
    }, { threshold: 0.35 }).observe(stage);
  } else { start(); }

  show(0);
})();
