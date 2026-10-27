/*
 * Seasol Maritime - mobile behaviour for index-2.html
 *  1. wow.js is configured with mobile:false in script.js, so on phones/tablets the .wow elements never animate.
 *     This file replays the same entrance animations with IntersectionObserver (script.js is not modified).
 *  2. Extra staggered reveals for blocks that have no .wow class (circle cards, footer, team, destinations).
 *  3. Tap-to-open service cards (the cards reveal their details on hover, which touch screens do not have).
 *  4. Scrolls the CIS map to the India end so the route is visible first.
 */
(function () {
  'use strict';

  var mq = window.matchMedia('(max-width: 991.98px), (hover: none)');
  if (!mq.matches) { return; }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 1. replay wow.js animations ---------- */
  function initWow() {
    var els = $$('.wow').filter(function (el) { return !el.classList.contains('animated'); });
    if (!els.length) { return; }
    if (reduce || !('IntersectionObserver' in window)) { return; }
    els.forEach(function (el) {
      var d = parseInt(el.getAttribute('data-wow-delay'), 10);
      if (isFinite(d)) { el.style.animationDelay = Math.min(d, 180) + 'ms'; }
      el.style.visibility = 'hidden';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        var el = e.target;
        el.style.visibility = 'visible';
        el.classList.add('animated');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 2. extra staggered reveals ---------- */
  function initReveal() {
    var groups = [
      ['.work-section-two .work-block-two', 'zoom'],
      ['.team-section-two .team-block', ''],
      ['.seasol-footer .sf-cta', 'zoom'],
      ['.seasol-footer .sf-col', ''],
      ['.seasol-footer .sf-offices', ''],
      ['.valued-customers .sec-title', '']
    ];
    var items = [];
    groups.forEach(function (g) {
      $$(g[0]).forEach(function (el, i) {
        if (el.classList.contains('wow')) { return; }
        el.classList.add('sm-rev');
        if (g[1]) { el.setAttribute('data-sm', g[1]); }
        el.style.transitionDelay = Math.min((i % 4) * 90, 270) + 'ms';
        items.push(el);
      });
    });
    document.documentElement.classList.add('sm-js');
    if (reduce || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('sm-in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) { return; }
        e.target.classList.add('sm-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- 3. tap-to-open service cards ---------- */
  function initTapCards() {
    var boxes = $$('.services-section-two .services-block-two .inner-box');
    boxes.forEach(function (box) {
      box.addEventListener('click', function (e) {
        if (e.target.closest('a, button')) { return; }
        var open = box.classList.contains('sm-open');
        boxes.forEach(function (b) { b.classList.remove('sm-open'); });
        if (!open) { box.classList.add('sm-open'); }
      });
    });
    /* leaving a slide closes the card */
    var el = document.querySelector('.service-two-slider');
    if (el && el.swiper) {
      el.swiper.on('slideChange', function () { boxes.forEach(function (b) { b.classList.remove('sm-open'); }); });
    }
  }

  /* ---------- 4. CIS map starts at the India end ---------- */
  function initMap() {
    var w = document.querySelector('.cis-gateway-section .cis-map-wrapper');
    if (!w) { return; }
    var go = function () { w.scrollLeft = w.scrollWidth; };
    go();
    window.addEventListener('load', go);
  }

  function init() {
    initWow();
    initReveal();
    initTapCards();
    initMap();
  }
  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();

/* ---------- Team slider on phones: peek of the next card, swipe + auto-scroll through every member ---------- */
(function () {
  'use strict';
  var mq = window.matchMedia('(max-width: 767.98px)');
  var el = document.querySelector('.team-two-slider');
  if (!mq.matches || !el || !el.swiper) { return; }
  var sw = el.swiper, reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var n = sw.slides.length;

  sw.params.slidesPerView = 1.22;
  sw.params.spaceBetween = 14;
  sw.params.centeredSlides = false;
  sw.params.breakpoints = {};
  sw.params.speed = 800;
  sw.update();

  /* dots */
  var dots = document.createElement('div');
  dots.className = 'sm-team-dots';
  for (var i = 0; i < n; i++) {
    (function (i) {
      var b = document.createElement('button');
      b.type = 'button'; b.setAttribute('aria-label', 'Show team member ' + (i + 1));
      b.addEventListener('click', function () { sw.slideTo(i, 700); restart(); });
      dots.appendChild(b);
    })(i);
  }
  el.parentNode.appendChild(dots);
  var paint = function () {
    var a = Math.min(sw.activeIndex, n - 1);
    Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle('is-active', k === a); });
  };
  sw.on('slideChange', paint); paint();

  /* auto-scroll, loops back to the first member */
  var t = null, paused = false;
  function tick() {
    if (paused || document.hidden) { return; }
    if (sw.isEnd) { sw.slideTo(0, 900); } else { sw.slideNext(800); }
  }
  function restart() { clearInterval(t); if (!reduce) { t = setInterval(tick, 3800); } }
  el.addEventListener('touchstart', function () { paused = true; }, { passive: true });
  el.addEventListener('touchend', function () { setTimeout(function () { paused = false; restart(); }, 2500); }, { passive: true });
  restart();
})();
