/*
 * Seasol Maritime - Customer Industries & Partners page
 *  - industry filter chips (animated show / hide)
 *  - partner orbit explorer (hover / tap a node, auto-cycles until the visitor interacts)
 *  - journey line that fills when scrolled into view
 */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- industry filter ---------- */
  (function () {
    var chips = $$('.cp-chip');
    var cards = $$('.cp-card');
    if (!chips.length) { return; }
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
        var n = 0;
        cards.forEach(function (card) {
          var show = f === 'all' || (card.getAttribute('data-ind') || '').split(' ').indexOf(f) !== -1;
          if (show) {
            card.hidden = false;
            card.classList.remove('is-out');
            card.style.animation = 'none';
            void card.offsetWidth;
            card.style.animation = '';
            card.style.animationDelay = reduce ? '0ms' : (n++ * 70) + 'ms';
          } else {
            card.hidden = true;
          }
        });
      });
    });
    /* cursor spotlight */
    if (!reduce) {
      cards.forEach(function (card) {
        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect();
          card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
          card.style.setProperty('--my', (e.clientY - r.top) + 'px');
        });
      });
    }
  })();

  /* ---------- partner explorer ---------- */
  (function () {
    var nodes = $$('.cp-node');
    var body = document.getElementById('cp-body');
    var no = document.getElementById('cp-no');
    var nav = document.getElementById('cp-nav');
    var wrap = document.getElementById('cp-explorer');
    if (!nodes.length || !body) { return; }
    var cur = -1, timer = null, touched = false;
    var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); };

    var bars = nodes.map(function (n, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'Show partner type ' + (i + 1));
      b.addEventListener('click', function () { touched = true; stop(); show(i); });
      nav.appendChild(b);
      return b;
    });

    function show(i) {
      if (i === cur) { return; }
      cur = i;
      var btn = nodes[i].querySelector('button');
      nodes.forEach(function (n, k) { n.classList.toggle('is-active', k === i); });
      bars.forEach(function (b, k) { b.classList.toggle('is-active', k === i); });
      no.textContent = 'Partner ' + (i + 1) + ' of ' + nodes.length;
      var items = (btn.getAttribute('data-list') || '').split('|').filter(Boolean);
      body.innerHTML = '<div class="cp-info__ico"><i class="fa-solid ' + esc(btn.getAttribute('data-icon')) + '"></i></div>' +
        '<h3>' + esc(btn.getAttribute('data-title')) + '</h3><p>' + esc(btn.getAttribute('data-text')) + '</p>' +
        '<ul>' + items.map(function (t) { return '<li><i class="fa-solid fa-check"></i>' + esc(t) + '</li>'; }).join('') + '</ul>';
      body.style.animation = 'none'; void body.offsetWidth; body.style.animation = '';
    }
    function start() { if (reduce || touched || timer) { return; } timer = setInterval(function () { show((cur + 1) % nodes.length); }, 5500); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }

    nodes.forEach(function (n, i) {
      var b = n.querySelector('button');
      b.addEventListener('mouseenter', function () { stop(); show(i); });
      b.addEventListener('focus', function () { stop(); show(i); });
      b.addEventListener('click', function () { touched = true; stop(); show(i); });
    });
    wrap.addEventListener('mouseleave', start);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { start(); } else { stop(); } }); }, { threshold: 0.3 }).observe(wrap);
    } else { start(); }
    show(0);
  })();

  /* ---------- journey line ---------- */
  (function () {
    var t = document.querySelector('.cp-track');
    if (!t) { return; }
    if (reduce || !('IntersectionObserver' in window)) { t.classList.add('is-in'); return; }
    new IntersectionObserver(function (es, io) { es.forEach(function (e) { if (e.isIntersecting) { t.classList.add('is-in'); io.disconnect(); } }); }, { threshold: 0.3 }).observe(t);
  })();
})();
