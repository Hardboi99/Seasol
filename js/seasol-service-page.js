/*
 * Seasol Maritime - service page behaviour (vanilla JS, no dependencies)
 * Scroll reveals, count-up, Exports/Imports tabs, FAQ accordion, hero parallax,
 * cursor spotlight on cards and the scroll progress bar. Respects prefers-reduced-motion.
 */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    var items = $$('.sp-reveal');
    if (!items.length) { return; }
    items.forEach(function (el) {
      var d = el.getAttribute('data-delay');
      if (d) { el.style.transitionDelay = d + 'ms'; }
    });
    if (reduce || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  /* ---------- count-up ---------- */
  function initCounters() {
    var nums = $$('[data-count]');
    if (!nums.length) { return; }
    var run = function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var comma = el.hasAttribute('data-comma');
      var fmt = function (n) { return (comma ? n.toLocaleString('en-US') : n) + suffix; };
      if (reduce) { el.textContent = fmt(target); return; }
      var dur = 1800, start = null;
      var step = function (ts) {
        if (start === null) { start = ts; }
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(Math.round(target * eased));
        if (p < 1) { requestAnimationFrame(step); }
      };
      requestAnimationFrame(step);
    };
    if (!('IntersectionObserver' in window)) {
      nums.forEach(function (el) { el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { run(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    nums.forEach(function (el) { io.observe(el); });
  }

  /* ---------- tabs (Ocean Exports / Ocean Imports) ---------- */
  function initTabs() {
    var tabs = $$('.sp-tab');
    var panels = $$('.sp-panel');
    if (!tabs.length) { return; }
    var show = function (id, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-tab') === id;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on && focus) { t.focus(); }
      });
      panels.forEach(function (p) {
        var on = p.id === 'panel-' + id;
        p.classList.toggle('is-active', on);
        p.hidden = !on;
      });
      if (history.replaceState) { history.replaceState(null, '', '#' + id); }
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t.getAttribute('data-tab')); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { n = tabs[(i + 1) % tabs.length]; }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { n = tabs[(i - 1 + tabs.length) % tabs.length]; }
        if (n) { e.preventDefault(); show(n.getAttribute('data-tab'), true); }
      });
    });
    var hash = (location.hash || '').replace('#', '');
    if (hash === 'ocean-exports' || hash === 'ocean-imports') {
      show(hash);
      var flow = document.getElementById('flow');
      if (flow) { setTimeout(function () { flow.scrollIntoView(); }, 60); }
    }
  }

  /* ---------- FAQ accordion ---------- */
  function initFaq() {
    var items = $$('.sp-qa');
    items.forEach(function (item) {
      var btn = item.querySelector('.sp-qa__q');
      if (!btn) { return; }
      btn.addEventListener('click', function () {
        var open = !item.classList.contains('is-open');
        items.forEach(function (o) {
          o.classList.remove('is-open');
          var b = o.querySelector('.sp-qa__q');
          if (b) { b.setAttribute('aria-expanded', 'false'); }
        });
        if (open) {
          item.classList.add('is-open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* ---------- hero parallax + progress bar ---------- */
  function initScroll() {
    var bg = document.querySelector('.sp-hero__bg');
    var bar = document.querySelector('.sp-progress span');
    var ticking = false;
    var update = function () {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      if (bar) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(y / h, 1) : 0) + ')';
      }
      if (bg && !reduce && y < 900) { bg.style.translate = '0 ' + (y * 0.22) + 'px'; }
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }


  /* ---------- glide: image card slides down smoothly while the left column scrolls ---------- */
  function initGlide() {
    var visuals = $$('.sp-visual');
    if (!visuals.length || reduce) { return; }
    var mq = window.matchMedia('(min-width: 992px)');
    var TOP = 120;                       /* clears the sticky header */
    var state = visuals.map(function (v) { return { v: v, cur: 0 }; });
    var running = false;

    function target(s) {
      var panel = s.v.closest('.sp-panel');
      if (!panel || !panel.classList.contains('is-active')) { return null; }
      var rect = panel.getBoundingClientRect();
      var max = Math.max(0, panel.offsetHeight - s.v.offsetHeight);
      var want = Math.min(Math.max(TOP - rect.top, 0), max);
      return { want: want, progress: max ? want / max : 0 };
    }

    function frame() {
      var moving = false;
      state.forEach(function (s) {
        if (!mq.matches) { s.v.style.transform = ''; return; }
        var t = target(s);
        if (!t) { return; }
        var diff = t.want - s.cur;
        if (Math.abs(diff) > 0.15) { s.cur += diff * 0.1; moving = true; } else { s.cur = t.want; }
        s.v.style.transform = 'translate3d(0,' + s.cur.toFixed(2) + 'px,0)';
        s.v.style.setProperty('--sp-opy', (30 + t.progress * 40).toFixed(1) + '%');
      });
      if (moving) { requestAnimationFrame(frame); } else { running = false; }
    }
    function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }

    document.documentElement.classList.add('sp-glide');
    window.addEventListener('scroll', kick, { passive: true });
    window.addEventListener('resize', kick);
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.sp-tab')) { state.forEach(function (s) { s.cur = 0; }); setTimeout(kick, 60); } });
    kick();
  }

  /* ---------- cursor spotlight on cards ---------- */
  function initSpotlight() {
    if (reduce) { return; }
    $$('.sp-card').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- marquee: duplicate chips so the loop is seamless ---------- */
  function initMarquee() {
    var track = document.querySelector('.sp-marquee__track');
    if (!track || track.getAttribute('data-cloned')) { return; }
    Array.prototype.slice.call(track.children).forEach(function (c) {
      var clone = c.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
    track.setAttribute('data-cloned', '1');
  }

  function init() {
    initReveal();
    initCounters();
    initTabs();
    initFaq();
    initScroll();
    initSpotlight();
    initMarquee();
    initGlide();
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
