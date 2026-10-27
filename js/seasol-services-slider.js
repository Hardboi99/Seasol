/*
 * Seasol Maritime - auto-sliding "Our Services To Explore" carousel.
 * Drives the Swiper instance that script.js already created on .service-two-slider (script.js is not modified):
 *  - advances one group (2 cards on desktop, 1 on mobile) every few seconds and loops back to the start
 *  - pauses on hover / keyboard focus / hidden tab / off-screen, and has a visible pause button (WCAG 2.2.2)
 *  - starts paused when the visitor prefers reduced motion
 *  - staggered card entrance on every slide, pager dots with a progress fill, prev/next wrap around
 */
(function () {
  'use strict';

  var el = document.querySelector('.service-two-slider');
  if (!el || !el.swiper) { return; }
  var sw = el.swiper;

  var INTERVAL = 5500, SPEED = 1100, WRAP_MS = 520;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var controls = document.querySelector('.sst-controls');
  var prevBtn = document.getElementById('sst-prev');
  var nextBtn = document.getElementById('sst-next');

  var userPaused = reduce;      // explicit pause (button) or reduced-motion
  var hovering = false, focusIn = false, onScreen = true, wrapping = false;
  var timer = null, dots = [], pager = null;

  function perView() {
    var p = sw.params && sw.params.slidesPerView;
    return p === 'auto' ? 2 : (parseInt(p, 10) || 1);
  }
  function groups() { return Math.max(1, Math.ceil(sw.slides.length / perView())); }
  function current() { return Math.min(groups() - 1, Math.round((sw.activeIndex || 0) / perView())); }
  function goGroup(g, speed) { sw.slideTo(g * perView(), speed === undefined ? SPEED : speed); }

  /* ---------- staggered entrance for the visible group ---------- */
  function animateIn() {
    var pv = perView(), start = sw.activeIndex || 0, k = 0;
    Array.prototype.forEach.call(sw.slides, function (slide, i) {
      var card = slide.querySelector('.services-block-two');
      if (!card) { return; }
      card.classList.remove('sst-in');
      if (i >= start && i < start + pv) {
        card.style.setProperty('--sst-i', k++);
        void card.offsetWidth;
        card.classList.add('sst-in');
      }
    });
  }

  /* ---------- pager ---------- */
  function buildPager() {
    if (!pager) {
      pager = document.createElement('div');
      pager.className = 'sst-pager';
      pager.setAttribute('role', 'group');
      pager.setAttribute('aria-label', 'Choose services group');
      el.parentNode.appendChild(pager);
    }
    pager.innerHTML = '';
    dots = [];
    for (var g = 0; g < groups(); g++) {
      (function (g) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'sst-dot';
        d.setAttribute('aria-label', 'Show services group ' + (g + 1));
        d.innerHTML = '<i></i>';
        d.addEventListener('click', function () { goGroup(g); schedule(); });
        pager.appendChild(d);
        dots.push(d);
      })(g);
    }
    paintDots();
  }
  function paintDots() {
    var c = current();
    dots.forEach(function (d, i) {
      var on = i === c;
      if (on && !d.classList.contains('is-active')) {
        d.style.setProperty('--sst-interval', INTERVAL + 'ms');
        d.classList.add('is-active');
      } else if (!on) {
        d.classList.remove('is-active');
      }
      d.setAttribute('aria-current', on ? 'true' : 'false');
    });
    if (pager) { pager.classList.toggle('is-paused', !isRunning()); }
  }
  function restartFill() {
    var d = dots[current()];
    if (!d) { return; }
    d.classList.remove('is-active');
    void d.offsetWidth;
    d.classList.add('is-active');
  }

  /* ---------- autoplay engine ---------- */
  function isRunning() { return !userPaused && !hovering && !focusIn && onScreen && !document.hidden; }
  function clear() { if (timer) { clearTimeout(timer); timer = null; } }
  function schedule() {
    clear();
    paintDots();
    if (!isRunning() || wrapping) { return; }
    restartFill();
    timer = setTimeout(advance, INTERVAL);
  }
  function advance() {
    if (!isRunning()) { return; }
    var g = current() + 1;
    if (g >= groups()) { wrap(0); } else { goGroup(g); }
  }
  function wrap(targetGroup) {
    if (wrapping) { return; }
    wrapping = true;
    clear();
    el.classList.add('sst-wrap-out');
    setTimeout(function () {
      sw.slideTo(targetGroup * perView(), 0);
      el.classList.remove('sst-wrap-out');
      el.classList.add('sst-wrap-in');
      animateIn();
      setTimeout(function () { el.classList.remove('sst-wrap-in'); wrapping = false; schedule(); }, 950);
    }, WRAP_MS);
  }

  /* ---------- pause button ---------- */
  var pauseBtn = null;
  function buildPause() {
    if (!controls) { return; }
    pauseBtn = document.createElement('button');
    pauseBtn.type = 'button';
    pauseBtn.className = 'sst-btn-next sst-btn-pause';
    pauseBtn.innerHTML =
      '<svg class="ico-pause" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="M7 5v10M13 5v10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
      '<svg class="ico-play" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true" focusable="false"><path d="M7 5l8 5-8 5V5z" fill="currentColor"/></svg>';
    controls.insertBefore(pauseBtn, controls.firstChild);
    syncPause();
    pauseBtn.addEventListener('click', function () {
      userPaused = !userPaused;
      syncPause();
      schedule();
    });
  }
  function syncPause() {
    if (!pauseBtn) { return; }
    pauseBtn.classList.toggle('is-paused', userPaused);
    pauseBtn.setAttribute('aria-label', userPaused ? 'Start auto-scroll' : 'Pause auto-scroll');
  }

  /* ---------- prev / next wrap around ---------- */
  function keepEnabled(btn) {
    if (!btn) { return; }
    btn.disabled = false;
    new MutationObserver(function () { if (btn.disabled) { btn.disabled = false; } })
      .observe(btn, { attributes: true, attributeFilter: ['disabled'] });
  }
  keepEnabled(prevBtn);
  keepEnabled(nextBtn);
  if (controls) {
    controls.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button');
      if (!b) { return; }
      if (b === nextBtn && sw.isEnd) { e.preventDefault(); e.stopPropagation(); wrap(0); }
      else if (b === prevBtn && sw.isBeginning) { e.preventDefault(); e.stopPropagation(); wrap(groups() - 1); }
    }, true);
  }

  /* ---------- hooks ---------- */
  sw.on('slideChange', function () { if (!wrapping) { animateIn(); } paintDots(); schedule(); });
  sw.on('resize', function () { buildPager(); schedule(); });
  sw.on('breakpoint', function () { buildPager(); schedule(); });

  el.addEventListener('mouseenter', function () { hovering = true; schedule(); });
  el.addEventListener('mouseleave', function () { hovering = false; schedule(); });
  el.addEventListener('focusin', function () { focusIn = true; schedule(); });
  el.addEventListener('focusout', function () { focusIn = false; schedule(); });
  el.addEventListener('touchstart', function () { hovering = true; clear(); paintDots(); }, { passive: true });
  el.addEventListener('touchend', function () { setTimeout(function () { hovering = false; schedule(); }, 1500); }, { passive: true });
  document.addEventListener('visibilitychange', schedule);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      onScreen = entries[0].isIntersecting;
      schedule();
    }, { threshold: 0.25 }).observe(el);
  }

  /* ---------- init ---------- */
  sw.params.speed = reduce ? 0 : SPEED;
  buildPause();
  buildPager();
  animateIn();
  schedule();
})();
